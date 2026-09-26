# DayOut database (Supabase)

Owner: Person 2 (Database / Supabase / Auth)

## Tables

| Table | Purpose | Who can access |
|---|---|---|
| `places` | Johannesburg pilot venues | Everyone can **read** active places. Nobody can add, edit or delete through the app. |
| `saved_plans` | Plans saved by logged-in users | Each user can only read, add, edit and delete **their own** plans. Guests have no access. |

Both tables have Row Level Security (RLS) turned on.

## Local setup

1. Ask Person 2 to add you to the Supabase project, or get the Project URL and publishable key from them.
2. Create `web/.env.local` with:

```text
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

3. Restart the app: `npm run dev` inside `web`.
4. Check the connection at `http://localhost:3000/supabase-test`. You should see the list of places.

**Never commit `.env.local`, and never use the `service_role` / secret key in the app.**

## SQL files (run in order in Supabase SQL Editor as `postgres`)

| File | What it does |
|---|---|
| `schema/001_create_places.sql` | Creates `places` and its read-only policy |
| `schema/002_create_saved_plans.sql` | Creates `saved_plans` and user-only policies |
| `seed/001_seed_places.sql` | Adds Wits Art Museum |
| `seed/002_seed_jhb_places.sql` | Adds `source_url` column and 9 more places |
| `seed/003_update_vibes.sql` | Matches vibe tags to the planner options |
| `tests/001_rls_places_checks.sql` | Security tests (run as `anon`) |

These have already been run on the team project. Only run them on a **new** Supabase project.

## Data conventions

- `estimated_cost_per_person` is in **Rand, per person**. The planner's `budget` is the **total for the group**.
- Durations and travel times are in **minutes**.
- Vibes are stored **lowercase**: `chill`, `foodie`, `artsy`, `outdoors`, `hidden gems`, `family`, `romantic`, `culture`. Compare using `.toLowerCase()`.
- `opening_hours` is JSON, e.g. `{"saturday":"09:00-15:00"}`. A missing day means closed.
- Each place has a `source_url` and `last_verified` date. Costs marked ESTIMATE in the description are planning guesses, not official prices.
- Latitude and longitude are not filled in yet.

## Auth

- Login: `/auth/login`, sign-up: `/auth/sign-up`
- Guests can use the planner, results and itinerary pages.
- `/saved` requires login (see `web/lib/supabase/proxy.ts`).
- "Save this plan" button: `web/components/save-plan-button.tsx`