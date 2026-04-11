

# Fix Sidebar Translations + American Voice + Goals Save Test + Translation Keys

## What's wrong

1. **Sidebar labels don't translate** — The keys `sidebar_dashboard`, `sidebar_training`, `sidebar_simulations`, `sidebar_coach`, `sidebar_report`, `sidebar_contact_support` only exist in the English (`en`) section. The `t()` function falls back to English, so they always show in English regardless of language selection.

2. **Voice has a British accent** — The `PREFERRED_VOICES` list in `src/lib/helpers.ts` prioritizes `"Google UK English Female"` first. This gives a British accent. Need to reorder to prioritize American English female voices.

3. **Missing translation keys** — `goals_save_error`, `goals_saved`, and `daily_breakdown` also only exist in English. Need translations for es, pt, fr, zh.

## Changes

### 1. `src/data/translations.ts` — Add missing keys to all 4 non-English languages

Add to each language section:
- `sidebar_dashboard`, `sidebar_training`, `sidebar_simulations`, `sidebar_coach`, `sidebar_report`, `sidebar_contact_support`
- `goals_save_error`, `goals_saved`, `daily_breakdown`

### 2. `src/lib/helpers.ts` — Reorder voice preferences for American accent

Change `PREFERRED_VOICES` to prioritize American English female voices:
- Move `"Google US English"` to the top
- Add `"Microsoft Aria"` and `"Samantha"` (macOS American female) near the top
- Push UK voices lower in the priority list

### 3. Browser test — Goals save flow

Navigate to the dashboard, click Edit Goals, set values, save, and verify the toast appears and the daily breakdown insight displays correctly.

## Files changed
1. **`src/data/translations.ts`** — Add ~9 missing keys × 4 languages = 36 new translation entries
2. **`src/lib/helpers.ts`** — Reorder `PREFERRED_VOICES` array to prioritize American female voices
3. **Browser test** — E2E test of goals save flow

## Implementation order
1. Add all missing translations
2. Fix voice preference order
3. Test goals save flow in browser

