

# ByteSense — Registration Keycodes, ByteSense Admin Portal, AI Coach & Success Dashboard

## Summary

This is a large feature set across 6 areas: (1) logo icon color fix, (2) landing page routing fix + logo click navigation, (3) secure registration keycode system, (4) ByteSense internal admin portal for code generation and practice tracking, (5) AI Coach on every dashboard, (6) coaching session summary after simulations.

---

## 1. Logo Fix — Keep Icon Color, Only Invert Text

**Current**: `filter: brightness(0) invert(1)` inverts the entire logo (icon + text) to white on dark backgrounds.

**Fix**: Since the logo is a single PNG with icon + text, we can't selectively filter parts. Two options:
- **Option A**: Use two separate image elements — the icon portion stays unfiltered, and we overlay white text separately via CSS/HTML. This requires slicing the logo or using a text overlay.
- **Option B**: Keep current behavior but note the icon's original color is already visible enough on dark backgrounds without the filter — remove the filter from the icon portion if the logo is split into two assets.

**Practical approach**: Since we only have one PNG, we'll keep the icon as-is (no filter) and accept that the text in the logo also shows in its original color. If the text is dark and invisible on dark bg, we'll add a subtle `drop-shadow` or `brightness` filter that brightens only the text portion. The simplest fix: remove `brightness(0) invert(1)` and instead use `drop-shadow(0 0 1px white)` to make dark text legible without changing icon color.

## 2. Landing Page Routing + Logo Click

**Current issue**: User not seeing the landing page first. The routing in `App.tsx` looks correct (`/` redirects to `/welcome` when not logged in). Likely the user navigated directly to `/register`.

**Fixes**:
- Ensure the root URL `/` always shows the landing page for unauthenticated users (already working in code)
- Make the ByteSense logo on Auth pages (`/login`, `/register`) clickable → navigates to `/welcome`
- Add a "← Back" link or make the logo a link on all auth pages

## 3. Secure Registration Keycode System

**Current**: Practice owners register freely. Staff use a "practice code" to join.

**New requirement**: ALL registrations (practice owners) require a **ByteSense-issued keycode** from their sales rep. This prevents competitors from accessing training.

**Database changes**:
- New table `registration_codes`:
  - `id` (uuid, PK)
  - `code` (text, unique, 8-char alphanumeric)
  - `practice_name` (text) — pre-assigned practice name
  - `rep_name` (text) — sales rep who issued it
  - `status` (text: 'active', 'used', 'expired')
  - `created_at`, `expires_at` (48h from creation)
  - `used_by` (uuid, nullable — links to user who used it)
  - `used_at` (timestamp, nullable)

**Registration flow change**:
- Remove "I'm the Practice Owner / I'm a Staff Member" toggle
- Step 1: Enter your ByteSense Registration Code (required)
- If valid code → show full registration form (name, email, password, practice name pre-filled from code)
- If no code → show "Don't have a code?" link → "Request a Demo / Learn More" → opens Calendly or a request form
- Code is marked `used` + `expired` after successful registration
- Staff still join via the practice's internal 6-char practice code (unchanged)

**Expiration**: A DB function or edge function checks `expires_at < now()` and marks codes expired. We'll use a trigger or check at validation time.

## 4. ByteSense Internal Admin Portal

A **separate admin dashboard** for ByteSense HQ (not practice admins) to:

**Code Management**:
- Generate registration codes (single or batch)
- Set expiration (default 48h)
- Assign to practice name + rep name
- View all codes: active, used, expired
- Revoke codes

**Practice Tracking**:
- View all registered practices
- See each practice's staff, training progress, completion rates
- View demo requests from the "Request Info" flow

**Database**:
- New table `demo_requests`: id, name, email, practice_name, phone, message, created_at, status
- New `user_roles` enum value: `'bytesense_admin'` — super-admin role for ByteSense HQ staff
- RLS: Only `bytesense_admin` users can read/write `registration_codes` and view all practices

**Access**: New route `/bytesense-admin` — protected, only accessible to users with `bytesense_admin` role.

## 5. AI Coach on Every Dashboard

An always-available **AI Coach** button/panel on the practice dashboard (and admin dashboard) that staff can use to:

- Ask about situations not covered in training modules
- Get advice on handling specific patient objections
- Generate follow-up messages (SMS, email, letters)
- Generate educational materials for patients
- Create custom treatment plan templates
- Get scripts for specific scenarios

**Implementation**:
- Floating "AI Coach" button (bottom-right) on the dashboard
- Opens a slide-out chat panel
- Uses the same `patient-sim` edge function pattern but with a different system prompt (coaching mode, not patient roleplay)
- New edge function: `ai-coach` that has the full training knowledge + practice context
- Conversation history stored in a new `coach_conversations` table (optional, or just session-based)

## 6. Coaching Session Summary

After completing a patient simulation (or clicking "End Session"):
- Show a summary screen with:
  - Number of coaching tips received
  - Key areas where the employee struggled
  - Specific training modules to review
  - Overall performance rating (AI-generated)
  - Tips for improvement

**Implementation**: After the simulation ends, call the AI with the full conversation + coaching tips and ask it to generate a structured summary. Display as a results card before returning to dashboard.

## 7. Enhanced Practice Dashboard

Add to the existing practice dashboard:
- **AI Coach** floating button (see #5)
- **Quick Tools** section:
  - Generate patient follow-up message
  - Create treatment plan template
  - Generate consent form
  - Educational material generator
- **Admin button** (for practice owners) to access staff management
- Make it feel like a "command center for success"

---

## Implementation Order (across multiple messages due to scope)

### Phase A (this implementation):
1. Database migration — `registration_codes`, `demo_requests` tables, `bytesense_admin` role
2. Logo fix — drop-shadow approach for dark backgrounds
3. Landing page — logo click → `/welcome`, ensure routing works
4. Registration keycode flow — validate code, "Request Demo" fallback
5. ByteSense Admin Portal — code generation, practice tracking

### Phase B (next implementation):
6. AI Coach edge function + floating chat panel
7. Coaching session summary after simulations
8. Dashboard enhancements (quick tools, AI-generated content)
9. Follow-up message generator, treatment plan tools

---

## Technical Details

- **Registration codes**: 8-char uppercase alphanumeric, generated via DB function similar to `generate_practice_code`
- **Expiration check**: Validate at registration time: `status = 'active' AND expires_at > now()`
- **ByteSense admin role**: New enum value `'bytesense_admin'` added to `app_role` enum
- **AI Coach**: New edge function `ai-coach` using `google/gemini-3-flash-preview` with training knowledge system prompt
- **RLS**: `registration_codes` readable only by `bytesense_admin`, writable only by `bytesense_admin`. Authenticated users can validate a code via an RPC function (security definer)
- **Logo**: Replace `brightness(0) invert(1)` with `drop-shadow` or a CSS mix-blend approach

