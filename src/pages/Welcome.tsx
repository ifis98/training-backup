import { useNavigate } from 'react-router-dom';
import { C } from '@/data/constants';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: C.fn, background: C.dark, color: C.white, minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", padding: "60px 24px 40px", maxWidth: 800, margin: "0 auto" }}>
        <img src="/bytesense-logo.png" alt="ByteSense" style={{ height: 48, marginBottom: 32, filter: "drop-shadow(0 0 1px rgba(255,255,255,0.9)) drop-shadow(0 0 2px rgba(255,255,255,0.5))" }} />
        <div style={{ fontSize: 11, letterSpacing: 5, color: C.gold, textTransform: "uppercase", fontWeight: 700, marginBottom: 20 }}>
          Welcome to the Family
        </div>
        <h1 style={{ fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 800, letterSpacing: "-1px", lineHeight: 1.1, marginBottom: 20 }}>
          You're Not Just Adopting a Product.<br />
          <span style={{ color: C.teal }}>You're Joining a Movement.</span>
        </h1>
        <p style={{ fontSize: 18, color: C.ash, maxWidth: 560, margin: "0 auto 36px", lineHeight: 1.7 }}>
          ByteSense is redefining health intelligence — and your practice is now on the front line.
          Together, we're giving patients the power to understand what their body does while they sleep.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate('/register')}
            style={{ background: C.red, color: "#fff", border: "none", padding: "16px 40px", fontSize: 16, fontWeight: 800, fontFamily: C.fn, cursor: "pointer", letterSpacing: 0.5 }}
          >
            Join the ByteSense Family →
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{ background: "transparent", color: C.ash, border: `1px solid ${C.borderD}`, padding: "16px 32px", fontSize: 16, fontWeight: 600, fontFamily: C.fn, cursor: "pointer" }}
          >
            Sign In
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", justifyContent: "center", gap: 48, padding: "40px 24px", flexWrap: "wrap" }}>
        {[
          { n: "5", l: "Medical-Grade Sensors" },
          { n: "100", l: "Daily Health Score" },
          { n: "0", l: "Cost Marketing Flywheel" },
          { n: "∞", l: "Patient Advocacy Potential" },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: C.teal }}>{s.n}</div>
            <div style={{ fontSize: 12, color: C.ash, letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Value Props */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
          {[
            { icon: "◆", title: "Exclusive Partnership", desc: "You're one of a select group of practices chosen to bring health intelligence to your patients." },
            { icon: "○", title: "Comprehensive Training", desc: "Every team member — from front desk to doctor — gets role-specific onboarding built for confidence." },
            { icon: "□", title: "Proven Sales Psychology", desc: "Cialdini, Hormozi, Klaff — world-class persuasion frameworks adapted for dental." },
            { icon: "△", title: "Zero-Cost Growth", desc: "The flywheel effect: every patient becomes a referral engine. Growth without ad spend." },
          ].map((v, i) => (
            <div key={i} style={{ background: C.dark2, padding: 28, border: `1px solid ${C.borderD}` }}>
              <div style={{ fontSize: 24, color: C.teal, marginBottom: 12 }}>{v.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{v.title}</div>
              <div style={{ fontSize: 13, color: C.ash, lineHeight: 1.7 }}>{v.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Empowerment */}
      <div style={{ background: C.dark2, padding: "60px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: C.gold, textTransform: "uppercase", fontWeight: 700, marginBottom: 16 }}>
            Your Patients Are Counting on You
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>
            60–80% of people who grind their teeth<br />
            <span style={{ color: C.red }}>have no idea.</span>
          </h2>
          <p style={{ color: C.ash, fontSize: 15, lineHeight: 1.8, marginBottom: 32 }}>
            You have the power to change that. Every patient you educate, every conversation you start,
            every recommendation you make — you're protecting someone's health in a way no one else can.
            That's not just a job. That's a calling.
          </p>
          <button
            onClick={() => navigate('/register')}
            style={{ background: C.teal, color: C.white, border: "none", padding: "16px 40px", fontSize: 16, fontWeight: 800, fontFamily: C.fn, cursor: "pointer" }}
          >
            Start Your Training →
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", fontSize: 10, color: C.ash, padding: "24px" }}>
        byteSense Inc. · Proprietary · Confidential
      </div>
    </div>
  );
}
