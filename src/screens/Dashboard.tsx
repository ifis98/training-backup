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

  // Persist notes & goals
  useEffect(() => { localStorage.setItem('bsa6_notes', notes); }, [notes]);
  useEffect(() => { localStorage.setItem('bsa6_goals', JSON.stringify(goals)); }, [goals]);

  // Load staff training data for charts
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
    { name: 'Remaining', value: Math.max(myM.length - dN, 0), color: C.dark3 },
  ];

  // Revenue calc
  const currentRev = revPatients * (revClose / 100) * revPrice;
  const projectedClose = Math.min(revClose * 2.5, 80);
  const projectedRev = revPatients * (projectedClose / 100) * revPrice;

  const isOwnerOrManager = sRoles.some(r => r.id === 'owner' || r.id === 'om');

  const kpiCard = (label: string, value: string | number, sub: string, color: string, glow: string) => (
    <div style={{ background: C.dark2, border: `1px solid ${C.borderD}`, padding: "20px 16px", flex: 1, minWidth: 140, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.ash, marginTop: 4 }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ fontFamily: C.fn, background: C.dark, minHeight: "100vh", color: C.white }}>
      {/* Header */}
      <div style={{ background: C.dark2, padding: "18px 24px 20px", borderBottom: `1px solid ${C.borderD}` }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Logo size={28} light />
              <span style={{ fontSize: 10, letterSpacing: 3, color: C.gold, textTransform: "uppercase", fontWeight: 700 }}>Practice Dashboard</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowLangMenu(!showLangMenu)}
                  style={{ background: "none", border: `1px solid ${C.borderD}`, color: C.ash, padding: "5px 10px", fontSize: 11, cursor: "pointer", fontFamily: C.fn, display: "flex", alignItems: "center", gap: 4 }}>
                  {LANG_OPTIONS.find((l: any) => l.id === lang)?.flag} {LANG_OPTIONS.find((l: any) => l.id === lang)?.label}
                </button>
                {showLangMenu && (
                  <div style={{ position: "absolute", top: "100%", right: 0, background: C.dark2, border: `1px solid ${C.borderD}`, zIndex: 50, minWidth: 140, marginTop: 4 }}>
                    {LANG_OPTIONS.map((l: any) => (
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
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{s.name || 'Welcome'}</div>
            <div style={{ display: "flex", gap: 4 }}>
              {sRoles.map(r => <span key={r.id} style={{ background: r.bg, color: r.color, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{r.short}</span>)}
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ height: 4, background: C.dark3, borderRadius: 2 }}>
              <div style={{ height: "100%", width: `${pr}%`, background: `linear-gradient(90deg, ${C.teal}, ${C.green})`, transition: "width 0.5s", borderRadius: 2 }} />
            </div>
            <div style={{ fontSize: 10, color: C.ash, marginTop: 3 }}>{dN}/{myM.length} {T("sections")} · {myPH.length} {T("phases")} · {pr}% complete</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 24px 60px" }}>
        {/* KPI Cards */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          {kpiCard("Training Progress", `${pr}%`, `${dN} of ${myM.length} modules`, C.teal, C.tealD)}
          {kpiCard("XP Earned", s.xp, "Experience Points", C.gold, C.amber)}
          {kpiCard("Modules Done", dN, `of ${myM.length} total`, C.blue, C.violet)}
          {kpiCard("AI Simulations", `${s.simP}/3`, "Patient Encounters", C.red, C.redL)}
        </div>

        {/* Charts Row */}
        <div style={{ display: "grid", gridTemplateColumns: staffChartData.length > 0 ? "1fr 1fr" : "1fr", gap: 16, marginBottom: 24 }}>
          {/* Modules by Phase */}
          <div style={{ background: C.dark2, border: `1px solid ${C.borderD}`, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: C.white }}>Modules by Phase</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={phaseChartData} barSize={16}>
                <XAxis dataKey="name" tick={{ fill: C.ash, fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.ash, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: C.dark3, border: `1px solid ${C.borderD}`, borderRadius: 4, fontSize: 12 }} />
                <Bar dataKey="done" stackId="a" fill={C.teal} radius={[0, 0, 0, 0]} name="Done" />
                <Bar dataKey="remaining" stackId="a" fill={C.dark3} radius={[2, 2, 0, 0]} name="Remaining" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Staff Progress or Personal Donut */}
          <div style={{ background: C.dark2, border: `1px solid ${C.borderD}`, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: C.white }}>
              {staffChartData.length > 1 ? 'Staff Training Progress' : 'Overall Completion'}
            </div>
            {staffChartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={staffChartData} barSize={20} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: C.ash, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: C.ash, fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip contentStyle={{ background: C.dark3, border: `1px solid ${C.borderD}`, borderRadius: 4, fontSize: 12 }} />
                  <Bar dataKey="progress" fill={C.teal} radius={[0, 4, 4, 0]} name="Progress %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} dataKey="value" strokeWidth={0}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ marginLeft: -30, textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: C.teal }}>{pr}%</div>
                  <div style={{ fontSize: 10, color: C.ash }}>Complete</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Completion Banners */}
        {allComplete && (
          <div style={{ background: `linear-gradient(135deg, ${C.dark2}, ${C.dark3})`, border: `1px solid ${C.gold}`, padding: 24, textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.gold, marginBottom: 8 }}>🏆 {T("all_complete")}</div>
            <button onClick={() => { u({ phase: "report" }); scrollTop(); }}
              style={{ background: C.red, color: "#fff", border: "none", padding: "14px 28px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer" }}>
              {T("complete_onboarding")}
            </button>
          </div>
        )}

        {allModsDone && !allComplete && (
          <div style={{ background: `linear-gradient(90deg, ${C.teal}, ${C.tealD})`, color: C.white, padding: 16, textAlign: "center", marginBottom: 20, fontSize: 14, fontWeight: 700 }}>
            {T("training_complete")}
          </div>
        )}

        {/* Training Modules Accordion */}
        <div style={{ background: C.dark2, border: `1px solid ${C.borderD}`, marginBottom: 20 }}>
          <div style={{ padding: "16px 20px", fontSize: 14, fontWeight: 700, borderBottom: `1px solid ${C.borderD}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>📋 Training Modules</span>
            <span style={{ fontSize: 11, color: C.ash }}>{dN}/{myM.length}</span>
          </div>
          {myPH.map(phase => {
            const pm = myM.filter(m => m.phase === phase.id);
            if (!pm.length) return null;
            const pc = pm.every(m => s.done.includes(m.id));
            const isOpen = expandedPhase === phase.id;
            return (
              <div key={phase.id}>
                <div onClick={() => setExpandedPhase(isOpen ? null : phase.id)}
                  style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", borderBottom: `1px solid ${C.borderD}`, background: isOpen ? C.dark3 : "transparent" }}>
                  <div style={{ width: 8, height: 8, background: pc ? C.green : phase.color, borderRadius: "50%" }} />
                  <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{phase.label}</span>
                  <span style={{ fontSize: 10, color: pc ? C.green : C.ash }}>{pm.filter(m => s.done.includes(m.id)).length}/{pm.length}</span>
                  <span style={{ color: C.ash, fontSize: 12, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>▶</span>
                </div>
                {isOpen && pm.map(mod => {
                  const done = s.done.includes(mod.id);
                  return (
                    <div key={mod.id}
                      onClick={() => { u({ phase: "module", curMod: mod.id, ckA: null }); scrollTop(); }}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px 10px 40px", cursor: "pointer", borderBottom: `1px solid ${C.borderD}`, background: C.dark2 }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${done ? C.green : C.borderD}`, background: done ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 8, color: C.white }}>
                        {done ? "✓" : ""}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{mod.title}</div>
                        <div style={{ fontSize: 10, color: C.ash }}>{mod.time}</div>
                      </div>
                      <span style={{ color: C.ash, fontSize: 12 }}>→</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
          {/* AI Simulation row */}
          <div
            onClick={() => { if (allModsDone) { u({ phase: "simulation" }); scrollTop(); } }}
            style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 10, cursor: allModsDone ? "pointer" : "not-allowed", opacity: allModsDone ? 1 : 0.5 }}>
            <div style={{ width: 8, height: 8, background: C.gold, borderRadius: "50%" }} />
            <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{T("ai_patient_sim")}</span>
            <span style={{ fontSize: 10, color: s.simP >= 3 ? C.green : C.ash }}>{s.simP}/3</span>
            <span style={{ color: C.ash, fontSize: 12 }}>→</span>
          </div>
        </div>

        {/* Revenue Calculator — Owner/Manager only */}
        {isOwnerOrManager && (
          <div style={{ background: C.dark2, border: `1px solid ${C.borderD}`, padding: 24, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span>💰</span> Revenue Calculator
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 1 }}>Patients / Month</label>
                <input type="range" min={50} max={800} value={revPatients} onChange={e => setRevPatients(+e.target.value)}
                  style={{ width: "100%", accentColor: C.teal, marginTop: 6 }} />
                <div style={{ fontSize: 18, fontWeight: 800, color: C.teal, marginTop: 4 }}>{revPatients}</div>
              </div>
              <div>
                <label style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 1 }}>Avg Case Price ($)</label>
                <input type="range" min={500} max={5000} step={100} value={revPrice} onChange={e => setRevPrice(+e.target.value)}
                  style={{ width: "100%", accentColor: C.gold, marginTop: 6 }} />
                <div style={{ fontSize: 18, fontWeight: 800, color: C.gold, marginTop: 4 }}>${revPrice.toLocaleString()}</div>
              </div>
              <div>
                <label style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 1 }}>Current Close Rate (%)</label>
                <input type="range" min={5} max={60} value={revClose} onChange={e => setRevClose(+e.target.value)}
                  style={{ width: "100%", accentColor: C.red, marginTop: 6 }} />
                <div style={{ fontSize: 18, fontWeight: 800, color: C.red, marginTop: 4 }}>{revClose}%</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: C.dark3, padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Current Monthly</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.ash }}>${currentRev.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: C.slate, marginTop: 4 }}>{revClose}% close rate</div>
              </div>
              <div style={{ background: C.dark3, padding: 20, textAlign: "center", border: `1px solid ${C.teal}40` }}>
                <div style={{ fontSize: 10, color: C.teal, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>With ByteSense</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.teal }}>${projectedRev.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: C.teal, marginTop: 4 }}>{projectedClose.toFixed(0)}% projected close rate</div>
              </div>
            </div>
            <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: C.gold, fontWeight: 700 }}>
              +${(projectedRev - currentRev).toLocaleString()}/month potential uplift · ${((projectedRev - currentRev) * 12).toLocaleString()}/year
            </div>
          </div>
        )}

        {/* Goals & Notes Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          {/* Goals */}
          <div style={{ background: C.dark2, border: `1px solid ${C.borderD}`, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🎯 Goals</div>
            {goals.map((g, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.borderD}` }}>
                <div onClick={() => { const ng = [...goals]; ng[i] = { ...ng[i], done: !ng[i].done }; setGoals(ng); }}
                  style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${g.done ? C.green : C.borderD}`, background: g.done ? C.green : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: C.white, flexShrink: 0 }}>
                  {g.done ? "✓" : ""}
                </div>
                <span style={{ fontSize: 12, color: g.done ? C.ash : C.white, textDecoration: g.done ? "line-through" : "none", flex: 1 }}>{g.text}</span>
                <span onClick={() => setGoals(goals.filter((_, j) => j !== i))} style={{ cursor: "pointer", color: C.slate, fontSize: 12 }}>×</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <input value={newGoal} onChange={e => setNewGoal(e.target.value)} placeholder="Add a goal..."
                onKeyDown={e => { if (e.key === 'Enter' && newGoal.trim()) { setGoals([...goals, { text: newGoal.trim(), done: false }]); setNewGoal(''); } }}
                style={{ flex: 1, background: C.dark3, border: `1px solid ${C.borderD}`, color: C.white, padding: "6px 10px", fontSize: 12, fontFamily: C.fn, outline: "none" }} />
              <button onClick={() => { if (newGoal.trim()) { setGoals([...goals, { text: newGoal.trim(), done: false }]); setNewGoal(''); } }}
                style={{ background: C.teal, color: C.white, border: "none", padding: "6px 12px", fontSize: 11, fontWeight: 700, fontFamily: C.fn, cursor: "pointer" }}>+</button>
            </div>
          </div>

          {/* Notes */}
          <div style={{ background: C.dark2, border: `1px solid ${C.borderD}`, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📝 Notes</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Write your notes here..."
              style={{ width: "100%", minHeight: 150, background: C.dark3, border: `1px solid ${C.borderD}`, color: C.white, padding: 12, fontSize: 12, fontFamily: C.fn, outline: "none", resize: "vertical", lineHeight: 1.7 }} />
          </div>
        </div>

        {/* Quick Tools */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>⚡ {T("quick_tools")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
            {[
              { mode: "followup", icon: "✉️", label: T("patient_followup"), desc: T("followup_desc") },
              { mode: "treatment", icon: "📋", label: T("treatment_plan"), desc: T("treatment_desc") },
              { mode: "objections", icon: "🛡️", label: T("handle_objections"), desc: T("objections_desc") },
              { mode: "educational", icon: "📚", label: T("educational_material"), desc: T("educational_desc") },
            ].map(tool => (
              <div key={tool.mode} onClick={() => openCoach(tool.mode)}
                style={{ background: C.dark2, border: `1px solid ${C.borderD}`, padding: "16px 12px", cursor: "pointer", transition: "border-color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = C.teal)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = C.borderD)}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{tool.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{tool.label}</div>
                <div style={{ fontSize: 10, color: C.ash, marginTop: 2 }}>{tool.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Reference */}
        <div style={{ background: C.dark2, border: `1px solid ${C.borderD}`, marginBottom: 20 }}>
          <div style={{ background: C.red, color: C.white, padding: "10px 16px", fontSize: 13, fontWeight: 700 }}>{T("quick_reference")}</div>
          <div style={{ padding: 16, fontSize: 12, color: C.ash, lineHeight: 1.8 }}>
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
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, background: C.dark2, border: `1px solid ${C.borderD}`, padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{T("need_help")}</div>
            <button onClick={() => window.open("https://calendly.com", "_blank")}
              style={{ background: C.teal, color: "#fff", border: "none", padding: "10px 20px", fontSize: 13, fontWeight: 700, fontFamily: C.fn, cursor: "pointer" }}>
              {T("schedule_call")}
            </button>
          </div>
          <div style={{ background: C.dark2, border: `1px solid ${C.borderD}`, padding: 20, textAlign: "center", display: "flex", alignItems: "center" }}>
            <button onClick={reset}
              style={{ background: "transparent", color: C.slate, border: `1px solid ${C.borderD}`, padding: "10px 20px", fontSize: 12, fontFamily: C.fn, cursor: "pointer" }}>
              {T("reset_progress")}
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 10, color: C.ash, marginTop: 24 }}>
          {T("confidential")}
        </div>
      </div>
    </div>
  );
}
