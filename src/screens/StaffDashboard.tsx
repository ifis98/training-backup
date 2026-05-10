import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { C, Role, Phase } from '@/data/constants';
import { Module } from '@/data/constants';
import { Logo } from '@/components/ByteSenseLogo';
import { scrollTop, computeKnowledgeScore, getScoreLabel, getScoreColor, getRecommendations, getImprovementAreas } from '@/lib/helpers';
import { AppState } from '@/hooks/useAppState';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { t, Lang, LANG_OPTIONS } from '@/data/translations';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import BookingModal from '@/components/BookingModal';
import { Target, BarChart3, ClipboardList, Zap, Mail, Shield, BookOpen, Award, Star, FileText, Trophy, Printer, ChevronRight, ArrowRight, CheckCircle2, Plus, Briefcase, Clock, XCircle, Settings } from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar';
import SettingsModal from '@/components/SettingsModal';

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
  onOpenSettings: () => void;
  onSignOut: () => void;
}

const glass = {
  background: "var(--bs-card)",
  backdropFilter: C.blur,
  WebkitBackdropFilter: C.blur,
  border: `1px solid var(--bs-border)`,
  borderRadius: C.radius,
} as React.CSSProperties;

export default function StaffDashboard({ s, u, sRoles, myPH, myM, dN, pr, allD, reset, openCoach, onOpenSettings, onSignOut }: StaffDashboardProps) {
  const isMobile = useIsMobile();
  const { user: clerkUser } = useUser();
  const allModsDone = dN === myM.length && myM.length > 0;
  const allComplete = allModsDone && s.simP >= 3;
  const [practiceName, setPracticeName] = useState("");
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [simReviews, setSimReviews] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [caseFilter, setCaseFilter] = useState('all');
  const [showAddCase, setShowAddCase] = useState(false);
  const [newCase, setNewCase] = useState({ patient_name: '', status: 'pending', case_value: 0, notes: '' });
  const [showBooking, setShowBooking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [panelSrc, setPanelSrc] = useState<string | null>(null);
  const [panelTitle, setPanelTitle] = useState('');
  const handleSignOut = onSignOut;
  const lang = (s.lang || "en") as Lang;
  const T = (key: string) => t(lang, key);

  useEffect(() => {
    const clerkUserId = clerkUser?.id;
    if (!clerkUserId) return;
    const fetchData = async () => {
      try {
        const { data: casesData } = await supabase.from('cases').select('*')
          .eq('clerk_user_id', clerkUserId).order('created_at', { ascending: false });
        if (casesData) setCases(casesData);
      } catch {}
    };
    fetchData();
  }, [clerkUser?.id]);

  useEffect(() => {
    const clerkUserId = clerkUser?.id;
    if (!clerkUserId) return;
    const loadReviews = async () => {
      try {
        const { data } = await supabase.from('simulation_reviews').select('*')
          .eq('clerk_user_id', clerkUserId).order('created_at', { ascending: false });
        if (data) setSimReviews(data);
      } catch {}
    };
    loadReviews();
  }, [clerkUser?.id]);

  const handleAddCase = async () => {
    const clerkUserId = clerkUser?.id;
    if (!clerkUserId || !newCase.patient_name) return;
    try {
      const { data, error } = await supabase.from('cases').insert({
        clerk_user_id: clerkUserId,
        patient_name: newCase.patient_name,
        status: newCase.status,
        case_value: newCase.case_value,
        notes: newCase.notes,
      } as any).select().single();
      if (!error && data) {
        setCases([data, ...cases]);
        setNewCase({ patient_name: '', status: 'pending', case_value: 0, notes: '' });
        setShowAddCase(false);
      }
    } catch {}
  };

  const handleUpdateCaseStatus = async (caseId: string, newStatus: string) => {
    const { error } = await supabase.from('cases').update({ status: newStatus }).eq('id', caseId);
    if (!error) {
      setCases(cases.map(c => c.id === caseId ? { ...c, status: newStatus } : c));
      if (newStatus === 'follow_up') {
        const caseData = cases.find(c => c.id === caseId);
        if (caseData) {
          supabase.functions.invoke('notify-case-followup', {
            body: { caseId, patientName: caseData.patient_name },
          }).catch(() => {});
        }
      }
    }
  };

  const caseStatusIcon = (status: string) => {
    switch (status) {
      case 'converted': return <CheckCircle2 size={14} strokeWidth={1.5} color={C.green} />;
      case 'follow_up': return <Clock size={14} strokeWidth={1.5} color={C.gold} />;
      case 'rejected': return <XCircle size={14} strokeWidth={1.5} color={C.red} />;
      default: return <Clock size={14} strokeWidth={1.5} color={"var(--bs-ash)"} />;
    }
  };

  const caseStatusColor = (status: string) => {
    switch (status) { case 'converted': return C.green; case 'follow_up': return C.gold; case 'rejected': return C.red; default: return "var(--bs-ash)"; }
  };

  const convertedCases = cases.filter(c => c.status === 'converted');
  const filteredCases = caseFilter === 'all' ? cases : cases.filter(c => c.status === caseFilter);

  const phaseChartData = myPH.map(ph => {
    const pm = myM.filter(m => m.phase === ph.id);
    const done = pm.filter(m => s.done.includes(m.id)).length;
    return { name: ph.label.replace(/Phase \d+ — /, '').substring(0, 12), done, remaining: pm.length - done, total: pm.length };
  }).filter(d => d.total > 0);

  const pieData = [
    { name: 'Completed', value: dN, color: C.teal },
    { name: 'Remaining', value: Math.max(myM.length - dN, 0), color: "var(--bs-card2)" },
  ];

  const tooltipStyle = { background: C.dark2, border: `1px solid var(--bs-border)`, borderRadius: C.radiusSm, fontSize: 12, color: "var(--bs-text)" };

  const knowledgeScore = useMemo(() => computeKnowledgeScore(s.blScore, dN, myM.length, s.simP), [s.blScore, dN, myM.length, s.simP]);
  const scoreColor = getScoreColor(knowledgeScore, { green: C.green, gold: C.gold, red: C.red });
  const scoreLabelKey = getScoreLabel(knowledgeScore);

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

  const hasCertifiedBadge = allComplete && s.signed;
  const hasTopPerformerBadge = s.xp > 600 && s.signed;
  const avgSimScore = simReviews.length > 0 ? Math.round(simReviews.reduce((a, r) => a + r.score, 0) / simReviews.length) : null;

  const kpiCard = (label: string, value: string | number, sub: string, color: string, gradient: string) => (
    <div style={{
      ...glass, padding: "22px 18px", flex: 1, minWidth: 120,
      position: "relative", overflow: "hidden", transition: "all 0.3s",
      boxShadow: C.glow(color, 0.08),
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = C.glow(color, 0.2); e.currentTarget.style.transform = "translateY(-3px)"; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = C.glow(color, 0.08); e.currentTarget.style.transform = "translateY(0)"; }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: gradient, borderRadius: `${C.radius} ${C.radius} 0 0` }} />
      <div style={{ fontSize: 10, color: "var(--bs-ash)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--bs-ash)", marginTop: 6 }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ fontFamily: C.fn, background: `radial-gradient(ellipse at top, var(--bs-bg2), var(--bs-bg))`, minHeight: "100vh", color: "var(--bs-text)", display: "flex" }}>
      <DashboardSidebar s={s} u={u} allD={allD} allComplete={allComplete} openCoach={openCoach} onSignOut={handleSignOut} onOpenSettings={() => setShowSettings(true)} onOpenPanel={(src, title) => { setPanelSrc(src); setPanelTitle(title); }} activePanel={panelSrc} lang={lang} />

      <div style={{ flex: 1, minWidth: 0, paddingBottom: isMobile ? 70 : 0, marginLeft: isMobile ? 0 : "var(--bs-sidebar-w, 220px)", transition: "margin-left 0.3s ease" }}>
      {/* Header */}
      <div style={{ background: "rgba(20,20,28,0.6)", backdropFilter: C.blur, padding: "20px 28px 22px", borderBottom: `1px solid var(--bs-border)`, color: "#F0F0F4" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Logo size={28} light onClick={() => { u({ phase: "dashboard" }); scrollTop(); }} />
              {practiceName && <span style={{ fontSize: 12, color: "var(--bs-ash)", opacity: 0.7 }}>· {practiceName}</span>}
            </div>
            <button onClick={() => setShowSettings(true)}
              style={{ background: "var(--bs-card)", border: `1px solid var(--bs-border)`, color: "var(--bs-ash)", width: 36, height: 36, borderRadius: C.radiusXs, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
              title="Settings">
              <Settings size={17} strokeWidth={1.5} />
            </button>
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
            <div style={{ height: 4, background: "var(--bs-card2)", borderRadius: 999 }}>
              <div style={{ height: "100%", width: `${pr}%`, background: C.gradTeal, transition: "width 0.5s", borderRadius: 999, boxShadow: C.glow(C.teal, 0.3) }} />
            </div>
            <div style={{ fontSize: 10, color: "var(--bs-ash)", marginTop: 5 }}>{dN}/{myM.length} {T("sections")} · {pr}% complete</div>
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

        {/* Knowledge Score + Recommendations */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, marginBottom: 28 }}>
          <div style={{ ...glass, padding: 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 11, color: "var(--bs-ash)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 16, fontWeight: 600 }}>{T("knowledge_score")}</div>
            <div style={{ position: "relative", width: 140, height: 140 }}>
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="58" fill="none" stroke="var(--bs-card2)" strokeWidth="8" />
                <circle cx="70" cy="70" r="58" fill="none" stroke={scoreColor} strokeWidth="8"
                  strokeDasharray={`${(knowledgeScore / 100) * 364.4} 364.4`}
                  strokeLinecap="round" transform="rotate(-90 70 70)"
                  style={{ transition: "stroke-dasharray 0.8s ease", filter: `drop-shadow(0 0 8px ${scoreColor}40)` }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{knowledgeScore}</div>
                <div style={{ fontSize: 10, color: "var(--bs-ash)", marginTop: 4 }}>/100</div>
              </div>
            </div>
            <div style={{ marginTop: 14, padding: "4px 14px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: scoreColor, background: `${scoreColor}15` }}>
              {T(scoreLabelKey)}
            </div>
            {avgSimScore !== null && (
              <div style={{ marginTop: 10, fontSize: 10, color: "var(--bs-ash)", textAlign: "center" }}>
                {T("avg_sim_score")}: <span style={{ color: C.gold, fontWeight: 700 }}>{avgSimScore}</span>
              </div>
            )}
          </div>
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
              <div style={{ fontSize: 12, color: "var(--bs-ash)", textAlign: "center", padding: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <CheckCircle2 size={14} strokeWidth={1.5} color={C.green} /> {T("all_complete")}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recommendations.map(rec => (
                  <div key={rec.moduleId}
                    onClick={() => { u({ phase: "module", curMod: rec.moduleId, ckA: null }); scrollTop(); }}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--bs-card)", borderRadius: C.radiusXs, cursor: "pointer", border: `1px solid var(--bs-border)`, transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${rec.color}40`; e.currentTarget.style.background = "var(--bs-card)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.glassBorder; e.currentTarget.style.background = "var(--bs-card)"; }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: rec.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{rec.moduleTitle}</div>
                      <div style={{ fontSize: 10, color: "var(--bs-ash)" }}>{rec.time}</div>
                    </div>
                    <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 999, fontWeight: 700,
                      color: rec.priority === "high" ? C.red : rec.priority === "medium" ? C.gold : "var(--bs-ash)",
                      background: rec.priority === "high" ? `${C.red}15` : rec.priority === "medium" ? `${C.gold}15` : "var(--bs-card)",
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
                    <div style={{ flex: 1, height: 4, background: "var(--bs-card2)", borderRadius: 999 }}>
                      <div style={{ height: "100%", width: `${area.completion}%`, background: area.color, borderRadius: 999, transition: "width 0.5s" }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: area.color }}>{area.completion}%</span>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--bs-ash)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6, fontWeight: 600 }}>{T("tip_label")}</div>
                  {area.tips.map((tip, i) => (
                    <div key={i} style={{ fontSize: 11, color: "var(--bs-ash)", lineHeight: 1.6, paddingLeft: 10, borderLeft: `2px solid ${area.color}30`, marginBottom: 4 }}>{tip}</div>
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
                <XAxis dataKey="name" tick={{ fill: "var(--bs-ash)", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--bs-ash)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} wrapperStyle={{ outline: 'none' }} cursor={{ fill: 'transparent' }} />
                 <Bar dataKey="done" stackId="a" fill={C.teal} name={T("done_label")} />
                 <Bar dataKey="remaining" stackId="a" fill="var(--bs-card2)" name={T("remaining_label")} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...glass, padding: 24 }}>
             <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
               <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold }} /> {T("completion")}
            </div>
            <div style={{ position: "relative", width: 160, height: 160, margin: "20px auto 0" }}>
              <PieChart width={160} height={160}>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" strokeWidth={0}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.teal }}>{pr}%</div>
                <div style={{ fontSize: 10, color: "var(--bs-ash)", letterSpacing: 2, textTransform: "uppercase" }}>{T("done")}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Report & Certificate Access */}
        {(allComplete || s.signed) && (
          <div style={{ ...glass, padding: 22, marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <FileText size={20} strokeWidth={1.5} color={C.gold} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{T("view_report")}</div>
                <div style={{ fontSize: 10, color: "var(--bs-ash)" }}>{s.signed ? T("report_signed") : T("report_ready")}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { u({ phase: "report" }); scrollTop(); }}
                style={{ background: C.gradGold, color: C.dark, border: "none", padding: "10px 20px", fontSize: 12, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusSm }}>
                {T("view_report")}
              </button>
              {s.signed && (
                <button onClick={() => { u({ phase: "report" }); scrollTop(); setTimeout(() => window.print(), 500); }}
                  style={{ background: "var(--bs-card)", color: "var(--bs-ash)", border: `1px solid var(--bs-border)`, padding: "10px 20px", fontSize: 12, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusSm, display: "flex", alignItems: "center", gap: 6 }}>
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
            style={{ background: C.gradTeal, color: "var(--bs-text)", padding: 18, textAlign: "center", marginBottom: 24, fontSize: 14, fontWeight: 700, borderRadius: C.radius, boxShadow: C.glow(C.teal, 0.25), width: "100%", border: "none", cursor: "pointer", fontFamily: C.fn, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.3s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = C.glow(C.teal, 0.4); }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = C.glow(C.teal, 0.25); }}>
            {T("training_complete")} <ArrowRight size={16} strokeWidth={2} />
          </button>
        )}

        {/* Training Modules Accordion */}
        <div style={{ ...glass, marginBottom: 24, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", fontSize: 14, fontWeight: 700, borderBottom: `1px solid var(--bs-border)`, display: "flex", alignItems: "center", gap: 8 }}>
            <ClipboardList size={16} strokeWidth={1.5} color={C.teal} /> {T("training_modules_label")}
            <span style={{ fontSize: 11, color: "var(--bs-ash)", marginLeft: "auto", background: "var(--bs-card2)", padding: "3px 10px", borderRadius: 999 }}>{dN}/{myM.length}</span>
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
                  style={{ padding: "14px 22px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", borderBottom: `1px solid var(--bs-border)`, background: isOpen ? "var(--bs-card)" : "transparent", transition: "background 0.2s" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: pc ? C.green : `${phase.color}60`, border: `2px solid ${pc ? C.green : phase.color}` }} />
                  <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{phase.label}</span>
                  <span style={{ fontSize: 10, color: pc ? C.green : "var(--bs-ash)", background: pc ? `${C.green}15` : "var(--bs-card)", padding: "2px 8px", borderRadius: 999 }}>{phDone}/{pm.length}</span>
                  <ChevronRight size={14} strokeWidth={1.5} color={"var(--bs-ash)"} style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.25s" }} />
                </div>
                {isOpen && pm.map(mod => {
                  const done = s.done.includes(mod.id);
                  return (
                    <div key={mod.id}
                      onClick={() => { u({ phase: "module", curMod: mod.id, ckA: null }); scrollTop(); }}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 22px 12px 44px", cursor: "pointer", borderBottom: `1px solid var(--bs-border)`, transition: "background 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--bs-card)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${done ? C.green : "var(--bs-card2)"}`, background: done ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 9, color: "var(--bs-text)", transition: "all 0.3s" }}>
                        {done ? "✓" : ""}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{mod.title}</div>
                        <div style={{ fontSize: 10, color: "var(--bs-ash)", marginTop: 1 }}>{mod.time}</div>
                      </div>
                      <ArrowRight size={12} strokeWidth={1.5} color={"var(--bs-ash)"} style={{ opacity: 0.5 }} />
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
            <span style={{ fontSize: 10, color: s.simP >= 3 ? C.green : "var(--bs-ash)", background: s.simP >= 3 ? `${C.green}15` : "var(--bs-card)", padding: "2px 8px", borderRadius: 999 }}>{s.simP}/3</span>
            <ArrowRight size={12} strokeWidth={1.5} color={"var(--bs-ash)"} style={{ opacity: 0.5 }} />
          </div>
        </div>

        {/* Case Pipeline — Staff */}
        <div style={{ ...glass, marginBottom: 28, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", fontSize: 14, fontWeight: 700, borderBottom: `1px solid var(--bs-border)`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Briefcase size={16} strokeWidth={1.5} color={C.teal} /> {T("case_pipeline")}
            </span>
            <button onClick={() => setShowAddCase(!showAddCase)}
              style={{ background: C.gradTeal, color: "var(--bs-text)", border: "none", padding: "6px 14px", fontSize: 11, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusXs, display: "flex", alignItems: "center", gap: 4 }}>
              <Plus size={12} strokeWidth={2} /> {T("add_case")}
            </button>
          </div>
          {showAddCase && (
            <div style={{ padding: "16px 22px", borderBottom: `1px solid var(--bs-border)`, background: "var(--bs-card)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                <input value={newCase.patient_name} onChange={e => setNewCase({ ...newCase, patient_name: e.target.value })} placeholder={T("patient_name")}
                  style={{ background: "var(--bs-card)", border: `1px solid var(--bs-border)`, color: "var(--bs-text)", padding: "8px 12px", fontSize: 12, fontFamily: C.fn, outline: "none", borderRadius: C.radiusXs }} />
                <select value={newCase.status} onChange={e => setNewCase({ ...newCase, status: e.target.value })}
                  style={{ background: "var(--bs-card)", border: `1px solid var(--bs-border)`, color: "var(--bs-text)", padding: "8px 12px", fontSize: 12, fontFamily: C.fn, outline: "none", borderRadius: C.radiusXs }}>
                  <option value="pending" style={{ background: C.dark2, color: "var(--bs-text)" }}>{T("status_pending")}</option>
                  <option value="follow_up" style={{ background: C.dark2, color: "var(--bs-text)" }}>{T("status_follow_up")}</option>
                  <option value="converted" style={{ background: C.dark2, color: "var(--bs-text)" }}>{T("status_converted")}</option>
                  <option value="rejected" style={{ background: C.dark2, color: "var(--bs-text)" }}>{T("status_rejected")}</option>
                </select>
                <input type="number" value={newCase.case_value} onChange={e => setNewCase({ ...newCase, case_value: +e.target.value })} placeholder={T("case_value")}
                  style={{ background: "var(--bs-card)", border: `1px solid var(--bs-border)`, color: "var(--bs-text)", padding: "8px 12px", fontSize: 12, fontFamily: C.fn, outline: "none", borderRadius: C.radiusXs }} />
                <button onClick={handleAddCase} disabled={!newCase.patient_name}
                  style={{ background: newCase.patient_name ? C.gradTeal : "var(--bs-card)", color: "var(--bs-text)", border: "none", padding: "8px 14px", fontSize: 12, fontWeight: 700, fontFamily: C.fn, cursor: newCase.patient_name ? "pointer" : "not-allowed", borderRadius: C.radiusXs }}>
                  {T("save")}
                </button>
              </div>
              <input value={newCase.notes} onChange={e => setNewCase({ ...newCase, notes: e.target.value })} placeholder={T("case_notes")}
                style={{ width: "100%", background: "var(--bs-card)", border: `1px solid var(--bs-border)`, color: "var(--bs-text)", padding: "8px 12px", fontSize: 12, fontFamily: C.fn, outline: "none", borderRadius: C.radiusXs }} />
            </div>
          )}
          <div style={{ display: "flex", gap: 0, borderBottom: `1px solid var(--bs-border)` }}>
            {[
              { id: 'all', label: T("all"), count: cases.length },
              { id: 'follow_up', label: T("status_follow_up"), count: cases.filter(c => c.status === 'follow_up').length },
              { id: 'converted', label: T("status_converted"), count: convertedCases.length },
              { id: 'rejected', label: T("status_rejected"), count: cases.filter(c => c.status === 'rejected').length },
              { id: 'pending', label: T("status_pending"), count: cases.filter(c => c.status === 'pending').length },
            ].map(tab => (
              <button key={tab.id} onClick={() => setCaseFilter(tab.id)}
                style={{ padding: "10px 16px", fontSize: 11, fontWeight: caseFilter === tab.id ? 700 : 400, color: caseFilter === tab.id ? C.teal : "var(--bs-ash)", background: "transparent", border: "none", borderBottom: caseFilter === tab.id ? `2px solid ${C.teal}` : "2px solid transparent", cursor: "pointer", fontFamily: C.fn, transition: "all 0.2s", display: "flex", gap: 4, alignItems: "center" }}>
                {tab.label} <span style={{ fontSize: 9, background: "var(--bs-card2)", padding: "1px 6px", borderRadius: 999 }}>{tab.count}</span>
              </button>
            ))}
          </div>
          {filteredCases.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", fontSize: 12, color: "var(--bs-ash)" }}>{T("no_cases")}</div>
          ) : (
            filteredCases.slice(0, 10).map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 22px", borderBottom: `1px solid var(--bs-border)`, transition: "background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bs-card)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                {caseStatusIcon(c.status)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{c.patient_name}</div>
                  {c.notes && <div style={{ fontSize: 10, color: "var(--bs-ash)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.notes}</div>}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.gold }}>{c.case_value > 0 ? `$${Number(c.case_value).toLocaleString()}` : ''}</span>
                <select value={c.status} onChange={e => handleUpdateCaseStatus(c.id, e.target.value)}
                  style={{ background: "var(--bs-card)", border: `1px solid var(--bs-border)`, color: caseStatusColor(c.status), padding: "4px 8px", fontSize: 10, fontFamily: C.fn, outline: "none", borderRadius: C.radiusXs, fontWeight: 700 }}>
                  <option value="pending" style={{ background: C.dark2, color: "var(--bs-text)" }}>{T("status_pending")}</option>
                  <option value="follow_up" style={{ background: C.dark2, color: "var(--bs-text)" }}>{T("status_follow_up")}</option>
                  <option value="converted" style={{ background: C.dark2, color: "var(--bs-text)" }}>{T("status_converted")}</option>
                  <option value="rejected" style={{ background: C.dark2, color: "var(--bs-text)" }}>{T("status_rejected")}</option>
                </select>
              </div>
            ))
          )}
        </div>

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
                <div style={{ fontSize: 10, color: "var(--bs-ash)", marginTop: 3, lineHeight: 1.5 }}>{tool.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Reference */}
        <div style={{ ...glass, marginBottom: 24, overflow: "hidden" }}>
          <div style={{ background: C.gradRed, color: "var(--bs-text)", padding: "12px 20px", fontSize: 13, fontWeight: 700, borderRadius: `${C.radius} ${C.radius} 0 0` }}>{T("quick_reference")}</div>
          <div style={{ padding: 20, fontSize: 12, color: "var(--bs-ash)", lineHeight: 2 }}>
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
          <button onClick={() => setShowBooking(true)}
            style={{ background: C.gradTeal, color: "#fff", border: "none", padding: "11px 24px", fontSize: 13, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusSm, boxShadow: C.glow(C.teal, 0.2) }}>
            {T("schedule_call")}
          </button>
        </div>

        <div style={{ textAlign: "center", fontSize: 10, color: "var(--bs-ash)", opacity: 0.6 }}>
          {T("confidential")}
        </div>
      </div>
      </div>
      <BookingModal open={showBooking} onClose={() => setShowBooking(false)} lang={lang}
        userName={s.name} userEmail={clerkUser?.primaryEmailAddress?.emailAddress || ''} />
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} s={s} u={u} lang={lang} />
    </div>
  );
}
