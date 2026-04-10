

# Case Analytics Charts + Practice Goals Editor + Training Complete Button Fix

## Changes

### 1. Practice Goals Editor (Dashboard.tsx)
Add an inline editor in the Practice Performance section that lets owner/managers set and save `monthly_case_goal` and `monthly_revenue_goal` directly. Shows edit icon next to goal values; clicking opens small inline inputs that save to the `practice_goals` table via upsert.

### 2. Case Analytics Charts (Dashboard.tsx)
Add two new charts below the Case Pipeline section (owner/manager only):
- **Conversion Rate Over Time** — AreaChart showing monthly conversion rate (converted / total cases per month)
- **Revenue Trend by Month** — BarChart showing monthly case revenue from converted cases

Both charts derive data from the existing `cases` state, grouped by month using `created_at`.

### 3. "Training Complete" Banner → Clickable Button (Dashboard.tsx + StaffDashboard.tsx)
Line 653-657: The static div saying "Training Complete! Start AI simulations above" becomes a clickable button that navigates to the simulation phase (`u({ phase: "simulation" }); scrollTop()`). Same treatment in StaffDashboard.

### 4. End-to-End Testing
After implementation, browser-test:
- Sidebar navigation (each item, collapse/expand)
- Chart tooltip hover (no white box)
- Logo click → dashboard
- Training Complete button → simulation
- Practice goals editing
- Login persistence (name/practice remembered)

## Files changed
1. `src/screens/Dashboard.tsx` — goals editor UI, analytics charts, training complete button fix
2. `src/screens/StaffDashboard.tsx` — training complete button fix
3. `src/data/translations.ts` — new keys for goals editing and chart labels

## Implementation order
1. Fix training complete banner → clickable button (both dashboards)
2. Add practice goals inline editor
3. Add case analytics charts
4. Add translation keys
5. Browser testing

