import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Welcome from "./pages/Welcome";
import AuthPage from "./pages/Auth";
import ByteSenseAdmin from "./pages/ByteSenseAdmin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading, isByteSenseAdmin } = useAuth();

  const defaultAuthenticatedRoute = isByteSenseAdmin ? "/bytesense-admin" : "/";

  if (loading) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0C0C0E", color: "#9898A8", fontFamily: "'Outfit', sans-serif" }}>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/welcome" element={!user ? <Welcome /> : <Navigate to={defaultAuthenticatedRoute} />} />
      <Route path="/login" element={!user ? <AuthPage mode="login" /> : <Navigate to={defaultAuthenticatedRoute} />} />
      <Route path="/register" element={!user ? <AuthPage mode="register" /> : <Navigate to={defaultAuthenticatedRoute} />} />
      <Route path="/bytesense-admin" element={<ByteSenseAdmin />} />
      <Route path="/" element={user ? (isByteSenseAdmin ? <Navigate to="/bytesense-admin" /> : <Index />) : <Navigate to="/welcome" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
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
