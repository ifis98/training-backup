import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
import SalesTrainingScreen from '@/screens/SalesTrainingScreen';
import ProductExperienceScreen from '@/screens/ProductExperienceScreen';
import OfficeWorkflowScreen from '@/screens/OfficeWorkflowScreen';
import OfficeOnboardingScreen from '@/screens/OfficeOnboardingScreen';
import ContactSupportScreen from '@/screens/ContactSupportScreen';
import RoleplaySimulationScreen from '@/screens/RoleplaySimulationScreen';
import AICoach from '@/components/AICoach';
import DashboardSidebar from '@/components/DashboardSidebar';
import SettingsModal from '@/components/SettingsModal';
import BookingModal from '@/components/BookingModal';
import { Lang } from '@/data/translations';
import { BL } from '@/data/constants';
import { C } from '@/data/constants';
import { supabase } from '@/integrations/supabase/client';

interface IndexProps { forceView?: 'staff' | 'owner'; forcePhase?: string; }

const Index = ({ forceView, forcePhase }: IndexProps = {}) => {
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const coachMode = params.mode || 'general';
  const clerkUserId = clerkUser?.id ?? null;
  const isMobile = useIsMobile();

  // Make Clerk user ID accessible to legacy screens that can't receive it as a prop
  if (clerkUserId) (window as any).__clerkUserId = clerkUserId;

  // Set OAuth user flag for TypeformIntake SSO password step
  useEffect(() => {
    const isOAuthUser = (clerkUser?.externalAccounts?.length ?? 0) > 0;
    (window as any).__isOAuthUser = isOAuthUser;
  }, [clerkUser]);

  // webapp_account status check — gates /app until create-webapp-account succeeds
  const [webappAccountStatus, setWebappAccountStatus] = useState<string | null>(null);
  const [checkingAccount, setCheckingAccount] = useState(true);
  useEffect(() => {
    if (!clerkUserId) { setCheckingAccount(false); return; }
    supabase
      .from('webapp_account')
      .select('status')
      .eq('clerk_user_id', clerkUserId)
      .maybeSingle()
      .then(({ data: row }) => {
        setWebappAccountStatus(row?.status ?? null);
        setCheckingAccount(false);
      })
      .catch(() => { setCheckingAccount(false); });
  }, [clerkUserId]);

  // Re-fetch webapp_account status when intakeDone transitions to true,
  // since the account was created during intake via the submit step.
  useEffect(() => {
    if (!s.intakeDone || !clerkUserId) return;
    setCheckingAccount(true);
    supabase
      .from('webapp_account')
      .select('status')
      .eq('clerk_user_id', clerkUserId)
      .maybeSingle()
      .then(({ data: row }) => {
        setWebappAccountStatus(row?.status ?? null);
        setCheckingAccount(false);
      })
      .catch(() => { setCheckingAccount(false); });
  }, [s.intakeDone, clerkUserId]);

  const { s, u, sRoles, sc, myPH, myM, dN, pr, allD, getQuestion, reset, dbLoaded, immediateSync } = useAppState(clerkUserId);
  const { isStaff, isAdmin, isByteSenseAdmin, loading: authLoading } = useAuth();
  const lang = (s.lang || 'en') as Lang;

  const [showBookingGlobal, setShowBookingGlobal] = useState(false);

  // Global settings state
  const [showSettings, setShowSettings] = useState(false);

  const allComplete = allD && s.simP >= 3;

  // Apply theme based on s.theme preference
  useEffect(() => {
    const applyTheme = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const dark = s.theme === 'dark' || (s.theme === 'system' && prefersDark);
      document.documentElement.classList.toggle('dark', dark);
    };
    applyTheme();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', applyTheme);
    return () => mq.removeEventListener('change', applyTheme);
  }, [s.theme]);

  // bytesense_admins skip intake — mark intakeDone once so the whole app
  // treats them as an existing user with no special-casing needed anywhere.
  useEffect(() => {
    if (!dbLoaded || authLoading) return;
    if (s.intakeDone) return;
    if (!isByteSenseAdmin) return;
    u({ intakeDone: true, phase: 'dashboard' });
  }, [dbLoaded, authLoading, s.intakeDone, isByteSenseAdmin]);

  // POST_INTAKE_PHASES retained for the sidebar layout logic below. The
  // previous "bounce to / if no invite" effect was removed: it caused a
  // redirect loop with Welcome.tsx's auto-redirect-to-/app for signed-in
  // users who arrived without a `bsa6_invite` (e.g. logging in on a new
  // device). IntakeFlow handles the no-invite case gracefully — it just
  // doesn't prefill the practice name.
  const POST_INTAKE_PHASES = ['baseline', 'blR', 'dashboard', 'module', 'simulation', 'simSummary', 'report'];

  // When the user navigates to a section URL while in a transient phase
  // (module / simulation / simSummary / report), drop the phase back to
  // dashboard so the URL — not stale phase state — drives rendering.
  const TRANSIENT_PHASES = ['module', 'simulation', 'simSummary', 'report'];
  const SECTION_PATHS = ['/sales-training', '/product-experience', '/office-workflow', '/office-onboarding', '/roleplay', '/ai-coach', '/contact-support'];
  useEffect(() => {
    if (!TRANSIENT_PHASES.includes(s.phase)) return;
    if (location.pathname === '/app' || SECTION_PATHS.some(p => location.pathname.startsWith(p))) {
      if (location.pathname !== '/app') u({ phase: 'dashboard' });
    }
  }, [location.pathname]);

  const handleSignOut = async () => {
    try { await signOut({ redirectUrl: '/' }); } catch {}
  };

  const dashboardProps = {
    s, u, sRoles, myPH, myM, dN, pr, allD, reset,
    onOpenSettings: () => setShowSettings(true),
    onSignOut: handleSignOut,
  };

  const renderContent = () => {
    // Wait for DB check before deciding if intake is needed
    if ((!dbLoaded || checkingAccount) && clerkUserId) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bs-bg, #0C0C0E)" }}>
          <div style={{ width: 32, height: 32, border: "3px solid rgba(128,128,128,0.2)", borderTopColor: C.teal, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      );
    }

    // ── Invite-only gate ────────────────────────────────────────────────
    // A signed-in user with no completed intake AND no invite code in
    // localStorage must have bypassed /register (e.g. signed up via Google
    // OAuth). ByteSense is invite-only — sign them out and send them home.
    if (!s.intakeDone && !['baseline', 'blR', 'dashboard', 'module', 'simulation', 'simSummary', 'report'].includes(s.phase)) {
      const inviteRaw = localStorage.getItem('bsa6_invite');
      const inviteData = inviteRaw ? (() => { try { return JSON.parse(inviteRaw); } catch { return null; } })() : null;
      if (!inviteData?.code) {
        return <NoInviteRedirect onSignOut={handleSignOut} />;
      }
      return (
        <IntakeFlow
          clerkUserId={clerkUserId}
          prefilledPracticeName={inviteData?.practice_name || ''}
          onDone={(staffRoles, intakeData) => {
            // Best-effort: bind the redeemed code to this Clerk user. Lets
            // admins later answer "which user redeemed code XYZ" via the
            // registration_codes.used_by_clerk_user_id column.
            if (inviteData?.code && clerkUserId) {
              const email = clerkUser?.primaryEmailAddress?.emailAddress ?? '';
              supabase.functions.invoke('manage-registration-codes', {
                body: { op: 'link', code: inviteData.code, clerkUserId, email },
              }).catch(() => { /* non-blocking */ });
            }
            localStorage.removeItem('bsa6_invite'); // consume the stored invite
            const seed = Date.now() % 100000;
            const update = {
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
            };
            u(update);
            immediateSync(update);
          }}
        />
      );
    }

    // ── Webapp account gate ──────────────────────────────────────────────
    // After intake is done, require webapp_account.status = 'created' before
    // showing the training dashboard. The submit step inside TypeformIntake
    // calls create-webapp-account; if it failed silently, offer a retry.
    if (s.intakeDone && !checkingAccount && webappAccountStatus !== 'created') {
      return <WebappAccountRetry clerkUserId={clerkUserId} onRetry={() => {
        setCheckingAccount(true);
        setWebappAccountStatus(null);
        supabase
          .from('webapp_account')
          .select('status')
          .eq('clerk_user_id', clerkUserId)
          .maybeSingle()
          .then(({ data: row }) => {
            setWebappAccountStatus(row?.status ?? null);
            setCheckingAccount(false);
          })
          .catch(() => { setCheckingAccount(false); });
      }} />;
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
    // ── Transient phases take priority. The location.pathname useEffect
    //    above resets these to 'dashboard' when the user navigates to a
    //    section URL via the sidebar, so URLs still win in that case
    //    without breaking sim launches from inside /roleplay etc.
    if (s.phase === 'baseline') return <Baseline s={s} u={u} lang={lang} />;
    if (s.phase === 'blR') return <BaselineResults s={s} u={u} sc={sc} sRoles={sRoles} myPH={myPH} myM={myM} lang={lang} />;
    if (s.phase === 'module' && s.curMod) return <ModuleView s={s} u={u} myM={myM} getQuestion={getQuestion} lang={lang} />;
    if (s.phase === 'simulation') return <Simulation s={s} u={u} lang={lang} />;
    if (s.phase === 'simSummary') return <SimulationSummary s={s} u={u} lang={lang} />;
    if (s.phase === 'report') return <Report s={s} u={u} sc={sc} myPH={myPH} myM={myM} dN={dN} pr={pr} lang={lang} />;

    // ── URL-based section routing ────────────────────────────────────────
    if (forcePhase === 'sales-training')    return <SalesTrainingScreen {...dashboardProps} lang={lang} />;
    if (forcePhase === 'product-experience') return <ProductExperienceScreen />;
    if (forcePhase === 'office-workflow')    return <OfficeWorkflowScreen />;
    if (forcePhase === 'office-onboarding') return <OfficeOnboardingScreen lang={lang} />;
    if (forcePhase === 'contact-support')   return <ContactSupportScreen />;
    if (forcePhase === 'roleplay')          return <RoleplaySimulationScreen s={s} u={u} lang={lang} />;
    if (forcePhase === 'ai-coach')          return <AICoach mode={coachMode} lang={lang} />;

    // ── Phase-state routing (used internally, e.g. from mobile menu) ─────
    if (s.phase === 'sales-training')    return <SalesTrainingScreen {...dashboardProps} lang={lang} />;
    if (s.phase === 'product-experience') return <ProductExperienceScreen />;
    if (s.phase === 'office-workflow')    return <OfficeWorkflowScreen />;
    if (s.phase === 'office-onboarding') return <OfficeOnboardingScreen lang={lang} />;
    if (s.phase === 'contact-support')   return <ContactSupportScreen />;
    if (s.phase === 'roleplay') return <RoleplaySimulationScreen s={s} u={u} lang={lang} />;

    if (forceView === 'staff') return <StaffDashboard {...dashboardProps} />;
    if (forceView === 'owner') return <Dashboard {...dashboardProps} />;
    if (isStaff && !isAdmin) return <StaffDashboard {...dashboardProps} />;
    return <Dashboard {...dashboardProps} />;
  };

  // Show the sidebar layout for all screens once intake is complete (or on a section URL).
  // Exception: baseline + baseline-results are part of the onboarding flow and should
  // render full-screen (Typeform-style) like the intake itself — no sidebar.
  const isOnboardingFlow = s.phase === 'baseline' || s.phase === 'blR';
  const showLayout = !isOnboardingFlow && (!!forcePhase || !!forceView || s.intakeDone || ['baseline', 'blR', 'dashboard', 'module', 'simulation', 'simSummary', 'report', 'sales-training', 'product-experience', 'office-workflow', 'office-onboarding', 'roleplay', 'contact-support'].includes(s.phase));

  if (showLayout) {
    return (
      <div style={{ display: 'flex', background: `radial-gradient(ellipse at top, var(--bs-bg2), var(--bs-bg))`, minHeight: '100vh' }}>
        {/* Global fixed sidebar */}
        <DashboardSidebar
          s={s} u={u}
          allD={allD}
          allComplete={allComplete}
          onSignOut={handleSignOut}
          onOpenSettings={() => setShowSettings(true)}
          onOpenBooking={() => setShowBookingGlobal(true)}
          lang={lang}
        />

        {/* Main content — offset by sidebar width */}
        <div style={{
          flex: 1,
          minWidth: 0,
          marginLeft: isMobile ? 0 : 'var(--bs-sidebar-w, 220px)',
          transition: 'margin-left 0.3s ease',
          paddingTop: isMobile ? 60 : 0,
          paddingBottom: 0,
        }}>
          {renderContent()}
        </div>

        {/* Global overlays */}
        <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} s={s} u={u} lang={lang} allComplete={allComplete} />
        <BookingModal open={showBookingGlobal} onClose={() => setShowBookingGlobal(false)} lang={lang} />
      </div>
    );
  }

  // Intake / loading — no sidebar
  return <>{renderContent()}</>;
};

