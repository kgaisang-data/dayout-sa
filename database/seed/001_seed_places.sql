-- 001_seed_places.sql — initial verified pilot venue (Wits Art Museum).
-- Idempotent by place name + area so the file is safe to re-run.

insert into public.places (
  name, description, category, area,
  estimated_cost_per_person, duration_minutes, vibes,
  opening_hours, indoor, local_business, hidden_gem,
  source_url, last_verified, is_active
)
select *
from (
  values
  ('Wits Art Museum','Art museum with exhibitions and educational programming. Admission is free; donations are encouraged.','Museum','Braamfontein',0,60,array['culture','artsy','chill']::text[],'{"tuesday":"10:00-16:00","wednesday":"10:00-16:00","thursday":"10:00-16:00","friday":"10:00-16:00","saturday":"10:00-16:00"}'::jsonb,true,false,false,'https://www.wits.ac.za/wam/',current_date,true)
) as v(
  name, description, category, area,
  estimated_cost_per_person, duration_minutes, vibes,
  opening_hours, indoor, local_business, hidden_gem,
  source_url, last_verified, is_active
)
where not exists (
  select 1
  from public.places p
  where lower(p.name) = lower(v.name)
    and lower(p.area) = lower(v.area)
);
