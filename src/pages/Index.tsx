import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useAppState } from '@/hooks/useAppState';
import { useAuth } from '@/hooks/useAuth';
import IntakeFlow from '@/screens/intake/IntakeFlow';
import Splash from '@/screens/Splash';
import RoleSelect from '@/screens/RoleSelect';
import Baseline from '@/screens/Baseline';
import BaselineResults from '@/screens/BaselineResults';
import Dashboard from '@/screens/Dashboard';
import StaffDashboard from '@/screens/StaffDashboard';
import ModuleView from '@/screens/ModuleView';
import Simulation from '@/screens/Simulation';
import SimulationSummary from '@/screens/SimulationSummary';
import Report from '@/screens/Report';
import AICoach from '@/components/AICoach';
import { C } from '@/data/constants';
import { Lang } from '@/data/translations';

interface IndexProps { forceView?: 'staff' | 'owner'; }

const Index = ({ forceView }: IndexProps = {}) => {
  const { user: clerkUser } = useUser();
  const clerkUserId = clerkUser?.id ?? null;

  // Make Clerk user ID accessible to legacy screens that can't receive it as a prop
  if (clerkUserId) (window as any).__clerkUserId = clerkUserId;

  const { s, u, sRoles, sc, myPH, myM, dN, pr, allD, getQuestion, reset } = useAppState(clerkUserId);
  const { isStaff, isAdmin } = useAuth();
  const lang = (s.lang || 'en') as Lang;
  const [showCoach, setShowCoach] = useState(false);
  const [coachMode, setCoachMode] = useState('general');

  const openCoach = (mode: string) => {
    setCoachMode(mode);
    setShowCoach(true);
  };

  // Don't show floating coach on pre-training screens
  const showFloatingCoach = !['splash', 'setup', 'baseline', 'blR', 'intake'].includes(s.phase);

  const renderScreen = () => {
    // ── Intake flow (first-time setup) ──────────────────────────────────
    if (!s.intakeDone && s.phase !== 'baseline' && s.phase !== 'blR' && !['dashboard', 'module', 'simulation', 'simSummary', 'report'].includes(s.phase)) {
      return (
        <IntakeFlow
          clerkUserId={clerkUserId}
          onDone={(staffRoles) => {
            // Seed the training state with roles chosen during intake
            u({ intakeDone: true, roles: staffRoles, phase: 'splash' });
          }}
        />
      );
    }

    // ── Training flow ───────────────────────────────────────────────────
    if (s.phase === 'splash') return <Splash s={s} u={u} lang={lang} />;
    if (s.phase === 'setup') return <RoleSelect s={s} u={u} lang={lang} />;
    if (s.phase === 'baseline') return <Baseline s={s} u={u} lang={lang} />;
    if (s.phase === 'blR') return <BaselineResults s={s} u={u} sc={sc} sRoles={sRoles} myPH={myPH} myM={myM} lang={lang} />;
    if (s.phase === 'module' && s.curMod) return <ModuleView s={s} u={u} myM={myM} getQuestion={getQuestion} lang={lang} />;
    if (s.phase === 'simulation') return <Simulation s={s} u={u} lang={lang} />;
    if (s.phase === 'simSummary') return <SimulationSummary s={s} u={u} lang={lang} />;
    if (s.phase === 'report') return <Report s={s} u={u} sc={sc} myPH={myPH} myM={myM} dN={dN} pr={pr} lang={lang} />;
    if (forceView === 'staff') return <StaffDashboard s={s} u={u} sRoles={sRoles} myPH={myPH} myM={myM} dN={dN} pr={pr} allD={allD} reset={reset} openCoach={openCoach} />;
    if (forceView === 'owner') return <Dashboard s={s} u={u} sRoles={sRoles} myPH={myPH} myM={myM} dN={dN} pr={pr} allD={allD} reset={reset} openCoach={openCoach} />;
    if (isStaff && !isAdmin) return <StaffDashboard s={s} u={u} sRoles={sRoles} myPH={myPH} myM={myM} dN={dN} pr={pr} allD={allD} reset={reset} openCoach={openCoach} />;
    return <Dashboard s={s} u={u} sRoles={sRoles} myPH={myPH} myM={myM} dN={dN} pr={pr} allD={allD} reset={reset} openCoach={openCoach} />;
  };

  return (
    <>
      {renderScreen()}
      {showFloatingCoach && (
        <button
          onClick={() => openCoach('general')}
          style={{
            position: 'fixed', bottom: 80, right: 24, width: 56, height: 56,
            borderRadius: '50%', background: C.gold, border: 'none',
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(201,168,76,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
            color: C.dark,
          }}
        >
          <Sparkles size={24} strokeWidth={2} />
        </button>
      )}
      {showCoach && <AICoach onClose={() => setShowCoach(false)} initialMode={coachMode} lang={lang} />}
    </>
  );
};

export default Index;
