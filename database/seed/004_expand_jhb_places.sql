-- 004_expand_jhb_places.sql
-- Expands the Johannesburg pilot with verified/current local-business,
-- cultural, food, market, nightlife, outdoor and activity options.
-- Prices labelled as DayOut estimates are planning allowances.

update public.places
set
  is_active = false,
  description = 'Legacy record. The former Neighbourgoods venue at 73 Juta Street is now The Playground; this record is kept inactive for history.',
  source_url = 'https://www.playbraamfontein.co.za/the-playground',
  last_verified = current_date
where name = 'Neighbourgoods Market';

-- Add the expanded Johannesburg pilot.
-- Idempotent by place name + area so the file is safe to re-run.

insert into public.places (
  name, description, category, area,
  latitude, longitude,
  estimated_cost_per_person, duration_minutes, vibes,
  opening_hours, indoor, local_business, hidden_gem,
  image_url, source_url, last_verified, is_active
)
select
  v.name, v.description, v.category, v.area,
  v.latitude, v.longitude,
  v.estimated_cost_per_person, v.duration_minutes, v.vibes,
  v.opening_hours, v.indoor, v.local_business, v.hidden_gem,
  v.image_url, v.source_url, v.last_verified, v.is_active
from (
  values
  ('The Playground Market', 'Saturday artisan market at the former Neighbourgoods venue, with local street food, cocktails, live music and DJs. Entry is free early and R20 later; the DayOut amount allows for entry plus modest food or drink spend.', 'Market', 'Braamfontein', null, null, 120, 120, array['foodie', 'chill', 'nightlife', 'artsy']::text[], '{"saturday":"11:00-19:00"}'::jsonb, false, true, false, null, 'https://www.playbraamfontein.co.za/the-playground', current_date, true),

  ('Kwa Mai Mai Market', 'Historic Jeppestown market for traditional medicine, cultural artefacts and South African street food. DayOut cost is an estimated optional food or craft spend.', 'Market', 'Jeppestown', null, null, 120, 90, array['foodie', 'culture', 'hidden gems', 'artsy']::text[], null, false, true, true, null, 'https://visit.joburg/things-to-do/kwa-mai-mai/', current_date, true),

  ('Rosebank Art & Craft Market', 'Daily market featuring African art, jewellery, fashion, homeware and many independent artisan stalls. Browsing is free; DayOut cost is an optional shopping estimate.', 'Market', 'Rosebank', null, null, 100, 90, array['artsy', 'chill', 'family', 'hidden gems']::text[], '{"monday":"09:00-19:00","tuesday":"09:00-19:00","wednesday":"09:00-19:00","thursday":"09:00-19:00","friday":"09:00-19:00","saturday":"09:00-18:00","sunday":"09:00-18:00"}'::jsonb, true, true, false, null, 'https://rosebankartandcraft.com/', current_date, true),

  ('Bryanston Organic & Natural Market', 'Long-running market with local makers, natural products, food stalls and family activities. Entry to the market is generally free; DayOut cost is an optional spend estimate.', 'Market', 'Bryanston', null, null, 120, 120, array['foodie', 'chill', 'family', 'artsy']::text[], '{"thursday":"09:00-15:00","saturday":"09:00-15:00"}'::jsonb, false, true, false, null, 'https://www.bryanstonorganicmarket.co.za/Events/', current_date, true),

  ('Lebo''s Soweto Bicycle Tour', 'Locally guided bicycle tour through Soweto neighbourhoods with history, community interaction, snacks and lunch included.', 'Guided tour', 'Orlando West', null, null, 785, 150, array['adventurous', 'culture', 'outdoors', 'foodie']::text[], null, false, true, false, null, 'https://www.sowetobackpackers.com/activities/bicycle-tours/', current_date, true),

  ('Lebo''s Soweto Walking Tour', 'Three-hour locally guided Soweto walking tour with neighbourhood history, local-vendor interaction, snacks and lunch.', 'Guided tour', 'Orlando West', null, null, 680, 180, array['culture', 'outdoors', 'foodie', 'hidden gems']::text[], null, false, true, false, null, 'https://www.sowetobackpackers.com/activities/walking-tour/', current_date, true),

  ('Lebo''s Soweto Food & Cooking Experience', 'Hands-on Soweto food experience with a local market visit, garden ingredients, traditional cooking, tasting and a meal.', 'Food experience', 'Orlando West', null, null, 790, 210, array['foodie', 'culture', 'hidden gems', 'family']::text[], null, false, true, true, null, 'https://www.sowetobackpackers.com/activities/food-tour/', current_date, true),

  ('Lebo''s Soweto Tuk-Tuk Tour', 'Locally guided tuk-tuk tour through Soweto back streets, neighbourhoods and historical sites.', 'Guided tour', 'Orlando West', null, null, 860, 120, array['adventurous', 'culture', 'hidden gems']::text[], null, false, true, true, null, 'https://www.sowetobackpackers.com/activities/tuk-tuk-tours-2/', current_date, true),

  ('Soweto Outdoor Adventures Quad Bike Tour', 'Locally guided Soweto quad-biking experience through neighbourhood streets, murals and community spaces.', 'Adventure', 'Soweto', null, null, 450, 120, array['adventurous', 'outdoors', 'culture', 'hidden gems']::text[], null, false, true, false, null, 'https://visit.gauteng.net/visit/soweto-outdoor-adventures', current_date, true),

  ('Ndlovukazi Vilakazi Street Experience', 'Locally guided Soweto experience led by a certified guide, covering Vilakazi Street, Mandela House and the Hector Pieterson area. Lunch is excluded.', 'Guided tour', 'Orlando West', null, null, 700, 180, array['culture', 'hidden gems', 'outdoors']::text[], null, false, true, true, null, 'https://visit.gauteng.net/visit/ndlovukazi-tours-and-travel-gn', current_date, true),

  ('Vilakazi Street Neighborhood Experience', 'Interactive local travel experience around the Vilakazi Street precinct and its main points of interest.', 'Guided tour', 'Dube', null, null, 480, 150, array['culture', 'foodie', 'hidden gems', 'family']::text[], null, false, true, false, null, 'https://visit.gauteng.net/visit/vilakazi-street-tourism-neighborhood-travel-experience-3-vg', current_date, true),

  ('Dlala Nje Ponte Sundowners', 'Community-focused inner-city sundowner experience from the top of Ponte with panoramic Johannesburg views.', 'Experience', 'Berea', null, null, 100, 90, array['romantic', 'chill', 'hidden gems', 'nightlife']::text[], null, true, true, true, null, 'https://dlalanje.org/book-tour/epic-ponte-sundowners-best-view-joburg/', current_date, true),

  ('Dlala Nje Cake & Wine Experience', 'Ponte rooftop cake, wine, picnic snacks and guided canvas-painting experience with city views.', 'Experience', 'Berea', null, null, 380, 150, array['romantic', 'artsy', 'chill', 'hidden gems']::text[], null, true, true, true, null, 'https://dlalanje.org/book-tour/ponte-womens-cake-wine-experience/', current_date, true),

  ('The Bioscope Independent Cinema', 'Johannesburg''s independently owned cinema at 44 Stanley, showing curated films, cult classics and themed screenings.', 'Cinema', 'Milpark', null, null, 105, 120, array['chill', 'artsy', 'romantic', 'hidden gems']::text[], null, true, true, false, null, 'https://thebioscope.co.za/contact-and-location/', current_date, true),

  ('Kitchener''s Bar', 'Historic Braamfontein bar and nightlife venue on De Beer Street. DayOut cost is an estimated modest food/drink spend.', 'Nightlife', 'Braamfontein', null, null, 180, 120, array['nightlife', 'chill', 'hidden gems']::text[], '{"wednesday":"11:00-late","thursday":"11:00-late","friday":"11:00-late","saturday":"11:00-late","sunday":"11:00-late"}'::jsonb, true, true, false, null, 'https://www.playbraamfontein.co.za/grab-a-drink', current_date, true),

  ('Chaf Pozi', 'Soweto shisa-nyama venue near Orlando Towers with grilled meat, local atmosphere and entertainment. DayOut cost is an estimated meal spend.', 'Restaurant', 'Orlando East', null, null, 220, 120, array['foodie', 'nightlife', 'social', 'culture']::text[], null, false, true, false, null, 'https://soweto.co.za/restaurants/', current_date, true),

  ('Sakhumzi Restaurant', 'Soweto-owned Vilakazi Street restaurant known for traditional food, buffet options and local hospitality. DayOut cost is an estimated meal spend.', 'Restaurant', 'Orlando West', null, null, 220, 90, array['foodie', 'culture', 'social', 'family']::text[], null, true, true, false, null, 'https://www.sowetotourism.org.za/servicesproviders', current_date, true),

  ('1947 on Vilakazi Street', 'Independent Vilakazi Street restaurant listed by Soweto Tourism. DayOut cost is an estimated meal spend; confirm the current menu before visiting.', 'Restaurant', 'Orlando West', null, null, 220, 90, array['foodie', 'culture', 'romantic']::text[], null, true, true, false, null, 'https://www.sowetotourism.org.za/servicesproviders', current_date, true),

  ('Vuyo''s Restaurant', 'Local Orlando West restaurant listed by Soweto Tourism. DayOut cost is an estimated meal spend; confirm the current menu before visiting.', 'Restaurant', 'Orlando West', null, null, 200, 90, array['foodie', 'culture', 'chill']::text[], null, true, true, true, null, 'https://www.sowetotourism.org.za/servicesproviders', current_date, true),

  ('Wandies Place', 'Long-running Dube restaurant serving traditional township food to locals and visitors. DayOut cost is an estimated meal spend.', 'Restaurant', 'Dube', null, null, 200, 90, array['foodie', 'culture', 'hidden gems', 'family']::text[], null, true, true, false, null, 'https://www.sowetotourism.org.za/servicesproviders', current_date, true),

  ('KEK Restaurant', 'Local Mofolo North restaurant listed by Soweto Tourism. DayOut cost is an estimated meal spend; confirm the current menu before visiting.', 'Restaurant', 'Mofolo North', null, null, 180, 90, array['foodie', 'hidden gems', 'chill']::text[], null, true, true, true, null, 'https://www.sowetotourism.org.za/servicesproviders', current_date, true),

  ('Chez Alina', 'Independent Dobsonville restaurant listed by Soweto Tourism. DayOut cost is an estimated meal spend; confirm the current menu before visiting.', 'Restaurant', 'Dobsonville', null, null, 180, 90, array['foodie', 'hidden gems', 'chill']::text[], null, true, true, true, null, 'https://www.sowetotourism.org.za/servicesproviders', current_date, true),

  ('Smokeville', 'Local Orlando West food venue listed by Soweto Tourism. DayOut cost is an estimated meal spend; confirm the current menu before visiting.', 'Restaurant', 'Orlando West', null, null, 180, 90, array['foodie', 'nightlife', 'hidden gems']::text[], null, true, true, true, null, 'https://www.sowetotourism.org.za/servicesproviders', current_date, true),

  ('House No.2', 'Independent Orlando East restaurant listed by Soweto Tourism. DayOut cost is an estimated meal spend; confirm the current menu before visiting.', 'Restaurant', 'Orlando East', null, null, 180, 90, array['foodie', 'hidden gems', 'chill']::text[], null, true, true, true, null, 'https://www.sowetotourism.org.za/servicesproviders', current_date, true),

  ('Panyaza Braai & Pub', 'Soweto shisa-nyama and pub experience with a strong local social and nightlife atmosphere. DayOut cost is an estimated braai-and-drink spend.', 'Nightlife', 'White City', null, null, 180, 120, array['foodie', 'nightlife', 'culture', 'hidden gems']::text[], null, false, true, false, null, 'https://soweto.co.za/restaurants/', current_date, true),

  ('Everard Read / CIRCA Johannesburg', 'Rosebank galleries presenting modern and contemporary South African and African art. Entry is free to browse.', 'Gallery', 'Rosebank', null, null, 0, 60, array['artsy', 'chill', 'romantic']::text[], '{"monday":"09:00-17:00","tuesday":"09:00-17:00","wednesday":"09:00-17:00","thursday":"09:00-17:00","friday":"09:00-17:00","saturday":"09:00-13:00"}'::jsonb, true, true, false, null, 'https://www.everard-read.co.za/contact', current_date, true),

  ('Goodman Gallery Johannesburg', 'Contemporary art gallery in Parkwood with rotating exhibitions and African and international artists. Entry is free to browse.', 'Gallery', 'Parkwood', null, null, 0, 60, array['artsy', 'chill', 'hidden gems']::text[], '{"tuesday":"09:00-17:00","wednesday":"09:00-17:00","thursday":"09:00-17:00","friday":"09:00-17:00","saturday":"09:00-14:00"}'::jsonb, true, true, false, null, 'https://goodman-gallery.com/', current_date, true),

  ('The Living Room Jozi', 'Maboneng rooftop urban oasis with greenery, city views, food and events. DayOut cost allows for weekend entry plus a modest drink/snack.', 'Rooftop', 'Maboneng', null, null, 200, 120, array['romantic', 'chill', 'nightlife', 'hidden gems']::text[], '{"saturday":"11:00-22:00","sunday":"11:00-21:30"}'::jsonb, false, true, false, null, 'https://livingroomjozi.co.za/getaway/', current_date, true),

  ('Sci-Bono Discovery Centre', 'Interactive science centre in Newtown with hands-on exhibits for families, learners and curious adults.', 'Science', 'Newtown', null, null, 60, 150, array['family', 'artsy', 'chill']::text[], '{"monday":"09:00-16:30","tuesday":"09:00-16:30","wednesday":"09:00-16:30","thursday":"09:00-16:30","friday":"09:00-16:30","saturday":"09:00-16:30","sunday":"09:00-15:30"}'::jsonb, true, false, false, null, 'https://joburg.org.za/media_/Newsroom/Pages/2026-News-Articles/Joburg-boasts-SAs-biggest-family-friendly-science-centre.aspx', current_date, true),

  ('James Hall Museum of Transport', 'Large Johannesburg transport museum with historic vehicles and motoring exhibits. Entrance is free; donations are welcome.', 'Museum', 'La Rochelle', null, null, 0, 90, array['family', 'culture', 'hidden gems']::text[], '{"tuesday":"09:00-16:30","wednesday":"09:00-16:30","thursday":"09:00-16:30","friday":"09:00-16:30","saturday":"09:00-16:30","sunday":"09:00-16:30"}'::jsonb, true, false, true, null, 'https://www.jhmt.org.za/Open_Times.html', current_date, true),

  ('Mandela House', 'Museum in Nelson Mandela''s former Vilakazi Street home, preserving the history of his family and political journey.', 'Museum', 'Orlando West', null, null, 105, 60, array['culture', 'family']::text[], null, true, false, false, null, 'https://www.mandelahouse.com/', current_date, true),

  ('Hector Pieterson Memorial & Museum', 'Soweto museum and memorial documenting the 1976 student uprising and its legacy.', 'Museum', 'Orlando West', null, null, 33, 75, array['culture', 'family']::text[], null, true, false, false, null, 'https://joburg.org.za/documents_/Documents/ITEM_03C_ANNEXURE.pdf', current_date, true),

  ('Melville Koppies Central', 'Controlled-access Sunday hiking and heritage reserve with self-guided and guided routes.', 'Outdoors', 'Melville', null, null, 100, 150, array['outdoors', 'adventurous', 'hidden gems', 'chill']::text[], '{"sunday":"08:00-11:30"}'::jsonb, false, false, true, null, 'https://www.mk.org.za/', current_date, true),

  ('Klipriviersberg Nature Reserve', 'Large free Johannesburg nature reserve with hiking trails, wildlife, birding and cultural heritage.', 'Outdoors', 'Kibler Park', null, null, 0, 180, array['outdoors', 'adventurous', 'family', 'hidden gems']::text[], null, false, false, true, null, 'https://klipriviersberg.org.za/', current_date, true),

  ('Gold Reef City Theme Park', 'Johannesburg theme park with adult, family and thrill rides. Height restrictions apply.', 'Adventure', 'Ormonde', null, null, 295, 300, array['adventurous', 'family', 'outdoors']::text[], null, false, false, false, null, 'https://themeparktickets.goldreefcity.co.za/webstore/shop/viewItems.aspx?C=01&CG=01', current_date, true),

  ('Zoo Lake', 'Popular public park next to Johannesburg Zoo for picnics, walks, lake views and leisure activities.', 'Outdoors', 'Parkview', null, null, 0, 90, array['outdoors', 'chill', 'romantic', 'family']::text[], null, false, false, false, null, 'https://www.jhbcityparksandzoo.com/services-facilities/parks/find-a-park/zoo-lake', current_date, true),

  ('Northcliff Ridge Eco Park', 'Scenic high point with panoramic city views, paved walkways and popular sunset viewpoints.', 'Outdoors', 'Northcliff', null, null, 0, 75, array['outdoors', 'romantic', 'chill', 'hidden gems']::text[], null, false, false, true, null, 'https://visit.joburg/things-to-do/northcliff-ridge-eco-park/', current_date, true),

  ('Market Theatre', 'Historic Newtown theatre presenting contemporary South African drama, music, comedy and live performance. Ticket prices vary by production.', 'Theatre', 'Newtown', null, null, 180, 150, array['artsy', 'nightlife', 'culture', 'romantic']::text[], null, true, false, false, null, 'https://markettheatre.co.za/', current_date, true),

  ('Credo Mutwa Cultural Village', 'Free outdoor cultural museum in Soweto featuring sculptures, traditional buildings, gardens and African folklore.', 'Culture', 'Jabavu', null, null, 0, 90, array['culture', 'artsy', 'hidden gems', 'family']::text[], '{"monday":"08:00-18:00","tuesday":"08:00-18:00","wednesday":"08:00-18:00","thursday":"08:00-18:00","friday":"08:00-18:00","saturday":"08:00-18:00","sunday":"08:00-18:00"}'::jsonb, false, false, true, null, 'https://credomutwa.org/about/cultural-village/', current_date, true),

  ('Soweto Theatre', 'Jabulani performing-arts venue with theatre, music, festivals and community productions. Ticket prices vary by event.', 'Theatre', 'Jabulani', null, null, 150, 150, array['artsy', 'nightlife', 'culture', 'family']::text[], null, true, false, false, null, 'https://www.sowetotheatre.com/', current_date, true)
) as v(
  name, description, category, area,
  latitude, longitude,
  estimated_cost_per_person, duration_minutes, vibes,
  opening_hours, indoor, local_business, hidden_gem,
  image_url, source_url, last_verified, is_active
)
where not exists (
  select 1
  from public.places p
  where lower(p.name) = lower(v.name)
    and lower(p.area) = lower(v.area)
);

update public.places
set last_verified = current_date
where is_active = true
  and name in (
    'Wits Art Museum',
    'Apartheid Museum',
    'Constitution Hill',
    'Johannesburg Zoo',
    'Johannesburg Botanical Garden',
    'Victoria Yards',
    'Origins Centre',
    'Rosebank Sunday Market',
    '44 Stanley'
  );
