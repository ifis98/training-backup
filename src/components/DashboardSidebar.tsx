import { C } from '@/data/constants';
import { Logo } from '@/components/ByteSenseLogo';
import { scrollTop } from '@/lib/helpers';
import { AppState } from '@/hooks/useAppState';
import { t, Lang } from '@/data/translations';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);

  const scrollToSection = (sectionId: string) => {
    u({ phase: "dashboard" });
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: T("sidebar_dashboard"), mobileLabel: "Home", phase: "dashboard", action: () => { u({ phase: "dashboard" }); scrollTop(); } },
    { id: "training", icon: BookOpen, label: T("sidebar_training"), mobileLabel: "Training", action: () => scrollToSection("section-training") },
    { id: "cases", icon: Briefcase, label: T("sidebar_cases"), mobileLabel: "Cases", action: () => scrollToSection("section-cases") },
    { id: "simulations", icon: Bot, label: T("sidebar_simulations"), mobileLabel: "Simulate", phase: "simulation" },
    { id: "coach", icon: Brain, label: T("sidebar_coach"), mobileLabel: "Coach", action: () => openCoach("general") },
    { id: "report", icon: FileText, label: T("sidebar_report"), mobileLabel: "Report", phase: "report", disabled: !allComplete && !s.signed },
    { id: "contact", icon: Mail, label: T("sidebar_contact_support") || "Contact Support", mobileLabel: "Support", action: () => window.location.href = "mailto:support@bytesense.ai" },
    { id: "signout", icon: LogOut, label: T("sign_out"), mobileLabel: "Sign Out", action: onSignOut },
  ];

  // Mobile: fixed bottom navigation bar (4 core items only)
  if (isMobile) {
    const mobileItems = [
      navItems[0], // Dashboard
      navItems[1], // Training
      navItems[3], // AI Simulations
      navItems[4], // AI Coach
    ];
    return (
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        background: "rgba(10, 10, 14, 0.98)",
        backdropFilter: C.blur,
        WebkitBackdropFilter: C.blur,
        borderTop: `1px solid ${C.glassBorder}`,
        display: "flex",
        alignItems: "stretch",
        zIndex: 100,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
        {mobileItems.map(item => {
          const isActive = item.phase && s.phase === item.phase;
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
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                cursor: isDisabled ? "not-allowed" : "pointer",
                opacity: isDisabled ? 0.3 : 1,
                color: isActive ? C.teal : "rgba(160,160,180,0.7)",
                borderTop: isActive ? `2px solid ${C.teal}` : "2px solid transparent",
                background: isActive ? "rgba(20,184,166,0.06)" : "transparent",
                transition: "all 0.2s",
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: isActive ? "rgba(20,184,166,0.12)" : "transparent",
                transition: "all 0.2s",
              }}>
                <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              </div>
              <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 400, letterSpacing: 0.2, fontFamily: C.fn }}>{(item as any).mobileLabel || item.label}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // Desktop: side navigation
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
