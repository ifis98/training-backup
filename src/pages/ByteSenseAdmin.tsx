import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { C } from '@/data/constants';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import {
  LayoutDashboard, KeyRound, Building2, Inbox, Settings, LogOut,
  Search, Copy, Download, ChevronRight, Activity, Trophy, Mail, Shield, X,
  AlertTriangle, LifeBuoy, RefreshCw,
} from 'lucide-react';

interface RegCode {
  id: string; code: string; practice_name: string; rep_name: string;
  status: string; expires_at: string; used_by: string | null; used_at: string | null; created_at: string;
}
interface DemoReq {
  id: string; name: string; email: string; practice_name: string; phone: string;
  message: string; status: string; created_at: string; admin_notes?: string;
  operatories?: number; monthly_patients?: number; guards_per_month?: number;
  guard_price?: number; has_scanner?: boolean; scanner_type?: string; goals?: string[]; practice_size?: string;
}

const glass: React.CSSProperties = {
  background: C.glass, backdropFilter: C.blur, WebkitBackdropFilter: C.blur,
  border: `1px solid ${C.glassBorder}`, borderRadius: C.radius,
};
const tooltipStyle = { background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: C.radiusSm, fontSize: 12 };

const copyToClipboard = (text: string, label = 'Copied') => {
  navigator.clipboard.writeText(text).then(() => toast.success(`${label}: ${text}`)).catch(() => toast.error('Copy failed'));
};

type TabId = 'overview' | 'codes' | 'practices' | 'demos' | 'settings';
type ExtendedTab = TabId | 'alerts' | 'support';

interface AdminAlert {
  id: string; type: string; severity: string; title: string; body: string;
  status: string; practice_id: string | null; target_user_id: string | null;
  assigned_to: string | null; admin_notes: string; next_step: string;
  follow_up_at: string | null; created_at: string; resolved_at: string | null;
}
interface SupportBooking {
  id: string; user_id: string; name: string; email: string;
  booking_date: string; booking_time: string; notes: string;
  status: string; triage_status: string; assigned_to: string | null;
  admin_notes: string; follow_up_at: string | null; created_at: string;
}

