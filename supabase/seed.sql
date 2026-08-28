-- =========================================================================
-- Seed: default cities + a starter set of flagship venues per city.
-- The venue directory is meant to be exhaustive and auto-updating in
-- production (see supabase/functions/curate-events for the sync job) —
-- this seed just gets local dev / first launch populated with the
-- flagship venues so the app isn't empty before the first sync runs.
-- =========================================================================

insert into public.cities (name, country, timezone, lat, lng, is_default) values
  ('Washington DC', 'USA', 'America/New_York', 38.9072, -77.0369, true),
  ('New York City', 'USA', 'America/New_York', 40.7128, -74.0060, true),
  ('London', 'UK', 'Europe/London', 51.5072, -0.1276, true),
  ('Paris', 'France', 'Europe/Paris', 48.8566, 2.3522, true),
  ('Chicago', 'USA', 'America/Chicago', 41.8781, -87.6298, true),
  ('Tokyo', 'Japan', 'Asia/Tokyo', 35.6762, 139.6503, true),
  ('Seoul', 'South Korea', 'Asia/Seoul', 37.5665, 126.9780, true)
on conflict (name, country) do nothing;

-- Washington DC
insert into public.venues (city_id, name, category, source, is_active_default)
select id, 'The Kennedy Center', 'concert_hall', 'manual', true from public.cities where name = 'Washington DC'
union all
select id, 'Arena Stage', 'theater', 'manual', true from public.cities where name = 'Washington DC'
union all
select id, 'National Gallery of Art', 'gallery', 'manual', true from public.cities where name = 'Washington DC'
union all
select id, 'Wolf Trap', 'concert_hall', 'manual', true from public.cities where name = 'Washington DC';

-- New York City
insert into public.venues (city_id, name, category, source, is_active_default)
select id, 'Metropolitan Opera', 'opera_house', 'manual', true from public.cities where name = 'New York City'
union all
select id, 'Carnegie Hall', 'concert_hall', 'manual', true from public.cities where name = 'New York City'
union all
select id, 'Lincoln Center', 'concert_hall', 'manual', true from public.cities where name = 'New York City'
union all
select id, 'The Museum of Modern Art', 'gallery', 'manual', true from public.cities where name = 'New York City'
union all
select id, 'Brooklyn Academy of Music', 'theater', 'manual', true from public.cities where name = 'New York City';

-- London
insert into public.venues (city_id, name, category, source, is_active_default)
select id, 'Royal Opera House', 'opera_house', 'manual', true from public.cities where name = 'London'
union all
select id, 'Royal Albert Hall', 'concert_hall', 'manual', true from public.cities where name = 'London'
union all
select id, 'Barbican Centre', 'concert_hall', 'manual', true from public.cities where name = 'London'
union all
select id, 'Tate Modern', 'gallery', 'manual', true from public.cities where name = 'London'
union all
select id, 'National Theatre', 'theater', 'manual', true from public.cities where name = 'London';

-- Paris
insert into public.venues (city_id, name, category, source, is_active_default)
select id, 'Opéra Garnier', 'opera_house', 'manual', true from public.cities where name = 'Paris'
union all
select id, 'Opéra Bastille', 'opera_house', 'manual', true from public.cities where name = 'Paris'
union all
select id, 'Philharmonie de Paris', 'concert_hall', 'manual', true from public.cities where name = 'Paris'
union all
select id, 'Musée d''Orsay', 'gallery', 'manual', true from public.cities where name = 'Paris'
union all
select id, 'Comédie-Française', 'theater', 'manual', true from public.cities where name = 'Paris';

-- Chicago
insert into public.venues (city_id, name, category, source, is_active_default)
select id, 'Lyric Opera of Chicago', 'opera_house', 'manual', true from public.cities where name = 'Chicago'
union all
select id, 'Chicago Symphony Center', 'concert_hall', 'manual', true from public.cities where name = 'Chicago'
union all
select id, 'The Art Institute of Chicago', 'gallery', 'manual', true from public.cities where name = 'Chicago'
union all
select id, 'Steppenwolf Theatre', 'theater', 'manual', true from public.cities where name = 'Chicago';

-- Tokyo
insert into public.venues (city_id, name, category, source, is_active_default)
select id, 'New National Theatre Tokyo', 'opera_house', 'manual', true from public.cities where name = 'Tokyo'
union all
select id, 'Suntory Hall', 'concert_hall', 'manual', true from public.cities where name = 'Tokyo'
union all
select id, 'Mori Art Museum', 'gallery', 'manual', true from public.cities where name = 'Tokyo'
union all
select id, 'Kabuki-za', 'theater', 'manual', true from public.cities where name = 'Tokyo';

-- Seoul
insert into public.venues (city_id, name, category, source, is_active_default)
select id, 'Seoul Arts Center', 'concert_hall', 'manual', true from public.cities where name = 'Seoul'
union all
select id, 'Sejong Center for the Performing Arts', 'concert_hall', 'manual', true from public.cities where name = 'Seoul'
union all
select id, 'Leeum Museum of Art', 'gallery', 'manual', true from public.cities where name = 'Seoul'
union all
select id, 'National Theater of Korea', 'theater', 'manual', true from public.cities where name = 'Seoul';
