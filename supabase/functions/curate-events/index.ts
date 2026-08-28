// Supabase Edge Function: curate-events
//
// The venue directory's "auto-updating" half. Runs on a schedule (see
// docs/CURATION_ENGINE.md for the pg_cron wiring) and, for every active
// venue, pulls upcoming events from Ticketmaster's Discovery API for the
// next 12 months, upserts them into `events`, then hands each new event to
// the curation engine (generate-event-summary) for scoring/tagging.
//
// Deploy: supabase functions deploy curate-events
// Secrets: supabase secrets set TICKETMASTER_API_KEY=... ANTHROPIC_API_KEY=...
// Schedule (SQL, run once against your project):
//   select cron.schedule('curate-events-nightly', '0 6 * * *',
//     $$ select net.http_post(
//          url := 'https://<project-ref>.functions.supabase.co/curate-events',
//          headers := jsonb_build_object('Authorization', 'Bearer ' || '<service-role-key>')
//        ) $$);

import { createClient } from "npm:@supabase/supabase-js@2";
import { curateEvent } from "../generate-event-summary/index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TICKETMASTER_API_KEY = Deno.env.get("TICKETMASTER_API_KEY")!;

const LOOKAHEAD_MONTHS = 12;

interface TicketmasterEvent {
  id: string;
  name: string;
  info?: string;
  url: string;
  dates: { start: { dateTime?: string } };
  priceRanges?: { min: number; max: number; currency: string }[];
  images?: { url: string; width: number }[];
  classifications?: { segment?: { name: string }; genre?: { name: string } }[];
}

function mapCategory(tmEvent: TicketmasterEvent): string {
  const segment = tmEvent.classifications?.[0]?.segment?.name?.toLowerCase() ?? "";
  const genre = tmEvent.classifications?.[0]?.genre?.name?.toLowerCase() ?? "";
  if (segment.includes("arts") && genre.includes("opera")) return "opera";
  if (genre.includes("classical")) return "classical";
  if (genre.includes("jazz")) return "jazz";
  if (segment.includes("theatre") || segment.includes("theater")) return "theater";
  if (genre.includes("dance") || genre.includes("ballet")) return "dance";
  return "other";
}

function bestImage(tmEvent: TicketmasterEvent): string | null {
  const sorted = [...(tmEvent.images ?? [])].sort((a, b) => b.width - a.width);
  return sorted[0]?.url ?? null;
}

async function fetchTicketmasterEventsForVenue(venueExternalId: string, endISO: string) {
  const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
  url.searchParams.set("apikey", TICKETMASTER_API_KEY);
  url.searchParams.set("venueId", venueExternalId);
  url.searchParams.set("endDateTime", endISO);
  url.searchParams.set("size", "200");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Ticketmaster error ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return (json._embedded?.events ?? []) as TicketmasterEvent[];
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.includes(SUPABASE_SERVICE_ROLE_KEY)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Only sync venues sourced from Ticketmaster (i.e. have an external_id).
  // Manually-added venues without a source integration are left alone —
  // their events are entered by hand or via a future SeatGeek/venue-scrape source.
  const { data: venues, error: venuesError } = await supabase
    .from("venues")
    .select("id, name, external_id")
    .eq("source", "ticketmaster")
    .not("external_id", "is", null);

  if (venuesError) {
    return new Response(JSON.stringify({ error: venuesError.message }), { status: 500 });
  }

  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + LOOKAHEAD_MONTHS);
  const endISO = endDate.toISOString().split(".")[0] + "Z";

  const results: { venue: string; ingested: number; curated: number; errors: string[] }[] = [];

  for (const venue of venues ?? []) {
    const errors: string[] = [];
    let ingested = 0;
    let curated = 0;

    try {
      const tmEvents = await fetchTicketmasterEventsForVenue(venue.external_id!, endISO);

      for (const tmEvent of tmEvents) {
        const priceRange = tmEvent.priceRanges?.[0];

        const { data: upserted, error: upsertError } = await supabase
          .from("events")
          .upsert(
            {
              venue_id: venue.id,
              title: tmEvent.name,
              category: mapCategory(tmEvent),
              description: tmEvent.info ?? null,
              start_at: tmEvent.dates.start.dateTime,
              poster_image_url: bestImage(tmEvent),
              ticket_url: tmEvent.url,
              price_min: priceRange?.min ?? null,
              price_max: priceRange?.max ?? null,
              currency: priceRange?.currency ?? "USD",
              source: "ticketmaster",
              external_id: tmEvent.id,
              raw_data: tmEvent
            },
            { onConflict: "source,external_id" }
          )
          .select("id, ai_summary")
          .single();

        if (upsertError) {
          errors.push(`${tmEvent.name}: ${upsertError.message}`);
          continue;
        }
        ingested++;

        // Only run the (costlier) LLM curation pass on events that haven't
        // been curated yet, so re-syncs stay cheap.
        if (upserted && !upserted.ai_summary) {
          try {
            const result = await curateEvent({
              title: tmEvent.name,
              description: tmEvent.info,
              venueName: venue.name
            });
            await supabase
              .from("events")
              .update({
                ai_summary: result.ai_summary,
                quality_score: result.quality_score,
                press_reviews: result.press_reviews,
                is_lgbtq_friendly: result.is_lgbtq_friendly,
                lgbtq_tags: result.lgbtq_tags,
                curation_notes: result.curation_notes
              })
              .eq("id", upserted.id);
            curated++;
          } catch (curationErr) {
            errors.push(`curation failed for ${tmEvent.name}: ${(curationErr as Error).message}`);
          }
        }
      }
    } catch (err) {
      errors.push((err as Error).message);
    }

    results.push({ venue: venue.name, ingested, curated, errors });
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { "content-type": "application/json" }
  });
});
