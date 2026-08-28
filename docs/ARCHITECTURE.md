# Architecture

## Naming shortlist

Five names evoking access to culture, inspiration, beauty, and talent:

1. **Atelier** — a working artist's studio; connotes access to creative process, not just the finished show. (Used as the working name throughout this codebase — rename freely, it's a `slug`/`bundleIdentifier` find-and-replace.)
2. **Foyer** — the elegant threshold every great venue shares: the room you pass through on the way to something transporting.
3. **Aria** — a solo voice raised above the orchestra; warm, musical, easy to say in any language.
4. **Vernissage** — the private preview before a gallery opening; signals insider access and taste.
5. **Nocturne** — an evening's cultural life, and a musical form in its own right (Chopin, Debussy) — romantic without being precious.

## Why Expo + Supabase

- **Expo Router** gives one file-based routing tree that compiles to iOS,
  iPadOS (adaptive layout via `supportsTablet`), and static Web output —
  the three targets requested — from a single `app/` directory.
- **Supabase** was chosen over Firebase because the domain is inherently
  relational: a venue belongs to a city, an event belongs to a venue, a
  ticket optionally references an event, a trip has a date range that
  events get filtered against. Postgres joins and range queries
  (`start_at between ...`) map directly onto the feature list; Firestore
  would need denormalization or client-side joins for the same result.
  Row Level Security also means "a user only sees/edits their own trips,
  tickets, and venue toggles" is enforced at the database layer, not
  re-implemented in every client.
- **Edge Functions** (Deno, colocated with the Postgres instance) host the
  curation pipeline so the Ticketmaster/Anthropic API keys never ship to
  the client — see `docs/CURATION_ENGINE.md`.

## Data model

```
cities ──< venues ──< events
  │                     │
  │                     ├─ ai_summary, quality_score, press_reviews (curation engine output)
  │                     └─ is_lgbtq_friendly, lgbtq_tags
  │
  ├──< trips (user_id, destination_city_id, start_date, end_date)
  │
  └──< user_venue_preferences (user_id, venue_id, is_enabled)  ← the venue toggle
       (absence of a row = defer to venues.is_active_default)

auth.users ──< tickets (event_id nullable — manual entries allowed)
           ──< alert_subscriptions ──< notification_log
           ──< push_tokens
           ──1 profiles
```

Full DDL: `supabase/migrations/0001_init.sql`. Seed data for the seven
default cities (Washington DC, NYC, London, Paris, Chicago, Tokyo, Seoul)
and their flagship venues: `supabase/seed.sql`.

### Venue toggle logic

`venues_with_preference` is a view, not a table:

```sql
select v.*, coalesce(uvp.is_enabled, v.is_active_default) as is_enabled_for_user
from venues v
left join user_venue_preferences uvp
  on uvp.venue_id = v.id and uvp.user_id = auth.uid()
```

Toggling a venue off writes (or upserts) a single row in
`user_venue_preferences` — it never deletes or mutates the venue itself, so
re-enabling it is a single upsert back to `is_enabled: true`. The Discover
feed (`useEvents`) filters on `venue.city_id` server-side; client-side, any
screen that lists venues reads through this view so "off" venues never
need a second round-trip to hide.

### 12-month lookahead

`useEvents` defaults its date range to `[now, now + 12 months]` unless a
narrower window is supplied — the Trips screen passes the trip's own
`[start_date, end_date]` to get the "only show events during my exact
travel dates" behavior for non-home cities.

## Travel & Trip Integration

A trip is just a `(destination_city_id, start_date, end_date)` row. The
Trips screen renders one `EventCard` list per trip, each independently
querying `useEvents({ cityIds: [trip.destination_city_id], startDate,
endDate })` — so a trip to London in October and a trip to Tokyo in
December each get their own tightly-bounded feed, and neither leaks into
the home-city Discover feed.

## Calendar Sync

`src/lib/calendar.ts` wraps `expo-calendar`, which talks to iOS's native
EventKit and Android's Calendar Provider — both are account-agnostic, so an
event written there appears in Apple Calendar, and in Google Calendar too
if the device has a Google account added as a calendar source (no separate
Google Calendar OAuth integration needed). On Web, where there's no native
calendar store, `buildIcsFile` produces a standard `.ics` file the browser
can hand off to whatever calendar app the user has registered.

## Social Export

`src/components/ShareCard.tsx` is a normal RN view rendered off-screen at
1080×1920 (Instagram Story dimensions), styled with the same design tokens
as the rest of the app. `src/lib/share.ts` captures it to a PNG via
`react-native-view-shot` and hands it to `expo-sharing`'s native share
sheet, which surfaces "Add to Instagram Story" on iOS. There's intentionally
no direct Instagram Graph API call: Meta's Content Publishing API requires
a Business/Creator account and app review, and isn't meant for posting to a
personal Story on someone's own behalf — the share sheet is the correct,
App Store–safe integration for "let me post this to my own account."

## Smart Alerts

See `docs/CURATION_ENGINE.md` for the full pipeline; in short,
`alert_subscriptions` (per user, per city, with a minimum quality score and
an LGBTQ+-only flag) is matched against newly-curated events by the
`smart-alerts` edge function, which sends via the Expo Push API using
tokens registered in `push_tokens` by `src/lib/notifications.ts`.

## Design system

- `src/theme/tokens.ts` — palette (charcoal/cream/gold-copper), type scale
  (Playfair Display for display type, Fraunces for headlines, Inter for
  body), spacing, radius.
- `src/theme/ThemeProvider.tsx` — resolves system/light/dark, exposes
  `useAppTheme()`.
- Components consume theme colors directly (no hardcoded hex outside
  `tokens.ts`), so dark mode is a palette swap, not a parallel style sheet.
