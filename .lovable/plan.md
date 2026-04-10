

# Premium UI Overhaul + ByteSense Admin Data Access + Email Notifications

This is a large scope. The plan is organized into clear deliverables.

## What Changes

### 1. Design System Upgrade — Glassmorphism + Modern Polish

**File: `src/data/constants.ts`** — Add new design tokens:
- Gradient definitions (e.g., `gradTeal`, `gradRed`, `gradGold`)
- Glass effect values (`glass: "rgba(20,20,24,0.6)"`, `glassBorder: "rgba(255,255,255,0.08)"`)
- Border radius tokens (`radius: "16px"`, `radiusSm: "12px"`)
- Shadow/glow tokens for cards
- Backdrop blur values

### 2. Owner Dashboard Redesign (`src/screens/Dashboard.tsx`)

Full visual overhaul — same data, premium presentation:
- **KPI Cards**: Glassmorphic cards with `backdrop-filter: blur(20px)`, subtle gradient borders, animated number counters, and soft glow effects matching each card's accent color
- **Charts**: Rounded corners, gradient fills instead of flat colors, custom styled tooltips with glass effect, smooth area charts with gradient fills
- **Revenue Calculator**: Redesigned with custom-styled range sliders (teal/gold/red tracks), glass comparison cards with animated value transitions
- **Goals & Notes**: Rounded inputs, subtle hover states, glass card containers
- **Quick Tools**: Cards with gradient hover effects, icon containers with colored glass backgrounds, micro-interactions on hover
- **Training Modules accordion**: Smooth expand/collapse, progress rings instead of dots, phase color gradients
- **Header**: Subtle gradient background, avatar placeholder, refined typography hierarchy
- Overall: rounded corners everywhere (no sharp boxes), consistent 16px radius, smooth transitions

### 3. Staff Dashboard Redesign (`src/screens/StaffDashboard.tsx`)

Same glassmorphic treatment as owner dashboard, focused on personal metrics. Matching visual language — glass KPI cards, gradient charts, refined training module list.

### 4. AI Coach Visual Overhaul (`src/components/AICoach.tsx`)

- Glass background overlay with blur
- Rounded message bubbles with gradient accents
- Mode tabs: pill-shaped with gradient active state
- Input area: glass container with rounded input, gradient send button
- Typing indicator: animated dots instead of text
- Saved responses tab: glass cards with refined typography
- Overall: feels like a premium AI chat interface (think ChatGPT/Claude-level polish)

### 5. ByteSense Admin Portal Enhancement (`src/pages/ByteSenseAdmin.tsx`)

- Same glassmorphic design system
- Add KPI summary cards at top (total practices, active codes, pending demos, total staff)
- Charts: practice growth over time, demo request funnel
- Demo requests now show the expanded fields (operatories, scanner type, goals, monthly patients, guard price, etc.) in an expandable detail view
- Tab navigation: pill-shaped, gradient active states

### 6. Welcome/Landing Page Polish (`src/pages/Welcome.tsx`)

- Hero: add subtle animated gradient background, refined typography
- Revenue calculator: same premium treatment as dashboard version
- Demo form: glass-styled multi-step form, refined inputs with focus glow effects, progress dots for steps
- Feature cards: glassmorphic with hover lift effects
- CTA buttons: gradient backgrounds with hover glow

### 7. Admin Access to All Dashboard Data

**File: `src/pages/ByteSenseAdmin.tsx`** — Add new tabs/views:
- **Practice Dashboards**: ByteSense admins can view any practice's training progress, staff completion, XP totals, simulation counts
- **Demo Request Details**: Expandable rows showing all collected data (scanner type, goals, guard price, monthly patients, operatories, practice size)
- **Analytics Overview**: Aggregate stats across all practices — total users, average completion rate, total XP earned, most common goals

### 8. Email Notification Setup

This requires setting up email infrastructure. The plan:
- When a demo request is submitted, notify ByteSense team via email
- When staff complete training milestones, notify practice owner
- This will require email domain setup through Lovable Cloud

I will check if email infrastructure exists and guide you through setup if needed. For now, the UI changes come first — email can be wired up after.

## Files Changed

1. `src/data/constants.ts` — New design tokens (glass, gradients, radii, shadows)
2. `src/screens/Dashboard.tsx` — Full glassmorphic redesign
3. `src/screens/StaffDashboard.tsx` — Matching premium redesign
4. `src/components/AICoach.tsx` — Premium chat UI overhaul
5. `src/pages/ByteSenseAdmin.tsx` — Glass design + expanded data views + KPI cards + charts
6. `src/pages/Welcome.tsx` — Landing page polish + glass demo form
7. `src/index.css` — Add global glass utility classes, custom scrollbar styling, animated gradient keyframes

## Implementation Order

1. Design tokens in constants.ts + global CSS
2. Dashboard.tsx (owner) — largest file, sets the visual standard
3. StaffDashboard.tsx — mirrors owner dashboard style
4. AICoach.tsx — premium chat experience
5. ByteSenseAdmin.tsx — admin portal with expanded data
6. Welcome.tsx — landing page polish
7. Email notifications (separate step, requires domain setup)

