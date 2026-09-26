-- 003_update_vibes.sql
-- Match place vibes to the planner's options (stored in lowercase).

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

select name, vibes from public.places order by name;