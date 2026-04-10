

# Fix Simulation Auto-Send, Persistent AI Coach, and Staff Dashboard

## Problems

1. **Simulation auto-sends mid-sentence**: The microphone handler in `Simulation.tsx` calls `setTimeout(() => sendMessage(text), 300)` immediately after speech recognition returns — sending without letting the user review or edit. The text input also has no friction before sending.

2. **AI Coach availability**: The floating 🧠 button and AI Coach panel only exist on the main Dashboard screen. It should be accessible from all screens (Simulation, ModuleView, etc.).

3. **No staff dashboard**: `AdminDashboard.tsx` exists for practice owners but there's no dedicated staff-facing dashboard where individual staff members can see their own progress, access the AI Coach, and use quick tools.

## Plan

### 1. Fix Simulation Mic Auto-Send

**File: `src/screens/Simulation.tsx`**

Remove the `setTimeout(() => sendMessage(text), 300)` from `handleMic`. Instead, just populate the input field with the transcribed text and let the user review and press Send manually.

Before:
```
startSTT((text) => { u({ lst: false, simIn: text }); setTimeout(() => sendMessage(text), 300); });
```

After:
```
startSTT((text) => { u({ lst: false, simIn: text }); });
```

### 2. Make AI Coach Available App-Wide

**File: `src/pages/Index.tsx`**

Move the floating 🧠 button and `<AICoach>` panel from `Dashboard.tsx` into `Index.tsx` so it renders on every screen (dashboard, module, simulation, etc.). Add state for `showCoach` and `coachMode` at the Index level.

The Dashboard will keep its Quick Tools grid (which opens the coach in specific modes), but the floating button and panel will live at the parent level.

### 3. Create Staff Dashboard

**New file: `src/screens/StaffDashboard.tsx`**

A dedicated view for staff members (non-owners) showing:
- Their personal training progress (modules completed, XP, baseline score)
- Progress bar toward certification
- Quick access to AI Coach modes (same Quick Tools grid as owner dashboard)
- Practice info (name, their role)
- Quick Reference card
- Simulation access

**File: `src/pages/Index.tsx`** — Route staff users to `StaffDashboard` when their role is `staff` (check `user_roles` table), while practice owners (`admin` role) continue seeing the current Dashboard.

**File: `src/hooks/useAuth.ts`** — Already exposes `isAdmin`. We'll use this to determine which dashboard to show.

## Files Changed

1. `src/screens/Simulation.tsx` — Remove auto-send from mic handler (1 line)
2. `src/pages/Index.tsx` — Add floating AI Coach button + panel wrapper around all screens; route staff vs admin dashboard
3. `src/screens/Dashboard.tsx` — Remove floating button and AICoach panel (moved to Index)
4. `src/screens/StaffDashboard.tsx` — New staff-facing dashboard component

## Implementation Order

1. Fix mic auto-send in Simulation
2. Move AI Coach to Index (app-wide)
3. Build StaffDashboard
4. Wire routing logic in Index

