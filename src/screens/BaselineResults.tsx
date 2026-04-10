import { C, Role, Phase } from '@/data/constants';
import { Module } from '@/data/constants';
import { scrollTop } from '@/lib/helpers';
import { AppState } from '@/hooks/useAppState';

interface BaselineResultsProps {
  s: AppState;
  u: (d: Partial<AppState>) => void;
  sc: number;
  sRoles: Role[];
  myPH: Phase[];
  myM: Module[];
}

export default function BaselineResults({ s, u, sc, sRoles, myPH, myM }: BaselineResultsProps) {
  const lv = sc >= 75
    ? { l: "Strong Foundation", c: C.green, m: "Excellent. We'll add ByteSense expertise and advanced conversion skills." }
    : sc >= 40
    ? { l: "Developing", c: C.amber, m: "Solid baseline. Your onboarding builds from here — including sales psychology and the complete system." }
    : { l: "Fresh Start", c: C.teal, m: "We'll start with the fundamentals and build you all the way to confident mastery." };

  return (
    <div style={{ fontFamily: C.fn, background: C.snow, minHeight: "100vh" }}>
      <div style={{ background: C.dark, color: C.white, padding: "44px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: C.ash, marginBottom: 16, textTransform: "uppercase" }}>Your Starting Point</div>
        <div style={{ width: 110, height: 110, borderRadius: "50%", border: `3px solid ${lv.c}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: lv.c }}>{sc}%</div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: lv.c, marginBottom: 6 }}>{lv.l}</div>
        <p style={{ fontSize: 14, color: C.ash, maxWidth: 420, margin: "0 auto", lineHeight: 1.7 }}>{lv.m}</p>
      </div>
      <div style={{ background: C.white, padding: "32px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 6 }}>Your Roles:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {sRoles.map(r => <span key={r.id} style={{ background: r.bg, color: r.color, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{r.label}</span>)}
          </div>
          <div style={{ fontSize: 13, color: C.slate, marginBottom: 6 }}>
            Your personalized onboarding: <strong style={{ color: C.charcoal }}>{myPH.length} phases</strong>, <strong style={{ color: C.charcoal }}>{myM.length} sections</strong>
            {sc < 30 ? " (including fundamentals based on your starting point)" : sc < 60 ? " (including financial confidence training)" : ""}.
          </div>
          <button onClick={() => { u({ phase: "dashboard" }); scrollTop(); }}
            style={{ background: C.red, color: "#fff", border: "none", padding: "14px 28px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", width: "100%", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            Start Onboarding →
          </button>
        </div>
      </div>
    </div>
  );
}
