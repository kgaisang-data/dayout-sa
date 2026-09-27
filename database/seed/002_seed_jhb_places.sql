-- 002_seed_jhb_places.sql — repaired original Johannesburg pilot seed.
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
  ('Apartheid Museum','Major museum on South African apartheid history. Price is the South African adult rate with ID.','Museum','Ormonde',170,120,array['culture','family']::text[],'{"tuesday":"09:00-17:00","wednesday":"09:00-17:00","thursday":"09:00-17:00","friday":"09:00-17:00","saturday":"09:00-17:00","sunday":"09:00-17:00"}'::jsonb,true,false,false,'https://www.apartheidmuseum.org/about-the-museum/visitor-information',current_date,true),

  ('Constitution Hill','Former prison and home of the Constitutional Court. Price is the 1-hour Highlights Tour, adult rate.','Heritage','Braamfontein',150,60,array['culture','family']::text[],'{"monday":"09:00-17:00","tuesday":"09:00-17:00","wednesday":"09:00-17:00","thursday":"09:00-17:00","friday":"09:00-17:00","saturday":"09:00-17:00","sunday":"09:00-17:00"}'::jsonb,false,false,false,'https://www.constitutionhill.org.za/pages/opening-hours-and-admission',current_date,true),

  ('Johannesburg Zoo','City zoo in Parkview. Price is the adult rate. Last entry 16:00.','Outdoors','Parkview',135,150,array['outdoors','family','chill']::text[],'{"monday":"08:00-17:30","tuesday":"08:00-17:30","wednesday":"08:00-17:30","thursday":"08:00-17:30","friday":"08:00-17:30","saturday":"08:00-17:30","sunday":"08:00-17:30"}'::jsonb,false,false,false,'https://www.jhbcityparksandzoo.com/services-facilities/zoo/fee-structure',current_date,true),

  ('Johannesburg Botanical Garden','Large free garden next to Emmarentia Dam. Official hours are sunrise to sunset; 06:00-18:00 is an approximation.','Outdoors','Emmarentia',0,90,array['outdoors','chill','romantic','family']::text[],'{"monday":"06:00-18:00","tuesday":"06:00-18:00","wednesday":"06:00-18:00","thursday":"06:00-18:00","friday":"06:00-18:00","saturday":"06:00-18:00","sunday":"06:00-18:00"}'::jsonb,false,false,false,'https://www.jhbcityparksandzoo.com/services-facilities/botanical-gardens/plan-your-visit',current_date,true),

  ('Victoria Yards','Creative precinct with studios, gardens and cafes. Free to walk around; food and shopping cost extra.','Creative precinct','Lorentzville',0,90,array['artsy','chill','hidden gems','romantic']::text[],'{"monday":"09:00-17:00","tuesday":"09:00-17:00","wednesday":"09:00-17:00","thursday":"09:00-17:00","friday":"09:00-17:00","saturday":"10:00-17:00","sunday":"10:00-16:00"}'::jsonb,false,true,true,'https://www.victoriayards.co.za/',current_date,true),

  ('Origins Centre','Wits museum about human origins and rock art. Price is the adult rate. Closed Sundays.','Museum','Braamfontein',95,75,array['culture','artsy','family']::text[],'{"monday":"09:00-17:00","tuesday":"09:00-17:00","wednesday":"09:00-17:00","thursday":"09:00-17:00","friday":"09:00-17:00","saturday":"09:00-16:00"}'::jsonb,true,false,true,'https://www.wits.ac.za/origins/hours-and-admission/',current_date,true),

  ('Neighbourgoods Market','Legacy record. The former Neighbourgoods venue at 73 Juta Street is now The Playground; this record is kept inactive for history.','Market','Braamfontein',150,90,array['foodie','chill']::text[],'{"saturday":"09:00-15:00"}'::jsonb,false,true,false,'https://www.playbraamfontein.co.za/the-playground',current_date,false),

  ('Rosebank Sunday Market','Rooftop Sunday market with local traders, food, crafts and vintage finds. Cost is a DayOut estimate of optional spend per person.','Market','Rosebank',100,90,array['foodie','artsy','chill','family']::text[],'{"sunday":"09:00-16:00"}'::jsonb,false,true,false,'https://visit.gauteng.net/visit/rosebank-sunday-market-vg',current_date,true),

  ('44 Stanley','Boutique shopping and dining courtyard. Free to browse; cost is a DayOut estimate of food spend per person.','Shopping and food','Milpark',150,75,array['foodie','chill','hidden gems','romantic']::text[],'{"monday":"09:00-16:00","tuesday":"09:00-16:00","wednesday":"09:00-16:00","thursday":"09:00-16:00","friday":"09:00-16:00","saturday":"09:00-15:00","sunday":"09:00-14:00"}'::jsonb,false,true,true,'https://www.sa-venues.com/things-to-do/gauteng/44-stanley/',current_date,true)
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
