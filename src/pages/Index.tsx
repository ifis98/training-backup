import { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useAppState } from '@/hooks/useAppState';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import IntakeFlow from '@/screens/intake/IntakeFlow';
import Baseline from '@/screens/Baseline';
import BaselineResults from '@/screens/BaselineResults';
import Dashboard from '@/screens/Dashboard';
import StaffDashboard from '@/screens/StaffDashboard';
import ModuleView from '@/screens/ModuleView';
import Simulation from '@/screens/Simulation';
import SimulationSummary from '@/screens/SimulationSummary';
import Report from '@/screens/Report';
import RoleplayHub from '@/screens/RoleplayHub';
import SalesTrainingScreen from '@/screens/SalesTrainingScreen';
import PanelView from '@/screens/PanelView';
import AICoach from '@/components/AICoach';
import DashboardSidebar from '@/components/DashboardSidebar';
import SlidingPanel from '@/components/SlidingPanel';
import SettingsModal from '@/components/SettingsModal';
import { Lang } from '@/data/translations';
import { BL } from '@/data/constants';
import { C } from '@/data/constants';

interface IndexProps { forceView?: 'staff' | 'owner'; forcePhase?: string; }

const Index = ({ forceView, forcePhase }: IndexProps = {}) => {
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const clerkUserId = clerkUser?.id ?? null;
  const isMobile = useIsMobile();

  // Make Clerk user ID accessible to legacy screens that can't receive it as a prop
  if (clerkUserId) (window as any).__clerkUserId = clerkUserId;

  const { s, u, sRoles, sc, myPH, myM, dN, pr, allD, getQuestion, reset, dbLoaded } = useAppState(clerkUserId);
  const { isStaff, isAdmin } = useAuth();
  const lang = (s.lang || 'en') as Lang;

  // Global coach state
  const [showCoach, setShowCoach] = useState(false);
  const [coachMode, setCoachMode] = useState('general');

  // Global panel state (Sales Training, Office Workflow, etc.)
  const [panelSrc, setPanelSrc] = useState<string | null>(null);
  const [panelTitle, setPanelTitle] = useState('');

  // Global settings state
  const [showSettings, setShowSettings] = useState(false);

  const allComplete = allD && s.simP >= 3;

  // Always dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);


  // Close coach + panels whenever the user navigates to a new phase
  useEffect(() => {
    setShowCoach(false);
    setPanelSrc(null);
  }, [s.phase]);

  const openCoach = (mode: string) => {
    setCoachMode(mode);
    setShowCoach(true);
  };

  const handleSignOut = async () => {
    try { await signOut({ redirectUrl: '/' }); } catch {}
  };

  const dashboardProps = {
    s, u, sRoles, myPH, myM, dN, pr, allD, reset, openCoach,
    onOpenSettings: () => setShowSettings(true),
    onSignOut: handleSignOut,
    onOpenPanel: (src: string, title: string) => { setPanelSrc(src); setPanelTitle(title); },
  };

  const renderContent = () => {
    // Wait for DB check before deciding if intake is needed
    if (!dbLoaded && clerkUserId) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bs-bg, #0C0C0E)" }}>
          <div style={{ width: 32, height: 32, border: "3px solid rgba(128,128,128,0.2)", borderTopColor: C.teal, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      );
    }

    // ── Intake flow (first-time setup) ──────────────────────────────────
    if (!s.intakeDone && !['baseline', 'blR', 'dashboard', 'module', 'simulation', 'simSummary', 'report'].includes(s.phase)) {
      return (
        <IntakeFlow
          clerkUserId={clerkUserId}
          onDone={(staffRoles, intakeData) => {
            const seed = Date.now() % 100000;
            u({
              intakeDone: true,
              roles: staffRoles,
              name: intakeData.primary_name || '',
              practice: intakeData.practice_name || '',
              mainBlocker: intakeData.main_blocker || '',
              monthlyVolume: intakeData.monthly_volume || '',
              seed,
              phase: 'baseline',
              blIdx: 0,
              bl: [],
              blQs: BL.map((v, i) => v[(seed + i) % v.length]),
            });
          }}
        />
      );
    }

    // ── Training flow ────────────────────────────────────────────────────
    if (s.phase === 'splash' || s.phase === 'setup') {
      if (s.intakeDone && s.blScore !== null) return <Dashboard {...dashboardProps} />;
      if (s.intakeDone) {
        const seed = s.seed || Date.now() % 100000;
        u({ phase: 'baseline', blIdx: 0, bl: [], blQs: BL.map((v, i) => v[(seed + i) % v.length]) });
        return null;
      }
    }
    // ── Transient states always take priority (even when on a section URL) ──
    if (s.phase === 'baseline') return <Baseline s={s} u={u} lang={lang} />;
    if (s.phase === 'blR') return <BaselineResults s={s} u={u} sc={sc} sRoles={sRoles} myPH={myPH} myM={myM} lang={lang} />;
    if (s.phase === 'module' && s.curMod) return <ModuleView s={s} u={u} myM={myM} getQuestion={getQuestion} lang={lang} />;
    if (s.phase === 'simulation') return <Simulation s={s} u={u} lang={lang} />;
    if (s.phase === 'simSummary') return <SimulationSummary s={s} u={u} lang={lang} />;
    if (s.phase === 'report') return <Report s={s} u={u} sc={sc} myPH={myPH} myM={myM} dN={dN} pr={pr} lang={lang} />;

    // ── URL-based section routing ────────────────────────────────────────
    // /sales-training → tabbed screen: Training Module (real Dashboard) + Sales Resources (HTML)
    if (forcePhase === 'sales-training')    return <SalesTrainingScreen {...dashboardProps} lang={lang} />;
    if (forcePhase === 'product-experience') return <PanelView src="/product-experience.html" />;
    if (forcePhase === 'office-workflow')   return <PanelView src="/office-workflow.html" />;
    if (forcePhase === 'contact-support')   return <PanelView src="/contact-support.html" />;
    if (forcePhase === 'roleplay')          return <RoleplayHub s={s} u={u} lang={lang} />;

    // ── Phase-state routing (used internally, e.g. from mobile menu) ─────
    if (s.phase === 'sales-training')    return <SalesTrainingScreen {...dashboardProps} lang={lang} />;
    if (s.phase === 'product-experience') return <PanelView src="/product-experience.html" />;
    if (s.phase === 'office-workflow')   return <PanelView src="/office-workflow.html" />;
    if (s.phase === 'contact-support')   return <PanelView src="/contact-support.html" />;
    if (s.phase === 'roleplay') return <RoleplayHub s={s} u={u} lang={lang} />;

    if (forceView === 'staff') return <StaffDashboard {...dashboardProps} />;
    if (forceView === 'owner') return <Dashboard {...dashboardProps} />;
    if (isStaff && !isAdmin) return <StaffDashboard {...dashboardProps} />;
    return <Dashboard {...dashboardProps} />;
  };

  // Show the sidebar layout for all screens once intake is complete (or on a section URL)
  const showLayout = !!forcePhase || s.intakeDone || ['baseline', 'blR', 'dashboard', 'module', 'simulation', 'simSummary', 'report', 'sales-training', 'product-experience', 'office-workflow', 'roleplay', 'contact-support'].includes(s.phase);

  if (showLayout) {
    return (
      <div style={{ display: 'flex', background: `radial-gradient(ellipse at top, var(--bs-bg2), var(--bs-bg))`, minHeight: '100vh' }}>
        {/* Global fixed sidebar */}
        <DashboardSidebar
          s={s} u={u}
          allD={allD}
          allComplete={allComplete}
          openCoach={openCoach}
          onSignOut={handleSignOut}
          onOpenSettings={() => setShowSettings(true)}
          onOpenPanel={(src, title) => { setPanelSrc(src); setPanelTitle(title); }}
          activePanel={panelSrc}
          lang={lang}
        />

        {/* Main content — offset by sidebar width */}
        <div style={{
          flex: 1,
          minWidth: 0,
          marginLeft: isMobile ? 0 : 'var(--bs-sidebar-w, 220px)',
          transition: 'margin-left 0.3s ease',
          paddingBottom: 0,
        }}>
          {renderContent()}
        </div>

        {/* Global overlays */}
        <SlidingPanel src={panelSrc} title={panelTitle} onClose={() => setPanelSrc(null)} />
        <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} s={s} u={u} lang={lang} />
        <AICoach isOpen={showCoach} onClose={() => setShowCoach(false)} initialMode={coachMode} lang={lang} />
      </div>
    );
  }

  // Intake / loading — no sidebar
  return (
    <>
      {renderContent()}
      <AICoach isOpen={showCoach} onClose={() => setShowCoach(false)} initialMode={coachMode} lang={lang} />
    </>
  );
};

export default Index;
