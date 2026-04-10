
# Dashboard Corrections + Simulation-Driven Recommendations + Persistent Reports

## What I found
- The dashboard/staff dashboard still do not have a sidebar.
- The “Overall Completion” donut still uses negative margins, which is why the % text/label overlaps the graphic.
- Recommendations and improvement tips are currently based only on incomplete modules, not on simulation results.
- Simulation summaries are generated on-screen only and are not saved, so they cannot currently power dashboard recommendations or a later full review report.
- The final report exists as its own screen and is printable there, but it is not surfaced from the dashboards unless the user is on the completion banner flow.
- Certificate/badge display next to the user name has not been added.

## Implementation plan

### 1. Persist simulation review results
Create backend support so every completed simulation summary is saved and can be reused later.

**Backend changes**
- Add a new table for simulation reviews/history, keyed by user id.
- Store:
  - simulation number / session
  - score
  - score label
  - strengths
  - improvements
  - tips
  - modules to review
  - overall feedback
  - timestamps
- Add RLS so:
  - users can read their own reviews
  - practice admins can read reviews for their practice team
  - ByteSense admins can read all reviews

**Why**
This is required for recommendations to come from actual simulation outcomes instead of guessed module gaps.

### 2. Make recommendations and improvement areas simulation-driven
Refactor recommendation logic so dashboard guidance is primarily based on saved simulation review results.

**Logic changes**
- Update helper functions to use latest simulation reviews first.
- Map `modulesToReview`, `improvements`, and low simulation scores into ranked recommendations.
- Keep incomplete-module fallback only when no simulation review exists yet.
- Generate “areas needing improvement” from repeated simulation weaknesses, with tips pulled from the saved review plus matching phase/module content.

**Expected behavior**
- After each simulation, the dashboard updates with smarter next steps.
- Weak performance in objection handling, product explanation, etc. points the user to the right training modules.

### 3. Surface full review report from the dashboard
Make the full review report accessible from the dashboard at any time once earned.

**UI changes**
- Add a “View Full Report” / “Print Report” card or action in both dashboards.
- When training is complete, users can reopen the report without relying on the completion banner.
- Include direct print access from dashboard entry points.
- If signed, the certificate remains printable from the report flow.

### 4. Add earned certificate badges next to the user name
Show earned badges in the dashboard header beside the user’s identity.

**Initial badge rules**
- Certified Advisor: user completed all modules + simulations and signed report
- Top Performer: existing XP-based threshold already present in report logic
- Optionally reserve space for future badges without changing layout later

This will use existing milestones rather than inventing new certificate rules.

### 5. Fix the “Overall Completion” graphic overlap correctly
Replace the current hacked layout with a proper chart wrapper.

**UI fix**
- Wrap the donut chart in a `position: relative` container
- Center the percentage and label absolutely inside the donut
- Remove negative margins entirely
- Apply the same fix to both owner and staff dashboards

This addresses the exact overlap issue you called out.

### 6. Add a real sidebar to both dashboards
Implement a shared collapsible sidebar using the existing sidebar component already in the codebase.

**Sidebar contents**
- Dashboard
- Training Modules
- AI Simulations
- AI Coach / Quick Tools
- Report & Certificates
- Settings / Language / Sign out

**Design**
- Premium dark glass look matching the rest of the new dashboard aesthetic
- Collapsible with a visible trigger so it never traps the user
- Shared component reused by owner and staff dashboards

### 7. Improve report quality using simulation history
Enhance the final report so it reflects actual simulation performance, not just completion counts.

**Report additions**
- Include aggregate simulation score or average score
- Add simulation strengths / areas to improve summary
- Show recommended review modules sourced from saved simulation reviews
- Preserve print formatting

## Files likely to change
- `supabase/migrations/...` — new simulation review table + RLS
- `src/integrations/supabase/types.ts` — auto-generated after schema change
- `src/hooks/useAppState.ts` — load report/review access state as needed
- `src/lib/helpers.ts` — recommendation + improvement logic refactor
- `src/screens/SimulationSummary.tsx` — save structured review results
- `src/screens/Dashboard.tsx` — sidebar, badge row, report access, chart fix
- `src/screens/StaffDashboard.tsx` — sidebar, badge row, report access, chart fix
- `src/screens/Report.tsx` — richer simulation-based report content
- `src/components/ByteSenseLogo.tsx` — if needed for dashboard navigation
- `src/components/DashboardSidebar.tsx` — new shared sidebar component
- `src/data/translations.ts` — new labels for sidebar, badges, report actions

## Technical notes
- I would not keep this in localStorage only, because simulation-driven recommendations and report access should persist across sessions/devices.
- I will follow the existing role model and RLS patterns already in the project.
- The current auto-admin domain function exists, but the database context shows the trigger itself is still missing; that is separate from this dashboard work and can be corrected in implementation if it blocks testing.

## Implementation order
1. Add simulation review persistence
2. Save results from `SimulationSummary`
3. Refactor recommendation/improvement logic to use simulation data
4. Fix donut chart overlap
5. Add shared sidebar
6. Add report access + print entry points on dashboards
7. Add earned certificate badges in header
8. Expand report with simulation-based review sections
