import { useState, useRef, useEffect } from 'react';
import Dashboard from '@/screens/Dashboard';
import { C } from '@/data/constants';
import { useIsMobile } from '@/hooks/use-mobile';
import { AppState } from '@/hooks/useAppState';
import { Role, Phase, Module } from '@/data/constants';
import { Lang } from '@/data/translations';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface SalesTrainingScreenProps {
  s: AppState;
  u: (d: Partial<AppState>) => void;
  sRoles: Role[];
  myPH: Phase[];
  myM: Module[];
  dN: number;
  pr: number;
  allD: boolean;
  reset: () => void;
  openCoach: (mode: string) => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  onOpenPanel?: (src: string, title: string) => void;
  lang?: Lang;
}

// ── Colours (mirrored from HTML variables) ──────────────────────────────────
const BG      = 'var(--bs-bg)';
const SURFACE = 'var(--bs-bg2)';
const CARD    = 'var(--bs-bg3)';
const BORDER  = 'var(--bs-border)';
const BORDER2 = 'var(--bs-border)';
const DIM     = 'var(--bs-ash)';
const FAINT   = 'var(--bs-ash)';
const RED_B   = '#E63434';
const RED_MUT = 'var(--bs-red-muted)';
const RED_BDR = 'var(--bs-red-border)';
const TEAL_C  = '#00B4AD';
const TEAL_MUT= 'var(--bs-teal-muted)';

// ── Shared layout helpers ────────────────────────────────────────────────────
const getSectionStyle = (isMobile: boolean): React.CSSProperties => ({
  maxWidth: 900,
  padding: isMobile ? '32px 20px' : '72px 64px',
  borderBottom: `1px solid ${BORDER}`,
  fontFamily: C.fn,
});

const sectionTag: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: 3, color: C.red,
  textTransform: 'uppercase', marginBottom: 12, fontFamily: C.fn,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 38, fontWeight: 800, lineHeight: 1.1,
  letterSpacing: -1, marginBottom: 8, color: 'var(--bs-text)', fontFamily: C.fn,
};

const sectionSubtitle: React.CSSProperties = {
  fontSize: 16, color: DIM, fontWeight: 400,
  marginBottom: 40, maxWidth: 600, fontFamily: C.fn,
};

const accent: React.CSSProperties = { color: RED_B };

const highlightBox = (teal = false): React.CSSProperties => ({
  background: teal ? TEAL_MUT : '#1a0a0a',
  border: `1px solid ${teal ? TEAL_C + '55' : RED_BDR}`,
  padding: '24px 28px',
  marginBottom: 24,
  fontFamily: C.fn,
});

const hlLabel = (teal = false): React.CSSProperties => ({
  fontSize: 9, fontWeight: 700, letterSpacing: 2,
  color: teal ? TEAL_C : RED_B,
  textTransform: 'uppercase', marginBottom: 8,
});

const hlTitle: React.CSSProperties = {
  fontSize: 18, fontWeight: 700, color: 'var(--bs-text)', marginBottom: 10,
};

const hlBody: React.CSSProperties = {
  fontSize: 14, color: DIM, lineHeight: 1.75,
};

const h3Style: React.CSSProperties = {
  fontSize: 18, fontWeight: 700, margin: '32px 0 16px', color: 'var(--bs-text)', fontFamily: C.fn,
};

const tableWrap: React.CSSProperties = {
  overflowX: 'auto', marginBottom: 24,
};

const tableStyle: React.CSSProperties = {
  width: '100%', borderCollapse: 'collapse', fontFamily: C.fn, fontSize: 13,
};

const thStyle: React.CSSProperties = {
  background: 'var(--bs-bg3)', color: 'var(--bs-text)', fontWeight: 700,
  padding: '10px 14px', textAlign: 'left', borderBottom: `1px solid ${BORDER2}`,
  fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, color: DIM, verticalAlign: 'top',
};

const tdTeal: React.CSSProperties = { ...tdStyle, color: TEAL_C, fontWeight: 600 };

const cardStyle = (color: 'red' | 'teal' | 'none' = 'none'): React.CSSProperties => ({
  background: color === 'red' ? RED_MUT : color === 'teal' ? TEAL_MUT : CARD,
  border: `1px solid ${color === 'red' ? RED_BDR : color === 'teal' ? TEAL_C + '55' : BORDER2}`,
  padding: '20px 22px',
  marginBottom: 14,
  fontFamily: C.fn,
});

const cardTitle: React.CSSProperties = {
  fontSize: 15, fontWeight: 700, color: 'var(--bs-text)', marginBottom: 8,
};

const cardBody: React.CSSProperties = {
  fontSize: 13, color: DIM, lineHeight: 1.75,
};

const scriptBox: React.CSSProperties = {
  background: 'var(--bs-bg2)',
  border: `1px solid ${BORDER2}`,
  borderLeft: `3px solid ${TEAL_C}`,
  padding: '20px 22px',
  marginBottom: 20,
  fontFamily: C.fn,
};

const scriptRole: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, letterSpacing: 2, color: TEAL_C,
  textTransform: 'uppercase', marginBottom: 12,
};

const checkList: React.CSSProperties = {
  listStyle: 'none', padding: 0, marginTop: 12,
};

const checkLi: React.CSSProperties = {
  fontSize: 13, color: DIM, padding: '5px 0',
  display: 'flex', gap: 10, alignItems: 'flex-start',
};

const divider: React.CSSProperties = {
  borderTop: `1px solid ${BORDER}`, margin: '32px 0',
};

// ── Objection card ───────────────────────────────────────────────────────────
function ObjCard({ title, context, response }: { title: string; context: string; response: string }) {
  return (
    <div style={{ ...cardStyle('red'), marginBottom: 16 }}>
      <div style={{ ...cardTitle, color: RED_B }}>{title}</div>
      <div style={{ ...cardBody, marginBottom: 12 }}>{context}</div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', color: TEAL_C, marginBottom: 8 }}>YOUR RESPONSE</div>
      <div style={cardBody}>{response}</div>
    </div>
  );
}

// ── Sections ─────────────────────────────────────────────────────────────────

