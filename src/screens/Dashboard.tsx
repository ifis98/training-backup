import { useState } from 'react';
import { C, PH, Role, Phase } from '@/data/constants';
import { Module } from '@/data/constants';
import { Logo } from '@/components/ByteSenseLogo';
import { scrollTop } from '@/lib/helpers';
import { AppState } from '@/hooks/useAppState';
import { supabase } from '@/integrations/supabase/client';
import AICoach from '@/components/AICoach';
import { t, Lang, LANG_OPTIONS } from '@/data/translations';

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
  const [showCoach, setShowCoach] = useState(false);
  const [coachMode, setCoachMode] = useState("general");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const lang = (s.lang || "en") as Lang;
  const T = (key: string) => t(lang, key);

  const openCoach = (mode: string) => {
    setCoachMode(mode);
    setShowCoach(true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('bsa6');
    window.location.href = '/welcome';
  };

  return (
    <div style={{ fontFamily: C.fn, background: C.snow, minHeight: "100vh" }}>
      {/* Dark Header */}
      <div style={{ background: C.dark, padding: "18px 24px 20px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Logo size={28} light />
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* Language Selector */}
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowLangMenu(!showLangMenu)}
                  style={{ background: "none", border: `1px solid ${C.borderD}`, color: C.ash, padding: "5px 10px", fontSize: 11, cursor: "pointer", fontFamily: C.fn, display: "flex", alignItems: "center", gap: 4 }}>
                  {LANG_OPTIONS.find(l => l.id === lang)?.flag} {LANG_OPTIONS.find(l => l.id === lang)?.label}
                </button>
                {showLangMenu && (
                  <div style={{ position: "absolute", top: "100%", right: 0, background: C.dark2, border: `1px solid ${C.borderD}`, zIndex: 50, minWidth: 140, marginTop: 4 }}>
                    {LANG_OPTIONS.map(l => (
                      <div key={l.id} onClick={() => { u({ lang: l.id }); setShowLangMenu(false); }}
                        style={{ padding: "8px 12px", fontSize: 12, color: lang === l.id ? C.gold : C.ash, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, background: lang === l.id ? C.dark3 : "transparent" }}>
                        {l.flag} {l.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => { u({ phase: "setup", roles: [] }); scrollTop(); }}
                style={{ background: "none", border: `1px solid ${C.borderD}`, color: C.ash, padding: "5px 10px", fontSize: 11, cursor: "pointer", fontFamily: C.fn }}>{T("change_roles")}</button>
              <button onClick={handleSignOut}
                style={{ background: "none", border: `1px solid ${C.borderD}`, color: C.ash, padding: "5px 10px", fontSize: 11, cursor: "pointer", fontFamily: C.fn }}>{T("sign_out")}</button>
            </div>
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
              <div style={{ fontSize: 8, color: C.ash }}>{T("xp")}</div>
            </div>
            <div style={{ background: C.dark2, padding: "8px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.teal }}>{pr}%</div>
              <div style={{ fontSize: 8, color: C.ash }}>{T("done")}</div>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ height: 4, background: C.dark3 }}>
              <div style={{ height: "100%", width: `${pr}%`, background: `linear-gradient(90deg, ${C.teal}, ${C.green})`, transition: "width 0.5s" }} />
            </div>
            <div style={{ fontSize: 10, color: C.ash, marginTop: 3 }}>{dN}/{myM.length} {T("sections")} · {myPH.length} {T("phases")}</div>
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
                {pc && <span style={{ fontSize: 10, color: C.green, fontWeight: 700 }}>{T("complete")}</span>}
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
            <span style={{ fontSize: 13, fontWeight: 800, color: C.charcoal }}>{T("final_phase")}</span>
            {s.simP >= 3 && <span style={{ fontSize: 10, color: C.green, fontWeight: 700 }}>{T("complete")}</span>}
          </div>
          <div
            onClick={() => { if (allModsDone) { u({ phase: "simulation" }); scrollTop(); } }}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginLeft: 16, background: C.white, border: `1.5px solid ${C.border}`, borderLeft: `3px solid ${C.gold}`, cursor: allModsDone ? "pointer" : "not-allowed", opacity: allModsDone ? 1 : 0.5 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${s.simP >= 3 ? C.green : C.mist}`, background: s.simP >= 3 ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10, color: C.white }}>
              {s.simP >= 3 ? "✓" : ""}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal }}>{T("ai_patient_sim")}</div>
              <div style={{ fontSize: 11, color: C.ash }}>{s.simP}/3 {T("patients")}</div>
            </div>
            <span style={{ color: C.ash, fontSize: 14 }}>→</span>
          </div>
        </div>

        {/* Completion Banners */}
        {allComplete && (
          <div style={{ background: `linear-gradient(135deg, ${C.goldBg}, ${C.tealBg})`, border: `1.5px solid ${C.gold}`, padding: 20, textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.charcoal, marginBottom: 8 }}>{T("all_complete")}</div>
            <button onClick={() => { u({ phase: "report" }); scrollTop(); }}
              style={{ background: C.red, color: "#fff", border: "none", padding: "14px 28px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer" }}>
              {T("complete_onboarding")}
            </button>
          </div>
        )}

        {allModsDone && !allComplete && (
          <div style={{ background: C.teal, color: C.white, padding: 16, textAlign: "center", marginBottom: 16, fontSize: 14, fontWeight: 700 }}>
            {T("training_complete")}
          </div>
        )}

        {/* Quick Tools */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.charcoal, marginBottom: 8 }}>{T("quick_tools")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { mode: "followup", icon: "✉️", label: T("patient_followup"), desc: T("followup_desc") },
              { mode: "treatment", icon: "📋", label: T("treatment_plan"), desc: T("treatment_desc") },
              { mode: "objections", icon: "🛡️", label: T("handle_objections"), desc: T("objections_desc") },
              { mode: "educational", icon: "📚", label: T("educational_material"), desc: T("educational_desc") },
            ].map(tool => (
              <div key={tool.mode} onClick={() => openCoach(tool.mode)}
                style={{ background: C.white, border: `1.5px solid ${C.border}`, padding: "14px 12px", cursor: "pointer", transition: "border-color 0.2s" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{tool.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.charcoal }}>{tool.label}</div>
                <div style={{ fontSize: 10, color: C.ash }}>{tool.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Reference */}
        <div style={{ background: C.white, border: `1.5px solid ${C.border}`, marginBottom: 16 }}>
          <div style={{ background: C.red, color: C.white, padding: "10px 16px", fontSize: 13, fontWeight: 700 }}>{T("quick_reference")}</div>
          <div style={{ padding: 16, fontSize: 12, color: C.slate, lineHeight: 1.8 }}>
            <div>· {T("ref_not_nightguard")}</div>
            <div>· {T("ref_sensors")}</div>
            <div>· {T("ref_data")}</div>
            <div>· {T("ref_never_say")}</div>
            <div>· {T("ref_support")}</div>
            <div>· {T("ref_tech")}</div>
            <div>· {T("ref_lab")}</div>
          </div>
        </div>

        {/* Support */}
        <div style={{ background: C.ivory, padding: 20, textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.charcoal, marginBottom: 8 }}>{T("need_help")}</div>
          <button onClick={() => window.open("https://calendly.com", "_blank")}
            style={{ background: C.teal, color: "#fff", border: "none", padding: "10px 20px", fontSize: 13, fontWeight: 700, fontFamily: C.fn, cursor: "pointer" }}>
            {T("schedule_call")}
          </button>
        </div>

        {/* Reset */}
        <div style={{ textAlign: "center" }}>
          <button onClick={reset}
            style={{ background: "transparent", color: C.slate, border: `1px solid ${C.border}`, padding: "10px 20px", fontSize: 12, fontFamily: C.fn, cursor: "pointer" }}>
            {T("reset_progress")}
          </button>
        </div>

        <div style={{ textAlign: "center", fontSize: 10, color: C.ash, marginTop: 24 }}>
          {T("confidential")}
        </div>
      </div>

      {/* Floating AI Coach Button */}
      <button onClick={() => openCoach("general")}
        style={{
          position: "fixed", bottom: 24, right: 24, width: 56, height: 56,
          borderRadius: "50%", background: C.gold, border: "none",
          fontSize: 24, cursor: "pointer", boxShadow: "0 4px 20px rgba(201,168,76,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        }}>
        🧠
      </button>

      {/* AI Coach Panel */}
      {showCoach && <AICoach onClose={() => setShowCoach(false)} initialMode={coachMode} lang={lang} />}
    </div>
  );
}
