# Curation Engine

Goal: every event on the Discover feed should be there because it's
*good* — well-reviewed, prestigious, or notable — and every card should
carry a short editorial summary plus (where relevant) an LGBTQ+-friendly
flag. Two problems, two tools:

| Problem | Tool | Why |
|---|---|---|
| "What events exist, when, and how much do they cost?" | **Event API** (Ticketmaster Discovery API primary; SeatGeek Partner API as a secondary/fallback source) | These are the systems of record for schedules, pricing, and ticket links — reinventing that is wasted effort and will always be stale. |
| "Is this any good, and should it carry a queer-friendly flag?" | **LLM** (Anthropic Claude, via the Messages API) | Quality and cultural-relevance judgment isn't structured data anywhere; an LLM reading the event description plus whatever press context is available can produce a defensible score and a genuinely useful one-line summary, which neither API provides. |

## Pipeline

```
┌──────────────────┐      nightly cron       ┌─────────────────────┐
│  Ticketmaster /   │ ───────────────────────▶│  curate-events        │
│  SeatGeek API     │   pulls events for       │  (edge function)      │
└──────────────────┘   each active venue,      └──────────┬───────────┘
                        12mo lookahead                     │ upsert raw event
                                                            ▼
                                                   ┌─────────────────────┐
                                                   │  events table         │
                                                   │  (ai_summary IS NULL) │
                                                   └──────────┬───────────┘
                                                            │ per new event
                                                            ▼
                                                   ┌─────────────────────┐
                                                   │ generate-event-       │
                                                   │ summary (edge fn)     │
                                                   │ → Anthropic Claude    │
                                                   └──────────┬───────────┘
                                                            │ updates row
                                                            ▼
                                                   events.ai_summary,
                                                   quality_score,
                                                   is_lgbtq_friendly,
                                                   lgbtq_tags
                                                            │
                                                            ▼
                                                   ┌─────────────────────┐
                                                   │  smart-alerts          │
                                                   │  (edge function)       │
                                                   │  matches against       │
                                                   │  alert_subscriptions   │
                                                   │  → Expo push            │
                                                   └─────────────────────┘
```

All three stages are separate edge functions (`supabase/functions/*`) so
each can be re-run, re-deployed, or replaced independently — e.g. swapping
in SeatGeek as a second ingest source only touches `curate-events`.

## 1. Event ingestion — `curate-events`

- Iterates every `venues` row with `source = 'ticketmaster'` and a stored
  `external_id` (the Ticketmaster venue ID — looked up once per venue when
  it's added to the directory).
- Calls `GET /discovery/v2/events.json?venueId=...&endDateTime=<now+12mo>`.
- Upserts into `events` on `(source, external_id)`, so re-running the sync
  is idempotent — already-known events just get their price/date refreshed.
- Only events where `ai_summary IS NULL` get sent to the curation step, so
  a nightly re-sync doesn't re-spend LLM calls on events already curated.

**Adding SeatGeek as a second source**: add a `fetchSeatGeekEventsForVenue`
function following the same shape, tag those rows `source = 'seatgeek'`,
and gate on `venues.source in ('ticketmaster', 'seatgeek')`. Because
`events` is keyed on `(source, external_id)`, the same real-world event
returned by both APIs currently creates two rows; deduplicating by
`(venue_id, title, start_at)` similarity is a reasonable v2 addition once
both sources are live (flag for manual merge rather than silently dropping
one, since prices/URLs can differ).

## 2. Curation — `generate-event-summary`

For each new event, sends title + description + venue name (and, in a
fuller build, snippets from a web-search tool call for press coverage) to
Claude with a system prompt that requires **strict JSON** output:

```json
{
  "ai_summary": "One to two sentences, editorial tone, no hype.",
  "quality_score": 91,
  "press_reviews": [{ "source": "...", "quote": "...", "sentiment": "positive" }],
  "is_lgbtq_friendly": true,
  "lgbtq_tags": ["queer-composer", "pride-programming"],
  "curation_notes": "Why this score — for internal review, not shown to users."
}
```

Design choices worth calling out:

- **Structured output, not free text.** The prompt demands JSON and the
  function `JSON.parse`s the response directly — no regex scraping. If this
  becomes unreliable at scale, swap to Claude's native tool-use /
  structured-output mode for a guaranteed schema.
- **Conservative scoring.** The prompt explicitly says to reserve 90+ for
  genuinely acclaimed work, so the "Critics' Pick" badge (quality_score ≥
  85, see `EventCard.tsx`) stays meaningful rather than badge-inflating
  every event.
- **LGBTQ+ tagging is content-based, not a manual venue-level flag.** A
  single mainstream venue can host both a queer-themed opera and an
  unrelated matinee; tagging per-event (queer subject matter, drag,
  openly-queer creative leads, explicit pride programming) is more honest
  than flagging an entire venue.
- **No fabricated quotes.** The prompt requires `press_reviews: []` when no
  real source was found — this matters because these quotes render
  verbatim on the event detail screen (`app/event/[id].tsx`), attributed to
  a named outlet.
- **Cost control.** Curation only runs once per event (gated on
  `ai_summary IS NULL`), and only for venues/events that passed the
  Event-API ingest — the LLM never free-ranges over "all culture
  everywhere," only over what's already confirmed to be scheduled.

**Wiring in real press coverage**: the cleanest upgrade is to give Claude a
web-search tool call (Anthropic's server-side web search tool, or a
Google/Bing Custom Search call made by the edge function before invoking
Claude) so `pressSnippets` in `curateEvent()` is populated with real
excerpts instead of relying on the model's own training-data knowledge of
a show's reception.

## 3. Smart Alerts — `smart-alerts`

Every row in `alert_subscriptions` (`user_id, city_id, min_quality_score,
lgbtq_only, category`) is matched against events whose `updated_at` falls
in the trailing sync window (i.e. just curated) and whose
`quality_score`/`is_lgbtq_friendly`/`category` clear the subscription's
bar. `notification_log` prevents double-notifying the same user for the
same event across runs. Delivery is the Expo Push API, which fans a single
call out to APNs/FCM for you — no separate Apple/Google push credential
plumbing needed in the app itself beyond what `expo-notifications` already
requests.

## Scheduling

Both `curate-events` and `smart-alerts` are triggered the same way — via
`pg_cron` + `pg_net` calling the deployed function URL with the service
role key as a bearer token. Run once per Supabase project:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'curate-events-nightly', '0 6 * * *',
  $$ select net.http_post(
       url := 'https://<project-ref>.functions.supabase.co/curate-events',
       headers := jsonb_build_object('Authorization', 'Bearer <service-role-key>')
     ) $$
);

select cron.schedule(
  'smart-alerts-nightly', '15 6 * * *',  -- 15 min after curate-events
  $$ select net.http_post(
       url := 'https://<project-ref>.functions.supabase.co/smart-alerts',
       headers := jsonb_build_object('Authorization', 'Bearer <service-role-key>')
     ) $$
);
```

## Adding a venue to the auto-sync

1. Look up the venue's Ticketmaster venue ID (Discovery API `/venues.json?keyword=...`).
2. Insert/update the row: `source = 'ticketmaster'`, `external_id = '<id>'`.
3. Next `curate-events` run picks it up automatically — no code change.

Manually-curated venues (no ticketing-API presence — e.g. a small gallery)
stay `source = 'manual'` and their events are entered directly via the
Supabase dashboard/SQL, or a future admin screen; they're simply excluded
from the automated sync loop.
