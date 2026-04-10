import { useState, useEffect } from 'react';
import { C, PH, Role, Phase, ROLES } from '@/data/constants';
import { Module } from '@/data/constants';
import { Logo } from '@/components/ByteSenseLogo';
import { scrollTop } from '@/lib/helpers';
import { AppState } from '@/hooks/useAppState';
import { supabase } from '@/integrations/supabase/client';
import { t, Lang, LANG_OPTIONS } from '@/data/translations';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Tooltip } from 'recharts';

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
  openCoach: (mode: string) => void;
}

const CHART_COLORS = [C.teal, C.red, C.gold, C.blue, C.violet, C.cyan, C.green, C.rose, C.amber];

// Shared glass styles
const glass = {
  background: C.glass,
  backdropFilter: C.blur,
  WebkitBackdropFilter: C.blur,
  border: `1px solid ${C.glassBorder}`,
  borderRadius: C.radius,
} as React.CSSProperties;

const glassHover = (e: React.MouseEvent, enter: boolean) => {
  e.currentTarget.style.borderColor = enter ? C.glassHover : C.glassBorder;
  e.currentTarget.style.transform = enter ? "translateY(-2px)" : "translateY(0)";
};

export default function Dashboard({ s, u, sRoles, myPH, myM, dN, pr, allD, reset, openCoach }: DashboardProps) {
  const allModsDone = dN === myM.length && myM.length > 0;
  const allComplete = allModsDone && s.simP >= 3;
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [staffData, setStaffData] = useState<any[]>([]);
  const [notes, setNotes] = useState(() => localStorage.getItem('bsa6_notes') || '');
  const [goals, setGoals] = useState<{ text: string; done: boolean }[]>(() => {
    try { return JSON.parse(localStorage.getItem('bsa6_goals') || '[]'); } catch { return []; }
  });
  const [newGoal, setNewGoal] = useState('');
  const [revPatients, setRevPatients] = useState(200);
  const [revPrice, setRevPrice] = useState(2500);
  const [revClose, setRevClose] = useState(15);
  const lang = (s.lang || "en") as Lang;
  const T = (key: string) => t(lang, key);

  useEffect(() => { localStorage.setItem('bsa6_notes', notes); }, [notes]);
  useEffect(() => { localStorage.setItem('bsa6_goals', JSON.stringify(goals)); }, [goals]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('practice_id').eq('user_id', user.id).single();
      if (!profile?.practice_id) return;
      const { data: tp } = await supabase.from('training_progress').select('*').eq('practice_id', profile.practice_id);
      if (!tp) return;
      const userIds = tp.map(t => t.user_id);
      const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', userIds);
      setStaffData(tp.map(t => ({ ...t, name: profiles?.find(p => p.user_id === t.user_id)?.full_name || 'Unknown' })));
    };
    load();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('bsa6');
    window.location.href = '/welcome';
  };

  // Chart data
  const phaseChartData = myPH.map(ph => {
    const pm = myM.filter(m => m.phase === ph.id);
    const done = pm.filter(m => s.done.includes(m.id)).length;
    return { name: ph.label.replace(/Phase \d+ — /, '').substring(0, 12), done, remaining: pm.length - done, total: pm.length };
  }).filter(d => d.total > 0);

  const staffChartData = staffData.map(st => ({
    name: (st.name || '').split(' ')[0] || '?',
    progress: st.done_modules ? Math.round((st.done_modules.length / Math.max(myM.length, 1)) * 100) : 0,
  }));

  const pieData = [
    { name: 'Completed', value: dN, color: C.teal },
    { name: 'Remaining', value: Math.max(myM.length - dN, 0), color: "rgba(255,255,255,0.06)" },
  ];

  // Revenue calc
  const currentRev = revPatients * (revClose / 100) * revPrice;
  const projectedClose = Math.min(revClose * 2.5, 80);
  const projectedRev = revPatients * (projectedClose / 100) * revPrice;

  const isOwnerOrManager = sRoles.some(r => r.id === 'owner' || r.id === 'om');

  const kpiCard = (label: string, value: string | number, sub: string, color: string, gradient: string) => (
    <div style={{
      ...glass, padding: "22px 20px", flex: 1, minWidth: 140,
      position: "relative", overflow: "hidden", transition: "all 0.3s",
      boxShadow: C.glow(color, 0.08),
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = C.glow(color, 0.2); e.currentTarget.style.transform = "translateY(-3px)"; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = C.glow(color, 0.08); e.currentTarget.style.transform = "translateY(0)"; }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: gradient, borderRadius: `${C.radius} ${C.radius} 0 0` }} />
      <div style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1, letterSpacing: -1 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.ash, marginTop: 6 }}>{sub}</div>
    </div>
  );

  const tooltipStyle = { background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: C.radiusSm, fontSize: 12, backdropFilter: C.blur };

  return (
    <div style={{ fontFamily: C.fn, background: `radial-gradient(ellipse at top, #141420, ${C.dark})`, minHeight: "100vh", color: C.white }}>
      {/* Header */}
      <div style={{ background: "rgba(20,20,28,0.6)", backdropFilter: C.blur, padding: "20px 28px 22px", borderBottom: `1px solid ${C.glassBorder}` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Logo size={30} light />
              <span style={{ fontSize: 10, letterSpacing: 4, color: C.gold, textTransform: "uppercase", fontWeight: 700 }}>Practice Dashboard</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowLangMenu(!showLangMenu)}
                  style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.glassBorder}`, color: C.ash, padding: "6px 12px", fontSize: 11, cursor: "pointer", fontFamily: C.fn, display: "flex", alignItems: "center", gap: 5, borderRadius: C.radiusXs, transition: "all 0.2s" }}>
                  {LANG_OPTIONS.find((l: any) => l.id === lang)?.flag} {LANG_OPTIONS.find((l: any) => l.id === lang)?.label}
                </button>
                {showLangMenu && (
                  <div style={{ ...glass, position: "absolute", top: "100%", right: 0, zIndex: 50, minWidth: 150, marginTop: 6, overflow: "hidden" }}>
                    {LANG_OPTIONS.map((l: any) => (
                      <div key={l.id} onClick={() => { u({ lang: l.id }); setShowLangMenu(false); }}
                        style={{ padding: "10px 14px", fontSize: 12, color: lang === l.id ? C.gold : C.ash, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, background: lang === l.id ? "rgba(201,168,76,0.1)" : "transparent", transition: "background 0.2s" }}
                        onMouseEnter={e => { if (lang !== l.id) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                        onMouseLeave={e => { if (lang !== l.id) e.currentTarget.style.background = "transparent"; }}>
                        {l.flag} {l.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {[{ label: T("change_roles"), onClick: () => { u({ phase: "setup", roles: [] }); scrollTop(); } },
                { label: T("sign_out"), onClick: handleSignOut }].map((btn, i) => (
                <button key={i} onClick={btn.onClick}
                  style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.glassBorder}`, color: C.ash, padding: "6px 12px", fontSize: 11, cursor: "pointer", fontFamily: C.fn, borderRadius: C.radiusXs, transition: "all 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}>
                  {btn.label}
                </button>
              ))}
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
            <div style={{ fontSize: 10, color: C.ash, marginTop: 5 }}>{dN}/{myM.length} {T("sections")} · {myPH.length} {T("phases")} · {pr}% complete</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 28px 60px" }}>
        {/* KPI Cards */}
        <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
          {kpiCard("Training Progress", `${pr}%`, `${dN} of ${myM.length} modules`, C.teal, C.gradTeal)}
          {kpiCard("XP Earned", s.xp, "Experience Points", C.gold, C.gradGold)}
          {kpiCard("Modules Done", dN, `of ${myM.length} total`, C.blue, C.gradBlue)}
          {kpiCard("AI Simulations", `${s.simP}/3`, "Patient Encounters", C.red, C.gradRed)}
        </div>

        {/* Charts Row */}
        <div style={{ display: "grid", gridTemplateColumns: staffChartData.length > 0 ? "1fr 1fr" : "1fr", gap: 16, marginBottom: 28 }}>
          <div style={{ ...glass, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 18, color: C.white, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.teal }} /> Modules by Phase
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={phaseChartData} barSize={14}>
                <XAxis dataKey="name" tick={{ fill: C.ash, fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.ash, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="done" stackId="a" fill={C.teal} radius={[0, 0, 0, 0]} name="Done" />
                <Bar dataKey="remaining" stackId="a" fill="rgba(255,255,255,0.06)" radius={[4, 4, 0, 0]} name="Remaining" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ ...glass, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 18, color: C.white, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold }} />
              {staffChartData.length > 1 ? 'Staff Training Progress' : 'Overall Completion'}
            </div>
            {staffChartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={staffChartData} barSize={18} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: C.ash, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: C.ash, fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="progress" fill={C.teal} radius={[0, 6, 6, 0]} name="Progress %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={58} outerRadius={78} dataKey="value" strokeWidth={0}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ marginLeft: -30, textAlign: "center" }}>
                  <div style={{ fontSize: 30, fontWeight: 800, color: C.teal }}>{pr}%</div>
                  <div style={{ fontSize: 10, color: C.ash, letterSpacing: 2, textTransform: "uppercase" }}>Complete</div>
                </div>
              </div>
            )}
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
          <div style={{ padding: "18px 22px", fontSize: 14, fontWeight: 700, borderBottom: `1px solid ${C.glassBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>📋</span> Training Modules
            </span>
            <span style={{ fontSize: 11, color: C.ash, background: "rgba(255,255,255,0.06)", padding: "3px 10px", borderRadius: 999 }}>{dN}/{myM.length}</span>
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
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: pc ? C.green : `${phase.color}60`, border: `2px solid ${pc ? C.green : phase.color}`, transition: "all 0.3s" }} />
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
          {/* AI Sim row */}
          <div
            onClick={() => { if (allModsDone) { u({ phase: "simulation" }); scrollTop(); } }}
            style={{ padding: "14px 22px", display: "flex", alignItems: "center", gap: 12, cursor: allModsDone ? "pointer" : "not-allowed", opacity: allModsDone ? 1 : 0.4, transition: "opacity 0.3s" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.simP >= 3 ? C.green : `${C.gold}60`, border: `2px solid ${s.simP >= 3 ? C.green : C.gold}` }} />
            <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{T("ai_patient_sim")}</span>
            <span style={{ fontSize: 10, color: s.simP >= 3 ? C.green : C.ash, background: s.simP >= 3 ? `${C.green}15` : "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: 999 }}>{s.simP}/3</span>
            <span style={{ color: C.ash, fontSize: 12, opacity: 0.5 }}>→</span>
          </div>
        </div>

        {/* Revenue Calculator — Owner/Manager only */}
        {isOwnerOrManager && (
          <div style={{ ...glass, padding: 28, marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: C.radiusSm, background: C.gradGold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💰</div>
              Revenue Calculator
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 24 }}>
              {[
                { label: "Patients / Month", value: revPatients, min: 50, max: 800, step: 1, set: setRevPatients, color: C.teal, format: (v: number) => `${v}` },
                { label: "Avg Case Price ($)", value: revPrice, min: 500, max: 5000, step: 100, set: setRevPrice, color: C.gold, format: (v: number) => `$${v.toLocaleString()}` },
                { label: "Current Close Rate (%)", value: revClose, min: 5, max: 60, step: 1, set: setRevClose, color: C.red, format: (v: number) => `${v}%` },
              ].map((sl, i) => (
                <div key={i}>
                  <label style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>{sl.label}</label>
                  <input type="range" min={sl.min} max={sl.max} step={sl.step} value={sl.value} onChange={e => sl.set(+e.target.value)}
                    style={{ width: "100%", accentColor: sl.color, marginTop: 8, height: 4 }} />
                  <div style={{ fontSize: 22, fontWeight: 800, color: sl.color, marginTop: 6 }}>{sl.format(sl.value)}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: 22, textAlign: "center", borderRadius: C.radiusSm, border: `1px solid ${C.glassBorder}` }}>
                <div style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Current Monthly</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: C.ash }}>${currentRev.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: C.slate, marginTop: 4 }}>{revClose}% close rate</div>
              </div>
              <div style={{ background: `rgba(20,184,166,0.06)`, padding: 22, textAlign: "center", borderRadius: C.radiusSm, border: `1px solid ${C.teal}25`, boxShadow: C.glow(C.teal, 0.08) }}>
                <div style={{ fontSize: 10, color: C.teal, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>With ByteSense</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: C.teal }}>${projectedRev.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: C.teal, marginTop: 4 }}>{projectedClose.toFixed(0)}% projected close</div>
              </div>
            </div>
            <div style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: C.gold, fontWeight: 700 }}>
              +${(projectedRev - currentRev).toLocaleString()}/mo · ${((projectedRev - currentRev) * 12).toLocaleString()}/yr potential uplift
            </div>
          </div>
        )}

        {/* Goals & Notes Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div style={{ ...glass, padding: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>🎯 Goals</div>
            {goals.map((g, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.glassBorder}` }}>
                <div onClick={() => { const ng = [...goals]; ng[i] = { ...ng[i], done: !ng[i].done }; setGoals(ng); }}
                  style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${g.done ? C.green : "rgba(255,255,255,0.15)"}`, background: g.done ? C.green : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: C.white, flexShrink: 0, transition: "all 0.2s" }}>
                  {g.done ? "✓" : ""}
                </div>
                <span style={{ fontSize: 12, color: g.done ? C.ash : C.white, textDecoration: g.done ? "line-through" : "none", flex: 1, transition: "all 0.2s" }}>{g.text}</span>
                <span onClick={() => setGoals(goals.filter((_, j) => j !== i))} style={{ cursor: "pointer", color: C.slate, fontSize: 14, opacity: 0.5, transition: "opacity 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = "0.5"}>×</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <input value={newGoal} onChange={e => setNewGoal(e.target.value)} placeholder="Add a goal..."
                onKeyDown={e => { if (e.key === 'Enter' && newGoal.trim()) { setGoals([...goals, { text: newGoal.trim(), done: false }]); setNewGoal(''); } }}
                style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.glassBorder}`, color: C.white, padding: "8px 12px", fontSize: 12, fontFamily: C.fn, outline: "none", borderRadius: C.radiusXs }} />
              <button onClick={() => { if (newGoal.trim()) { setGoals([...goals, { text: newGoal.trim(), done: false }]); setNewGoal(''); } }}
                style={{ background: C.gradTeal, color: C.white, border: "none", padding: "8px 14px", fontSize: 12, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusXs }}>+</button>
            </div>
          </div>

          <div style={{ ...glass, padding: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>📝 Notes</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Write your notes here..."
              style={{ width: "100%", minHeight: 160, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.glassBorder}`, color: C.white, padding: 14, fontSize: 12, fontFamily: C.fn, outline: "none", resize: "vertical", lineHeight: 1.8, borderRadius: C.radiusSm }} />
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
            <div>· {T("ref_tech")}</div>
            <div>· {T("ref_lab")}</div>
          </div>
        </div>

        {/* Support + Reset */}
        <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
          <div style={{ flex: 1, ...glass, padding: 22, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>{T("need_help")}</div>
            <button onClick={() => window.open("https://calendly.com", "_blank")}
              style={{ background: C.gradTeal, color: "#fff", border: "none", padding: "11px 24px", fontSize: 13, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusSm, boxShadow: C.glow(C.teal, 0.2) }}>
              {T("schedule_call")}
            </button>
          </div>
          <div style={{ ...glass, padding: 22, textAlign: "center", display: "flex", alignItems: "center" }}>
            <button onClick={reset}
              style={{ background: "transparent", color: C.slate, border: `1px solid ${C.glassBorder}`, padding: "11px 24px", fontSize: 12, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusSm, transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.red}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.glassBorder}>
              {T("reset_progress")}
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 10, color: C.ash, marginTop: 24, opacity: 0.6 }}>
          {T("confidential")}
        </div>
      </div>
    </div>
  );
}
