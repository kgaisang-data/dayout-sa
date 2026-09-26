-- RLS checks for the places table.
-- Run these in Supabase SQL Editor with "Run as: anon".
-- Run ONE test at a time.

-- Test 1: should return active places (Wits Art Museum)
select name, area, estimated_cost_per_person, is_active
from public.places;

-- Test 2: should FAIL with "violates row-level security policy"
insert into public.places (name, description, category, area)
values ('RLS Test Place', 'Should be blocked', 'Test', 'Test');

-- Test 3: should return "Success. No rows returned"
update public.places
set estimated_cost_per_person = 999
where name = 'Wits Art Museum'
returning name;

-- Test 4: should return "Success. No rows returned"
delete from public.places
where name = 'Wits Art Museum'
returning name;