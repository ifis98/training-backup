import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { Component, ReactNode } from "react";
import App from "./App.tsx";
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("VITE_CLERK_PUBLISHABLE_KEY is not set in .env");
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0A0E", fontFamily: "monospace", padding: 24 }}>
          <div style={{ maxWidth: 600, color: "#fff" }}>
            <div style={{ color: "#FF5555", fontWeight: 700, fontSize: 16, marginBottom: 12 }}>App Error</div>
            <div style={{ color: "#FF8888", fontSize: 13, marginBottom: 8 }}>{err.message}</div>
            <pre style={{ color: "#888", fontSize: 11, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{err.stack}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </ErrorBoundary>
);