function AboutSection() {
  const isMobile = useIsMobile();
  return (
    <div style={getSectionStyle(isMobile)}>
      <div style={sectionTag}>Section 02 — Product Education</div>
      <h2 style={sectionTitle}>The <span style={accent}>bioSense™</span><br />Platform</h2>
      <p style={sectionSubtitle}>Not a night guard. Not a mouthguard. An entirely new category of health intelligence.</p>

      {/* Notice */}
      <div style={{ background: 'var(--bs-red-muted)', border: `1px solid ${RED_BDR}`, padding: '20px 24px', marginBottom: 28, display: 'flex', gap: 16 }}>
        <div style={{ color: RED_B, fontSize: 20, flexShrink: 0, marginTop: 2 }}>⚑</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--bs-text)', marginBottom: 8 }}>Critical Messaging Directive — Read This First</div>
          <div style={{ fontSize: 13, color: DIM, lineHeight: 1.75 }}>
            bioSense™ is <strong style={{ color: 'var(--bs-text)' }}>NEVER</strong> to be introduced, described, or positioned as a "night guard" or "mouthguard." These terms commoditize the device and collapse its value to $50–$300. bioSense™ is a <strong style={{ color: 'var(--bs-text)' }}>wellness health intelligence platform</strong> that happens to protect teeth. Lead with intelligence, monitoring, and body data — always. Protection is a benefit, not the identity.
          </div>
        </div>
      </div>

      <h3 style={h3Style}>What is the bioSense™?</h3>
      <p style={{ color: DIM, lineHeight: 1.8, marginBottom: 24, fontSize: 14 }}>
        The bioSense™ is a custom-fit oral appliance embedded with medical-grade biometric sensors. Worn during sleep, it passively monitors six distinct health metrics simultaneously — delivering a comprehensive picture of the patient's nocturnal health to a smartphone app. Think of it as an Oura Ring or WHOOP device — but one that lives in the mouth, where biometric data is dramatically more accurate than the wrist or finger.
      </p>

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: DIM, textTransform: 'uppercase', marginBottom: 16 }}>Six Embedded Sensor Systems</div>
      <div style={tableWrap}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Sensor</th>
              <th style={thStyle}>What It Measures</th>
              <th style={thStyle}>Clinical Relevance</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['PPG Optical', 'Heart Rate (HR) & Heart Rate Variability (HRV)', 'Cardiovascular health, autonomic nervous system, stress load, recovery quality'],
              ['Oral SpO₂', 'Blood oxygen saturation during sleep', 'Detects oxygen desaturation events — OSA risk indicator. Oral measurement is 7 seconds faster and more accurate than finger/wrist sensors.'],
              ['Respiratory Rate', 'Breath cycles per minute during sleep', 'Identifies mouth breathing, airway restriction, respiratory disturbance'],
              ['Temperature', 'Core body temperature fluctuation', 'Illness detection, hormonal cycling, metabolic rate, recovery status'],
              ['EMG / Force', 'Jaw muscle activation — bruxism episodes, duration, intensity', 'Objective bruxism data — first-ever quantified clinical evidence of grinding for each patient'],
              ['Motion / Accelerometer', 'Head and jaw movement, sleep position', 'Sleep stage inference, positional OSA, restlessness markers'],
            ].map(([sensor, what, why]) => (
              <tr key={sensor}>
                <td style={tdStyle}><strong style={{ color: 'var(--bs-text)' }}>{sensor}</strong></td>
                <td style={tdStyle}>{what}</td>
                <td style={tdStyle}>{why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={highlightBox(true)}>
        <div style={hlLabel(true)}>The Oral Advantage — Why the Mouth Wins</div>
        <h3 style={hlTitle}>Oral SpO₂ Is Categorically More Accurate Than Wrist or Finger Sensors</h3>
        <p style={hlBody}>Published clinical research demonstrates that oral SpO₂ sensors detect oxygen desaturation events <strong style={{ color: 'var(--bs-text)' }}>7 seconds faster</strong> than peripheral sensors. The mouth is immune to vasoconstriction that degrades peripheral readings. Oral data correlates more closely with arterial blood gas measurements — the gold standard — and provides a clearer signal of brain oxygenation. This is not incremental improvement. It is a different category of accuracy.</p>
      </div>

      <h3 style={h3Style}>The byteSense Score™</h3>
      <p style={{ color: DIM, lineHeight: 1.8, marginBottom: 16, fontSize: 14 }}>Every morning, the patient's app displays a byteSense Score™ — a composite daily health intelligence rating derived from all six sensor streams. This single number becomes the patient's daily engagement anchor, driving habitual app interaction and long-term data accumulation that reveals health patterns invisible to any single-night measurement.</p>

      <h3 style={h3Style}>Who Is This Device?</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 32 }}>
        {[
          ['The Bruxism Patient', 'Any patient showing wear facets, fractured cusps, flattened teeth, cervical abfractions, or reporting jaw pain, morning headaches, or partner-reported grinding. This is your core addressable market.'],
          ['The Sleep-Concerned Patient', 'Patients who are fatigued despite adequate sleep duration, partners of known snorers, patients who have declined CPAP, or anyone wanting to understand their sleep health without the burden of a sleep study.'],
          ['The Health Optimizer', 'The biohacker, the executive, the athlete, the parent who reads health content. These patients are already wearing fitness trackers and understand the value of biometric data. This is the logical next layer.'],
          ['The Stress-Driven Patient', 'High-stress professionals, healthcare workers, teachers, first responders — anyone whose occupation correlates with elevated cortisol and clenching. HRV monitoring makes this connection tangible.'],
          ['The Longevity Patient', 'Patients who understand that chronic undetected disease is the enemy of long life. They invest in their health ahead of symptoms. bioSense™ is a core pillar of any preventive longevity protocol.'],
          ['The OSA Risk Patient', 'Patients with confirmed or suspected airway issues, high Epworth scores, snoring, hypertension, or metabolic syndrome. bioSense™ provides nightly oxygen monitoring without a prescription referral.'],
        ].map(([title, body]) => (
          <div key={title} style={cardStyle('red')}>
            <div style={cardTitle}>{title}</div>
            <div style={cardBody}>{body}</div>
          </div>
        ))}
      </div>

      <div style={divider} />

      <h3 style={{ ...h3Style, marginTop: 0 }}>How bioSense™ Compares — The Competitive Truth</h3>
      <div style={tableWrap}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {['Device', 'Form Factor', 'SpO₂ Accuracy', 'Bruxism Data', 'Custom Fit', 'Protection'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}><strong style={{ color: 'var(--bs-text)' }}>bioSense™</strong></td>
              <td style={tdTeal}>Intraoral</td>
              <td style={tdTeal}>Oral (Superior)</td>
              <td style={tdTeal}>Yes — clinical grade</td>
              <td style={tdTeal}>Yes</td>
              <td style={tdTeal}>Yes</td>
            </tr>
            {[
              ['Oura Ring', 'Finger ring', 'Peripheral — limited', 'No', 'Sizing only', 'No'],
              ['WHOOP', 'Wrist band', 'Peripheral — limited', 'No', 'No', 'No'],
              ['Apple Watch', 'Wrist watch', 'Periodic only', 'No', 'No', 'No'],
              ['Traditional Night Guard', 'Intraoral', 'None', 'No', 'Yes', 'Yes'],
            ].map(([device, ...rest]) => (
              <tr key={device}>
                <td style={tdStyle}>{device}</td>
                {rest.map((v, i) => <td key={i} style={tdStyle}>{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={highlightBox()}>
        <div style={hlLabel()}>The Core Positioning Statement</div>
        <h3 style={hlTitle}>The Rolls Royce of Wearables — Made for the Oral Environment</h3>
        <p style={hlBody}>bioSense™ is the only device that combines the protection of a precision occlusal splint with the intelligence of a clinical-grade health monitoring platform. No other wearable offers this combination. This is not a feature comparison — this is a category of one.</p>
      </div>
    </div>
  );
}

function BetaSection() {
  const isMobile = useIsMobile();
  return (
    <div style={getSectionStyle(isMobile)}>
      <div style={sectionTag}>Section 03 — Beta Program</div>
      <h2 style={sectionTitle}>Your <span style={accent}>Beta Partner</span><br />Program</h2>
      <p style={sectionSubtitle}>90 days. Full support. Zero onboarding cost. Everything you need to succeed.</p>

      <div style={highlightBox(true)}>
        <div style={hlLabel(true)}>Beta Partner Commitment</div>
        <h3 style={hlTitle}>What byteSense Provides to You</h3>
        <p style={hlBody}>All training, onboarding, and educational resources are provided at zero cost during your 90-day Beta period. You are responsible only for lab fees per appliance, billed directly by the lab at your exclusive Beta partner discounted rate. No monthly fees. No platform fees. No minimum case volumes required.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 24, marginBottom: 32 }}>
        <div style={cardStyle('teal')}>
          <div style={cardTitle}>byteSense Provides</div>
          <ul style={checkList}>
            {['This complete onboarding package', 'Full team training resources', 'Sales scripts & marketing templates', 'Dedicated support from Natasha Blake', 'All consent and compliance documentation', 'Patient FAQs, brochures & education tools', 'Direct line to our clinical and technical team', 'Beta pricing for the full 90-day window'].map(item => (
              <li key={item} style={checkLi}><span style={{ color: TEAL_C, flexShrink: 0 }}>—</span>{item}</li>
            ))}
          </ul>
        </div>
        <div style={{ ...cardStyle('none'), borderLeft: `3px solid ${FAINT}` }}>
          <div style={cardTitle}>Your Practice Provides</div>
          <ul style={checkList}>
            {['Designate a Primary Practice Advocate', 'Designate a Secondary Advocate', 'Complete lab setup via Medit (Step-by-step included)', 'Submit completed patient consent forms per case', 'Upload quality intraoral scans per protocol', 'Lab fee per device (discounted Beta rate)', 'Share feedback to improve the platform'].map(item => (
              <li key={item} style={checkLi}><span style={{ color: FAINT, flexShrink: 0 }}>—</span>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <h3 style={h3Style}>90-Day Beta Timeline</h3>
      {[
        { week: 'Week 1–2 — Launch', title: 'Onboarding, Setup & First Team Training', body: 'Complete this package. Assign your Practice Advocates. Add Florida Oral Labs to your Medit account. Review inclusion/exclusion criteria. Identify your first 5–10 ideal patients. Begin introductory conversations.', last: false },
        { week: 'Week 3–4 — First Cases', title: 'First Patient Presentations & Case Submissions', body: 'Begin presenting bioSense™ to pre-identified patients. Submit your first scans following the protocol in Section 6. Call Natasha with any questions — this is what she\'s here for. Celebrate your first yes.', last: false },
        { week: 'Week 5–8 — Momentum', title: 'Build Cadence, Collect Feedback, Grow Revenue', body: 'Establish a regular cadence of presenting bioSense™ as part of every qualifying exam and hygiene appointment. Track conversion rates. Begin in-office patient displays and education materials. Collect testimonials from early adopters.', last: false },
        { week: 'Week 9–12 — Optimize', title: 'Refine, Scale & Transition to Full Program', body: 'Your team is now experienced presenters. Optimize your intro offer. Begin planning your full-program pricing structure ($850–$1,500). Provide feedback to byteSense on platform improvements. Prepare to become a Certified Provider.', last: true },
      ].map(({ week, title, body, last }) => (
        <div key={week} style={{ display: 'flex', gap: 20, marginBottom: last ? 0 : 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: C.red, flexShrink: 0, marginTop: 4 }} />
            {!last && <div style={{ width: 2, flex: 1, background: BORDER2, marginTop: 6 }} />}
          </div>
          <div style={{ paddingBottom: last ? 0 : 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.red, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{week}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--bs-text)', marginBottom: 6 }}>{title}</div>
            <div style={{ fontSize: 13, color: DIM, lineHeight: 1.75 }}>{body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PricingSection() {
  const isMobile = useIsMobile();
  return (
    <div style={getSectionStyle(isMobile)}>
      <div style={sectionTag}>Section 08 — Revenue Strategy</div>
      <h2 style={sectionTitle}>Pricing <span style={accent}>Strategy</span></h2>
      <p style={sectionSubtitle}>Structured to maximize early adoption while establishing the premium positioning this device commands.</p>

      <div style={highlightBox(true)}>
        <div style={hlLabel(true)}>Beta Pricing Philosophy</div>
        <h3 style={hlTitle}>Build the Story. Build the Value. Then Build the Price.</h3>
        <p style={hlBody}>During your 90-day Beta, we recommend offering an exclusive introductory price to your patients. This creates urgency, rewards your early adopters, and builds a powerful foundation of testimonials that justify full pricing afterward. The goal of the Beta period is not maximum revenue per device — it is maximum adoption, maximum data, and maximum word-of-mouth. Profitability at scale comes in Month 4.</p>
      </div>

      <h3 style={h3Style}>Recommended Pricing Structure</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, marginBottom: 32 }}>
        {[
          { label: 'Beta Introduction', price: '$495–$695', note: 'First 90 days — exclusive to Beta', featured: true, features: ['Device + sensors included', 'App access included', '12-month device warranty', 'Delivery appointment included', '2-week follow-up included'] },
          { label: 'Standard Program', price: '$850–$1,100', note: 'Post-Beta certified pricing', featured: false, features: ['All Beta inclusions', 'Certified Provider badge', 'Provider directory listing', 'Enhanced support tier', 'Annual refresh pricing'] },
          { label: 'Premium Tier', price: '$1,200–$1,500', note: 'High-value practice positioning', featured: false, features: ['All Standard inclusions', 'White-glove delivery experience', 'Quarterly data review appointment', 'Priority support channel', 'Practice co-marketing inclusion'] },
        ].map(({ label, price, note, featured, features }) => (
          <div key={label} style={{
            background: featured ? '#1a0a0a' : CARD,
            border: `1px solid ${featured ? RED_BDR : BORDER2}`,
            padding: '24px 22px',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: featured ? RED_B : DIM, textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: featured ? RED_B : 'var(--bs-text)', letterSpacing: -1, marginBottom: 4 }}>{price}</div>
            <div style={{ fontSize: 12, color: DIM, marginBottom: 16 }}>{note}</div>
            <div style={{ borderTop: `1px solid ${BORDER}`, marginBottom: 16 }} />
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {features.map(f => (
                <li key={f} style={{ fontSize: 13, color: DIM, padding: '5px 0', display: 'flex', gap: 8 }}>
                  <span style={{ color: FAINT, flexShrink: 0 }}>—</span>{f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h3 style={h3Style}>Handling the Insurance Question</h3>
      <p style={{ color: DIM, lineHeight: 1.8, marginBottom: 16, fontSize: 14 }}>Insurance does not currently cover the bioSense™ platform. It is positioned and priced as a wellness device — consistent with Oura Ring, Apple Watch, and WHOOP. This is a patient-pay offering. Here is how to present this with confidence:</p>
      <div style={scriptBox}>
        <div style={scriptRole}>Team Script — Insurance Objection Pre-emption</div>
        <p style={{ color: DIM, fontSize: 14, lineHeight: 1.75 }}>"Because the bioSense™ is a health intelligence platform — think of it like a medical-grade Oura Ring for your mouth — it's in the same category as other wellness devices. Insurance covers your watch battery about as well as they cover your Apple Watch. The difference is that this investment gives you actual clinical data about what's happening in your body every single night, and that data can literally save you thousands in preventable dental damage and future health costs. Most patients tell us it's the most valuable health investment they've ever made."</p>
      </div>
    </div>
  );
}

function SalesSection() {
  const isMobile = useIsMobile();
  return (
    <div style={getSectionStyle(isMobile)}>
      <div style={sectionTag}>Section 09 — Sales Training</div>
      <h2 style={sectionTitle}><span style={accent}>Sales Training</span><br />&amp; Conversation Scripts</h2>
      <p style={sectionSubtitle}>Word-for-word scripts for every clinical scenario. Adapt to your voice — never memorize robotically.</p>

      <div style={highlightBox()}>
        <div style={hlLabel()}>Sales Philosophy</div>
        <h3 style={hlTitle}>You Are Not Selling. You Are Revealing.</h3>
        <p style={hlBody}>The most effective bioSense™ presentations never feel like sales. You are sharing clinical information the patient needs to know, offering them a tool that addresses a real health concern, and inviting them to take action. Your belief in the product is the most powerful sales tool you have. If you find it genuinely valuable — your patient will too.</p>
      </div>

      <h3 style={h3Style}>The Hygienist Conversation — During Exam</h3>
      <div style={scriptBox}>
        <div style={scriptRole}>Hygienist Script — Bruxism Discovery</div>
        <p style={{ color: DIM, fontSize: 14, lineHeight: 1.75 }}>"[Name], while I was cleaning today I noticed some wear on these surfaces here [point or show image]. This is a pattern we associate with grinding or clenching during sleep — most people do it completely unconsciously. Are you aware of any grinding, or has anyone told you that you grind at night?"</p>
        <br />
        <p style={{ color: DIM, fontSize: 14, lineHeight: 1.75 }}>[After patient responds:] "What's really exciting is that we now have something that goes way beyond a traditional night guard. It's called the bioSense™, and it's honestly remarkable — it's a custom-fit oral device that monitors six different aspects of your health while you sleep. We're talking heart rate, oxygen levels, breathing, your actual grinding activity — all delivered to an app on your phone so you can literally see what your body does every night. Think of it like a Fitbit, but one that lives in your mouth where the measurements are actually most accurate. I'd love for Dr. [Name] to tell you more about it when they come in."</p>
      </div>

      <h3 style={h3Style}>The Doctor Recommendation</h3>
      <div style={scriptBox}>
        <div style={scriptRole}>Doctor Script — Clinical Recommendation</div>
        <p style={{ color: DIM, fontSize: 14, lineHeight: 1.75 }}>"I've looked at your X-rays and I've reviewed what [hygienist] documented today. I'm seeing evidence of significant bruxism — the wear pattern on your [upper anterior / posterior] teeth tells me you're grinding with real force during sleep. Here's the thing: traditionally we'd just give you a night guard, and you'd wear it for years, not knowing if things were getting better or worse. We have something different to offer now."</p>
        <br />
        <p style={{ color: DIM, fontSize: 14, lineHeight: 1.75 }}>"It's called bioSense™, and I'm genuinely excited to offer it to my patients. It's a precision-fit oral appliance — so it protects your teeth completely — but it also has medical-grade sensors built right in. Every night it measures your grinding activity, your oxygen levels, your heart rate, even your breathing patterns. All of that goes to an app. Your grind score, your oxygen score, everything. We can actually track whether your bruxism is improving over time, and you get a comprehensive picture of your sleep health. This is the future of how we care for your health."</p>
        <br />
        <p style={{ color: DIM, fontSize: 14, lineHeight: 1.75 }}>"I'd like to have [coordinator name] sit down with you and share the details. This is something I genuinely recommend."</p>
      </div>

      <h3 style={h3Style}>The Treatment Coordinator Close</h3>
      <div style={scriptBox}>
        <div style={scriptRole}>Treatment Coordinator Script — Presentation &amp; Close</div>
        <p style={{ color: DIM, fontSize: 14, lineHeight: 1.75 }}>"[Name], so Dr. [Name] wanted me to walk you through the bioSense™ that he mentioned. Let me show you what this actually does [if available, show app images or device]. This is really more like a health intelligence platform than anything we've offered before."</p>
        <br />
        <p style={{ color: DIM, fontSize: 14, lineHeight: 1.75 }}>"It's completely custom-fit to your mouth — so it fits like a precision night guard. But built into it are six different sensors that track your health every single night. Your heart rate, your oxygen saturation — which is really important for breathing issues — your actual grinding activity, your body temperature, and your sleep movement. Every morning you wake up and you have a health score on your phone. Patients absolutely love it."</p>
        <br />
        <p style={{ color: DIM, fontSize: 14, lineHeight: 1.75 }}>"Right now we're in a special introductory period, so the investment is [price] — which includes everything: the device, the sensors, the app, and your delivery appointment. That's significantly less than it will be later in the year. Would you like to start with your scans today, or would Tuesday work better for you?"</p>
      </div>

      <h3 style={h3Style}>Closing Techniques</h3>
      {[
        { title: 'The Assumptive Close', body: '"I\'m going to have [name] pull up our schedule right now to get your scans set up. Does this week or next week work better for you?" — Used when patient is clearly interested and engaged. Skip asking if they want to proceed; assume they do and move to scheduling.' },
        { title: 'The Alternative Close', body: '"Would you prefer to do the scans today and have everything ready to go, or would you rather schedule a dedicated 20-minute appointment next week?" — Two options that both move forward. Never give the option of not proceeding.' },
        { title: 'The Urgency Close', body: '"I want to make sure you\'re aware — the introductory pricing we\'re offering is only available through [date/end of beta period]. After that, the device will be at its standard investment of $850 or more. Getting started today secures the best price we\'ll ever offer." — Use with hesitant patients who are interested but not yet committed.' },
        { title: 'The Concern Close', body: '"I completely understand needing a moment. What specific question or concern would I need to answer for you to feel fully comfortable moving forward today?" — Listen carefully. Address the specific concern directly. Often it\'s just hesitation, not a real objection.' },
        { title: 'The Future-Cost Close', body: '"I want to put this in perspective. The wear we\'re seeing will eventually require crown replacements — that\'s $1,500 to $3,000 per tooth, and it\'s not a matter of if but when. The bioSense™ at [price] monitors and protects you every single night. What\'s the cost of doing nothing?" — Use with patients who say "that seems expensive."' },
      ].map(({ title, body }) => (
        <div key={title} style={{ ...cardStyle('teal'), marginBottom: 14 }}>
          <div style={cardTitle}>{title}</div>
          <div style={cardBody}>{body}</div>
        </div>
      ))}
    </div>
  );
}

function ObjectionsSection() {
  const isMobile = useIsMobile();
  return (
    <div style={getSectionStyle(isMobile)}>
      <div style={sectionTag}>Section 10 — Sales Training</div>
      <h2 style={sectionTitle}>Objection<br /><span style={accent}>Handling Playbook</span></h2>
      <p style={sectionSubtitle}>Every objection is a request for more information. Here is exactly what to say.</p>

      <ObjCard
        title={`"I don't think I grind my teeth."`}
        context="This is the single most common objection. Most bruxism patients genuinely don't know they grind."
        response={`"That's actually one of the most remarkable things about bruxism — research shows the majority of people who grind their teeth at night have absolutely no idea they're doing it. Your body doesn't feel it. That's exactly what makes the bioSense™ so valuable — it gives you objective proof, one way or the other. And here's the thing: if you don't grind, that data will confirm it. But based on what I'm seeing clinically today, I think you'll be surprised."`}
      />
      <ObjCard
        title={`"Will my insurance cover this?"`}
        context="This is not a no — it's a question about affordability. Address it directly and confidently."
        response={`"The bioSense™ is a wellness device — similar to an Apple Watch or an Oura Ring — so insurance doesn't cover it currently, just as they don't cover those devices. What I can tell you is that the data this device provides can help prevent thousands of dollars in future dental treatment. Many patients see it as the most valuable healthcare investment they make — not a cost, but a savings account for their health. And right now we have an introductory price that makes it very accessible."`}
      />
      <ObjCard
        title={`"That's too expensive."`}
        context="Reframe price as value. Always anchor to the cost of doing nothing."
        response={`"I completely understand wanting to make sure it's worth it. Here's some perspective: a single crown replacement is $1,500 to $3,000. A broken tooth requiring an implant is $4,000 to $6,000. The wear we're seeing today tells me that without intervention, you'll face those costs. The bioSense™ at [price] doesn't just protect your teeth — it monitors your heart rate, your oxygen, your sleep quality every single night. That's less than a dollar fifty a day. People spend more than that on a daily coffee."`}
      />
      <ObjCard
        title={`"I already have a night guard."`}
        context="This patient is already convicted of the problem — they just need the upgrade narrative."
        response={`"That's great — so you already know protection is important. But here's the honest truth: a traditional night guard protects your teeth but tells you nothing. You have no idea if your grinding is getting better, worse, or changing. bioSense™ does everything your night guard does — full custom-fit protection — plus it monitors your grinding intensity and duration, your oxygen levels, your heart rate, your sleep quality. You'd be trading a blindfold for a complete health dashboard. Most patients who've worn a guard for years say this changes everything."`}
      />
      <ObjCard
        title={`"I need to think about it."`}
        context="This usually means there's a specific unaddressed concern. Find it and address it."
        response={`"Of course — I want you to feel completely comfortable with any decision you make here. Can I ask: what specific question or concern would I need to address for you to feel confident moving forward? [Listen.] Also — I do want you to know that our introductory pricing is only available for the next [timeframe], so I want to make sure you have all the information you need to decide while that's still an option."`}
      />
      <ObjCard
        title={`"I need to talk to my spouse / partner first."`}
        context="Respect the decision process while keeping momentum alive."
        response={`"Absolutely — that's completely understandable for any significant health investment. Let me send you home with our patient information and a link to our website at bytesense.ai. Could we schedule a quick call for you and your partner with our Patient Care Coordinator? We can answer all your questions together in about 10 minutes. That way neither of you is making a decision without the full picture."`}
      />
      <ObjCard
        title={`"Is this FDA approved?"`}
        context="Answer confidently and accurately. This is a wellness device — regulatory framing matters."
        response={`"The bioSense™ is a wellness monitoring device — the same regulatory category as an Oura Ring or Apple Watch. It's designed to track and provide health insights, and it's built and positioned exactly the same way those devices are. It's not classified as a medical device and isn't intended to diagnose, treat, or cure any medical condition — just like your fitness tracker. What it does incredibly well is give you objective, nightly health intelligence that most people have never had access to before."`}
      />
      <ObjCard
        title={`"Will it be comfortable to sleep in?"`}
        context="Normalize the adjustment period. Most patients adapt quickly."
        response={`"Like any oral appliance, it takes a brief adjustment period — usually 3 to 7 nights. Most patients find that within the first week they're sleeping with it comfortably and within two weeks they feel strange without it. The device is custom-fabricated from your exact digital scan, so the fit is highly precise. We also schedule a follow-up appointment to ensure everything is feeling right and make any needed adjustments."`}
      />
    </div>
  );
}

function MarketingSection() {
  const isMobile = useIsMobile();
  return (
    <div style={getSectionStyle(isMobile)}>
      <div style={sectionTag}>Section 11 — Growth Toolkit</div>
      <h2 style={sectionTitle}>Marketing <span style={accent}>Toolkit</span></h2>
      <p style={sectionSubtitle}>Ideas and strategies to drive patient awareness, interest, and conversion.</p>

      <h3 style={h3Style}>In-Office Strategies</h3>
      <ul style={{ listStyle: 'none', padding: 0, marginBottom: 28 }}>
        {[
          ['Treatment Room Display', 'Print and frame the bioSense™ device and app image in every treatment room. Patients will ask about it. "What is that?" is your opening.'],
          ['Front Desk Conversation Starter', 'Train front desk to mention bioSense™ at checkout for any patient who had wear noted in their chart. "By the way, were you told about the new health monitoring device we offer?"'],
          ['Waiting Room Display', 'A 5x7 or 8x10 card near the front desk: "Introducing bioSense™ — Know What Your Body Does While You Sleep." Include QR code to bytesense.ai.'],
          ['Hygiene Chart Flag', 'Flag charts of bruxism patients 1–2 days before appointments as bioSense™ candidates so the hygienist is prepared to have the conversation.'],
          ['Recall Cards & Appointment Reminders', 'Add a line to recall communications: "Ask us about bioSense™ — the first oral health intelligence platform."'],
          ['Patient Testimonial Wall', 'After first 5–10 patients receive their device, collect brief written testimonials. Post them in the treatment room. Social proof is the most powerful conversion tool available.'],
        ].map(([title, body]) => (
          <li key={title} style={{ padding: '12px 0', borderBottom: `1px solid ${BORDER}`, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ color: C.red, flexShrink: 0, marginTop: 2 }}>—</span>
            <span style={{ fontSize: 13, color: DIM, lineHeight: 1.75 }}><strong style={{ color: 'var(--bs-text)', display: 'block', marginBottom: 2 }}>{title}:</strong>{body}</span>
          </li>
        ))}
      </ul>

      <h3 style={h3Style}>Social Media Ideas</h3>
      <ul style={{ listStyle: 'none', padding: 0, marginBottom: 28 }}>
        {[
          ['Device Unboxing Reel', 'Film a 15–30 second reel showing the bioSense™ device arriving, being inserted, and the app data. No narration needed — the visual is the story. Caption: "This is not a night guard. This is health intelligence. #byteSense #bioSense #SleepHealth"'],
          ['Patient Data Reveal (with permission)', 'Share anonymized or willing-patient screenshots of their morning health score with a caption about what the data revealed. Performance, recovery, oxygen — real data is irresistible content.'],
          ['"Did You Know?" Series', 'Weekly educational posts on bruxism, sleep, HRV, SpO₂ — each one positioning bioSense™ as the solution. Example: "Did you know 1 in 3 adults grind their teeth at night without knowing it? The damage can take years to show up on X-rays — by then it\'s expensive."'],
          ['Staff Experience Post', 'If a team member wears the device, post their experience and data. Authenticity from inside the practice is powerful social content.'],
          ['Sleep Health Tips + byteSense CTA', '"5 Signs You\'re a Night Grinder" — educational content that ends with: "Ask us about the device that monitors it all while you sleep."'],
          ['Before/After Wear Comparison', 'Clinical photography showing documented wear facets with the caption: "This patient had no idea. Now they do — and now they\'re protected." (Always use patient-consented images.)'],
        ].map(([title, body]) => (
          <li key={title} style={{ padding: '12px 0', borderBottom: `1px solid ${BORDER}`, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ color: C.red, flexShrink: 0, marginTop: 2 }}>—</span>
            <span style={{ fontSize: 13, color: DIM, lineHeight: 1.75 }}><strong style={{ color: 'var(--bs-text)', display: 'block', marginBottom: 2 }}>{title}:</strong>{body}</span>
          </li>
        ))}
      </ul>

      <h3 style={h3Style}>Patient Communication — Email &amp; Text</h3>
      <div style={{ ...cardStyle('teal'), marginBottom: 16 }}>
        <div style={cardTitle}>Recall Email Template — byteSense Introduction</div>
        <div style={{ ...cardBody, fontStyle: 'italic', marginTop: 8 }}>"Hi [Name], we're looking forward to seeing you for your appointment on [date]. We have something exciting to share with you — we now offer an advanced health monitoring device called bioSense™ that many of our patients are finding transformational. It monitors your sleep, your oxygen levels, your heart rate, and your grinding activity every single night — all from a custom-fit oral appliance. We'd love to tell you more when you come in. Visit bytesense.ai to learn more before your appointment."</div>
      </div>

      <div style={highlightBox(true)}>
        <div style={hlLabel(true)}>Introductory Offer — Beta Period Only</div>
        <h3 style={hlTitle}>Suggested Patient-Facing Offer Language</h3>
        <p style={hlBody}>"We are proud to offer the bioSense™ health intelligence platform exclusively to our patients during a limited Beta introduction. For a short time, the device is available at our introductory member price of just $[495–$695] — a significant savings from our standard investment. This offer is available for the next 90 days. Ask us how to get started."</p>
      </div>
    </div>
  );
}

function PatientFAQSection() {
  const isMobile = useIsMobile();
  const faqs = [
    {
      q: 'Q: What exactly does the bioSense™ do?',
      a: 'bioSense™ is a custom-fit oral appliance with medical-grade sensors built in. While you sleep, it measures six things simultaneously: your heart rate, your heart rate variability (a key stress and recovery indicator), your blood oxygen levels, your breathing rate, your body temperature, and your grinding activity — including exactly how long and how hard you grind. All of this data goes to an app on your phone. Every morning you see a health score and detailed breakdown of what your body did while you slept.',
    },
    {
      q: 'Q: Is this the same as a night guard?',
      a: "Not at all. A night guard is protective — it prevents your upper and lower teeth from damaging each other when you grind. bioSense™ provides that same protection, but it also monitors your body all night long. Think of the difference between a seatbelt (which only protects you) and a car with a complete dashboard of sensors (which protects you AND tells you everything that's happening). bioSense™ is the complete dashboard.",
    },
    {
      q: 'Q: Will my insurance cover this?',
      a: 'bioSense™ is a wellness monitoring device — similar to an Apple Watch or Oura Ring — so it is not currently covered by dental or medical insurance. It is a patient-pay wellness investment. Your practice may be able to run your flex spending (FSA) or health savings account (HSA) funds toward this purchase — ask your coordinator.',
    },
    {
      q: 'Q: How is the device made?',
      a: "The process starts with a digital scan of your teeth — there's no messy impression material. The scan data is sent to our specialized lab, where the device is custom-fabricated precisely to your dental arch. It arrives back at your dental office within approximately 2–3 weeks, and your dentist delivers and fits it at a separate appointment.",
    },
    {
      q: 'Q: Is it comfortable to sleep in?',
      a: "Because it's completely custom-fit to your mouth, it's far more comfortable than a generic appliance. Like any new oral appliance, there's a brief adjustment period of 3–7 nights for most people. Within two weeks, the majority of patients report they don't notice it while sleeping and feel something is missing on nights they forget to wear it.",
    },
    {
      q: 'Q: What does the app show me?',
      a: "Every morning you'll see your byteSense Score™ — a composite health intelligence rating — along with detailed breakdowns: Bruxism duration and episodes, resting heart rate, heart rate variability, overnight oxygen levels, respiratory rate, body temperature trends, and movement data. You can track trends over days, weeks, and months. Many patients find the data reveals patterns they had no awareness of — and that awareness empowers real health changes.",
    },
    {
      q: 'Q: Is this device safe?',
      a: 'Absolutely. bioSense™ is fabricated from biocompatible dental materials and built to dental laboratory standards. The embedded sensors are sealed within the appliance and are passive monitoring systems — they emit no signals and require no radiation. The device is a wellness monitoring tool, not a medical instrument, and is designed for safe nightly use.',
    },
    {
      q: 'Q: What happens to my health data?',
      a: 'Your health data is collected and stored securely through the byteSense platform. For detailed information about data privacy, security practices, and how your information is used, please review the byteSense privacy policy at bytesense.ai. By signing the Patient Wellness Device Consent Form, you authorize the collection and processing of your biometric wellness data for health monitoring purposes.',
    },
    {
      q: 'Q: What if I have a problem with the device or the app?',
      a: 'For clinical issues with the fit or physical device, contact your dental practice directly. For technical questions about the app, data, or device connectivity, contact byteSense support at support@bytesense.ai. The byteSense team is available to help you get the most from your device.',
    },
  ];

  return (
    <div style={getSectionStyle(isMobile)}>
      <div style={sectionTag}>Section 13 — Patient Resources</div>
      <h2 style={sectionTitle}>Patient <span style={accent}>FAQ</span></h2>
      <p style={sectionSubtitle}>What your patients will ask — and exactly what to say. Feel free to print and provide this to patients.</p>

      <Accordion type="single" collapsible className="w-full" style={{ '--accordion-border': BORDER, '--accordion-bg': CARD } as React.CSSProperties}>
        {faqs.map((faq, i) => (
          <AccordionItem
            key={i}
            value={`item-${i}`}
            style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              marginBottom: 6,
              borderRadius: 0,
            }}
          >
            <AccordionTrigger
              style={{
                padding: '16px 20px',
                color: TEAL_C,
                fontSize: 14,
                fontWeight: 700,
                fontFamily: C.fn,
                textAlign: 'left',
                lineHeight: 1.5,
              }}
            >
              {faq.q}
            </AccordionTrigger>
            <AccordionContent
              style={{
                padding: '0 20px 18px',
                fontSize: 14,
                color: DIM,
                lineHeight: 1.75,
                borderTop: `1px solid ${BORDER}`,
                fontFamily: C.fn,
              }}
            >
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function SupportSection() {
  const isMobile = useIsMobile();
  return (
    <div style={{ ...getSectionStyle(isMobile), borderBottom: 'none' }}>
      <div style={sectionTag}>Section 15 — Support</div>
      <h2 style={sectionTitle}>Support<br /><span style={accent}>&amp; Warranty</span></h2>
      <p style={sectionSubtitle}>You are never alone in this. Here is exactly how to get help — for anything.</p>

      {/* Dr. Hendrik Lai */}
      <div style={{ ...cardStyle('teal'), marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: TEAL_C, marginBottom: 12 }}>MAIN DENTIST CONTACT</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--bs-text)', marginBottom: 4 }}>Dr. Hendrik Lai</div>
        <div style={{ fontSize: 13, color: DIM, marginBottom: 12 }}>Lead Dentist — Practice Point of Contact</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: TEAL_C, marginBottom: 4 }}>+1 (920) 331-7128</div>
        <div style={{ fontSize: 12, color: FAINT }}>Call or text for clinical questions, patient care decisions, and in-practice support.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 32 }}>
        <div style={cardStyle('red')}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: RED_B, marginBottom: 12 }}>YOUR DEDICATED BYTESENSE CONTACT</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--bs-text)', marginBottom: 4 }}>Natasha L. Blake</div>
          <div style={{ fontSize: 13, color: DIM, marginBottom: 2 }}>Chief Strategy &amp; Innovation Officer</div>
          <div style={{ fontSize: 13, color: DIM, marginBottom: 16 }}>byteSense</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: RED_B, marginBottom: 4 }}>909-527-9602</div>
          <div style={{ fontSize: 12, color: FAINT, marginBottom: 16 }}>Call or text — Natasha responds personally to all Beta partner inquiries</div>
          <div style={divider} />
          <div style={{ fontSize: 13, color: DIM }}>
            <strong style={{ color: 'var(--bs-text)' }}>Use for:</strong> Clinical questions, team training support, scan submission help, case status, pricing discussions, partnership questions, any concern about the program — anything at all.
          </div>
        </div>
        <div>
          <div style={{ ...cardStyle('teal'), marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: TEAL_C, marginBottom: 12 }}>PATIENT TECHNICAL SUPPORT</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--bs-text)', marginBottom: 4 }}>support@bytesense.ai</div>
            <div style={{ fontSize: 13, color: DIM }}>For patient-facing technical questions: app issues, device connectivity, data interpretation, account support.</div>
          </div>
          <div style={{ ...cardStyle('none'), borderLeft: `3px solid ${FAINT}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: FAINT, marginBottom: 12 }}>BYTESENSE WEBSITE</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--bs-text)', marginBottom: 4 }}>bytesense.ai</div>
            <div style={{ fontSize: 13, color: DIM }}>Direct patients here for product information, FAQs, and company background. Also useful for your team's ongoing education.</div>
          </div>
        </div>
      </div>

      <h3 style={h3Style}>Warranty Information</h3>
      <div style={{ ...cardStyle('teal'), marginBottom: 32 }}>
        <div style={cardTitle}>12-Month Device Warranty</div>
        <div style={{ ...cardBody, marginTop: 8 }}>Every bioSense™ device is covered by a 12-month warranty from the date of delivery. The warranty covers manufacturing defects in the device and sensor systems. It does not cover loss, patient-caused damage, or normal wear from extended use. For warranty-related concerns, contact Natasha Blake or support@bytesense.ai with the patient name, case number, and description of the issue. Warranty decisions are made in partnership with the practice — your patient's satisfaction is our satisfaction.</div>
      </div>

      <h3 style={h3Style}>A Final Word From byteSense</h3>
      <div style={highlightBox()}>
        <div style={hlLabel()}>Our Commitment to You</div>
        <h3 style={hlTitle}>We Are In This Together</h3>
        <p style={hlBody}>Your success with bioSense™ is not just our goal — it is our responsibility. If something isn't working, we want to know immediately. If your team needs additional training, we will provide it. If a patient has a concern, we will address it. You accepted the risk of being an early partner. We accept the responsibility of making that risk worthwhile. Call us. Text us. Show up on our doorstep if you need to. We are here.</p>
      </div>

      <div style={{ marginTop: 40, paddingTop: 32, borderTop: `1px solid ${BORDER}`, textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: FAINT, letterSpacing: 2, marginBottom: 8 }}>BYTESENSE · bytesense.ai</div>
        <div style={{ fontSize: 10, color: FAINT }}>Beta Partner Onboarding Package · Confidential · Not for Distribution</div>
        <div style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>This document is provided exclusively to byteSense Beta Practice Partners and contains proprietary operational information.</div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SalesTrainingScreen(props: SalesTrainingScreenProps) {
  const [activeSection, setActiveSection] = useState('training-module');
  const isMobile = useIsMobile();

  const scrollRef = useRef<HTMLDivElement>(null);
  const tabStripRef = useRef<HTMLDivElement>(null);

  const scrollTabIntoView = (id: string) => {
    const strip = tabStripRef.current;
    if (!strip) return;
    const btn = strip.querySelector<HTMLElement>(`[data-tab="${id}"]`);
    if (!btn) return;
    strip.scrollTo({
      left: btn.offsetLeft - strip.offsetWidth / 2 + btn.offsetWidth / 2,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const onScroll = () => {
      const containerTop = container.getBoundingClientRect().top;
      let current = '';
      container.querySelectorAll<HTMLElement>('[data-sid]').forEach(el => {
        if (el.getBoundingClientRect().top - containerTop <= 120) current = el.dataset.sid || '';
      });
      if (current) { setActiveSection(current); scrollTabIntoView(current); }
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const container = scrollRef.current;
    if (!container) return;
    const el = container.querySelector<HTMLElement>(`[data-sid="${id}"]`);
    if (!el) return;
    container.scrollTo({
      top: el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop,
      behavior: 'smooth',
    });
  };

  const navGroups = [
    {
      label: 'Training Curriculum',
      items: [{ id: 'training-module', label: 'Sales Training Module' }],
    },
    {
      label: 'Getting Started',
      items: [
        { id: 'about', label: 'About bioSense™' },
        { id: 'beta', label: 'Your Beta Program' },
      ],
    },
    {
      label: 'Sales & Growth',
      items: [
        { id: 'pricing', label: 'Pricing Strategy' },
        { id: 'sales', label: 'Sales Training & Scripts' },
        { id: 'objections', label: 'Objection Handling' },
        { id: 'marketing', label: 'Marketing Toolkit' },
      ],
    },
    {
      label: 'Operations',
      items: [
        { id: 'patient-faq', label: 'Patient FAQ' },
        { id: 'support', label: 'Support & Warranty' },
      ],
    },
  ];

  const navItemStyle = (id: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 24px',
    fontSize: 13, fontWeight: activeSection === id ? 600 : 400,
    color: activeSection === id ? RED_B : DIM,
    background: activeSection === id ? RED_MUT : 'transparent',
    borderLeft: `2px solid ${activeSection === id ? C.red : 'transparent'}`,
    cursor: 'pointer', transition: 'all 0.15s',
    fontFamily: C.fn,
  });

  return (
    <div style={{ display: 'flex', height: isMobile ? 'calc(100dvh - 60px)' : '100vh', background: BG, fontFamily: C.fn }}>

      {/* ── Inner sidebar ── */}
      {!isMobile && (
      <nav style={{
        width: 260, minWidth: 260,
        background: SURFACE,
        borderRight: `1px solid ${BORDER}`,
        position: 'sticky', top: 0, height: '100vh',
        overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
        flexShrink: 0,
        zIndex: 10,
      }}>
        {/* Logo area */}
        <div style={{ padding: '28px 24px 20px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: 'var(--bs-text)', marginBottom: 8 }}>
            byte<span style={{ color: RED_B }}>Sense</span>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 600, letterSpacing: 2, color: RED_B,
            background: RED_MUT, border: `1px solid ${RED_BDR}`, padding: '3px 10px', display: 'inline-block',
          }}>BETA PARTNER</span>
        </div>

        {/* Nav */}
        <div style={{ padding: '16px 0', flex: 1 }}>
          {navGroups.map((group) => (
            <div key={group.label}>
              <div style={{ padding: '8px 24px 4px', fontSize: 9, fontWeight: 700, letterSpacing: '2.5px', color: FAINT, textTransform: 'uppercase' }}>
                {group.label}
              </div>
              {group.items.map(item => (
                <div
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  style={navItemStyle(item.id)}
                  onMouseEnter={e => { if (activeSection !== item.id) e.currentTarget.style.background = CARD; }}
                  onMouseLeave={e => { if (activeSection !== item.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                    background: activeSection === item.id ? RED_B : FAINT,
                  }} />
                  {item.label}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Support footer */}
        <div style={{ padding: '20px 24px', borderTop: `1px solid ${BORDER}` }}>
          <div style={{ background: RED_MUT, border: `1px solid ${RED_BDR}`, padding: 14 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: RED_B, fontWeight: 700, marginBottom: 6 }}>Contact Support</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bs-text)', marginBottom: 2 }}>+1 (888) 397-7073</div>
            <div style={{ fontSize: 13, color: DIM }}>support@bytesense.ai</div>
          </div>
        </div>
      </nav>
      )}

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>


        {/* Mobile horizontal tab strip */}
        {isMobile && (
          <div ref={tabStripRef} style={{ overflowX: 'auto', whiteSpace: 'nowrap', borderBottom: `1px solid ${BORDER}`, padding: '0 4px', flexShrink: 0, WebkitOverflowScrolling: 'touch' as any, position: 'sticky', top: 0, zIndex: 20, background: BG }}>
            {[
              { id: 'training-module', label: 'Training' },
              { id: 'about', label: 'bioSense™' },
              { id: 'beta', label: 'Beta Program' },
              { id: 'pricing', label: 'Pricing' },
              { id: 'sales', label: 'Sales Scripts' },
              { id: 'objections', label: 'Objections' },
              { id: 'marketing', label: 'Marketing' },
              { id: 'patient-faq', label: 'Patient FAQ' },
              { id: 'support', label: 'Support' },
            ].map(item => (
              <button key={item.id} data-tab={item.id}
                onClick={() => { scrollToSection(item.id); scrollTabIntoView(item.id); }}
                style={{
                  display: 'inline-block', padding: '10px 14px', fontSize: 12, fontWeight: 500,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: activeSection === item.id ? RED_B : '#777',
                  borderBottom: `2px solid ${activeSection === item.id ? RED_B : 'transparent'}`,
                  whiteSpace: 'nowrap', minHeight: 44, fontFamily: C.fn,
                }}>{item.label}
              </button>
            ))}
          </div>
        )}

        {/* Section content */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <div data-sid="training-module"><Dashboard {...props} /></div>
          <div data-sid="about"><AboutSection /></div>
          <div data-sid="beta"><BetaSection /></div>
          <div data-sid="pricing"><PricingSection /></div>
          <div data-sid="sales"><SalesSection /></div>
          <div data-sid="objections"><ObjectionsSection /></div>
          <div data-sid="marketing"><MarketingSection /></div>
          <div data-sid="patient-faq"><PatientFAQSection /></div>
          <div data-sid="support"><SupportSection /></div>
        </div>
      </div>
    </div>
  );
}
