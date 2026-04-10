import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { C } from '@/data/constants';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';

interface RegCode {
  id: string; code: string; practice_name: string; rep_name: string;
  status: string; expires_at: string; used_by: string | null; used_at: string | null; created_at: string;
}

interface DemoReq {
  id: string; name: string; email: string; practice_name: string; phone: string;
  message: string; status: string; created_at: string;
  operatories?: number; monthly_patients?: number; guards_per_month?: number;
  guard_price?: number; has_scanner?: boolean; scanner_type?: string; goals?: string[]; practice_size?: string;
}

const glass = {
  background: C.glass, backdropFilter: C.blur, WebkitBackdropFilter: C.blur,
  border: `1px solid ${C.glassBorder}`, borderRadius: C.radius,
} as React.CSSProperties;

const tooltipStyle = { background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: C.radiusSm, fontSize: 12 };

export default function ByteSenseAdmin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isBSAdmin, setIsBSAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<'overview' | 'codes' | 'practices' | 'demos'>('overview');
  const [codes, setCodes] = useState<RegCode[]>([]);
  const [newPracticeName, setNewPracticeName] = useState('');
  const [newRepName, setNewRepName] = useState('');
  const [batchCount, setBatchCount] = useState(1);
  const [practices, setPractices] = useState<any[]>([]);
  const [demos, setDemos] = useState<DemoReq[]>([]);
  const [expandedDemo, setExpandedDemo] = useState<string | null>(null);

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
    const [codesRes, practicesRes, demosRes] = await Promise.all([
      supabase.from('registration_codes').select('*').order('created_at', { ascending: false }),
      supabase.from('practices').select('*, profiles(user_id, full_name), training_progress(user_id, done_modules, xp, completed_at)'),
      supabase.from('demo_requests').select('*').order('created_at', { ascending: false }),
    ]);
    if (codesRes.data) setCodes(codesRes.data as RegCode[]);
    if (practicesRes.data) setPractices(practicesRes.data);
    if (demosRes.data) setDemos(demosRes.data as DemoReq[]);
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

  if (authLoading || checking) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `radial-gradient(ellipse at top, #141420, ${C.dark})`, color: C.ash, fontFamily: C.fn }}>Loading...</div>;
  }

  const inputStyle = {
    padding: "12px 16px", fontSize: 14, fontFamily: C.fn,
    border: `1px solid ${C.glassBorder}`, background: "rgba(255,255,255,0.04)", color: C.white,
    outline: "none", boxSizing: "border-box" as const, width: "100%", borderRadius: C.radiusSm,
    transition: "border-color 0.2s",
  };

  const statusColor = (s: string) => s === 'active' ? C.green : s === 'used' ? C.teal : s === 'expired' ? C.amber : C.ash;

  // KPI data
  const activeCodes = codes.filter(c => c.status === 'active').length;
  const pendingDemos = demos.filter(d => d.status === 'new').length;
  const totalStaff = practices.reduce((a: number, p: any) => a + (p.profiles?.length || 0), 0);

  const practiceChartData = practices.map((p: any) => ({
    name: (p.name || '').substring(0, 10),
    staff: p.profiles?.length || 0,
    modules: p.training_progress?.reduce((s: number, tp: any) => s + (tp.done_modules?.length || 0), 0) || 0,
  }));

  const demoStatusData = [
    { name: 'New', value: demos.filter(d => d.status === 'new').length, color: C.amber },
    { name: 'Contacted', value: demos.filter(d => d.status === 'contacted').length, color: C.teal },
    { name: 'Converted', value: demos.filter(d => d.status === 'converted').length, color: C.green },
  ].filter(d => d.value > 0);

  const kpiCard = (label: string, value: string | number, color: string, gradient: string) => (
    <div style={{ ...glass, padding: "22px 20px", flex: 1, minWidth: 130, position: "relative", overflow: "hidden", transition: "all 0.3s", boxShadow: C.glow(color, 0.08) }}
      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.boxShadow = C.glow(color, 0.2); e.currentTarget.style.transform = "translateY(-3px)"; }}
      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.boxShadow = C.glow(color, 0.08); e.currentTarget.style.transform = "translateY(0)"; }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: gradient, borderRadius: `${C.radius} ${C.radius} 0 0` }} />
      <div style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    </div>
  );

  const tabItems = [
    { id: 'overview' as const, label: '◎ Overview' },
    { id: 'codes' as const, label: '🔑 Codes' },
    { id: 'practices' as const, label: '🏥 Practices' },
    { id: 'demos' as const, label: '📋 Demos' },
  ];

  return (
    <div style={{ fontFamily: C.fn, background: `radial-gradient(ellipse at top, #141420, ${C.dark})`, minHeight: "100vh", color: C.white }}>
      {/* Header */}
      <div style={{ padding: "18px 28px", borderBottom: `1px solid ${C.glassBorder}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(20,20,28,0.6)", backdropFilter: C.blur }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: C.radiusSm, background: C.gradRed, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: C.glow(C.red, 0.25) }}>◆</div>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 4, color: C.red, textTransform: "uppercase", fontWeight: 700 }}>ByteSense HQ</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Admin Portal</div>
          </div>
        </div>
        <button onClick={() => navigate('/')} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.glassBorder}`, color: C.ash, fontSize: 13, cursor: "pointer", fontFamily: C.fn, padding: "8px 16px", borderRadius: C.radiusSm }}>← Dashboard</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, padding: "12px 28px", borderBottom: `1px solid ${C.glassBorder}` }}>
        {tabItems.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: "9px 18px", fontSize: 12, fontWeight: 700, fontFamily: C.fn,
              background: tab === t.id ? C.gradRed : "rgba(255,255,255,0.04)",
              color: tab === t.id ? "#fff" : C.ash,
              border: tab === t.id ? "none" : `1px solid ${C.glassBorder}`,
              cursor: "pointer", borderRadius: 999, transition: "all 0.25s",
              boxShadow: tab === t.id ? C.glow(C.red, 0.2) : "none",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 28, maxWidth: 1000, margin: "0 auto" }}>
        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <>
            <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
              {kpiCard("Practices", practices.length, C.teal, C.gradTeal)}
              {kpiCard("Active Codes", activeCodes, C.gold, C.gradGold)}
              {kpiCard("Pending Demos", pendingDemos, C.amber, `linear-gradient(135deg, ${C.amber}, ${C.gold})`)}
              {kpiCard("Total Staff", totalStaff, C.blue, C.gradBlue)}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
              {practiceChartData.length > 0 && (
                <div style={{ ...glass, padding: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.teal }} /> Staff by Practice
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={practiceChartData} barSize={16}>
                      <XAxis dataKey="name" tick={{ fill: C.ash, fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: C.ash, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="staff" fill={C.teal} radius={[4, 4, 0, 0]} name="Staff" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {demoStatusData.length > 0 && (
                <div style={{ ...glass, padding: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold }} /> Demo Request Status
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
                    <ResponsiveContainer width={160} height={160}>
                      <PieChart>
                        <Pie data={demoStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" strokeWidth={0}>
                          {demoStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ marginLeft: 12 }}>
                      {demoStatusData.map(d => (
                        <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} />
                          <span style={{ fontSize: 11, color: C.ash }}>{d.name}: {d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* CODES TAB */}
        {tab === 'codes' && (
          <>
            <div style={{ ...glass, padding: 24, marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Generate Registration Codes</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 1.5, display: "block", marginBottom: 6, fontWeight: 600 }}>Practice Name *</label>
                  <input value={newPracticeName} onChange={e => setNewPracticeName(e.target.value)} style={inputStyle} placeholder="Acme Dental" />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 1.5, display: "block", marginBottom: 6, fontWeight: 600 }}>Rep Name</label>
                  <input value={newRepName} onChange={e => setNewRepName(e.target.value)} style={inputStyle} placeholder="John Smith" />
                </div>
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div>
                  <label style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 1.5, display: "block", marginBottom: 6, fontWeight: 600 }}>Count</label>
                  <input type="number" min={1} max={20} value={batchCount} onChange={e => setBatchCount(Number(e.target.value))} style={{ ...inputStyle, width: 90 }} />
                </div>
                <button onClick={generateCodes} style={{ background: C.gradRed, color: "#fff", border: "none", padding: "12px 24px", fontSize: 13, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", marginTop: 22, borderRadius: C.radiusSm, boxShadow: C.glow(C.red, 0.2) }}>
                  Generate
                </button>
              </div>
            </div>
            <div style={{ fontSize: 12, color: C.ash, marginBottom: 14 }}>{codes.length} codes total</div>
            {codes.map(c => (
              <div key={c.id} style={{ ...glass, padding: "14px 18px", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontWeight: 800, letterSpacing: 4, fontSize: 16, color: C.white, fontFamily: "monospace" }}>{c.code}</span>
                  <span style={{ fontSize: 12, color: C.ash }}>{c.practice_name}</span>
                  {c.rep_name && <span style={{ fontSize: 11, color: C.slate }}>({c.rep_name})</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: statusColor(c.status), textTransform: "uppercase", background: `${statusColor(c.status)}15`, padding: "3px 10px", borderRadius: 999 }}>{c.status}</span>
                  <span style={{ fontSize: 10, color: C.ash }}>exp: {new Date(c.expires_at).toLocaleDateString()}</span>
                  {c.status === 'active' && (
                    <button onClick={() => revokeCode(c.id)} style={{ background: "none", border: `1px solid ${C.glassBorder}`, color: C.ash, padding: "5px 12px", fontSize: 11, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusXs, transition: "all 0.2s" }}
                      onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red; }}
                      onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = C.glassBorder; e.currentTarget.style.color = C.ash; }}>
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* PRACTICES TAB */}
        {tab === 'practices' && (
          <>
            <div style={{ fontSize: 12, color: C.ash, marginBottom: 14 }}>{practices.length} practices</div>
            {practices.map((p: any) => {
              const staffCount = p.profiles?.length || 0;
              const totalMods = p.training_progress?.reduce((sum: number, tp: any) => sum + (tp.done_modules?.length || 0), 0) || 0;
              return (
                <div key={p.id} style={{ ...glass, padding: 20, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: C.ash, marginTop: 2 }}>Code: <span style={{ fontFamily: "monospace", color: C.gold }}>{p.practice_code || 'N/A'}</span> · {new Date(p.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: C.teal }}>{staffCount}</div>
                        <div style={{ fontSize: 9, color: C.ash, textTransform: "uppercase", letterSpacing: 1 }}>staff</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: C.gold }}>{totalMods}</div>
                        <div style={{ fontSize: 9, color: C.ash, textTransform: "uppercase", letterSpacing: 1 }}>modules</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* DEMOS TAB */}
        {tab === 'demos' && (
          <>
            <div style={{ fontSize: 12, color: C.ash, marginBottom: 14 }}>{demos.length} requests</div>
            {demos.map(d => {
              const isExpanded = expandedDemo === d.id;
              return (
                <div key={d.id} style={{ ...glass, marginBottom: 10, overflow: "hidden" }}>
                  <div onClick={() => setExpandedDemo(isExpanded ? null : d.id)}
                    style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", cursor: "pointer", transition: "background 0.2s" }}
                    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.background = "transparent"}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{d.name}</div>
                      <div style={{ fontSize: 12, color: C.ash, marginTop: 2 }}>{d.email} · {d.phone}</div>
                      {d.practice_name && <div style={{ fontSize: 12, color: C.slate, marginTop: 2 }}>{d.practice_name}</div>}
                    </div>
                    <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: d.status === 'new' ? C.amber : C.green, textTransform: "uppercase", background: `${d.status === 'new' ? C.amber : C.green}15`, padding: "3px 10px", borderRadius: 999 }}>{d.status}</span>
                      <div style={{ fontSize: 10, color: C.ash }}>{new Date(d.created_at).toLocaleDateString()}</div>
                      <span style={{ color: C.ash, fontSize: 12, transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.25s" }}>▶</span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ padding: "0 20px 18px", borderTop: `1px solid ${C.glassBorder}`, animation: "float-up 0.2s ease-out" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, paddingTop: 16 }}>
                        {[
                          { label: "Operatories", value: d.operatories || '—' },
                          { label: "Patients/Mo", value: d.monthly_patients || '—' },
                          { label: "Guards/Mo", value: d.guards_per_month || '—' },
                          { label: "Guard Price", value: d.guard_price ? `$${d.guard_price}` : '—' },
                          { label: "Scanner", value: d.has_scanner ? (d.scanner_type || 'Yes') : 'No' },
                          { label: "Practice Size", value: d.practice_size || '—' },
                        ].map((item, i) => (
                          <div key={i}>
                            <div style={{ fontSize: 9, color: C.ash, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4, fontWeight: 600 }}>{item.label}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                      {d.goals && d.goals.length > 0 && (
                        <div style={{ marginTop: 14 }}>
                          <div style={{ fontSize: 9, color: C.ash, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6, fontWeight: 600 }}>Goals</div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {d.goals.map((g, i) => (
                              <span key={i} style={{ background: `${C.teal}15`, color: C.teal, padding: "4px 12px", fontSize: 11, borderRadius: 999, fontWeight: 600 }}>{g}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {d.message && (
                        <div style={{ marginTop: 14 }}>
                          <div style={{ fontSize: 9, color: C.ash, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4, fontWeight: 600 }}>Message</div>
                          <div style={{ fontSize: 12, color: C.ash, lineHeight: 1.7 }}>{d.message}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
