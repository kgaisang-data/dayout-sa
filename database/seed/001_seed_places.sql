-- ============================================================
-- DayOut: Places Table
--
-- Purpose:
-- Creates the places table used by the DayOut recommendation
-- engine to store Johannesburg activities, attractions,
-- businesses and local experiences.
--
-- NOTE:
-- The live Supabase project already contains this table.
-- This file is kept in the repository so that the database
-- structure can be reproduced in another environment.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Create places table
-- ------------------------------------------------------------

create table if not exists public.places (
    id uuid primary key default gen_random_uuid(),

    -- Basic place information
    name text not null,
    description text not null,
    category text not null,
    area text not null,

    -- Location information
    latitude double precision,
    longitude double precision,

    -- Planning information
    estimated_cost_per_person numeric(10, 2) not null default 0,
    duration_minutes integer not null default 60,

    -- Recommendation tags
    vibes text[] not null default array[]::text[],

    -- Opening times stored as JSON
    -- Example:
    -- {
    --   "monday": "09:00-17:00",
    --   "tuesday": "09:00-17:00"
    -- }
    opening_hours jsonb,

    -- Place characteristics
    indoor boolean not null default false,
    local_business boolean not null default false,
    hidden_gem boolean not null default false,

    -- Optional media and verification information
    image_url text,
    source_url text,
    last_verified date,

    -- Allows a place to be removed from recommendations
    -- without deleting the database record
    is_active boolean not null default true,

    -- Record timestamps
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 2. Enable Row Level Security
-- ------------------------------------------------------------

alter table public.places
enable row level security;


-- ------------------------------------------------------------
-- 3. Allow guests and signed-in users to read active places
--
-- Users of the public DayOut application should only be able
-- to READ active places.
--
-- No public INSERT, UPDATE or DELETE policies are created.
-- This means normal users cannot modify the places database.
-- ------------------------------------------------------------

drop policy if exists "Anyone can view active places"
on public.places;

create policy "Anyone can view active places"
on public.places
for select
to anon, authenticated
using (is_active = true);