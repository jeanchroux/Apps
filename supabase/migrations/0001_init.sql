-- =========================================================================
-- Atelier — initial schema
-- Cultural discovery, venues, trips, tickets, curation & alerts
-- =========================================================================

create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- -------------------------------------------------------------------------
-- Enums
-- -------------------------------------------------------------------------
create type venue_category as enum (
  'concert_hall',
  'opera_house',
  'theater',
  'gallery',
  'museum',
  'jazz_club',
  'dance',
  'other'
);

create type event_category as enum (
  'classical',
  'opera',
  'theater',
  'dance',
  'jazz',
  'contemporary_music',
  'visual_art',
  'film',
  'other'
);

create type data_source as enum (
  'manual',
  'ticketmaster',
  'seatgeek',
  'venue_scrape',
  'ai_curated'
);

create type ticket_source as enum ('manual', 'synced');

-- -------------------------------------------------------------------------
-- profiles — extends auth.users
-- -------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  instagram_handle text,
  home_city_id uuid,
  theme_preference text not null default 'system' check (theme_preference in ('system', 'light', 'dark')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------------------
-- cities — default set seeded below, user can add more via trips
-- -------------------------------------------------------------------------
create table public.cities (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  country text not null,
  timezone text not null,
  lat double precision,
  lng double precision,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (name, country)
);

alter table public.profiles
  add constraint profiles_home_city_fk foreign key (home_city_id) references public.cities (id);

-- -------------------------------------------------------------------------
-- venues — auto-updating directory, exhaustive per city
-- -------------------------------------------------------------------------
create table public.venues (
  id uuid primary key default uuid_generate_v4(),
  city_id uuid not null references public.cities (id) on delete cascade,
  name text not null,
  category venue_category not null default 'other',
  address text,
  lat double precision,
  lng double precision,
  website_url text,
  image_url text,
  description text,
  source data_source not null default 'manual',
  external_id text, -- id in the source system (Ticketmaster venue id, etc.)
  is_active_default boolean not null default true, -- whether new users see it enabled by default
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, external_id)
);

create index venues_city_idx on public.venues (city_id);
create index venues_name_trgm_idx on public.venues using gin (name gin_trgm_ops);

-- -------------------------------------------------------------------------
-- user_venue_preferences — the on/off toggle per user per venue
-- Absence of a row = default to venues.is_active_default (true).
-- Presence of a row with is_enabled = false = user disabled it.
-- -------------------------------------------------------------------------
create table public.user_venue_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  venue_id uuid not null references public.venues (id) on delete cascade,
  is_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (user_id, venue_id)
);

create index user_venue_preferences_user_idx on public.user_venue_preferences (user_id);

-- Convenience view: venues joined with the current user's effective toggle state.
-- (RLS-safe because it filters through auth.uid() inside the query, not the view itself.)
create view public.venues_with_preference as
select
  v.*,
  coalesce(uvp.is_enabled, v.is_active_default) as is_enabled_for_user,
  uvp.user_id as preference_user_id
from public.venues v
left join public.user_venue_preferences uvp
  on uvp.venue_id = v.id and uvp.user_id = auth.uid();

-- -------------------------------------------------------------------------
-- events — the 12-month lookahead feed
-- -------------------------------------------------------------------------
create table public.events (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  title text not null,
  category event_category not null default 'other',
  description text,
  ai_summary text, -- short LLM-generated summary shown on the card
  start_at timestamptz not null,
  end_at timestamptz,
  poster_image_url text,
  ticket_url text,
  price_min numeric(10, 2),
  price_max numeric(10, 2),
  currency text default 'USD',

  -- Curation engine outputs
  quality_score numeric(5, 2), -- 0-100, from press-review + reputation weighting
  press_reviews jsonb not null default '[]'::jsonb, -- [{source, quote, url, sentiment}]
  is_lgbtq_friendly boolean not null default false,
  lgbtq_tags text[] not null default '{}', -- e.g. {"drag", "queer-composer", "pride-programming"}
  curation_notes text, -- why the engine scored/tagged it this way

  source data_source not null default 'manual',
  external_id text,
  raw_data jsonb, -- original payload from Ticketmaster/SeatGeek for audit/reprocessing

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, external_id)
);

create index events_venue_idx on public.events (venue_id);
create index events_start_at_idx on public.events (start_at);
create index events_quality_idx on public.events (quality_score desc);
create index events_lgbtq_idx on public.events (is_lgbtq_friendly) where is_lgbtq_friendly = true;

