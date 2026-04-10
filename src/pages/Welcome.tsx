import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '@/data/constants';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SCANNERS = ['Medit', 'iTero', '3Shape TRIOS', 'Planmeca', 'Carestream', 'Dentsply Sirona', 'Other'];
const GOALS_LIST = [
  'Increase case acceptance',
  'Add new revenue stream',
  'Improve patient education',
  'Reduce treatment coordinator burden',
  'Differentiate from competitors',
  'Expand wellness offerings',
];

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

  // Revenue calc state
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
      name: demoData.name.trim(),
      email: demoData.email.trim(),
      phone: demoData.phone,
      practice_name: demoData.practice_name,
      message: demoData.message,
      operatories: demoData.operatories,
      monthly_patients: demoData.monthly_patients,
      guards_per_month: demoData.guards_per_month,
      guard_price: demoData.guard_price,
      has_scanner: demoData.has_scanner,
      scanner_type: demoData.scanner_type,
      goals: demoData.goals,
      practice_size: demoData.practice_size,
    } as any);
    setSubmitting(false);
    if (error) { toast.error('Something went wrong'); } else {
      toast.success('Demo request submitted!');
      setShowDemo(false);
      setDemoStep(0);
    }
  };

  const toggleGoal = (g: string) => {
    setDemoData(d => ({ ...d, goals: d.goals.includes(g) ? d.goals.filter(x => x !== g) : [...d.goals, g] }));
  };

  const inputStyle = {
    width: "100%", padding: "14px 16px", fontSize: 15, fontFamily: C.fn,
    background: C.dark2, border: `1.5px solid ${C.borderD}`, color: C.white, outline: "none", marginBottom: 12,
  };

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
          <button onClick={() => navigate('/register')}
            style={{ background: C.red, color: "#fff", border: "none", padding: "16px 40px", fontSize: 16, fontWeight: 800, fontFamily: C.fn, cursor: "pointer", letterSpacing: 0.5 }}>
            Join the ByteSense Family →
          </button>
          <button onClick={() => setShowDemo(true)}
            style={{ background: C.teal, color: "#fff", border: "none", padding: "16px 32px", fontSize: 16, fontWeight: 700, fontFamily: C.fn, cursor: "pointer" }}>
            Request a Demo
          </button>
          <button onClick={() => navigate('/login')}
            style={{ background: "transparent", color: C.ash, border: `1px solid ${C.borderD}`, padding: "16px 32px", fontSize: 16, fontWeight: 600, fontFamily: C.fn, cursor: "pointer" }}>
            Sign In
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", justifyContent: "center", gap: 48, padding: "40px 24px", flexWrap: "wrap" }}>
        {[
          { n: "6", l: "Medical-Grade Sensors" },
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

      {/* Revenue Calculator */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ background: C.dark2, border: `1px solid ${C.borderD}`, padding: 32 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: 4, color: C.gold, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Revenue Calculator</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>See Your <span style={{ color: C.teal }}>Revenue Potential</span></h2>
            <p style={{ color: C.ash, fontSize: 14 }}>Adjust the sliders to see how ByteSense can impact your bottom line</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 24 }}>
            <div>
              <label style={{ fontSize: 11, color: C.ash, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Patients / Month</label>
              <input type="range" min={50} max={800} value={revPatients} onChange={e => setRevPatients(+e.target.value)} style={{ width: "100%", accentColor: C.teal }} />
              <div style={{ fontSize: 22, fontWeight: 800, color: C.teal, marginTop: 4 }}>{revPatients}</div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.ash, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Avg Case Price ($)</label>
              <input type="range" min={500} max={5000} step={100} value={revPrice} onChange={e => setRevPrice(+e.target.value)} style={{ width: "100%", accentColor: C.gold }} />
              <div style={{ fontSize: 22, fontWeight: 800, color: C.gold, marginTop: 4 }}>${revPrice.toLocaleString()}</div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.ash, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Current Close Rate (%)</label>
              <input type="range" min={5} max={60} value={revClose} onChange={e => setRevClose(+e.target.value)} style={{ width: "100%", accentColor: C.red }} />
              <div style={{ fontSize: 22, fontWeight: 800, color: C.red, marginTop: 4 }}>{revClose}%</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: C.dark3, padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: C.ash, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Current Monthly Revenue</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: C.ash }}>${currentRev.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: C.slate, marginTop: 4 }}>{revClose}% close rate</div>
            </div>
            <div style={{ background: C.dark3, padding: 24, textAlign: "center", border: `1px solid ${C.teal}40` }}>
              <div style={{ fontSize: 10, color: C.teal, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>With ByteSense</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: C.teal }}>${projectedRev.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: C.teal, marginTop: 4 }}>{projectedClose.toFixed(0)}% projected close rate</div>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: C.gold, fontWeight: 700 }}>
            +${(projectedRev - currentRev).toLocaleString()}/month · ${((projectedRev - currentRev) * 12).toLocaleString()}/year potential uplift
          </div>
        </div>
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
          </p>
          <button onClick={() => navigate('/register')}
            style={{ background: C.teal, color: C.white, border: "none", padding: "16px 40px", fontSize: 16, fontWeight: 800, fontFamily: C.fn, cursor: "pointer" }}>
            Start Your Training →
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", fontSize: 10, color: C.ash, padding: "24px" }}>
        byteSense Inc. · Proprietary · Confidential
      </div>

      {/* Full-Screen Demo Request Modal */}
      {showDemo && (
        <div style={{ position: "fixed", inset: 0, background: C.dark, zIndex: 1000, overflow: "auto" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
              <img src="/bytesense-logo.png" alt="ByteSense" style={{ height: 32, filter: "drop-shadow(0 0 1px rgba(255,255,255,0.9))" }} />
              <button onClick={() => { setShowDemo(false); setDemoStep(0); }}
                style={{ background: "none", border: "none", color: C.ash, fontSize: 24, cursor: "pointer" }}>×</button>
            </div>

            {/* Progress */}
            <div style={{ display: "flex", gap: 4, marginBottom: 32 }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ flex: 1, height: 3, background: i <= demoStep ? C.teal : C.dark3, transition: "background 0.3s" }} />
              ))}
            </div>

            {/* Step 0: Contact Info */}
            {demoStep === 0 && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, letterSpacing: 4, color: C.gold, textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>Step 1 of 4</div>
                <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Tell Us About You</h2>
                <p style={{ color: C.ash, fontSize: 14, marginBottom: 24 }}>We'd love to learn more about you and your practice.</p>
                <input value={demoData.name} onChange={e => setDemoData({ ...demoData, name: e.target.value })} placeholder="Your Full Name *" style={inputStyle} />
                <input value={demoData.email} onChange={e => setDemoData({ ...demoData, email: e.target.value })} placeholder="Email Address *" type="email" style={inputStyle} />
                <input value={demoData.phone} onChange={e => setDemoData({ ...demoData, phone: e.target.value })} placeholder="Phone Number" type="tel" style={inputStyle} />
                <input value={demoData.practice_name} onChange={e => setDemoData({ ...demoData, practice_name: e.target.value })} placeholder="Practice Name" style={inputStyle} />
                <select value={demoData.practice_size} onChange={e => setDemoData({ ...demoData, practice_size: e.target.value })}
                  style={{ ...inputStyle, appearance: "auto" as any }}>
                  <option value="">Practice Size</option>
                  <option value="solo">Solo Practice</option>
                  <option value="small">Small (2-3 providers)</option>
                  <option value="medium">Medium (4-6 providers)</option>
                  <option value="large">Large (7+ providers)</option>
                  <option value="dso">DSO / Multi-Location</option>
                </select>
                <button onClick={() => { if (!demoData.name.trim() || !demoData.email.trim()) { toast.error('Name and email required'); return; } setDemoStep(1); }}
                  style={{ background: C.red, color: "#fff", border: "none", padding: "16px 40px", fontSize: 16, fontWeight: 800, fontFamily: C.fn, cursor: "pointer", width: "100%", marginTop: 8 }}>
                  Continue →
                </button>
              </div>
            )}

            {/* Step 1: Practice Details */}
            {demoStep === 1 && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, letterSpacing: 4, color: C.gold, textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>Step 2 of 4</div>
                <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Practice Details</h2>
                <p style={{ color: C.ash, fontSize: 14, marginBottom: 24 }}>Help us understand your current setup.</p>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, color: C.ash, display: "block", marginBottom: 8 }}>Number of Operatories</label>
                  <input type="range" min={1} max={20} value={demoData.operatories} onChange={e => setDemoData({ ...demoData, operatories: +e.target.value })}
                    style={{ width: "100%", accentColor: C.teal }} />
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.teal }}>{demoData.operatories}</div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, color: C.ash, display: "block", marginBottom: 8 }}>Monthly Patient Volume</label>
                  <input type="range" min={50} max={1000} step={10} value={demoData.monthly_patients} onChange={e => setDemoData({ ...demoData, monthly_patients: +e.target.value })}
                    style={{ width: "100%", accentColor: C.gold }} />
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.gold }}>{demoData.monthly_patients}</div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, color: C.ash, display: "block", marginBottom: 8 }}>Current Guards Sold / Month</label>
                  <input type="range" min={0} max={50} value={demoData.guards_per_month} onChange={e => setDemoData({ ...demoData, guards_per_month: +e.target.value })}
                    style={{ width: "100%", accentColor: C.red }} />
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.red }}>{demoData.guards_per_month}</div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, color: C.ash, display: "block", marginBottom: 8 }}>Average Guard Price ($)</label>
                  <input type="range" min={100} max={3000} step={50} value={demoData.guard_price} onChange={e => setDemoData({ ...demoData, guard_price: +e.target.value })}
                    style={{ width: "100%", accentColor: C.amber }} />
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.amber }}>${demoData.guard_price}</div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={() => setDemoStep(0)} style={{ background: "transparent", color: C.ash, border: `1px solid ${C.borderD}`, padding: "16px 24px", fontSize: 16, fontWeight: 600, fontFamily: C.fn, cursor: "pointer" }}>← Back</button>
                  <button onClick={() => setDemoStep(2)} style={{ flex: 1, background: C.red, color: "#fff", border: "none", padding: "16px", fontSize: 16, fontWeight: 800, fontFamily: C.fn, cursor: "pointer" }}>Continue →</button>
                </div>
              </div>
            )}

            {/* Step 2: Technology */}
            {demoStep === 2 && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, letterSpacing: 4, color: C.gold, textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>Step 3 of 4</div>
                <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Technology & Goals</h2>
                <p style={{ color: C.ash, fontSize: 14, marginBottom: 24 }}>Tell us about your current technology and what you hope to achieve.</p>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, color: C.white, fontWeight: 700, display: "block", marginBottom: 12 }}>Do you have an intraoral scanner?</label>
                  <div style={{ display: "flex", gap: 12 }}>
                    {[true, false].map(val => (
                      <div key={String(val)} onClick={() => setDemoData({ ...demoData, has_scanner: val, scanner_type: val ? demoData.scanner_type : '' })}
                        style={{ flex: 1, background: demoData.has_scanner === val ? C.dark3 : C.dark2, border: `1.5px solid ${demoData.has_scanner === val ? C.teal : C.borderD}`, padding: "16px", textAlign: "center", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
                        {val ? 'Yes' : 'No'}
                      </div>
                    ))}
                  </div>
                </div>

                {demoData.has_scanner && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 12, color: C.ash, display: "block", marginBottom: 8 }}>Which scanner?</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {SCANNERS.map(sc => (
                        <div key={sc} onClick={() => setDemoData({ ...demoData, scanner_type: sc })}
                          style={{ padding: "8px 16px", background: demoData.scanner_type === sc ? C.teal : C.dark2, border: `1px solid ${demoData.scanner_type === sc ? C.teal : C.borderD}`, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                          {sc}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, color: C.white, fontWeight: 700, display: "block", marginBottom: 12 }}>What are your goals with ByteSense?</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {GOALS_LIST.map(g => (
                      <div key={g} onClick={() => toggleGoal(g)}
                        style={{ padding: "12px 16px", background: demoData.goals.includes(g) ? C.dark3 : C.dark2, border: `1.5px solid ${demoData.goals.includes(g) ? C.teal : C.borderD}`, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${demoData.goals.includes(g) ? C.teal : C.borderD}`, background: demoData.goals.includes(g) ? C.teal : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: C.white, flexShrink: 0 }}>
                          {demoData.goals.includes(g) ? "✓" : ""}
                        </div>
                        {g}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={() => setDemoStep(1)} style={{ background: "transparent", color: C.ash, border: `1px solid ${C.borderD}`, padding: "16px 24px", fontSize: 16, fontWeight: 600, fontFamily: C.fn, cursor: "pointer" }}>← Back</button>
                  <button onClick={() => setDemoStep(3)} style={{ flex: 1, background: C.red, color: "#fff", border: "none", padding: "16px", fontSize: 16, fontWeight: 800, fontFamily: C.fn, cursor: "pointer" }}>Continue →</button>
                </div>
              </div>
            )}

            {/* Step 3: Message & Submit */}
            {demoStep === 3 && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, letterSpacing: 4, color: C.gold, textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>Step 4 of 4</div>
                <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Almost There!</h2>
                <p style={{ color: C.ash, fontSize: 14, marginBottom: 24 }}>Anything else you'd like us to know?</p>

                <textarea value={demoData.message} onChange={e => setDemoData({ ...demoData, message: e.target.value })}
                  placeholder="Tell us about your practice goals, challenges, or questions..."
                  style={{ ...inputStyle, minHeight: 120, resize: "vertical", lineHeight: 1.7 }} />

                {/* Summary */}
                <div style={{ background: C.dark2, border: `1px solid ${C.borderD}`, padding: 20, marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: C.gold }}>Summary</div>
                  <div style={{ fontSize: 12, color: C.ash, lineHeight: 2 }}>
                    <div>📧 {demoData.email}</div>
                    <div>🏥 {demoData.practice_name || '—'} · {demoData.practice_size || '—'}</div>
                    <div>🪑 {demoData.operatories} ops · {demoData.monthly_patients} patients/mo</div>
                    <div>🦷 {demoData.guards_per_month} guards/mo @ ${demoData.guard_price}</div>
                    <div>📷 Scanner: {demoData.has_scanner ? (demoData.scanner_type || 'Yes') : 'No'}</div>
                    {demoData.goals.length > 0 && <div>🎯 {demoData.goals.join(', ')}</div>}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setDemoStep(2)} style={{ background: "transparent", color: C.ash, border: `1px solid ${C.borderD}`, padding: "16px 24px", fontSize: 16, fontWeight: 600, fontFamily: C.fn, cursor: "pointer" }}>← Back</button>
                  <button onClick={submitDemo} disabled={submitting}
                    style={{ flex: 1, background: C.teal, color: "#fff", border: "none", padding: "16px", fontSize: 16, fontWeight: 800, fontFamily: C.fn, cursor: "pointer", opacity: submitting ? 0.6 : 1 }}>
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
