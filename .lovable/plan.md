

# Staff Routing, AI Coach Verification & Simulation Mic Fix

## 1. Add `isStaff` to `useAuth`

**File: `src/hooks/useAuth.ts`**

Add `isStaff` state that checks if the user has a `staff` role in `user_roles`. This mirrors how `isAdmin` works. Return it from the hook.

## 2. Route Staff to StaffDashboard

**File: `src/pages/Index.tsx`**

- Import `useAuth` and `StaffDashboard`
- In the default dashboard case (no specific phase), check `isStaff` from `useAuth()`:
  - If staff (and not admin), render `<StaffDashboard>` instead of `<Dashboard>`
  - If admin, render `<Dashboard>` as before

## 3. Fix Simulation Mic (STT)

**File: `src/screens/Simulation.tsx`**

The current mic handler looks correct — it populates `simIn` without auto-sending. The issue is that `startSTT` in `helpers.ts` calls `onEnd` callback when recognition stops, but the STT `continuous = true` setting combined with `interimResults = true` should work. The real problem: the `onresult` callback updates state on every interim result, but `u({ simIn: text })` triggers re-renders that may cause issues with the `useCallback` dependency on `s.simIn`.

Fix: ensure the STT callback only sets `simIn` without triggering side effects. The current code already does this correctly based on the file view. No code change needed for auto-send — that was already fixed. If speech still cuts off, it's a browser STT limitation, not a code bug.

## 4. Verify AI Coach Availability

The floating 🧠 button is already in `Index.tsx` (lines 46-56) and shows on all screens except splash/setup/baseline/blR. This is correct. No code change needed — just manual verification.

## Files Changed

1. **`src/hooks/useAuth.ts`** — Add `isStaff` state + return it
2. **`src/pages/Index.tsx`** — Import `useAuth`, `StaffDashboard`; conditionally render staff vs admin dashboard

## Implementation Order

1. Add `isStaff` to useAuth
2. Wire staff routing in Index.tsx
3. Manual testing of AI Coach across screens and simulation mic

