-- 002_security_and_data_checks.sql
-- Read-only checks to run as postgres after migrations/seeding.

select
  count(*) filter (where is_active) as active_places,
  count(*) filter (where is_active and local_business) as active_local_businesses,
  round(
    100.0 * count(*) filter (where is_active and local_business)
    / nullif(count(*) filter (where is_active), 0),
    1
  ) as local_business_percentage,
  count(*) filter (where is_active and hidden_gem) as active_hidden_gems,
  count(*) filter (where is_active and (source_url is null or btrim(source_url) = '')) as missing_sources
from public.places;

select area, count(*) as active_places
from public.places
where is_active
group by area
order by active_places desc, area;

select vibe, count(*) as active_places
from (
  select unnest(vibes) as vibe
  from public.places
  where is_active
) as expanded
group by vibe
order by active_places desc, vibe;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('places', 'saved_plans')
  and grantee in ('anon', 'authenticated')
group by table_name, grantee
order by table_name, grantee;
