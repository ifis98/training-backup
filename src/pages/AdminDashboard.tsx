import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { C } from '@/data/constants';
import { M } from '@/data/modules';
import { Logo } from '@/components/ByteSenseLogo';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface AdminDashboardProps { user: any; profile: any; onBack: () => void; }

const glass = {
  background: C.glass, backdropFilter: C.blur, WebkitBackdropFilter: C.blur,
  border: `1px solid ${C.glassBorder}`, borderRadius: C.radius,
} as React.CSSProperties;

export default function AdminDashboard({ user, profile, onBack }: AdminDashboardProps) {
  const [staff, setStaff] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'staff' | 'invitations' | 'certificate'>('overview');
  const [practiceData, setPracticeData] = useState<any>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, [profile]);

  const loadData = async () => {
    if (!profile?.practice_id) return;
    setLoading(true);
    const [staffRes, invRes, practiceRes] = await Promise.all([
      supabase.from('training_progress').select('*').eq('practice_id', profile.practice_id),
      supabase.from('staff_invitations').select('*').eq('practice_id', profile.practice_id).order('created_at', { ascending: false }),
      supabase.from('practices').select('*').eq('id', profile.practice_id).single(),
    ]);
    setPracticeData(practiceRes.data);
    if (staffRes.data) {
      const userIds = staffRes.data.map(s => s.user_id);
      const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', userIds);
      setStaff(staffRes.data.map(s => ({ ...s, profile: profiles?.find(p => p.user_id === s.user_id) })));
    }
    setInvitations(invRes.data || []);
    setLoading(false);
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !profile?.practice_id) return;
    const { error } = await supabase.from('staff_invitations').insert({ practice_id: profile.practice_id, email: inviteEmail.trim().toLowerCase(), invited_by: user.id });
    if (error) { toast.error(error.message); } else { toast.success(`Invitation sent to ${inviteEmail}`); setInviteEmail(''); loadData(); }
  };

  const revokeInvite = async (id: string) => {
    await supabase.from('staff_invitations').update({ status: 'revoked' }).eq('id', id);
    toast.success('Invitation revoked'); loadData();
  };

  const approveRequest = async (inv: any) => {
    const { data: requestProfile } = await supabase.from('profiles').select('*').eq('user_id', inv.invited_by).single();
    if (requestProfile) {
      await supabase.from('profiles').update({ practice_id: profile.practice_id }).eq('user_id', inv.invited_by);
      await supabase.from('user_roles').insert({ user_id: inv.invited_by, role: 'staff' as any });
      await supabase.from('training_progress').insert({ user_id: inv.invited_by, practice_id: profile.practice_id });
    }
    await supabase.from('staff_invitations').update({ status: 'accepted' }).eq('id', inv.id);
    toast.success('Request approved!'); loadData();
  };

  const removeStaff = async (staffMember: any) => {
    if (!confirm(`Remove ${staffMember.profile?.full_name || 'this member'}?`)) return;
    setRemovingId(staffMember.user_id);
    try {
      await supabase.from('training_progress').delete().eq('user_id', staffMember.user_id).eq('practice_id', profile.practice_id);
      await supabase.from('profiles').update({ practice_id: null }).eq('user_id', staffMember.user_id);
      toast.success('Staff member removed'); loadData();
    } catch { toast.error('Failed'); } finally { setRemovingId(null); }
  };

  const getProgress = (tp: any) => {
    const doneCount = (tp.done_modules || []).length;
    return M.length > 0 ? Math.round((doneCount / M.length) * 100) : 0;
  };

  const avgProgress = staff.length > 0 ? Math.round(staff.reduce((a, s) => a + getProgress(s), 0) / staff.length) : 0;
  const totalCompleted = staff.filter(s => s.completed_at).length;
  const totalSims = staff.reduce((a, s) => a + (s.sim_patients || 0), 0);
  const staffChartData = staff.map(s => ({ name: (s.profile?.full_name || '?').split(' ')[0], progress: getProgress(s) }));

  const kpiCard = (label: string, value: string | number, color: string, gradient: string) => (
    <div style={{ ...glass, padding: "22px 18px", flex: 1, minWidth: 120, position: "relative", overflow: "hidden", transition: "all 0.3s", boxShadow: "none"}}
      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.boxShadow = C.glow(color, 0.2); e.currentTarget.style.transform = "translateY(-3px)"; }}
      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.boxShadow = C.glow(color, 0.08); e.currentTarget.style.transform = "translateY(0)"; }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: gradient, borderRadius: `${C.radius} ${C.radius} 0 0` }} />
      <div style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    </div>
  );

  const tabItems = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'staff' as const, label: 'Staff Progress' },
    { id: 'invitations' as const, label: 'Invitations' },
    { id: 'certificate' as const, label: 'Certificate' },
  ];

  return (
    <div style={{ fontFamily: C.fn, background: `radial-gradient(ellipse at top, #141420, ${C.dark})`, minHeight: "100vh", color: C.white }}>
      <div style={{ padding: "18px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.glassBorder}`, background: "rgba(20,20,28,0.6)", backdropFilter: C.blur }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.glassBorder}`, color: C.ash, fontSize: 13, cursor: "pointer", fontFamily: C.fn, padding: "8px 16px", borderRadius: C.radiusSm }}>← Dashboard</button>
        <div style={{ fontSize: 10, letterSpacing: 4, color: C.gold, textTransform: "uppercase", fontWeight: 700 }}>Practice Admin</div>
        <div />
      </div>

      {practiceData?.practice_code && (
        <div style={{ margin: "16px 28px 0", ...glass, padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 10, color: C.ash, letterSpacing: 2, textTransform: "uppercase" }}>Practice Join Code</div>
            <div style={{ fontSize: 11, color: C.ash, marginTop: 2 }}>Share this with staff</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.gold, letterSpacing: 6, fontFamily: "monospace" }}>{practiceData.practice_code}</div>
        </div>
      )}

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 28px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {tabItems.map(t => (
            <button key={t.id} style={{
              background: tab === t.id ? C.gradRed : "rgba(255,255,255,0.04)",
              color: tab === t.id ? "#fff" : C.ash,
              border: tab === t.id ? "none" : `1px solid ${C.glassBorder}`,
              padding: "9px 18px", fontSize: 12, fontWeight: 700, fontFamily: C.fn, cursor: "pointer",
              borderRadius: 999, transition: "all 0.25s",
              boxShadow: "none",
            }} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {tab === 'overview' && (
          <div>
            <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
              {kpiCard("Team Members", staff.length, C.teal, C.gradTeal)}
              {kpiCard("Avg Progress", `${avgProgress}%`, C.gold, C.gradGold)}
              {kpiCard("Certified", totalCompleted, C.green, `linear-gradient(135deg, ${C.green}, #10B981)`)}
              {kpiCard("Total Sims", totalSims, C.red, C.gradRed)}
            </div>
            {staffChartData.length > 0 && (
              <div style={{ ...glass, padding: 24, marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.teal }} /> Staff Training Progress
                </div>
                <ResponsiveContainer width="100%" height={Math.max(staffChartData.length * 50, 150)}>
                  <BarChart data={staffChartData} layout="vertical" barSize={18}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: C.ash, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fill: C.ash, fontSize: 12 }} axisLine={false} tickLine={false} width={70} />
                    <Tooltip contentStyle={{ background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: C.radiusSm, fontSize: 12 }} />
                    <Bar dataKey="progress" fill={C.teal} radius={[0, 6, 6, 0]} name="Progress %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {tab === 'staff' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>Team Training Progress</h2>
            {loading ? <div style={{ color: C.ash }}>Loading...</div> : staff.length === 0 ? (
              <div style={{ color: C.ash, padding: 24, textAlign: "center" }}>No staff members yet.</div>
            ) : staff.map((s, i) => {
              const isCurrentUser = s.user_id === user.id;
              return (
                <div key={i} style={{ ...glass, padding: 22, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{s.profile?.full_name || 'Unknown'} {isCurrentUser && <span style={{ fontSize: 10, color: C.gold }}>(You)</span>}</div>
                      <div style={{ fontSize: 12, color: C.ash }}>{(s.training_roles || []).join(', ') || 'No roles'}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ fontSize: 26, fontWeight: 800, color: C.teal }}>{getProgress(s)}%</div>
                      {!isCurrentUser && (
                        <button onClick={() => removeStaff(s)} disabled={removingId === s.user_id}
                          style={{ background: "none", border: `1px solid ${C.glassBorder}`, color: C.red, padding: "5px 12px", fontSize: 10, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusXs }}>Remove</button>
                      )}
                    </div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.06)", height: 5, borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ background: C.gradTeal, height: "100%", width: `${getProgress(s)}%`, transition: "width 0.3s", borderRadius: 999 }} />
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11, color: C.ash, flexWrap: "wrap" }}>
                    <span>XP: {s.xp || 0}</span>
                    <span>Modules: {(s.done_modules || []).length}/{M.length}</span>
                    <span>Sims: {s.sim_patients || 0}/3</span>
                    <span>{s.signed ? '✅ Signed' : '⏳ Not signed'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'invitations' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>Invite Staff</h2>
            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="staff@example.com" type="email"
                style={{ flex: 1, padding: "13px 18px", fontSize: 14, fontFamily: C.fn, border: `1.5px solid ${C.glassBorder}`, background: "rgba(255,255,255,0.04)", color: C.white, outline: "none", borderRadius: C.radiusSm }} />
              <button onClick={sendInvite}
                style={{ background: C.gradTeal, color: C.white, border: "none", padding: "13px 24px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusSm, boxShadow: "none"}}>Send Invite</button>
            </div>
            {invitations.map((inv, i) => (
              <div key={i} style={{ ...glass, padding: 18, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{inv.email}</div>
                  <div style={{ fontSize: 11, color: C.ash }}>
                    {inv.status === 'pending' ? '⏳ Pending' : inv.status === 'accepted' ? '✅ Accepted' : inv.status === 'requested' ? '📩 Request' : '❌ Revoked'}
                    {' · '}{new Date(inv.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {inv.status === 'requested' && <button onClick={() => approveRequest(inv)} style={{ background: C.green, color: C.white, border: "none", padding: "7px 16px", fontSize: 11, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusXs }}>Approve</button>}
                  {(inv.status === 'pending' || inv.status === 'requested') && <button onClick={() => revokeInvite(inv.id)} style={{ background: "none", border: `1px solid ${C.glassBorder}`, color: C.red, padding: "7px 16px", fontSize: 11, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusXs }}>{inv.status === 'requested' ? 'Deny' : 'Revoke'}</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'certificate' && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ ...glass, padding: "60px 40px", maxWidth: 620, margin: "0 auto", boxShadow: "none", borderColor: `${C.gold}20` }}>
              <div style={{ fontSize: 10, letterSpacing: 6, color: C.gold, textTransform: "uppercase", fontWeight: 700, marginBottom: 18 }}>Official Certification</div>
              <Logo size={42} light />
              <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 10, marginTop: 18 }}>Certified ByteSense Location</h2>
              <div style={{ fontSize: 20, color: C.teal, fontWeight: 700, marginBottom: 28 }}>{practiceData?.name || 'Your Practice'}</div>
              <p style={{ fontSize: 13, color: C.ash, lineHeight: 1.8, marginBottom: 28 }}>This practice has completed the ByteSense Practice Onboarding Program and is certified to deliver ByteSense health intelligence technology to patients.</p>
              <div style={{ fontSize: 12, color: C.gold }}>byteSense Inc. · {new Date().getFullYear()}</div>
            </div>
            <button onClick={() => window.print()} style={{ marginTop: 28, background: C.gradGold, color: C.dark, border: "none", padding: "13px 30px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusSm, boxShadow: "none"}}>Print Certificate</button>
          </div>
        )}
      </div>
    </div>
  );
}
