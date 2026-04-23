

# Improve ByteSense Admin Portal + Add Password Reset

## Goals
1. Polish the ByteSense Admin portal UI/UX (better layout, clearer hierarchy, more useful data)
2. Add password reset / recovery flow accessible from the login page

## Part 1 — Admin Portal Improvements (`src/pages/ByteSenseAdmin.tsx`)

### Layout & Navigation
- Add a left sidebar nav (instead of horizontal tabs) with icons + labels: Overview, Codes, Practices, Demos, Settings
- Sticky top bar with admin email, sign-out button, and a global search input
- Increase max content width to 1200px and use a 2-column responsive grid for cards

### Overview tab — make it actually useful
- KPI row: Practices, Active Codes, Pending Demos, Total Staff, plus 2 new tiles: **Codes Used (30d)** and **Conversion Rate** (demos converted ÷ demos total)
- Add a **Recent Activity** feed (last 10 events: code generated, code used, demo submitted, practice registered) sourced by union-ing `registration_codes`, `demo_requests`, `practices` ordered by created_at
- Add **Top Practices by Training Progress** list (top 5 by completed modules)
- Charts: keep Staff-by-Practice bar + Demo status pie, add a **Codes status pie** (active/used/expired/revoked)

### Codes tab improvements
- Add filter pills (All / Active / Used / Expired / Revoked) and a search box (by code, practice, or rep)
- Add **Copy code** button next to each code (clipboard + toast)
- Add **Bulk export CSV** button (downloads visible codes)
- Show "used by" email when status = used (join via `used_by` → `profiles.full_name`)
- Sort + pagination for >50 codes

### Practices tab improvements
- Click a practice row to expand and show: staff list (names, last activity), training progress per staff, practice code with copy button, registration date
- Add search box (by practice name or code)
- Add a **Resend invite** action and a **Deactivate practice** action (sets a flag — needs schema check)

### Demos tab improvements
- Add status filter pills (New / Contacted / Converted / Rejected)
- Add inline **status changer** dropdown (update `demo_requests.status`)
- Add a **Notes** field per demo (textarea, saves to a new `admin_notes` column — migration needed)
- Add **Mark as converted** button that auto-generates a registration code and pre-fills the practice name from the demo

### Settings tab (new)
- Show admin profile info
- Button to change password
- List of all bytesense_admin users with ability to invite another admin (sends invite email)

## Part 2 — Password Reset Flow

### Login page (`src/pages/Auth.tsx`)
- Add **"Forgot password?"** link below the password field
- Clicking opens an inline form: enter email → calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })` → toast "Check your email"

### New page `src/pages/ResetPassword.tsx`
- Public route at `/reset-password`
- Detects `type=recovery` token from URL
- Shows form with new password + confirm password
- Calls `supabase.auth.updateUser({ password })` → redirects to `/` on success

### Route registration (`src/App.tsx`)
- Add `<Route path="/reset-password" element={<ResetPassword />} />` as a public route

### Username recovery
- Email IS the username in this system. Add helper text on the login page: "Forgot your email? Contact support@bytesense.ai" (since we can't look up emails from arbitrary user input for security)

## Part 3 — Auth Email Templates (branded)
- Set up custom branded password-reset email using ByteSense colors (red #CC1010, dark, Outfit font) so the recovery email matches the brand
- This requires an email domain to be configured first — if none exists, show the email setup dialog

## Database changes
1. Add `admin_notes text` column to `demo_requests`
2. Add `is_active boolean default true` column to `practices` (for deactivation)
3. No RLS changes — existing `bytesense_admin` policies cover the new column reads/writes

## Files changed
1. `src/pages/ByteSenseAdmin.tsx` — full UI overhaul (sidebar, new sections, filters, search, copy buttons, expandable rows, settings tab)
2. `src/pages/Auth.tsx` — add Forgot password link + inline form
3. `src/pages/ResetPassword.tsx` — NEW page
4. `src/App.tsx` — register new route
5. Migration — add `admin_notes` and `is_active` columns
6. Auth email templates — scaffold + brand the recovery template

## Implementation order
1. Database migration
2. Password reset page + route + Auth.tsx link
3. Admin portal: sidebar nav + overview redesign
4. Admin portal: codes tab (filters, search, copy, CSV)
5. Admin portal: practices tab (expandable, search)
6. Admin portal: demos tab (filters, status changer, notes, convert action)
7. Admin portal: settings tab
8. Branded auth email template (if email domain ready, otherwise prompt user)

