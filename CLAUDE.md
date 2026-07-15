# ByteSense — Project Reference

## What This App Is

ByteSense is a **B2B staff training platform for dental practices** adopting the ByteSense oral device (a bruxism/teeth-grinding monitor). It trains dental staff on how to screen patients, present the product, handle objections, and manage cases — then tracks their progress and performance.

**Not a medical device.** It's an ops + education tool.

**Stack:** React 18 + TypeScript + Vite → deployed on Vercel  
**Auth:** Clerk (email + OAuth)  
**Database:** Supabase (Postgres + Edge Functions)  
**Domain:** `training.bytesense.ai`  
**Repo linked to Vercel project:** `prj_YNweKtyfjSNXARbHb28kkfIAOINW` (team: `team_55iXexWx6zuvY8wpmtlju41f`)

---

## Deploying

**Always deploy via Vercel CLI from the project directory — do NOT push to main directly.**

```bash
cd /Volumes/SSD/Byte/bytesense
npm run build           # verify zero TypeScript errors first
vercel deploy --prod --yes
```

The `.vercel/project.json` must always contain:
```json
{"projectId":"prj_YNweKtyfjSNXARbHb28kkfIAOINW","orgId":"team_55iXexWx6zuvY8wpmtlju41f","projectName":"remix-of-bytesense-onboarding-welcome"}
```
Never run `vercel link --yes` — it resets this to the wrong account.

---

## User Roles

### Staff Training Roles (selected during intake, determines module curriculum)
| Role | Focus |
|------|-------|
| Owner | Practice metrics, team overview, financial confidence |
| Associate Dentist | Clinical positioning, recommendation scripts |
| Hygienist | Screening signals, warm handoff |
| Treatment Coordinator (TC) | Sales psychology, objection handling, financial |
| Office Manager | Morning huddles, team metrics, operations |
| Dental Assistant | Scanning protocol, delivery, app setup |
| Front Desk | Scheduling, follow-up, referral capture |

### Platform Roles (checked in Supabase `user_roles` table on login)
| Role | Access |
|------|--------|
| Regular user | Own dashboard + training only |
| Staff | `StaffDashboard` view (not owner-level metrics) |
| Admin | Can manage practice, sees practice dashboard |
| ByteSense Admin | Internal admin panel (`/bytesense-admin`) |
| Super User | Can toggle between owner/staff views (for support) |

Super users (hardcoded): `nbc1079@gmail.com`, `natasha@bytesense.ai`, `majid@bytesense.ai`, `john@bytesense.ai`

---

## Complete User Journey

### Phase 0 — Landing & Auth
- `/` — Public welcome/landing page
- `/login` — Clerk sign-in (custom ByteSense styled)
- `/register` — Clerk sign-up
- After auth → `/app`

### Phase 1 — Intake (first-time users only)
`Index.tsx` detects `!s.intakeDone` → shows `IntakeFlow` → `TypeformIntake`

17-step Typeform-style form (plus the P1–P9 portal-registration steps). One question per screen, smooth slide animations, auto-advance on radio select.

| Step | Question | Data Captured |
|------|----------|---------------|
| Welcome | Branded intro | — |
| 00 | Practice name | `practice_name` |
| 01 | Are you the decision maker? | `is_decision_maker` |
| 02 | Co-decision maker info (conditional) | `codecision_*` fields |
| 03 | Primary advocate contact | `primary_name/email/phone/role` |
| 04 | Backup contact (optional) | `secondary_*` fields |
| 05 | **Your role(s)** (multi-select) | `staff_roles[]` → AppState.roles |
| 06 | Monthly guard volume | `monthly_volume` |
| 07 | Who presents guards? | `who_presents` |
| 08 | Who handles billing? | `who_bills` |
| 09 | How do you collect payment? | `payment_collection` |
| 10 | Want billing guidance? | `wants_billing_guidance` |
| 11 | Who submits cases? | `who_submits_cases` |
| 12 | What scanner do you use? | `scanner_type` |
| 13 | Add staff to training? | `add_staff_to_training` |
| 14 | Have a patient in mind? | `has_patient_in_mind` |
| 15 | Ideal patient profile (multi-select) | `ideal_patient_profile[]` |
| 16 | When to start first case? | `first_case_timeline` |
| 17 | **Main blocker** | `main_blocker` → AppState.mainBlocker |

