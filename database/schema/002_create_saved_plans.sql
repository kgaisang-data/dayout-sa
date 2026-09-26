-- Stores plans that logged-in users save. Each user sees only their own plans.

create table if not exists public.saved_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  title text not null,
  planner_input jsonb not null,
  plan jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.saved_plans enable row level security;

create policy "Users can view their own saved plans"
on public.saved_plans for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can save their own plans"
on public.saved_plans for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own saved plans"
on public.saved_plans for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own saved plans"
on public.saved_plans for delete
to authenticated
using ((select auth.uid()) = user_id);