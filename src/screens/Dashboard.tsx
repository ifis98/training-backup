import { useState, useEffect, useMemo } from 'react';
import { C, PH, Role, Phase, ROLES } from '@/data/constants';
import { Module } from '@/data/constants';
import { Logo } from '@/components/ByteSenseLogo';
import { scrollTop, computeKnowledgeScore, getScoreLabel, getScoreColor, getRecommendations, getImprovementAreas } from '@/lib/helpers';
import { AppState } from '@/hooks/useAppState';
import { supabase } from '@/integrations/supabase/client';
import { t, Lang, LANG_OPTIONS } from '@/data/translations';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Tooltip } from 'recharts';
import DashboardSidebar from '@/components/DashboardSidebar';
import BookingModal from '@/components/BookingModal';
import { Target, BarChart3, ClipboardList, StickyNote, Zap, DollarSign, FileText, Trophy, Mail, Shield, BookOpen, Award, Star, ChevronRight, Printer, TrendingUp, TrendingDown, Plus, Briefcase, CheckCircle2, Clock, XCircle, ArrowRight, Pencil, Save } from 'lucide-react';

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

const glass = {
  background: C.glass,
  backdropFilter: C.blur,
  WebkitBackdropFilter: C.blur,
  border: `1px solid ${C.glassBorder}`,
  borderRadius: C.radius,
} as React.CSSProperties;

const glassHover = (e: React.MouseEvent<HTMLDivElement>, enter: boolean) => {
  e.currentTarget.style.borderColor = enter ? C.glassHover : C.glassBorder;
  e.currentTarget.style.transform = enter ? "translateY(-2px)" : "translateY(0)";
};


