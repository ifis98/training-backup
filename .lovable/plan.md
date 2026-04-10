

# Fix Language Translations in Dashboard + Staff Dashboard

## Problem

The language switcher works (it updates `s.lang` in state), but the recently redesigned dashboards have ~30+ hardcoded English strings that bypass the `T()` translation function. When you switch to Spanish, only the strings that use `T()` update — the new KPI cards, chart labels, revenue calculator, goals/notes, and section headers stay in English.

## What to Fix

### 1. Add ~30 new translation keys to `src/data/translations.ts`

New keys needed for all 5 languages (en, es, pt, fr, zh):

- `kpi_training_progress`, `kpi_xp_earned`, `kpi_experience_points`, `kpi_modules_done`, `kpi_of_total`, `kpi_ai_simulations`, `kpi_patient_encounters`
- `modules_by_phase`, `staff_training_progress`, `overall_completion`, `complete_label`
- `training_modules_label`
- `revenue_calculator`, `patients_per_month`, `avg_case_price`, `current_close_rate`, `current_monthly`, `with_bytesense`, `projected_close`, `potential_uplift`
- `goals_label`, `notes_label`, `add_goal_placeholder`, `notes_placeholder`
- `done_label`, `remaining_label`
- Staff-specific: `kpi_progress`, `kpi_points_earned`, `kpi_baseline`, `kpi_initial_score`, `kpi_simulations`, `kpi_completed`

### 2. Update `src/screens/Dashboard.tsx`

Replace all hardcoded English strings with `T("key")` calls. Approximately 25 replacements across KPI cards, chart titles, revenue calculator labels, goals/notes headers, and inline text.

### 3. Update `src/screens/StaffDashboard.tsx`

Same treatment — replace hardcoded KPI card labels, chart titles, section headers with `T()` calls. Approximately 10 replacements.

### 4. Fix ResponsiveContainer warning

The console shows `ResponsiveContainer` warnings for the PieChart (lines 225-231 in Dashboard). Replace `<ResponsiveContainer width={180} height={180}>` with a plain `<div>` wrapper since fixed dimensions don't need ResponsiveContainer.

## Files Changed

1. `src/data/translations.ts` — Add ~30 new keys across all 5 languages
2. `src/screens/Dashboard.tsx` — Replace hardcoded strings with `T()` calls + fix ResponsiveContainer
3. `src/screens/StaffDashboard.tsx` — Replace hardcoded strings with `T()` calls

