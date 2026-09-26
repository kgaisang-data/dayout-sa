-- Adds the first pilot venue. Safe to re-run: it will not add duplicates.

insert into public.places (
  name, description, category, area,
  estimated_cost_per_person, duration_minutes, vibes,
  opening_hours, indoor, image_url, last_verified, is_active
)
select
  'Wits Art Museum',
  'Art museum with exhibitions and educational programming. Admission is free; donations are encouraged.',
  'Museum',
  'Braamfontein',
  0,
  60,
  array['art', 'culture', 'budget-friendly']::text[],
  '{"tuesday":"10:00-16:00","wednesday":"10:00-16:00","thursday":"10:00-16:00","friday":"10:00-16:00","saturday":"10:00-16:00"}'::jsonb,
  true,
  null,
  current_date,
  true
where not exists (
  select 1 from public.places where name = 'Wits Art Museum'
);