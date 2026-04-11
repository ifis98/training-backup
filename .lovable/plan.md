

# Email Notifications + Staff Case Entry + In-App Booking + E2E Testing

## 1. Email Notifications on Follow-Up Status Change

When a case status is updated to `follow_up`, trigger an email notification to the assigned staff member. This requires:
- Setting up email infrastructure (email domain + transactional email scaffold)
- Creating an edge function `notify-case-followup` that sends the email
- Updating `handleUpdateCaseStatus` in `Dashboard.tsx` to invoke the edge function when status changes to `follow_up`

**Prerequisite**: Email domain must be configured first. I'll check the status and set it up if needed.

## 2. Staff Case Entry on StaffDashboard

Port the case pipeline UI from `Dashboard.tsx` to `StaffDashboard.tsx`:
- Add state for cases, case filter, new case form (same pattern as Dashboard)
- Add `useEffect` to load cases for the staff member's practice
- Add `handleAddCase` and `handleUpdateCaseStatus` functions
- Render the Case Pipeline section with add form, filter tabs, and case list
- Staff can add cases and update statuses but cannot edit practice goals

## 3. In-App Booking Page

Create a new screen/section accessible from the "Schedule Support Call" button:
- **Database**: New `support_bookings` table (id, name, email, booking_date, booking_time, status, created_at)
- **UI**: A booking modal/page showing a calendar with only M/W/F dates selectable, time slots from 10am-4pm PST in 30-minute increments
- **Logic**: Check existing bookings to hide taken slots, save new booking to DB
- Replace the `calendly.com` link in both dashboards with an in-app booking flow

## 4. End-to-End Browser Testing

After implementation, test in the browser:
- Sidebar navigation (each item click, collapse/expand)
- Edit Goals button → save → verify progress bars update
- Training Complete button → navigates to simulation
- Chart tooltip hover → no white box
- Case pipeline: add a case, change status, verify follow-up notification triggers
- Booking flow: open booking, select date/time, confirm

## Files changed

1. **Database migration** — create `support_bookings` table with RLS
2. **`src/screens/StaffDashboard.tsx`** — add case pipeline section (add/view/update cases)
3. **`src/screens/Dashboard.tsx`** — add email trigger on follow-up status change, replace calendly link with booking UI
4. **`src/components/BookingModal.tsx`** (new) — in-app booking UI with calendar + time slots (M/W/F 10-4pm PST)
5. **`src/data/translations.ts`** — new keys for booking UI
6. **Edge function** — `notify-case-followup` for email notification (after email domain setup)

## Implementation order

1. Database migration (support_bookings table)
2. Build BookingModal component
3. Wire booking into both dashboards (replace calendly links)
4. Add case pipeline to StaffDashboard
5. Set up email infrastructure + follow-up notification edge function
6. Add translation keys
7. Browser testing

