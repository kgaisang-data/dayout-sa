-- 003_update_vibes.sql
-- Legacy normalization: keep planner-facing vibe tags lowercase and use
-- "hidden gems" (spaces) in the database. The app normalises hyphens/spaces.

update public.places
set vibes = array(
  select distinct lower(replace(trim(vibe), '-', ' '))
  from unnest(vibes) as vibe
)
where vibes is not null;

-- Keep verified existing records aligned with the current planner taxonomy.
update public.places set vibes = array['culture', 'artsy', 'chill']::text[]
where name = 'Wits Art Museum';

update public.places set vibes = array['culture', 'family']::text[]
where name in ('Apartheid Museum', 'Constitution Hill');

update public.places set vibes = array['culture', 'artsy', 'family']::text[]
where name = 'Origins Centre';

update public.places set vibes = array['outdoors', 'family', 'chill']::text[]
where name = 'Johannesburg Zoo';

update public.places set vibes = array['outdoors', 'chill', 'romantic', 'family']::text[]
where name = 'Johannesburg Botanical Garden';

update public.places set vibes = array['artsy', 'chill', 'hidden gems', 'romantic']::text[]
where name = 'Victoria Yards';
