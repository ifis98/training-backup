

# ByteSense Practice Onboarding — Rebuild Plan

## Overview
Rebuild the complete ByteSense Practice Onboarding V6 app in Lovable: a 10-screen training platform for dental practice staff covering product knowledge, sales psychology, objection handling, and AI patient simulation. The app uses the ByteSense brand system (Outfit font, red/teal/dark palette) and persists state via Supabase.

---

## Phase 1: Foundation & Design System
- Set up Outfit font from Google Fonts
- Configure the full ByteSense color palette (red #CC1010, teal #14B8A6, dark #0C0C0E, etc.) as CSS variables/Tailwind tokens
- Copy the ByteSense logo image into the project assets
- Build reusable components: branded buttons (primary red, secondary teal, ghost), role badge pills, progress bars, card layouts

## Phase 2: Screens 1–4 (Onboarding Flow)
- **Splash Screen** — Dark header with logo + name/practice form, generates randomization seed
- **Role Select** — 7 role cards with multi-select checkboxes, role colors/icons, identity statements
- **Baseline Assessment** — 10 adaptive questions (2 variants each, selected by seed), 5-option answers with teal selection, progress bar
- **Baseline Results** — Score circle with level label (Strong/Developing/Fresh Start), adaptive phase calculation, role badges

## Phase 3: Dashboard & Module System
- **Dashboard** — Dark header with XP/progress stats, phase-grouped module cards with colored left borders, completion checkmarks, locked AI simulation section
- **Module View** — Dark mini-header with back/listen buttons, markdown content renderer (bold headers in red, teal bullets, quoted text styling), knowledge check with answer shuffling, XP awards (+50 correct, +10 wrong), auto-advance to next module

## Phase 4: All 22 Modules — Content Transfer
- Transfer word-for-word content from all 22 modules in the JSX file
- 2 beginner, 3 core, 3 product, 3 sales, 1 financial, 2 advanced, 2 flywheel, 6 role-specific
- Include all knowledge check questions with correct answers
- Implement adaptive phase visibility (beginner ≤30%, financial ≤60%)
- Implement question randomization via seed + deterministic shuffle

## Phase 5: AI Patient Simulation
- Build chat interface (dark theme, user messages teal right-aligned, AI messages dark left-aligned)
- Create Supabase edge function using Lovable AI Gateway for the patient simulation (Jordan, 38, marketing manager — exact system prompt from blueprint)
- Implement speech-to-text (Web Speech API) for mic input
- Success detection via regex on AI responses
- Track 3 successful conversions, +150 XP each
- New patient button every 14 messages

## Phase 6: Text-to-Speech
- Implement TTS using Web SpeechSynthesis API on module pages
- Listen/Stop toggle button, rate 0.95
- Clean markdown before speaking

## Phase 7: Completion Report & Certificate
- **Completion Report** — Before/after score comparison, final score formula, full training report card with roles/duties/goals, electronic signature with acknowledgment statement
- **Certificate** — Gold-bordered certificate with decorative corners, "ByteSense Certified Advisor" title, Natasha Blake signature, print and LinkedIn share buttons
- Ambassador detection (XP > 600) with special badge

## Phase 8: State Persistence & Polish
- Set up Supabase persistence for all user state (replacing localStorage)
- Ensure scroll-to-top on every navigation
- Quick Reference card on dashboard
- Support section with Calendly link
- Reset functionality
- Responsive design for mobile/tablet
- Footer: "byteSense Inc. · Proprietary · Confidential"

---

## Key Technical Decisions
- **AI**: Lovable AI Gateway (not Anthropic direct) via Supabase edge function
- **Persistence**: Supabase database for training state and completion tracking
- **Font**: Outfit from Google Fonts
- **Speech**: Browser Web Speech API for TTS and STT
- **Images**: ByteSense logo copied to project assets; product images used as reference only

