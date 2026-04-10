

# Dashboard Overhaul: Charts, Revenue Calculator, Enhanced Demo Form

This is a large feature set. Here's the plan broken into clear deliverables.

## 1. Owner Dashboard Redesign (`src/screens/Dashboard.tsx`)

Transform from a simple checklist into a dark-themed analytics dashboard inspired by the reference image, using ByteSense brand colors (red #CC1010, teal #14B8A6, gold #C9A84C, dark #0C0C0E).

**Top KPI Cards Row** (4 cards with glowing borders):
- Training Progress % (radial/circular gauge)
- XP Earned (big number + sparkline)
- Modules Completed (fraction + mini bar)
- Sim Patients Completed (count/3)

**Charts Section** (using `recharts`, already available via chart.tsx):
- **Staff Training Progress** — Bar chart showing each staff member's completion % (fetched from `training_progress` table joined with `profiles`)
- **Modules by Phase** — Donut/pie chart showing distribution of completed vs remaining modules per phase
- **Weekly Activity** — Area chart showing XP earned over time (will need a simple localStorage-based activity log or derive from training_progress timestamps)

**Existing Content** preserved below charts:
- Phase/module checklist (collapsed into an accordion to save space)
- AI Simulation section
- Quick Tools grid
- Quick Reference

**New Sections**:
- **Revenue Calculator** (owner/office manager only) — interactive widget with sliders: number of patients/month, average case price, close rate %. Shows projected monthly/annual revenue with a bar chart comparison (current vs projected with ByteSense)
- **Goal Setting & Tracking** — simple localStorage-persisted goals (e.g., "Complete training by [date]", "Submit 10 cases this month") with progress indicators
- **Notes** — localStorage-persisted notes area for the owner

## 2. Staff Dashboard Redesign (`src/screens/StaffDashboard.tsx`)

Similar visual treatment but focused on individual metrics:
- Personal KPI cards (XP, modules done, baseline score, sim patients)
- Personal progress donut chart
- Module completion timeline (bar chart by phase)
- Training checklist (existing, restyled)
- Quick Tools + Quick Reference (existing)

No revenue calculator for staff.

## 3. Admin Dashboard Enhancement (`src/pages/AdminDashboard.tsx`)

Add charts to the practice admin view:
- Staff completion bar chart (already has the data)
- Overall practice training metrics as KPI cards
- Keep existing staff management and invitation features

## 4. Revenue Calculator on Landing Page (`src/pages/Welcome.tsx`)

Add an interactive revenue calculator section before the CTA:
- Sliders: patients/month, case price, close rate
- Shows current revenue vs projected with ByteSense (assumes improved close rate)
- Dark themed, matches existing Welcome page style

## 5. Enhanced Demo Request Form (`src/pages/Welcome.tsx` or new modal)

Expand the demo request flow to a full-screen multi-step form collecting:
- Practice name, contact info (existing)
- Number of operatories
- Current monthly patient volume
- Current night guard sales per month + average price
- Do they have an intraoral scanner? If yes, which one?
- What are their goals with ByteSense? (checkboxes: increase case acceptance, add revenue stream, improve patient education, etc.)
- What they hope to achieve (free text)

This data goes into the existing `demo_requests` table — will need a migration to add new columns: `operatories`, `monthly_patients`, `current_guards_per_month`, `guard_price`, `has_scanner`, `scanner_type`, `goals`, `practice_size`.

## 6. Database Migration

Add columns to `demo_requests`:
```sql
ALTER TABLE demo_requests ADD COLUMN operatories integer DEFAULT 0;
ALTER TABLE demo_requests ADD COLUMN monthly_patients integer DEFAULT 0;
ALTER TABLE demo_requests ADD COLUMN guards_per_month integer DEFAULT 0;
ALTER TABLE demo_requests ADD COLUMN guard_price numeric DEFAULT 0;
ALTER TABLE demo_requests ADD COLUMN has_scanner boolean DEFAULT false;
ALTER TABLE demo_requests ADD COLUMN scanner_type text DEFAULT '';
ALTER TABLE demo_requests ADD COLUMN goals text[] DEFAULT '{}';
ALTER TABLE demo_requests ADD COLUMN practice_size text DEFAULT '';
```

## Files Changed

1. **`src/screens/Dashboard.tsx`** — Full redesign with dark theme, KPI cards, charts (recharts), revenue calculator, goals, notes
2. **`src/screens/StaffDashboard.tsx`** — Visual overhaul with personal charts and KPI cards
3. **`src/pages/AdminDashboard.tsx`** — Add staff completion charts and KPI summary
4. **`src/pages/Welcome.tsx`** — Add revenue calculator section + enhanced demo request form (full-screen modal)
5. **`src/data/translations.ts`** — New keys for all dashboard labels, revenue calculator, demo form
6. **`src/data/constants.ts`** — Possibly add chart color palette constants
7. **Database migration** — Add new columns to `demo_requests`

## Technical Notes

- Charts use `recharts` (already imported via `src/components/ui/chart.tsx`)
- Revenue calculator is pure client-side math, no backend needed
- Goals and notes stored in localStorage (key `bsa6_goals`, `bsa6_notes`) for simplicity
- Staff training data for owner charts fetched from `training_progress` + `profiles` tables via existing RLS policies
- Demo form data persisted to `demo_requests` table (existing anon INSERT policy works)

## Implementation Order

1. Database migration (demo_requests columns)
2. Dashboard.tsx redesign with charts + revenue calculator
3. StaffDashboard.tsx visual overhaul
4. AdminDashboard.tsx chart additions
5. Welcome.tsx revenue calculator + enhanced demo form
6. Translation keys

