

# ByteSense — Missing Modules, Landing Page, Auth & Admin System

## Summary
Three major additions: (1) add 12 missing training modules + the "operations" phase, (2) build a landing/welcome page with authentication, (3) build an admin dashboard for practice owners to manage staff, track progress, and reprint certificates.

---

## Part 1: Add Missing Modules & Operations Phase

The uploaded V6_2 JSX has 12 new modules not in the current codebase:

| ID | Phase | Title | Roles |
|----|-------|-------|-------|
| b3 | beginner | Reading a Health History | all |
| p4 | product | The bitely App Walkthrough | all |
| p5 | product | ByteSense vs. The Competition | all |
| s4 | sales | The Pricing Moment | all |
| o3 | operations | The Consent Form Process | all |
| o4 | operations | Morning Huddle Protocol | all |
| o5 | operations | Video Testimonials | all |
| o6 | operations | Handling Device Issues | all |
| r_assoc1 | role-specific | Associate: 30-Second Recommendation | associate |
| r_tc2 | role-specific | TC: 48-Hour Follow-Up System | tc |
| fw3 | flywheel | Social Media & Patient Content | all |
| r_hyg2 | role-specific | Hygienist: Handling First Objections | hygienist |

The "operations" phase already exists in `PH` in constants.ts. All module content and quiz questions will be transferred word-for-word from the uploaded file.

---

## Part 2: Welcome Landing Page + Authentication

**Landing Page** (pre-login, public):
- Full-screen dark hero with ByteSense logo and tagline
- Messaging that makes practices feel exclusive, empowered, and part of something big: "You're not just adopting a product — you're joining a movement in health intelligence"
- Key stats/value props (5 sensors, daily health score, zero-cost marketing flywheel)
- Clear CTA: "Join the ByteSense Family" → registration

**Authentication** (email + password via Lovable Cloud):
- Registration page: name, email, practice name, password
- Login page for returning users
- Email verification (standard, not auto-confirm)
- Google OAuth as secondary option
- After login, users land on their personalized dashboard

**Database tables needed:**
- `profiles` — user_id (FK auth.users), full_name, practice_id, role (app-level: "admin" or "staff"), created_at
- `practices` — id, name, created_at, owner_id
- `staff_invitations` — id, practice_id, email, invited_by, status (pending/accepted/revoked), created_at
- `training_progress` — id, user_id, practice_id, roles (text[]), baseline_score, done_modules (text[]), xp, sim_patients, signed, completed_at

RLS policies: users see only their own practice's data. Admins see all staff in their practice.

---

## Part 3: Admin Dashboard

For practice owners/admins:
- **Staff Management**: Invite staff via email, view pending/accepted invitations, remove terminated staff
- **Progress Tracking**: See each staff member's training completion %, XP, modules done, simulation status
- **Reports & Certificates**: Reprint any staff member's completion report and certificate as PDF
- **Practice Certificate**: Generate/view "Official ByteSense Location" certificate for the practice itself (gold-bordered, printable)

---

## Implementation Order

1. **Database migration** — Create `practices`, `profiles`, `staff_invitations`, `training_progress` tables with RLS
2. **Auth pages** — Landing page, Register, Login (with Google OAuth)
3. **Add 12 missing modules** to `src/data/modules.ts`
4. **Connect training state to database** — Replace localStorage with Supabase persistence, sync on login
5. **Admin dashboard** — Staff invite flow (sends email), progress overview, reprint reports/certificates
6. **Practice certificate** — "Official ByteSense Location" certificate generator
7. **Edge function for invitations** — Send invitation emails to staff

---

## Technical Details

- Auth: Supabase Auth with email+password + Google OAuth via Lovable Cloud
- Database: 4 new tables with RLS policies scoped to practice_id
- Invitation flow: Admin enters staff email → row in `staff_invitations` → email sent via edge function → staff registers with that email → auto-linked to practice
- Training state moves from localStorage to `training_progress` table
- Landing page is a new public route (`/welcome`) that becomes the default for unauthenticated users
- Authenticated users route to `/` (dashboard)
- Admin vs staff distinction stored in `user_roles` table (per security guidelines)

