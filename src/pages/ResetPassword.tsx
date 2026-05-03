import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { C } from '@/data/constants';
import { toast } from 'sonner';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase puts the recovery token in the URL hash; the client picks it up
    // automatically via onAuthStateChange (PASSWORD_RECOVERY event).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });
    // Fallback — if hash already processed, allow form anyway after a tick
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated! Signing you in…');
      setTimeout(() => navigate('/app'), 800);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '14px 16px', fontSize: 15, fontFamily: C.fn,
    border: `1.5px solid ${C.borderD}`, background: C.dark2, color: C.white,
    outline: 'none', boxSizing: 'border-box' as const, borderRadius: C.radiusSm,
  };

  return (
    <div style={{ fontFamily: C.fn, background: C.dark, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 420, width: '100%', padding: '40px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/bytesense-logo.png" alt="ByteSense" style={{ height: 36, marginBottom: 20, filter: 'drop-shadow(0 0 1px rgba(255,255,255,0.9))' }} />
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.white, marginBottom: 8 }}>Set a new password</h1>
          <p style={{ fontSize: 14, color: C.ash }}>
            {ready ? 'Choose a strong password for your account' : 'Verifying your reset link…'}
          </p>
        </div>
        {ready && (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: C.ash, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>New password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: C.ash, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Confirm password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={8} style={inputStyle} />
            </div>
            <button type="submit" disabled={loading} style={{ background: C.gradRed, color: '#fff', border: 'none', padding: '14px 28px', fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: 'pointer', width: '100%', borderRadius: C.radiusSm, opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <a href="/login" style={{ color: C.teal, fontSize: 13, textDecoration: 'none' }}>← Back to sign in</a>
        </div>
      </div>
    </div>
  );
}