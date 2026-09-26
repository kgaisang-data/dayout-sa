-- Creates the places table used by the DayOut planner.
-- Already run in Supabase. Do not run again on the same project.

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  category text not null,
  area text not null,
  latitude double precision,
  longitude double precision,
  estimated_cost_per_person numeric(10, 2) not null default 0,
  duration_minutes integer not null default 60,
  vibes text[] not null default '{}',
  opening_hours jsonb,
  indoor boolean not null default false,
  local_business boolean not null default false,
  hidden_gem boolean not null default false,
  image_url text,
  last_verified date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.places enable row level security;

create policy "Anyone can view active places"
on public.places
for select
to anon, authenticated
using (is_active = true);