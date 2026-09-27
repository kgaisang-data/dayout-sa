-- Performance and data-integrity improvements for the DayOut pilot.

-- Speeds up the owner-filter used by saved plans and its RLS policies.
create index if not exists saved_plans_user_id_idx
on public.saved_plans (user_id);

-- Recommendation candidate filtering.
create index if not exists places_active_area_idx
on public.places (is_active, area);

create index if not exists places_cost_idx
on public.places (estimated_cost_per_person);

create index if not exists places_vibes_idx
on public.places using gin (vibes);

create index if not exists places_local_active_idx
on public.places (local_business)
where is_active = true;

create index if not exists places_hidden_active_idx
on public.places (hidden_gem)
where is_active = true;

-- Prevent accidental duplicate venue rows while still allowing one operator
-- to have differently named experiences.
create unique index if not exists places_name_area_unique_idx
on public.places (lower(name), lower(area));

-- Basic integrity constraints.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'places_nonnegative_cost'
  ) then
    alter table public.places
      add constraint places_nonnegative_cost
      check (estimated_cost_per_person >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'places_positive_duration'
  ) then
    alter table public.places
      add constraint places_positive_duration
      check (duration_minutes > 0 and duration_minutes <= 1440) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'places_valid_latitude'
  ) then
    alter table public.places
      add constraint places_valid_latitude
      check (latitude is null or latitude between -90 and 90) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'places_valid_longitude'
  ) then
    alter table public.places
      add constraint places_valid_longitude
      check (longitude is null or longitude between -180 and 180) not valid;
  end if;
end $$;

alter table public.places validate constraint places_nonnegative_cost;
alter table public.places validate constraint places_positive_duration;
alter table public.places validate constraint places_valid_latitude;
alter table public.places validate constraint places_valid_longitude;

-- Bound user-controlled saved-plan payload sizes.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'saved_plans_title_length'
  ) then
    alter table public.saved_plans
      add constraint saved_plans_title_length
      check (char_length(title) between 1 and 120) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'saved_plans_planner_input_size'
  ) then
    alter table public.saved_plans
      add constraint saved_plans_planner_input_size
      check (octet_length(planner_input::text) <= 20000) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'saved_plans_plan_size'
  ) then
    alter table public.saved_plans
      add constraint saved_plans_plan_size
      check (octet_length(plan::text) <= 200000) not valid;
  end if;
end $$;

alter table public.saved_plans validate constraint saved_plans_title_length;
alter table public.saved_plans validate constraint saved_plans_planner_input_size;
alter table public.saved_plans validate constraint saved_plans_plan_size;
