import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SignIn, SignUp, useUser, useClerk } from "@clerk/clerk-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Welcome from "./pages/Welcome";
import ByteSenseAdmin from "./pages/ByteSenseAdmin";
import NotFound from "./pages/NotFound";
import { C } from "@/data/constants";

const queryClient = new QueryClient();

const clerkAppearance = {
  variables: {
    colorBackground: C.dark2,
    colorText: C.white,
    colorTextSecondary: C.ash,
    colorInputBackground: C.dark,
    colorInputText: C.white,
    colorPrimary: C.red,
    colorDanger: "#FF3030",
    borderRadius: "0px",
    fontFamily: C.fn,
    fontSize: "15px",
  },
  elements: {
    // rootBox + cardBox + card all get overflow:hidden so the "Last seen"
    // / returning-user badge that Clerk inserts when a previous session
    // exists in the browser can't poke off the right edge.
    rootBox: { overflow: "hidden", maxWidth: "100%", width: "100%" },
    cardBox: { overflow: "hidden", maxWidth: "100%", width: "100%" },
    card: {
      boxShadow: "none",
      border: "none",
      background: "transparent",
      padding: 0,
      gap: 0,
      overflow: "hidden",
      maxWidth: "100%",
      width: "100%",
    },
    header: { display: "none" },
    socialButtonsBlockButton: {
      background: C.dark,
      border: `1px solid ${C.borderD}`,
      color: C.white,
      fontFamily: C.fn,
      fontWeight: 600,
      fontSize: 14,
      padding: "14px 28px",
      borderRadius: 0,
      "&:hover": { background: C.dark3 },
    },
    socialButtonsBlockButtonText: { color: C.white },
    dividerLine: { background: C.borderD },
    dividerText: { color: C.ash, fontSize: 11, letterSpacing: 2, textTransform: "uppercase" as const },
    formFieldLabel: {
      fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
      color: C.ash, textTransform: "uppercase" as const, fontFamily: C.fn,
    },
    formFieldInput: {
      background: C.dark,
      border: `1.5px solid ${C.borderD}`,
      color: C.white,
      fontFamily: C.fn,
      fontSize: 15,
      padding: "14px 16px",
      borderRadius: 0,
      "&:focus": { borderColor: C.teal, outline: "none" },
    },
    formButtonPrimary: {
      background: C.red,
      fontFamily: C.fn,
      fontWeight: 700,
      fontSize: 14,
      padding: "14px 28px",
      borderRadius: 0,
      letterSpacing: 0.3,
      "&:hover": { background: C.redL },
    },
    footerActionLink: { color: C.teal, fontFamily: C.fn },
    footerActionText: { color: C.ash, fontFamily: C.fn, fontSize: 13 },
    identityPreviewText: { color: C.white },
    identityPreviewEditButton: { color: C.teal },
    formHeaderTitle: { display: "none" },
    formHeaderSubtitle: { display: "none" },
    otpCodeFieldInput: {
      background: C.dark, border: `1.5px solid ${C.borderD}`,
      color: C.white, fontFamily: C.fn,
    },
    alertText: { color: C.white, fontFamily: C.fn },
    formResendCodeLink: { color: C.teal },
  },
};

// Stable, module-level appearance object for the SignIn widget. Hides the
// default Clerk "Don't have an account? Sign up" link in the widget footer
// (we render our own "Got a Code? →" link below it). MUST be a stable
// reference — passing a fresh object on every render caused Clerk to
// re-initialize the widget mid-flow, which re-fired the email verification
// request and sent two OTP emails per sign-in attempt.
const signInAppearance = {
  ...clerkAppearance,
  elements: {
    ...clerkAppearance.elements,
    footerAction: { display: "none" } as React.CSSProperties,
  },
};

