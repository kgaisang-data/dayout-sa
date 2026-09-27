# Person 3 — Recommendations, itinerary integration and maps

## Current flow

`/plan` sends location, total group budget, group size, available time and vibes to `/results`.

`/results` now calls `POST /api/recommendations`. The API validates the request, loads a bounded set of active places from Supabase and sends those places into the rules-based recommendation engine.

The engine produces up to three distinct plans:

- **Local & Easy** — prioritises vibe matches, starting area and local businesses.
- **Best on a Budget** — prioritises free and lower-cost places.
- **Hidden Gems** — prioritises `hidden_gem` and `local_business` records.

Every plan must remain within the user's total group budget and available time. Venue cost is calculated as `estimated_cost_per_person × groupSize`. A temporary 15-minute transfer allowance is added between stops.

`/results` passes the selected plan ID, all planner preferences and the ordered database place IDs to `/itinerary`.

`/itinerary` reloads those active places from Supabase through `/api/places`, keeps the same ordering, recalculates totals with the shared recommendation helpers, and passes the real planner input and current stop list to `SavePlanButton`.

## Swap behaviour

Swap uses real active Supabase places. It excludes places already used in the itinerary and scores alternatives using category similarity, vibe overlap, starting area, local-business status, hidden-gem status and price similarity. A replacement is only accepted if the updated itinerary still fits the original budget and available time.

The current URL is updated with the replacement place IDs so a copied/shared itinerary link reflects swapped stops.

## Maps

The itinerary builds a Google Maps Directions URL from the selected place names and areas. No Google Maps API key is required for this route link. DayOut does **not** claim that the current transfer-time estimate is live traffic data.

## Security

- Supabase values are read from environment variables and are not hard-coded.
- `.env.local` is ignored by Git.
- Only the publishable Supabase key is used by the app.
- Privileged/service-role credentials must never be exposed client-side.
- Recommendation inputs are validated server-side before querying Supabase.
- Active places are read under the existing Row Level Security policy.
- Database errors are logged server-side while the user receives a generic error message.

## Scalability approach

The current Johannesburg pilot is intentionally small, but recommendation generation already runs behind a server API instead of scoring hard-coded browser data. For a neighbourhood request, the places loader first tries to reduce the candidate set at database level and falls back to the Johannesburg pilot set when there are too few records.

As the dataset grows, the same design can be extended with stronger database filters (area, category, price, availability), indexes, pagination, caching of common searches and a dedicated server-side ranking service. This avoids loading a very large places table into the browser for every user.

## MVP testing

Test at minimum:

1. Johannesburg, R800, 4 people, 360 minutes, Chill + Foodie.
2. Johannesburg, R300, 4 people, 360 minutes, Chill.
3. Johannesburg, R1000, 2 people, 180 minutes, Artsy.
4. Hidden Gems + Artsy with a larger budget.
5. An intentionally restrictive request such as R100, 10 people, 180 minutes, Foodie.

For every returned plan verify that total cost is not above budget, total duration is not above available time, results and itinerary show the same stops, and saving stores the real preferences and current stops.

## Deployment checklist

For the final hackathon build, deploy the Next.js app through Vercel and configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the Vercel project environment settings rather than uploading `.env.local`.

Test the full deployed flow before production submission: planner → results → itinerary → login/save → saved plans, plus low-budget/no-match cases and mobile layout.
