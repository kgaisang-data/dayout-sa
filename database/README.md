# DayOut database (Supabase)

DayOut uses Supabase for the Johannesburg places catalogue, authentication and user-owned saved plans.

## Tables

| Table | Purpose | Access model |
|---|---|---|
| `places` | Verified Johannesburg pilot venues and experiences | `anon` and `authenticated` may read active places only. No public insert/update/delete policy is provided. |
| `saved_plans` | JSON snapshots of plans saved by signed-in users | Each authenticated user may only read, insert, update and delete their own rows. |

Both public tables have Row Level Security (RLS) enabled.

## Environment variables

Create `web/.env.local` locally:

```text
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Never commit `.env.local`. The publishable key may be used by the browser together with RLS. Never expose a Supabase service-role or secret key in client code.

## Rebuilding a clean database

Run these SQL files in order against a **new** Supabase project. The team production project already contains the schema/data, so do not blindly re-run schema files there.

| Order | File | Purpose |
|---:|---|---|
| 1 | `schema/001_create_places.sql` | Creates `places` and the active-place read policy |
| 2 | `schema/002_create_saved_plans.sql` | Creates `saved_plans` and owner-only policies |
| 3 | `schema/003_performance_indexes.sql` | Adds indexes and basic data-integrity constraints |
| 4 | `schema/004_least_privilege_grants.sql` | Restricts Data API roles to the minimum table operations DayOut needs |
| 5 | `seed/001_seed_places.sql` | Seeds Wits Art Museum |
| 6 | `seed/002_seed_jhb_places.sql` | Repaired original Johannesburg pilot seed |
| 7 | `seed/003_update_vibes.sql` | Normalises legacy vibe tags |
| 8 | `seed/004_expand_jhb_places.sql` | Expands the verified Johannesburg pilot |
| 9 | `tests/001_rls_places_checks.sql` | Manual anon RLS checks |
| 10 | `tests/002_security_and_data_checks.sql` | Read-only data/security summary checks |

## Current pilot conventions

- `estimated_cost_per_person` is Rand per person. Planner budget is the total group budget.
- Prices described as **DayOut estimates** are planning allowances for variable spend such as meals, drinks or shopping; they are not guaranteed venue prices.
- `duration_minutes` and transfer estimates are minutes.
- Planner-facing vibes are lowercase (`chill`, `foodie`, `artsy`, `outdoors`, `adventurous`, `romantic`, `family`, `nightlife`, `hidden gems`, `culture`).
- `opening_hours` is optional JSON. A missing value means DayOut has not modelled opening times for that record yet; users should confirm before travelling.
- `source_url` and `last_verified` are used to make data traceable.
- `local_business` indicates local/independent economic activity such as small businesses, markets, locally operated tours and similar experiences.
- `hidden_gem` is an editorial discovery tag, not a quality score.
- Latitude/longitude remain optional. Google Maps route links currently use place names/areas where coordinates are absent.

## Production data verification

See `docs/data-verification.md` for the current researched Johannesburg pilot, its source URLs and price basis. The expanded pilot intentionally gives strong representation to local businesses so DayOut demonstrates its Street Economy focus.

## Security model

- `places`: `anon`/`authenticated` receive SELECT only, and RLS limits that read to active rows.
- `saved_plans`: `anon` receives no table privileges; `authenticated` receives SELECT/INSERT/UPDATE/DELETE, with owner-only RLS via `(select auth.uid()) = user_id`.
- `saved_plans.user_id` has a supporting index for the ownership filter.
- Supabase publishable credentials stay in environment variables; service-role/secret credentials are not used in browser code.
- API routes validate budget, group size, available time, vibe count and location length before generating plans.
