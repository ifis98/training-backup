import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SignIn, SignUp, useUser } from "@clerk/clerk-react";
import { useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Welcome from "./pages/Welcome";
import ByteSenseAdmin from "./pages/ByteSenseAdmin";
import NotFound from "./pages/NotFound";
import DashboardSwitcher from "./components/DashboardSwitcher";
import { C } from "@/data/constants";

const queryClient = new QueryClient();

/** Centred Clerk-hosted sign-in / sign-up components */
function AuthScreen({ mode }: { mode: "sign-in" | "sign-up" }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: C.dark, fontFamily: C.fn,
    }}>
      {mode === "sign-in"
        ? <SignIn routing="path" path="/login" signUpUrl="/register" afterSignInUrl="/" />
        : <SignUp routing="path" path="/register" signInUrl="/login" afterSignUpUrl="/" />
      }
    </div>
  );
}

function AppRoutes() {
  const { user: clerkUser, isLoaded } = useUser();
  const { loading, isByteSenseAdmin, isSuperUser } = useAuth();

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
  const defaultRoute = (isByteSenseAdmin && !isSuperUser) ? "/bytesense-admin" : "/";

  return (
    <>
      <Routes>
        <Route path="/welcome" element={!isSignedIn ? <Welcome /> : <Navigate to={defaultRoute} />} />
        <Route path="/login/*" element={!isSignedIn ? <AuthScreen mode="sign-in" /> : <Navigate to={defaultRoute} />} />
        <Route path="/register/*" element={!isSignedIn ? <AuthScreen mode="sign-up" /> : <Navigate to={defaultRoute} />} />
        <Route path="/bytesense-admin" element={isSignedIn ? <ByteSenseAdmin /> : <Navigate to="/welcome" />} />
        <Route path="/staff" element={isSignedIn ? <Index forceView="staff" /> : <Navigate to="/welcome" />} />
        <Route path="/owner" element={isSignedIn ? <Index forceView="owner" /> : <Navigate to="/welcome" />} />
        <Route
          path="/"
          element={
            isSignedIn
              ? ((isByteSenseAdmin && !isSuperUser) ? <Navigate to="/bytesense-admin" /> : <Index />)
              : <Navigate to="/welcome" />
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {isSignedIn && isSuperUser && <DashboardSwitcher />}
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
