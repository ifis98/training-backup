

# Fix Owner Dashboard routing + Codes Used metric

## Issue 1 — "Owner Dashboard" tab shows the Staff view

**Root cause:** The `DashboardSwitcher` "Owner Dashboard" button navigates to `/`, which renders `<Index />` with no `forceView`. `Index` then auto-picks Staff vs Owner based on the user's roles. Super-users (`nbc1079`, `john@`, etc.) only have the `bytesense_admin` role — so they technically fall through to the owner `Dashboard`, but because they have no `practice_id`/no goals, it can look ambiguous, and any future role change (e.g. adding `staff`) silently flips them to Staff. The switcher should be explicit, not role-derived.

**Fix:**
1. **`src/pages/Index.tsx`** — extend `forceView` to accept `"owner"` as well, and when `forceView==="owner"` always render `<Dashboard ... />` regardless of roles.
2. **`src/App.tsx`** — add a new route `/owner` that renders `<Index forceView="owner" />` (mirror of the existing `/staff` route).
3. **`src/components/DashboardSwitcher.tsx`** — change the "Owner Dashboard" item's path from `/` to `/owner`, and update the active-match check so the highlight still works.

This makes each switcher entry deterministically map to one dashboard, independent of which roles the super-user happens to hold.

## Issue 2 — "Codes Used (30d)" shows 0 even though John is on the platform

**Root cause:** The KPI counts only rows in `registration_codes` where `status = 'used'`. ByteSense staff (anyone with an `@bytesense.ai` email) are auto-promoted to `bytesense_admin` by the `auto_assign_bytesense_admin` DB trigger when their profile is created — they never go through `use_registration_code`, so no code is consumed. Verified in the DB: all 4 existing codes are still `active`, `used_by` is `null` for every row, and `john@bytesense.ai` exists with the `bytesense_admin` role but no consumed code.

So the count is technically correct but misleading. Two complementary fixes:

**Fix:**
1. **Relabel + clarify the existing tile** in `src/pages/ByteSenseAdmin.tsx`:
   - Rename "Codes Used (30d)" → **"Practice Codes Used (30d)"** with a small helper line: "ByteSense staff bypass code redemption."
2. **Add a second tile next to it: "ByteSense Staff"** — count of users with the `bytesense_admin` role (already loaded via `adminRolesRes` for the Settings tab; just expose the count to the KPI row).
3. **Recent Activity feed** — also push a "ByteSense staff joined: <email>" event for each `bytesense_admin` profile (using `profiles.created_at`), so John/Natasha/Majid show up in the activity stream.

## Files changed

1. `src/pages/Index.tsx` — accept `forceView="owner"`; render `<Dashboard />` when set.
2. `src/App.tsx` — add `<Route path="/owner" element={<Index forceView="owner" />} />`.
3. `src/components/DashboardSwitcher.tsx` — point "Owner Dashboard" at `/owner`; fix active-match.
4. `src/pages/ByteSenseAdmin.tsx` — rename Codes Used tile + helper text, add ByteSense Staff KPI tile, include staff joins in Recent Activity, also load admin profile `created_at`.

No database migration needed.

