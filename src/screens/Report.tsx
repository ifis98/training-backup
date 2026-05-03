import { C, ROLES } from '@/data/constants';
import { Logo } from '@/components/ByteSenseLogo'; // kept for certificate only
import { scrollTop } from '@/lib/helpers';
import { AppState } from '@/hooks/useAppState';
import { t, Lang } from '@/data/translations';
import { useIsMobile } from '@/hooks/use-mobile';

interface ReportProps {
  s: AppState;
  u: (d: Partial<AppState>) => void;
  sc: number;
  myPH: any[];
  myM: any[];
  dN: number;
  pr: number;
  lang?: Lang;
}

export default function Report({ s, u, sc, myPH, myM, dN, pr, lang = "en" }: ReportProps) {
  const T = (key: string) => t(lang, key);
  const isMobile = useIsMobile();
  const sRoles = ROLES.filter(r => s.roles.includes(r.id));
  const start = sc;
  const final = Math.min(100, Math.round(pr * 0.6 + (s.simP >= 3 ? 30 : s.simP * 10) + (s.xp > 300 ? 10 : Math.round(s.xp / 30))));
  const dt = new Date().toLocaleDateString(lang === "en" ? "en-US" : lang === "es" ? "es-ES" : lang === "pt" ? "pt-BR" : lang === "fr" ? "fr-FR" : "zh-CN", { year: "numeric", month: "long", day: "numeric" });
  const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=https://bytesense.ai&title=ByteSense Certified Advisor!&summary=Completed onboarding as ${sRoles.map(r => r.label).join(", ")}. #ByteSense`;

  return (
    <div style={{ fontFamily: C.fn, background: C.snow, minHeight: "100vh" }}>
      <div style={{ background: C.dark, color: C.white, padding: isMobile ? "32px 16px" : "44px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: C.ash, textTransform: "uppercase", marginBottom: 10 }}>{T("training_report")}</div>
        <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, marginBottom: 16 }}>{T("congratulations").replace("{name}", s.name)}</h2>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: isMobile ? 12 : 16, flexWrap: "wrap" }}>
          <div><div style={{ fontSize: 12, color: C.ash }}>{T("before")}</div><div style={{ fontSize: isMobile ? 24 : 28, fontWeight: 800, color: C.ash }}>{start}%</div></div>
          <div style={{ fontSize: 22, color: C.teal }}>→</div>
          <div><div style={{ fontSize: 12, color: C.teal }}>{T("after")}</div><div style={{ fontSize: isMobile ? 24 : 28, fontWeight: 800, color: C.teal }}>{final}%</div></div>
        </div>
        <div style={{ fontSize: 13, color: C.green, fontWeight: 700, marginTop: 8 }}>{T("points_gained").replace("{n}", String(final - start))}</div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: isMobile ? "16px" : 24 }}>
        <div style={{ background: C.white, border: `1.5px solid ${C.border}`, padding: isMobile ? "20px 16px" : "28px 24px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, color: C.charcoal }}>{T("onboarding_report")}</div>
              <div style={{ fontSize: 12, color: C.ash }}>{dt}</div>
            </div>
            <div style={{ fontSize: 11, color: C.ash, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>ByteSense</div>
          </div>

          {/* Stats grid: 2-col on desktop, 1-col on mobile */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 10 : 10, marginBottom: 16 }}>
            {[[T("team_member"), s.name], [T("practice"), s.practice || "—"], [T("pre_training"), start + "%"], [T("post_training"), final + "%"], [T("phases"), myPH.length + ""], [T("modules"), dN + "/" + myM.length], [T("ai_patients"), s.simP + "/3"], [T("xp"), s.xp + ""]].map(([l, v], i) => (
              <div key={i} style={{ display: "flex", justifyContent: isMobile ? "space-between" : "flex-start", alignItems: isMobile ? "center" : "flex-start", flexDirection: isMobile ? "row" : "column", padding: isMobile ? "8px 12px" : 0, background: isMobile ? C.snow : "transparent", borderRadius: isMobile ? 4 : 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.ash, letterSpacing: 1, textTransform: "uppercase" }}>{l}</div>
                <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: i === 3 ? C.teal : i === 2 ? C.ash : C.charcoal }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: `1px solid ${C.mist}`, paddingTop: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.charcoal, marginBottom: 10 }}>{T("roles_duties_goals")}</div>
            {sRoles.map(r => (
              <div key={r.id} style={{ marginBottom: 14, background: C.snow, padding: isMobile ? "12px 12px" : 14, borderLeft: `3px solid ${r.color}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: r.color, marginBottom: 6 }}>{r.label}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.charcoal, marginBottom: 4 }}>{T("duties")}</div>
                {r.duties.map((d, i) => <div key={i} style={{ fontSize: 12, color: C.slate, paddingLeft: 12, marginBottom: 2 }}>· {d}</div>)}
                <div style={{ fontSize: 11, fontWeight: 700, color: C.charcoal, marginTop: 8, marginBottom: 4 }}>{T("monthly_goals")}</div>
                {r.goals.map((g, i) => <div key={i} style={{ fontSize: 12, color: C.slate, paddingLeft: 12, marginBottom: 2 }}>· {g}</div>)}
              </div>
            ))}
          </div>

          <div style={{ borderTop: `1px solid ${C.mist}`, paddingTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 8 }}>{T("acknowledgment")}</div>
            <div style={{ fontSize: 12, color: C.slate, lineHeight: 1.7, marginBottom: 14 }}>
              {T("certify_text").replace("{name}", s.name).replace("{roles}", sRoles.map(r => r.label).join(", "))}
            </div>
            {s.signed ? (
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: isMobile ? "1 1 100%" : "0 0 auto" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.ash, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{T("signature")}</div>
                  <div style={{ borderBottom: `1.5px solid ${C.charcoal}`, padding: "8px 0", fontStyle: "italic", fontSize: 16, color: C.charcoal, minWidth: 160 }}>{s.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.ash, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{T("date")}</div>
                  <div style={{ fontSize: 14, color: C.charcoal, paddingTop: 8 }}>{dt}</div>
                </div>
              </div>
            ) : (
              <button onClick={() => u({ signed: true })}
                style={{ background: C.teal, color: "#fff", border: "none", padding: isMobile ? "13px 20px" : "14px 28px", fontSize: 13, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", width: isMobile ? "100%" : "auto" }}>
                {T("sign_electronically")}
              </button>
            )}
          </div>
        </div>

        {s.signed && (
          <div style={{ background: C.white, border: `3px solid ${C.gold}`, padding: isMobile ? "28px 20px" : "36px 28px", textAlign: "center", marginBottom: 20, position: "relative" }}>
            <div style={{ position: "absolute", top: 10, left: 10, width: 30, height: 30, borderTop: `2px solid ${C.gold}`, borderLeft: `2px solid ${C.gold}` }} />
            <div style={{ position: "absolute", top: 10, right: 10, width: 30, height: 30, borderTop: `2px solid ${C.gold}`, borderRight: `2px solid ${C.gold}` }} />
            <div style={{ position: "absolute", bottom: 10, left: 10, width: 30, height: 30, borderBottom: `2px solid ${C.gold}`, borderLeft: `2px solid ${C.gold}` }} />
            <div style={{ position: "absolute", bottom: 10, right: 10, width: 30, height: 30, borderBottom: `2px solid ${C.gold}`, borderRight: `2px solid ${C.gold}` }} />
            <Logo size={32} />
            <div style={{ fontSize: 9, letterSpacing: 4, color: C.gold, textTransform: "uppercase", marginTop: 10, marginBottom: 12 }}>{T("practice_onboarding")}</div>
            <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 300, color: C.charcoal, fontStyle: "italic" }}>{T("certificate_completion")}</div>
            <div style={{ width: 40, height: 2, background: C.gold, margin: "8px auto 14px" }} />
            <div style={{ fontSize: 11, color: C.slate }}>{T("certifies_that")}</div>
            <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 800, color: C.charcoal, margin: "4px 0" }}>{s.name}</div>
            <div style={{ fontSize: 11, color: C.slate, maxWidth: 360, margin: "0 auto 12px", lineHeight: 1.7 }}>
              {T("completed_as").replace("{roles}", sRoles.map(r => r.label).join(" & "))}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.red, textTransform: "uppercase", marginBottom: 12 }}>{T("certified_advisor")}</div>
            {/* Certificate footer: row on desktop, column on mobile */}
            <div style={{ display: "flex", justifyContent: isMobile ? "center" : "space-around", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 16 : 0, alignItems: "center", borderTop: `1px solid ${C.mist}`, paddingTop: 12 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 100, borderBottom: `1px solid ${C.charcoal}`, paddingBottom: 16, marginBottom: 4 }}>
                  <span style={{ fontStyle: "italic", fontSize: 11, color: C.charcoal }}>Natasha Blake</span>
                </div>
                <div style={{ fontSize: 8, color: C.ash }}>CSIO</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: C.charcoal, paddingBottom: 16, borderBottom: `1px solid ${C.charcoal}`, width: 100, marginBottom: 4 }}>{dt}</div>
                <div style={{ fontSize: 8, color: C.ash }}>{T("date")}</div>
              </div>
            </div>
          </div>
        )}

        {s.signed && (
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <button onClick={() => window.print()}
              style={{ background: C.charcoal, color: "#fff", border: "none", padding: "14px 28px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", flex: isMobile ? "unset" : 1, width: isMobile ? "100%" : "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {T("print_report")}
            </button>
            <button onClick={() => window.open(liUrl, "_blank")}
              style={{ background: C.blue, color: "#fff", border: "none", padding: "14px 28px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", flex: isMobile ? "unset" : 1, width: isMobile ? "100%" : "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {T("share_linkedin")}
            </button>
          </div>
        )}

        {s.xp > 600 && s.signed && (
          <div style={{ background: C.goldBg, border: `1.5px solid ${C.gold}50`, padding: 20, textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: C.gold, textTransform: "uppercase", marginBottom: 6 }}>{T("top_performer")}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.charcoal }}>{T("ambassador_candidate").replace("{xp}", String(s.xp))}</div>
            <div style={{ fontSize: 12, color: C.slate, marginTop: 4 }}>{T("ambassador_desc")}</div>
          </div>
        )}

        <button onClick={() => { u({ phase: "dashboard" }); scrollTop(); }}
          style={{ background: "transparent", color: C.slate, border: `1px solid ${C.border}`, padding: "14px 28px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {T("back_dashboard")}
        </button>
      </div>
    </div>
  );
}
