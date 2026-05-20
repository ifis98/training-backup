import { C } from '@/data/constants';
import { Logo } from '@/components/ByteSenseLogo';
import { scrollTop } from '@/lib/helpers';
import { AppState } from '@/hooks/useAppState';
import { t, Lang } from '@/data/translations';
import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Package, Building2, Mail, ChevronLeft, ChevronRight, Settings, Swords, Phone, ShieldCheck, ClipboardList } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface DashboardSidebarProps {
  s: AppState;
  u: (d: Partial<AppState>) => void;
  allD: boolean;
  allComplete: boolean;
  onSignOut: () => void;
  onOpenSettings: () => void;
  onOpenBooking?: () => void;
  lang: Lang;
}

const glass = {
  background: "var(--bs-glass)",
  backdropFilter: C.blur,
  WebkitBackdropFilter: C.blur,
  borderRight: `1px solid var(--bs-border)`,
} as React.CSSProperties;

export default function DashboardSidebar({ s, u, allD, allComplete, onSignOut, onOpenSettings, onOpenBooking, lang }: DashboardSidebarProps) {
  const T = (key: string) => t(lang, key);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { isByteSenseAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  // Determine active item from current URL path
  const path = location.pathname;
  const activeId = path === '/app' || path === '/'
    ? 'dashboard'
    : path.startsWith('/sales-training')       ? 'sales-training'
    : path.startsWith('/product-experience')   ? 'product-training'
    : path.startsWith('/office-workflow')      ? 'office-workflow'
    : path.startsWith('/office-onboarding')    ? 'office-onboarding'
    : path.startsWith('/roleplay')             ? 'roleplay'
    : path.startsWith('/ai-coach')             ? 'ai-coach'
    : path.startsWith('/contact-support')      ? 'contact'
    : s.phase === 'report'                     ? 'report'
    : 'dashboard';

  const navItems = [
    { id: "dashboard",          icon: LayoutDashboard, label: "Dashboard",           action: () => { u({ phase: "dashboard" }); navigate('/app'); scrollTop(); } },
    { id: "sales-training",     icon: TrendingUp,      label: "Sales Training",      action: () => { navigate('/sales-training'); scrollTop(); } },
    { id: "product-training",   icon: Package,         label: "Product Experience",  action: () => { navigate('/product-experience'); scrollTop(); } },
    { id: "office-workflow",    icon: Building2,       label: "Office Workflow",     action: () => { navigate('/office-workflow'); scrollTop(); } },
    { id: "roleplay",           icon: Swords,          label: "Roleplay Simulation", action: () => { navigate('/roleplay'); scrollTop(); } },
    { id: "contact",            icon: Mail,            label: "Contact Support",     action: () => { navigate('/contact-support'); scrollTop(); } },
    { id: "settings",           icon: Settings,        label: "Settings",            action: onOpenSettings },
  ];

  // Mobile: fixed top header + slide-out left drawer
  if (isMobile) {
    return (
      <>
        {/* Fixed top header bar */}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 60, zIndex: 50,
          ...glass,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px',
        }}>
          <Logo size={20} light />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {onOpenBooking && (
              <button
                onClick={onOpenBooking}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: C.teal, border: 'none', borderRadius: 999,
                  padding: '0 14px', height: 34, cursor: 'pointer',
                  fontSize: 11, fontWeight: 700, color: '#000', fontFamily: C.fn,
                  whiteSpace: 'nowrap',
                }}
              >
                <Phone size={12} strokeWidth={2.5} />
                Schedule Call
              </button>
            )}
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6,
                display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center', justifyContent: 'center' }}
            >
              <span style={{ width: 22, height: 2, background: 'var(--bs-ash)', borderRadius: 2, display: 'block' }} />
              <span style={{ width: 22, height: 2, background: 'var(--bs-ash)', borderRadius: 2, display: 'block' }} />
              <span style={{ width: 22, height: 2, background: 'var(--bs-ash)', borderRadius: 2, display: 'block' }} />
            </button>
          </div>
        </div>

        {/* Backdrop */}
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 200,
            opacity: mobileOpen ? 1 : 0, pointerEvents: mobileOpen ? 'auto' : 'none',
            transition: 'opacity 0.25s ease',
          }}
        />

        {/* Slide-out drawer from left */}
        <div style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: 280, zIndex: 201,
          ...glass,
          display: 'flex', flexDirection: 'column',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: "none",
        }}>
          {/* Drawer header */}
          <div style={{ padding: '18px 20px 14px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', borderBottom: '1px solid var(--bs-border)', flexShrink: 0 }}>
            <Logo size={22} light />
            <button onClick={() => setMobileOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--bs-ash)',
                cursor: 'pointer', padding: 6, fontSize: 20, lineHeight: 1, display: 'flex', alignItems: 'center' }}>
              <ChevronLeft size={20} strokeWidth={2} />
            </button>
          </div>

          {/* Nav items */}
          <div style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
            {navItems.map(item => {
              const isActive = activeId === item.id;
              const isDisabled = (item as any).disabled;
              return (
                <div key={item.id}
                  onClick={() => {
                    if (isDisabled) return;
                    setMobileOpen(false);
                    if (item.action) item.action();
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '0 20px', minHeight: 52,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    opacity: isDisabled ? 0.3 : 1,
                    background: isActive ? `rgba(20,184,166,0.1)` : 'transparent',
                    borderLeft: `3px solid ${isActive ? C.teal : 'transparent'}`,
                    color: isActive ? C.teal : 'var(--bs-ash)',
                    fontWeight: isActive ? 700 : 400, fontSize: 14,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!isDisabled && !isActive) e.currentTarget.style.background = 'var(--bs-card)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <item.icon size={18} strokeWidth={1.5} />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>

          {/* Office Onboarding — mobile */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--bs-border)', flexShrink: 0 }}>
            <button
              onClick={() => { setMobileOpen(false); navigate('/office-onboarding'); scrollTop(); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                background: activeId === 'office-onboarding' ? 'rgba(229,62,62,0.18)' : 'rgba(229,62,62,0.08)',
                border: `1px solid ${activeId === 'office-onboarding' ? 'rgba(229,62,62,0.5)' : 'rgba(229,62,62,0.25)'}`,
                borderRadius: 8, padding: '10px 14px',
                cursor: 'pointer', fontFamily: C.fn,
              }}
            >
              <ClipboardList size={15} color={C.red} strokeWidth={2} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: C.red }}>Office Onboarding</span>
            </button>
          </div>

          {/* Admin Panel — mobile (only for bytesense admins) */}
          {isByteSenseAdmin && (
            <div style={{ padding: '0 16px 10px', flexShrink: 0 }}>
              <button
                onClick={() => { setMobileOpen(false); navigate('/bytesense-admin'); scrollTop(); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(212,175,55,0.08)',
                  border: '1px solid rgba(212,175,55,0.25)',
                  borderRadius: 8, padding: '10px 14px',
                  cursor: 'pointer', fontFamily: C.fn,
                }}
              >
                <ShieldCheck size={15} color={C.gold} strokeWidth={2} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.gold }}>Admin Panel</span>
              </button>
            </div>
          )}

          {/* User info */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--bs-border)', flexShrink: 0 }}>
            <div style={{ fontSize: 12, color: 'var(--bs-ash)', marginBottom: 2 }}>{s.name || 'User'}</div>
            <div style={{ fontSize: 10, color: 'var(--bs-ash)' }}>{s.practice || ''}</div>
          </div>
        </div>
      </>
    );
  }

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
          const isActive = activeId === item.id;
          const isDisabled = (item as any).disabled;
          return (
            <div
              key={item.id}
              onClick={() => {
                if (isDisabled) return;
                if (item.action) item.action();
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

      {/* Office Onboarding — separate red section */}
      <div style={{ padding: collapsed ? "10px 8px" : "10px 12px", borderTop: "1px solid var(--bs-border)" }}>
        <button
          onClick={() => { navigate('/office-onboarding'); scrollTop(); }}
          title="Office Onboarding"
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            background: activeId === 'office-onboarding' ? "rgba(229,62,62,0.18)" : "rgba(229,62,62,0.08)",
            border: `1px solid ${activeId === 'office-onboarding' ? "rgba(229,62,62,0.5)" : "rgba(229,62,62,0.25)"}`,
            borderRadius: 8, padding: collapsed ? "10px" : "10px 14px",
            cursor: "pointer", fontFamily: C.fn, transition: "all 0.2s",
            justifyContent: collapsed ? "center" : "flex-start",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(229,62,62,0.18)"; e.currentTarget.style.borderColor = "rgba(229,62,62,0.45)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = activeId === 'office-onboarding' ? "rgba(229,62,62,0.18)" : "rgba(229,62,62,0.08)"; e.currentTarget.style.borderColor = activeId === 'office-onboarding' ? "rgba(229,62,62,0.5)" : "rgba(229,62,62,0.25)"; }}
        >
          <ClipboardList size={15} color={C.red} strokeWidth={2} style={{ flexShrink: 0 }} />
          {!collapsed && <span style={{ fontSize: 12, fontWeight: 700, color: C.red }}>Office Onboarding</span>}
        </button>
      </div>

      {/* Admin panel link */}
      {isByteSenseAdmin && (
        <div style={{ padding: collapsed ? "10px 8px" : "10px 12px", borderTop: "1px solid var(--bs-border)" }}>
          <button
            onClick={() => navigate('/bytesense-admin')}
            title="ByteSense Admin Panel"
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)",
              borderRadius: 8, padding: collapsed ? "10px" : "10px 14px",
              cursor: "pointer", fontFamily: C.fn, transition: "all 0.2s",
              justifyContent: collapsed ? "center" : "flex-start",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,175,55,0.15)"; e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(212,175,55,0.08)"; e.currentTarget.style.borderColor = "rgba(212,175,55,0.2)"; }}
          >
            <ShieldCheck size={15} color={C.gold} strokeWidth={2} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ fontSize: 12, fontWeight: 700, color: C.gold }}>Admin Panel</span>}
          </button>
        </div>
      )}

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