export default Index;

/**
 * Renders briefly while we sign out a signed-in user who has no invite code.
 * Triggered when a Google OAuth user lands on /app without ever redeeming a
 * code. They get bounced straight back to the home page.
 */
function NoInviteRedirect({ onSignOut }: { onSignOut: () => Promise<void> | void }) {
  useEffect(() => {
    (async () => { try { await onSignOut(); } catch { window.location.href = '/'; } })();
  }, [onSignOut]);
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bs-bg)', color: 'var(--bs-ash)', fontFamily: C.fn, fontSize: 14 }}>
      Invite required — redirecting…
    </div>
  );
}

function WebappAccountRetry({ clerkUserId, onRetry }: { clerkUserId: string | null; onRetry: () => void }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bs-bg)', fontFamily: C.fn }}>
      <div style={{ maxWidth: 480, width: '100%', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 20 }}>⚠</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--bs-text)', marginBottom: 12 }}>
          Account Setup Incomplete
        </h2>
        <p style={{ fontSize: 14, color: 'var(--bs-ash)', lineHeight: 1.8, marginBottom: 28 }}>
          Your account is still being set up on the byteSense portal. This may be because the account creation step was interrupted or hasn't finished yet.
        </p>
        <button onClick={onRetry}
          style={{
            background: C.teal, color: C.white, border: 'none',
            padding: '14px 32px', fontSize: 15, fontWeight: 700,
            fontFamily: C.fn, cursor: 'pointer', borderRadius: 6,
          }}>
          Check Again
        </button>
        <p style={{ fontSize: 12, color: 'var(--bs-ash)', marginTop: 16 }}>
          If this persists, please contact support.
        </p>
      </div>
    </div>
  );
}
