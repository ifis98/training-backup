import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { C, PH, Role, Phase, ROLES } from '@/data/constants';
import { Module } from '@/data/constants';
import { scrollTop, computeKnowledgeScore, getScoreLabel, getScoreColor, getRecommendations, getImprovementAreas, getBlockerFirstModuleIds } from '@/lib/helpers';
import { AppState } from '@/hooks/useAppState';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { t, Lang, LANG_OPTIONS } from '@/data/translations';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Tooltip } from 'recharts';
import BookingModal from '@/components/BookingModal';
import { Target, BarChart3, ClipboardList, StickyNote, Zap, DollarSign, FileText, Trophy, Mail, Shield, BookOpen, Award, Star, ChevronRight, Printer, TrendingUp, TrendingDown, Plus, Briefcase, CheckCircle2, Clock, XCircle, ArrowRight, Pencil, Save, Menu, X, LogOut, Settings, Phone, MessageSquare } from 'lucide-react';

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
  onOpenSettings: () => void;
  onSignOut: () => void;
  onOpenPanel?: (src: string, title: string) => void;
}

const CHART_COLORS = [C.teal, C.red, C.gold, C.blue, C.violet, C.cyan, C.green, C.rose, C.amber];

const glass = {
  background: "var(--bs-card)",
  border: "1px solid var(--bs-border)",
  borderRadius: 14,
  boxShadow: "0 10px 28px -10px rgba(0,0,0,0.25)",
} as React.CSSProperties;

const glassHover = (e: React.MouseEvent<HTMLDivElement>, enter: boolean) => {
  e.currentTarget.style.borderColor = enter ? C.glassHover : C.glassBorder;
  e.currentTarget.style.transform = enter ? "translateY(-2px)" : "translateY(0)";
};