On complete: saves to `practice_intake` table, sets `intakeDone: true`, routes to Splash.

### Phase 2 — Splash
`phase === 'splash'` — Branded intro, confirm name + practice, generate random `seed` (used to shuffle questions). Routes to Baseline.

### Phase 3 — Baseline Assessment
`phase === 'baseline'` — 10 multiple-choice questions assessing current knowledge across: guard sales, screening, grinding knowledge, objection handling, handoffs, metrics, money conversations, follow-up, morning huddles.

Score formula: `Math.round(answers.reduce((a, v) => a + v * 25, 0) / total)` → 0–100

### Phase 4 — Baseline Results
`phase === 'blR'` — Shows score label, selected roles, personalized module plan. Labels: Fresh Start (0–30%), Developing (31–74%), Strong Foundation (75–100%).

### Phase 5 — Dashboard (main training hub)
`phase === 'dashboard'` — Default state for returning users.

Owner sees `Dashboard.tsx`. Staff-only users see `StaffDashboard.tsx`.

**Dashboard sections:**
1. Progress overview (XP, modules done, sim count)
2. Phase cards → expandable module list → click to start training
3. AI Simulations section (practice patient conversations)
4. AI Coach button (floating modal)
5. Goals section (monthly cases, revenue, price per case)
6. Report (unlocked when all modules + 3 sims complete)

### Phase 6 — Module View
`phase === 'module'`, `curMod: string` — Reads lesson content (markdown rendered), then 1 check question (4 options). On correct answer: `done[]` gains module ID, `xp += 25`. Returns to dashboard.

### Phase 7 — AI Simulation
`phase === 'simulation'` — Chat interface with an AI patient. 6 hardcoded patients (Jordan, Maria, Devon, Patricia, Marcus, Aisha), each with a profile card. Staff types responses, AI replies. Success detected via regex on patient message:
```
/(interested|next step|sign me up|let's do it|schedule|sounds good|i'm in|let's move forward|make it work)/i
```
3 successful conversations required (`simP` counter, max 3). Coach tips appear inline. Routes to `simSummary` when done.

### Phase 8 — Simulation Summary
`phase === 'simSummary'` — Calls `/functions/v1/ai-coach` (Claude API) to generate a structured performance review: score label, strengths, improvements, tips, modules to review. Saves to `simulation_reviews` table.

### Phase 9 — Report (final)
`phase === 'report'` — Only accessible when `allComplete` (all modules done + simP >= 3). Shows before/after baseline score, progress stats, certificate. User signs (`signed: true`).

---

## State Architecture

### AppState (key: `bsa6` in localStorage)
Primary state, synced to Supabase `training_progress` (debounced 2s).

```ts
phase: string           // current screen ('splash', 'dashboard', 'module', 'simulation', etc.)
name: string            // user's name
practice: string        // practice name
roles: string[]         // selected staff roles
blScore: number|null    // baseline score 0-100
done: string[]          // completed module IDs
xp: number              // experience points (25 per module)
simP: number            // simulation patients completed (max 3)
simMsgs: Message[]      // current simulation conversation
signed: boolean         // signed off on final report
intakeDone: boolean     // whether intake flow is complete
lang: string            // language ('en','es','pt','fr','zh')
```

### IntakeState (key: `bsi1` in localStorage)
Saved to `practice_intake` table on every step change.

### Other localStorage keys
- `bsa6_notes` — Personal notes
- `bsa6_goals` — Dashboard goals
- `bsa6_favorites` — Saved AI Coach responses

### DB Sync Logic
- On app load: Supabase query fires → sets `dbLoaded: true` when done
- `Index.tsx` shows spinner until `dbLoaded` (prevents returning users seeing intake)
- If DB has `name` or `training_roles` → `intakeDone: true`, `phase: 'dashboard'`

---

## Supabase Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User metadata, `practice_id`, `last_seen_at` |
| `training_progress` | Core training state per user (synced from AppState) |
| `practice_intake` | All intake answers (17 training + P1–P9 portal fields) |
| `user_roles` | Platform roles (admin, staff, bytesense_admin) |
| `practices` | Practice records |
| `cases` | Patient case pipeline (pending → in_progress → follow_up → completed) |
| `practice_goals` | Monthly goals (cases, revenue, price per case) |
| `simulation_reviews` | AI-generated sim performance analysis |
| `support_bookings` | Scheduled calls (M/W/F, 10am–4pm PST) |
| `admin_alerts` | Internal platform alerts for ByteSense admin |
| `demo_requests` | Inbound demo signups |
| `registration_codes` | Invite codes for new practices |

