-- Tighten Data API privileges for an existing DayOut deployment.
-- Row Level Security remains the row-level authorization boundary.

revoke all on table public.places from anon, authenticated;
grant select on table public.places to anon, authenticated;

revoke all on table public.saved_plans from anon, authenticated;
grant select, insert, update, delete on table public.saved_plans to authenticated;
