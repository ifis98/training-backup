

# ByteSense — Multi-Patient Sim, Logo Fix, TTS Improvement, DB Sync & Practice Join

## Summary
Seven changes: (1) randomize AI patient scenarios instead of always Jordan, (2) fix logo visibility on dark backgrounds, (3) improve TTS quality, (4) sync training state to database, (5) prevent duplicate email registration, (6) allow employees to request joining an existing practice, (7) admin staff removal.

---

## 1. Random Patient Scenarios in AI Simulation

**Current**: Only one patient — Jordan, 38, marketing manager.

**Change**: Create a pool of 6+ distinct patient personas in the edge function. When "New Patient" is clicked or a new conversation starts, the client sends a `patientIndex` (0–5, randomized). The edge function picks the matching persona.

Patient pool (all dental-relevant, varied demographics/objections):
| # | Name | Age | Occupation | Scenario | Key Objections |
|---|------|-----|-----------|----------|---------------|
| 0 | Jordan | 38 | Marketing Manager | Grinding, jaw sore | Budget, "isn't it a night guard?" |
| 1 | Maria | 52 | School Teacher | TMJ pain, headaches | Insurance coverage, skepticism |
| 2 | Devon | 28 | Software Engineer | Partner complains about grinding | "I feel fine", tech-curious |
| 3 | Patricia | 65 | Retired Nurse | Broken teeth history, dentist recommended | Already tried a night guard, medical knowledge |
| 4 | Marcus | 44 | Construction Foreman | Sleep apnea concerns, jaw clenching | Time off work, cost |
| 5 | Aisha | 33 | New Mom | Stress grinding since pregnancy | Baby budget, "will it work?" |

- Update `supabase/functions/patient-sim/index.ts` — add personas array, accept `patientIndex` in request body
- Update `Simulation.tsx` — randomize patientIndex on mount and on "New Patient", display current patient name/details in the card, show patient name in chat bubbles
- Update `AppState` — add `simPatientIdx` field

## 2. Fix ByteSense Logo Visibility on Dark Backgrounds

The logo PNG has dark text that's invisible on dark backgrounds.

**Fix**: Add a CSS `filter: brightness(0) invert(1)` on the `<img>` tags when used on dark backgrounds. Update:
- `ByteSenseLogo.tsx` — add optional `light` prop to Logo/LogoText components
- `Splash.tsx` — use `<Logo light />` in dark header
- `Dashboard.tsx` — use `<Logo light />` in dark header
- `Simulation.tsx` — already text-based, no logo needed
- `Report.tsx` — logo on white bg is fine, no change
- `Welcome.tsx` — add filter to logo img
- `Auth.tsx` — add filter to logo img
- `AdminDashboard.tsx` — add filter to logo img on dark bg

## 3. Improve TTS Voice Quality

**Current**: Uses Web SpeechSynthesis API with `rate: 0.95`. Sounds robotic/choppy.

**Fix**: 
- Select a higher-quality voice — prefer "Google UK English Female" or similar natural voice when available
- Add `pitch: 1.0` and wait for `voiceschanged` event before speaking
- Add sentence-level chunking with small pauses for natural flow
- Clean markdown more thoroughly (strip bullets, headers formatting) before speaking
- Update `speak()` in `src/lib/helpers.ts`

Note: Browser TTS quality varies by platform. For truly smooth speech, ElevenLabs would be ideal but requires an API key. We'll optimize the free browser API first and note the upgrade path.

## 4. Database Persistence for Training State

**Current**: Training state lives in `localStorage` only.

**Change**: On login, check for existing `training_progress` row. If found, hydrate app state from DB. On every state change, debounce-sync to DB.

- Update `useAppState.ts` — add `syncToDb()` function that upserts to `training_progress`
- Update `Index.tsx` — load from DB on mount when user is authenticated
- Pass `user` context into the app state hook

## 5. Prevent Duplicate Email Registration

**Current**: Supabase Auth already prevents duplicate emails at the auth level. But we should also show a clear error message.

**Change**: In `Auth.tsx`, catch the specific "User already registered" error and show a friendly toast directing them to sign in instead.

## 6. Employee Practice Join Request

**Current**: Employees can only join a practice if invited by admin.

**Change**: After registration, if an employee doesn't have a practice, show a "Request to Join Practice" flow:
- New screen/modal after login where unpracticed users can search by practice name or enter a practice code
- Creates a row in `staff_invitations` with `status: 'requested'` (reversed flow)
- Admin sees requests in their Invitations tab and can approve/deny
- On approval, employee's profile gets `practice_id` set

Database changes:
- Add `'requested'` as valid status in `staff_invitations`
- Add RLS policy for authenticated users to insert their own join requests
- Add `practice_code` column to `practices` table (short unique code for lookup)

## 7. Admin Staff Removal

**Current**: Admin can revoke invitations but can't remove active staff.

**Change**: Add "Remove" button on each staff card in admin dashboard. Removes:
- Clears `practice_id` from profile
- Deletes `training_progress` for that user in this practice
- Shows confirmation dialog before removal

---

## Implementation Order

1. Database migration — add `practice_code` to practices, update staff_invitations RLS for self-requests
2. Fix logo visibility (light mode prop)
3. Random patient personas in edge function + Simulation UI
4. TTS voice improvement
5. DB sync for training state
6. Duplicate email handling
7. Practice join request flow (UI + admin approval)
8. Admin staff removal
9. Deploy edge function + test end-to-end

---

## Technical Details

- **Edge function**: `patient-sim` updated with 6 persona system prompts, selected by `patientIndex` param
- **Logo**: CSS filter approach avoids needing a second logo asset
- **TTS**: `window.speechSynthesis.getVoices()` with preference ranking; sentence chunking via regex split on `.!?`
- **DB sync**: Debounced (2s) upsert to `training_progress` table on state changes
- **Practice code**: 6-char alphanumeric generated on practice creation, used for join requests

