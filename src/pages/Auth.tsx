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
  const [loading, setLoading] = useState(false);

  // Registration keycode flow
  const [step, setStep] = useState<'code' | 'form' | 'staff' | 'demo'>('code');
  const [regCode, setRegCode] = useState('');
  const [codeValid, setCodeValid] = useState(false);
  const [practiceName, setPracticeName] = useState('');
  const [codeId, setCodeId] = useState('');

  // Staff join flow
  const [practiceCode, setPracticeCode] = useState('');

  // Demo request
  const [demoPhone, setDemoPhone] = useState('');
  const [demoMessage, setDemoMessage] = useState('');
  const [demoSent, setDemoSent] = useState(false);

  const validateCode = async () => {
    if (regCode.trim().length < 4) {
      toast.error('Please enter a valid registration code');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('validate_registration_code', { _code: regCode.trim() });
      if (error) throw error;
      const result = data as any;
      if (result.valid) {
        setCodeValid(true);
        setPracticeName(result.practice_name || '');
        setCodeId(result.code_id || '');
        setStep('form');
        toast.success(`Code valid! Practice: ${result.practice_name}`);
      } else {
        toast.error(result.message || 'Invalid or expired code');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to validate code');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'register') {
        if (step === 'form' && codeValid) {
          // Practice owner registration with keycode
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName },
              emailRedirectTo: window.location.origin,
            },
          });
          if (error) {
            if (error.message?.toLowerCase().includes('already registered')) {
              toast.error('This email is already registered. Please sign in instead.');
              return;
            }
            throw error;
          }

          if (data.user && !data.session) {
            toast.success('Check your email to verify your account!');
            return;
          }

          if (data.user && data.session) {
            // Use the registration code
            await supabase.rpc('use_registration_code', { _code: regCode.trim(), _user_id: data.user.id });

            // Create practice
            const { data: practice } = await supabase
              .from('practices')
              .insert({ name: practiceName.trim(), owner_id: data.user.id })
              .select()
              .single();

            if (practice) {
              await supabase.from('profiles').update({ practice_id: practice.id, full_name: fullName }).eq('user_id', data.user.id);
              await supabase.from('user_roles').insert({ user_id: data.user.id, role: 'admin' });
              await supabase.from('training_progress').insert({ user_id: data.user.id, practice_id: practice.id });
            }
            toast.success('Account created! Welcome to ByteSense.');
          }
        } else if (step === 'staff') {
          // Staff joining existing practice
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName },
              emailRedirectTo: window.location.origin,
            },
          });
          if (error) {
            if (error.message?.toLowerCase().includes('already registered')) {
              toast.error('This email is already registered. Please sign in instead.');
              return;
            }
            throw error;
          }

          if (data.user && !data.session) {
            toast.success('Check your email to verify your account!');
            return;
          }

          if (data.user && data.session) {
            if (practiceCode.trim()) {
              const { data: practice } = await supabase
                .from('practices')
                .select('id, name')
                .eq('practice_code', practiceCode.trim().toUpperCase())
                .single();

              if (practice) {
                await supabase.from('staff_invitations').insert({
                  practice_id: practice.id,
                  email: email.trim().toLowerCase(),
                  invited_by: data.user.id,
                  status: 'requested',
                });
                await supabase.from('profiles').update({ full_name: fullName }).eq('user_id', data.user.id);
                toast.success(`Join request sent to ${practice.name}!`);
              } else {
                toast.error('Practice code not found. Check with your office manager.');
              }
            }
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id);

        const isByteSenseAdmin = roleData?.some(r => r.role === 'bytesense_admin') ?? false;
        navigate(isByteSenseAdmin ? '/bytesense-admin' : '/');
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('demo_requests').insert({
        name: fullName.trim(),
        email: email.trim(),
        practice_name: practiceName.trim(),
        phone: demoPhone.trim(),
        message: demoMessage.trim(),
      });
      if (error) throw error;
      setDemoSent(true);
      toast.success('Request submitted! Our team will reach out soon.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit request');
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
    outline: "none", boxSizing: "border-box" as const,
  };

  const labelStyle = {
    fontSize: 11, fontWeight: 700 as const, letterSpacing: 1.5, color: C.ash,
    textTransform: "uppercase" as const, display: "block", marginBottom: 6,
  };

  const btnStyle = (bg: string) => ({
    background: bg, color: "#fff", border: "none", padding: "14px 28px",
    fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer",
    width: "100%", opacity: loading ? 0.6 : 1,
  });

  return (
    <div style={{ fontFamily: C.fn, background: C.dark, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: 420, width: "100%", padding: "40px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <img
            src="/bytesense-logo.png"
            alt="ByteSense"
            onClick={() => navigate('/welcome')}
            style={{
              height: 36, marginBottom: 20, cursor: "pointer",
              filter: "drop-shadow(0 0 1px rgba(255,255,255,0.9)) drop-shadow(0 0 2px rgba(255,255,255,0.5))",
            }}
          />
          <h1 style={{ fontSize: 28, fontWeight: 800, color: C.white, marginBottom: 8 }}>
            {mode === 'register'
              ? (step === 'demo' ? 'Request a Demo' : 'Join ByteSense')
              : 'Welcome Back'}
          </h1>
          <p style={{ fontSize: 14, color: C.ash }}>
            {mode === 'register'
              ? (step === 'code' ? 'Enter your registration code from your ByteSense rep'
                : step === 'staff' ? 'Join your practice team'
                : step === 'demo' ? 'Learn how ByteSense can transform your practice'
                : `Setting up: ${practiceName}`)
              : 'Sign in to continue your training'}
          </p>
        </div>

        {/* LOGIN */}
        {mode === 'login' && (
          <>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} style={inputStyle} />
              </div>
              <button type="submit" disabled={loading} style={btnStyle(C.red)}>
                {loading ? 'Please wait...' : 'Sign In'}
              </button>
            </form>
            <Divider />
            <GoogleButton onClick={handleGoogleSignIn} />
            <div style={{ textAlign: "center", fontSize: 13, color: C.ash, marginTop: 24 }}>
              New to ByteSense? <a href="/register" style={{ color: C.teal, textDecoration: "none" }}>Create account</a>
            </div>
          </>
        )}

        {/* REGISTER — Step 1: Enter Code */}
        {mode === 'register' && step === 'code' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Registration Code</label>
              <input
                value={regCode}
                onChange={e => setRegCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABCD1234"
                maxLength={8}
                style={{ ...inputStyle, letterSpacing: 4, textAlign: "center", fontSize: 20, fontWeight: 800 }}
              />
              <div style={{ fontSize: 11, color: C.ash, marginTop: 6 }}>
                Your ByteSense sales representative will provide this code
              </div>
            </div>
            <button onClick={validateCode} disabled={loading} style={btnStyle(C.red)}>
              {loading ? 'Validating...' : 'Validate Code'}
            </button>

            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
              <button onClick={() => setStep('staff')}
                style={{ ...btnStyle("transparent"), border: `1px solid ${C.borderD}`, color: C.teal }}>
                I'm a staff member joining my practice
              </button>
              <button onClick={() => setStep('demo')}
                style={{ ...btnStyle("transparent"), border: `1px solid ${C.borderD}`, color: C.ash }}>
                Don't have a code? Request a Demo →
              </button>
            </div>

            <div style={{ textAlign: "center", fontSize: 13, color: C.ash, marginTop: 24 }}>
              Already have an account? <a href="/login" style={{ color: C.teal, textDecoration: "none" }}>Sign in</a>
            </div>
          </>
        )}

        {/* REGISTER — Step 2: Full Form (practice owner with valid code) */}
        {mode === 'register' && step === 'form' && codeValid && (
          <>
            <form onSubmit={handleSubmit}>
              <div style={{ background: "rgba(20,184,166,0.1)", border: `1px solid ${C.teal}`, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: C.teal }}>
                ✓ Code verified — Practice: <strong>{practiceName}</strong>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Full Name</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Practice Name</label>
                <input value={practiceName} onChange={e => setPracticeName(e.target.value)} required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} style={inputStyle} />
              </div>
              <button type="submit" disabled={loading} style={btnStyle(C.red)}>
                {loading ? 'Creating Account...' : 'Create Practice Account'}
              </button>
            </form>
            <button onClick={() => { setStep('code'); setCodeValid(false); }}
              style={{ marginTop: 12, background: "none", border: "none", color: C.ash, fontSize: 13, cursor: "pointer", fontFamily: C.fn }}>
              ← Use a different code
            </button>
          </>
        )}

        {/* REGISTER — Staff join */}
        {mode === 'register' && step === 'staff' && (
          <>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Full Name</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Practice Code (from your office manager)</label>
                <input
                  value={practiceCode}
                  onChange={e => setPracticeCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ABC123"
                  maxLength={6}
                  style={{ ...inputStyle, letterSpacing: 4, textAlign: "center", fontSize: 18, fontWeight: 800 }}
                />
                <div style={{ fontSize: 11, color: C.ash, marginTop: 4 }}>
                  Ask your practice owner for this 6-character code
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} style={inputStyle} />
              </div>
              <button type="submit" disabled={loading} style={btnStyle(C.red)}>
                {loading ? 'Please wait...' : 'Request to Join Practice'}
              </button>
            </form>
            <button onClick={() => setStep('code')}
              style={{ marginTop: 12, background: "none", border: "none", color: C.ash, fontSize: 13, cursor: "pointer", fontFamily: C.fn }}>
              ← Back to registration code
            </button>
          </>
        )}

        {/* REGISTER — Demo Request */}
        {mode === 'register' && step === 'demo' && (
          <>
            {demoSent ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
                <h2 style={{ color: C.white, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Request Received!</h2>
                <p style={{ color: C.ash, fontSize: 14, lineHeight: 1.6 }}>
                  Our team will reach out within 24 hours to schedule your demo and provide your unique registration code.
                </p>
                <button onClick={() => navigate('/welcome')} style={{ ...btnStyle(C.teal), marginTop: 24 }}>
                  Back to Home
                </button>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Your Name</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} required style={inputStyle} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Practice Name</label>
                  <input value={practiceName} onChange={e => setPracticeName(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Phone</label>
                  <input type="tel" value={demoPhone} onChange={e => setDemoPhone(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Message (optional)</label>
                  <textarea value={demoMessage} onChange={e => setDemoMessage(e.target.value)}
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical" as const }} />
                </div>
                <button type="submit" disabled={loading} style={btnStyle(C.teal)}>
                  {loading ? 'Submitting...' : 'Request Demo & Get Code'}
                </button>
              </form>
            )}
            {!demoSent && (
              <button onClick={() => setStep('code')}
                style={{ marginTop: 12, background: "none", border: "none", color: C.ash, fontSize: 13, cursor: "pointer", fontFamily: C.fn }}>
                ← I have a registration code
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
      <div style={{ flex: 1, height: 1, background: C.borderD }} />
      <span style={{ fontSize: 11, color: C.ash, textTransform: "uppercase", letterSpacing: 2 }}>or</span>
      <div style={{ flex: 1, height: 1, background: C.borderD }} />
    </div>
  );
}

function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: C.dark2, color: C.white, border: `1px solid ${C.borderD}`,
        padding: "14px 28px", fontSize: 14, fontWeight: 600, fontFamily: C.fn,
        cursor: "pointer", width: "100%", display: "flex", alignItems: "center",
        justifyContent: "center", gap: 10,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
      Continue with Google
    </button>
  );
}
