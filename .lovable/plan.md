

# Practice Health Monitoring + Admin CRM in ByteSense Admin

This is a substantial build. I'm proposing it as **4 phases** so you can ship value quickly and review each piece before moving on. Phase 1 covers the most urgent ask (notifications for non-compliance + support follow-ups). Phases 2-4 add CRM, goals tracking, and live chat.

---

## Phase 1 — Health Alerts + Support Inbox (ship first)

**Goal:** Surface every practice/staff member who is at risk so an admin can act within 48 hours.

### New DB tables
- `admin_alerts` — `id, type, severity, practice_id, target_user_id, title, body, status (open/snoozed/resolved), assigned_to (admin uuid), created_at, resolved_at`. Types: `inactive_48h`, `no_modules`, `goal_at_risk`, `goal_missed`, `support_unanswered`.
- `practice_schedule` — `practice_id, closed_days (text[] e.g. ["sun","sat"]), holidays (date[])`. Used to skip "closed days" in the 48h inactivity check.
- Add `last_seen_at timestamptz` to `profiles` (updated on every auth/app load).
- Add `assigned_to uuid, admin_notes text, follow_up_at timestamptz, status text` to `support_bookings` so admins can triage support requests.

### Edge function — `health-monitor` (cron, runs hourly)
Scans `profiles` + `training_progress` + `practice_goals` + `cases` and inserts/updates `admin_alerts`:
- **Inactive 48h+** (skipping `practice_schedule.closed_days`): no `last_seen_at` update for 48 hours after onboarding.
- **No modules completed** within 48h of first login.
- **Goal at risk**: pace projection = (cases_this_month / day_of_month) × days_in_month < 80% of `monthly_case_goal` after day 7.
- **Goal missed**: end of month, actuals < goal.
- **Support unanswered**: `support_bookings` with no `assigned_to` and `created_at` > 24h ago (warns before the 48h deadline).

Scheduled via `pg_cron` + `pg_net` calling the edge function.

### Admin UI additions (`src/pages/ByteSenseAdmin.tsx`)
- **New sidebar item: "Alerts"** with red badge showing open count. Top of dashboard also shows the count.
- **Alerts tab**: filter by severity/type/practice, click to open detail drawer with: practice info, full timeline of activity, notes thread, "Assign to" dropdown (any bytesense_admin), "Next step" text, "Follow-up date" picker, "Snooze 24h / Resolve" actions.
- **New sidebar item: "Support Inbox"** — every `support_bookings` row with assign/notes/follow-up controls and a 48h SLA countdown chip.
- Overview tab gets a new "Needs attention" panel listing top 5 open alerts.

### Frontend hooks
- `useAuth` updates `profiles.last_seen_at` on session load (used by inactivity detector).

---

## Phase 2 — Monthly Goals (per practice + per staff)

### DB
- Extend `practice_goals` with `month date` (year-month key), make `(practice_id, month)` unique. Each month gets its own row.
- New `staff_goals` table — `id, user_id, practice_id, month, modules_target int, cases_target int, sim_patients_target int, revenue_target numeric`.

### Admin UI
- **New "Goals" tab** in admin: month selector, per-practice grid showing target vs actual (cases, revenue, modules done, sim patients), color-coded (green ≥100%, amber 80–99%, red <80%). Drill into a practice to see per-staff goals.
- Admin can edit any goal inline.
- Owner Dashboard already has a goals card — extend it to read the new monthly rows so owners see the same numbers.
- The `health-monitor` function reads these tables for the at-risk detection.

---

## Phase 3 — CRM: tasks, assignments, follow-ups, push notifications

### DB
- `admin_tasks` — `id, title, description, assigned_to_admin uuid, target_practice_id, target_user_id, due_at, status (todo/in_progress/done), created_by, created_at`.
- `practice_notes` — `id, practice_id, author_admin_id, body, created_at` (running log on each practice profile).
- `user_notifications` — `id, user_id, title, body, link, read_at, created_at` for pushing messages from admin → practice users.

### Admin UI
- **Practice detail drawer** (clicking any practice row): tabs for Overview / Staff / Notes / Tasks / Alerts / Activity timeline. Add note, create task, push notification, all from here.
- **My Tasks** sidebar item — kanban of tasks assigned to the current admin.
- **Push notification composer**: target a practice / specific staff / providers role, title + body + optional link. Stored in `user_notifications`; bell icon in app header for recipients.

---

## Phase 4 — Live chat (admin ↔ practice)

### DB
- `chat_threads` — `id, practice_id, subject, last_message_at, status`.
- `chat_messages` — `id, thread_id, sender_id, sender_role (admin/practice), body, created_at`.
- Realtime enabled on `chat_messages`.

### UI
- Chat panel (sliding drawer) accessible from any practice row in admin and from the practice's own dashboard header (new "Messages" button).
- Uses Supabase Realtime channel per thread.
- Unread badge in admin sidebar.

---

## Cross-cutting

- **RLS:** all new admin tables locked to `bytesense_admin` role; user-facing tables (`user_notifications`, `chat_messages`) scoped to the user/practice.
- **Realtime:** enable on `admin_alerts`, `chat_messages`, `user_notifications` so the admin dashboard updates live without refresh.
- **No new external services** — all in Lovable Cloud (Supabase + edge function + pg_cron). Email notifications later if you want them outside the app.

---

## Recommended approach

Approve **Phase 1 only** to start. It's already a meaningful build (5+ new DB objects, 1 edge function, cron, 2 new admin tabs, alert detail UI) and gives you the non-compliance + support-SLA visibility you described. Then I'll plan Phase 2 once Phase 1 is in your hands.

Reply with:
- **"Approve Phase 1"** to start building, or
- **"Approve all 4 phases"** to do it as one large build (longer turnaround, more to review at once), or
- tell me what to add/cut/reorder.

