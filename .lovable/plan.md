

# Replace Emoji Sidebar Icons with Professional Lucide Icons

## Problem
The sidebar uses emoji characters (📊, 📋, 🤖, 🧠, 📄, 🚪) which look unprofessional. Also the collapse toggle uses text arrows (▶, ◀).

## Changes

### `src/components/DashboardSidebar.tsx`
- Import Lucide icons: `LayoutDashboard`, `BookOpen`, `Bot`, `Brain`, `FileText`, `LogOut`, `ChevronLeft`, `ChevronRight`
- Replace emoji strings with Lucide React components rendered at size 18, `strokeWidth={1.5}`, color inherited from the parent's `color` style (white/teal/ash)
- Replace the ▶/◀ collapse button text with `ChevronLeft`/`ChevronRight` Lucide icons
- Remove the `fontSize: 16` on the icon span, use the Lucide component directly

### Icon mapping
| Current | Lucide Icon |
|---------|------------|
| 📊 | `LayoutDashboard` |
| 📋 | `BookOpen` |
| 🤖 | `Bot` |
| 🧠 | `Brain` |
| 📄 | `FileText` |
| 🚪 | `LogOut` |
| ▶/◀ | `ChevronRight`/`ChevronLeft` |

All icons will be white outline style — clean, minimal, professional.

### Testing
After implementation, I'll test the dashboard end-to-end in the browser to verify:
- Sidebar renders with outline icons
- Collapse/expand works
- Navigation between sections works
- Chart tooltips have no white box
- Logo click returns to dashboard
- Donut chart text is not overlapped

