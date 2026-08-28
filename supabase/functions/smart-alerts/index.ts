// Supabase Edge Function: smart-alerts
//
// Runs after curate-events (chain them in the same cron job, or schedule
// this a few minutes later). For every active alert_subscriptions row,
// finds newly-curated events in that city matching the user's quality/
// LGBTQ+ thresholds that haven't already been notified (notification_log),
// and pushes via Expo's push API using each user's stored push_tokens.
//
// Deploy: supabase functions deploy smart-alerts
// Schedule (SQL):
//   select cron.schedule('smart-alerts-nightly', '15 6 * * *',
//     $$ select net.http_post(
//          url := 'https://<project-ref>.functions.supabase.co/smart-alerts',
//          headers := jsonb_build_object('Authorization', 'Bearer ' || '<service-role-key>')
//        ) $$);

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Only alert on events curated/created in this trailing window, so a
// nightly run doesn't re-scan the entire 12-month feed every time.
const LOOKBACK_HOURS = 26;

async function sendExpoPush(tokens: string[], title: string, body: string, data: Record<string, unknown>) {
  if (tokens.length === 0) return;
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(tokens.map((to) => ({ to, title, body, data, sound: "default" })))
  });
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.includes(SUPABASE_SERVICE_ROLE_KEY)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: subscriptions, error: subError } = await supabase
    .from("alert_subscriptions")
    .select("*, city:cities(id, name)")
    .eq("is_active", true);

  if (subError) return new Response(JSON.stringify({ error: subError.message }), { status: 500 });

  const since = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();
  let notified = 0;

  for (const sub of subscriptions ?? []) {
    let query = supabase
      .from("events")
      .select("id, title, quality_score, is_lgbtq_friendly, category, venue:venues!inner(city_id, name)")
      .eq("venue.city_id", sub.city_id)
      .gte("updated_at", since)
      .gte("quality_score", sub.min_quality_score);

    if (sub.lgbtq_only) query = query.eq("is_lgbtq_friendly", true);
    if (sub.category) query = query.eq("category", sub.category);

    const { data: matches, error: matchError } = await query;
    if (matchError) continue;

    for (const event of matches ?? []) {
      const { data: existing } = await supabase
        .from("notification_log")
        .select("id")
        .eq("user_id", sub.user_id)
        .eq("event_id", event.id)
        .eq("channel", "push")
        .maybeSingle();
      if (existing) continue;

      const { data: tokens } = await supabase
        .from("push_tokens")
        .select("expo_push_token")
        .eq("user_id", sub.user_id);

      const tokenList = (tokens ?? []).map((t: { expo_push_token: string }) => t.expo_push_token);
      if (tokenList.length === 0) continue;

      const venue = event.venue as unknown as { name?: string } | null;
      const venueName = venue?.name ?? "";
      await sendExpoPush(
        tokenList,
        "A show worth booking just went up",
        `${event.title} at ${venueName} — quality score ${Math.round(event.quality_score ?? 0)}/100`,
        { eventId: event.id }
      );

      await supabase.from("notification_log").insert({ user_id: sub.user_id, event_id: event.id, channel: "push" });
      notified++;
    }
  }

  return new Response(JSON.stringify({ ok: true, notified }), {
    headers: { "content-type": "application/json" }
  });
});
