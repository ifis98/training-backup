import { C } from '@/data/constants';
import { Logo } from '@/components/ByteSenseLogo';
import { scrollTop } from '@/lib/helpers';
import { AppState } from '@/hooks/useAppState';
import { t, Lang } from '@/data/translations';
import { useState } from 'react';
import { LayoutDashboard, BookOpen, Bot, Brain, FileText, LogOut, ChevronLeft, ChevronRight, Briefcase, Mail } from 'lucide-react';

interface DashboardSidebarProps {
  s: AppState;
  u: (d: Partial<AppState>) => void;
  allD: boolean;
  allComplete: boolean;
  openCoach: (mode: string) => void;
  onSignOut: () => void;
  lang: Lang;
}

const glass = {
  background: "rgba(14, 14, 20, 0.85)",
  backdropFilter: C.blur,
  WebkitBackdropFilter: C.blur,
  borderRight: `1px solid ${C.glassBorder}`,
} as React.CSSProperties;

export default function DashboardSidebar({ s, u, allD, allComplete, openCoach, onSignOut, lang }: DashboardSidebarProps) {
  const T = (key: string) => t(lang, key);
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: T("sidebar_dashboard"), phase: "dashboard" },
    { id: "training", icon: BookOpen, label: T("sidebar_training"), phase: "dashboard" },
    { id: "cases", icon: Briefcase, label: T("sidebar_cases"), phase: "dashboard" },
    { id: "simulations", icon: Bot, label: T("sidebar_simulations"), phase: "simulation" },
    { id: "coach", icon: Brain, label: T("sidebar_coach"), action: () => openCoach("general") },
    { id: "report", icon: FileText, label: T("sidebar_report"), phase: "report", disabled: !allComplete && !s.signed },
    { id: "contact", icon: Mail, label: T("sidebar_contact_support") || "Contact Support", action: () => window.location.href = "mailto:support@bytesense.ai" },
    { id: "signout", icon: LogOut, label: T("sign_out"), action: onSignOut },
  ];

  return (
    <div style={{
      ...glass,
      width: collapsed ? 60 : 220,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      transition: "width 0.3s ease",
      position: "sticky",
      top: 0,
      flexShrink: 0,
      zIndex: 40,
    }}>
      {/* Logo + collapse */}
      <div style={{ padding: collapsed ? "20px 10px" : "20px 16px", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", borderBottom: `1px solid ${C.glassBorder}` }}>
        {!collapsed && <Logo size={24} light />}
        <button onClick={() => setCollapsed(!collapsed)}
          style={{ background: "none", border: "none", color: C.ash, cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {collapsed ? <ChevronRight size={16} strokeWidth={1.5} /> : <ChevronLeft size={16} strokeWidth={1.5} />}
        </button>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, padding: "12px 0" }}>
        {navItems.map(item => {
          const isActive = item.phase && s.phase === item.phase;
          const isDisabled = item.disabled;
          return (
            <div
              key={item.id}
              onClick={() => {
                if (isDisabled) return;
                if (item.action) { item.action(); return; }
                if (item.phase) { u({ phase: item.phase }); scrollTop(); }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: collapsed ? "12px 0" : "12px 20px",
                justifyContent: collapsed ? "center" : "flex-start",
                cursor: isDisabled ? "not-allowed" : "pointer",
                opacity: isDisabled ? 0.3 : 1,
                background: isActive ? "rgba(20,184,166,0.1)" : "transparent",
                borderLeft: isActive ? `3px solid ${C.teal}` : "3px solid transparent",
                transition: "all 0.2s",
                fontSize: 13,
                color: isActive ? C.teal : C.ash,
                fontWeight: isActive ? 700 : 400,
              }}
              onMouseEnter={e => { if (!isDisabled && !isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <item.icon size={18} strokeWidth={1.5} />
              {!collapsed && <span>{item.label}</span>}
            </div>
          );
        })}
      </div>

      {/* User info at bottom */}
      {!collapsed && (
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${C.glassBorder}` }}>
          <div style={{ fontSize: 11, color: C.ash, marginBottom: 4 }}>{s.name || "User"}</div>
          <div style={{ fontSize: 9, color: C.slate }}>{s.practice || ""}</div>
        </div>
      )}
    </div>
  );
}
