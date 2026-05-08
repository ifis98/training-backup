import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SignIn, SignUp, useUser, useClerk } from "@clerk/clerk-react";
import { useAuth } from "@/hooks/useAuth";
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
    card: {
      boxShadow: "none",
      border: "none",
      background: "transparent",
      padding: 0,
      gap: 0,
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

/** Styled Clerk sign-in / sign-up screen matching ByteSense brand */
function AuthScreen({ mode }: { mode: "sign-in" | "sign-up" }) {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();

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

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: C.dark, fontFamily: C.fn,
    }}>
      <div style={{ maxWidth: 420, width: "100%", padding: "40px 24px 48px" }}>
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

        {mode === "sign-in"
          ? <SignIn routing="path" path="/login" signUpUrl="/register" afterSignInUrl="/app" appearance={clerkAppearance} />
          : <SignUp routing="path" path="/register" signInUrl="/login" afterSignUpUrl="/app" appearance={clerkAppearance} />
        }
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
  const appRoute = isByteSenseAdmin ? "/bytesense-admin" : "/app";

  return (
    <>
      <Routes>
        {/* Root = public landing page */}
        <Route path="/" element={<Welcome />} />

        {/* Auth */}
        <Route path="/login/*" element={!isSignedIn ? <AuthScreen mode="sign-in" /> : <Navigate to={appRoute} />} />
        <Route path="/register/*" element={!isSignedIn ? <AuthScreen mode="sign-up" /> : <Navigate to={appRoute} />} />

        {/* Protected app — new users see intake, existing users see dashboard (handled inside Index) */}
        <Route path="/app" element={isSignedIn ? (isByteSenseAdmin ? <Navigate to="/bytesense-admin" /> : <Index />) : <Navigate to="/login" />} />

        {/* Section routes — each gets its own URL, sidebar always present */}
        <Route path="/sales-training"    element={isSignedIn ? <Index forcePhase="sales-training" />    : <Navigate to="/login" />} />
        <Route path="/product-experience" element={isSignedIn ? <Index forcePhase="product-experience" /> : <Navigate to="/login" />} />
        <Route path="/office-workflow"   element={isSignedIn ? <Index forcePhase="office-workflow" />   : <Navigate to="/login" />} />
        <Route path="/roleplay"          element={isSignedIn ? <Index forcePhase="roleplay" />          : <Navigate to="/login" />} />
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