---

## Edge Functions (Supabase)

Both on the **old Supabase project** (`VITE_SUPABASE_FUNCTIONS_URL`):

| Function | Called by | Purpose |
|----------|-----------|---------|
| `/functions/v1/ai-coach` | AICoach.tsx, SimulationSummary.tsx | Claude API — 5 modes: general, follow-up, treatment, objections, summary |
| `/functions/v1/patient-sim` | Simulation.tsx | Claude API — plays AI patient in simulation |
| `/functions/v1/notify-case-followup` | Dashboard.tsx (case status change) | SMS/email follow-up notification |

---

## Training Content

### Modules (30+, in `src/data/modules.ts`)
All content is **hardcoded in JS** — not database-driven.

| Phase | Modules | For |
|-------|---------|-----|
| Beginner (score < 30%) | b1–b3: Dental comm, Dental exam, Health history | Low-baseline users |
| Core | c1–c3: Bruxism epidemic, Guards vs health intelligence, 8-stage patient journey | All |
| Product | p1–p5: Positioning, 6 sensors, Patient ID, App, Comparison | All |
| Sales Psychology | s1–s4: Persuasion principles, Objection handling, Emotional architecture, Pricing moment | TC, Owner, Associate |
| Financial | f1: Money conversation | TC, Owner |
| Operations | o1–o6: Scanning, Delivery, Consent, Huddle, Testimonials, Issue handling | Hygienist, Assistant, OfficeMgr |
| Advanced Communication | a1–a2: Warm handoff, Trust micro-moments | Hygienist, Front Desk |

### Languages (in `src/data/translations.ts`)
English, Spanish, Portuguese, French, Chinese. All translations are hardcoded JS objects. Switch in dashboard header.

---

## Design System

All colors/styles from `C` object in `src/data/constants.ts`:
```ts
C.dark      = '#0A0A0E'   // background
C.dark2     = '#13131A'   // card background
C.teal      = '#00C2A8'   // primary action
C.gold      = '#D4AF37'   // accent/XP/premium
C.red       = '#E53E3E'   // danger/bruxism
C.white     = '#F4F4F6'   // text
C.ash       = '#9898A8'   // muted text
C.green     = '#38A169'   // success
C.borderD   = 'rgba(255,255,255,0.07)'  // border
C.fn        = "'Inter', sans-serif"     // font
```

**Styling approach:** Inline styles everywhere (not Tailwind classes). Responsive via `useIsMobile()` hook.

---

## Routes

```
/                 → Welcome (public landing)
/login            → Clerk SignIn
/register         → Clerk SignUp
/app              → Protected: intake or dashboard (main entry)
/staff            → Force StaffDashboard view
/owner            → Force owner Dashboard view
/bytesense-admin  → Internal admin (ByteSense super-users only)
*                 → 404 NotFound
```

`vercel.json` rewrites all routes to `/index.html` (SPA behavior).

---

## Known Issues & Improvements Needed

### Critical Bugs
1. **`supabase.auth.getUser()` calls in Dashboard.tsx** — App uses Clerk for auth, not Supabase auth. Dashboard lines 93–101, 115, 129, 171, 179 call `supabase.auth.getUser()` which returns null. All case management, staff tracking, and goal loading is broken as a result. **Fix:** Replace with `(window as any).__clerkUserId` which is set in Index.tsx.

2. **Same issue in StaffDashboard.tsx** — Same `supabase.auth.getUser()` calls. All data loading broken.

### UX Issues
3. **Intake always re-runs if localStorage cleared** — If user clears storage on a different device, they see intake again. The DB check (`dbLoaded`) now prevents this for returning users who have DB records, but users who completed intake but have no `training_progress` row yet could re-see it.

4. **No loading state in Simulation** — If the AI response takes >3s, there's a typing indicator but no timeout or error recovery.

5. **Back button in Simulation goes to `simSummary` even with 0 messages** — Should go straight to dashboard if no messages sent yet. (Bug exists but partially handled.)

6. **Module completion requires only 1 check question** — No validation that the user actually read the content. Could add a minimum time-on-screen.

