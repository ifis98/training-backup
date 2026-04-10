import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { C } from '@/data/constants';
import { M } from '@/data/modules';
import { Logo } from '@/components/ByteSenseLogo';
import { toast } from 'sonner';

interface AdminDashboardProps {
  user: any;
  profile: any;
  onBack: () => void;
}

export default function AdminDashboard({ user, profile, onBack }: AdminDashboardProps) {
  const [staff, setStaff] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'staff' | 'invitations' | 'certificate'>('staff');
  const [practiceData, setPracticeData] = useState<any>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile?.practice_id) return;
    setLoading(true);

    const [staffRes, invRes, practiceRes] = await Promise.all([
      supabase
        .from('training_progress')
        .select('*')
        .eq('practice_id', profile.practice_id),
      supabase
        .from('staff_invitations')
        .select('*')
        .eq('practice_id', profile.practice_id)
        .order('created_at', { ascending: false }),
      supabase
        .from('practices')
        .select('*')
        .eq('id', profile.practice_id)
        .single(),
    ]);

    setPracticeData(practiceRes.data);

    if (staffRes.data) {
      const userIds = staffRes.data.map(s => s.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      const merged = staffRes.data.map(s => ({
        ...s,
        profile: profiles?.find(p => p.user_id === s.user_id),
      }));
      setStaff(merged);
    }

    setInvitations(invRes.data || []);
    setLoading(false);
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !profile?.practice_id) return;
    const { error } = await supabase.from('staff_invitations').insert({
      practice_id: profile.practice_id,
      email: inviteEmail.trim().toLowerCase(),
      invited_by: user.id,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      loadData();
    }
  };

  const revokeInvite = async (id: string) => {
    await supabase.from('staff_invitations').update({ status: 'revoked' }).eq('id', id);
    toast.success('Invitation revoked');
    loadData();
  };

  const approveRequest = async (inv: any) => {
    // Find the user by email and link to practice
    const { data: requestProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', inv.invited_by)
      .single();

    if (requestProfile) {
      await supabase.from('profiles').update({ practice_id: profile.practice_id }).eq('user_id', inv.invited_by);
      await supabase.from('user_roles').insert({ user_id: inv.invited_by, role: 'staff' as any });
      await supabase.from('training_progress').insert({ user_id: inv.invited_by, practice_id: profile.practice_id });
    }

    await supabase.from('staff_invitations').update({ status: 'accepted' }).eq('id', inv.id);
    toast.success('Request approved!');
    loadData();
  };

  const removeStaff = async (staffMember: any) => {
    if (!confirm(`Remove ${staffMember.profile?.full_name || 'this member'} from your practice? This will clear their training progress.`)) return;
    setRemovingId(staffMember.user_id);
    try {
      await supabase.from('training_progress').delete().eq('user_id', staffMember.user_id).eq('practice_id', profile.practice_id);
      await supabase.from('profiles').update({ practice_id: null }).eq('user_id', staffMember.user_id);
      toast.success('Staff member removed');
      loadData();
    } catch {
      toast.error('Failed to remove staff member');
    } finally {
      setRemovingId(null);
    }
  };

  const getProgress = (tp: any) => {
    const doneCount = (tp.done_modules || []).length;
    const total = M.length;
    return total > 0 ? Math.round((doneCount / total) * 100) : 0;
  };

  const tabStyle = (active: boolean) => ({
    background: active ? C.red : "transparent",
    color: active ? "#fff" : C.ash,
    border: active ? "none" : `1px solid ${C.borderD}`,
    padding: "10px 20px", fontSize: 13, fontWeight: 700 as const,
    fontFamily: C.fn, cursor: "pointer",
  });

  return (
    <div style={{ fontFamily: C.fn, background: C.dark, minHeight: "100vh", color: C.white }}>
      <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.borderD}` }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.ash, fontSize: 13, cursor: "pointer", fontFamily: C.fn }}>← Dashboard</button>
        <div style={{ fontSize: 10, letterSpacing: 3, color: C.gold, textTransform: "uppercase", fontWeight: 700 }}>Practice Admin</div>
        <div />
      </div>

      {/* Practice Code Banner */}
      {practiceData?.practice_code && (
        <div style={{ background: C.dark2, padding: "12px 24px", margin: "12px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 10, color: C.ash, letterSpacing: 2, textTransform: "uppercase" }}>Practice Join Code</div>
            <div style={{ fontSize: 11, color: C.ash, marginTop: 2 }}>Share this code with staff so they can request to join</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.gold, letterSpacing: 6, fontFamily: "monospace" }}>
            {practiceData.practice_code}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <button style={tabStyle(tab === 'staff')} onClick={() => setTab('staff')}>Staff Progress</button>
          <button style={tabStyle(tab === 'invitations')} onClick={() => setTab('invitations')}>Invitations</button>
          <button style={tabStyle(tab === 'certificate')} onClick={() => setTab('certificate')}>Practice Certificate</button>
        </div>

        {tab === 'staff' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Team Training Progress</h2>
            {loading ? (
              <div style={{ color: C.ash }}>Loading...</div>
            ) : staff.length === 0 ? (
              <div style={{ color: C.ash, padding: 24, textAlign: "center" }}>No staff members yet. Send invitations or share your practice code to get started.</div>
            ) : (
              staff.map((s, i) => {
                const isCurrentUser = s.user_id === user.id;
                return (
                  <div key={i} style={{ background: C.dark2, padding: 20, marginBottom: 12, border: `1px solid ${C.borderD}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>{s.profile?.full_name || 'Unknown'} {isCurrentUser && <span style={{ fontSize: 10, color: C.gold }}>(You)</span>}</div>
                        <div style={{ fontSize: 12, color: C.ash }}>{(s.training_roles || []).join(', ') || 'No roles selected'}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: C.teal }}>{getProgress(s)}%</div>
                        {!isCurrentUser && (
                          <button
                            onClick={() => removeStaff(s)}
                            disabled={removingId === s.user_id}
                            style={{ background: "none", border: `1px solid ${C.red}`, color: C.red, padding: "4px 10px", fontSize: 10, fontWeight: 700, fontFamily: C.fn, cursor: "pointer" }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ background: C.dark3, height: 6, overflow: "hidden" }}>
                      <div style={{ background: C.teal, height: "100%", width: `${getProgress(s)}%`, transition: "width 0.3s" }} />
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11, color: C.ash, flexWrap: "wrap" }}>
                      <span>XP: {s.xp || 0}</span>
                      <span>Modules: {(s.done_modules || []).length}/{M.length}</span>
                      <span>Simulations: {s.sim_patients || 0}/3</span>
                      <span>{s.signed ? '✅ Signed' : '⏳ Not signed'}</span>
                    </div>
                    {s.completed_at && (
                      <button
                        onClick={() => window.print()}
                        style={{ marginTop: 8, background: C.gold, color: C.dark, border: "none", padding: "6px 14px", fontSize: 11, fontWeight: 700, fontFamily: C.fn, cursor: "pointer" }}
                      >
                        Reprint Certificate
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === 'invitations' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Invite Staff</h2>
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              <input
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="staff@example.com"
                type="email"
                style={{
                  flex: 1, padding: "12px 16px", fontSize: 14, fontFamily: C.fn,
                  border: `1.5px solid ${C.borderD}`, background: C.dark2, color: C.white, outline: "none",
                }}
              />
              <button
                onClick={sendInvite}
                style={{ background: C.teal, color: C.white, border: "none", padding: "12px 24px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer" }}
              >
                Send Invite
              </button>
            </div>

            {invitations.map((inv, i) => (
              <div key={i} style={{ background: C.dark2, padding: 16, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${C.borderD}` }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{inv.email}</div>
                  <div style={{ fontSize: 11, color: C.ash }}>
                    {inv.status === 'pending' ? '⏳ Pending' : inv.status === 'accepted' ? '✅ Accepted' : inv.status === 'requested' ? '📩 Join Request' : '❌ Revoked'}
                    {' · '}{new Date(inv.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {inv.status === 'requested' && (
                    <button
                      onClick={() => approveRequest(inv)}
                      style={{ background: C.green, color: C.white, border: "none", padding: "6px 14px", fontSize: 11, fontWeight: 700, fontFamily: C.fn, cursor: "pointer" }}
                    >
                      Approve
                    </button>
                  )}
                  {(inv.status === 'pending' || inv.status === 'requested') && (
                    <button
                      onClick={() => revokeInvite(inv.id)}
                      style={{ background: "none", border: `1px solid ${C.red}`, color: C.red, padding: "6px 14px", fontSize: 11, fontWeight: 700, fontFamily: C.fn, cursor: "pointer" }}
                    >
                      {inv.status === 'requested' ? 'Deny' : 'Revoke'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'certificate' && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{
              border: `3px solid ${C.gold}`, padding: "60px 40px", maxWidth: 600, margin: "0 auto",
              background: `linear-gradient(135deg, ${C.dark2}, ${C.dark})`,
            }}>
              <div style={{ fontSize: 11, letterSpacing: 5, color: C.gold, textTransform: "uppercase", fontWeight: 700, marginBottom: 16 }}>
                Official Certification
              </div>
              <Logo size={40} light />
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, marginTop: 16 }}>
                Certified ByteSense Location
              </h2>
              <div style={{ fontSize: 18, color: C.teal, fontWeight: 700, marginBottom: 24 }}>
                {practiceData?.name || 'Your Practice'}
              </div>
              <p style={{ fontSize: 13, color: C.ash, lineHeight: 1.7, marginBottom: 24 }}>
                This practice has completed the ByteSense Practice Onboarding Program
                and is certified to deliver ByteSense health intelligence technology to patients.
              </p>
              <div style={{ fontSize: 12, color: C.gold }}>
                byteSense Inc. · {new Date().getFullYear()}
              </div>
            </div>
            <button
              onClick={() => window.print()}
              style={{ marginTop: 24, background: C.gold, color: C.dark, border: "none", padding: "12px 28px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer" }}
            >
              Print Certificate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