/** Styled Clerk sign-in / sign-up screen matching ByteSense brand */
function AuthScreen({ mode }: { mode: "sign-in" | "sign-up" }) {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();

  // Invite code gate (sign-up only)
  const [codeInput, setCodeInput] = useState('');
  const [codeStatus, setCodeStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [codeError, setCodeError] = useState('');

  // Skip the gate if:
  //  (a) a registration code was already redeemed (practice invite), OR
  //  (b) a Clerk admin invitation ticket is present in the URL (__clerk_ticket)
  //
  // hasClerkTicket is frozen at mount via useState — reading
  // `window.location.search` on every render meant Clerk's SignUp flow
  // (which mutates URL params during CAPTCHA + verification) could flip
  // this value mid-flow, retrigger the effect below, and cause the
  // <SignUp> widget to remount. Each remount asks Clerk to re-send the
  // verification email — which is why the OTP screen "loaded twice" and
  // testers got two emails.
  const [hasClerkTicket] = useState(
    () => new URLSearchParams(window.location.search).has('__clerk_ticket'),
  );
  const [inviteAccepted, setInviteAccepted] = useState(
    () => !!localStorage.getItem('bsa6_invite') || hasClerkTicket
  );

  // AuthScreen is reused across /login (mode='sign-in') and /register
  // (mode='sign-up') — React reconciles them as the same component, so
  // useState's lazy initializer doesn't re-run on navigation. Re-read
  // localStorage when mode flips so a freshly-cleared invite triggers the
  // code gate on /register instead of falling through to Clerk's SignUp form.
  useEffect(() => {
    if (mode === 'sign-up') {
      setInviteAccepted(!!localStorage.getItem('bsa6_invite') || hasClerkTicket);
    }
  }, [mode, hasClerkTicket]);

  const handleCodeSubmit = async () => {
    const code = codeInput.trim().toUpperCase();
    if (!code || codeStatus === 'loading') return;
    setCodeStatus('loading');
    setCodeError('');
    try {
      const { data, error } = await supabase.rpc('redeem_registration_code', { _code: code });
      if (error) throw error;
      if (!data?.success) {
        setCodeStatus('error');
        setCodeError(data?.error || 'Invalid or expired code. Please try again.');
        return;
      }
      localStorage.setItem('bsa6_invite', JSON.stringify({
        code,
        practice_name: data.practice_name,
        rep_name: data.rep_name,
        redeemedAt: new Date().toISOString(),
      }));
      setInviteAccepted(true);
    } catch (err: any) {
      setCodeStatus('error');
      setCodeError(err.message || 'Something went wrong. Please try again.');
    }
  };

  // If already signed in, let them continue or sign out
  if (clerkUser) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: C.dark, fontFamily: C.fn,
      }}>
        <div style={{ maxWidth: 400, width: "100%", padding: "40px 24px", textAlign: "center" }}>
          <img src="/bytesense-logo.png" alt="ByteSense" onClick={() => navigate('/')}
            style={{ height: 36, marginBottom: 28, cursor: "pointer", filter: "drop-shadow(0 0 1px rgba(255,255,255,0.9))" }} />
          <p style={{ color: C.ash, fontSize: 14, marginBottom: 8 }}>Signed in as</p>
          <p style={{ color: C.white, fontSize: 16, fontWeight: 700, marginBottom: 32 }}>
            {clerkUser.primaryEmailAddress?.emailAddress}
          </p>
          <button onClick={() => navigate('/app')}
            style={{ width: "100%", background: C.red, color: "#fff", border: "none", padding: "14px", fontSize: 15, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", marginBottom: 12 }}>
            Continue to App →
          </button>
          <button onClick={() => signOut({ redirectUrl: '/login' })}
            style={{ width: "100%", background: "transparent", color: C.ash, border: `1px solid ${C.borderD}`, padding: "12px", fontSize: 14, fontFamily: C.fn, cursor: "pointer" }}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // Sign-up mode: show invite code gate if no valid invite yet
  if (mode === "sign-up" && !inviteAccepted) {
    const inputBase: React.CSSProperties = {
      width: "100%", padding: "13px 16px", fontSize: 15, fontFamily: C.fn,
      background: "rgba(255,255,255,0.04)", color: C.white, outline: "none",
      marginBottom: 0, borderRadius: 8, transition: "border-color 0.2s", boxSizing: "border-box",
    };
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.dark, fontFamily: C.fn }}>
        <div style={{ maxWidth: 420, width: "100%", padding: "40px 24px 48px" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <img src="/bytesense-logo.png" alt="ByteSense" onClick={() => navigate('/')}
              style={{ height: 36, marginBottom: 20, cursor: "pointer", filter: "drop-shadow(0 0 1px rgba(255,255,255,0.9)) drop-shadow(0 0 2px rgba(255,255,255,0.5))" }} />
            <div style={{ fontSize: 10, letterSpacing: 5, color: C.gold, textTransform: "uppercase", fontWeight: 700, marginBottom: 14 }}>
              Invite Only
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: C.white, marginBottom: 10, fontFamily: C.fn }}>
              Join ByteSense
            </h1>
            <p style={{ fontSize: 14, color: C.ash, fontFamily: C.fn, lineHeight: 1.6 }}>
              ByteSense Training is by invitation only.<br />Enter your invite code below to get started.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <input
              value={codeInput}
              onChange={e => {
                setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ''));
                setCodeStatus('idle');
                setCodeError('');
              }}
              onKeyDown={e => e.key === 'Enter' && handleCodeSubmit()}
              placeholder="ENTER CODE"
              maxLength={8}
              disabled={codeStatus === 'loading'}
              style={{
                ...inputBase,
                flex: 1, fontSize: 20, fontFamily: "monospace", fontWeight: 700,
                letterSpacing: 5, textAlign: "center", textTransform: "uppercase",
                border: `1.5px solid ${codeStatus === 'error' ? C.red : 'rgba(255,255,255,0.12)'}`,
              }}
            />
            <button
              onClick={handleCodeSubmit}
              disabled={!codeInput.trim() || codeStatus === 'loading'}
              style={{
                background: codeInput.trim() && codeStatus !== 'loading' ? C.red : "rgba(255,255,255,0.06)",
                color: codeInput.trim() && codeStatus !== 'loading' ? "#fff" : C.ash,
                border: "none", padding: "13px 22px", fontSize: 14, fontWeight: 800,
                fontFamily: C.fn, cursor: codeInput.trim() && codeStatus !== 'loading' ? "pointer" : "default",
                borderRadius: 8, transition: "all 0.2s", whiteSpace: "nowrap",
              }}>
              {codeStatus === 'loading' ? '···' : 'Continue →'}
            </button>
          </div>

          {codeStatus === 'error' && (
            <div style={{ fontSize: 12, color: C.red, textAlign: "center", marginBottom: 16 }}>{codeError}</div>
          )}

          <div style={{ textAlign: "center", marginTop: 28 }}>
            <span style={{ fontSize: 13, color: C.ash }}>Already have an account? </span>
            <button onClick={() => navigate('/login')}
              style={{ background: "none", border: "none", color: C.teal, fontSize: 13, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", padding: 0 }}>
              Sign in →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: C.dark, fontFamily: C.fn,
      overflowX: "hidden", // prevent Clerk widget's "last seen" badge from poking off-screen
    }}>
      <div style={{ maxWidth: 420, width: "100%", padding: "40px 24px 48px", overflow: "hidden" }}>
        {/* Header — same as original Auth.tsx */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <img src="/bytesense-logo.png" alt="ByteSense" onClick={() => navigate('/')}
            style={{ height: 36, marginBottom: 20, cursor: "pointer", filter: "drop-shadow(0 0 1px rgba(255,255,255,0.9)) drop-shadow(0 0 2px rgba(255,255,255,0.5))" }} />
          <h1 style={{ fontSize: 28, fontWeight: 800, color: C.white, marginBottom: 8, fontFamily: C.fn }}>
            {mode === "sign-in" ? "Welcome Back" : "Join ByteSense"}
          </h1>
          <p style={{ fontSize: 14, color: C.ash, fontFamily: C.fn }}>
            {mode === "sign-in" ? "Sign in to continue your training" : "Create your practice account"}
          </p>
        </div>

        {mode === "sign-in" ? (
          <>
            <SignIn
              routing="virtual"
              signUpUrl="/"
              afterSignInUrl="/app"
              appearance={signInAppearance}
            />
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button
                onClick={() => { localStorage.removeItem('bsa6_invite'); navigate('/register'); }}
                style={{
                  background: "none",
                  border: "none",
                  color: C.teal,
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: C.fn,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Got a Code? →
              </button>
            </div>
          </>
        ) : (
          <SignUp routing="virtual" signInUrl="/login" afterSignUpUrl="/app" appearance={clerkAppearance} />
        )}
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user: clerkUser, isLoaded } = useUser();
  const { loading, isByteSenseAdmin } = useAuth();

  if (!isLoaded || loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: C.dark, color: C.ash, fontFamily: C.fn,
      }}>
        Loading…
      </div>
    );
  }

  const isSignedIn = !!clerkUser;
  const appRoute = "/app";

  return (
    <>
      <Routes>
        {/* Root = public landing page */}
        <Route path="/" element={<Welcome />} />

        {/* Auth */}
        <Route path="/login/*" element={!isSignedIn ? <AuthScreen mode="sign-in" /> : <Navigate to={appRoute} />} />
        <Route path="/register/*" element={!isSignedIn ? <AuthScreen mode="sign-up" /> : <Navigate to={appRoute} />} />

        {/* Protected app — new users see intake, existing users see dashboard (handled inside Index) */}
        <Route path="/app" element={isSignedIn ? <Index /> : <Navigate to="/login" />} />

        {/* Section routes — each gets its own URL, sidebar always present */}
        <Route path="/sales-training"    element={isSignedIn ? <Index forcePhase="sales-training" />    : <Navigate to="/login" />} />
        <Route path="/product-experience" element={isSignedIn ? <Index forcePhase="product-experience" /> : <Navigate to="/login" />} />
        <Route path="/office-workflow"    element={isSignedIn ? <Index forcePhase="office-workflow" />    : <Navigate to="/login" />} />
        <Route path="/office-onboarding" element={isSignedIn ? <Index forcePhase="office-onboarding" /> : <Navigate to="/login" />} />
        <Route path="/roleplay"          element={isSignedIn ? <Index forcePhase="roleplay" />           : <Navigate to="/login" />} />
        <Route path="/ai-coach"          element={isSignedIn ? <Index forcePhase="ai-coach" />          : <Navigate to="/login" />} />
        <Route path="/ai-coach/:mode"    element={isSignedIn ? <Index forcePhase="ai-coach" />          : <Navigate to="/login" />} />
        <Route path="/contact-support"   element={isSignedIn ? <Index forcePhase="contact-support" />   : <Navigate to="/login" />} />

        <Route path="/staff" element={isSignedIn ? <Index forceView="staff" /> : <Navigate to="/login" />} />
        <Route path="/owner" element={isSignedIn ? <Index forceView="owner" /> : <Navigate to="/login" />} />
        <Route path="/bytesense-admin" element={isSignedIn ? <ByteSenseAdmin /> : <Navigate to="/login" />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
