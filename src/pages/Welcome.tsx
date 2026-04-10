import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '@/data/constants';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SCANNERS = ['Medit', 'iTero', '3Shape TRIOS', 'Planmeca', 'Carestream', 'Dentsply Sirona', 'Other'];
const GOALS_LIST = [
  'Increase case acceptance', 'Add new revenue stream', 'Improve patient education',
  'Reduce treatment coordinator burden', 'Differentiate from competitors', 'Expand wellness offerings',
];

const glass = {
  background: C.glass, backdropFilter: C.blur, WebkitBackdropFilter: C.blur,
  border: `1px solid ${C.glassBorder}`, borderRadius: C.radius,
} as React.CSSProperties;

export default function Welcome() {
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [demoData, setDemoData] = useState({
    name: '', email: '', phone: '', practice_name: '', message: '',
    operatories: 4, monthly_patients: 200, guards_per_month: 3, guard_price: 500,
    has_scanner: false, scanner_type: '', goals: [] as string[], practice_size: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [revPatients, setRevPatients] = useState(200);
  const [revPrice, setRevPrice] = useState(2500);
  const [revClose, setRevClose] = useState(15);
  const currentRev = revPatients * (revClose / 100) * revPrice;
  const projectedClose = Math.min(revClose * 2.5, 80);
  const projectedRev = revPatients * (projectedClose / 100) * revPrice;

  const submitDemo = async () => {
    if (!demoData.name.trim() || !demoData.email.trim()) { toast.error('Please fill in name and email'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('demo_requests').insert({
      name: demoData.name.trim(), email: demoData.email.trim(), phone: demoData.phone,
      practice_name: demoData.practice_name, message: demoData.message,
      operatories: demoData.operatories, monthly_patients: demoData.monthly_patients,
      guards_per_month: demoData.guards_per_month, guard_price: demoData.guard_price,
      has_scanner: demoData.has_scanner, scanner_type: demoData.scanner_type,
      goals: demoData.goals, practice_size: demoData.practice_size,
    } as any);
    setSubmitting(false);
    if (error) { toast.error('Something went wrong'); } else {
      toast.success('Demo request submitted!'); setShowDemo(false); setDemoStep(0);
    }
  };

  const toggleGoal = (g: string) => {
    setDemoData(d => ({ ...d, goals: d.goals.includes(g) ? d.goals.filter(x => x !== g) : [...d.goals, g] }));
  };

  const inputStyle = {
    width: "100%", padding: "14px 18px", fontSize: 15, fontFamily: C.fn,
    background: "rgba(255,255,255,0.04)", border: `1.5px solid ${C.glassBorder}`,
    color: C.white, outline: "none", marginBottom: 14, borderRadius: C.radiusSm,
    transition: "border-color 0.2s",
  };

  return (
    <div style={{ fontFamily: C.fn, background: `radial-gradient(ellipse at top, #1a1a28, ${C.dark})`, color: C.white, minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", padding: "70px 24px 50px", maxWidth: 840, margin: "0 auto", animation: "float-up 0.6s ease-out" }}>
        <img src="/bytesense-logo.png" alt="ByteSense" style={{ height: 50, marginBottom: 36, filter: "drop-shadow(0 0 1px rgba(255,255,255,0.9)) drop-shadow(0 0 2px rgba(255,255,255,0.5))" }} />
        <div style={{ fontSize: 11, letterSpacing: 6, color: C.gold, textTransform: "uppercase", fontWeight: 700, marginBottom: 22 }}>
          Welcome to the Family
        </div>
        <h1 style={{ fontSize: "clamp(34px, 6vw, 58px)", fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1.08, marginBottom: 22 }}>
          You're Not Just Adopting a Product.<br />
          <span style={{ background: C.gradTeal, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>You're Joining a Movement.</span>
        </h1>
        <p style={{ fontSize: 18, color: C.ash, maxWidth: 580, margin: "0 auto 40px", lineHeight: 1.7 }}>
          ByteSense is redefining health intelligence — and your practice is now on the front line.
          Together, we're giving patients the power to understand what their body does while they sleep.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate('/register')}
            style={{ background: C.gradRed, color: "#fff", border: "none", padding: "16px 40px", fontSize: 16, fontWeight: 800, fontFamily: C.fn, cursor: "pointer", letterSpacing: 0.5, borderRadius: C.radiusSm, boxShadow: C.glow(C.red, 0.3), transition: "all 0.3s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
            Join the ByteSense Family →
          </button>
          <button onClick={() => setShowDemo(true)}
            style={{ background: C.gradTeal, color: "#fff", border: "none", padding: "16px 32px", fontSize: 16, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusSm, boxShadow: C.glow(C.teal, 0.25), transition: "all 0.3s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
            Request a Demo
          </button>
          <button onClick={() => navigate('/login')}
            style={{ background: "rgba(255,255,255,0.05)", color: C.ash, border: `1px solid ${C.glassBorder}`, padding: "16px 32px", fontSize: 16, fontWeight: 600, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusSm, transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.glassHover}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.glassBorder}>
            Sign In
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", justifyContent: "center", gap: 52, padding: "40px 24px", flexWrap: "wrap" }}>
        {[
          { n: "6", l: "Medical-Grade Sensors" },
          { n: "100", l: "Daily Health Score" },
          { n: "0", l: "Cost Marketing Flywheel" },
          { n: "∞", l: "Patient Advocacy Potential" },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 42, fontWeight: 800, background: C.gradTeal, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.n}</div>
            <div style={{ fontSize: 11, color: C.ash, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 4 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Revenue Calculator */}
      <div style={{ maxWidth: 840, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ ...glass, padding: 36 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 10, letterSpacing: 5, color: C.gold, textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>Revenue Calculator</div>
            <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8 }}>See Your <span style={{ background: C.gradTeal, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Revenue Potential</span></h2>
            <p style={{ color: C.ash, fontSize: 14 }}>Adjust the sliders to see how ByteSense can impact your bottom line</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginBottom: 28 }}>
            {[
              { label: "Patients / Month", value: revPatients, min: 50, max: 800, step: 1, set: setRevPatients, color: C.teal, format: (v: number) => `${v}` },
              { label: "Avg Case Price ($)", value: revPrice, min: 500, max: 5000, step: 100, set: setRevPrice, color: C.gold, format: (v: number) => `$${v.toLocaleString()}` },
              { label: "Current Close Rate (%)", value: revClose, min: 5, max: 60, step: 1, set: setRevClose, color: C.red, format: (v: number) => `${v}%` },
            ].map((sl, i) => (
              <div key={i}>
                <label style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, display: "block", marginBottom: 8 }}>{sl.label}</label>
                <input type="range" min={sl.min} max={sl.max} step={sl.step} value={sl.value} onChange={e => sl.set(+e.target.value)} style={{ width: "100%", accentColor: sl.color, height: 4 }} />
                <div style={{ fontSize: 24, fontWeight: 800, color: sl.color, marginTop: 6 }}>{sl.format(sl.value)}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: 24, textAlign: "center", borderRadius: C.radiusSm, border: `1px solid ${C.glassBorder}` }}>
              <div style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Current Monthly Revenue</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: C.ash }}>${currentRev.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: C.slate, marginTop: 4 }}>{revClose}% close rate</div>
            </div>
            <div style={{ background: `rgba(20,184,166,0.06)`, padding: 24, textAlign: "center", borderRadius: C.radiusSm, border: `1px solid ${C.teal}25`, boxShadow: C.glow(C.teal, 0.08) }}>
              <div style={{ fontSize: 10, color: C.teal, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>With ByteSense</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: C.teal }}>${projectedRev.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: C.teal, marginTop: 4 }}>{projectedClose.toFixed(0)}% projected close rate</div>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 18, fontSize: 14, color: C.gold, fontWeight: 700 }}>
            +${(projectedRev - currentRev).toLocaleString()}/month · ${((projectedRev - currentRev) * 12).toLocaleString()}/year potential uplift
          </div>
        </div>
      </div>

      {/* Value Props */}
      <div style={{ maxWidth: 840, margin: "0 auto", padding: "40px 24px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
          {[
            { icon: "◆", title: "Exclusive Partnership", desc: "You're one of a select group of practices chosen to bring health intelligence to your patients.", color: C.red },
            { icon: "○", title: "Comprehensive Training", desc: "Every team member — from front desk to doctor — gets role-specific onboarding built for confidence.", color: C.teal },
            { icon: "□", title: "Proven Sales Psychology", desc: "Cialdini, Hormozi, Klaff — world-class persuasion frameworks adapted for dental.", color: C.violet },
            { icon: "△", title: "Zero-Cost Growth", desc: "The flywheel effect: every patient becomes a referral engine. Growth without ad spend.", color: C.gold },
          ].map((v, i) => (
            <div key={i} style={{ ...glass, padding: 28, transition: "all 0.3s", cursor: "default" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${v.color}30`; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = C.glow(v.color, 0.1); }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.glassBorder; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ width: 40, height: 40, borderRadius: C.radiusSm, background: `${v.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: v.color, marginBottom: 14 }}>{v.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{v.title}</div>
              <div style={{ fontSize: 13, color: C.ash, lineHeight: 1.7 }}>{v.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Empowerment */}
      <div style={{ background: "rgba(20,20,28,0.5)", backdropFilter: C.blur, padding: "70px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 660, margin: "0 auto" }}>
          <div style={{ fontSize: 10, letterSpacing: 5, color: C.gold, textTransform: "uppercase", fontWeight: 700, marginBottom: 18 }}>
            Your Patients Are Counting on You
          </div>
          <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 18, lineHeight: 1.2 }}>
            60–80% of people who grind their teeth<br />
            <span style={{ color: C.red }}>have no idea.</span>
          </h2>
          <p style={{ color: C.ash, fontSize: 15, lineHeight: 1.8, marginBottom: 36 }}>
            You have the power to change that. Every patient you educate, every conversation you start,
            every recommendation you make — you're protecting someone's health in a way no one else can.
          </p>
          <button onClick={() => navigate('/register')}
            style={{ background: C.gradTeal, color: C.white, border: "none", padding: "16px 40px", fontSize: 16, fontWeight: 800, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusSm, boxShadow: C.glow(C.teal, 0.25) }}>
            Start Your Training →
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", fontSize: 10, color: C.ash, padding: "28px", opacity: 0.6 }}>
        byteSense Inc. · Proprietary · Confidential
      </div>

      {/* Full-Screen Demo Request Modal */}
      {showDemo && (
        <div style={{ position: "fixed", inset: 0, background: `radial-gradient(ellipse at top, #1a1a28, ${C.dark})`, zIndex: 1000, overflow: "auto" }}>
          <div style={{ maxWidth: 660, margin: "0 auto", padding: "40px 24px", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
              <img src="/bytesense-logo.png" alt="ByteSense" style={{ height: 34, filter: "drop-shadow(0 0 1px rgba(255,255,255,0.9))" }} />
              <button onClick={() => { setShowDemo(false); setDemoStep(0); }}
                style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${C.glassBorder}`, color: C.ash, width: 36, height: 36, borderRadius: C.radiusSm, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            {/* Progress dots */}
            <div style={{ display: "flex", gap: 8, marginBottom: 36, justifyContent: "center" }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{
                  width: i <= demoStep ? 28 : 8, height: 8,
                  borderRadius: 999,
                  background: i <= demoStep ? C.gradTeal : "rgba(255,255,255,0.08)",
                  transition: "all 0.4s",
                  boxShadow: i === demoStep ? C.glow(C.teal, 0.3) : "none",
                }} />
              ))}
            </div>

            {/* Step 0 */}
            {demoStep === 0 && (
              <div style={{ flex: 1, animation: "float-up 0.3s ease-out" }}>
                <div style={{ fontSize: 10, letterSpacing: 5, color: C.gold, textTransform: "uppercase", fontWeight: 700, marginBottom: 14 }}>Step 1 of 4</div>
                <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8 }}>Tell Us About You</h2>
                <p style={{ color: C.ash, fontSize: 14, marginBottom: 28 }}>We'd love to learn more about you and your practice.</p>
                <input value={demoData.name} onChange={e => setDemoData({ ...demoData, name: e.target.value })} placeholder="Your Full Name *" style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = `${C.teal}60`} onBlur={e => e.currentTarget.style.borderColor = C.glassBorder} />
                <input value={demoData.email} onChange={e => setDemoData({ ...demoData, email: e.target.value })} placeholder="Email Address *" type="email" style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = `${C.teal}60`} onBlur={e => e.currentTarget.style.borderColor = C.glassBorder} />
                <input value={demoData.phone} onChange={e => setDemoData({ ...demoData, phone: e.target.value })} placeholder="Phone Number" type="tel" style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = `${C.teal}60`} onBlur={e => e.currentTarget.style.borderColor = C.glassBorder} />
                <input value={demoData.practice_name} onChange={e => setDemoData({ ...demoData, practice_name: e.target.value })} placeholder="Practice Name" style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = `${C.teal}60`} onBlur={e => e.currentTarget.style.borderColor = C.glassBorder} />
                <select value={demoData.practice_size} onChange={e => setDemoData({ ...demoData, practice_size: e.target.value })}
                  style={{ ...inputStyle, appearance: "auto" as any, colorScheme: "dark" }}>
                  <option value="" style={{ background: C.dark, color: C.ash }}>Practice Size</option>
                  <option value="solo" style={{ background: C.dark, color: C.white }}>Solo Practice</option>
                  <option value="small" style={{ background: C.dark, color: C.white }}>Small (2-3 providers)</option>
                  <option value="medium" style={{ background: C.dark, color: C.white }}>Medium (4-6 providers)</option>
                  <option value="large" style={{ background: C.dark, color: C.white }}>Large (7+ providers)</option>
                  <option value="dso" style={{ background: C.dark, color: C.white }}>DSO / Multi-Location</option>
                </select>
                <button onClick={() => { if (!demoData.name.trim() || !demoData.email.trim()) { toast.error('Name and email required'); return; } setDemoStep(1); }}
                  style={{ background: C.gradRed, color: "#fff", border: "none", padding: "16px", fontSize: 16, fontWeight: 800, fontFamily: C.fn, cursor: "pointer", width: "100%", marginTop: 8, borderRadius: C.radiusSm, boxShadow: C.glow(C.red, 0.2) }}>
                  Continue →
                </button>
              </div>
            )}

            {/* Step 1 */}
            {demoStep === 1 && (
              <div style={{ flex: 1, animation: "float-up 0.3s ease-out" }}>
                <div style={{ fontSize: 10, letterSpacing: 5, color: C.gold, textTransform: "uppercase", fontWeight: 700, marginBottom: 14 }}>Step 2 of 4</div>
                <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8 }}>Practice Details</h2>
                <p style={{ color: C.ash, fontSize: 14, marginBottom: 28 }}>Help us understand your current setup.</p>
                {[
                  { label: "Number of Operatories", key: "operatories" as const, min: 1, max: 20, step: 1, color: C.teal, format: (v: number) => `${v}` },
                  { label: "Monthly Patient Volume", key: "monthly_patients" as const, min: 50, max: 1000, step: 10, color: C.gold, format: (v: number) => `${v}` },
                  { label: "Current Guards Sold / Month", key: "guards_per_month" as const, min: 0, max: 50, step: 1, color: C.red, format: (v: number) => `${v}` },
                  { label: "Average Guard Price ($)", key: "guard_price" as const, min: 100, max: 3000, step: 50, color: C.amber, format: (v: number) => `$${v}` },
                ].map((sl, i) => (
                  <div key={i} style={{ marginBottom: 22 }}>
                    <label style={{ fontSize: 12, color: C.ash, display: "block", marginBottom: 8 }}>{sl.label}</label>
                    <input type="range" min={sl.min} max={sl.max} step={sl.step} value={demoData[sl.key] as number}
                      onChange={e => setDemoData({ ...demoData, [sl.key]: +e.target.value })}
                      style={{ width: "100%", accentColor: sl.color, height: 4 }} />
                    <div style={{ fontSize: 22, fontWeight: 800, color: sl.color, marginTop: 4 }}>{sl.format(demoData[sl.key] as number)}</div>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button onClick={() => setDemoStep(0)} style={{ background: "rgba(255,255,255,0.05)", color: C.ash, border: `1px solid ${C.glassBorder}`, padding: "16px 24px", fontSize: 16, fontWeight: 600, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusSm }}>← Back</button>
                  <button onClick={() => setDemoStep(2)} style={{ flex: 1, background: C.gradRed, color: "#fff", border: "none", padding: "16px", fontSize: 16, fontWeight: 800, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusSm, boxShadow: C.glow(C.red, 0.2) }}>Continue →</button>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {demoStep === 2 && (
              <div style={{ flex: 1, animation: "float-up 0.3s ease-out" }}>
                <div style={{ fontSize: 10, letterSpacing: 5, color: C.gold, textTransform: "uppercase", fontWeight: 700, marginBottom: 14 }}>Step 3 of 4</div>
                <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8 }}>Technology & Goals</h2>
                <p style={{ color: C.ash, fontSize: 14, marginBottom: 28 }}>Tell us about your current technology and what you hope to achieve.</p>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 13, color: C.white, fontWeight: 700, display: "block", marginBottom: 14 }}>Do you have an intraoral scanner?</label>
                  <div style={{ display: "flex", gap: 14 }}>
                    {[true, false].map(val => (
                      <div key={String(val)} onClick={() => setDemoData({ ...demoData, has_scanner: val, scanner_type: val ? demoData.scanner_type : '' })}
                        style={{ flex: 1, background: demoData.has_scanner === val ? `${C.teal}10` : "rgba(255,255,255,0.03)", border: `1.5px solid ${demoData.has_scanner === val ? C.teal : C.glassBorder}`, padding: "16px", textAlign: "center", cursor: "pointer", fontSize: 14, fontWeight: 700, borderRadius: C.radiusSm, transition: "all 0.2s" }}>
                        {val ? 'Yes' : 'No'}
                      </div>
                    ))}
                  </div>
                </div>

                {demoData.has_scanner && (
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: 12, color: C.ash, display: "block", marginBottom: 10 }}>Which scanner?</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {SCANNERS.map(sc => (
                        <div key={sc} onClick={() => setDemoData({ ...demoData, scanner_type: sc })}
                          style={{ padding: "9px 18px", background: demoData.scanner_type === sc ? `${C.teal}15` : "rgba(255,255,255,0.03)", border: `1px solid ${demoData.scanner_type === sc ? C.teal : C.glassBorder}`, cursor: "pointer", fontSize: 12, fontWeight: 600, borderRadius: 999, transition: "all 0.2s" }}>
                          {sc}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 13, color: C.white, fontWeight: 700, display: "block", marginBottom: 14 }}>What are your goals with ByteSense?</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {GOALS_LIST.map(g => (
                      <div key={g} onClick={() => toggleGoal(g)}
                        style={{ padding: "13px 16px", background: demoData.goals.includes(g) ? `${C.teal}10` : "rgba(255,255,255,0.03)", border: `1.5px solid ${demoData.goals.includes(g) ? C.teal : C.glassBorder}`, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 10, borderRadius: C.radiusSm, transition: "all 0.2s" }}>
                        <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${demoData.goals.includes(g) ? C.teal : "rgba(255,255,255,0.15)"}`, background: demoData.goals.includes(g) ? C.teal : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: C.white, flexShrink: 0, transition: "all 0.2s" }}>
                          {demoData.goals.includes(g) ? "✓" : ""}
                        </div>
                        {g}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button onClick={() => setDemoStep(1)} style={{ background: "rgba(255,255,255,0.05)", color: C.ash, border: `1px solid ${C.glassBorder}`, padding: "16px 24px", fontSize: 16, fontWeight: 600, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusSm }}>← Back</button>
                  <button onClick={() => setDemoStep(3)} style={{ flex: 1, background: C.gradRed, color: "#fff", border: "none", padding: "16px", fontSize: 16, fontWeight: 800, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusSm, boxShadow: C.glow(C.red, 0.2) }}>Continue →</button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {demoStep === 3 && (
              <div style={{ flex: 1, animation: "float-up 0.3s ease-out" }}>
                <div style={{ fontSize: 10, letterSpacing: 5, color: C.gold, textTransform: "uppercase", fontWeight: 700, marginBottom: 14 }}>Step 4 of 4</div>
                <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8 }}>Almost There!</h2>
                <p style={{ color: C.ash, fontSize: 14, marginBottom: 28 }}>Anything else you'd like us to know?</p>

                <textarea value={demoData.message} onChange={e => setDemoData({ ...demoData, message: e.target.value })}
                  placeholder="Tell us about your practice goals, challenges, or questions..."
                  style={{ ...inputStyle, minHeight: 120, resize: "vertical", lineHeight: 1.7 }} />

                {/* Summary */}
                <div style={{ ...glass, padding: 22, marginBottom: 22 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 14, color: C.gold, letterSpacing: 2, textTransform: "uppercase" }}>Summary</div>
                  <div style={{ fontSize: 12, color: C.ash, lineHeight: 2.2 }}>
                    <div>📧 {demoData.email}</div>
                    <div>🏥 {demoData.practice_name || '—'} · {demoData.practice_size || '—'}</div>
                    <div>🪑 {demoData.operatories} ops · {demoData.monthly_patients} patients/mo</div>
                    <div>🦷 {demoData.guards_per_month} guards/mo @ ${demoData.guard_price}</div>
                    <div>📷 Scanner: {demoData.has_scanner ? (demoData.scanner_type || 'Yes') : 'No'}</div>
                    {demoData.goals.length > 0 && <div>🎯 {demoData.goals.join(', ')}</div>}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setDemoStep(2)} style={{ background: "rgba(255,255,255,0.05)", color: C.ash, border: `1px solid ${C.glassBorder}`, padding: "16px 24px", fontSize: 16, fontWeight: 600, fontFamily: C.fn, cursor: "pointer", borderRadius: C.radiusSm }}>← Back</button>
                  <button onClick={submitDemo} disabled={submitting}
                    style={{ flex: 1, background: C.gradTeal, color: "#fff", border: "none", padding: "16px", fontSize: 16, fontWeight: 800, fontFamily: C.fn, cursor: "pointer", opacity: submitting ? 0.6 : 1, borderRadius: C.radiusSm, boxShadow: C.glow(C.teal, 0.25) }}>
                    {submitting ? 'Submitting...' : 'Submit Demo Request →'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
