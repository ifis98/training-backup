import { C, ROLES } from '@/data/constants';
import { Logo } from '@/components/ByteSenseLogo';
import { scrollTop } from '@/lib/helpers';
import { AppState } from '@/hooks/useAppState';

interface ReportProps {
  s: AppState;
  u: (d: Partial<AppState>) => void;
  sc: number;
  myPH: any[];
  myM: any[];
  dN: number;
  pr: number;
}

export default function Report({ s, u, sc, myPH, myM, dN, pr }: ReportProps) {
  const sRoles = ROLES.filter(r => s.roles.includes(r.id));
  const start = sc;
  const final = Math.min(100, Math.round(pr * 0.6 + (s.simP >= 3 ? 30 : s.simP * 10) + (s.xp > 300 ? 10 : Math.round(s.xp / 30))));
  const dt = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=https://bytesense.ai&title=ByteSense Certified Advisor!&summary=Completed onboarding as ${sRoles.map(r => r.label).join(", ")}. #ByteSense`;

  return (
    <div style={{ fontFamily: C.fn, background: C.snow, minHeight: "100vh" }}>
      {/* Dark Header */}
      <div style={{ background: C.dark, color: C.white, padding: "44px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: C.ash, textTransform: "uppercase", marginBottom: 10 }}>Training Report</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Congratulations, {s.name}!</h2>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div><div style={{ fontSize: 12, color: C.ash }}>Before</div><div style={{ fontSize: 28, fontWeight: 800, color: C.ash }}>{start}%</div></div>
          <div style={{ fontSize: 22, color: C.teal }}>→</div>
          <div><div style={{ fontSize: 12, color: C.teal }}>After</div><div style={{ fontSize: 28, fontWeight: 800, color: C.teal }}>{final}%</div></div>
        </div>
        <div style={{ fontSize: 13, color: C.green, fontWeight: 700, marginTop: 8 }}>+{final - start} points</div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: 24 }}>
        {/* Report Card */}
        <div style={{ background: C.white, border: `1.5px solid ${C.border}`, padding: "28px 24px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.charcoal }}>ByteSense Onboarding Report</div>
              <div style={{ fontSize: 12, color: C.ash }}>{dt}</div>
            </div>
            <Logo size={28} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[["Team Member", s.name], ["Practice", s.practice || "—"], ["Pre-Training", start + "%"], ["Post-Training", final + "%"], ["Phases", myPH.length + ""], ["Modules", dN + "/" + myM.length], ["AI Patients", s.simP + "/3"], ["XP", s.xp + ""]].map(([l, v], i) => (
              <div key={i}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.ash, letterSpacing: 1, textTransform: "uppercase" }}>{l}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: i === 3 ? C.teal : i === 2 ? C.ash : C.charcoal }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Roles, Duties & Goals */}
          <div style={{ borderTop: `1px solid ${C.mist}`, paddingTop: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.charcoal, marginBottom: 10 }}>Roles, Duties & Monthly Goals</div>
            {sRoles.map(r => (
              <div key={r.id} style={{ marginBottom: 14, background: C.snow, padding: 14, borderLeft: `3px solid ${r.color}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: r.color, marginBottom: 6 }}>{r.label}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.charcoal, marginBottom: 4 }}>Duties:</div>
                {r.duties.map((d, i) => <div key={i} style={{ fontSize: 12, color: C.slate, paddingLeft: 12, marginBottom: 2 }}>· {d}</div>)}
                <div style={{ fontSize: 11, fontWeight: 700, color: C.charcoal, marginTop: 8, marginBottom: 4 }}>Monthly Goals:</div>
                {r.goals.map((g, i) => <div key={i} style={{ fontSize: 12, color: C.slate, paddingLeft: 12, marginBottom: 2 }}>· {g}</div>)}
              </div>
            ))}
          </div>

          {/* Acknowledgment */}
          <div style={{ borderTop: `1px solid ${C.mist}`, paddingTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 8 }}>Acknowledgment & Signature</div>
            <div style={{ fontSize: 12, color: C.slate, lineHeight: 1.7, marginBottom: 14 }}>
              I, {s.name}, certify that I have completed the ByteSense Practice Onboarding Program. I understand the product positioning, compliance requirements, my roles ({sRoles.map(r => r.label).join(", ")}), duties, responsibilities, monthly goals, and expectations. I am prepared to represent ByteSense to patients according to these standards.
            </div>
            {s.signed ? (
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.ash, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Signature</div>
                  <div style={{ borderBottom: `1.5px solid ${C.charcoal}`, padding: "8px 0", fontStyle: "italic", fontSize: 16, color: C.charcoal, minWidth: 160 }}>{s.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.ash, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Date</div>
                  <div style={{ fontSize: 14, color: C.charcoal, paddingTop: 8 }}>{dt}</div>
                </div>
              </div>
            ) : (
              <button onClick={() => u({ signed: true })}
                style={{ background: C.teal, color: "#fff", border: "none", padding: "14px 28px", fontSize: 13, fontWeight: 700, fontFamily: C.fn, cursor: "pointer" }}>
                Sign Electronically
              </button>
            )}
          </div>
        </div>

        {/* Certificate */}
        {s.signed && (
          <div style={{ background: C.white, border: `3px solid ${C.gold}`, padding: "36px 28px", textAlign: "center", marginBottom: 20, position: "relative" }}>
            {/* Corner accents */}
            <div style={{ position: "absolute", top: 10, left: 10, width: 30, height: 30, borderTop: `2px solid ${C.gold}`, borderLeft: `2px solid ${C.gold}` }} />
            <div style={{ position: "absolute", top: 10, right: 10, width: 30, height: 30, borderTop: `2px solid ${C.gold}`, borderRight: `2px solid ${C.gold}` }} />
            <div style={{ position: "absolute", bottom: 10, left: 10, width: 30, height: 30, borderBottom: `2px solid ${C.gold}`, borderLeft: `2px solid ${C.gold}` }} />
            <div style={{ position: "absolute", bottom: 10, right: 10, width: 30, height: 30, borderBottom: `2px solid ${C.gold}`, borderRight: `2px solid ${C.gold}` }} />

            <Logo size={32} />
            <div style={{ fontSize: 9, letterSpacing: 4, color: C.gold, textTransform: "uppercase", marginTop: 10, marginBottom: 12 }}>byteSense Practice Onboarding</div>
            <div style={{ fontSize: 20, fontWeight: 300, color: C.charcoal, fontStyle: "italic" }}>Certificate of Completion</div>
            <div style={{ width: 40, height: 2, background: C.gold, margin: "8px auto 14px" }} />
            <div style={{ fontSize: 11, color: C.slate }}>This certifies that</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.charcoal, margin: "4px 0" }}>{s.name}</div>
            <div style={{ fontSize: 11, color: C.slate, maxWidth: 360, margin: "0 auto 12px", lineHeight: 1.7 }}>
              has completed ByteSense Practice Onboarding as {sRoles.map(r => r.label).join(" & ")} and is recognized as a
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.red, textTransform: "uppercase", marginBottom: 12 }}>ByteSense Certified Advisor</div>
            <div style={{ display: "flex", justifyContent: "space-around", borderTop: `1px solid ${C.mist}`, paddingTop: 12 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 100, borderBottom: `1px solid ${C.charcoal}`, paddingBottom: 16, marginBottom: 4 }}>
                  <span style={{ fontStyle: "italic", fontSize: 11, color: C.charcoal }}>Natasha Blake</span>
                </div>
                <div style={{ fontSize: 8, color: C.ash }}>CSIO</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: C.charcoal, paddingBottom: 16, borderBottom: `1px solid ${C.charcoal}`, width: 100, marginBottom: 4 }}>{dt}</div>
                <div style={{ fontSize: 8, color: C.ash }}>Date</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {s.signed && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <button onClick={() => window.print()}
              style={{ background: C.charcoal, color: "#fff", border: "none", padding: "14px 28px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              Print Report & Certificate
            </button>
            <button onClick={() => window.open(liUrl, "_blank")}
              style={{ background: C.blue, color: "#fff", border: "none", padding: "14px 28px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              Share on LinkedIn
            </button>
          </div>
        )}

        {/* Ambassador */}
        {s.xp > 600 && s.signed && (
          <div style={{ background: C.goldBg, border: `1.5px solid ${C.gold}50`, padding: 20, textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: C.gold, textTransform: "uppercase", marginBottom: 6 }}>Top 1% Performer</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.charcoal }}>Ambassador Candidate — {s.xp} XP</div>
            <div style={{ fontSize: 12, color: C.slate, marginTop: 4 }}>Watch for advanced Certified Advocate invitation.</div>
          </div>
        )}

        <button onClick={() => { u({ phase: "dashboard" }); scrollTop(); }}
          style={{ background: "transparent", color: C.slate, border: `1px solid ${C.border}`, padding: "14px 28px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