-- -------------------------------------------------------------------------
-- trips — travel dates that filter the feed for non-home cities
-- -------------------------------------------------------------------------
create table public.trips (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  destination_city_id uuid not null references public.cities (id),
  label text,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index trips_user_idx on public.trips (user_id);
create index trips_dates_idx on public.trips (start_date, end_date);

-- -------------------------------------------------------------------------
-- tickets — "My Tickets & Bookings" personal dashboard
-- -------------------------------------------------------------------------
create table public.tickets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_id uuid references public.events (id) on delete set null, -- null when fully manual entry

  event_name text not null,
  venue_name text not null,
  event_date date not null,
  event_time time,
  num_tickets integer not null default 1 check (num_tickets > 0),
  notes text,

  source ticket_source not null default 'manual',
  calendar_event_id text, -- id returned by expo-calendar once synced

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tickets_user_idx on public.tickets (user_id);
create index tickets_date_idx on public.tickets (event_date);

-- -------------------------------------------------------------------------
-- alert_subscriptions — Smart Alerts: push me when a great show goes on sale
-- -------------------------------------------------------------------------
create table public.alert_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  city_id uuid not null references public.cities (id),
  min_quality_score numeric(5, 2) not null default 75,
  lgbtq_only boolean not null default false,
  category event_category, -- null = any category
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, city_id, category)
);

create table public.notification_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  channel text not null default 'push',
  sent_at timestamptz not null default now(),
  unique (user_id, event_id, channel)
);

-- -------------------------------------------------------------------------
-- push_tokens — device tokens for Expo push notifications
-- -------------------------------------------------------------------------
create table public.push_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  expo_push_token text not null unique,
  device_name text,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------------------
-- updated_at triggers
-- -------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.venues
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.events
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.tickets
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------------------
-- Row Level Security
-- -------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.cities enable row level security;
alter table public.venues enable row level security;
alter table public.user_venue_preferences enable row level security;
alter table public.events enable row level security;
alter table public.trips enable row level security;
alter table public.tickets enable row level security;
alter table public.alert_subscriptions enable row level security;
alter table public.notification_log enable row level security;
alter table public.push_tokens enable row level security;

-- Public read-only reference data
create policy "cities are publicly readable" on public.cities for select using (true);
create policy "venues are publicly readable" on public.venues for select using (true);
create policy "events are publicly readable" on public.events for select using (true);

-- Only service_role (edge functions) writes venues/events; no client insert/update policy.

-- profiles: user manages their own row
create policy "select own profile" on public.profiles for select using (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id);
create policy "insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- user_venue_preferences: user manages their own toggles
create policy "select own venue prefs" on public.user_venue_preferences for select using (auth.uid() = user_id);
create policy "upsert own venue prefs" on public.user_venue_preferences for insert with check (auth.uid() = user_id);
create policy "update own venue prefs" on public.user_venue_preferences for update using (auth.uid() = user_id);
create policy "delete own venue prefs" on public.user_venue_preferences for delete using (auth.uid() = user_id);

-- trips
create policy "select own trips" on public.trips for select using (auth.uid() = user_id);
create policy "insert own trips" on public.trips for insert with check (auth.uid() = user_id);
create policy "update own trips" on public.trips for update using (auth.uid() = user_id);
create policy "delete own trips" on public.trips for delete using (auth.uid() = user_id);

-- tickets
create policy "select own tickets" on public.tickets for select using (auth.uid() = user_id);
create policy "insert own tickets" on public.tickets for insert with check (auth.uid() = user_id);
create policy "update own tickets" on public.tickets for update using (auth.uid() = user_id);
create policy "delete own tickets" on public.tickets for delete using (auth.uid() = user_id);

-- alert_subscriptions
create policy "select own alerts" on public.alert_subscriptions for select using (auth.uid() = user_id);
create policy "insert own alerts" on public.alert_subscriptions for insert with check (auth.uid() = user_id);
create policy "update own alerts" on public.alert_subscriptions for update using (auth.uid() = user_id);
create policy "delete own alerts" on public.alert_subscriptions for delete using (auth.uid() = user_id);

-- notification_log: readable by owner only, written by service_role
create policy "select own notification log" on public.notification_log for select using (auth.uid() = user_id);

-- push_tokens
create policy "select own push tokens" on public.push_tokens for select using (auth.uid() = user_id);
create policy "insert own push tokens" on public.push_tokens for insert with check (auth.uid() = user_id);
create policy "delete own push tokens" on public.push_tokens for delete using (auth.uid() = user_id);
