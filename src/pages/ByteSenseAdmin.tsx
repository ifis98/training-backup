import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { C } from '@/data/constants';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface RegCode {
  id: string;
  code: string;
  practice_name: string;
  rep_name: string;
  status: string;
  expires_at: string;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

interface DemoReq {
  id: string;
  name: string;
  email: string;
  practice_name: string;
  phone: string;
  message: string;
  status: string;
  created_at: string;
}

export default function ByteSenseAdmin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isBSAdmin, setIsBSAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<'codes' | 'practices' | 'demos'>('codes');

  // Codes
  const [codes, setCodes] = useState<RegCode[]>([]);
  const [newPracticeName, setNewPracticeName] = useState('');
  const [newRepName, setNewRepName] = useState('');
  const [batchCount, setBatchCount] = useState(1);

  // Practices
  const [practices, setPractices] = useState<any[]>([]);
  const [demos, setDemos] = useState<DemoReq[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }

    (async () => {
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
      const isAdmin = data?.some(r => r.role === 'bytesense_admin') ?? false;
      setIsBSAdmin(isAdmin);
      setChecking(false);
      if (!isAdmin) {
        toast.error('Access denied');
        navigate('/');
      }
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

  useEffect(() => {
    if (isBSAdmin) loadData();
  }, [isBSAdmin, loadData]);

  const generateCodes = async () => {
    if (!newPracticeName.trim()) { toast.error('Practice name required'); return; }
    try {
      const inserts = Array.from({ length: batchCount }, () => ({
        practice_name: newPracticeName.trim(),
        rep_name: newRepName.trim(),
      }));
      const { error } = await supabase.from('registration_codes').insert(inserts);
      if (error) throw error;
      toast.success(`${batchCount} code(s) generated!`);
      setNewPracticeName('');
      setNewRepName('');
      setBatchCount(1);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const revokeCode = async (id: string) => {
    await supabase.from('registration_codes').update({ status: 'revoked' }).eq('id', id);
    loadData();
    toast.success('Code revoked');
  };

  if (authLoading || checking) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.dark, color: C.ash, fontFamily: C.fn }}>Loading...</div>;
  }

  const inputStyle = {
    padding: "10px 14px", fontSize: 14, fontFamily: C.fn,
    border: `1px solid ${C.borderD}`, background: C.dark2, color: C.white,
    outline: "none", boxSizing: "border-box" as const, width: "100%",
  };

  const statusColor = (s: string) => s === 'active' ? C.green : s === 'used' ? C.teal : s === 'expired' ? C.amber : C.ash;

  return (
    <div style={{ fontFamily: C.fn, background: C.dark, minHeight: "100vh", color: C.white }}>
      {/* Header */}
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.borderD}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 3, color: C.red, textTransform: "uppercase", fontWeight: 700 }}>ByteSense HQ</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Admin Portal</div>
        </div>
        <button onClick={() => navigate('/')} style={{ background: "none", border: "none", color: C.ash, fontSize: 13, cursor: "pointer", fontFamily: C.fn }}>← Dashboard</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.borderD}` }}>
        {(['codes', 'practices', 'demos'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              flex: 1, padding: "12px", fontSize: 12, fontWeight: 700, fontFamily: C.fn,
              background: tab === t ? C.dark2 : "transparent", color: tab === t ? C.white : C.ash,
              border: "none", borderBottom: tab === t ? `2px solid ${C.red}` : "2px solid transparent",
              cursor: "pointer", textTransform: "uppercase", letterSpacing: 1.5,
            }}>
            {t === 'codes' ? '🔑 Codes' : t === 'practices' ? '🏥 Practices' : '📋 Demo Requests'}
          </button>
        ))}
      </div>

      <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        {/* CODES TAB */}
        {tab === 'codes' && (
          <>
            <div style={{ background: C.dark2, padding: 20, marginBottom: 24, border: `1px solid ${C.borderD}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Generate Registration Codes</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>Practice Name *</label>
                  <input value={newPracticeName} onChange={e => setNewPracticeName(e.target.value)} style={inputStyle} placeholder="Acme Dental" />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>Rep Name</label>
                  <input value={newRepName} onChange={e => setNewRepName(e.target.value)} style={inputStyle} placeholder="John Smith" />
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div>
                  <label style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>Count</label>
                  <input type="number" min={1} max={20} value={batchCount} onChange={e => setBatchCount(Number(e.target.value))} style={{ ...inputStyle, width: 80 }} />
                </div>
                <button onClick={generateCodes} style={{ background: C.red, color: "#fff", border: "none", padding: "10px 20px", fontSize: 13, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", marginTop: 18 }}>
                  Generate
                </button>
              </div>
            </div>

            <div style={{ fontSize: 12, color: C.ash, marginBottom: 12 }}>{codes.length} codes total</div>
            {codes.map(c => (
              <div key={c.id} style={{ background: C.dark2, padding: "12px 16px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${C.borderD}` }}>
                <div>
                  <span style={{ fontWeight: 800, letterSpacing: 3, fontSize: 16, color: C.white }}>{c.code}</span>
                  <span style={{ marginLeft: 12, fontSize: 12, color: C.ash }}>{c.practice_name}</span>
                  {c.rep_name && <span style={{ marginLeft: 8, fontSize: 11, color: C.slate }}>({c.rep_name})</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: statusColor(c.status), textTransform: "uppercase" }}>{c.status}</span>
                  <span style={{ fontSize: 10, color: C.ash }}>
                    exp: {new Date(c.expires_at).toLocaleDateString()}
                  </span>
                  {c.status === 'active' && (
                    <button onClick={() => revokeCode(c.id)} style={{ background: "none", border: `1px solid ${C.ash}`, color: C.ash, padding: "4px 10px", fontSize: 11, fontFamily: C.fn, cursor: "pointer" }}>Revoke</button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* PRACTICES TAB */}
        {tab === 'practices' && (
          <>
            <div style={{ fontSize: 12, color: C.ash, marginBottom: 12 }}>{practices.length} practices</div>
            {practices.map((p: any) => {
              const staffCount = p.profiles?.length || 0;
              const totalMods = p.training_progress?.reduce((sum: number, tp: any) => sum + (tp.done_modules?.length || 0), 0) || 0;
              return (
                <div key={p.id} style={{ background: C.dark2, padding: 16, marginBottom: 8, border: `1px solid ${C.borderD}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: C.ash }}>Code: {p.practice_code || 'N/A'} · Created: {new Date(p.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: C.teal }}>{staffCount}</div>
                      <div style={{ fontSize: 10, color: C.ash }}>staff</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: C.slate }}>
                    {totalMods} modules completed across team
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* DEMOS TAB */}
        {tab === 'demos' && (
          <>
            <div style={{ fontSize: 12, color: C.ash, marginBottom: 12 }}>{demos.length} requests</div>
            {demos.map(d => (
              <div key={d.id} style={{ background: C.dark2, padding: 16, marginBottom: 8, border: `1px solid ${C.borderD}` }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{d.name}</div>
                    <div style={{ fontSize: 12, color: C.ash }}>{d.email} · {d.phone}</div>
                    {d.practice_name && <div style={{ fontSize: 12, color: C.slate }}>{d.practice_name}</div>}
                    {d.message && <div style={{ fontSize: 12, color: C.slate, marginTop: 4 }}>{d.message}</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: d.status === 'new' ? C.amber : C.green, textTransform: "uppercase" }}>{d.status}</span>
                    <div style={{ fontSize: 10, color: C.ash, marginTop: 4 }}>{new Date(d.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
