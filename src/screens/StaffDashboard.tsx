import { useState, useEffect, useMemo } from 'react';
import { C, Role, Phase } from '@/data/constants';
import { Module } from '@/data/constants';
import { Logo } from '@/components/ByteSenseLogo';
import { scrollTop, computeKnowledgeScore, getScoreLabel, getScoreColor, getRecommendations, getImprovementAreas } from '@/lib/helpers';
import { AppState } from '@/hooks/useAppState';
import { supabase } from '@/integrations/supabase/client';
import { t, Lang, LANG_OPTIONS } from '@/data/translations';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface StaffDashboardProps {
  s: AppState;
  u: (d: Partial<AppState>) => void;
  sRoles: Role[];
  myPH: Phase[];
  myM: Module[];
  dN: number;
  pr: number;
  allD: boolean;
  reset: () => void;
  openCoach: (mode: string) => void;
}

const glass = {
  background: C.glass,
  backdropFilter: C.blur,
  WebkitBackdropFilter: C.blur,
  border: `1px solid ${C.glassBorder}`,
  borderRadius: C.radius,
} as React.CSSProperties;

export default function StaffDashboard({ s, u, sRoles, myPH, myM, dN, pr, allD, reset, openCoach }: StaffDashboardProps) {
  const allModsDone = dN === myM.length && myM.length > 0;
  const allComplete = allModsDone && s.simP >= 3;
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [practiceName, setPracticeName] = useState("");
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const lang = (s.lang || "en") as Lang;
  const T = (key: string) => t(lang, key);

  useEffect(() => {
    const fetchPractice = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('practice_id').eq('user_id', user.id).single();
      if (profile?.practice_id) {
        const { data: practice } = await supabase.from('practices').select('name').eq('id', profile.practice_id).single();
        if (practice) setPracticeName(practice.name);
      }
    };
    fetchPractice();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('bsa6');
    window.location.href = '/welcome';
  };

  const phaseChartData = myPH.map(ph => {
    const pm = myM.filter(m => m.phase === ph.id);
    const done = pm.filter(m => s.done.includes(m.id)).length;
    return { name: ph.label.replace(/Phase \d+ — /, '').substring(0, 12), done, remaining: pm.length - done, total: pm.length };
  }).filter(d => d.total > 0);

  const pieData = [
    { name: 'Completed', value: dN, color: C.teal },
    { name: 'Remaining', value: Math.max(myM.length - dN, 0), color: "rgba(255,255,255,0.06)" },
  ];

  const tooltipStyle = { background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: C.radiusSm, fontSize: 12 };

  // Knowledge Score
  const knowledgeScore = useMemo(() => computeKnowledgeScore(s.blScore, dN, myM.length, s.simP), [s.blScore, dN, myM.length, s.simP]);
  const scoreColor = getScoreColor(knowledgeScore, { green: C.green, gold: C.gold, red: C.red });
  const scoreLabelKey = getScoreLabel(knowledgeScore);
  const recommendations = useMemo(() => getRecommendations(s.done, myM, myPH, 5), [s.done, myM, myPH]);
  const improvementAreas = useMemo(() => getImprovementAreas(s.done, myM, myPH), [s.done, myM, myPH]);

  const kpiCard = (label: string, value: string | number, sub: string, color: string, gradient: string) => (
    <div style={{
      ...glass, padding: "22px 18px", flex: 1, minWidth: 120,
      position: "relative", overflow: "hidden", transition: "all 0.3s",
      boxShadow: C.glow(color, 0.08),
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = C.glow(color, 0.2); e.currentTarget.style.transform = "translateY(-3px)"; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = C.glow(color, 0.08); e.currentTarget.style.transform = "translateY(0)"; }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: gradient, borderRadius: `${C.radius} ${C.radius} 0 0` }} />
      <div style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.ash, marginTop: 6 }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ fontFamily: C.fn, background: `radial-gradient(ellipse at top, #141420, ${C.dark})`, minHeight: "100vh", color: C.white }}>
      {/* Header */}
      <div style={{ background: "rgba(20,20,28,0.6)", backdropFilter: C.blur, padding: "20px 28px 22px", borderBottom: `1px solid ${C.glassBorder}` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Logo size={28} light />
              {practiceName && <span style={{ fontSize: 12, color: C.ash, opacity: 0.7 }}>· {practiceName}</span>}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowLangMenu(!showLangMenu)}
                  style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.glassBorder}`, color: C.ash, padding: "6px 12px", fontSize: 11, cursor: "pointer", fontFamily: C.fn, display: "flex", alignItems: "center", gap: 5, borderRadius: C.radiusXs }}>
                  {LANG_OPTIONS.find((l: any) => l.id === lang)?.flag} {LANG_OPTIONS.find((l: any) => l.id === lang)?.label}
                </button>
                {showLangMenu && (
                  <div style={{ ...glass, position: "absolute", top: "100%", right: 0, zIndex: 50, minWidth: 150, marginTop: 6, overflow: "hidden" }}>
                    {LANG_OPTIONS.map((l: any) => (
                      <div key={l.id} onClick={() => { u({ lang: l.id }); setShowLangMenu(false); }}
                        style={{ padding: "10px 14px", fontSize: 12, color: lang === l.id ? C.gold : C.ash, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, background: lang === l.id ? "rgba(201,168,76,0.1)" : "transparent" }}>
                        {l.flag} {l.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={handleSignOut}
                style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.glassBorder}`, color: C.ash, padding: "6px 12px", fontSize: 11, cursor: "pointer", fontFamily: C.fn, borderRadius: C.radiusXs }}>{T("sign_out")}</button>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: C.radiusSm, background: C.gradTeal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, boxShadow: C.glow(C.teal, 0.2) }}>
              {(s.name || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{s.name || 'Welcome'}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                {sRoles.map(r => <span key={r.id} style={{ background: `${r.color}20`, color: r.color, padding: "2px 10px", fontSize: 10, fontWeight: 700, borderRadius: 999 }}>{r.short}</span>)}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 999 }}>
              <div style={{ height: "100%", width: `${pr}%`, background: C.gradTeal, transition: "width 0.5s", borderRadius: 999, boxShadow: C.glow(C.teal, 0.3) }} />
            </div>
            <div style={{ fontSize: 10, color: C.ash, marginTop: 5 }}>{dN}/{myM.length} {T("sections")} · {pr}% complete</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 28px 60px" }}>
        {/* KPI Cards */}
        <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
          {kpiCard(T("kpi_progress"), `${pr}%`, `${dN}/${myM.length} ${T("modules")}`, C.teal, C.gradTeal)}
          {kpiCard(T("xp"), s.xp, T("kpi_points_earned"), C.gold, C.gradGold)}
          {kpiCard(T("kpi_baseline"), s.blScore ?? '—', T("kpi_initial_score"), C.blue, C.gradBlue)}
          <div onClick={() => { u({ phase: "simulation" }); scrollTop(); }} style={{ cursor: "pointer", flex: 1, minWidth: 120 }}>
            {kpiCard(T("kpi_simulations"), `${s.simP}/3`, T("kpi_completed"), C.red, C.gradRed)}
          </div>
        </div>

        {/* Knowledge Score + Recommendations Row */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, marginBottom: 28 }}>
          <div style={{ ...glass, padding: 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 11, color: C.ash, textTransform: "uppercase", letterSpacing: 2, marginBottom: 16, fontWeight: 600 }}>{T("knowledge_score")}</div>
            <div style={{ position: "relative", width: 140, height: 140 }}>
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle cx="70" cy="70" r="58" fill="none" stroke={scoreColor} strokeWidth="8"
                  strokeDasharray={`${(knowledgeScore / 100) * 364.4} 364.4`}
                  strokeLinecap="round" transform="rotate(-90 70 70)"
                  style={{ transition: "stroke-dasharray 0.8s ease", filter: `drop-shadow(0 0 8px ${scoreColor}40)` }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{knowledgeScore}</div>
                <div style={{ fontSize: 10, color: C.ash, marginTop: 4 }}>/100</div>
              </div>
            </div>
            <div style={{ marginTop: 14, padding: "4px 14px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: scoreColor, background: `${scoreColor}15` }}>
              {T(scoreLabelKey)}
            </div>
          </div>
          <div style={{ ...glass, padding: 24, overflow: "hidden" }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🎯</span> {T("training_recommendations")}
            </div>
            {recommendations.length === 0 ? (
              <div style={{ fontSize: 12, color: C.ash, textAlign: "center", padding: 20 }}>✅ {T("all_complete")}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recommendations.map(rec => (
                  <div key={rec.moduleId}
                    onClick={() => { u({ phase: "module", curMod: rec.moduleId, ckA: null }); scrollTop(); }}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: C.radiusXs, cursor: "pointer", border: `1px solid ${C.glassBorder}`, transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${rec.color}40`; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.glassBorder; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: rec.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{rec.moduleTitle}</div>
                      <div style={{ fontSize: 10, color: C.ash }}>{rec.time}</div>
                    </div>
                    <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 999, fontWeight: 700,
                      color: rec.priority === "high" ? C.red : rec.priority === "medium" ? C.gold : C.ash,
                      background: rec.priority === "high" ? `${C.red}15` : rec.priority === "medium" ? `${C.gold}15` : "rgba(255,255,255,0.04)",
                    }}>{T(`priority_${rec.priority}`)}</span>
                    <span style={{ color: C.teal, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{T("start_module")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Improvement Areas */}
        {improvementAreas.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>📊</span> {T("areas_to_improve")}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
              {improvementAreas.map(area => (
                <div key={area.phaseId} style={{ ...glass, padding: 20, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: area.color }} />
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{area.category}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 999 }}>
                      <div style={{ height: "100%", width: `${area.completion}%`, background: area.color, borderRadius: 999, transition: "width 0.5s" }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: area.color }}>{area.completion}%</span>
                  </div>
                  <div style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6, fontWeight: 600 }}>{T("tip_label")}</div>
                  {area.tips.map((tip, i) => (
                    <div key={i} style={{ fontSize: 11, color: C.ash, lineHeight: 1.6, paddingLeft: 10, borderLeft: `2px solid ${area.color}30`, marginBottom: 4 }}>{tip}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
          <div style={{ ...glass, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.teal }} /> {T("progress_by_phase")}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={phaseChartData} barSize={14}>
                <XAxis dataKey="name" tick={{ fill: C.ash, fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.ash, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                 <Bar dataKey="done" stackId="a" fill={C.teal} name={T("done_label")} />
                 <Bar dataKey="remaining" stackId="a" fill="rgba(255,255,255,0.06)" name={T("remaining_label")} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...glass, padding: 24 }}>
             <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
               <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold }} /> {T("completion")}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ marginLeft: -20, textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.teal }}>{pr}%</div>
                <div style={{ fontSize: 10, color: C.ash, letterSpacing: 2, textTransform: "uppercase" }}>{T("done")}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Completion Banners */}
        {allComplete && (
          <div style={{ ...glass, padding: 28, textAlign: "center", marginBottom: 24, boxShadow: C.glow(C.gold, 0.15), borderColor: `${C.gold}30` }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.gold, marginBottom: 10 }}>🏆 {T("all_complete")}</div>
            <button onClick={() => { u({ phase: "report" }); scrollTop(); }}
              style={{ background: C.gradRed, color: "#fff", border: "none", padding: "14px 32px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusSm, boxShadow: C.glow(C.red, 0.3) }}>
              {T("complete_onboarding")}
            </button>
          </div>
        )}

        {allModsDone && !allComplete && (
          <div style={{ background: C.gradTeal, color: C.white, padding: 18, textAlign: "center", marginBottom: 24, fontSize: 14, fontWeight: 700, borderRadius: C.radius, boxShadow: C.glow(C.teal, 0.25) }}>
            {T("training_complete")}
          </div>
        )}

        {/* Training Modules Accordion */}
        <div style={{ ...glass, marginBottom: 24, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", fontSize: 14, fontWeight: 700, borderBottom: `1px solid ${C.glassBorder}`, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>📋</span> {T("training_modules_label")}
            <span style={{ fontSize: 11, color: C.ash, marginLeft: "auto", background: "rgba(255,255,255,0.06)", padding: "3px 10px", borderRadius: 999 }}>{dN}/{myM.length}</span>
          </div>
          {myPH.map(phase => {
            const pm = myM.filter(m => m.phase === phase.id);
            if (!pm.length) return null;
            const pc = pm.every(m => s.done.includes(m.id));
            const isOpen = expandedPhase === phase.id;
            const phDone = pm.filter(m => s.done.includes(m.id)).length;
            return (
              <div key={phase.id}>
                <div onClick={() => setExpandedPhase(isOpen ? null : phase.id)}
                  style={{ padding: "14px 22px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", borderBottom: `1px solid ${C.glassBorder}`, background: isOpen ? "rgba(255,255,255,0.03)" : "transparent", transition: "background 0.2s" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: pc ? C.green : `${phase.color}60`, border: `2px solid ${pc ? C.green : phase.color}` }} />
                  <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{phase.label}</span>
                  <span style={{ fontSize: 10, color: pc ? C.green : C.ash, background: pc ? `${C.green}15` : "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: 999 }}>{phDone}/{pm.length}</span>
                  <span style={{ color: C.ash, fontSize: 11, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.25s" }}>▶</span>
                </div>
                {isOpen && pm.map(mod => {
                  const done = s.done.includes(mod.id);
                  return (
                    <div key={mod.id}
                      onClick={() => { u({ phase: "module", curMod: mod.id, ckA: null }); scrollTop(); }}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 22px 12px 44px", cursor: "pointer", borderBottom: `1px solid ${C.glassBorder}`, transition: "background 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${done ? C.green : "rgba(255,255,255,0.15)"}`, background: done ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 9, color: C.white, transition: "all 0.3s" }}>
                        {done ? "✓" : ""}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{mod.title}</div>
                        <div style={{ fontSize: 10, color: C.ash, marginTop: 1 }}>{mod.time}</div>
                      </div>
                      <span style={{ color: C.ash, fontSize: 12, opacity: 0.5 }}>→</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
          <div onClick={() => { if (allModsDone) { u({ phase: "simulation" }); scrollTop(); } }}
            style={{ padding: "14px 22px", display: "flex", alignItems: "center", gap: 12, cursor: allModsDone ? "pointer" : "not-allowed", opacity: allModsDone ? 1 : 0.4 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.simP >= 3 ? C.green : `${C.gold}60`, border: `2px solid ${s.simP >= 3 ? C.green : C.gold}` }} />
            <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{T("ai_patient_sim")}</span>
            <span style={{ fontSize: 10, color: s.simP >= 3 ? C.green : C.ash, background: s.simP >= 3 ? `${C.green}15` : "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: 999 }}>{s.simP}/3</span>
            <span style={{ color: C.ash, fontSize: 12, opacity: 0.5 }}>→</span>
          </div>
        </div>

        {/* Quick Tools */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>⚡ {T("quick_tools")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
            {[
              { mode: "followup", icon: "✉️", label: T("patient_followup"), desc: T("followup_desc"), color: C.teal },
              { mode: "treatment", icon: "📋", label: T("treatment_plan"), desc: T("treatment_desc"), color: C.blue },
              { mode: "objections", icon: "🛡️", label: T("handle_objections"), desc: T("objections_desc"), color: C.violet },
              { mode: "educational", icon: "📚", label: T("educational_material"), desc: T("educational_desc"), color: C.gold },
            ].map(tool => (
              <div key={tool.mode} onClick={() => openCoach(tool.mode)}
                style={{ ...glass, padding: "18px 14px", cursor: "pointer", transition: "all 0.3s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${tool.color}40`; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = C.glow(tool.color, 0.12); }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.glassBorder; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ width: 36, height: 36, borderRadius: C.radiusSm, background: `${tool.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 10 }}>{tool.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{tool.label}</div>
                <div style={{ fontSize: 10, color: C.ash, marginTop: 3, lineHeight: 1.5 }}>{tool.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Reference */}
        <div style={{ ...glass, marginBottom: 24, overflow: "hidden" }}>
          <div style={{ background: C.gradRed, color: C.white, padding: "12px 20px", fontSize: 13, fontWeight: 700, borderRadius: `${C.radius} ${C.radius} 0 0` }}>{T("quick_reference")}</div>
          <div style={{ padding: 20, fontSize: 12, color: C.ash, lineHeight: 2 }}>
            <div>· {T("ref_not_nightguard")}</div>
            <div>· {T("ref_sensors")}</div>
            <div>· {T("ref_data")}</div>
            <div>· {T("ref_never_say")}</div>
            <div>· {T("ref_support")}</div>
          </div>
        </div>

        {/* Support */}
        <div style={{ ...glass, padding: 22, textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>{T("need_help")}</div>
          <button onClick={() => window.open("https://calendly.com", "_blank")}
            style={{ background: C.gradTeal, color: "#fff", border: "none", padding: "11px 24px", fontSize: 13, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusSm, boxShadow: C.glow(C.teal, 0.2) }}>
            {T("schedule_call")}
          </button>
        </div>

        <div style={{ textAlign: "center", fontSize: 10, color: C.ash, opacity: 0.6 }}>
          {T("confidential")}
        </div>
      </div>
    </div>
  );
}
