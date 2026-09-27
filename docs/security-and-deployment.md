# DayOut Security, Scalability and Deployment Notes

## Security controls

- Supabase Row Level Security is enabled on both public application tables.
- Guests and signed-in users may read only active rows from `places`.
- `saved_plans` is owner-isolated with policies based on `(select auth.uid()) = user_id`.
- The web app uses only Supabase project URL + publishable key via environment variables.
- `.env.local` is ignored by Git; service-role/secret keys are not required in the browser.
- Recommendation requests validate location, group budget, group size, available time and vibe count server-side.
- Table grants follow least privilege: `places` is SELECT-only for `anon`/`authenticated`; `saved_plans` is unavailable to `anon` and exposes only SELECT/INSERT/UPDATE/DELETE to `authenticated`, with RLS enforcing ownership.
- Shared/login return paths are restricted to internal paths to avoid open redirects.
- Database constraints reject negative venue costs, invalid duration values and invalid coordinate ranges.

### Remaining live-project actions

- Apply `database/schema/004_least_privilege_grants.sql` to the live Supabase project so its currently broad default table grants match the repository hardening.
- Supabase's security advisor currently reports **Leaked Password Protection Disabled**. Enable this in Supabase Auth password-security settings before final production submission if password authentication is enabled.
- Re-run Supabase security/performance advisors after the grant migration. Newly created indexes may initially appear as unused until real traffic exercises them.

## Recommendation scalability

The browser does not receive the entire place catalogue for recommendation generation. `/api/recommendations` validates the request and asks Supabase for a bounded candidate pool. The query filters:

1. `is_active = true`
2. selected neighbourhood where useful
3. a maximum affordable cost per person (`group budget / group size`)
4. a bounded result count

The server-side rules engine then scores the smaller set for vibe, budget, starting area, local-business relevance and hidden-gem relevance. Database indexes support area, cost, vibes, local-business and hidden-gem lookups.

For future larger deployments, this architecture can add geographic/radius filtering, caching of common queries, real route-time calculation and behavioural ranking without changing the planner interface.

## Deployment workflow

1. Feature work is completed and reviewed on feature branches.
2. Stable features merge to `develop`.
3. Run lint/build/security tests locally.
4. Deploy a Vercel preview from the integrated branch and test the complete user journey.
5. Configure Supabase environment variables in Vercel rather than committing `.env.local`.
6. Merge the tested version to `main` for production.
7. Re-test planner, recommendations, itinerary, maps link, authentication, save/delete and account navigation on the public URL.

## MVP limitations disclosed to users

- Venue prices and variable food/shopping spends are planning estimates unless labelled as official rates.
- DayOut currently uses a fixed transfer allowance between stops; it does not claim live traffic data.
- Opening-hour data is not yet used to schedule by calendar day, so venue availability should be confirmed before travel.
- The Johannesburg catalogue is a curated pilot rather than nationwide coverage.
