import { C } from '@/data/constants';
import { Logo } from '@/components/ByteSenseLogo';
import { scrollTop } from '@/lib/helpers';
import { AppState } from '@/hooks/useAppState';
import { t, Lang } from '@/data/translations';
import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { LayoutDashboard, TrendingUp, Package, Building2, Award, Mail, LogOut, ChevronLeft, ChevronRight, Settings, Swords } from 'lucide-react';

interface DashboardSidebarProps {
  s: AppState;
  u: (d: Partial<AppState>) => void;
  allD: boolean;
  allComplete: boolean;
  openCoach: (mode: string) => void;
  onSignOut: () => void;
  onOpenSettings: () => void;
  onOpenPanel: (src: string, title: string) => void;
  lang: Lang;
  activePanel?: string | null;
}

const glass = {
  background: "var(--bs-glass)",
  backdropFilter: C.blur,
  WebkitBackdropFilter: C.blur,
  borderRight: `1px solid var(--bs-border)`,
} as React.CSSProperties;

export default function DashboardSidebar({ s, u, allD, allComplete, openCoach, onSignOut, onOpenSettings, onOpenPanel, lang, activePanel }: DashboardSidebarProps) {
  const T = (key: string) => t(lang, key);
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);

  // Keep CSS variable in sync so SlidingPanel knows where to start
  useEffect(() => {
    if (!isMobile) {
      document.documentElement.style.setProperty('--bs-sidebar-w', collapsed ? '60px' : '220px');
    }
  }, [collapsed, isMobile]);

  const scrollToSection = (sectionId: string) => {
    u({ phase: "dashboard" });
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const navItems = [
    { id: "dashboard",        icon: LayoutDashboard, label: "Dashboard",             phase: "dashboard", action: () => { u({ phase: "dashboard" }); scrollTop(); } },
    { id: "sales-training",   icon: TrendingUp,      label: "Sales Training",        phase: "sales-training" },
    { id: "product-training", icon: Package,         label: "Product Experience",    phase: "product-experience" },
    { id: "office-workflow",  icon: Building2,       label: "Office Workflow",       phase: "office-workflow" },
    { id: "roleplay",         icon: Swords,          label: "Roleplay Simulation",   phase: "roleplay" },
    { id: "report",           icon: Award,           label: "Reports & Certificates", phase: "report", disabled: !allComplete && !s.signed },
    { id: "contact",          icon: Mail,            label: "Contact Support",       phase: "contact-support" },
    { id: "settings",         icon: Settings,        label: "Settings",              action: onOpenSettings },
    { id: "signout",          icon: LogOut,          label: T("sign_out"),           action: onSignOut },
  ];

  // Mobile: no bottom nav — navigation lives in the hamburger drawer in Dashboard header
  if (isMobile) return null;

  // Desktop: side navigation
  return (
    <div style={{
      ...glass,
      width: collapsed ? 60 : 220,
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      transition: "width 0.3s ease",
      position: "fixed",
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 40,
      overflow: "hidden",
    }}>
      {/* Logo + collapse */}
      <div style={{ padding: collapsed ? "20px 10px" : "20px 16px", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", borderBottom: "1px solid var(--bs-border)" }}>
        {!collapsed && <Logo size={24} light />}
        <button onClick={() => setCollapsed(!collapsed)}
          style={{ background: "none", border: "none", color: "var(--bs-ash)", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {collapsed ? <ChevronRight size={16} strokeWidth={1.5} /> : <ChevronLeft size={16} strokeWidth={1.5} />}
        </button>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
        {navItems.map(item => {
          const isActive = !!(item.phase && s.phase === item.phase);
          const isDisabled = (item as any).disabled;
          return (
            <div
              key={item.id}
              onClick={() => {
                if (isDisabled) return;
                if (item.action) { item.action(); return; }
                if (item.phase) { u({ phase: item.phase }); scrollTop(); }
              }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: collapsed ? "12px 0" : "12px 20px",
                justifyContent: collapsed ? "center" : "flex-start",
                cursor: isDisabled ? "not-allowed" : "pointer",
                opacity: isDisabled ? 0.3 : 1,
                background: isActive ? "rgba(20,184,166,0.1)" : "transparent",
                borderLeft: isActive ? `3px solid ${C.teal}` : "3px solid transparent",
                transition: "all 0.2s", fontSize: 13,
                color: isActive ? C.teal : "var(--bs-ash)",
                fontWeight: isActive ? 700 : 400,
              }}
              onMouseEnter={e => { if (!isDisabled && !isActive) e.currentTarget.style.background = "var(--bs-card)"; }}
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
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--bs-border)" }}>
          <div style={{ fontSize: 11, color: "var(--bs-ash)", marginBottom: 4 }}>{s.name || "User"}</div>
          <div style={{ fontSize: 9, color: "var(--bs-ash)" }}>{s.practice || ""}</div>
        </div>
      )}
    </div>
  );
}
