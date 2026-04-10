

# Dashboard Fixes + Persistent User Identity + Select Styling

## Issues identified

1. **Donut chart overlap** — The StaffDashboard uses `ResponsiveContainer` with fixed dimensions wrapping PieChart (line 343), causing the % text to be pushed behind the ring. Dashboard.tsx (line 400-410) already has the correct fix (no ResponsiveContainer, just `PieChart width/height` directly). StaffDashboard needs the same treatment.

2. **No sidebar on dashboards** — The `DashboardSidebar` component exists and is already rendered in both dashboards. Need to verify it's actually showing. Looking at the code, it IS rendered at line 192 of Dashboard.tsx. The issue may be that the sidebar component is there but something visual is wrong — will inspect and fix.

3. **White tooltip box on chart hover** — The Recharts `<Tooltip>` has a `contentStyle` with dark background, but Recharts wraps it in its own container with a default white background. Need to add `wrapperStyle` or set `cursor` styling to prevent the white box.

4. **ByteSense logo → dashboard** — Already implemented in Dashboard.tsx (line 200). Need to also wire it in other screens (ModuleView, Simulation, SimulationSummary, Report, etc.) via the Logo component's onClick.

5. **Practice Size dropdown white-on-white** — The `<select>` in Welcome.tsx has `color: C.white` but `<option>` elements inherit browser defaults (white background + dark text is fine, but the select dropdown itself shows white text on white background in some browsers). Fix: add explicit styling for option elements.

6. **User must re-enter name/practice on every login** — The Splash screen always shows when `phase === "splash"`. On login, the app loads from localStorage or DB, but name/practice are only stored in localStorage (not in `training_progress` table). When a user logs in on a new device or clears cache, they lose name/practice. Fix: persist `name` and `practice` to the database alongside other training progress fields, and load them back on mount. Also, if a profile has `full_name` in the profiles table, use that to pre-populate and skip splash when the user is already authenticated with progress.

## Changes

### 1. `src/hooks/useAppState.ts`
- Add `name` and `practice` to the DB sync payload (save to `training_progress` or load from `profiles.full_name`)
- On mount, if user is authenticated and has DB progress with name/practice, restore those and skip splash → go to dashboard
- Load `full_name` from profiles table as fallback for name

### 2. `src/screens/Dashboard.tsx`
- Fix tooltip: add `wrapperStyle={{ outline: 'none' }}` and `cursor={{ fill: 'transparent' }}` to all `<Tooltip>` components to prevent white box on hover

### 3. `src/screens/StaffDashboard.tsx`
- Fix donut chart: replace `<ResponsiveContainer width={160} height={160}>` wrapper around PieChart with direct `<PieChart width={160} height={160}>` (matching Dashboard.tsx fix)
- Fix tooltip: same white-box fix as Dashboard

### 4. `src/pages/Welcome.tsx`
- Fix `<select>` Practice Size dropdown: add explicit option styling and set `color` on option elements. Use brand colors (C.red for accent, C.dark for backgrounds). Also add `colorScheme: "dark"` CSS property to the select to get dark dropdown in browsers that support it.

### 5. `src/pages/Index.tsx`
- Ensure Logo onClick navigates to dashboard from all screens (already done in Dashboard headers; need to verify other screens pass the prop)

### 6. Database migration
- Add `name` and `practice` text columns to `training_progress` table so user identity persists across sessions/devices

## Files changed
1. `supabase/migrations/...` — add name/practice columns to training_progress
2. `src/hooks/useAppState.ts` — persist and restore name/practice from DB, auto-skip splash for returning users
3. `src/screens/Dashboard.tsx` — fix chart tooltip white box
4. `src/screens/StaffDashboard.tsx` — fix donut chart ResponsiveContainer + tooltip white box
5. `src/pages/Welcome.tsx` — fix select dropdown styling with brand colors

