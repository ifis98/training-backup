

# Dashboard Professional Upgrade + Case Tracking + Revenue Goals

## What's being added

### 1. Case Tracking Section (new)
A "Case Pipeline" section on the owner/manager dashboard showing cases that need follow-up, converted cases, and rejected cases. This requires a new database table `cases` with fields: `id`, `user_id`, `practice_id`, `patient_name`, `status` (follow_up, converted, rejected, pending), `notes`, `assigned_to`, `value`, `created_at`, `updated_at`. Staff can log and update case statuses. The dashboard renders a filterable table/card view with status tabs (All, Follow-Up, Converted, Rejected) and counts.

### 2. Practice Goals vs Actuals (new)
At the top of the dashboard, add a "Practice Performance" row showing:
- **Goal cases/month** vs **Actual cases completed** (progress bar + numbers)
- **Revenue target** vs **Actual revenue** (with green/red indicator)
- These use the `cases` table data + a `practice_goals` table (`id`, `practice_id`, `monthly_case_goal`, `monthly_revenue_goal`, `created_at`, `updated_at`)

### 3. Full Visual Upgrade
Replace remaining emoji icons with Lucide outline icons throughout both dashboards. Clean up visual noise:
- Replace 🎯, 📊, 📋, 📝, ⚡, 💰, 📄, 🏆, ✉️, 🛡️, 📚 with matching Lucide icons (Target, BarChart3, ClipboardList, StickyNote, Zap, DollarSign, FileText, Trophy, Mail, Shield, BookOpen)
- Replace emoji badge indicators (🏅, ⭐) with Lucide Award/Star icons
- Consistent icon sizing (16-18px), strokeWidth 1.5, white/brand colors
- Apply same clean treatment to Quick Tools grid, Goals & Notes section, Revenue Calculator, Quick Reference, and completion banners

## Database changes

**New table: `cases`**
- `id` uuid PK
- `practice_id` uuid (nullable, FK to practices)
- `user_id` uuid (who created it)
- `patient_name` text
- `status` text (default 'pending') — values: pending, follow_up, converted, rejected
- `notes` text (default '')
- `case_value` numeric (default 0)
- `assigned_to` uuid (nullable)
- `created_at`, `updated_at` timestamps
- RLS: users see own practice cases, bytesense_admin sees all

**New table: `practice_goals`**
- `id` uuid PK
- `practice_id` uuid (FK to practices)
- `monthly_case_goal` integer (default 0)
- `monthly_revenue_goal` numeric (default 0)
- `created_at`, `updated_at` timestamps
- RLS: practice admins can CRUD, bytesense_admin sees all

## Files changed

1. **Database migration** — create `cases` + `practice_goals` tables with RLS
2. **`src/screens/Dashboard.tsx`** — add Practice Performance row at top, Case Pipeline section, replace all emojis with Lucide icons
3. **`src/screens/StaffDashboard.tsx`** — same Lucide icon upgrade, add case tracking view for staff
4. **`src/data/translations.ts`** — new keys for case tracking, goals, pipeline labels
5. **`src/components/DashboardSidebar.tsx`** — add "Cases" nav item with Lucide Briefcase icon

## Implementation order
1. Database migration (cases + practice_goals)
2. Replace all emoji icons with Lucide across both dashboards
3. Add Practice Performance goals vs actuals row at dashboard top
4. Add Case Pipeline section with status tabs and add/update functionality
5. Add Cases to sidebar navigation
6. Add translation keys

