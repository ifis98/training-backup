import { C } from '@/data/constants';
import { Logo } from '@/components/ByteSenseLogo';
import { scrollTop } from '@/lib/helpers';
import { AppState } from '@/hooks/useAppState';

interface SplashProps {
  s: AppState;
  u: (d: Partial<AppState>) => void;
}

export default function Splash({ s, u }: SplashProps) {
  return (
    <div style={{ fontFamily: C.fn, background: C.white, minHeight: "100vh" }}>
      <div style={{ background: C.dark, color: C.white, padding: "48px 24px 52px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <Logo size={40} />
        </div>
        <div style={{ fontSize: 10, letterSpacing: 4, color: C.ash, marginBottom: 24, textTransform: "uppercase" }}>Practice Onboarding</div>
        <h1 style={{ fontSize: "clamp(26px, 5vw, 38px)", fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1.15, marginBottom: 14 }}>
          Welcome to the<br />ByteSense Team
        </h1>
        <p style={{ fontSize: 15, color: C.ash, maxWidth: 460, margin: "0 auto", lineHeight: 1.7 }}>
          This onboarding prepares you to confidently educate patients and integrate ByteSense into your practice.
        </p>
      </div>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "36px 24px" }}>
        {[["Your Full Name", "name"] as const, ["Practice Name", "practice"] as const].map(([label, key]) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: C.ash, textTransform: "uppercase", display: "block", marginBottom: 6 }}>{label}</label>
            <input
              value={s[key]}
              onChange={e => u({ [key]: e.target.value })}
              style={{ width: "100%", padding: "14px 16px", fontSize: 15, fontFamily: C.fn, border: `1.5px solid ${C.mist}`, background: C.snow, outline: "none", boxSizing: "border-box" }}
            />
          </div>
        ))}
        <button
          onClick={() => { if (s.name.trim()) { u({ phase: "setup", seed: Date.now() % 100000 }); scrollTop(); } }}
          style={{ background: C.red, color: "#fff", border: "none", padding: "14px 28px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", width: "100%", opacity: s.name.trim() ? 1 : 0.4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          Get Started
        </button>
      </div>
      <div style={{ textAlign: "center", fontSize: 10, color: C.ash, padding: "0 24px 24px" }}>
        byteSense Inc. · Proprietary · Confidential
      </div>
    </div>
  );
}