export default function ByteSenseAdmin() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const email = (user?.email || '').toLowerCase();
  const SUPER_USERS = ['nbc1079@gmail.com', 'natasha@bytesense.ai', 'majid@bytesense.ai', 'john@bytesense.ai'];
  const appDashboardPath = SUPER_USERS.includes(email) ? '/owner' : '/';
  const [isBSAdmin, setIsBSAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<ExtendedTab>('overview');
  const [globalSearch, setGlobalSearch] = useState('');

  const [codes, setCodes] = useState<RegCode[]>([]);
  const [practices, setPractices] = useState<any[]>([]);
  const [demos, setDemos] = useState<DemoReq[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [bookings, setBookings] = useState<SupportBooking[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<AdminAlert | null>(null);
  const [alertFilter, setAlertFilter] = useState<'all' | 'open' | 'snoozed' | 'resolved'>('open');
  const [runningMonitor, setRunningMonitor] = useState(false);

  // Codes form
  const [newPracticeName, setNewPracticeName] = useState('');
  const [newRepName, setNewRepName] = useState('');
  const [batchCount, setBatchCount] = useState(1);
  const [codeFilter, setCodeFilter] = useState<'all' | 'active' | 'used' | 'expired' | 'revoked'>('all');
  const [codePage, setCodePage] = useState(0);

  // Practices
  const [practiceSearch, setPracticeSearch] = useState('');
  const [expandedPractice, setExpandedPractice] = useState<string | null>(null);

  // Demos
  const [demoFilter, setDemoFilter] = useState<'all' | 'new' | 'contacted' | 'converted' | 'rejected'>('all');
  const [expandedDemo, setExpandedDemo] = useState<string | null>(null);
  const [demoNotes, setDemoNotes] = useState<Record<string, string>>({});

  // Settings
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    (async () => {
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
      const isAdmin = data?.some(r => r.role === 'bytesense_admin') ?? false;
      setIsBSAdmin(isAdmin);
      setChecking(false);
      if (!isAdmin) { toast.error('Access denied'); navigate('/'); }
    })();
  }, [user, authLoading, navigate]);

  const loadData = useCallback(async () => {
    const [codesRes, practicesRes, demosRes, adminRolesRes] = await Promise.all([
      supabase.from('registration_codes').select('*').order('created_at', { ascending: false }),
      supabase.from('practices').select('*, profiles(user_id, full_name, created_at), training_progress(user_id, done_modules, xp, completed_at, updated_at)').order('created_at', { ascending: false }),
      supabase.from('demo_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('user_id').eq('role', 'bytesense_admin'),
    ]);
    if (codesRes.data) setCodes(codesRes.data as RegCode[]);
    if (practicesRes.data) setPractices(practicesRes.data);
    if (demosRes.data) {
      setDemos(demosRes.data as DemoReq[]);
      const notes: Record<string, string> = {};
      (demosRes.data as DemoReq[]).forEach(d => { notes[d.id] = d.admin_notes || ''; });
      setDemoNotes(notes);
    }
    if (adminRolesRes.data) {
      const ids = adminRolesRes.data.map(r => r.user_id);
      if (ids.length) {
        const { data: profs } = await supabase.from('profiles').select('user_id, full_name, created_at').in('user_id', ids);
        setAdmins(profs || []);
      }
    }
  }, []);

  useEffect(() => { if (isBSAdmin) loadData(); }, [isBSAdmin, loadData]);

  const generateCodes = async () => {
    if (!newPracticeName.trim()) { toast.error('Practice name required'); return; }
    try {
      const inserts = Array.from({ length: batchCount }, () => ({ practice_name: newPracticeName.trim(), rep_name: newRepName.trim() }));
      const { error } = await supabase.from('registration_codes').insert(inserts);
      if (error) throw error;
      toast.success(`${batchCount} code(s) generated!`);
      setNewPracticeName(''); setNewRepName(''); setBatchCount(1); loadData();
    } catch (err: any) { toast.error(err.message); }
  };

  const revokeCode = async (id: string) => {
    await supabase.from('registration_codes').update({ status: 'revoked' }).eq('id', id);
    loadData(); toast.success('Code revoked');
  };

  const updateDemoStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('demo_requests').update({ status }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    setDemos(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    toast.success(`Status → ${status}`);
  };

  const saveDemoNotes = async (id: string) => {
    const { error } = await supabase.from('demo_requests').update({ admin_notes: demoNotes[id] || '' }).eq('id', id);
    if (error) toast.error(error.message); else toast.success('Notes saved');
  };

  const convertDemo = async (d: DemoReq) => {
    try {
      const { error: insErr } = await supabase.from('registration_codes').insert({
        practice_name: d.practice_name || d.name, rep_name: '',
      });
      if (insErr) throw insErr;
      await supabase.from('demo_requests').update({ status: 'converted' }).eq('id', d.id);
      toast.success('Code generated + demo marked converted');
      loadData();
    } catch (err: any) { toast.error(err.message); }
  };

  const exportCodesCSV = () => {
    const rows = filteredCodes;
    const csv = [
      ['Code', 'Practice', 'Rep', 'Status', 'Created', 'Expires', 'Used At'].join(','),
      ...rows.map(c => [c.code, `"${c.practice_name}"`, `"${c.rep_name || ''}"`, c.status, c.created_at, c.expires_at, c.used_at || ''].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `bytesense-codes-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} codes`);
  };

  const inviteAdmin = async () => {
    if (!inviteEmail.trim()) { toast.error('Enter an email'); return; }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(inviteEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Invite sent — they will receive a setup link');
      setInviteEmail('');
    } catch (err: any) { toast.error(err.message); }
  };

  const sendChangePassword = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message); else toast.success('Reset link sent to your email');
  };

  // ----- Derived data -----
  const activeCodes = codes.filter(c => c.status === 'active').length;
  const pendingDemos = demos.filter(d => d.status === 'new').length;
  const totalStaff = practices.reduce((a: number, p: any) => a + (p.profiles?.length || 0), 0);
  const codesUsed30d = codes.filter(c => c.status === 'used' && c.used_at && (Date.now() - new Date(c.used_at).getTime()) < 30 * 86400000).length;
  const conversionRate = demos.length ? Math.round((demos.filter(d => d.status === 'converted').length / demos.length) * 100) : 0;

  const filteredCodes = useMemo(() => {
    const q = globalSearch.toLowerCase();
    return codes
      .filter(c => codeFilter === 'all' || c.status === codeFilter)
      .filter(c => !q || c.code.toLowerCase().includes(q) || c.practice_name.toLowerCase().includes(q) || (c.rep_name || '').toLowerCase().includes(q));
  }, [codes, codeFilter, globalSearch]);

  const pagedCodes = filteredCodes.slice(codePage * 50, codePage * 50 + 50);
  const totalCodePages = Math.ceil(filteredCodes.length / 50);

  const filteredPractices = useMemo(() => {
    const q = (practiceSearch || globalSearch).toLowerCase();
    if (!q) return practices;
    return practices.filter((p: any) => (p.name || '').toLowerCase().includes(q) || (p.practice_code || '').toLowerCase().includes(q));
  }, [practices, practiceSearch, globalSearch]);

  const filteredDemos = useMemo(() => {
    const q = globalSearch.toLowerCase();
    return demos
      .filter(d => demoFilter === 'all' || d.status === demoFilter)
      .filter(d => !q || d.name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q) || (d.practice_name || '').toLowerCase().includes(q));
  }, [demos, demoFilter, globalSearch]);

  const recentActivity = useMemo(() => {
    const events: Array<{ ts: string; type: string; label: string; color: string }> = [];
    codes.slice(0, 10).forEach(c => events.push({ ts: c.created_at, type: 'code', label: `Code ${c.code} generated for ${c.practice_name}`, color: C.gold }));
    codes.filter(c => c.used_at).slice(0, 10).forEach(c => events.push({ ts: c.used_at!, type: 'used', label: `Code ${c.code} used`, color: C.teal }));
    demos.slice(0, 10).forEach(d => events.push({ ts: d.created_at, type: 'demo', label: `Demo request from ${d.name}${d.practice_name ? ' (' + d.practice_name + ')' : ''}`, color: C.amber }));
    practices.slice(0, 10).forEach((p: any) => events.push({ ts: p.created_at, type: 'practice', label: `Practice "${p.name}" registered`, color: C.green }));
    admins.slice(0, 10).forEach((a: any) => { if (a.created_at) events.push({ ts: a.created_at, type: 'staff', label: `ByteSense staff joined: ${a.full_name || 'Admin'}`, color: C.red }); });
    return events.sort((a, b) => +new Date(b.ts) - +new Date(a.ts)).slice(0, 10);
  }, [codes, demos, practices, admins]);

  const topPractices = useMemo(() => {
    return practices
      .map((p: any) => ({
        name: p.name,
        modules: p.training_progress?.reduce((s: number, tp: any) => s + (tp.done_modules?.length || 0), 0) || 0,
        staff: p.profiles?.length || 0,
      }))
      .sort((a, b) => b.modules - a.modules)
      .slice(0, 5);
  }, [practices]);

  const practiceChartData = practices.slice(0, 8).map((p: any) => ({
    name: (p.name || '').substring(0, 10),
    staff: p.profiles?.length || 0,
  }));

  const demoStatusData = [
    { name: 'New', value: demos.filter(d => d.status === 'new').length, color: C.amber },
    { name: 'Contacted', value: demos.filter(d => d.status === 'contacted').length, color: C.teal },
    { name: 'Converted', value: demos.filter(d => d.status === 'converted').length, color: C.green },
    { name: 'Rejected', value: demos.filter(d => d.status === 'rejected').length, color: C.slate },
  ].filter(d => d.value > 0);

  const codeStatusData = [
    { name: 'Active', value: codes.filter(c => c.status === 'active').length, color: C.green },
    { name: 'Used', value: codes.filter(c => c.status === 'used').length, color: C.teal },
    { name: 'Expired', value: codes.filter(c => c.status === 'expired').length, color: C.amber },
    { name: 'Revoked', value: codes.filter(c => c.status === 'revoked').length, color: C.red },
  ].filter(d => d.value > 0);

  if (authLoading || checking) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `radial-gradient(ellipse at top, #141420, ${C.dark})`, color: C.ash, fontFamily: C.fn }}>Loading…</div>;
  }

  const inputStyle: React.CSSProperties = {
    padding: '12px 16px', fontSize: 14, fontFamily: C.fn,
    border: `1px solid ${C.glassBorder}`, background: 'rgba(255,255,255,0.04)', color: C.white,
    outline: 'none', boxSizing: 'border-box', width: '100%', borderRadius: C.radiusSm,
  };

  const statusColor = (s: string) => s === 'active' ? C.green : s === 'used' ? C.teal : s === 'expired' ? C.amber : s === 'revoked' ? C.red : s === 'new' ? C.amber : s === 'contacted' ? C.teal : s === 'converted' ? C.green : s === 'rejected' ? C.slate : C.ash;

  const navItems: Array<{ id: TabId; label: string; icon: any }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'codes', label: 'Codes', icon: KeyRound },
    { id: 'practices', label: 'Practices', icon: Building2 },
    { id: 'demos', label: 'Demos', icon: Inbox },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const kpiCard = (label: string, value: string | number, color: string, gradient: string) => (
    <div style={{ ...glass, padding: '20px 18px', position: 'relative', overflow: 'hidden', boxShadow: C.glow(color, 0.08) }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: gradient }} />
      <div style={{ fontSize: 10, color: C.ash, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    </div>
  );

  const pill = (active: boolean, color: string, label: string, count: number, onClick: () => void) => (
    <button onClick={onClick} style={{
      padding: '6px 14px', fontSize: 11, fontWeight: 700, fontFamily: C.fn,
      background: active ? `${color}25` : 'transparent', color: active ? color : C.ash,
      border: `1px solid ${active ? color : C.glassBorder}`, borderRadius: 999, cursor: 'pointer',
    }}>{label} <span style={{ opacity: 0.7 }}>{count}</span></button>
  );

  return (
    <div style={{ fontFamily: C.fn, background: `radial-gradient(ellipse at top, #141420, ${C.dark})`, minHeight: '100vh', color: C.white, display: 'flex' }}>
      {/* SIDEBAR */}
      <aside style={{ width: 240, borderRight: `1px solid ${C.glassBorder}`, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 4, background: 'rgba(12,12,16,0.6)', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 24px', borderBottom: `1px solid ${C.glassBorder}`, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: C.radiusSm, background: C.gradRed, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: C.glow(C.red, 0.3) }}>◆</div>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: C.red, textTransform: 'uppercase', fontWeight: 700 }}>ByteSense</div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>HQ Admin</div>
          </div>
        </div>
        {navItems.map(n => {
          const Icon = n.icon;
          const active = tab === n.id;
          return (
            <button key={n.id} onClick={() => setTab(n.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: C.radiusSm,
              background: active ? `${C.red}20` : 'transparent', border: 'none',
              color: active ? C.white : C.ash, fontSize: 13, fontWeight: active ? 700 : 500, fontFamily: C.fn,
              cursor: 'pointer', textAlign: 'left', width: '100%',
              borderLeft: active ? `2px solid ${C.red}` : '2px solid transparent',
            }}>
              <Icon size={16} />
              {n.label}
            </button>
          );
        })}
        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${C.glassBorder}` }}>
          <div style={{ fontSize: 10, color: C.slate, padding: '0 8px 8px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
          <button type="button" onClick={() => navigate(appDashboardPath)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', background: 'transparent', border: 'none', color: C.ash, fontSize: 12, fontFamily: C.fn, cursor: 'pointer', borderRadius: C.radiusSm }}>
            ← App dashboard
          </button>
          <button onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', background: 'transparent', border: 'none', color: C.ash, fontSize: 12, fontFamily: C.fn, cursor: 'pointer', borderRadius: C.radiusSm }}>
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top bar */}
        <div style={{ padding: '14px 28px', borderBottom: `1px solid ${C.glassBorder}`, display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(20,20,28,0.5)', backdropFilter: C.blur, position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ flex: 1, position: 'relative', maxWidth: 480 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.slate }} />
            <input
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              placeholder="Search codes, practices, demos…"
              style={{ ...inputStyle, padding: '10px 12px 10px 36px', fontSize: 13 }}
            />
            {globalSearch && (
              <button onClick={() => setGlobalSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.slate, cursor: 'pointer' }}>
                <X size={14} />
              </button>
            )}
          </div>
          <div style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>
            {tab}
          </div>
        </div>

        <div style={{ padding: 28, maxWidth: 1200, margin: '0 auto' }}>
          {/* OVERVIEW */}
          {tab === 'overview' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
                {kpiCard('Practices', practices.length, C.teal, C.gradTeal)}
                {kpiCard('Active Codes', activeCodes, C.gold, C.gradGold)}
                {kpiCard('Pending Demos', pendingDemos, C.amber, `linear-gradient(135deg, ${C.amber}, ${C.gold})`)}
                {kpiCard('Total Staff', totalStaff, C.blue, C.gradBlue)}
                {kpiCard('Practice Codes Used (30d)', codesUsed30d, C.teal, C.gradTeal)}
                {kpiCard('ByteSense Staff', admins.length, C.red, C.gradRed)}
                {kpiCard('Conversion Rate', `${conversionRate}%`, C.green, `linear-gradient(135deg, ${C.green}, ${C.teal})`)}
              </div>
              <div style={{ fontSize: 10, color: C.slate, marginTop: -16, marginBottom: 24, fontStyle: 'italic' }}>
                Note: ByteSense staff (@bytesense.ai) bypass code redemption — they're auto-assigned admin roles.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginBottom: 16 }}>
                {/* Recent activity */}
                <div style={{ ...glass, padding: 22 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Activity size={14} style={{ color: C.teal }} /> Recent Activity
                  </div>
                  {recentActivity.length === 0 && <div style={{ fontSize: 12, color: C.slate }}>No activity yet</div>}
                  {recentActivity.map((e, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < recentActivity.length - 1 ? `1px solid ${C.glassBorder}` : 'none' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: e.color, marginTop: 6, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: C.white, lineHeight: 1.4 }}>{e.label}</div>
                        <div style={{ fontSize: 10, color: C.slate, marginTop: 2 }}>{new Date(e.ts).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Top practices */}
                <div style={{ ...glass, padding: 22 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Trophy size={14} style={{ color: C.gold }} /> Top Practices by Training
                  </div>
                  {topPractices.length === 0 && <div style={{ fontSize: 12, color: C.slate }}>No data yet</div>}
                  {topPractices.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < topPractices.length - 1 ? `1px solid ${C.glassBorder}` : 'none' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: i === 0 ? C.gold : C.glassBorder, color: i === 0 ? '#000' : C.ash, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: C.slate }}>{p.staff} staff</div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.gold }}>{p.modules}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                {practiceChartData.length > 0 && (
                  <div style={{ ...glass, padding: 22 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Staff by Practice</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={practiceChartData} barSize={14}>
                        <XAxis dataKey="name" tick={{ fill: C.ash, fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: C.ash, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="staff" fill={C.teal} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {[{ data: codeStatusData, title: 'Codes Status' }, { data: demoStatusData, title: 'Demo Status' }].map(({ data, title }) => data.length > 0 && (
                  <div key={title} style={{ ...glass, padding: 22 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>{title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <ResponsiveContainer width={140} height={140}>
                        <PieChart>
                          <Pie data={data} cx="50%" cy="50%" innerRadius={42} outerRadius={62} dataKey="value" strokeWidth={0}>
                            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ flex: 1 }}>
                        {data.map(d => (
                          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                            <span style={{ fontSize: 11, color: C.ash }}>{d.name}: <strong style={{ color: C.white }}>{d.value}</strong></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* CODES */}
          {tab === 'codes' && (
            <>
              <div style={{ ...glass, padding: 22, marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Generate Registration Codes</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 10, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, display: 'block', marginBottom: 6, fontWeight: 600 }}>Practice Name *</label>
                    <input value={newPracticeName} onChange={e => setNewPracticeName(e.target.value)} style={inputStyle} placeholder="Acme Dental" />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, display: 'block', marginBottom: 6, fontWeight: 600 }}>Rep Name</label>
                    <input value={newRepName} onChange={e => setNewRepName(e.target.value)} style={inputStyle} placeholder="John Smith" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ fontSize: 10, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, display: 'block', marginBottom: 6, fontWeight: 600 }}>Count</label>
                    <input type="number" min={1} max={20} value={batchCount} onChange={e => setBatchCount(Number(e.target.value))} style={{ ...inputStyle, width: 90 }} />
                  </div>
                  <button onClick={generateCodes} style={{ background: C.gradRed, color: '#fff', border: 'none', padding: '12px 24px', fontSize: 13, fontWeight: 700, fontFamily: C.fn, cursor: 'pointer', borderRadius: C.radiusSm, boxShadow: C.glow(C.red, 0.2) }}>
                    Generate
                  </button>
                  <button onClick={exportCodesCSV} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', color: C.teal, border: `1px solid ${C.teal}40`, padding: '10px 16px', fontSize: 12, fontWeight: 600, fontFamily: C.fn, cursor: 'pointer', borderRadius: C.radiusSm }}>
                    <Download size={13} /> Export CSV
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                {pill(codeFilter === 'all', C.white, 'All', codes.length, () => { setCodeFilter('all'); setCodePage(0); })}
                {pill(codeFilter === 'active', C.green, 'Active', codes.filter(c => c.status === 'active').length, () => { setCodeFilter('active'); setCodePage(0); })}
                {pill(codeFilter === 'used', C.teal, 'Used', codes.filter(c => c.status === 'used').length, () => { setCodeFilter('used'); setCodePage(0); })}
                {pill(codeFilter === 'expired', C.amber, 'Expired', codes.filter(c => c.status === 'expired').length, () => { setCodeFilter('expired'); setCodePage(0); })}
                {pill(codeFilter === 'revoked', C.red, 'Revoked', codes.filter(c => c.status === 'revoked').length, () => { setCodeFilter('revoked'); setCodePage(0); })}
              </div>

              <div style={{ fontSize: 11, color: C.slate, marginBottom: 10 }}>{filteredCodes.length} of {codes.length} codes</div>
              {pagedCodes.map(c => (
                <div key={c.id} style={{ ...glass, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                    <span style={{ fontWeight: 800, letterSpacing: 3, fontSize: 15, color: C.white, fontFamily: 'monospace' }}>{c.code}</span>
                    <button onClick={() => copyToClipboard(c.code, 'Code')} style={{ background: 'none', border: 'none', color: C.slate, cursor: 'pointer', display: 'flex' }}>
                      <Copy size={13} />
                    </button>
                    <span style={{ fontSize: 12, color: C.ash, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.practice_name}</span>
                    {c.rep_name && <span style={{ fontSize: 11, color: C.slate }}>· {c.rep_name}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: statusColor(c.status), textTransform: 'uppercase', background: `${statusColor(c.status)}15`, padding: '3px 10px', borderRadius: 999 }}>{c.status}</span>
                    <span style={{ fontSize: 10, color: C.slate }}>exp {new Date(c.expires_at).toLocaleDateString()}</span>
                    {c.status === 'active' && (
                      <button onClick={() => revokeCode(c.id)} style={{ background: 'none', border: `1px solid ${C.glassBorder}`, color: C.ash, padding: '5px 12px', fontSize: 11, fontFamily: C.fn, cursor: 'pointer', borderRadius: C.radiusXs }}>
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {totalCodePages > 1 && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                  <button disabled={codePage === 0} onClick={() => setCodePage(p => p - 1)} style={{ background: 'transparent', border: `1px solid ${C.glassBorder}`, color: C.ash, padding: '6px 14px', borderRadius: C.radiusSm, cursor: codePage === 0 ? 'not-allowed' : 'pointer', fontFamily: C.fn, fontSize: 12, opacity: codePage === 0 ? 0.4 : 1 }}>← Prev</button>
                  <span style={{ fontSize: 12, color: C.ash, alignSelf: 'center' }}>Page {codePage + 1} of {totalCodePages}</span>
                  <button disabled={codePage >= totalCodePages - 1} onClick={() => setCodePage(p => p + 1)} style={{ background: 'transparent', border: `1px solid ${C.glassBorder}`, color: C.ash, padding: '6px 14px', borderRadius: C.radiusSm, cursor: codePage >= totalCodePages - 1 ? 'not-allowed' : 'pointer', fontFamily: C.fn, fontSize: 12, opacity: codePage >= totalCodePages - 1 ? 0.4 : 1 }}>Next →</button>
                </div>
              )}
            </>
          )}

          {/* PRACTICES */}
          {tab === 'practices' && (
            <>
              <div style={{ position: 'relative', marginBottom: 14, maxWidth: 360 }}>
                <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.slate }} />
                <input value={practiceSearch} onChange={e => setPracticeSearch(e.target.value)} placeholder="Search practices…" style={{ ...inputStyle, padding: '10px 12px 10px 34px', fontSize: 13 }} />
              </div>
              <div style={{ fontSize: 11, color: C.slate, marginBottom: 10 }}>{filteredPractices.length} of {practices.length} practices</div>
              {filteredPractices.map((p: any) => {
                const isOpen = expandedPractice === p.id;
                const staffCount = p.profiles?.length || 0;
                const totalMods = p.training_progress?.reduce((s: number, tp: any) => s + (tp.done_modules?.length || 0), 0) || 0;
                return (
                  <div key={p.id} style={{ ...glass, marginBottom: 10, overflow: 'hidden' }}>
                    <div onClick={() => setExpandedPractice(isOpen ? null : p.id)} style={{ padding: 18, display: 'flex', justifyContent: 'space-between', cursor: 'pointer', alignItems: 'center' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                          {!p.is_active && <span style={{ fontSize: 9, color: C.amber, background: `${C.amber}15`, padding: '2px 8px', borderRadius: 999, fontWeight: 700, textTransform: 'uppercase' }}>Inactive</span>}
                        </div>
                        <div style={{ fontSize: 11, color: C.ash, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                          Code: <span style={{ fontFamily: 'monospace', color: C.gold }}>{p.practice_code || 'N/A'}</span>
                          {p.practice_code && (
                            <button onClick={(e) => { e.stopPropagation(); copyToClipboard(p.practice_code, 'Practice code'); }} style={{ background: 'none', border: 'none', color: C.slate, cursor: 'pointer', display: 'flex' }}>
                              <Copy size={11} />
                            </button>
                          )}
                          <span style={{ color: C.slate }}>· {new Date(p.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: C.teal }}>{staffCount}</div>
                          <div style={{ fontSize: 9, color: C.ash, textTransform: 'uppercase' }}>staff</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: C.gold }}>{totalMods}</div>
                          <div style={{ fontSize: 9, color: C.ash, textTransform: 'uppercase' }}>modules</div>
                        </div>
                        <ChevronRight size={16} style={{ color: C.slate, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                      </div>
                    </div>
                    {isOpen && (
                      <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${C.glassBorder}` }}>
                        <div style={{ fontSize: 10, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 16, marginBottom: 10, fontWeight: 600 }}>Staff Members</div>
                        {(!p.profiles || p.profiles.length === 0) && <div style={{ fontSize: 12, color: C.slate }}>No staff yet</div>}
                        {p.profiles?.map((prof: any) => {
                          const tp = p.training_progress?.find((t: any) => t.user_id === prof.user_id);
                          return (
                            <div key={prof.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.glassBorder}` }}>
                              <div>
                                <div style={{ fontSize: 13, color: C.white, fontWeight: 600 }}>{prof.full_name || '(no name)'}</div>
                                <div style={{ fontSize: 10, color: C.slate }}>Joined {new Date(prof.created_at).toLocaleDateString()}</div>
                              </div>
                              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: C.ash }}>
                                <span>{tp?.done_modules?.length || 0} modules</span>
                                <span style={{ color: C.gold }}>{tp?.xp || 0} XP</span>
                                {tp?.completed_at && <span style={{ color: C.green }}>✓ Done</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* DEMOS */}
          {tab === 'demos' && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                {pill(demoFilter === 'all', C.white, 'All', demos.length, () => setDemoFilter('all'))}
                {pill(demoFilter === 'new', C.amber, 'New', demos.filter(d => d.status === 'new').length, () => setDemoFilter('new'))}
                {pill(demoFilter === 'contacted', C.teal, 'Contacted', demos.filter(d => d.status === 'contacted').length, () => setDemoFilter('contacted'))}
                {pill(demoFilter === 'converted', C.green, 'Converted', demos.filter(d => d.status === 'converted').length, () => setDemoFilter('converted'))}
                {pill(demoFilter === 'rejected', C.slate, 'Rejected', demos.filter(d => d.status === 'rejected').length, () => setDemoFilter('rejected'))}
              </div>
              <div style={{ fontSize: 11, color: C.slate, marginBottom: 10 }}>{filteredDemos.length} of {demos.length} requests</div>
              {filteredDemos.map(d => {
                const isOpen = expandedDemo === d.id;
                return (
                  <div key={d.id} style={{ ...glass, marginBottom: 10, overflow: 'hidden' }}>
                    <div onClick={() => setExpandedDemo(isOpen ? null : d.id)} style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{d.name}</div>
                        <div style={{ fontSize: 11, color: C.ash, marginTop: 2 }}>{d.email} · {d.phone || '—'}</div>
                        {d.practice_name && <div style={{ fontSize: 11, color: C.slate, marginTop: 2 }}>{d.practice_name}</div>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <select
                          value={d.status}
                          onClick={e => e.stopPropagation()}
                          onChange={e => updateDemoStatus(d.id, e.target.value)}
                          style={{
                            background: `${statusColor(d.status)}15`, color: statusColor(d.status),
                            border: `1px solid ${statusColor(d.status)}40`, fontSize: 10, fontWeight: 700,
                            textTransform: 'uppercase', padding: '4px 8px', borderRadius: 999, cursor: 'pointer',
                            fontFamily: C.fn, outline: 'none',
                          }}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="converted">Converted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <span style={{ fontSize: 10, color: C.slate }}>{new Date(d.created_at).toLocaleDateString()}</span>
                        <ChevronRight size={14} style={{ color: C.slate, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                      </div>
                    </div>
                    {isOpen && (
                      <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${C.glassBorder}` }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, paddingTop: 14 }}>
                          {[
                            { label: 'Operatories', value: d.operatories || '—' },
                            { label: 'Patients/Mo', value: d.monthly_patients || '—' },
                            { label: 'Guards/Mo', value: d.guards_per_month || '—' },
                            { label: 'Guard Price', value: d.guard_price ? `$${d.guard_price}` : '—' },
                            { label: 'Scanner', value: d.has_scanner ? (d.scanner_type || 'Yes') : 'No' },
                            { label: 'Practice Size', value: d.practice_size || '—' },
                          ].map((it, i) => (
                            <div key={i}>
                              <div style={{ fontSize: 9, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4, fontWeight: 600 }}>{it.label}</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: C.white }}>{it.value}</div>
                            </div>
                          ))}
                        </div>
                        {d.goals && d.goals.length > 0 && (
                          <div style={{ marginTop: 14 }}>
                            <div style={{ fontSize: 9, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6, fontWeight: 600 }}>Goals</div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {d.goals.map((g, i) => (
                                <span key={i} style={{ background: `${C.teal}15`, color: C.teal, padding: '4px 12px', fontSize: 11, borderRadius: 999, fontWeight: 600 }}>{g}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {d.message && (
                          <div style={{ marginTop: 14 }}>
                            <div style={{ fontSize: 9, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4, fontWeight: 600 }}>Message</div>
                            <div style={{ fontSize: 12, color: C.ash, lineHeight: 1.7 }}>{d.message}</div>
                          </div>
                        )}
                        <div style={{ marginTop: 14 }}>
                          <div style={{ fontSize: 9, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6, fontWeight: 600 }}>Admin Notes</div>
                          <textarea
                            value={demoNotes[d.id] ?? ''}
                            onChange={e => setDemoNotes(prev => ({ ...prev, [d.id]: e.target.value }))}
                            rows={3}
                            style={{ ...inputStyle, fontSize: 12, resize: 'vertical', fontFamily: C.fn }}
                            placeholder="Internal notes about this lead…"
                          />
                          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <button onClick={() => saveDemoNotes(d.id)} style={{ background: 'transparent', border: `1px solid ${C.teal}40`, color: C.teal, padding: '6px 14px', fontSize: 11, fontWeight: 700, fontFamily: C.fn, cursor: 'pointer', borderRadius: C.radiusSm }}>
                              Save notes
                            </button>
                            {d.status !== 'converted' && (
                              <button onClick={() => convertDemo(d)} style={{ background: C.gradTeal, border: 'none', color: '#fff', padding: '6px 14px', fontSize: 11, fontWeight: 700, fontFamily: C.fn, cursor: 'pointer', borderRadius: C.radiusSm, boxShadow: C.glow(C.teal, 0.2) }}>
                                Convert + Generate Code
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* SETTINGS */}
          {tab === 'settings' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
              <div style={{ ...glass, padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={14} style={{ color: C.teal }} /> Your Account
                </div>
                <div style={{ fontSize: 11, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4, fontWeight: 600 }}>Email</div>
                <div style={{ fontSize: 14, color: C.white, marginBottom: 16, wordBreak: 'break-all' }}>{user?.email}</div>
                <div style={{ fontSize: 11, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4, fontWeight: 600 }}>Role</div>
                <div style={{ fontSize: 13, color: C.red, fontWeight: 700, marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 }}>ByteSense Admin</div>
                <button onClick={sendChangePassword} style={{ background: 'transparent', border: `1px solid ${C.glassBorder}`, color: C.white, padding: '10px 18px', fontSize: 12, fontWeight: 600, fontFamily: C.fn, cursor: 'pointer', borderRadius: C.radiusSm, width: '100%' }}>
                  Send password reset email
                </button>
              </div>

              <div style={{ ...glass, padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={14} style={{ color: C.gold }} /> Invite Admin
                </div>
                <div style={{ fontSize: 12, color: C.ash, marginBottom: 12, lineHeight: 1.6 }}>
                  Send a setup link to a new ByteSense admin. They must already have an account — assign the bytesense_admin role separately.
                </div>
                <input
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="admin@bytesense.ai"
                  style={{ ...inputStyle, marginBottom: 10 }}
                />
                <button onClick={inviteAdmin} style={{ background: C.gradGold, border: 'none', color: '#000', padding: '10px 18px', fontSize: 12, fontWeight: 700, fontFamily: C.fn, cursor: 'pointer', borderRadius: C.radiusSm, width: '100%' }}>
                  Send setup link
                </button>
              </div>

              <div style={{ ...glass, padding: 24, gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Current Admins ({admins.length})</div>
                {admins.length === 0 && <div style={{ fontSize: 12, color: C.slate }}>No admins found</div>}
                {admins.map((a: any) => (
                  <div key={a.user_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.glassBorder}` }}>
                    <div style={{ fontSize: 13, color: C.white, fontWeight: 600 }}>{a.full_name || '(no name)'}</div>
                    <div style={{ fontSize: 11, color: C.slate, fontFamily: 'monospace' }}>{a.user_id.slice(0, 8)}…</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}