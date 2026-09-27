-- Stores plans saved by authenticated users.
-- Each user may only access rows that belong to their own auth.uid().

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

drop policy if exists "Users can view their own saved plans" on public.saved_plans;
drop policy if exists "Users can save their own plans" on public.saved_plans;
drop policy if exists "Users can update their own saved plans" on public.saved_plans;
drop policy if exists "Users can delete their own saved plans" on public.saved_plans;

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

-- Guests never need table access. Signed-in users need only the operations that
-- are further restricted to their own rows by the policies above.
revoke all on table public.saved_plans from anon, authenticated;
grant select, insert, update, delete on table public.saved_plans to authenticated;
