// Supabase Edge Function: generate-event-summary
//
// Given a raw event (title/description/venue/press snippets), calls the
// Anthropic Messages API to produce the fields that make an event card
// worth showing: a short editorial summary, a 0-100 quality score, and
// LGBTQ+-friendly tagging. This is the "Curation Engine" referenced in the
// app's Discover feed (src/hooks/useEvents.ts reads its output straight
// off the events table).
//
// Invoke directly (service-role only) to re-curate one event:
//   POST /functions/v1/generate-event-summary  { "eventId": "..." }
// or import `curateEvent` from curate-events/index.ts during bulk ingest.
//
// Deploy: supabase functions deploy generate-event-summary
// Secrets: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

import { createClient } from "npm:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CURATION_SYSTEM_PROMPT = `You are the curation engine for Aria, an editorial cultural-events app.
Given raw event data (title, description, venue, and any press snippets found via web search),
return STRICT JSON with this shape and nothing else:

{
  "ai_summary": string,          // 1-2 sentences, editorial magazine tone (Kinfolk/Vogue), no hype/emoji
  "quality_score": number,       // 0-100. Weigh critical reputation, artist/company pedigree, venue prestige.
  "press_reviews": [             // 0-3 items, only include if you have a real quote/source; else []
    { "source": string, "quote": string, "sentiment": "positive" | "mixed" | "negative" }
  ],
  "is_lgbtq_friendly": boolean,  // true for queer subject matter, drag, pride programming, openly queer
                                  // lead artists/creative teams, or venues with explicit LGBTQ+ programming
  "lgbtq_tags": string[],        // short kebab-case tags, e.g. ["queer-composer", "drag", "pride-programming"]
  "curation_notes": string       // one sentence: why this score/tags, for internal review
}

Be conservative with quality_score — reserve 90+ for genuinely acclaimed, must-see work.
Never fabricate press quotes; if none were provided or found, return an empty press_reviews array.`;

interface CurationResult {
  ai_summary: string;
  quality_score: number;
  press_reviews: { source: string; quote: string; sentiment: "positive" | "mixed" | "negative" }[];
  is_lgbtq_friendly: boolean;
  lgbtq_tags: string[];
  curation_notes: string;
}

export async function curateEvent(input: {
  title: string;
  description?: string | null;
  venueName: string;
  pressSnippets?: string[];
}): Promise<CurationResult> {
  const userContent = [
    `Title: ${input.title}`,
    `Venue: ${input.venueName}`,
    input.description ? `Description: ${input.description}` : null,
    input.pressSnippets?.length ? `Press snippets found:\n${input.pressSnippets.join("\n---\n")}` : "Press snippets: none found."
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: CURATION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }]
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text ?? "{}";
  return JSON.parse(text) as CurationResult;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const { eventId } = await req.json();
  if (!eventId) return new Response(JSON.stringify({ error: "eventId is required" }), { status: 400 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: event, error } = await supabase
    .from("events")
    .select("id, title, description, venue:venues(name)")
    .eq("id", eventId)
    .single();

  if (error || !event) {
    return new Response(JSON.stringify({ error: error?.message ?? "Event not found" }), { status: 404 });
  }

  const venue = event.venue as unknown as { name?: string } | null;
  const result = await curateEvent({
    title: event.title,
    description: event.description,
    venueName: venue?.name ?? "Unknown venue"
  });

  const { error: updateError } = await supabase
    .from("events")
    .update({
      ai_summary: result.ai_summary,
      quality_score: result.quality_score,
      press_reviews: result.press_reviews,
      is_lgbtq_friendly: result.is_lgbtq_friendly,
      lgbtq_tags: result.lgbtq_tags,
      curation_notes: result.curation_notes
    })
    .eq("id", eventId);

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, result }), {
    headers: { "content-type": "application/json" }
  });
});
