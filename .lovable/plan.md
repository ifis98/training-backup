

# AI Coach Copy/Save + i18n for Remaining Screens + Testing

## 1. AI Coach — Copy & Save Features

**Copy to Clipboard**: Add a small "📋 Copy" button on each assistant message bubble. Uses `navigator.clipboard.writeText()` with a brief "Copied!" toast feedback.

**Save Favorites**: Add a "⭐ Save" button next to Copy. Saved responses stored in localStorage (key `bsa6_favorites`) as `{ content: string, mode: string, savedAt: string }[]`. Add a "⭐ Saved" tab in the AI Coach header that shows saved responses with a delete option.

New translation keys: `copied`, `copy`, `save`, `saved`, `saved_responses`, `no_saved`, `delete` — added for all 5 languages.

## 2. Translate Remaining Screens

These screens still have hardcoded English strings:

- **Splash.tsx**: "Practice Onboarding", "Welcome to the ByteSense Team", field labels, "Get Started", confidential footer
- **Baseline.tsx**: "Step 2 — Where You Are Today", "No wrong answers", "Next →", "See Results →"
- **BaselineResults.tsx**: "Your Starting Point", "Strong Foundation"/"Developing"/"Fresh Start", level messages, "Your Roles:", "Your personalized onboarding:", "Start Onboarding →"
- **RoleSelect.tsx**: "Step 1 — Your Role(s)", role selection instructions, "Continue"
- **ModuleView.tsx**: "← Dashboard", speaker button, quiz labels, "Next Module →", "Back to Dashboard"
- **Simulation.tsx**: All patient sim UI strings
- **SimulationSummary.tsx**: Summary labels, score display, tips
- **Report.tsx**: "Training Report", "Congratulations", certificate text, LinkedIn share, print

Each screen needs the `lang` prop threaded from `AppState` and wrapped with `t(lang, key)`. ~60 new translation keys across all 5 languages.

## 3. Thread `lang` Through All Screens

Currently only `Dashboard` and `AICoach` receive `lang`. Update `Index.tsx` to pass `s.lang` (as `Lang`) to every screen component. Each screen's props interface gets `lang?: Lang`.

## 4. Testing Plan (manual, after implementation)

- **ByteSense Admin Portal**: Navigate to `/bytesense-admin`, generate codes, verify they appear
- **AI Coach**: Open coach, send a message, verify response, test Copy and Save buttons
- **Language Switching**: Switch to Spanish on dashboard, verify all screens translate when navigating through Splash → RoleSelect → Baseline → Results → Dashboard → Coach → Simulation → Summary → Report

## Files Changed

1. **`src/data/translations.ts`** — ~60 new keys × 5 languages
2. **`src/components/AICoach.tsx`** — Copy/Save buttons, Saved tab
3. **`src/screens/Splash.tsx`** — Wrap strings with `t()`
4. **`src/screens/RoleSelect.tsx`** — Wrap strings with `t()`
5. **`src/screens/Baseline.tsx`** — Wrap strings with `t()`
6. **`src/screens/BaselineResults.tsx`** — Wrap strings with `t()`
7. **`src/screens/ModuleView.tsx`** — Wrap strings with `t()`
8. **`src/screens/Simulation.tsx`** — Wrap strings with `t()`
9. **`src/screens/SimulationSummary.tsx`** — Wrap strings with `t()`
10. **`src/screens/Report.tsx`** — Wrap strings with `t()`
11. **`src/pages/Index.tsx`** — Pass `lang` to all screen components