export default function Dashboard({ s, u, sRoles, myPH, myM, dN, pr, allD, reset, openCoach }: DashboardProps) {
  const allModsDone = dN === myM.length && myM.length > 0;
  const allComplete = allModsDone && s.simP >= 3;
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [staffData, setStaffData] = useState<any[]>([]);
  const [simReviews, setSimReviews] = useState<any[]>([]);
  const [notes, setNotes] = useState(() => localStorage.getItem('bsa6_notes') || '');
  const [goals, setGoals] = useState<{ text: string; done: boolean }[]>(() => {
    try { return JSON.parse(localStorage.getItem('bsa6_goals') || '[]'); } catch { return []; }
  });
  const [newGoal, setNewGoal] = useState('');
  const [revPatients, setRevPatients] = useState(200);
  const [revPrice, setRevPrice] = useState(2500);
  const [revClose, setRevClose] = useState(15);
  const [cases, setCases] = useState<any[]>([]);
  const [practiceGoals, setPracticeGoals] = useState<any>(null);
  const [caseFilter, setCaseFilter] = useState('all');
  const [showAddCase, setShowAddCase] = useState(false);
  const [newCase, setNewCase] = useState({ patient_name: '', status: 'pending', case_value: 0, notes: '' });
  const [editingGoals, setEditingGoals] = useState(false);
  const [editCaseGoal, setEditCaseGoal] = useState(0);
  const [editPricePerCase, setEditPricePerCase] = useState(0);
  const [showBooking, setShowBooking] = useState(false);
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

      // Load cases
      const { data: casesData } = await supabase.from('cases').select('*').eq('practice_id', profile.practice_id).order('created_at', { ascending: false });
      if (casesData) setCases(casesData);

      // Load practice goals
      const { data: goalsData } = await supabase.from('practice_goals').select('*').eq('practice_id', profile.practice_id).single();
      if (goalsData) setPracticeGoals(goalsData);
    };
    load();
  }, []);

  // Load simulation reviews
  useEffect(() => {
    const loadReviews = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('simulation_reviews').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (data) setSimReviews(data);
    };
    loadReviews();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('bsa6');
    window.location.href = '/welcome';
  };

  const handleAddCase = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('practice_id').eq('user_id', user.id).single();
    const { data, error } = await supabase.from('cases').insert({
      user_id: user.id,
      practice_id: profile?.practice_id,
      patient_name: newCase.patient_name,
      status: newCase.status,
      case_value: newCase.case_value,
      notes: newCase.notes,
    }).select().single();
    if (data) {
      setCases([data, ...cases]);
      setNewCase({ patient_name: '', status: 'pending', case_value: 0, notes: '' });
      setShowAddCase(false);
    }
  };

  const handleUpdateCaseStatus = async (caseId: string, newStatus: string) => {
    const { error } = await supabase.from('cases').update({ status: newStatus }).eq('id', caseId);
    if (!error) {
      setCases(cases.map(c => c.id === caseId ? { ...c, status: newStatus } : c));
      // Trigger email notification for follow-up status
      if (newStatus === 'follow_up') {
        const caseData = cases.find(c => c.id === caseId);
        if (caseData) {
          supabase.functions.invoke('notify-case-followup', {
            body: { caseId, patientName: caseData.patient_name },
          }).catch(() => {}); // fire-and-forget
        }
      }
    }
  };

  const handleSaveGoals = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('practice_id').eq('user_id', user.id).single();
    if (!profile?.practice_id) return;
    const autoRevenue = editCaseGoal * editPricePerCase;
    const { data, error } = await supabase.from('practice_goals').upsert({
      practice_id: profile.practice_id,
      monthly_case_goal: editCaseGoal,
      monthly_revenue_goal: autoRevenue,
      price_per_case: editPricePerCase,
    } as any, { onConflict: 'practice_id' }).select().single();
    if (data) {
      setPracticeGoals(data);
      setEditingGoals(false);
    }
  };

  const startEditGoals = () => {
    setEditCaseGoal(practiceGoals?.monthly_case_goal || 0);
    setEditPricePerCase((practiceGoals as any)?.price_per_case || 0);
    setEditingGoals(true);
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

  // Knowledge Score
  const knowledgeScore = useMemo(() => computeKnowledgeScore(s.blScore, dN, myM.length, s.simP), [s.blScore, dN, myM.length, s.simP]);
  const scoreColor = getScoreColor(knowledgeScore, { green: C.green, gold: C.gold, red: C.red });
  const scoreLabelKey = getScoreLabel(knowledgeScore);

  // Simulation-driven recommendations
  const recommendations = useMemo(() => {
    if (simReviews.length > 0) {
      const latestReview = simReviews[0];
      const simRecs: any[] = [];
      if (latestReview.modules_to_review) {
        for (const modName of latestReview.modules_to_review) {
          const mod = myM.find(m => m.title.toLowerCase().includes(modName.toLowerCase()) || modName.toLowerCase().includes(m.title.toLowerCase()));
          if (mod && !s.done.includes(mod.id)) {
            const ph = myPH.find(p => p.id === mod.phase);
            simRecs.push({
              phaseId: mod.phase, phaseLabel: ph?.label || mod.phase, moduleId: mod.id,
              moduleTitle: mod.title, time: mod.time, priority: "high" as const, color: ph?.color || "#888",
            });
          }
        }
      }
      if (simRecs.length > 0) {
        const fallback = getRecommendations(s.done, myM, myPH, 3).filter(r => !simRecs.find(sr => sr.moduleId === r.moduleId));
        return [...simRecs.slice(0, 3), ...fallback.slice(0, 2)];
      }
    }
    return getRecommendations(s.done, myM, myPH, 5);
  }, [s.done, myM, myPH, simReviews]);

  // Simulation-driven improvement areas
  const improvementAreas = useMemo(() => {
    const baseAreas = getImprovementAreas(s.done, myM, myPH);
    if (simReviews.length > 0) {
      const latestReview = simReviews[0];
      if (latestReview.improvements?.length > 0) {
        const simArea = {
          category: T("sim_performance"),
          phaseId: "simulation",
          completion: Math.min(latestReview.score, 100),
          tips: latestReview.tips?.slice(0, 3) || latestReview.improvements?.slice(0, 3) || [],
          color: C.gold,
        };
        return [simArea, ...baseAreas];
      }
    }
    return baseAreas;
  }, [s.done, myM, myPH, simReviews, lang]);

  // Badge logic
  const hasCertifiedBadge = allComplete && s.signed;
  const hasTopPerformerBadge = s.xp > 600 && s.signed;
  const avgSimScore = simReviews.length > 0 ? Math.round(simReviews.reduce((a, r) => a + r.score, 0) / simReviews.length) : null;

  // Case metrics
  const convertedCases = cases.filter(c => c.status === 'converted');
  const totalCaseRevenue = convertedCases.reduce((a, c) => a + (Number(c.case_value) || 0), 0);
  const monthlyGoal = practiceGoals?.monthly_case_goal || 0;
  const revenueGoal = practiceGoals?.monthly_revenue_goal || 0;
  const filteredCases = caseFilter === 'all' ? cases : cases.filter(c => c.status === caseFilter);

  // Case analytics chart data
  const caseAnalyticsData = useMemo(() => {
    const byMonth: Record<string, { total: number; converted: number; revenue: number }> = {};
    cases.forEach(c => {
      const d = new Date(c.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { total: 0, converted: 0, revenue: 0 };
      byMonth[key].total++;
      if (c.status === 'converted') {
        byMonth[key].converted++;
        byMonth[key].revenue += Number(c.case_value) || 0;
      }
    });
    return Object.entries(byMonth).sort().slice(-6).map(([month, d]) => ({
      month: month.slice(5),
      conversionRate: d.total > 0 ? Math.round((d.converted / d.total) * 100) : 0,
      revenue: d.revenue,
      total: d.total,
      converted: d.converted,
    }));
  }, [cases]);

  const caseStatusIcon = (status: string) => {
    switch (status) {
      case 'converted': return <CheckCircle2 size={14} strokeWidth={1.5} color={C.green} />;
      case 'follow_up': return <Clock size={14} strokeWidth={1.5} color={C.gold} />;
      case 'rejected': return <XCircle size={14} strokeWidth={1.5} color={C.red} />;
      default: return <Clock size={14} strokeWidth={1.5} color={C.ash} />;
    }
  };

  const caseStatusColor = (status: string) => {
    switch (status) { case 'converted': return C.green; case 'follow_up': return C.gold; case 'rejected': return C.red; default: return C.ash; }
  };

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

  const tooltipStyle = { background: C.dark2, border: `1px solid ${C.glassBorder}`, borderRadius: C.radiusSm, fontSize: 12, color: C.white };

  return (
    <div style={{ fontFamily: C.fn, background: `radial-gradient(ellipse at top, #141420, ${C.dark})`, minHeight: "100vh", color: C.white, display: "flex" }}>
      {/* Sidebar */}
      <DashboardSidebar s={s} u={u} allD={allD} allComplete={allComplete} openCoach={openCoach} onSignOut={handleSignOut} lang={lang} />

      <div style={{ flex: 1, minWidth: 0 }}>
      {/* Header */}
      <div style={{ background: "rgba(20,20,28,0.6)", backdropFilter: C.blur, padding: "20px 28px 22px", borderBottom: `1px solid ${C.glassBorder}` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Logo size={30} light onClick={() => { u({ phase: "dashboard" }); scrollTop(); }} />
              <span style={{ fontSize: 10, letterSpacing: 4, color: C.gold, textTransform: "uppercase", fontWeight: 700 }}>{T("practice_dashboard")}</span>
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
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 700 }}>{s.name || 'Welcome'}</span>
                {hasCertifiedBadge && (
                  <span style={{ background: `${C.gold}20`, color: C.gold, padding: "2px 10px", fontSize: 9, fontWeight: 700, borderRadius: 999, border: `1px solid ${C.gold}40`, display: "flex", alignItems: "center", gap: 4 }}>
                    <Award size={10} strokeWidth={1.5} /> {T("badge_certified")}
                  </span>
                )}
                {hasTopPerformerBadge && (
                  <span style={{ background: `${C.red}20`, color: C.red, padding: "2px 10px", fontSize: 9, fontWeight: 700, borderRadius: 999, border: `1px solid ${C.red}40`, display: "flex", alignItems: "center", gap: 4 }}>
                    <Star size={10} strokeWidth={1.5} /> {T("badge_top_performer")}
                  </span>
                )}
              </div>
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

        {/* Practice Performance — Goals vs Actuals */}
        {isOwnerOrManager && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 800, display: "flex", alignItems: "center", gap: 10 }}>
                <TrendingUp size={18} strokeWidth={1.5} color={C.teal} /> {T("practice_performance")}
              </div>
              {!editingGoals && (
                <button onClick={startEditGoals}
                  style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.glassBorder}`, color: C.ash, padding: "6px 14px", fontSize: 11, cursor: "pointer", fontFamily: C.fn, borderRadius: C.radiusXs, display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.teal}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.glassBorder}>
                  <Pencil size={11} strokeWidth={1.5} /> {T("edit_goals")}
                </button>
              )}
            </div>

            {/* Goals Editor */}
            {editingGoals && (
              <div style={{ ...glass, padding: "20px 24px", marginBottom: 16, boxShadow: C.glow(C.teal, 0.12), border: `1px solid ${C.teal}30` }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 14, alignItems: "end" }}>
                  <div>
                    <label style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, marginBottom: 6, display: "block" }}>{T("case_goal")}</label>
                    <input type="number" value={editCaseGoal} onChange={e => setEditCaseGoal(+e.target.value)}
                      style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.teal}40`, color: C.white, padding: "10px 14px", fontSize: 18, fontWeight: 700, fontFamily: C.fn, outline: "none", borderRadius: C.radiusXs, textAlign: "center" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, marginBottom: 6, display: "block" }}>{T("price_per_case")}</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.ash, fontSize: 14, fontWeight: 600 }}>$</span>
                      <input type="number" value={editPricePerCase} onChange={e => setEditPricePerCase(+e.target.value)}
                        style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.gold}40`, color: C.white, padding: "10px 14px 10px 26px", fontSize: 18, fontWeight: 700, fontFamily: C.fn, outline: "none", borderRadius: C.radiusXs, textAlign: "center" }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "center", padding: "0 8px" }}>
                    <div style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, marginBottom: 6 }}>{T("auto_calculated")}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: C.gold, lineHeight: 1.2 }}>= ${(editCaseGoal * editPricePerCase).toLocaleString()}</div>
                    <div style={{ fontSize: 9, color: C.ash, marginTop: 2 }}>{T("monthly_target")}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button onClick={handleSaveGoals}
                      style={{ background: C.gradTeal, color: C.white, border: "none", padding: "10px 18px", fontSize: 11, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusXs, display: "flex", alignItems: "center", gap: 5 }}>
                      <Save size={12} strokeWidth={2} /> {T("save")}
                    </button>
                    <button onClick={() => setEditingGoals(false)}
                      style={{ background: "transparent", color: C.ash, border: `1px solid ${C.glassBorder}`, padding: "8px 14px", fontSize: 11, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusXs }}>
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Goals KPI Cards */}
            {(practiceGoals || cases.length > 0) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
              <div style={{ ...glass, padding: "22px 18px", position: "relative", overflow: "hidden", boxShadow: C.glow(C.teal, 0.06) }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: C.gradTeal }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Briefcase size={14} strokeWidth={1.5} color={C.teal} />
                  <span style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>{T("cases_this_month")}</span>
                </div>
                <div style={{ fontSize: 36, fontWeight: 800, color: C.teal, lineHeight: 1 }}>{convertedCases.length}</div>
                {monthlyGoal > 0 && (
                  <>
                    <div style={{ fontSize: 11, color: C.ash, marginTop: 6 }}>{T("goal_label")}: {monthlyGoal}</div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 999, marginTop: 8 }}>
                      <div style={{ height: "100%", width: `${Math.min((convertedCases.length / monthlyGoal) * 100, 100)}%`, background: C.teal, borderRadius: 999, transition: "width 0.5s" }} />
                    </div>
                  </>
                )}
              </div>
              <div style={{ ...glass, padding: "22px 18px", position: "relative", overflow: "hidden", boxShadow: C.glow(C.gold, 0.06) }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: C.gradGold }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <DollarSign size={14} strokeWidth={1.5} color={C.gold} />
                  <span style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>{T("revenue_actual")}</span>
                </div>
                <div style={{ fontSize: 36, fontWeight: 800, color: C.gold, lineHeight: 1 }}>${totalCaseRevenue.toLocaleString()}</div>
                {revenueGoal > 0 && (
                  <>
                    <div style={{ fontSize: 11, color: C.ash, marginTop: 6 }}>{T("goal_label")}: ${revenueGoal.toLocaleString()}</div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 999, marginTop: 8 }}>
                      <div style={{ height: "100%", width: `${Math.min((totalCaseRevenue / revenueGoal) * 100, 100)}%`, background: C.gold, borderRadius: 999, transition: "width 0.5s" }} />
                    </div>
                  </>
                )}
              </div>
              <div style={{ ...glass, padding: "22px 18px", position: "relative", overflow: "hidden", boxShadow: C.glow(C.gold, 0.04) }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.gold}, ${C.green})` }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Clock size={14} strokeWidth={1.5} color={C.gold} />
                  <span style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>{T("follow_ups")}</span>
                </div>
                <div style={{ fontSize: 36, fontWeight: 800, color: C.gold, lineHeight: 1 }}>{cases.filter(c => c.status === 'follow_up').length}</div>
                <div style={{ fontSize: 11, color: C.ash, marginTop: 6 }}>{T("needs_attention")}</div>
              </div>
              <div style={{ ...glass, padding: "22px 18px", position: "relative", overflow: "hidden", boxShadow: C.glow(C.red, 0.04) }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: C.gradRed }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <XCircle size={14} strokeWidth={1.5} color={C.red} />
                  <span style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>{T("rejected_cases")}</span>
                </div>
                <div style={{ fontSize: 36, fontWeight: 800, color: C.red, lineHeight: 1 }}>{cases.filter(c => c.status === 'rejected').length}</div>
                <div style={{ fontSize: 11, color: C.ash, marginTop: 6 }}>{T("this_month")}</div>
              </div>
            </div>
            )}
          </div>
        )}

        {/* KPI Cards */}
        <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
          {kpiCard(T("kpi_training_progress"), `${pr}%`, `${dN} ${T("kpi_of_total").replace("{n}", String(myM.length))}`, C.teal, C.gradTeal)}
          {kpiCard(T("kpi_xp_earned"), s.xp, T("kpi_experience_points"), C.gold, C.gradGold)}
          {kpiCard(T("kpi_modules_done"), dN, T("kpi_of_total").replace("{n}", String(myM.length)), C.blue, C.gradBlue)}
          <div onClick={() => { u({ phase: "simulation" }); scrollTop(); }} style={{ cursor: "pointer", flex: 1, minWidth: 120 }}>
            {kpiCard(T("kpi_ai_simulations"), `${s.simP}/3`, T("kpi_patient_encounters"), C.red, C.gradRed)}
          </div>
        </div>

        {/* Knowledge Score + Recommendations Row */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, marginBottom: 28 }}>
          {/* Knowledge Score Gauge */}
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
            {avgSimScore !== null && (
              <div style={{ marginTop: 10, fontSize: 10, color: C.ash, textAlign: "center" }}>
                {T("avg_sim_score")}: <span style={{ color: C.gold, fontWeight: 700 }}>{avgSimScore}</span>
              </div>
            )}
          </div>

          {/* Training Recommendations */}
          <div style={{ ...glass, padding: 24, overflow: "hidden" }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Target size={16} strokeWidth={1.5} color={C.teal} /> {T("training_recommendations")}
              {simReviews.length > 0 && (
                <span style={{ fontSize: 9, color: C.teal, background: `${C.teal}15`, padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>
                  {T("sim_driven")}
                </span>
              )}
            </div>
            {recommendations.length === 0 ? (
              <div style={{ fontSize: 12, color: C.ash, textAlign: "center", padding: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <CheckCircle2 size={14} strokeWidth={1.5} color={C.green} /> {T("all_complete")}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recommendations.map((rec, i) => (
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
              <BarChart3 size={16} strokeWidth={1.5} color={C.teal} /> {T("areas_to_improve")}
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

        {/* Charts Row */}
        <div style={{ display: "grid", gridTemplateColumns: staffChartData.length > 0 ? "1fr 1fr" : "1fr", gap: 16, marginBottom: 28 }}>
          <div style={{ ...glass, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 18, color: C.white, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.teal }} /> {T("modules_by_phase")}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={phaseChartData} barSize={14}>
                <XAxis dataKey="name" tick={{ fill: C.ash, fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.ash, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} wrapperStyle={{ outline: 'none' }} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="done" stackId="a" fill={C.teal} radius={[0, 0, 0, 0]} name={T("done_label")} />
                <Bar dataKey="remaining" stackId="a" fill="rgba(255,255,255,0.06)" radius={[4, 4, 0, 0]} name={T("remaining_label")} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ ...glass, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 18, color: C.white, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold }} />
              {staffChartData.length > 1 ? T("staff_training_progress") : T("overall_completion")}
            </div>
            {staffChartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={staffChartData} barSize={18} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: C.ash, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: C.ash, fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip contentStyle={tooltipStyle} wrapperStyle={{ outline: 'none' }} cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="progress" fill={C.teal} radius={[0, 6, 6, 0]} name={T("progress_pct")} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ position: "relative", width: 180, height: 180, margin: "0 auto" }}>
                <PieChart width={180} height={180}>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={58} outerRadius={78} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                  <div style={{ fontSize: 30, fontWeight: 800, color: C.teal }}>{pr}%</div>
                  <div style={{ fontSize: 10, color: C.ash, letterSpacing: 2, textTransform: "uppercase" }}>{T("complete_label")}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Case Pipeline — Owner/Manager */}
        {isOwnerOrManager && (
          <div style={{ ...glass, marginBottom: 28, overflow: "hidden" }}>
            <div style={{ padding: "18px 22px", fontSize: 14, fontWeight: 700, borderBottom: `1px solid ${C.glassBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Briefcase size={16} strokeWidth={1.5} color={C.teal} /> {T("case_pipeline")}
              </span>
              <button onClick={() => setShowAddCase(!showAddCase)}
                style={{ background: C.gradTeal, color: C.white, border: "none", padding: "6px 14px", fontSize: 11, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusXs, display: "flex", alignItems: "center", gap: 4 }}>
                <Plus size={12} strokeWidth={2} /> {T("add_case")}
              </button>
            </div>

            {/* Add case form */}
            {showAddCase && (
              <div style={{ padding: "16px 22px", borderBottom: `1px solid ${C.glassBorder}`, background: "rgba(255,255,255,0.02)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <input value={newCase.patient_name} onChange={e => setNewCase({ ...newCase, patient_name: e.target.value })} placeholder={T("patient_name")}
                    style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.glassBorder}`, color: C.white, padding: "8px 12px", fontSize: 12, fontFamily: C.fn, outline: "none", borderRadius: C.radiusXs }} />
                  <select value={newCase.status} onChange={e => setNewCase({ ...newCase, status: e.target.value })}
                    style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.glassBorder}`, color: C.white, padding: "8px 12px", fontSize: 12, fontFamily: C.fn, outline: "none", borderRadius: C.radiusXs }}>
                    <option value="pending" style={{ background: C.dark2, color: C.white }}>{T("status_pending")}</option>
                    <option value="follow_up" style={{ background: C.dark2, color: C.white }}>{T("status_follow_up")}</option>
                    <option value="converted" style={{ background: C.dark2, color: C.white }}>{T("status_converted")}</option>
                    <option value="rejected" style={{ background: C.dark2, color: C.white }}>{T("status_rejected")}</option>
                  </select>
                  <input type="number" value={newCase.case_value} onChange={e => setNewCase({ ...newCase, case_value: +e.target.value })} placeholder={T("case_value")}
                    style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.glassBorder}`, color: C.white, padding: "8px 12px", fontSize: 12, fontFamily: C.fn, outline: "none", borderRadius: C.radiusXs }} />
                  <button onClick={handleAddCase} disabled={!newCase.patient_name}
                    style={{ background: newCase.patient_name ? C.gradTeal : "rgba(255,255,255,0.05)", color: C.white, border: "none", padding: "8px 14px", fontSize: 12, fontWeight: 700, fontFamily: C.fn, cursor: newCase.patient_name ? "pointer" : "not-allowed", borderRadius: C.radiusXs }}>
                    {T("save")}
                  </button>
                </div>
                <input value={newCase.notes} onChange={e => setNewCase({ ...newCase, notes: e.target.value })} placeholder={T("case_notes")}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.glassBorder}`, color: C.white, padding: "8px 12px", fontSize: 12, fontFamily: C.fn, outline: "none", borderRadius: C.radiusXs }} />
              </div>
            )}

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.glassBorder}` }}>
              {[
                { id: 'all', label: T("all"), count: cases.length },
                { id: 'follow_up', label: T("status_follow_up"), count: cases.filter(c => c.status === 'follow_up').length },
                { id: 'converted', label: T("status_converted"), count: convertedCases.length },
                { id: 'rejected', label: T("status_rejected"), count: cases.filter(c => c.status === 'rejected').length },
                { id: 'pending', label: T("status_pending"), count: cases.filter(c => c.status === 'pending').length },
              ].map(tab => (
                <button key={tab.id} onClick={() => setCaseFilter(tab.id)}
                  style={{ padding: "10px 16px", fontSize: 11, fontWeight: caseFilter === tab.id ? 700 : 400, color: caseFilter === tab.id ? C.teal : C.ash, background: "transparent", border: "none", borderBottom: caseFilter === tab.id ? `2px solid ${C.teal}` : "2px solid transparent", cursor: "pointer", fontFamily: C.fn, transition: "all 0.2s", display: "flex", gap: 4, alignItems: "center" }}>
                  {tab.label} <span style={{ fontSize: 9, background: "rgba(255,255,255,0.06)", padding: "1px 6px", borderRadius: 999 }}>{tab.count}</span>
                </button>
              ))}
            </div>

            {/* Case list */}
            {filteredCases.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", fontSize: 12, color: C.ash }}>{T("no_cases")}</div>
            ) : (
              filteredCases.slice(0, 10).map(c => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 22px", borderBottom: `1px solid ${C.glassBorder}`, transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  {caseStatusIcon(c.status)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{c.patient_name}</div>
                    {c.notes && <div style={{ fontSize: 10, color: C.ash, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.notes}</div>}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.gold }}>{c.case_value > 0 ? `$${Number(c.case_value).toLocaleString()}` : ''}</span>
                  <select value={c.status} onChange={e => handleUpdateCaseStatus(c.id, e.target.value)}
                    style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.glassBorder}`, color: caseStatusColor(c.status), padding: "4px 8px", fontSize: 10, fontFamily: C.fn, outline: "none", borderRadius: C.radiusXs, fontWeight: 700 }}>
                    <option value="pending" style={{ background: C.dark2, color: C.white }}>{T("status_pending")}</option>
                    <option value="follow_up" style={{ background: C.dark2, color: C.white }}>{T("status_follow_up")}</option>
                    <option value="converted" style={{ background: C.dark2, color: C.white }}>{T("status_converted")}</option>
                    <option value="rejected" style={{ background: C.dark2, color: C.white }}>{T("status_rejected")}</option>
                  </select>
                </div>
              ))
            )}
          </div>
        )}

        {/* Case Analytics Charts */}
        {isOwnerOrManager && caseAnalyticsData.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
            <div style={{ ...glass, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.teal }} /> {T("conversion_rate")}
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={caseAnalyticsData}>
                  <defs>
                    <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.teal} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.teal} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: C.ash, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.ash, fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} wrapperStyle={{ outline: 'none' }} formatter={(v: number) => [`${v}%`, T("conversion_rate")]} />
                  <Area type="monotone" dataKey="conversionRate" stroke={C.teal} fill="url(#convGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ ...glass, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold }} /> {T("revenue_trend")}
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={caseAnalyticsData} barSize={20}>
                  <XAxis dataKey="month" tick={{ fill: C.ash, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.ash, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} wrapperStyle={{ outline: 'none' }} formatter={(v: number) => [`$${v.toLocaleString()}`, T("revenue_label")]} />
                  <Bar dataKey="revenue" fill={C.gold} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}


        {(allComplete || s.signed) && (
          <div style={{ ...glass, padding: 22, marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <FileText size={20} strokeWidth={1.5} color={C.gold} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{T("view_report")}</div>
                <div style={{ fontSize: 10, color: C.ash }}>{s.signed ? T("report_signed") : T("report_ready")}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { u({ phase: "report" }); scrollTop(); }}
                style={{ background: C.gradGold, color: C.dark, border: "none", padding: "10px 20px", fontSize: 12, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusSm }}>
                {T("view_report")}
              </button>
              {s.signed && (
                <button onClick={() => { u({ phase: "report" }); scrollTop(); setTimeout(() => window.print(), 500); }}
                  style={{ background: "rgba(255,255,255,0.05)", color: C.ash, border: `1px solid ${C.glassBorder}`, padding: "10px 20px", fontSize: 12, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusSm, display: "flex", alignItems: "center", gap: 6 }}>
                  <Printer size={12} strokeWidth={1.5} /> {T("print_report")}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Completion Banners */}
        {allComplete && !s.signed && (
          <div style={{ ...glass, padding: 28, textAlign: "center", marginBottom: 24, boxShadow: C.glow(C.gold, 0.15), borderColor: `${C.gold}30` }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.gold, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Trophy size={22} strokeWidth={1.5} /> {T("all_complete")}
            </div>
            <button onClick={() => { u({ phase: "report" }); scrollTop(); }}
              style={{ background: C.gradRed, color: "#fff", border: "none", padding: "14px 32px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusSm, boxShadow: C.glow(C.red, 0.3) }}>
              {T("complete_onboarding")}
            </button>
          </div>
        )}

        {allModsDone && !allComplete && (
          <button onClick={() => { u({ phase: "simulation" }); scrollTop(); }}
            style={{ background: C.gradTeal, color: C.white, padding: 18, textAlign: "center", marginBottom: 24, fontSize: 14, fontWeight: 700, borderRadius: C.radius, boxShadow: C.glow(C.teal, 0.25), width: "100%", border: "none", cursor: "pointer", fontFamily: C.fn, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.3s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = C.glow(C.teal, 0.4); }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = C.glow(C.teal, 0.25); }}>
            {T("training_complete")} <ArrowRight size={16} strokeWidth={2} />
          </button>
        )}

        {/* Training Modules Accordion */}
        <div style={{ ...glass, marginBottom: 24, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", fontSize: 14, fontWeight: 700, borderBottom: `1px solid ${C.glassBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ClipboardList size={16} strokeWidth={1.5} color={C.teal} /> {T("training_modules_label")}
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
                  <ChevronRight size={14} strokeWidth={1.5} color={C.ash} style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.25s" }} />
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
                      <ArrowRight size={12} strokeWidth={1.5} color={C.ash} style={{ opacity: 0.5 }} />
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
            <ArrowRight size={12} strokeWidth={1.5} color={C.ash} style={{ opacity: 0.5 }} />
          </div>
        </div>

        {/* Revenue Calculator — Owner/Manager only */}
        {isOwnerOrManager && (
          <div style={{ ...glass, padding: 28, marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: C.radiusSm, background: C.gradGold, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <DollarSign size={16} strokeWidth={1.5} color={C.dark} />
              </div>
               {T("revenue_calculator")}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 24 }}>
              {[
                { label: T("patients_per_month"), value: revPatients, min: 50, max: 800, step: 1, set: setRevPatients, color: C.teal, format: (v: number) => `${v}` },
                { label: T("avg_case_price"), value: revPrice, min: 500, max: 5000, step: 100, set: setRevPrice, color: C.gold, format: (v: number) => `$${v.toLocaleString()}` },
                { label: T("current_close_rate"), value: revClose, min: 5, max: 60, step: 1, set: setRevClose, color: C.red, format: (v: number) => `${v}%` },
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
                <div style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>{T("current_monthly")}</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: C.ash }}>${currentRev.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: C.slate, marginTop: 4 }}>{revClose}% {T("close_rate")}</div>
              </div>
              <div style={{ background: `rgba(20,184,166,0.06)`, padding: 22, textAlign: "center", borderRadius: C.radiusSm, border: `1px solid ${C.teal}25`, boxShadow: C.glow(C.teal, 0.08) }}>
                <div style={{ fontSize: 10, color: C.teal, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>{T("with_bytesense")}</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: C.teal }}>${projectedRev.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: C.teal, marginTop: 4 }}>{projectedClose.toFixed(0)}% {T("projected_close")}</div>
              </div>
            </div>
            <div style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: C.gold, fontWeight: 700 }}>
              +${(projectedRev - currentRev).toLocaleString()}/mo · ${((projectedRev - currentRev) * 12).toLocaleString()}/yr {T("potential_uplift")}
            </div>
          </div>
        )}

        {/* Goals & Notes Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div style={{ ...glass, padding: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <Target size={14} strokeWidth={1.5} color={C.teal} /> {T("goals_label")}
            </div>
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
              <input value={newGoal} onChange={e => setNewGoal(e.target.value)} placeholder={T("add_goal_placeholder")}
                onKeyDown={e => { if (e.key === 'Enter' && newGoal.trim()) { setGoals([...goals, { text: newGoal.trim(), done: false }]); setNewGoal(''); } }}
                style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.glassBorder}`, color: C.white, padding: "8px 12px", fontSize: 12, fontFamily: C.fn, outline: "none", borderRadius: C.radiusXs }} />
              <button onClick={() => { if (newGoal.trim()) { setGoals([...goals, { text: newGoal.trim(), done: false }]); setNewGoal(''); } }}
                style={{ background: C.gradTeal, color: C.white, border: "none", padding: "8px 14px", fontSize: 12, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusXs }}>+</button>
            </div>
          </div>

          <div style={{ ...glass, padding: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <StickyNote size={14} strokeWidth={1.5} color={C.gold} /> {T("notes_label")}
            </div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={T("notes_placeholder")}
              style={{ width: "100%", minHeight: 160, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.glassBorder}`, color: C.white, padding: 14, fontSize: 12, fontFamily: C.fn, outline: "none", resize: "vertical", lineHeight: 1.8, borderRadius: C.radiusSm }} />
          </div>
        </div>

        {/* Quick Tools */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Zap size={14} strokeWidth={1.5} color={C.teal} /> {T("quick_tools")}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
            {[
              { mode: "followup", Icon: Mail, label: T("patient_followup"), desc: T("followup_desc"), color: C.teal },
              { mode: "treatment", Icon: ClipboardList, label: T("treatment_plan"), desc: T("treatment_desc"), color: C.blue },
              { mode: "objections", Icon: Shield, label: T("handle_objections"), desc: T("objections_desc"), color: C.violet },
              { mode: "educational", Icon: BookOpen, label: T("educational_material"), desc: T("educational_desc"), color: C.gold },
            ].map(tool => (
              <div key={tool.mode} onClick={() => openCoach(tool.mode)}
                style={{ ...glass, padding: "18px 14px", cursor: "pointer", transition: "all 0.3s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${tool.color}40`; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = C.glow(tool.color, 0.12); }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.glassBorder; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ width: 36, height: 36, borderRadius: C.radiusSm, background: `${tool.color}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <tool.Icon size={18} strokeWidth={1.5} color={tool.color} />
                </div>
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
            <button onClick={() => setShowBooking(true)}
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
    </div>
  );
}
