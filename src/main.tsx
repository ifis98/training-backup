import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { Component, ReactNode } from "react";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("VITE_CLERK_PUBLISHABLE_KEY is not set in .env");
}

// Initialize Sentry as early as possible so even ClerkProvider errors are captured.
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
  });
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: { componentStack: string }) {
    Sentry.captureException(error, { contexts: { react: { componentStack: info.componentStack } } });
  }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0A0E", fontFamily: "monospace", padding: 24 }}>
          <div style={{ maxWidth: 600, color: "#fff" }}>
            <div style={{ color: "#FF5555", fontWeight: 700, fontSize: 16, marginBottom: 12 }}>App Error (React)</div>
            <div style={{ color: "#FF8888", fontSize: 13, marginBottom: 8 }}>{err.message}</div>
            <pre style={{ color: "#888", fontSize: 11, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{err.stack}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Catch async / unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
  const reason = e.reason instanceof Error ? e.reason : new Error(String(e.reason ?? 'Unknown async error'));
  Sentry.captureException(reason);
  const msg = reason.message || 'Unknown async error';
  document.getElementById('root')!.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0A0A0E;font-family:monospace;padding:24px">
      <div style="max-width:600px;color:#fff">
        <div style="color:#FF5555;font-weight:700;font-size:16px;margin-bottom:12px">App Error (Async)</div>
        <div style="color:#FF8888;font-size:13px;margin-bottom:8px">${msg}</div>
      </div>
    </div>`;
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </ErrorBoundary>
);
