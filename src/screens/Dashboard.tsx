import { C, PH, Role, Phase } from '@/data/constants';
import { Module } from '@/data/constants';
import { Logo, LogoText } from '@/components/ByteSenseLogo';
import { scrollTop } from '@/lib/helpers';
import { AppState } from '@/hooks/useAppState';

interface DashboardProps {
  s: AppState;
  u: (d: Partial<AppState>) => void;
  sRoles: Role[];
  myPH: Phase[];
  myM: Module[];
  dN: number;
  pr: number;
  allD: boolean;
  reset: () => void;
}

export default function Dashboard({ s, u, sRoles, myPH, myM, dN, pr, allD, reset }: DashboardProps) {
  const allModsDone = dN === myM.length && myM.length > 0;
  const allComplete = allModsDone && s.simP >= 3;

  return (
    <div style={{ fontFamily: C.fn, background: C.snow, minHeight: "100vh" }}>
      {/* Dark Header */}
      <div style={{ background: C.dark, padding: "18px 24px 20px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Logo size={22} />
              <LogoText size={16} />
            </div>
            <button onClick={() => { u({ phase: "setup", roles: [] }); scrollTop(); }}
              style={{ background: "none", border: `1px solid ${C.borderD}`, color: C.ash, padding: "5px 10px", fontSize: 11, cursor: "pointer", fontFamily: C.fn }}>Change Roles</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
            {sRoles.map(r => <span key={r.id} style={{ background: r.bg, color: r.color, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{r.short}</span>)}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, background: C.dark2, padding: "8px 12px" }}>
              <div style={{ fontSize: 10, color: C.ash }}>{s.name}</div>
            </div>
            <div style={{ background: C.dark2, padding: "8px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.gold }}>{s.xp}</div>
              <div style={{ fontSize: 8, color: C.ash }}>XP</div>
            </div>
            <div style={{ background: C.dark2, padding: "8px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.teal }}>{pr}%</div>
              <div style={{ fontSize: 8, color: C.ash }}>DONE</div>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ height: 4, background: C.dark3 }}>
              <div style={{ height: "100%", width: `${pr}%`, background: `linear-gradient(90deg, ${C.teal}, ${C.green})`, transition: "width 0.5s" }} />
            </div>
            <div style={{ fontSize: 10, color: C.ash, marginTop: 3 }}>{dN}/{myM.length} sections · {myPH.length} phases</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 24px 60px" }}>
        {myPH.map(phase => {
          const pm = myM.filter(m => m.phase === phase.id);
          if (!pm.length) return null;
          const pc = pm.every(m => s.done.includes(m.id));

          return (
            <div key={phase.id} style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, background: pc ? C.green : phase.color, borderRadius: "50%" }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: C.charcoal }}>{phase.label}</span>
                {pc && <span style={{ fontSize: 10, color: C.green, fontWeight: 700 }}>COMPLETE</span>}
              </div>
              <div style={{ fontSize: 12, color: C.slate, paddingLeft: 16, marginBottom: 8 }}>{phase.desc}</div>
              {pm.map(mod => {
                const done = s.done.includes(mod.id);
                return (
                  <div key={mod.id}
                    onClick={() => { u({ phase: "module", curMod: mod.id, ckA: null }); scrollTop(); }}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginLeft: 16, marginBottom: 4, background: C.white, border: `1.5px solid ${done ? `${C.green}40` : C.border}`, borderLeft: `3px solid ${done ? C.green : phase.color}`, cursor: "pointer" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${done ? C.green : C.mist}`, background: done ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10, color: C.white }}>
                      {done ? "✓" : ""}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal }}>{mod.title}</div>
                      <div style={{ fontSize: 11, color: C.ash }}>{mod.time}</div>
                    </div>
                    <span style={{ color: C.ash, fontSize: 14 }}>→</span>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* AI Simulation Section */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, background: C.gold, borderRadius: "50%" }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: C.charcoal }}>Final Phase — AI Patient Practice</span>
            {s.simP >= 3 && <span style={{ fontSize: 10, color: C.green, fontWeight: 700 }}>COMPLETE</span>}
          </div>
          <div
            onClick={() => { if (allModsDone) { u({ phase: "simulation" }); scrollTop(); } }}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginLeft: 16, background: C.white, border: `1.5px solid ${C.border}`, borderLeft: `3px solid ${C.gold}`, cursor: allModsDone ? "pointer" : "not-allowed", opacity: allModsDone ? 1 : 0.5 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${s.simP >= 3 ? C.green : C.mist}`, background: s.simP >= 3 ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10, color: C.white }}>
              {s.simP >= 3 ? "✓" : ""}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal }}>AI Patient Simulation</div>
              <div style={{ fontSize: 11, color: C.ash }}>{s.simP}/3 patients</div>
            </div>
            <span style={{ color: C.ash, fontSize: 14 }}>→</span>
          </div>
        </div>

        {/* Completion Banners */}
        {allComplete && (
          <div style={{ background: `linear-gradient(135deg, ${C.goldBg}, ${C.tealBg})`, border: `1.5px solid ${C.gold}`, padding: 20, textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.charcoal, marginBottom: 8 }}>All Assignments Complete</div>
            <button onClick={() => { u({ phase: "report" }); scrollTop(); }}
              style={{ background: C.red, color: "#fff", border: "none", padding: "14px 28px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer" }}>
              Complete Onboarding →
            </button>
          </div>
        )}

        {allModsDone && !allComplete && (
          <div style={{ background: C.teal, color: C.white, padding: 16, textAlign: "center", marginBottom: 16, fontSize: 14, fontWeight: 700 }}>
            Training Complete! Start AI simulations above.
          </div>
        )}

        {/* Quick Reference */}
        <div style={{ background: C.white, border: `1.5px solid ${C.border}`, marginBottom: 16 }}>
          <div style={{ background: C.red, color: C.white, padding: "10px 16px", fontSize: 13, fontWeight: 700 }}>Quick Reference</div>
          <div style={{ padding: 16, fontSize: 12, color: C.slate, lineHeight: 1.8 }}>
            <div>· ByteSense is NOT a night guard — it's a wellness health intelligence platform</div>
            <div>· 5 sensors: HR/HRV, EMG/Force, Respiratory, Temperature, Motion</div>
            <div>· Data flows to the bitely app with daily byteSense Score</div>
            <div>· NEVER say: "night guard," "mouthguard," "diagnoses," "FDA approved medical device"</div>
            <div>· Support: Natasha Blake — 909-527-9602</div>
            <div>· Tech: support@bytesense.ai</div>
            <div>· Lab: Florida Oral Labs — info@floridaorallabs.com</div>
          </div>
        </div>

        {/* Support */}
        <div style={{ background: C.ivory, padding: 20, textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.charcoal, marginBottom: 8 }}>Need help?</div>
          <button onClick={() => window.open("https://calendly.com", "_blank")}
            style={{ background: C.teal, color: "#fff", border: "none", padding: "10px 20px", fontSize: 13, fontWeight: 700, fontFamily: C.fn, cursor: "pointer" }}>
            Schedule Support Call
          </button>
        </div>

        {/* Reset */}
        <div style={{ textAlign: "center" }}>
          <button onClick={reset}
            style={{ background: "transparent", color: C.slate, border: `1px solid ${C.border}`, padding: "10px 20px", fontSize: 12, fontFamily: C.fn, cursor: "pointer" }}>
            Reset All Progress
          </button>
        </div>

        <div style={{ textAlign: "center", fontSize: 10, color: C.ash, marginTop: 24 }}>
          byteSense Inc. · Proprietary · Confidential
        </div>
      </div>
    </div>
  );
}
