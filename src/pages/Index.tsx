import { useAppState } from '@/hooks/useAppState';
import Splash from '@/screens/Splash';
import RoleSelect from '@/screens/RoleSelect';
import Baseline from '@/screens/Baseline';
import BaselineResults from '@/screens/BaselineResults';
import Dashboard from '@/screens/Dashboard';
import ModuleView from '@/screens/ModuleView';
import Simulation from '@/screens/Simulation';
import SimulationSummary from '@/screens/SimulationSummary';
import Report from '@/screens/Report';

const Index = () => {
  const { s, u, sRoles, sc, myPH, myM, dN, pr, allD, getQuestion, reset } = useAppState();

  if (s.phase === "splash") return <Splash s={s} u={u} />;
  if (s.phase === "setup") return <RoleSelect s={s} u={u} />;
  if (s.phase === "baseline") return <Baseline s={s} u={u} />;
  if (s.phase === "blR") return <BaselineResults s={s} u={u} sc={sc} sRoles={sRoles} myPH={myPH} myM={myM} />;
  if (s.phase === "module" && s.curMod) return <ModuleView s={s} u={u} myM={myM} getQuestion={getQuestion} />;
  if (s.phase === "simulation") return <Simulation s={s} u={u} />;
  if (s.phase === "simSummary") return <SimulationSummary s={s} u={u} />;
  if (s.phase === "report") return <Report s={s} u={u} sc={sc} myPH={myPH} myM={myM} dN={dN} pr={pr} />;

  return <Dashboard s={s} u={u} sRoles={sRoles} myPH={myPH} myM={myM} dN={dN} pr={pr} allD={allD} reset={reset} />;
};

export default Index;
