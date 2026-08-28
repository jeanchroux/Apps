# Atelier

A cross-platform (Web, iPadOS, iOS) app for discovering, tracking, and sharing
the best culture — concerts, opera, theater, and galleries — in your home
city and everywhere you travel.

> Naming shortlist and full feature rationale: see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
> Curation engine (LLM + event API integration) details: see [`docs/CURATION_ENGINE.md`](docs/CURATION_ENGINE.md).

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| App framework | Expo (React Native) + Expo Router | One codebase → iOS, iPadOS, and Web. File-based routing, OTA updates, first-class TypeScript. |
| Language | TypeScript | Shared types between client and edge functions. |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions + RLS) | Relational schema fits venues/events/trips/tickets far better than a NoSQL store; Row Level Security gives per-user data isolation for free; Edge Functions (Deno) host the curation pipeline next to the data. |
| Data fetching | TanStack Query | Caching, refetch-on-focus, optimistic mutations for the venue toggle. |
| Client state | Zustand | Ephemeral UI filters (home city, LGBTQ+-only toggle) that don't need to sync. |
| Fonts | Playfair Display (display serif) + Fraunces (headline serif) + Inter (body sans) via `@expo-google-fonts` | Editorial, high-end magazine feel with a real font fallback stack. |
| Calendar | `expo-calendar` (native EventKit / Calendar Provider) + `.ics` fallback on Web | Native "Add to Calendar" without a Google/Apple OAuth integration. |
| Social export | `react-native-view-shot` + `expo-sharing` | Renders a 1080×1920 share card and hands it to the native share sheet (Instagram Story target included) — no Instagram API needed for personal posting. |
| Push | `expo-notifications` + Expo Push API | Smart Alerts, triggered server-side by the `smart-alerts` edge function. |

## Project structure

```
app/                        Expo Router screens (file-based routing)
  _layout.tsx                Root stack, fonts, providers
  (tabs)/
    _layout.tsx               Bottom tab navigator
    index.tsx                 Discover — 12-month curated feed
    venues.tsx                 Venue directory + on/off toggles, grouped by city
    trips.tsx                  Travel dates → auto-filtered feeds
    tickets.tsx                 My Tickets & Bookings
    profile.tsx                 Home city, dark mode, Smart Alerts opt-in
  event/[id].tsx               Event detail
  venue/[id].tsx                Venue detail

src/
  theme/                      Design tokens, light/dark themes, ThemeProvider
  components/                  EventCard, VenueCard, ShareCard, etc.
  hooks/                       React Query hooks wrapping Supabase (useEvents, useVenues, useTrips, useTickets)
  lib/                          supabase client, calendar, share, notifications, mock data (offline/demo fallback)
  store/                        Zustand UI state
  types/                        database.types.ts — mirrors the SQL schema

supabase/
  migrations/0001_init.sql     Full schema, RLS policies, triggers
  seed.sql                      Default cities + flagship venues
  functions/
    curate-events/               Pulls events from Ticketmaster for active venues, ingests 12mo lookahead
    generate-event-summary/       Anthropic Claude call: AI summary, quality score, LGBTQ+ tagging
    smart-alerts/                  Matches new curated events to alert_subscriptions, sends Expo push
```

## Setup

### 1. Prerequisites

```bash
node -v   # 18+
npm i -g eas-cli   # only needed for native builds/submission
```

### 2. Install dependencies

```bash
npm install
npx expo install --fix   # aligns native module versions with the installed Expo SDK
```

### 3. Create a Supabase project

```bash
npm i -g supabase
supabase login
supabase init            # if you want the CLI to manage this repo's supabase/ dir
supabase link --project-ref <your-project-ref>

# Apply the schema
supabase db push          # runs supabase/migrations/0001_init.sql
psql "$(supabase db remote-url)" -f supabase/seed.sql   # or run seed.sql in the SQL editor
```

### 4. Configure environment variables

```bash
cp .env.example .env
# fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
# from Supabase dashboard → Project Settings → API
```

Without these set, the app still runs — every hook in `src/hooks` falls back
to fixture data in `src/lib/mockData.ts` so the UI is fully browsable offline.

### 5. Deploy the curation edge functions (optional, for live data)

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set TICKETMASTER_API_KEY=...

supabase functions deploy generate-event-summary
supabase functions deploy curate-events
supabase functions deploy smart-alerts
```

Then schedule them with `pg_cron` — see the header comment in each function
file in `supabase/functions/` for the exact SQL, or `docs/CURATION_ENGINE.md`
for the full pipeline diagram.

### 6. Run the app

```bash
npx expo start          # scan the QR code for iOS via Expo Go, or:
npx expo start --web    # laptop / browser
npx expo start --ios    # requires Xcode + a simulator
```

### 7. Type-check / lint

```bash
npm run typecheck
npm run lint
```

`supabase/functions/**` are Deno programs (they import via `npm:` specifiers
and use the `Deno` global), so they're excluded from the root `tsconfig.json`
and type-checked by the Supabase CLI / Deno itself, e.g. `deno check
supabase/functions/curate-events/index.ts`.

## Assets

`assets/*.png` are 1×1 placeholders so `expo start` runs out of the box —
swap them for real icon/splash artwork (1024×1024 icon, adaptive-icon
foreground, splash image, favicon, notification icon) before shipping.

## Design system

Palette, typography scale, and spacing live in `src/theme/tokens.ts`. Dark
mode is automatic (follows system appearance) with a manual override in
Profile → Appearance, implemented via `src/theme/ThemeProvider.tsx`.
