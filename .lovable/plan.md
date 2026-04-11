

# Fix Practice Goals Save + Add Daily Breakdown Insight

## Problem 1: Save button doesn't work
The RLS policy on `practice_goals` requires `has_role(auth.uid(), 'admin')` — checking the `user_roles` table. But practice owners never get an `admin` row inserted into `user_roles` during registration. Only `bytesense_admin` exists. The save silently fails because the upsert is rejected by RLS.

**Fix**: When a user creates a practice (becomes owner), automatically insert an `admin` role into `user_roles`. Also add a database migration to backfill existing practice owners who are missing the role. Additionally, add error handling in `handleSaveGoals` so failures are surfaced via a toast instead of silently swallowed.

## Problem 2: Add daily breakdown insight line
After setting goals (e.g., 20 cases at $650), show a motivational breakdown line below the goals:

> "That's just 1 case per day (5-day work week × 4 weeks) at $650 each = $13,000/mo in added revenue"

The math: `casesPerDay = Math.ceil(caseGoal / 20)` (20 working days per month). Revenue = `caseGoal × pricePerCase`. Show this both in edit mode (live preview) and in the static display when goals are saved.

## Files changed
1. **Database migration** — backfill `admin` role for existing practice owners; add a trigger on `practices` insert to auto-assign `admin` role to the owner
2. **`src/screens/Dashboard.tsx`** — add error toast on save failure; add daily breakdown insight text below the goals editor and below the static KPI display
3. **`src/data/translations.ts`** — add key for the breakdown text template

## Implementation order
1. Database migration (backfill + trigger)
2. Add error handling to `handleSaveGoals`
3. Add daily breakdown insight line
4. Add translation keys

