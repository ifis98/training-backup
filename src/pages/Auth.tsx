import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { C } from '@/data/constants';
import { toast } from 'sonner';

interface AuthPageProps {
  mode: 'login' | 'register';
}

export default function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [practiceName, setPracticeName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        if (data.user && !data.session) {
          toast.success('Check your email to verify your account!');
          return;
        }

        // Create practice and link profile
        if (data.user && data.session && practiceName.trim()) {
          const { data: practice } = await supabase
            .from('practices')
            .insert({ name: practiceName.trim(), owner_id: data.user.id })
            .select()
            .single();

          if (practice) {
            await supabase
              .from('profiles')
              .update({ practice_id: practice.id, full_name: fullName })
              .eq('user_id', data.user.id);

            await supabase
              .from('user_roles')
              .insert({ user_id: data.user.id, role: 'admin' });

            await supabase
              .from('training_progress')
              .insert({ user_id: data.user.id, practice_id: practice.id });
          }
        }

        toast.success('Account created! Check your email to verify.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message || 'Google sign-in failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Google sign-in failed');
    }
  };

  const inputStyle = {
    width: "100%", padding: "14px 16px", fontSize: 15, fontFamily: C.fn,
    border: `1.5px solid ${C.borderD}`, background: C.dark2, color: C.white,
    outline: "none", boxSizing: "border-box" as const, marginBottom: 0,
  };

  const labelStyle = {
    fontSize: 11, fontWeight: 700 as const, letterSpacing: 1.5, color: C.ash,
    textTransform: "uppercase" as const, display: "block", marginBottom: 6,
  };

  return (
    <div style={{ fontFamily: C.fn, background: C.dark, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: 420, width: "100%", padding: "40px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <img src="/bytesense-logo.png" alt="ByteSense" style={{ height: 36, marginBottom: 20 }} />
          <h1 style={{ fontSize: 28, fontWeight: 800, color: C.white, marginBottom: 8 }}>
            {mode === 'register' ? 'Join the ByteSense Family' : 'Welcome Back'}
          </h1>
          <p style={{ fontSize: 14, color: C.ash }}>
            {mode === 'register' ? 'Create your account to start training' : 'Sign in to continue your training'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Full Name</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Practice Name</label>
                <input value={practiceName} onChange={e => setPracticeName(e.target.value)} required style={inputStyle} />
              </div>
            </>
          )}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} style={inputStyle} />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: C.red, color: "#fff", border: "none", padding: "14px 28px",
              fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer",
              width: "100%", opacity: loading ? 0.6 : 1, marginBottom: 16,
            }}
          >
            {loading ? 'Please wait...' : mode === 'register' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: C.borderD }} />
          <span style={{ fontSize: 11, color: C.ash, textTransform: "uppercase", letterSpacing: 2 }}>or</span>
          <div style={{ flex: 1, height: 1, background: C.borderD }} />
        </div>

        <button
          onClick={handleGoogleSignIn}
          style={{
            background: C.dark2, color: C.white, border: `1px solid ${C.borderD}`,
            padding: "14px 28px", fontSize: 14, fontWeight: 600, fontFamily: C.fn,
            cursor: "pointer", width: "100%", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 10, marginBottom: 24,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        <div style={{ textAlign: "center", fontSize: 13, color: C.ash }}>
          {mode === 'register' ? (
            <>Already have an account? <a href="/login" style={{ color: C.teal, textDecoration: "none" }}>Sign in</a></>
          ) : (
            <>New to ByteSense? <a href="/register" style={{ color: C.teal, textDecoration: "none" }}>Create account</a></>
          )}
        </div>
      </div>
    </div>
  );
}