7. **Simulation victory regex too simple** — Can be triggered by the patient saying "that sounds good" naturally without any real close attempt.

### Missing Features (Priority Order)
1. **Fix Supabase auth calls** — Replace `supabase.auth.getUser()` with Clerk user ID throughout Dashboard and StaffDashboard
2. **Case management UI** — Table exists in DB, cases can be created but the full pipeline UI (status updates, follow-up tracking) needs to be wired to Clerk auth
3. **Staff invitations** — Intake collects secondary contact info but never sends invites
4. **Push to GitHub** — Currently deploying via CLI only; set up proper Git-connected deployment
5. **Simulation variety** — 6 hardcoded patients. Add more or make them configurable per practice type
6. **Analytics for practice owners** — Team completion rates, who's trained vs not
7. **Content versioning** — If modules update, trained users shouldn't see "re-do" prompts
8. **Offline resilience** — Queue writes when offline, sync when reconnected

---

## Environment Variables

### Vercel Production (all set)
```
VITE_CLERK_PUBLISHABLE_KEY       → pk_live_... (production Clerk)
VITE_SUPABASE_URL                → https://krgjwtaavcxwyqbcesxu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY    → sb_publishable_...
VITE_SUPABASE_FUNCTIONS_URL      → https://tzxhvjecpcmunexkekvp.supabase.co (old project)
VITE_SUPABASE_FUNCTIONS_KEY      → eyJ... (old project anon key)
```

### Local `.env.local`
Same as above but `VITE_CLERK_PUBLISHABLE_KEY` is the test key (`pk_test_...`). Switch to live key to test production Clerk locally.

---

## File Map

```
src/
├── App.tsx                          # Router + Clerk setup + global providers
├── main.tsx                         # Entry point, ErrorBoundary, unhandledrejection handler
├── index.css                        # Tailwind + design tokens + animations
│
├── pages/
│   ├── Index.tsx                    # Main app container — routes based on AppState.phase
│   ├── ByteSenseAdmin.tsx           # Internal admin panel (super-users only)
│   ├── AdminDashboard.tsx           # Practice admin view
│   ├── NotFound.tsx                 # 404
│   └── ResetPassword.tsx            # Password reset flow
│
├── screens/
│   ├── Dashboard.tsx                # Main training hub (owner/admin view) ← most complex file
│   ├── StaffDashboard.tsx           # Staff-only dashboard
│   ├── Simulation.tsx               # AI patient conversation
│   ├── SimulationSummary.tsx        # AI performance review
│   ├── ModuleView.tsx               # Lesson content + check question
│   ├── Baseline.tsx                 # 10-question knowledge quiz
│   ├── BaselineResults.tsx          # Score reveal + module plan
│   ├── Splash.tsx                   # Branded intro + name input
│   ├── RoleSelect.tsx               # Role selection (legacy, now in intake)
│   ├── Report.tsx                   # Final certificate
│   └── intake/
│       ├── IntakeFlow.tsx           # Orchestrates intake + saves to DB
│       ├── TypeformIntake.tsx       # Typeform-style intake form (largest file)
│       └── Step10Complete.tsx       # Intake completion screen
│
├── components/
│   ├── DashboardSidebar.tsx         # Side nav (desktop) + bottom nav (mobile)
│   ├── AICoach.tsx                  # Floating AI tutor modal (5 modes)
│   ├── BookingModal.tsx             # Support call scheduler
│   ├── ByteSenseLogo.tsx            # Logo + ContentRenderer (markdown)
│   └── ui/                          # shadcn/ui primitives
│
├── hooks/
│   ├── useAppState.ts               # Central training state (critical)
│   ├── useAuth.ts                   # Clerk + Supabase role check
│   ├── useIntakeState.ts            # Intake form state + DB sync
│   └── use-mobile.tsx               # isMobile() hook
│
├── data/
│   ├── constants.ts                 # Colors (C), roles (ROLES), phases (PH), baseline Qs (BL)
│   ├── modules.ts                   # All 30+ training modules (hardcoded content)
│   └── translations.ts             # 5-language strings
│
├── lib/
│   └── helpers.ts                   # scrollTop, startSTT, computeKnowledgeScore, etc.
│
└── integrations/
    └── supabase/
        ├── client.ts               # Supabase client init + FUNCTIONS_URL/KEY exports
        └── types.ts                # Generated DB types
```
