-- 002_seed_jhb_places.sql
-- Adds a source_url column, updates Wits vibes, and adds 9 Johannesburg pilot places.
-- Safe to re-run: existing places are skipped.

-- 1. Add a column to record where each fact came from
alter table public.places
add column if not exists source_url text;

-- 2. Make Wits vibe tags match the planner's vibe names
update public.places
set vibes = array['artsy', 'culture', 'chill']::text[]
where name = 'Wits Art Museum';

-- 3. Add 9 more Johannesburg places (skips any that already exist)
insert into public.places (
  name, description, category, area,
  estimated_cost_per_person, duration_minutes, vibes,
  opening_hours, indoor, local_business, hidden_gem,
  source_url, last_verified, is_active
)
select
  v.name, v.description, v.category, v.area,
  v.cost, v.duration, v.vibes,
  v.hours::jsonb, v.indoor, v.local_business, v.hidden_gem,
  v.source_url, current_date, true
from (values
  ('Apartheid Museum',
   'Major museum on South African apartheid history. Price is the South African adult rate with ID.',
   'Museum', 'Ormonde', 170, 120,
   array['culture']::text[],
   '{"tuesday":"09:00-17:00","wednesday":"09:00-17:00","thursday":"09:00-17:00","friday":"09:00-17:00","saturday":"09:00-17:00","sunday":"09:00-17:00"}',
   true, false, false,
   'https://www.apartheidmuseum.org/about-the-museum/visitor-information'),

  ('Constitution Hill',
   'Former prison and home of the Constitutional Court. Price is the 1-hour Highlights Tour, adult rate.',
   'Heritage', 'Braamfontein', 150, 60,
   array['culture']::text[],
   '{"monday":"09:00-17:00","tuesday":"09:00-17:00","wednesday":"09:00-17:00","thursday":"09:00-17:00","friday":"09:00-17:00","saturday":"09:00-17:00","sunday":"09:00-17:00"}',
   false, false, false,
   'https://www.constitutionhill.org.za/pages/opening-hours-and-admission'),

  ('Johannesburg Zoo',
   'City zoo in Parkview. Price is the adult rate.