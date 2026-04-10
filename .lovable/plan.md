

# Phase B: Admin Setup, AI Coach, Session Summary & Landing Page Fix

## 1. Set Up Your ByteSense Admin Account

Your account (`nbc1079@gmail.com`, ID: `376373ca-2ce2-4828-9cc9-8281f204c547`) needs a `bytesense_admin` role inserted into `user_roles`. This is a single database insert.

## 2. Landing Page Routing Clarification & Fix

The routing IS working correctly: unauthenticated users at `/` get redirected to `/welcome`. The reason you're not seeing the landing page is because **you're already logged in** — so `/` correctly shows your dashboard.

**Fix**: Add a "Sign Out" button on the dashboard so you can log out and see the landing page flow. Also ensure the Welcome page link is accessible from the nav. The landing page will always be the first thing a NEW or logged-out user sees.

## 3. AI Coach Edge Function

Create a new edge function `ai-coach` with:
- Full training knowledge system prompt (same cheat sheet as patient-sim)
- Modes: general advice, SMS/email generator, treatment plan helper, script generator, educational material creator
- Accepts `{ messages, mode }` — mode determines the system prompt variation
- Uses Lovable AI gateway (`google/gemini-2.5-flash`)

## 4. AI Coach Floating Chat Panel

Add to `Dashboard.tsx`:
- Floating "AI Coach" button (bottom-right corner, gold accent)
- Slide-out chat panel when clicked
- Chat interface with message history (session-only, no DB persistence needed initially)
- Quick-action buttons at the top: "Patient Follow-Up", "Treatment Plan", "Handling Objections", "Educational Material"
- Each quick action pre-fills a system prompt mode

New component: `src/components/AICoach.tsx`

## 5. Coaching Session Summary

After simulation ends (user clicks "Back" or completes 3 patients):
- Collect all `[COACH:]` tips from the conversation
- Call the AI with the full conversation asking for a structured summary
- Display a summary screen with:
  - Performance score (AI-generated)
  - Number of coaching tips received
  - Key areas to improve
  - Specific modules to review
  - "Return to Dashboard" button

New component: `src/screens/SimulationSummary.tsx`
- Add new phase `"simSummary"` to AppState
- Simulation "Back" button triggers summary generation instead of immediate return

## 6. Dashboard Enhancements

Add to the dashboard below the training modules:
- **Quick Tools** section with cards for:
  - Generate Patient Follow-Up (opens AI Coach with pre-filled mode)
  - Create Treatment Plan
  - Generate Consent Form
  - Educational Materials
- **Admin button** (visible to practice owners only) linking to staff management

---

## Files Changed

1. **Database insert** — `user_roles` row for bytesense_admin
2. **`supabase/functions/ai-coach/index.ts`** — New edge function
3. **`src/components/AICoach.tsx`** — New floating chat panel component
4. **`src/screens/SimulationSummary.tsx`** — New post-simulation summary screen
5. **`src/screens/Dashboard.tsx`** — Add AI Coach button, Quick Tools section, sign-out button
6. **`src/screens/Simulation.tsx`** — Route to summary instead of dashboard on exit
7. **`src/hooks/useAppState.ts`** — Add `simSummary` phase
8. **`src/pages/Index.tsx`** — Add SimulationSummary route

## Implementation Order

1. Insert bytesense_admin role for your account
2. Add sign-out button to dashboard
3. Create `ai-coach` edge function + deploy
4. Build AICoach floating panel component
5. Build SimulationSummary screen
6. Wire everything into Dashboard and Index
7. Add Quick Tools section to dashboard