export default function Dashboard({ s, u, sRoles, myPH, myM, dN, pr, allD, reset, openCoach, onOpenSettings, onSignOut, onOpenPanel }: DashboardProps) {
  const isMobile = useIsMobile();
  const { user: clerkUser } = useUser();
  const displayName = clerkUser?.firstName || clerkUser?.fullName || s.name || '';
  const allModsDone = dN === myM.length && myM.length > 0;
  const allComplete = allModsDone && s.simP >= 3;
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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
    if (practiceGoals) {
      localStorage.setItem('bsa6_practice_goals', JSON.stringify(practiceGoals));
    } else {
      localStorage.removeItem('bsa6_practice_goals');
    }
  }, [practiceGoals]);

  useEffect(() => {
    try {
      const savedGoals = localStorage.getItem('bsa6_practice_goals');
      if (savedGoals) setPracticeGoals(JSON.parse(savedGoals));
    } catch {}

    const clerkUserId = clerkUser?.id;
    if (!clerkUserId) return;

    const load = async () => {
      try {
        const { data: casesData } = await supabase
          .from('cases').select('*')
          .eq('clerk_user_id', clerkUserId)
          .order('created_at', { ascending: false });
        if (casesData) setCases(casesData);

        const { data: goalsData } = await supabase
          .from('practice_goals').select('*')
          .eq('clerk_user_id', clerkUserId)
          .maybeSingle();
        if (goalsData) setPracticeGoals(goalsData);
      } catch {}
    };
    load();
  }, [clerkUser?.id]);

  // Load simulation reviews
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
      if (error) { toast.error('Failed to add case'); return; }
      if (data) {
        setCases([data, ...cases]);
        setNewCase({ patient_name: '', status: 'pending', case_value: 0, notes: '' });
        setShowAddCase(false);
      }
    } catch { toast.error('Failed to add case'); }
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

  const handleSaveGoals = async () => {
    const autoRevenue = editCaseGoal * editPricePerCase;
    const clerkUserId = clerkUser?.id;
    const localGoals = {
      clerk_user_id: clerkUserId || 'local',
      monthly_case_goal: editCaseGoal,
      monthly_revenue_goal: autoRevenue,
      price_per_case: editPricePerCase,
    };

    if (!clerkUserId) {
      setPracticeGoals(localGoals);
      setEditingGoals(false);
      toast.success(T("goals_saved"));
      return;
    }

    try {
      const { data, error } = await supabase.from('practice_goals').upsert({
        clerk_user_id: clerkUserId,
        monthly_case_goal: editCaseGoal,
        monthly_revenue_goal: autoRevenue,
        price_per_case: editPricePerCase,
      } as any, { onConflict: 'clerk_user_id' }).select().single();
      setPracticeGoals(error ? localGoals : (data || localGoals));
    } catch {
      setPracticeGoals(localGoals);
    }
    setEditingGoals(false);
    toast.success(T("goals_saved"));
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
    { name: 'Remaining', value: Math.max(myM.length - dN, 0), color: "var(--bs-card2)" },
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

  // Simulation-driven recommendations (with intake blocker pinning)
  const recommendations = useMemo(() => {
    // 1. Sim-based recs take highest priority
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

    // 2. Pin blocker module first if not yet done (intake answer)
    const blockerIds = getBlockerFirstModuleIds(s.mainBlocker || '');
    if (blockerIds.length > 0) {
      const pinnedMods: any[] = [];
      for (const id of blockerIds) {
        const mod = myM.find(m => m.id === id && !s.done.includes(m.id));
        if (mod) {
          const ph = myPH.find(p => p.id === mod.phase);
          pinnedMods.push({
            phaseId: mod.phase, phaseLabel: ph?.label || mod.phase, moduleId: mod.id,
            moduleTitle: mod.title, time: mod.time, priority: "high" as const,
            color: ph?.color || "#888", pinned: true,
          });
          if (pinnedMods.length >= 2) break;
        }
      }
      if (pinnedMods.length > 0) {
        const rest = getRecommendations(s.done, myM, myPH, 5)
          .filter(r => !pinnedMods.find(p => p.moduleId === r.moduleId));
        return [...pinnedMods, ...rest].slice(0, 5);
      }
    }

    // 3. Default: first incomplete modules in order
    return getRecommendations(s.done, myM, myPH, 5);
  }, [s.done, s.mainBlocker, myM, myPH, simReviews]);

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
      default: return <Clock size={14} strokeWidth={1.5} color={"var(--bs-ash)"} />;
    }
  };

  const caseStatusColor = (status: string) => {
    switch (status) { case 'converted': return C.green; case 'follow_up': return C.gold; case 'rejected': return C.red; default: return "var(--bs-ash)"; }
  };

  const kpiCard = (label: string, value: string | number, sub: string, color: string) => (
    <div style={{
      background: "var(--bs-card)",
      border: "1px solid var(--bs-border)",
      borderRadius: 12,
      padding: isMobile ? "16px 14px" : "20px 18px",
      position: "relative", overflow: "hidden",
      transition: "all 240ms cubic-bezier(0.2, 0.8, 0.2, 1)",
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}30`; e.currentTarget.style.background = "var(--bs-card)"; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bs-border)"; e.currentTarget.style.background = "var(--bs-card)"; }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div style={{ fontSize: 9, color: "var(--bs-ash)", textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 8, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: isMobile ? 28 : 32, fontWeight: 800, color, lineHeight: 1, letterSpacing: "-0.03em" }}>{value}</div>
      <div style={{ fontSize: 10, color: "var(--bs-ash)", marginTop: 6 }}>{sub}</div>
    </div>
  );

  const tooltipStyle = { background: C.dark2, border: `1px solid var(--bs-border)`, borderRadius: C.radiusSm, fontSize: 12, color: "var(--bs-text)" };

  return (
    <div style={{ fontFamily: C.fn, color: "var(--bs-text)", minHeight: "100vh" }}>
      {/* ── Header ── */}
      <div style={{ background: "rgba(8,8,12,0.96)", backdropFilter: C.blur, WebkitBackdropFilter: C.blur, borderBottom: "1px solid var(--bs-border)", position: "sticky", top: 0, zIndex: 30, color: "#F0F0F4" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: isMobile ? "10px 16px" : "14px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>

            {/* Left: avatar + name + roles */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: isMobile ? 32 : 38, height: isMobile ? 32 : 38, borderRadius: C.radiusSm, background: C.gradTeal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? 14 : 17, fontWeight: 800, flexShrink: 0 }}>
                {(displayName || 'U')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: isMobile ? 14 : 17, fontWeight: 700, lineHeight: 1 }}>{displayName || 'Welcome'}</span>
                  {hasCertifiedBadge && <span style={{ background: `${C.gold}20`, color: C.gold, padding: "1px 7px", fontSize: 9, fontWeight: 700, borderRadius: 999 }}>★ Certified</span>}
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
                  {sRoles.map(r => <span key={r.id} style={{ background: `${r.color}20`, color: r.color, padding: "1px 7px", fontSize: 9, fontWeight: 700, borderRadius: 999 }}>{r.short}</span>)}
                </div>
              </div>
            </div>

            {/* Right: Settings gear (desktop) OR [schedule call + hamburger] (mobile) */}
            {isMobile ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => setShowBooking(true)}
                  style={{ background: "var(--bs-card2)", border: `1px solid var(--bs-border)`, color: "var(--bs-ash)", height: 36, borderRadius: C.radiusXs, display: "flex", alignItems: "center", gap: 6, padding: "0 12px", cursor: "pointer", flexShrink: 0, fontSize: 12, fontWeight: 600, fontFamily: C.fn }}>
                  <Phone size={13} strokeWidth={2} />
                  Schedule Call
                </button>
                <button onClick={() => setShowMobileMenu(true)}
                  style={{ background: "var(--bs-card2)", border: `1px solid var(--bs-border)`, color: "var(--bs-text)", width: 36, height: 36, borderRadius: C.radiusXs, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                  <Menu size={18} strokeWidth={2} />
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => setShowBooking(true)}
                  style={{ background: C.teal, border: "none", color: "#000", height: 36, borderRadius: C.radiusXs, display: "flex", alignItems: "center", gap: 7, padding: "0 14px", cursor: "pointer", flexShrink: 0, fontSize: 12, fontWeight: 700, fontFamily: C.fn, transition: "all 0.15s" }}>
                  <Phone size={13} strokeWidth={2} />
                  Schedule Support Call
                </button>
                <button
                  onClick={() => window.open('https://app.bytesense.ai/api/proxy?url=https://tawk.to/chat/691e1e6b3c3c13194fe65a35/1jaeqdl1b', '_blank')}
                  style={{ background: "var(--bs-card)", border: `1px solid var(--bs-border)`, color: "#FFFFFF", width: 36, height: 36, borderRadius: C.radiusXs, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.15s" }}
                  title="Live Chat Support"
                >
                  <MessageSquare size={17} strokeWidth={1.5} />
                </button>
                <button onClick={onOpenSettings}
                  style={{ background: "var(--bs-card)", border: `1px solid var(--bs-border)`, color: "var(--bs-ash)", width: 36, height: 36, borderRadius: C.radiusXs, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.15s" }}
                  title="Settings"
                >
                  <Settings size={17} strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 10 }}>
            <div style={{ height: 3, background: "var(--bs-card2)", borderRadius: 999 }}>
              <div style={{ height: "100%", width: `${pr}%`, background: C.gradTeal, transition: "width 0.5s", borderRadius: 999 }} />
            </div>
            <div style={{ fontSize: 10, color: "var(--bs-ash)", marginTop: 4 }}>{dN}/{myM.length} {T("sections")} · {pr}% complete</div>
          </div>
        </div>
      </div>

      {/* ── Mobile slide-in menu ── */}
      {isMobile && (
        <>
          {/* Backdrop */}
          <div onClick={() => setShowMobileMenu(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, backdropFilter: "blur(2px)", opacity: showMobileMenu ? 1 : 0, pointerEvents: showMobileMenu ? "auto" : "none", transition: "opacity 0.25s ease" }} />
          {/* Drawer */}
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 280, background: "var(--bs-bg)", backdropFilter: C.blur, WebkitBackdropFilter: C.blur, borderLeft: `1px solid var(--bs-border)`, zIndex: 201, display: "flex", flexDirection: "column", transform: showMobileMenu ? "translateX(0)" : "translateX(100%)", transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)", boxShadow: showMobileMenu ? "-20px 0 60px var(--bs-shadow)" : "none" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 16px", borderBottom: `1px solid var(--bs-border)`, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: C.gradTeal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, flexShrink: 0 }}>
                  {(displayName || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--bs-text)" }}>{displayName || 'Menu'}</div>
                  <div style={{ fontSize: 10, color: "var(--bs-ash)", marginTop: 1 }}>{s.practice}</div>
                </div>
              </div>
              <button onClick={() => setShowMobileMenu(false)}
                style={{ background: "none", border: "none", color: "var(--bs-ash)", cursor: "pointer", padding: 4 }}>
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            {/* Nav items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              {[
                { label: "Dashboard", action: () => { u({ phase: "dashboard" }); scrollTop(); setShowMobileMenu(false); } },
                { label: "Sales Training", action: () => { u({ phase: 'sales-training' }); scrollTop(); setShowMobileMenu(false); } },
                { label: "Product Experience", action: () => { u({ phase: 'product-experience' }); scrollTop(); setShowMobileMenu(false); } },
                { label: "Office Workflow", action: () => { u({ phase: 'office-workflow' }); scrollTop(); setShowMobileMenu(false); } },
                { label: "Roleplay Simulation", action: () => { u({ phase: "roleplay" }); scrollTop(); setShowMobileMenu(false); } },
                { label: "AI Simulations", action: () => { u({ phase: "simulation" }); scrollTop(); setShowMobileMenu(false); } },
                { label: "AI Coach", action: () => { openCoach("general"); setShowMobileMenu(false); } },
                { label: "Reports & Certificates", disabled: !allComplete && !s.signed, action: () => { u({ phase: "report" }); scrollTop(); setShowMobileMenu(false); } },
                { label: "Contact Support", action: () => { window.location.href = "mailto:support@bytesense.ai"; setShowMobileMenu(false); } },
              ].map((item) => (
                <button key={item.label}
                  onClick={item.disabled ? undefined : item.action}
                  style={{ display: "flex", alignItems: "center", width: "100%", padding: "13px 20px", background: "none", border: "none", borderBottom: `1px solid var(--bs-border)`, color: item.disabled ? "var(--bs-ash)" : "var(--bs-text)", fontSize: 14, fontWeight: 500, cursor: item.disabled ? "not-allowed" : "pointer", fontFamily: C.fn, opacity: item.disabled ? 0.35 : 1, textAlign: "left" as const }}>
                  {item.label}
                </button>
              ))}
            </div>

            {/* Bottom actions */}
            <div style={{ padding: "12px 16px", borderTop: `1px solid var(--bs-border)`, display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
              <button onClick={() => { setShowMobileMenu(false); onOpenSettings(); }}
                style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 16px", background: "var(--bs-card)", border: `1px solid var(--bs-border)`, borderRadius: 8, color: "var(--bs-ash)", fontSize: 14, cursor: "pointer", fontFamily: C.fn }}>
                <Settings size={16} strokeWidth={1.5} /> Settings
              </button>
              <button onClick={() => { onSignOut(); setShowMobileMenu(false); }}
                style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 16px", background: "rgba(204,16,16,0.08)", border: `1px solid rgba(204,16,16,0.2)`, borderRadius: 8, color: "#FF5555", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: C.fn }}>
                <LogOut size={16} strokeWidth={1.5} /> Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: isMobile ? "12px 12px 40px" : "28px 28px 60px" }}>

        {/* ── Next Step Hero ── */}
        {(() => {
          if (allComplete) return null;
          const nextMod = recommendations[0];
          if (allModsDone) {
            return (
              <div onClick={() => { u({ phase: "simulation" }); scrollTop(); }}
                style={{ background: `linear-gradient(135deg, ${C.teal}18, ${C.teal}08)`, border: `1px solid ${C.teal}30`, borderRadius: 14, padding: isMobile ? "16px 16px" : "18px 24px", marginBottom: isMobile ? 16 : 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, transition: "all 240ms cubic-bezier(0.2,0.8,0.2,1)" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${C.teal}60`}
                onMouseLeave={e => e.currentTarget.style.borderColor = `${C.teal}30`}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: C.teal, marginBottom: 4 }}>Next Step</div>
                  <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: "var(--bs-text)" }}>Complete AI Patient Simulations</div>
                  <div style={{ fontSize: 11, color: "var(--bs-ash)", marginTop: 2 }}>{s.simP}/3 completed · Practice your pitch</div>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 999, background: C.teal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ArrowRight size={16} strokeWidth={2.5} color={C.dark} />
                </div>
              </div>
            );
          }
          if (nextMod) {
            return (
              <div onClick={() => { u({ phase: "module", curMod: nextMod.moduleId, ckA: null }); scrollTop(); }}
                style={{ background: `linear-gradient(135deg, ${C.teal}15, transparent)`, border: `1px solid ${C.teal}25`, borderRadius: 14, padding: isMobile ? "16px 16px" : "18px 24px", marginBottom: isMobile ? 16 : 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, transition: "all 240ms cubic-bezier(0.2,0.8,0.2,1)" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${C.teal}50`}
                onMouseLeave={e => e.currentTarget.style.borderColor = `${C.teal}25`}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: C.teal, marginBottom: 4 }}>Continue Training</div>
                  <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: "var(--bs-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nextMod.moduleTitle}</div>
                  <div style={{ fontSize: 11, color: "var(--bs-ash)", marginTop: 2 }}>{nextMod.time} · {pr}% complete</div>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 999, background: C.teal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ArrowRight size={16} strokeWidth={2.5} color={C.dark} />
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Practice Performance — Goals vs Actuals */}
        {(isOwnerOrManager || practiceGoals) && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "var(--bs-ash)", display: "flex", alignItems: "center", gap: 6 }}>
                <TrendingUp size={12} strokeWidth={1.5} color={C.teal} /> {T("practice_performance")}
              </div>
              {!editingGoals && (
                <button onClick={startEditGoals}
                  style={{ background: "var(--bs-card)", border: `1px solid var(--bs-border)`, color: "var(--bs-ash)", padding: "6px 14px", fontSize: 11, cursor: "pointer", fontFamily: C.fn, borderRadius: C.radiusXs, display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.teal}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.glassBorder}>
                  <Pencil size={11} strokeWidth={1.5} /> {T("edit_goals")}
                </button>
              )}
            </div>

            {/* Goals Editor */}
            {editingGoals && (
              <div style={{ ...glass, padding: "20px 24px", marginBottom: 16, boxShadow: C.glow(C.teal, 0.12), border: `1px solid ${C.teal}30` }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 14, alignItems: "end" }}>
                  <div>
                    <label style={{ fontSize: 10, color: "var(--bs-ash)", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, marginBottom: 6, display: "block" }}>{T("case_goal")}</label>
                    <input type="number" value={editCaseGoal} onChange={e => setEditCaseGoal(+e.target.value)}
                      style={{ width: "100%", background: "var(--bs-card2)", border: `1px solid ${C.teal}40`, color: "var(--bs-text)", padding: "10px 14px", fontSize: 18, fontWeight: 700, fontFamily: C.fn, outline: "none", borderRadius: C.radiusXs, textAlign: "center" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: "var(--bs-ash)", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, marginBottom: 6, display: "block" }}>{T("price_per_case")}</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--bs-ash)", fontSize: 14, fontWeight: 600 }}>$</span>
                      <input type="number" value={editPricePerCase} onChange={e => setEditPricePerCase(+e.target.value)}
                        style={{ width: "100%", background: "var(--bs-card2)", border: `1px solid ${C.gold}40`, color: "var(--bs-text)", padding: "10px 14px 10px 26px", fontSize: 18, fontWeight: 700, fontFamily: C.fn, outline: "none", borderRadius: C.radiusXs, textAlign: "center" }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "center", padding: "0 8px" }}>
                    <div style={{ fontSize: 10, color: "var(--bs-ash)", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, marginBottom: 6 }}>{T("auto_calculated")}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: C.gold, lineHeight: 1.2 }}>= ${(editCaseGoal * editPricePerCase).toLocaleString()}</div>
                    <div style={{ fontSize: 9, color: "var(--bs-ash)", marginTop: 2 }}>{T("monthly_target")}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button onClick={handleSaveGoals}
                      style={{ background: C.gradTeal, color: "var(--bs-text)", border: "none", padding: "10px 18px", fontSize: 11, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusXs, display: "flex", alignItems: "center", gap: 5 }}>
                      <Save size={12} strokeWidth={2} /> {T("save")}
                    </button>
                    <button onClick={() => setEditingGoals(false)}
                      style={{ background: "transparent", color: "var(--bs-ash)", border: `1px solid var(--bs-border)`, padding: "8px 14px", fontSize: 11, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusXs }}>
                      ✕
                    </button>
                  </div>
                </div>
                {editCaseGoal > 0 && editPricePerCase > 0 && (
                  <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(20,184,166,0.08)", borderRadius: C.radiusXs, border: `1px solid ${C.teal}30` }}>
                    <p style={{ fontSize: 12, color: C.teal, lineHeight: 1.6, margin: 0 }}>
                      {T("daily_breakdown")
                        .replace("{cpd}", String(Math.ceil(editCaseGoal / 20)))
                        .replace("{price}", `$${editPricePerCase.toLocaleString()}`)
                        .replace("{revenue}", `$${(editCaseGoal * editPricePerCase).toLocaleString()}`)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Goals KPI Cards */}
            {practiceGoals && (practiceGoals as any)?.price_per_case > 0 && !editingGoals && (
              <div style={{ marginBottom: 14, padding: "10px 14px", background: "rgba(20,184,166,0.08)", borderRadius: C.radiusXs, border: `1px solid ${C.teal}30` }}>
                <p style={{ fontSize: 12, color: C.teal, lineHeight: 1.6, margin: 0 }}>
                  {T("daily_breakdown")
                    .replace("{cpd}", String(Math.ceil((practiceGoals?.monthly_case_goal || 0) / 20)))
                    .replace("{price}", `$${((practiceGoals as any)?.price_per_case || 0).toLocaleString()}`)
                    .replace("{revenue}", `$${(practiceGoals?.monthly_revenue_goal || 0).toLocaleString()}`)}
                </p>
              </div>
            )}
            {(practiceGoals || cases.length > 0) && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
              <div style={{ ...glass, padding: "22px 18px", position: "relative", overflow: "hidden", boxShadow: C.glow(C.teal, 0.06) }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: C.gradTeal }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Briefcase size={14} strokeWidth={1.5} color={C.teal} />
                  <span style={{ fontSize: 10, color: "var(--bs-ash)", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>{T("cases_this_month")}</span>
                </div>
                <div style={{ fontSize: 36, fontWeight: 800, color: C.teal, lineHeight: 1 }}>{convertedCases.length}</div>
                {monthlyGoal > 0 && (
                  <>
                    <div style={{ fontSize: 11, color: "var(--bs-ash)", marginTop: 6 }}>{T("goal_label")}: {monthlyGoal}</div>
                    <div style={{ height: 4, background: "var(--bs-card2)", borderRadius: 999, marginTop: 8 }}>
                      <div style={{ height: "100%", width: `${Math.min((convertedCases.length / monthlyGoal) * 100, 100)}%`, background: C.teal, borderRadius: 999, transition: "width 0.5s" }} />
                    </div>
                  </>
                )}
              </div>
              <div style={{ ...glass, padding: "22px 18px", position: "relative", overflow: "hidden", boxShadow: C.glow(C.gold, 0.06) }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: C.gradGold }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <DollarSign size={14} strokeWidth={1.5} color={C.gold} />
                  <span style={{ fontSize: 10, color: "var(--bs-ash)", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>{T("revenue_actual")}</span>
                </div>
                <div style={{ fontSize: 36, fontWeight: 800, color: C.gold, lineHeight: 1 }}>${totalCaseRevenue.toLocaleString()}</div>
                {revenueGoal > 0 && (
                  <>
                    <div style={{ fontSize: 11, color: "var(--bs-ash)", marginTop: 6 }}>{T("goal_label")}: ${revenueGoal.toLocaleString()}</div>
                    <div style={{ height: 4, background: "var(--bs-card2)", borderRadius: 999, marginTop: 8 }}>
                      <div style={{ height: "100%", width: `${Math.min((totalCaseRevenue / revenueGoal) * 100, 100)}%`, background: C.gold, borderRadius: 999, transition: "width 0.5s" }} />
                    </div>
                  </>
                )}
              </div>
              <div style={{ ...glass, padding: "22px 18px", position: "relative", overflow: "hidden", boxShadow: C.glow(C.gold, 0.04) }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.gold}, ${C.green})` }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Clock size={14} strokeWidth={1.5} color={C.gold} />
                  <span style={{ fontSize: 10, color: "var(--bs-ash)", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>{T("follow_ups")}</span>
                </div>
                <div style={{ fontSize: 36, fontWeight: 800, color: C.gold, lineHeight: 1 }}>{cases.filter(c => c.status === 'follow_up').length}</div>
                <div style={{ fontSize: 11, color: "var(--bs-ash)", marginTop: 6 }}>{T("needs_attention")}</div>
              </div>
              <div style={{ ...glass, padding: "22px 18px", position: "relative", overflow: "hidden", boxShadow: C.glow(C.red, 0.04) }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: C.gradRed }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <XCircle size={14} strokeWidth={1.5} color={C.red} />
                  <span style={{ fontSize: 10, color: "var(--bs-ash)", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>{T("rejected_cases")}</span>
                </div>
                <div style={{ fontSize: 36, fontWeight: 800, color: C.red, lineHeight: 1 }}>{cases.filter(c => c.status === 'rejected').length}</div>
                <div style={{ fontSize: 11, color: "var(--bs-ash)", marginTop: 6 }}>{T("this_month")}</div>
              </div>
            </div>
            )}
          </div>
        )}

        {/* KPI Cards — always 2×2 on mobile, 4-col on desktop */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: isMobile ? 10 : 14, marginBottom: isMobile ? 20 : 28 }}>
          {kpiCard(T("kpi_training_progress"), `${pr}%`, `${dN}/${myM.length} ${T("sections")}`, C.teal)}
          {kpiCard(T("kpi_xp_earned"), s.xp, T("kpi_experience_points"), C.gold)}
          {kpiCard(T("kpi_modules_done"), dN, T("kpi_of_total").replace("{n}", String(myM.length)), "#60A5FA")}
          <div onClick={() => { u({ phase: "simulation" }); scrollTop(); }} style={{ cursor: "pointer" }}>
            {kpiCard(T("kpi_ai_simulations"), `${s.simP}/3`, T("kpi_patient_encounters"), C.red)}
          </div>
        </div>

        {/* Knowledge Score + Recommendations Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: isMobile ? 10 : 16, marginBottom: isMobile ? 16 : 28 }}>
          {/* Knowledge Score Gauge */}
          <div style={{ background: "var(--bs-card)", border: "1px solid var(--bs-border)", borderRadius: 14, padding: 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 28px -10px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize: 10, color: "var(--bs-ash)", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 16, fontWeight: 600 }}>{T("knowledge_score")}</div>
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

          {/* Training Recommendations */}
          <div style={{ background: "var(--bs-card)", border: "1px solid var(--bs-border)", borderRadius: 14, padding: 24, overflow: "hidden", boxShadow: "0 10px 28px -10px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "var(--bs-ash)", marginBottom: 18, display: "flex", alignItems: "center", gap: 6 }}>
              <Target size={12} strokeWidth={1.5} color={C.teal} /> {T("training_recommendations")}
              {simReviews.length > 0 && (
                <span style={{ fontSize: 9, color: C.teal, background: `${C.teal}15`, padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>
                  {T("sim_driven")}
                </span>
              )}
              {!simReviews.length && s.mainBlocker && s.mainBlocker !== 'nothing' && (
                <span style={{ fontSize: 9, color: C.gold, background: `${C.gold}15`, padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>
                  personalized
                </span>
              )}
            </div>
            {recommendations.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--bs-ash)", textAlign: "center", padding: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <CheckCircle2 size={14} strokeWidth={1.5} color={C.green} /> {T("all_complete")}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recommendations.map((rec, i) => (
                  <div key={rec.moduleId}
                    onClick={() => { u({ phase: "module", curMod: rec.moduleId, ckA: null }); scrollTop(); }}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: "transparent", borderRadius: 10, cursor: "pointer", border: "1px solid var(--bs-border)", transition: "all 240ms cubic-bezier(0.2, 0.8, 0.2, 1)" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${rec.color}35`; e.currentTarget.style.background = "var(--bs-card)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bs-border)"; e.currentTarget.style.background = "transparent"; }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: rec.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{rec.moduleTitle}</div>
                      <div style={{ fontSize: 10, color: "var(--bs-ash)" }}>{rec.time}</div>
                    </div>
                    {(rec as any).pinned ? (
                      <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 999, fontWeight: 700, color: C.gold, background: `${C.gold}18` }}>
                        start here
                      </span>
                    ) : (
                    <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 999, fontWeight: 700,
                      color: rec.priority === "high" ? C.red : rec.priority === "medium" ? C.gold : "var(--bs-ash)",
                      background: rec.priority === "high" ? `${C.red}15` : rec.priority === "medium" ? `${C.gold}15` : "var(--bs-card)",
                    }}>{T(`priority_${rec.priority}`)}</span>
                    )}
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
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "var(--bs-ash)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
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

        {/* Charts Row */}
        <div style={{ display: "grid", gridTemplateColumns: staffChartData.length > 0 ? "repeat(auto-fit, minmax(280px, 1fr))" : "1fr", gap: 16, marginBottom: 28 }}>
          <div style={{ ...glass, padding: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "var(--bs-ash)", marginBottom: 18, display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.teal }} /> {T("modules_by_phase")}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={phaseChartData} barSize={14}>
                <defs>
                  <linearGradient id="doneGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.teal} stopOpacity={1} />
                    <stop offset="100%" stopColor={C.teal} stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: "var(--bs-ash)", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--bs-ash)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} wrapperStyle={{ outline: 'none' }} cursor={{ fill: 'var(--bs-card)' }} />
                <Bar dataKey="done" stackId="a" fill="url(#doneGrad)" radius={[0, 0, 0, 0]} name={T("done_label")} />
                <Bar dataKey="remaining" stackId="a" fill="var(--bs-card)" radius={[4, 4, 0, 0]} name={T("remaining_label")} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ ...glass, padding: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "var(--bs-ash)", marginBottom: 18, display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold }} />
              {staffChartData.length > 1 ? T("staff_training_progress") : T("overall_completion")}
            </div>
            {staffChartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={staffChartData} barSize={18} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "var(--bs-ash)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: "var(--bs-ash)", fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
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
                  <div style={{ fontSize: 10, color: "var(--bs-ash)", letterSpacing: 2, textTransform: "uppercase" }}>{T("complete_label")}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Case Pipeline — Owner/Manager */}
        {isOwnerOrManager && (
          <div id="section-cases" style={{ ...glass, marginBottom: 28, overflow: "hidden" }}>
            <div style={{ padding: "16px 22px", borderBottom: `1px solid var(--bs-border)`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "var(--bs-ash)", display: "flex", alignItems: "center", gap: 6 }}>
                <Briefcase size={13} strokeWidth={1.5} color={C.teal} /> {T("case_pipeline")}
              </span>
              <button onClick={() => setShowAddCase(!showAddCase)}
                style={{ background: C.gradTeal, color: "var(--bs-text)", border: "none", padding: "6px 14px", fontSize: 11, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusXs, display: "flex", alignItems: "center", gap: 4 }}>
                <Plus size={12} strokeWidth={2} /> {T("add_case")}
              </button>
            </div>

            {/* Add case form */}
            {showAddCase && (
              <div style={{ padding: "16px 22px", borderBottom: `1px solid var(--bs-border)`, background: "var(--bs-card)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 10 }}>
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

            {/* Filter tabs */}
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

            {/* Case list */}
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
        )}

        {/* Case Analytics Charts */}
        {isOwnerOrManager && caseAnalyticsData.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 28 }}>
            <div style={{ ...glass, padding: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "var(--bs-ash)", marginBottom: 18, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.teal }} /> {T("conversion_rate")}
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={caseAnalyticsData}>
                  <defs>
                    <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.teal} stopOpacity={0.45} />
                      <stop offset="100%" stopColor={C.teal} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: "var(--bs-ash)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--bs-ash)", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} wrapperStyle={{ outline: 'none' }} formatter={(v: number) => [`${v}%`, T("conversion_rate")]} />
                  <Area type="monotone" dataKey="conversionRate" stroke={C.teal} fill="url(#convGrad)" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: C.teal }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ ...glass, padding: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "var(--bs-ash)", marginBottom: 18, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold }} /> {T("revenue_trend")}
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={caseAnalyticsData} barSize={20}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.gold} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={C.gold} stopOpacity={0.35} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: "var(--bs-ash)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--bs-ash)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} wrapperStyle={{ outline: 'none' }} formatter={(v: number) => [`$${v.toLocaleString()}`, T("revenue_label")]} />
                  <Bar dataKey="revenue" fill="url(#revGrad)" radius={[4, 4, 0, 0]} />
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
              style={{ background: C.gradTeal, color: "#fff", border: "none", padding: "14px 32px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusSm, boxShadow: C.glow(C.teal, 0.3) }}>
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
        <div id="section-training" style={{ ...glass, marginBottom: isMobile ? 16 : 24, overflow: "hidden" }}>
          <div style={{ padding: "16px 22px", borderBottom: `1px solid var(--bs-border)`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "var(--bs-ash)", display: "flex", alignItems: "center", gap: 6 }}>
              <ClipboardList size={13} strokeWidth={1.5} color={C.teal} /> {T("training_modules_label")}
            </span>
            <span style={{ fontSize: 9, color: "var(--bs-ash)", background: "var(--bs-card2)", padding: "2px 8px", borderRadius: 999 }}>{dN}/{myM.length}</span>
          </div>
          {myPH.map(phase => {
            const pm = myM.filter(m => m.phase === phase.id);
            if (!pm.length) return null;
            const pc = pm.every(m => s.done.includes(m.id));
            const isOpen = expandedPhase === phase.id;
            const phDone = pm.filter(m => s.done.includes(m.id)).length;
            return (
              <div key={phase.id}>
                {phase.id === 'sales'      && <div id="section-sales-training"  style={{ scrollMarginTop: 72 }} />}
                {phase.id === 'operations' && <div id="section-office-workflow"  style={{ scrollMarginTop: 72 }} />}
                <div onClick={() => setExpandedPhase(isOpen ? null : phase.id)}
                  style={{ padding: "14px 22px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", borderBottom: `1px solid var(--bs-border)`, background: isOpen ? "var(--bs-card)" : "transparent", transition: "background 0.2s" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: pc ? C.green : `${phase.color}60`, border: `2px solid ${pc ? C.green : phase.color}`, transition: "all 0.3s" }} />
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
          {/* AI Sim row */}
          <div
            onClick={() => { if (allModsDone) { u({ phase: "simulation" }); scrollTop(); } }}
            style={{ padding: "14px 22px", display: "flex", alignItems: "center", gap: 12, cursor: allModsDone ? "pointer" : "not-allowed", opacity: allModsDone ? 1 : 0.4, transition: "opacity 0.3s" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.simP >= 3 ? C.green : `${C.gold}60`, border: `2px solid ${s.simP >= 3 ? C.green : C.gold}` }} />
            <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{T("ai_patient_sim")}</span>
            <span style={{ fontSize: 10, color: s.simP >= 3 ? C.green : "var(--bs-ash)", background: s.simP >= 3 ? `${C.green}15` : "var(--bs-card)", padding: "2px 8px", borderRadius: 999 }}>{s.simP}/3</span>
            <ArrowRight size={12} strokeWidth={1.5} color={"var(--bs-ash)"} style={{ opacity: 0.5 }} />
          </div>
        </div>

        {/* Revenue Calculator — Owner/Manager only */}
        {isOwnerOrManager && (
          <div style={{ ...glass, padding: 28, marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "var(--bs-ash)", marginBottom: 22, display: "flex", alignItems: "center", gap: 6 }}>
              <DollarSign size={12} strokeWidth={1.5} color={C.gold} />
              {T("revenue_calculator")}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 20, marginBottom: 24 }}>
              {[
                { label: T("patients_per_month"), value: revPatients, min: 50, max: 800, step: 1, set: setRevPatients, color: C.teal, format: (v: number) => `${v}` },
                { label: T("avg_case_price"), value: revPrice, min: 500, max: 5000, step: 100, set: setRevPrice, color: C.gold, format: (v: number) => `$${v.toLocaleString()}` },
                { label: T("current_close_rate"), value: revClose, min: 5, max: 60, step: 1, set: setRevClose, color: C.red, format: (v: number) => `${v}%` },
              ].map((sl, i) => (
                <div key={i}>
                  <label style={{ fontSize: 10, color: "var(--bs-ash)", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>{sl.label}</label>
                  <input type="range" min={sl.min} max={sl.max} step={sl.step} value={sl.value} onChange={e => sl.set(+e.target.value)}
                    style={{ width: "100%", accentColor: sl.color, marginTop: 8, height: 4 }} />
                  <div style={{ fontSize: 22, fontWeight: 800, color: sl.color, marginTop: 6 }}>{sl.format(sl.value)}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              <div style={{ background: "var(--bs-card)", padding: 22, textAlign: "center", borderRadius: C.radiusSm, border: `1px solid var(--bs-border)` }}>
                <div style={{ fontSize: 10, color: "var(--bs-ash)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>{T("current_monthly")}</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: "var(--bs-ash)" }}>${currentRev.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: "var(--bs-ash)", marginTop: 4 }}>{revClose}% {T("close_rate")}</div>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div style={{ ...glass, padding: 22 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "var(--bs-ash)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <Target size={14} strokeWidth={1.5} color={C.teal} /> {T("goals_label")}
            </div>
            {goals.map((g, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid var(--bs-border)` }}>
                <div onClick={() => { const ng = [...goals]; ng[i] = { ...ng[i], done: !ng[i].done }; setGoals(ng); }}
                  style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${g.done ? C.green : "var(--bs-card2)"}`, background: g.done ? C.green : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "var(--bs-text)", flexShrink: 0, transition: "all 0.2s" }}>
                  {g.done ? "✓" : ""}
                </div>
                <span style={{ fontSize: 12, color: g.done ? "var(--bs-ash)" : "var(--bs-text)", textDecoration: g.done ? "line-through" : "none", flex: 1, transition: "all 0.2s" }}>{g.text}</span>
                <span onClick={() => setGoals(goals.filter((_, j) => j !== i))} style={{ cursor: "pointer", color: "var(--bs-ash)", fontSize: 14, opacity: 0.5, transition: "opacity 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = "0.5"}>×</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <input value={newGoal} onChange={e => setNewGoal(e.target.value)} placeholder={T("add_goal_placeholder")}
                onKeyDown={e => { if (e.key === 'Enter' && newGoal.trim()) { setGoals([...goals, { text: newGoal.trim(), done: false }]); setNewGoal(''); } }}
                style={{ flex: 1, background: "var(--bs-card)", border: `1px solid var(--bs-border)`, color: "var(--bs-text)", padding: "8px 12px", fontSize: 12, fontFamily: C.fn, outline: "none", borderRadius: C.radiusXs }} />
              <button onClick={() => { if (newGoal.trim()) { setGoals([...goals, { text: newGoal.trim(), done: false }]); setNewGoal(''); } }}
                style={{ background: C.gradTeal, color: "var(--bs-text)", border: "none", padding: "8px 14px", fontSize: 12, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusXs }}>+</button>
            </div>
          </div>

          <div style={{ ...glass, padding: 22 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "var(--bs-ash)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <StickyNote size={14} strokeWidth={1.5} color={C.gold} /> {T("notes_label")}
            </div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={T("notes_placeholder")}
              style={{ width: "100%", minHeight: 160, background: "var(--bs-card)", border: `1px solid var(--bs-border)`, color: "var(--bs-text)", padding: 14, fontSize: 12, fontFamily: C.fn, outline: "none", resize: "vertical", lineHeight: 1.8, borderRadius: C.radiusSm }} />
          </div>
        </div>

        {/* Quick Tools */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--bs-ash)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <Zap size={12} strokeWidth={1.5} color={C.teal} /> {T("quick_tools")}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            {[
              { mode: "followup", Icon: Mail, label: T("patient_followup"), desc: T("followup_desc"), color: C.teal },
              { mode: "treatment", Icon: ClipboardList, label: T("treatment_plan"), desc: T("treatment_desc"), color: C.blue },
              { mode: "objections", Icon: Shield, label: T("handle_objections"), desc: T("objections_desc"), color: C.violet },
              { mode: "educational", Icon: BookOpen, label: T("educational_material"), desc: T("educational_desc"), color: C.gold },
            ].map(tool => (
              <div key={tool.mode} onClick={() => openCoach(tool.mode)}
                style={{ background: "var(--bs-card)", border: "1px solid var(--bs-border)", borderRadius: 14, padding: "16px 14px", cursor: "pointer", transition: "all 240ms cubic-bezier(0.2,0.8,0.2,1)" }}
                onMouseEnter={e => { e.currentTarget.style.background = `${tool.color}0d`; e.currentTarget.style.borderColor = `${tool.color}30`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--bs-card)"; e.currentTarget.style.borderColor = "var(--bs-border)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${tool.color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <tool.Icon size={16} strokeWidth={1.5} color={tool.color} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--bs-text)", lineHeight: 1.3, marginBottom: 4 }}>{tool.label}</div>
                <div style={{ fontSize: 10, color: "var(--bs-ash)", lineHeight: 1.5 }}>{tool.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Reference */}
        <div style={{ ...glass, padding: "20px 22px", marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "var(--bs-ash)", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.teal }} /> {T("quick_reference")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[T("ref_not_nightguard"), T("ref_sensors"), T("ref_data"), T("ref_never_say"), T("ref_support"), T("ref_tech"), T("ref_lab")].map((ref, i) => (
              <div key={i} style={{ fontSize: 12, color: "var(--bs-ash)", lineHeight: 1.8, paddingLeft: 12, borderLeft: "2px solid var(--bs-card2)" }}>
                {ref}
              </div>
            ))}
          </div>
        </div>

        {/* Support + Reset — single compact row */}
        <div style={{ background: "var(--bs-card)", border: "1px solid var(--bs-card2)", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "var(--bs-ash)", flex: 1, minWidth: 160 }}>{T("need_help")} Book a support call.</span>
          <button onClick={() => setShowBooking(true)}
            style={{ background: C.teal, color: C.dark, border: "none", padding: "8px 16px", fontSize: 11, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: 8 }}>
            {T("schedule_call")}
          </button>
          <button onClick={reset}
            style={{ background: "transparent", color: "var(--bs-card2)", border: "1px solid var(--bs-border)", padding: "8px 16px", fontSize: 11, fontFamily: C.fn, cursor: "pointer", borderRadius: 8, transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.color = C.red; e.currentTarget.style.borderColor = "rgba(204,16,16,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--bs-card2)"; e.currentTarget.style.borderColor = "var(--bs-border)"; }}>
            {T("reset_progress")}
          </button>
        </div>

        <div style={{ textAlign: "center", fontSize: 10, color: "var(--bs-ash)", marginTop: 24, opacity: 0.6 }}>
          {T("confidential")}
        </div>
      </div>
      <BookingModal open={showBooking} onClose={() => setShowBooking(false)} lang={lang}
        userName={s.name || displayName} userEmail={clerkUser?.primaryEmailAddress?.emailAddress || ''} />
    </div>
  );
}
