import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { C } from '@/data/constants';
import { useIsMobile } from '@/hooks/use-mobile';

// ── Colours (mirrored from HTML variables) ──────────────────────────────────
const BG      = '#0A0A0A';
const SURFACE = '#111111';
const CARD    = '#181818';
const BORDER  = '#252525';
const BORDER2 = '#2E2E2E';
const DIM     = '#A0A0A0';
const FAINT   = '#555555';
const RED_B   = '#E63434';
const RED_MUT = '#3A1515';
const RED_BDR = '#5a1010';
const TEAL_C  = '#00B4AD';
const TEAL_MUT= '#003D3B';
const TRUST_TEAL = '#00B894';   // card-2 recovery green
const TRUST_AMBER = '#D97706';  // card-1 avatar

// ── Nav data ────────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'Office Benefits',
    items: [
      { id: 'ob-revenue',     label: 'Increase Practice Revenue' },
      { id: 'ob-retention',   label: 'Enhance Patient Retention' },
      { id: 'ob-trust',       label: 'Enhance Trust & Loyalty' },
      { id: 'ob-positioning', label: 'Enhance Practice Positioning' },
      { id: 'ob-liability',   label: 'Liability Protection' },
      { id: 'ob-premium',     label: 'Premium Practice Differentiation' },
    ],
  },
  {
    label: 'Consumer Benefits',
    items: [
      { id: 'cb-sleep',       label: 'Track Sleep & Recovery' },
      { id: 'cb-readiness',   label: 'Daily Readiness (HR/HRV)' },
      { id: 'cb-morning',     label: 'Morning Outlook & Insights' },
      { id: 'cb-circulation', label: 'Intra-Oral Circulation Tracking' },
      { id: 'cb-position',    label: 'Sleep Position-Aware Insights' },
      { id: 'cb-oral',        label: 'Oral Intelligence' },
      { id: 'cb-discover',    label: 'Discover What Impacts Sleep' },
    ],
  },
];

// ── Shared layout helpers ────────────────────────────────────────────────────
const sectionStyle: React.CSSProperties = {
  maxWidth: 900,
  padding: '72px 64px',
  borderBottom: `1px solid ${BORDER}`,
  fontFamily: C.fn,
};

const sectionTag: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: 3, color: C.red,
  textTransform: 'uppercase', marginBottom: 12, fontFamily: C.fn,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 38, fontWeight: 800, lineHeight: 1.1,
  letterSpacing: -1, marginBottom: 8, color: '#F4F4F4', fontFamily: C.fn,
};

const sectionSubtitle: React.CSSProperties = {
  fontSize: 16, color: DIM, fontWeight: 400,
  marginBottom: 0, maxWidth: 600, fontFamily: C.fn,
};

const accent: React.CSSProperties = { color: RED_B };

const footerBlock: React.CSSProperties = {
  marginTop: 40, paddingTop: 32,
  borderTop: `1px solid ${BORDER}`, textAlign: 'center',
};

// ── Office Benefits items ────────────────────────────────────────────────────
const OFFICE_ITEMS = [
  {
    id: 'ob-revenue',
    trigger: 'Increase Practice Revenue',
    body: 'Support more personalized conversations around enhanced options — starting with a comfortable, high-quality intraoral wearable. Once consumers are engaged, it becomes easier to naturally introduce topics like sleep quality, muscle tension, or long-term oral wellness. Turn insights into $3K+ cases.',
  },
  {
    id: 'ob-retention',
    trigger: 'Enhance Patient Retention',
    body: 'Wellness tracking builds lasting engagement by giving consumers something to stay curious about — their own habits. A simple wearable keeps oral wellness top-of-mind between check-ins, encouraging ongoing interaction and creating natural opportunities to explore optional enhancements. Earn $10–$30/month per patient through a recurring engagement model.',
  },
  {
    id: 'ob-trust',
    trigger: 'Enhance Trust & Loyalty',
    body: 'When consumers feel seen beyond the surface, trust deepens. Framing oral care in the context of whole-body wellness invites more meaningful dialogue, strengthens credibility, and positions your brand as a thoughtful guide on their broader health journey. More trust = more retained revenue, more referrals, and more reactivations.',
  },
  {
    id: 'ob-positioning',
    trigger: 'Enhance Practice Positioning',
    body: 'Offer data-enriched dentistry without changing your workflow. Use wellness insights to spark more informed consumer dialogues — boost patient engagement and confidence with real-time, personalized wellness insights. Elevate your care model and deliver more tailored recommendations without disrupting your clinical flow.',
  },
  {
    id: 'ob-liability',
    trigger: 'Liability Protection',
    body: 'Verified wear-time data eliminates the "I wore it every night" ambiguity. Certain behavioral patterns may suggest the need for further evaluation — enabling more informed wellness conversations. Track nighttime behavior trends and gain visibility into consumer oral behavior patterns over time, from daily usage to abnormal jaw behavior patterns, helping promote proactive care.',
  },
  {
    id: 'ob-premium',
    trigger: 'Premium Practice Differentiation',
    body: 'Build trust and loyalty through personalized wellness engagement — open the door to ongoing conversations grounded in consumer-led insight and behavioral awareness. Integrate with other wellness providers: behavioral insights may help inform referrals to broader wellness providers when appropriate. Infer from objective data — consumer wear data becomes a valuable reference point in discussing oral health behavior.',
  },
];

// ── Consumer Benefits items ──────────────────────────────────────────────────
const CONSUMER_ITEMS = [
  {
    id: 'cb-sleep',
    trigger: 'Track Sleep & Recovery',
    title: 'Track Sleep & Recovery',
    body: [
      'Get a daily wellness snapshot of nighttime behavior — including trends in mouth movement and duration.',
      '',
      'What\'s tracked:',
      '• One number that sums up your night\'s rest — combines total sleep length, interruptions, and overall quality into a single easy-to-track metric',
      '• Breakdown of light, deep, and REM stages — see how much time in each stage and whether you\'re getting enough restorative sleep',
      '• Total hours of rest — tracks how long you slept to see if you\'re meeting nightly sleep goals',
    ],
  },
  {
    id: 'cb-readiness',
    trigger: 'Daily Readiness (HR/HRV)',
    title: 'Daily Readiness (HR/HRV)',
    body: [
      'Gauge your body\'s resilience — byteSense integrates HRV, sleep quality, and jaw activity data into a single recovery snapshot. Learn how well you\'re bouncing back from daily stressors.',
      '',
      'What\'s tracked:',
      '• How ready you are to tackle the day — analyzes HRV, bruxism intensity, and sleep quality',
      '• Monitor your heart rate variability (HRV) — tracks changes over time, reflecting your body\'s resilience to stress and capacity for recovery',
      '• Correlate HRV, sleep, and grinding metrics to decode stress responses and recovery patterns',
    ],
  },
  {
    id: 'cb-morning',
    trigger: 'Morning Outlook & Personalized Insights',
    title: 'Morning Outlook & Personalized Insights',
    body: [
      'Recommended focus for better rest and recovery — get behavioral nudges rooted in your personal sleep rhythm and nighttime activity.',
      '',
      'What\'s delivered:',
      '• Personalized nudges for a healthier you — tailor-made insights and alerts to help you make better choices in real time',
      '• Celebrate positive trends — track usage and progress over time to support habit formation and oral health awareness',
      '• See how daily habits may influence oral activity — your app reveals how factors like stress, caffeine, or screen time correlate with jaw activity',
    ],
  },
  {
    id: 'cb-circulation',
    trigger: 'Intra-Oral Circulation Tracking',
    title: 'Intra-Oral Blood Circulation Tracking',
    body: [
      'Oral PPG sensor captures heart rate through palatal blood flow — the most stable position on the body. Oral SpO₂ detects oxygen desaturation events 7 seconds faster than peripheral sensors at the wrist or finger.',
      '',
      'Why oral wins:',
      '• The mouth is immune to vasoconstriction that degrades peripheral readings',
      '• Oral data correlates more closely with arterial blood gas measurements — the gold standard',
      '• Provides a clearer signal of brain oxygenation — not incremental improvement, a different category of accuracy',
    ],
  },
  {
    id: 'cb-position',
    trigger: 'Sleep Position-Aware Insights',
    title: 'Sleep Position-Aware Insights',
    body: [
      'Using movement and jaw activity data, get advanced insights into how your body reacts to stress and fatigue. 3-axis accelerometer detects sleep position, correlating posture with bruxism and airway events.',
      '',
      'What\'s tracked:',
      '• Head and jaw movement throughout the night',
      '• Correlation between sleep position and grinding intensity',
      '• Positional OSA patterns and restlessness markers',
    ],
  },
  {
    id: 'cb-oral',
    trigger: 'Oral Intelligence for Sleep & Recovery',
    title: 'Oral Intelligence for Sleep & Recovery',
    body: [
      'Passive, mouth-worn wearable promotes awareness — not diagnosis — so you can better understand how your body responds to daily stress or sleep patterns.',
      '',
      'What\'s surfaced:',
      '• Abnormal jaw activity detection: episodes and duration',
      '• Jaw activity patterns while you sleep',
      '• Correlation between behavioral indicators (like abnormal bite activity and HRV) and nighttime routines',
    ],
  },
  {
    id: 'cb-discover',
    trigger: 'Discover What Impacts Your Sleep',
    title: 'Discover What Impacts Your Sleep',
    body: [
      'Longitudinal data over weeks and months reveals the specific habits, patterns, and conditions that improve or degrade sleep quality for each individual patient.',
      '',
      'Lifestyle tracking:',
      '• Track how consumption of caffeine affects sleep — see if late-day caffeine intake aligns with more frequent grinding or restless sleep',
      '• Record habits like diet and exercise — log daily routines to spot patterns affecting nighttime grinding and sleep quality',
      '• Guided exercises and tips to wind down — quick stress-relief techniques before bed, potentially reducing bruxism episodes',
      '• Quick snapshot of your daily habits to quantify how much potential damage byteSense helped you avert',
    ],
  },
];

// ── Render body lines ────────────────────────────────────────────────────────
function BodyLines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((line, i) => {
        if (line === '') return <br key={i} />;
        if (line.startsWith('•')) {
          return (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
              <span style={{ color: RED_B, flexShrink: 0 }}>•</span>
              <span>{line.slice(1).trim()}</span>
            </div>
          );
        }
        // section sub-header (ends with ':')
        if (line.endsWith(':')) {
          return (
            <div key={i} style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: RED_B, textTransform: 'uppercase', marginTop: 16, marginBottom: 8 }}>
              {line}
            </div>
          );
        }
        return <p key={i} style={{ marginBottom: 10 }}>{line}</p>;
      })}
    </>
  );
}

// ── Shared card chrome ───────────────────────────────────────────────────────
const CARD_CHROME: React.CSSProperties = {
  display: 'flex', flexDirection: 'column',
  background: '#14100E', borderRadius: 32, padding: '16px 16px 28px',
  border: '1px solid rgba(255,255,255,0.05)',
  boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 40px 80px -30px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.4)',
  height: '100%', boxSizing: 'border-box' as const,
};
const VISUAL_BASE: React.CSSProperties = {
  position: 'relative', aspectRatio: '1 / 1', borderRadius: 22, overflow: 'hidden',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.03)',
};
const GLASS_BASE: React.CSSProperties = {
  position: 'absolute',
  background: 'rgba(20,14,10,0.30)',
  backdropFilter: 'blur(28px) saturate(140%)',
  WebkitBackdropFilter: 'blur(28px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 24px 50px -20px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10)',
  color: '#F4EFEA',
  zIndex: 5,
};
const VIGNETTE: React.CSSProperties = {
  position: 'absolute', inset: 0,
  background: 'radial-gradient(ellipse 100% 100% at 50% 30%, transparent 50%, rgba(0,0,0,0.5) 100%)',
  pointerEvents: 'none', zIndex: 1,
};

// shared glass style (without position so we can set it per-element)
const glassCard = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  position: 'absolute',
  background: 'rgba(20,14,10,0.30)',
  backdropFilter: 'blur(28px) saturate(140%)',
  WebkitBackdropFilter: 'blur(28px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 24px 50px -20px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10)',
  color: '#F4EFEA',
  zIndex: 5,
  ...extra,
});
const glassPin = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  ...glassCard({ zIndex: 7, ...extra }),
});

// ── Trust & Loyalty — Card A: Behavioral nudge ───────────────────────────────
// ── Card A: Behavioral nudge ─────────────────────────────────────────────────
function TrustCard1() {
  return (
    <div style={{ background: '#14100E', borderRadius: 32, padding: '16px 16px 28px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 40px 80px -30px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.4)' }}>
      {/* Visual */}
      <div style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 22, overflow: 'hidden', background: `radial-gradient(ellipse 70% 50% at 78% 35%, rgba(255,180,120,0.50) 0%, rgba(255,139,92,0.25) 35%, transparent 65%), radial-gradient(ellipse 120% 80% at 20% 110%, rgba(60,30,20,0.6) 0%, transparent 60%), linear-gradient(160deg, #1F1411 0%, #2A1A14 30%, #14100E 60%, #0A0807 100%)` }}>
        {/* Lamp bloom */}
        <div style={{ position: 'absolute', width: '90%', height: '90%', right: '-15%', top: '5%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,200,140,0.28) 0%, rgba(255,160,100,0.10) 40%, transparent 70%)', filter: 'blur(24px)', pointerEvents: 'none' }} />

        {/* Top-left pill */}
        <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 6, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px', borderRadius: 999, background: 'rgba(10,6,4,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.11)', color: '#F4EFEA', fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#FF8B5C', fontSize: 7 }}>●</span>
          Disturbance · elevated
        </div>
        <span style={{ position: 'absolute', top: 19, right: 16, zIndex: 6, fontFamily: 'monospace', fontSize: 9, color: 'rgba(244,239,234,0.4)', letterSpacing: '0.06em' }}>9:47 PM</span>

        {/* Nudge card — bottom-anchored */}
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16, padding: '12px 14px', borderRadius: 16, background: 'rgba(10,6,4,0.62)', backdropFilter: 'blur(24px) saturate(130%)', WebkitBackdropFilter: 'blur(24px) saturate(130%)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 16px 32px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)', zIndex: 5 }}>
          <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontSize: 13.5, lineHeight: 1.45, color: '#F4EFEA', margin: '0 0 10px' }}>
            "Disturbance climbing again. Try a slow exhale — I'll re-check at sunrise."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, paddingTop: 9, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg, #FF8B5C, #FF6B70)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7.5, fontWeight: 700, color: '#F4EFEA', flexShrink: 0 }}>DM</div>
            <span style={{ fontSize: 10, color: 'rgba(244,239,234,0.80)' }}>Dr. Marin <span style={{ color: 'rgba(244,239,234,0.40)' }}>· behavioral wellness</span></span>
          </div>
        </div>

        {/* Vignette */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 100% 100% at 50% 25%, transparent 45%, rgba(0,0,0,0.45) 100%)', pointerEvents: 'none' }} />
      </div>

      {/* Caption */}
      <div style={{ padding: '24px 8px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.18em', color: '#F4EFEA', marginBottom: 14 }}>Trust &amp; Loyalty</div>
        <h3 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontWeight: 400, fontSize: 28, lineHeight: 1.18, letterSpacing: '-0.005em', color: '#F4EFEA', margin: '0 0 12px' }}>
          The provider <span style={{ fontFamily: C.fn, fontStyle: 'normal', fontWeight: 500, letterSpacing: '-0.02em' }}>who notices.</span>
        </h3>
        <p style={{ fontFamily: C.fn, fontSize: 14.5, lineHeight: 1.6, color: DIM, margin: 0 }}>
          Patients trust providers who stay engaged beyond the chair. byteSense creates personalized follow-up moments tied to real behavior, reinforcing care and strengthening long-term loyalty.
        </p>
      </div>
    </div>
  );
}

// ── Card B: HRV / recovery curve ─────────────────────────────────────────────
function TrustCard2() {
  return (
    <div style={{ background: '#14100E', borderRadius: 32, padding: '16px 16px 28px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 40px 80px -30px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.4)' }}>
      {/* Visual */}
      <div style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 22, overflow: 'hidden', background: `radial-gradient(ellipse 60% 40% at 50% 18%, rgba(140,200,200,0.28) 0%, rgba(60,120,140,0.12) 40%, transparent 70%), radial-gradient(ellipse 100% 60% at 50% 110%, rgba(20,40,55,0.85) 0%, transparent 65%), linear-gradient(170deg, #0E1820 0%, #0A1015 50%, #050708 100%)` }}>
        {/* Horizon glow */}
        <div style={{ position: 'absolute', top: '55%', right: 0, bottom: 0, left: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,180,140,0.14) 0%, transparent 60%)', pointerEvents: 'none' }} />

        {/* Top pill */}
        <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 6, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: '#F4EFEA', whiteSpace: 'nowrap' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgb(156,201,176)', boxShadow: '0 0 6px rgba(156,201,176,0.8)', flexShrink: 0 }} />
          Recovery improving
        </div>

        {/* HRV card — bottom-anchored */}
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16, padding: '12px 14px 14px', borderRadius: 16, background: 'rgba(14,20,28,0.55)', backdropFilter: 'blur(24px) saturate(130%)', WebkitBackdropFilter: 'blur(24px) saturate(130%)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 16px 32px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)', zIndex: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
            <span style={{ fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.11em', color: 'rgba(244,239,234,0.45)' }}>HRV · 7-night avg</span>
            <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgb(156,201,176)' }}>↑ 23%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
            <span style={{ fontWeight: 300, fontSize: 40, lineHeight: 1, letterSpacing: '-0.03em', color: '#F4EFEA' }}>68</span>
            <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontSize: 13, color: 'rgb(156,201,176)' }}>ms HRV</span>
          </div>
          <svg viewBox="0 0 360 44" preserveAspectRatio="none" style={{ width: '100%', height: 36, display: 'block', marginBottom: 6, overflow: 'visible' }}>
            <defs>
              <linearGradient id="hrv-stroke-b" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="rgba(156,201,176,0.4)" />
                <stop offset="50%" stopColor="rgba(255,200,170,0.95)" />
                <stop offset="100%" stopColor="rgba(255,200,170,1)" />
              </linearGradient>
              <linearGradient id="hrv-fill-b" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,200,170,0.16)" />
                <stop offset="100%" stopColor="rgba(255,200,170,0)" />
              </linearGradient>
            </defs>
            <path d="M 0 36 L 30 34 L 60 38 L 90 32 L 120 28 L 150 26 L 180 22 L 210 20 L 240 16 L 270 14 L 300 10 L 330 8 L 360 4 L 360 44 L 0 44 Z" fill="url(#hrv-fill-b)" />
            <path d="M 0 36 L 30 34 L 60 38 L 90 32 L 120 28 L 150 26 L 180 22 L 210 20 L 240 16 L 270 14 L 300 10 L 330 8 L 360 4" fill="none" stroke="url(#hrv-stroke-b)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 3px rgba(255,200,170,0.5))' }} />
            <circle cx="360" cy="4" r="2.5" fill="#F4EFEA" />
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: 8.5, color: 'rgba(244,239,234,0.35)', letterSpacing: '0.07em' }}>
            <span>14d ago</span><span>tonight</span>
          </div>
        </div>

        {/* Bottom-right pill */}
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 6, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: '#F4EFEA', whiteSpace: 'nowrap' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgb(255,139,92)', flexShrink: 0 }} />
          +2.4h/wk
        </div>

        {/* Vignette */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 100% 100% at 50% 25%, transparent 45%, rgba(0,0,0,0.45) 100%)', pointerEvents: 'none' }} />
      </div>

      {/* Caption */}
      <div style={{ padding: '24px 8px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.18em', color: '#F4EFEA', marginBottom: 14 }}>Trust &amp; Loyalty</div>
        <h3 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontWeight: 400, fontSize: 28, lineHeight: 1.18, letterSpacing: '-0.005em', color: '#F4EFEA', margin: '0 0 12px' }}>
          The body, <span style={{ fontFamily: C.fn, fontStyle: 'normal', fontWeight: 500, letterSpacing: '-0.02em' }}>getting better with you.</span>
        </h3>
        <p style={{ fontFamily: C.fn, fontSize: 14.5, lineHeight: 1.6, color: DIM, margin: 0 }}>
          When patients see their progress over time, treatment feels more meaningful. byteSense reinforces provider guidance through ongoing recovery and sleep insights that improve engagement and retention.
        </p>
      </div>
    </div>
  );
}

// ── Card C: Provider message ──────────────────────────────────────────────────
function TrustCard3() {
  return (
    <div style={{ background: '#14100E', borderRadius: 32, padding: '16px 16px 28px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 40px 80px -30px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.4)' }}>
      {/* Visual */}
      <div style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 22, overflow: 'hidden', background: `radial-gradient(ellipse 80% 55% at 30% 25%, rgba(180,200,170,0.28) 0%, rgba(120,140,110,0.12) 40%, transparent 70%), radial-gradient(ellipse 90% 70% at 80% 105%, rgba(40,55,40,0.6) 0%, transparent 65%), linear-gradient(165deg, #1A2018 0%, #141812 50%, #0A0C09 100%)` }}>
        {/* Window-light bloom */}
        <div style={{ position: 'absolute', width: '55%', height: '80%', left: '-10%', top: '8%', borderRadius: '0 30% 40% 0', background: 'radial-gradient(ellipse 70% 100% at 30% 50%, rgba(255,220,180,0.16) 0%, transparent 70%)', filter: 'blur(28px)', pointerEvents: 'none' }} />

        {/* Stat pill — top right */}
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 6, display: 'inline-flex', flexDirection: 'column' as const, gap: 2, padding: '7px 11px', borderRadius: 12, background: 'rgba(10,14,10,0.55)', backdropFilter: 'blur(16px) saturate(130%)', WebkitBackdropFilter: 'blur(16px) saturate(130%)', border: '1px solid rgba(255,255,255,0.10)', color: '#F4EFEA' }}>
          <span style={{ fontFamily: C.fn, fontWeight: 300, fontSize: 20, lineHeight: 1, letterSpacing: '-0.02em', color: '#F4EFEA' }}>
            14<span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontSize: 11, color: 'rgb(156,201,176)', marginLeft: 3 }}>/14</span>
          </span>
          <span style={{ fontFamily: C.fn, fontSize: 7.5, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: 'rgba(244,239,234,0.45)', whiteSpace: 'nowrap' }}>Nights · adherence</span>
        </div>

        {/* Message card — bottom-anchored */}
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16, padding: '12px 14px 12px', borderRadius: 16, background: 'rgba(8,12,8,0.62)', backdropFilter: 'blur(24px) saturate(130%)', WebkitBackdropFilter: 'blur(24px) saturate(130%)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 16px 32px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)', zIndex: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #6B8C70, #A8C49A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#14100E', flexShrink: 0 }}>SH</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 1 }}>
              <span style={{ fontFamily: C.fn, fontSize: 10.5, color: '#F4EFEA' }}>Dr. Sasha Holloway</span>
              <span style={{ fontFamily: C.fn, fontSize: 8.5, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: 'rgba(244,239,234,0.40)' }}>For Maya</span>
            </div>
          </div>
          <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontSize: 13.5, lineHeight: 1.45, color: '#F4EFEA', margin: '0 0 10px' }}>
            "Readings steadier this week — beautiful work. Try five minutes of stretching tonight."
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            {[{ label: 'Reply', primary: true }, { label: 'Mark done', primary: false }].map(btn => (
              <span key={btn.label} style={{ padding: '5px 10px', borderRadius: 999, background: btn.primary ? 'rgba(244,239,234,0.90)' : 'rgba(255,255,255,0.08)', border: btn.primary ? 'none' : '1px solid rgba(255,255,255,0.10)', fontFamily: C.fn, fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: btn.primary ? '#14100E' : 'rgba(244,239,234,0.75)', cursor: 'pointer' }}>{btn.label}</span>
            ))}
          </div>
        </div>

        {/* Vignette */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 100% 100% at 50% 25%, transparent 45%, rgba(0,0,0,0.45) 100%)', pointerEvents: 'none' }} />
      </div>

      {/* Caption */}
      <div style={{ padding: '24px 8px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.18em', color: '#F4EFEA', marginBottom: 14 }}>Trust &amp; Loyalty</div>
        <h3 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontWeight: 400, fontSize: 28, lineHeight: 1.18, letterSpacing: '-0.005em', color: '#F4EFEA', margin: '0 0 12px' }}>
          A practice that <span style={{ fontFamily: C.fn, fontStyle: 'normal', fontWeight: 500, letterSpacing: '-0.02em' }}>writes back.</span>
        </h3>
        <p style={{ fontFamily: C.fn, fontSize: 14.5, lineHeight: 1.6, color: DIM, margin: 0 }}>
          Consistent digital touchpoints help patients feel supported between visits — not forgotten after treatment. That connection strengthens trust and positions your practice as modern and attentive.
        </p>
      </div>
    </div>
  );
}

// ── Liability Protection — compliance tracking card + two-column hero + dropdown
function LiabilitySection() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const barHeights = [60, 75, 65, 80, 90, 70, 95, 85, 100, 78, 88, 92, 100, 96];
  const alertBar   = 7; // 0-indexed, position 8 in the HTML (alert bar)

  const patientPerception = [
    'More innovative',
    'More technologically advanced',
    'More comprehensive',
    'More invested in preventative health',
    'More engaged in long-term patient wellbeing',
    'More aligned with the future of healthcare',
  ];

  const upliftAreas = [
    'Treatment acceptance',
    'Patient trust',
    'Premium service positioning',
    'Long-term patient loyalty',
    'Referral generation',
    'Overall practice differentiation',
  ];

  const physiological = [
    'stress,',
    'sleep quality,',
    'nervous system activation,',
    'recovery,',
    'and long-term health behaviors.',
  ];

  return (
    <div data-sid="ob-liability" style={{ padding: isMobile ? '40px 16px' : '72px 64px', borderTop: `1px solid ${BORDER}`, fontFamily: C.fn }}>

      {/* ── Full-width heading ── */}
      <h2 style={{ fontSize: isMobile ? 36 : 54, fontWeight: 800, lineHeight: 1.06, color: '#F4F4F4', margin: '0 0 52px', letterSpacing: -1.5 }}>
        <span style={{ fontStyle: 'italic', fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}>Liability Protection</span>
        {' '}<span style={{ fontFamily: C.fn, fontWeight: 800 }}>via Compliance Tracking.</span>
      </h2>

      {/* ── Two-column body ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '480px 1fr', gap: isMobile ? 40 : 64, alignItems: 'start' }}>

        {/* LEFT — card */}
        <div style={{ ...CARD_CHROME }}>
          {/* Visual area */}
          <div style={{
            ...VISUAL_BASE,
            background: `
              radial-gradient(ellipse 80% 40% at 50% 95%, rgba(255,180,120,0.14) 0%, rgba(180,120,80,0.06) 35%, transparent 65%),
              radial-gradient(ellipse 70% 50% at 30% 30%, rgba(60,90,120,0.20) 0%, transparent 60%),
              linear-gradient(170deg, #0B1422 0%, #07101C 50%, #040810 100%)
            `,
          }}>
            {/* Horizon warm glow */}
            <div style={{ position: 'absolute', top: '70%', right: 0, bottom: 0, left: 0, background: 'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(255,160,100,0.18) 0%, rgba(140,90,70,0.06) 35%, transparent 60%)', zIndex: 1, pointerEvents: 'none' }} />

            {/* Top-left pill */}
            <div style={glassPin({ top: 28, left: 28, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 10px 5px 9px', borderRadius: 999, fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.14em', whiteSpace: 'nowrap' })}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgb(156,201,176)', boxShadow: '0 0 8px rgba(156,201,176,0.9)', flexShrink: 0 }} />
              Protection protocol · active
            </div>

            {/* Top-right pill — alert / amber */}
            <div style={glassPin({ top: 28, right: 28, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 10px 5px 9px', borderRadius: 999, fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.14em', whiteSpace: 'nowrap' })}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgb(255,139,92)', boxShadow: '0 0 8px rgba(255,139,92,0.9)', flexShrink: 0 }} />
              Grinding ↑ night 8
            </div>

            {/* Hero number — 92% */}
            <div style={{ position: 'absolute', left: 28, top: 84, zIndex: 4 }}>
              <div style={{ fontWeight: 300, fontSize: 96, lineHeight: 1, letterSpacing: '-0.04em', color: '#F4EFEA' }}>
                92<span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontSize: 28, color: 'rgb(156,201,176)', marginLeft: 4 }}>%</span>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.16em', color: 'rgba(244,239,234,0.55)', marginTop: 4 }}>
                Appliance usage · this month
              </div>
            </div>

            {/* Glass timeline card */}
            <div style={glassCard({ left: 28, right: 28, bottom: 28, padding: '16px 18px 18px', borderRadius: 18 })}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: 'rgba(244,239,234,0.6)' }}>Night-guard adherence</span>
                <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgb(156,201,176)' }}>14 consecutive nights</span>
              </div>
              {/* Bar strip */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 26 }}>
                {barHeights.map((h, i) => (
                  <div key={i} style={{
                    flex: 1, borderRadius: 2, height: `${h}%`,
                    background: i === alertBar
                      ? 'linear-gradient(180deg, rgba(255,139,92,0.95), rgba(255,139,92,0.55))'
                      : 'linear-gradient(180deg, rgba(156,201,176,0.95), rgba(156,201,176,0.5))',
                    boxShadow: i === alertBar
                      ? '0 0 8px rgba(255,139,92,0.6)'
                      : '0 0 8px rgba(156,201,176,0.5)',
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: 'monospace', fontSize: 9.5, color: 'rgba(244,239,234,0.4)', letterSpacing: '0.08em' }}>
                <span>14d ago</span>
                <span>last night</span>
              </div>
            </div>

            {/* Vignette */}
            <div style={VIGNETTE} />
          </div>
        </div>

        {/* RIGHT — kicker, heading, body, Learn More */}
        <div style={{ paddingTop: isMobile ? 0 : 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.18em', color: 'rgb(255,139,92)', marginBottom: 16 }}>
            Liability Protection
          </div>
          <h3 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontWeight: 400, fontSize: isMobile ? 28 : 36, lineHeight: 1.18, letterSpacing: '-0.005em', color: '#F4EFEA', margin: '0 0 18px' }}>
            Protecting{' '}
            <span style={{ fontFamily: C.fn, fontStyle: 'normal', fontWeight: 500, letterSpacing: '-0.02em' }}>the work, every night.</span>
          </h3>
          <p style={{ fontSize: 16, lineHeight: 1.62, color: 'rgba(244,239,234,0.78)', margin: '0 0 32px', textWrap: 'pretty' as any, maxWidth: 520 }}>
            Continuous compliance visibility creates a defensible record of patient engagement and treatment adherence. byteSense quietly tracks appliance use, behavioral signals, and provider follow-through — protecting both the restorations and the practice that placed them, without ever feeling fear-based or legalistic.
          </p>

          {/* Learn more button */}
          <button
            onClick={() => setOpen(o => !o)}
            onMouseEnter={e => { e.currentTarget.style.background = '#ffffff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F4F4F0'; }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '13px 18px 13px 22px', borderRadius: 999, background: '#F4F4F0', color: '#14100E', fontSize: 12.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: C.fn, border: 'none', cursor: 'pointer', transition: 'background 0.18s ease' }}
          >
            {open ? 'Close' : 'Learn more'} <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: CB_AMBER, color: '#14100E', fontSize: 12 }}>{open ? '↑' : '→'}</span>
          </button>
        </div>
      </div>

      {/* ── Dropdown ── */}
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 0.35s ease', marginTop: 16 }}>
        <div style={{ overflow: 'hidden', minHeight: 0 }}>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden', background: '#111111' }}>
            <div style={{ padding: isMobile ? '20px 16px 28px' : '20px 32px 32px' }}>

              {/* Intro */}
              <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: '0 0 16px' }}>
                Practices that appear more advanced and health-oriented often command significantly higher perceived value — without needing to compete on price alone.
              </p>
              <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: '0 0 16px' }}>
                Today's patients increasingly associate technology, personalization, and preventative care with higher-quality healthcare providers.
              </p>
              <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: '0 0 16px' }}>
                byteSense positions your practice at the forefront of modern dentistry by integrating sleep, stress, recovery, and wellness-related insights directly into the patient experience. This elevates the perception of your office beyond traditional restorative or reactive care.
              </p>
              <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: '0 0 12px' }}>
                Patients no longer see the dentist as someone who only treats teeth after damage occurs. Instead, your practice begins to be viewed as a more comprehensive oral health and wellness provider — one that helps patients better understand how oral conditions may connect to broader physiological patterns involving:
              </p>

              {/* Physiological list */}
              <div style={{ marginBottom: 20 }}>
                {physiological.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 13, color: DIM, lineHeight: 1.7 }}>
                    <span style={{ color: RED_B, flexShrink: 0, marginTop: 1 }}>—</span>
                    <span style={{ fontStyle: 'italic' }}>{item}</span>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: '0 0 16px' }}>
                As healthcare continues evolving toward preventative and whole-person care, patients are increasingly looking for providers who can offer deeper insight into their health — not just isolated treatment of symptoms.
              </p>
              <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: '0 0 24px' }}>
                byteSense helps position the dentist closer to the role of an <em>"oral physician"</em>: a provider using the mouth as an important window into the patient's overall health, behavior, and recovery patterns. This shift significantly elevates provider perception.
              </p>

              {/* Patients perceive */}
              <p style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F4', margin: '0 0 10px' }}>
                Patients perceive your practice as:
              </p>
              <div style={{ marginBottom: 24 }}>
                {patientPerception.map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 13, color: DIM, lineHeight: 1.7 }}>
                    <span style={{ color: RED_B, flexShrink: 0, marginTop: 1 }}>—</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              {/* Uplift areas */}
              <p style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F4', margin: '0 0 10px' }}>
                That perceived sophistication can meaningfully increase:
              </p>
              <div style={{ marginBottom: 0 }}>
                {upliftAreas.map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 13, color: DIM, lineHeight: 1.7 }}>
                    <span style={{ color: RED_B, flexShrink: 0, marginTop: 1 }}>—</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Provider Sophistication — dial card + two-column hero + dropdown ─────────
function SophisticationSection() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const MINT   = '#9CC9B0';
  const INDIGO = '#8AA3D9';

  const physioBullets     = ['stress,', 'sleep quality,', 'nervous system activation,', 'recovery,', 'and long-term health behaviors.'];
  const perceptionBullets = ['More innovative', 'More technologically advanced', 'More comprehensive', 'More invested in preventative health', 'More engaged in long-term patient wellbeing', 'More aligned with the future of healthcare'];
  const upliftBullets     = ['Treatment acceptance', 'Patient trust', 'Premium service positioning', 'Long-term patient loyalty', 'Referral generation', 'Overall practice differentiation'];

  return (
    <div data-sid="ob-positioning" style={{ padding: isMobile ? '40px 16px' : '80px 64px', borderTop: `1px solid ${BORDER}`, fontFamily: C.fn, background: '#000' }}>

      {/* ── Full-width heading ── */}
      <h2 style={{ fontSize: isMobile ? 36 : 54, fontWeight: 800, lineHeight: 1.06, color: '#F4F4F4', margin: `0 0 ${isMobile ? 32 : 52}px`, letterSpacing: -1.5 }}>
        <span style={{ fontStyle: 'italic', fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}>Enhance Provider</span><br />
        <span style={{ fontFamily: C.fn, fontStyle: 'normal', fontWeight: 800 }}>Perceived </span>
        <span style={{ fontStyle: 'italic', fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}>Sophistication.</span>
      </h2>

      {/* ── Two-column hero ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '480px 1fr', gap: isMobile ? 32 : 64, alignItems: 'center', marginBottom: 40 }}>

        {/* LEFT — dial card */}
        <div style={{ background: '#14100E', borderRadius: 32, padding: 16, border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 40px 80px -30px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.4)' }}>
          <div style={{
            position: 'relative', aspectRatio: '1/1', borderRadius: 22, overflow: 'hidden',
            background: `
              radial-gradient(ellipse 70% 50% at 30% 80%, rgba(110,80,140,0.32) 0%, rgba(60,50,90,0.15) 35%, transparent 65%),
              radial-gradient(ellipse 60% 45% at 75% 25%, rgba(156,201,176,0.18) 0%, transparent 60%),
              radial-gradient(ellipse 90% 70% at 50% 110%, rgba(15,12,18,0.85) 0%, transparent 60%),
              linear-gradient(160deg, #1A1620 0%, #14111A 35%, #0B090E 70%, #050407 100%)
            `,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.03)',
          }}>
            {/* Center glow blur */}
            <div style={{ position: 'absolute', inset: '20% 25%', background: 'radial-gradient(circle, rgba(180,200,255,0.10) 0%, transparent 60%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

            {/* Top-left pill: Preventative monitoring */}
            <div style={{ position: 'absolute', top: 28, left: 28, zIndex: 6, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 10px 5px 9px', borderRadius: 999, background: 'rgba(20,14,10,0.30)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: '#F4EFEA', whiteSpace: 'nowrap' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: MINT, boxShadow: '0 0 8px rgba(156,201,176,0.9)', flexShrink: 0 }} />
              Preventative monitoring · active
            </div>

            {/* Top-right pill: Adaptive intelligence */}
            <div style={{ position: 'absolute', top: 28, right: 28, zIndex: 6, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 10px 5px 9px', borderRadius: 999, background: 'rgba(20,14,10,0.30)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: '#F4EFEA', whiteSpace: 'nowrap' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: INDIGO, boxShadow: '0 0 8px rgba(138,163,217,0.9)', flexShrink: 0 }} />
              Adaptive intelligence
            </div>

            {/* Dial — centered */}
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '70%', aspectRatio: '1/1', zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                <defs>
                  <linearGradient id="soph-dial-stroke" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%"   stopColor="rgba(156,201,176,0.95)" />
                    <stop offset="60%"  stopColor="rgba(200,220,200,0.85)" />
                    <stop offset="100%" stopColor="rgba(255,200,170,0.7)" />
                  </linearGradient>
                  <radialGradient id="soph-dial-fill" cx="50%" cy="50%" r="50%">
                    <stop offset="60%"  stopColor="rgba(156,201,176,0)" />
                    <stop offset="100%" stopColor="rgba(156,201,176,0.18)" />
                  </radialGradient>
                </defs>
                <circle cx="100" cy="100" r="92" fill="url(#soph-dial-fill)" />
                <circle cx="100" cy="100" r="82" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                <circle cx="100" cy="100" r="82" fill="none" stroke="url(#soph-dial-stroke)" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray="515" strokeDashoffset="41" transform="rotate(-90 100 100)"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(156,201,176,0.55))' }} />
                <g stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeLinecap="round">
                  <line x1="100" y1="6" x2="100" y2="14" />
                  <line x1="100" y1="186" x2="100" y2="194" />
                  <line x1="6" y1="100" x2="14" y2="100" />
                  <line x1="186" y1="100" x2="194" y2="100" />
                </g>
              </svg>
              <div style={{ textAlign: 'center', zIndex: 2 }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.18em', color: 'rgba(244,239,234,0.55)', marginBottom: 2 }}>Recovery readiness</div>
                <div style={{ fontWeight: 300, fontSize: 84, lineHeight: 1, letterSpacing: '-0.04em', color: '#F4EFEA', textShadow: '0 0 40px rgba(180,220,200,0.4)' }}>92</div>
                <div style={{ marginTop: 6, display: 'inline-block', padding: '5px 11px', borderRadius: 999, background: 'rgba(156,201,176,0.18)', border: '1px solid rgba(156,201,176,0.35)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: MINT }}>
                  7-day trend ↑
                </div>
              </div>
            </div>

            {/* Bottom center pill */}
            <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 6, padding: '7px 14px', borderRadius: 999, background: 'rgba(20,14,10,0.45)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(244,239,234,0.85)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.14em', whiteSpace: 'nowrap' }}>
              Sleep <em style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', textTransform: 'none', letterSpacing: 0, color: MINT, margin: '0 4px' }}>·</em> Stress <em style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', textTransform: 'none', letterSpacing: 0, color: MINT, margin: '0 4px' }}>·</em> Recovery — correlated
            </div>

            {/* Vignette */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 100% 100% at 50% 30%, transparent 50%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none', zIndex: 2 }} />
          </div>
        </div>

        {/* RIGHT — copy */}
        <div style={{ alignSelf: 'center', paddingTop: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.18em', color: '#FF6B70', marginBottom: 16 }}>
            Provider Sophistication
          </div>
          <h3 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontWeight: 400, fontSize: isMobile ? 28 : 36, lineHeight: 1.18, letterSpacing: '-0.005em', color: '#F4EFEA', margin: '0 0 18px' }}>
            Operating{' '}
            <span style={{ fontFamily: C.fn, fontStyle: 'normal', fontWeight: 500, letterSpacing: '-0.02em' }}>at the frontier of preventative care.</span>
          </h3>
          <p style={{ fontSize: 16, color: DIM, lineHeight: 1.62, margin: '0 0 28px' }}>
            byteSense positions the practice as a modern, technology-enabled wellness destination. Continuous physiological intelligence — recovery, nervous-system load, behavioral trends — signals to patients that their care extends well beyond the operatory, closer to a luxury preventative health clinic than a traditional dental office.
          </p>
          <button
            onClick={() => setOpen(o => !o)}
            onMouseEnter={e => { e.currentTarget.style.background = '#ffffff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F4F4F0'; }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '13px 18px 13px 22px', borderRadius: 999, background: '#F4F4F0', color: '#14100E', fontSize: 12.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: C.fn, border: 'none', cursor: 'pointer', transition: 'background 0.18s ease' }}
          >
            {open ? 'Close' : 'Learn more'} <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: CB_AMBER, color: '#14100E', fontSize: 12 }}>{open ? '↑' : '→'}</span>
          </button>
        </div>
      </div>

      {/* ── Dropdown ── */}
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 0.35s ease' }}>
        <div style={{ overflow: 'hidden', minHeight: 0 }}>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, background: '#111111' }}>
            <div style={{ padding: isMobile ? '24px 16px 28px' : '32px 36px 36px' }}>
              <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, marginBottom: 14, marginTop: 0 }}>
                Today's patients increasingly associate technology, personalization, and preventative care with higher-quality healthcare providers.
              </p>
              <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, marginBottom: 14 }}>
                byteSense positions your practice at the forefront of modern dentistry by integrating sleep, stress, recovery, and wellness-related insights directly into the patient experience.
              </p>
              <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, marginBottom: 20 }}>
                This elevates the perception of your office beyond traditional restorative or reactive care.
              </p>
              <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, marginBottom: 12 }}>
                Patients no longer see the dentist as someone who only treats teeth after damage occurs. Instead, your practice begins to be viewed as a more comprehensive oral health and wellness provider — one that helps patients better understand how oral conditions may connect to broader physiological patterns involving:
              </p>
              <div style={{ marginBottom: 20 }}>
                {physioBullets.map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 5, fontSize: 13, color: DIM, lineHeight: 1.7, fontStyle: 'italic' }}>
                    <span style={{ color: RED_B, flexShrink: 0, marginTop: 1, fontStyle: 'normal' }}>—</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, marginBottom: 14 }}>
                As healthcare continues evolving toward preventative and whole-person care, patients are increasingly looking for providers who can offer deeper insight into their health — not just isolated treatment of symptoms.
              </p>
              <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, marginBottom: 14 }}>
                byteSense helps position the dentist closer to the role of an <em>"oral physician"</em>: a provider using the mouth as an important window into the patient's overall health, behavior, and recovery patterns.
              </p>
              <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, marginBottom: 20 }}>
                This shift significantly elevates provider perception.
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F4', marginBottom: 10 }}>Patients perceive your practice as:</p>
              <div style={{ marginBottom: 20 }}>
                {perceptionBullets.map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 7, fontSize: 13, color: DIM, lineHeight: 1.7 }}>
                    <span style={{ color: RED_B, flexShrink: 0, marginTop: 1 }}>—</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F4', marginBottom: 10 }}>That perceived sophistication can meaningfully increase:</p>
              <div style={{ marginBottom: 20 }}>
                {upliftBullets.map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 7, fontSize: 13, color: DIM, lineHeight: 1.7 }}>
                    <span style={{ color: RED_B, flexShrink: 0, marginTop: 1 }}>—</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: 0 }}>
                Practices that appear more advanced and health-oriented often command significantly higher perceived value — without needing to compete on price alone.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// ── Premium Practice Differentiation — rings card + dropdown ─────────────────
function PremiumDifferentiationSection() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const MINT  = '#9CC9B0';
  const EMBER = '#FF8B5C';
  const SAGE  = '#B8C49A';

  const competeBullets = ['price,', 'insurance,', 'or convenience,'];
  const differBullets  = [
    'Premium treatment positioning',
    'Increased case acceptance',
    'Greater patient perceived value',
    'Higher-end patient attraction',
    'Improved competitive positioning within your market',
  ];

  return (
    <div data-sid="ob-premium" style={{ padding: isMobile ? '40px 16px' : '80px 64px', borderTop: `1px solid ${BORDER}`, fontFamily: C.fn }}>

      {/* ── Full-width heading ── */}
      <h2 style={{ fontSize: isMobile ? 36 : 54, fontWeight: 800, lineHeight: 1.06, color: '#F4F4F4', margin: `0 0 ${isMobile ? 32 : 52}px`, letterSpacing: -1.5 }}>
        <span style={{ fontStyle: 'italic', fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}>Higher-Value</span>{' '}
        <span style={{ fontFamily: C.fn, fontWeight: 800 }}>Care Positioning &amp;</span><br />
        <span style={{ fontStyle: 'italic', fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}>Differentiation.</span>
      </h2>

      {/* ── Two-column hero ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '480px 1fr', gap: isMobile ? 32 : 64, alignItems: 'center', marginBottom: 40 }}>

        {/* LEFT — rings card */}
        <div style={{ background: '#14100E', borderRadius: 32, padding: 16, border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 40px 80px -30px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.4)' }}>
          <div style={{
            position: 'relative', aspectRatio: '1/1', borderRadius: 22, overflow: 'hidden',
            background: `
              radial-gradient(ellipse 60% 50% at 30% 30%, rgba(255,180,120,0.20) 0%, rgba(180,110,70,0.08) 40%, transparent 65%),
              radial-gradient(ellipse 70% 60% at 75% 75%, rgba(120,180,150,0.30) 0%, rgba(60,110,90,0.12) 40%, transparent 65%),
              radial-gradient(ellipse 100% 70% at 50% 110%, rgba(15,18,15,0.80) 0%, transparent 60%),
              linear-gradient(165deg, #1A1F18 0%, #131713 50%, #080A08 100%)
            `,
          }}>
            {/* Right-side ambient glow */}
            <div style={{ position: 'absolute', width: 280, height: 280, right: -40, top: '50%', transform: 'translateY(-50%)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(180,210,180,0.20) 0%, transparent 65%)', filter: 'blur(35px)', pointerEvents: 'none' }} />

            {/* Top-left pill */}
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 6, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 10px 5px 9px', borderRadius: 999, background: 'rgba(20,14,10,0.40)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.13em', color: '#F4EFEA', whiteSpace: 'nowrap' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: MINT, boxShadow: '0 0 8px rgba(156,201,176,0.9)', flexShrink: 0 }} />
              Personalized recovery · live
            </div>

            {/* Top-right pill */}
            <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 6, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 10px 5px 9px', borderRadius: 999, background: 'rgba(20,14,10,0.40)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.13em', color: '#F4EFEA', whiteSpace: 'nowrap' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: EMBER, boxShadow: '0 0 8px rgba(255,139,92,0.9)', flexShrink: 0 }} />
              Member tier · premium
            </div>

            {/* Concentric rings + readout */}
            <div style={{ position: 'absolute', left: '50%', top: '46%', transform: 'translate(-50%, -50%)', width: '70%', aspectRatio: '1/1', zIndex: 3 }}>
              <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', display: 'block', filter: 'drop-shadow(0 0 24px rgba(180,210,180,0.25))' }}>
                <circle cx="100" cy="100" r="86" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                <circle cx="100" cy="100" r="68" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                <circle cx="100" cy="100" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                <circle cx="100" cy="100" r="86" fill="none" stroke={MINT} strokeWidth="6" strokeLinecap="round"
                  strokeDasharray="540" strokeDashoffset="65" transform="rotate(-90 100 100)"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(156,201,176,0.7))' }} />
                <circle cx="100" cy="100" r="68" fill="none" stroke={EMBER} strokeWidth="6" strokeLinecap="round"
                  strokeDasharray="427" strokeDashoffset="154" transform="rotate(-90 100 100)"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(255,139,92,0.6))' }} />
                <circle cx="100" cy="100" r="50" fill="none" stroke={SAGE} strokeWidth="6" strokeLinecap="round"
                  strokeDasharray="314" strokeDashoffset="25" transform="rotate(-90 100 100)"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(184,196,154,0.6))' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 2 }}>
                <span style={{ fontWeight: 300, fontSize: 56, lineHeight: 1, letterSpacing: '-0.03em', color: '#F4EFEA' }}>92</span>
                <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontSize: 16, color: MINT }}>in rhythm</span>
              </div>
            </div>

            {/* Bottom legend card */}
            <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, zIndex: 6, padding: '12px 16px', borderRadius: 16, background: 'rgba(20,14,10,0.42)', backdropFilter: 'blur(28px) saturate(140%)', WebkitBackdropFilter: 'blur(28px) saturate(140%)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 24px 50px -20px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { label: 'Sleep',    val: '88', color: MINT,  glow: 'rgba(156,201,176,0.7)' },
                { label: 'Stress',   val: '36', color: EMBER, glow: 'rgba(255,139,92,0.7)'  },
                { label: 'Recovery', val: '92', color: SAGE,  glow: 'rgba(184,196,154,0.7)' },
              ].map(({ label, val, color, glow }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 9.5, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: 'rgba(244,239,234,0.55)' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${glow}`, flexShrink: 0 }} />
                    {label}
                  </span>
                  <span style={{ fontSize: 17, fontWeight: 400, letterSpacing: '-0.01em', color: '#F4EFEA' }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Vignette */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 100% 100% at 50% 30%, transparent 50%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none', zIndex: 2 }} />
          </div>
        </div>

        {/* RIGHT — copy */}
        <div style={{ alignSelf: 'center', paddingTop: isMobile ? 0 : 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.18em', color: '#FF6B70', marginBottom: 16 }}>
            Premium Differentiation
          </div>
          <h3 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontWeight: 400, fontSize: isMobile ? 28 : 36, lineHeight: 1.18, letterSpacing: '-0.005em', color: '#F4EFEA', margin: '0 0 18px' }}>
            A practice{' '}
            <span style={{ fontFamily: C.fn, fontStyle: 'normal', fontWeight: 500, letterSpacing: '-0.02em' }}>that feels different.</span>
          </h3>
          <p style={{ fontSize: 16, color: DIM, lineHeight: 1.62, margin: '0 0 28px' }}>
            byteSense reframes dental care as a personalized, technology-enabled wellness experience. Adaptive engagement, behavioral intelligence, and ongoing physiological insight signal a category of care that traditional practices simply cannot match — aspirational, exclusive, and quietly differentiated.
          </p>
          <button
            onClick={() => setOpen(o => !o)}
            onMouseEnter={e => { e.currentTarget.style.background = '#ffffff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F4F4F0'; }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '13px 18px 13px 22px', borderRadius: 999, background: '#F4F4F0', color: '#14100E', fontSize: 12.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: C.fn, border: 'none', cursor: 'pointer', transition: 'background 0.18s ease' }}
          >
            {open ? 'Close' : 'Learn more'} <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: CB_AMBER, color: '#14100E', fontSize: 12 }}>{open ? '↑' : '→'}</span>
          </button>
        </div>
      </div>

      {/* ── Dropdown ── */}
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 0.35s ease' }}>
        <div style={{ overflow: 'hidden', minHeight: 0 }}>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, background: '#111111' }}>
            <div style={{ padding: isMobile ? '24px 16px 28px' : '32px 36px 36px' }}>
              <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, marginBottom: 14, marginTop: 0 }}>
                Most dental offices still offer traditional night guards as passive appliances. byteSense helps your practice offer something fundamentally different: a technology-enabled patient experience centered around prevention, personalization, sleep, stress, and recovery.
              </p>
              <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, marginBottom: 20 }}>
                This allows your office to move beyond commodity-based dentistry and into a higher-value category of care.
              </p>
              <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, marginBottom: 10 }}>
                Instead of competing solely on:
              </p>
              <div style={{ marginBottom: 16 }}>
                {competeBullets.map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 5, fontSize: 13, color: DIM, lineHeight: 1.7 }}>
                    <span style={{ color: RED_B, flexShrink: 0, marginTop: 1 }}>—</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, marginBottom: 20 }}>
                your practice can differentiate through <strong style={{ color: '#F4F4F4', fontWeight: 600 }}>innovation, personalization, and patient experience.</strong>
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F4', marginBottom: 10 }}>
                That differentiation supports:
              </p>
              <div style={{ marginBottom: 20 }}>
                {differBullets.map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 7, fontSize: 13, color: DIM, lineHeight: 1.7 }}>
                    <span style={{ color: RED_B, flexShrink: 0, marginTop: 1 }}>—</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, marginBottom: 14 }}>
                Patients are increasingly seeking providers who combine healthcare, technology, and personalized wellness.
              </p>
              <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: 0 }}>
                byteSense helps position your practice <em>ahead of that shift.</em>
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// ── Patient Retention — orbital card + dropdown ──────────────────────────────
function PatientRetentionSection() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const bullets1 = [
    'Passive, nightly bite and bruxism activity monitoring between visits',
    'Gentle behaviorally-timed nudges that reinforce appointment recommendations',
    'Sleep, stress, and recovery trend tracking patients check daily',
    'Personalized insights that keep oral health top-of-mind year-round',
  ];

  const bullets2 = [
    'Increase recall appointment compliance and on-time return rates',
    'Reduce patient drop-off and inactive patient rates',
    'Build stronger referral word-of-mouth through ongoing engagement',
    'Create reactivation opportunities using real patient data',
    'Support recare team workflows with data-driven follow-up messaging',
    'Build a practice retention culture that extends beyond hygiene visits',
  ];

  const barHeights = [38, 52, 30, 64, 48, 72, 44, 58, 36, 80, 50, 42, 66, 32];

  return (
    <>
      <style>{`
        @keyframes retentionPulse {
          0%   { box-shadow: 0 0 0 0 rgba(255,107,112,0.5), 0 0 14px rgba(255,107,112,0.7); }
          70%  { box-shadow: 0 0 0 14px rgba(255,107,112,0), 0 0 14px rgba(255,107,112,0.3); }
          100% { box-shadow: 0 0 0 0 rgba(255,107,112,0), 0 0 14px rgba(255,107,112,0.7); }
        }
      `}</style>
      <div data-sid="ob-retention" style={{ padding: isMobile ? '40px 16px' : '80px 64px', borderTop: `1px solid ${BORDER}`, fontFamily: C.fn, background: '#000' }}>

        {/* ── Section heading ── */}
        <h2 style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.06, color: '#F4F4F4', margin: '0 0 52px', letterSpacing: -1.5 }}>
          <span style={{ fontStyle: 'italic', fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}>Enhance</span>
          {' '}Patient Retention<br />
          &amp; Follow-Up.
        </h2>

        {/* ── Orbital card ── */}
        <div style={{
          maxWidth: 520, margin: '0 auto 40px',
          padding: '16px 16px 28px',
          borderRadius: 32,
          background: '#16110E',
          border: '1px solid rgba(244,239,234,0.08)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 30px 70px -30px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.3)',
          color: '#F4EFEA',
        }}>
          {/* Visual area */}
          <div style={{
            position: 'relative',
            aspectRatio: '1 / 1',
            borderRadius: 22,
            overflow: 'hidden',
            background: `
              radial-gradient(ellipse 95% 70% at 28% 18%, rgba(255,200,170,0.55) 0%, rgba(255,139,92,0.30) 30%, transparent 60%),
              radial-gradient(ellipse 90% 80% at 80% 95%, rgba(156,201,176,0.45) 0%, rgba(156,201,176,0.10) 35%, transparent 65%),
              radial-gradient(circle at 50% 50%, #2A1F18 0%, #1A130F 60%, #0E0A08 100%)
            `,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.03)',
          }}>
            {/* Ambient grain overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.04) 0%, transparent 40%), radial-gradient(circle at 75% 70%, rgba(255,255,255,0.03) 0%, transparent 35%)', mixBlendMode: 'screen', pointerEvents: 'none', zIndex: 1 }} />

            {/* SVG orbital rings + arc */}
            <svg viewBox="0 0 480 480" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 3 }}>
              <circle fill="none" stroke="rgba(244,239,234,0.08)" strokeWidth="1" cx="240" cy="240" r="200" />
              <circle fill="none" stroke="rgba(244,239,234,0.08)" strokeWidth="1" cx="240" cy="240" r="155" />
              <circle fill="none" stroke="rgba(244,239,234,0.08)" strokeWidth="1" cx="240" cy="240" r="110" />
              <path
                d="M 240 40 A 200 200 0 1 1 95 290"
                fill="none"
                stroke="rgba(255,200,170,0.55)"
                strokeWidth="1.5"
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 6px rgba(255,180,140,0.6))' }}
              />
            </svg>

            {/* Live touchpoint — top */}
            <div style={{
              position: 'absolute', left: '50%', top: '8.3%',
              transform: 'translate(-50%, -50%)',
              width: 6, height: 6, borderRadius: '50%',
              background: '#FF6B70',
              animation: 'retentionPulse 2.4s ease-out infinite',
              zIndex: 4,
            }} />

            {/* Dim touchpoint — bottom */}
            <div style={{
              position: 'absolute', left: '50%', top: '91.7%',
              transform: 'translate(-50%, -50%)',
              width: 6, height: 6, borderRadius: '50%',
              background: 'rgba(244,239,234,0.35)',
              boxShadow: '0 0 4px rgba(255,200,170,0.3)',
              zIndex: 4,
            }} />

            {/* Orbit labels */}
            <div style={{ position: 'absolute', left: '50%', top: '8.3%', transform: 'translate(-50%, calc(-100% - 14px))', fontFamily: 'monospace', fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: 'rgba(244,239,234,0.55)', whiteSpace: 'nowrap', zIndex: 4, pointerEvents: 'none' }}>
              visit 01 · jan
            </div>
            <div style={{ position: 'absolute', left: '50%', top: '91.7%', transform: 'translate(-50%, 14px)', fontFamily: 'monospace', fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: 'rgba(244,239,234,0.55)', whiteSpace: 'nowrap', zIndex: 4, pointerEvents: 'none' }}>
              visit 02 · jul
            </div>

            {/* Glass widget */}
            <div style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '78%',
              padding: '18px 20px 20px',
              borderRadius: 22,
              background: 'rgba(20, 14, 10, 0.32)',
              backdropFilter: 'blur(28px) saturate(140%)',
              WebkitBackdropFilter: 'blur(28px) saturate(140%)',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.10)',
              zIndex: 5,
              color: '#F4EFEA',
            }}>
              {/* Pill header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 10px 5px 9px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: '#F4EFEA', whiteSpace: 'nowrap' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9CC9B0', boxShadow: '0 0 8px rgba(156,201,176,0.9)', flexShrink: 0 }} />
                  Insight loop · live
                </div>
                <span style={{ color: 'rgba(244,239,234,0.55)', fontFamily: 'monospace', fontSize: 14, lineHeight: '1', marginLeft: 8 }}>›</span>
              </div>

              {/* 364 readout */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                <span style={{ fontWeight: 300, fontSize: 56, lineHeight: 1, letterSpacing: '-0.03em', color: '#F4EFEA' }}>364</span>
                <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontSize: 22, color: '#9CC9B0', lineHeight: 1 }}>days connected</span>
              </div>

              {/* Sublabel */}
              <div style={{ fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.16em', color: 'rgba(244,239,234,0.55)', marginBottom: 16 }}>
                vs. 2 visits / yr · industry baseline
              </div>

              {/* Bar strip */}
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 28, margin: '0 0 10px' }}>
                {barHeights.map((h, i) => (
                  <div key={i} style={{
                    flex: 1, borderRadius: 2,
                    height: `${h}%`,
                    background: i === 9 ? 'rgba(255,200,170,0.85)' : 'rgba(244,239,234,0.18)',
                    boxShadow: i === 9 ? '0 0 8px rgba(255,180,140,0.7)' : 'none',
                  }} />
                ))}
              </div>

              {/* Axis */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: 9, color: 'rgba(244,239,234,0.45)', letterSpacing: '0.08em' }}>
                <span>14d ago</span>
                <span>today</span>
              </div>
            </div>

            {/* Vignette */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(0,0,0,0.45) 100%)', pointerEvents: 'none', zIndex: 2 }} />
          </div>

          {/* Card caption */}
          <div style={{ padding: '24px 8px 0' }}>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.18em', color: '#FF8B5C', marginBottom: 14 }}>
              Patient Retention &amp; Follow-Up
            </div>
            <h3 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontWeight: 400, fontSize: isMobile ? 24 : 32, lineHeight: 1.15, letterSpacing: '-0.005em', color: '#F4EFEA', margin: '0 0 14px' }}>
              From{' '}
              <span style={{ fontFamily: C.fn, fontStyle: 'normal', fontWeight: 500, letterSpacing: '-0.02em' }}>two touchpoints a year</span>
              {' '}to{' '}
              <span style={{ fontFamily: C.fn, fontStyle: 'normal', fontWeight: 500, letterSpacing: '-0.02em' }}>three-hundred-and-sixty-five.</span>
            </h3>
            <p style={{ fontFamily: C.fn, fontSize: 15, lineHeight: 1.6, color: 'rgba(244,239,234,0.78)', margin: 0 }}>
              byteSense transforms the traditional dental relationship. The at-home sensor passively reads bite, breath, and bruxism patterns — translating them into gentle, behaviorally-timed nudges between appointments. Patients stay engaged because the care does. Providers see retention curve up because the relationship never goes quiet.
            </p>
          </div>
        </div>

        {/* ── Learn More button ── */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => setOpen(o => !o)}
            onMouseEnter={e => { e.currentTarget.style.background = '#ffffff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F4F4F0'; }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '13px 18px 13px 22px', borderRadius: 999, background: '#F4F4F0', color: '#14100E', fontSize: 12.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: C.fn, border: 'none', cursor: 'pointer', transition: 'background 0.18s ease' }}
          >
            {open ? 'Close' : 'Learn more'} <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: CB_AMBER, color: '#14100E', fontSize: 12 }}>{open ? '↑' : '→'}</span>
          </button>
        </div>

        {/* ── Dropdown ── */}
        <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 0.35s ease', marginTop: 16 }}>
          <div style={{ overflow: 'hidden', minHeight: 0 }}>
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden', background: '#111111' }}>
              <div style={{ padding: isMobile ? '20px 16px 28px' : '20px 24px 32px' }}>
                {/* Intro */}
                <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, marginBottom: 20, marginTop: 0 }}>
                  Patient retention is one of the highest-leverage metrics in dental practice growth. byteSense turns what was once a passive treatment into an active wellness relationship — one that persists 365 days a year, not just during scheduled appointments. The platform gives patients a reason to stay curious and connected to your practice long after they leave the operatory.
                </p>

                {/* Platform bullets */}
                <p style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F4', marginBottom: 10 }}>
                  Through the byteSense platform, patients receive ongoing:
                </p>
                <div style={{ marginBottom: 20 }}>
                  {bullets1.map((b, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 7, fontSize: 13, color: DIM, lineHeight: 1.7 }}>
                      <span style={{ color: RED_B, flexShrink: 0, marginTop: 1 }}>—</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                {/* Relationship paragraphs */}
                <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, marginBottom: 16 }}>
                  This continuous engagement creates a fundamentally different relationship between patient and provider. Rather than experiencing the practice as a twice-yearly obligation, patients begin to associate your office with their ongoing health journey — giving them a reason to stay connected, follow through, and return.
                </p>
                <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, marginBottom: 20 }}>
                  For patients who may not yet feel urgency about a recall, byteSense provides something compelling: objective, real data about their own body. When a patient can see their bruxism events, recovery trends, and overnight patterns, the conversation about returning shifts from "it's just routine" to "here's what we've been tracking together."
                </p>

                {/* Practice benefits */}
                <p style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F4', marginBottom: 10 }}>
                  This helps your practice:
                </p>
                <div style={{ marginBottom: 20 }}>
                  {bullets2.map((b, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 7, fontSize: 13, color: DIM, lineHeight: 1.7 }}>
                      <span style={{ color: RED_B, flexShrink: 0, marginTop: 1 }}>—</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                {/* Closing */}
                <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: 0 }}>
                  Practices using continuous engagement strategies consistently outperform those relying on appointment reminders alone. byteSense gives your team the tools, the data, and the patient connection to make retention a system — not a hope.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

// ── Practice Revenue — hero layout + calculator dropdown ────────────────────
function PracticeRevenueSection() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  // Calculator state
  const [patients, setPatients] = useState(200);
  const [price, setPrice] = useState(2500);
  const [closeRate, setCloseRate] = useState(15);

  const currentRevenue = patients * price * (closeRate / 100);
  const projectedRate = Math.min(Math.round(closeRate * 2.5), 85);
  const bytesenseRevenue = patients * price * (projectedRate / 100);
  const monthlyUplift = bytesenseRevenue - currentRevenue;
  const yearlyUplift = monthlyUplift * 12;
  const fmt = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

  return (
    <div data-sid="ob-revenue" style={{ padding: isMobile ? '40px 16px' : '80px 64px', borderTop: `1px solid ${BORDER}`, fontFamily: C.fn, background: '#000' }}>

      {/* ── Hero two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 40 : 80, alignItems: 'center', marginBottom: 40 }}>

        {/* Left: headline + widget card */}
        <div>
          <h2 style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.06, color: '#F4F4F4', margin: '0 0 40px', letterSpacing: -1.5 }}>
            <span style={{ fontStyle: 'italic', fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}>From </span>standard<br />
            appliance,<br />
            <span style={{ fontStyle: 'italic', fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}>to premium<br />revenue category.</span>
          </h2>

          {/* ── Visual artifact — trajectory arc + glass widget ── */}
          <div style={{
            position: 'relative', aspectRatio: '1 / 1', borderRadius: 22, overflow: 'hidden',
            background: `
              radial-gradient(ellipse 70% 55% at 88% 12%, rgba(255,170,90,0.30) 0%, rgba(255,140,70,0.12) 25%, transparent 55%),
              radial-gradient(ellipse 90% 80% at 8%  92%, rgba(80,180,140,0.32) 0%, rgba(60,150,120,0.12) 30%, transparent 60%),
              radial-gradient(circle at 50% 50%, #0F1715 0%, #0A0E0D 55%, #050706 100%)
            `,
            border: '1px solid rgba(244,239,234,0.06)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.03), 0 30px 70px -30px rgba(0,0,0,0.7)',
          }}>
            {/* Ambient grain */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 22% 30%, rgba(255,255,255,0.04) 0%, transparent 40%), radial-gradient(circle at 78% 72%, rgba(255,255,255,0.03) 0%, transparent 35%)', mixBlendMode: 'screen', pointerEvents: 'none', zIndex: 1 }} />

            {/* Trajectory SVG */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
              <svg viewBox="0 0 480 480" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                <defs>
                  <linearGradient id="rev-traj-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="rgba(120,210,170,0.30)" />
                    <stop offset="100%" stopColor="rgba(120,210,170,0)" />
                  </linearGradient>
                </defs>
                {/* Baseline */}
                <path d="M 30 360 L 450 360" fill="none" stroke="rgba(244,239,234,0.10)" strokeWidth="1" strokeDasharray="2 4" />
                {/* Fill */}
                <path d="M 30 380 C 110 380, 170 360, 220 320 S 360 140, 450 60 L 450 380 Z" fill="url(#rev-traj-fill)" opacity="0.55" />
                {/* Curve */}
                <path d="M 30 380 C 110 380, 170 360, 220 320 S 360 140, 450 60"
                  fill="none" stroke="rgba(120,210,170,0.45)" strokeWidth="1.5" strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(120,210,170,0.5))' }} />
              </svg>
              {/* Tick dots */}
              {[
                { l: '6.3%',  t: '79.2%', peak: false },
                { l: '30%',   t: '75%',   peak: false },
                { l: '50%',   t: '60%',   peak: false },
                { l: '72%',   t: '32%',   peak: false },
                { l: '92.5%', t: '12.5%', peak: true  },
              ].map((d, i) => (
                <div key={i} style={{
                  position: 'absolute', left: d.l, top: d.t,
                  width: d.peak ? 7 : 5, height: d.peak ? 7 : 5,
                  borderRadius: '50%',
                  background: d.peak ? 'rgb(180,235,205)' : 'rgba(244,239,234,0.55)',
                  boxShadow: d.peak ? '0 0 10px rgba(120,210,170,0.9), 0 0 24px rgba(120,210,170,0.4)' : 'none',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 4,
                }} />
              ))}
              {/* Axis labels */}
              <div style={{ position: 'absolute', left: '5%', bottom: '6%', fontFamily: 'monospace', fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: 'rgba(244,239,234,0.45)', zIndex: 4 }}>m+0</div>
              <div style={{ position: 'absolute', right: '5%', bottom: '6%', fontFamily: 'monospace', fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: 'rgba(244,239,234,0.45)', zIndex: 4 }}>m+12</div>
            </div>

            {/* Glass widget — centered */}
            <div style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '82%', padding: '18px 20px',
              borderRadius: 22,
              background: 'rgba(15,25,22,0.42)',
              backdropFilter: 'blur(28px) saturate(140%)',
              WebkitBackdropFilter: 'blur(28px) saturate(140%)',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 30px 60px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.10)',
              zIndex: 5, color: '#F4EFEA',
            }}>
              {/* Pill header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 10px 5px 9px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: '#F4EFEA', whiteSpace: 'nowrap' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgb(140,225,185)', boxShadow: '0 0 8px rgba(140,225,185,0.9)', flexShrink: 0 }} />
                  Projected uplift · monthly
                </div>
                <span style={{ color: 'rgba(244,239,234,0.55)', fontFamily: 'monospace', fontSize: 14, lineHeight: '1' }}>›</span>
              </div>

              {/* Hero readout */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                <span style={{ fontWeight: 300, fontSize: 26, lineHeight: 1, color: 'rgba(244,239,234,0.55)', letterSpacing: '-0.02em', transform: 'translateY(-12px)' }}>+$</span>
                <span style={{ fontWeight: 300, fontSize: 56, lineHeight: 1, letterSpacing: '-0.03em', color: '#F4EFEA', textShadow: '0 0 30px rgba(120,210,170,0.10)' }}>13,400</span>
                <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontSize: 22, color: 'rgb(180,225,200)', lineHeight: 1, marginLeft: 4 }}>/ month</span>
              </div>
              <div style={{ fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.16em', color: 'rgba(244,239,234,0.5)', marginBottom: 16 }}>
                projected additional monthly production
              </div>

              {/* Delta row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.16em', color: 'rgba(244,239,234,0.42)', marginBottom: 5 }}>Close rate · today</div>
                  <div style={{ fontWeight: 400, fontSize: 18, letterSpacing: '-0.01em', color: 'rgba(244,239,234,0.78)' }}>24%</div>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 14, color: 'rgba(244,239,234,0.35)', transform: 'translateY(4px)' }}>→</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.16em', color: 'rgba(244,239,234,0.42)', marginBottom: 5 }}>Projected · w/ byteSense</div>
                  <div style={{ fontWeight: 400, fontSize: 18, letterSpacing: '-0.01em', color: 'rgb(190,235,210)' }}>33%</div>
                </div>
              </div>

              {/* 3-metric grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  { k: 'Avg. case\nvalue',       v: '+$420', sup: '↑',     supColor: 'rgb(180,225,200)' },
                  { k: 'Care\ntier',              v: 'Premium', sup: '',   supColor: 'rgb(255,180,100)' },
                  { k: 'Year-round\nengagement',  v: '365d', sup: '',      supColor: '' },
                ].map((m, i) => (
                  <div key={i} style={{ padding: '10px 11px', background: 'rgba(15,25,22,0.55)' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: 'rgba(244,239,234,0.42)', marginBottom: 4, lineHeight: 1.2, whiteSpace: 'pre-line' }}>{m.k}</div>
                    <div style={{ fontWeight: 400, fontSize: 15, color: i === 1 ? 'rgb(255,180,100)' : '#F4EFEA', letterSpacing: '-0.01em' }}>
                      {m.v}{m.sup && <span style={{ color: m.supColor, fontFamily: 'monospace', fontSize: 11, marginLeft: 2 }}>{m.sup}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vignette */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(0,0,0,0.5) 100%)', pointerEvents: 'none', zIndex: 2 }} />
          </div>
        </div>

        {/* Right: tag + body + Learn More button — vertically centered by grid alignItems: center */}
        <div style={{ alignSelf: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#D4AF37', textTransform: 'uppercase', marginBottom: 24 }}>
            Practice Revenue · Projected ROI
          </div>
          <p style={{ fontSize: 16, color: '#9898A8', lineHeight: 1.75, margin: '0 0 40px' }}>
            byteSense reframes the conversation at the consult. Patients perceive the appliance as a more
            personalized, technology-enabled experience rather than a passive device — and practices gain
            stronger pricing power, improved treatment acceptance, and more recurring patient engagement.
            The result is measurable: meaningful production growth that compounds month over month.
          </p>
          <button
            onClick={() => setOpen(o => !o)}
            onMouseEnter={e => { e.currentTarget.style.background = '#ffffff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F4F4F0'; }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '13px 18px 13px 22px', borderRadius: 999, background: '#F4F4F0', color: '#14100E', fontSize: 12.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: C.fn, border: 'none', cursor: 'pointer', transition: 'background 0.18s ease' }}
          >
            {open ? 'Close' : 'Learn more'} <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: CB_AMBER, color: '#14100E', fontSize: 12 }}>{open ? '↑' : '→'}</span>
          </button>
        </div>
      </div>

      {/* ── Dropdown: Calculator + Description ── */}
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 0.35s ease' }}>
        <div style={{ overflow: 'hidden', minHeight: 0 }}>
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden', background: '#111111' }}>

          {/* Revenue Calculator */}
          <div style={{ padding: isMobile ? '24px 16px' : '36px 36px', background: '#0D0D10' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#D4AF37', textTransform: 'uppercase', marginBottom: 12 }}>Revenue Calculator</div>
              <h3 style={{ fontSize: isMobile ? 28 : 38, fontWeight: 800, color: '#F4F4F6', margin: '0 0 10px', lineHeight: 1.1 }}>
                See Your <span style={{ color: '#00C2A8' }}>Revenue Potential</span>
              </h3>
              <p style={{ fontSize: 14, color: DIM, margin: 0 }}>Adjust the sliders to see how byteSense can impact your bottom line</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 24 : 36, marginBottom: 32 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: DIM, textTransform: 'uppercase', marginBottom: 12 }}>Patients / Month</div>
                <input type="range" min={10} max={500} step={10} value={patients}
                  onChange={e => setPatients(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#00C2A8', cursor: 'pointer', marginBottom: 10 }} />
                <div style={{ fontSize: 36, fontWeight: 800, color: '#00C2A8' }}>{patients}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: DIM, textTransform: 'uppercase', marginBottom: 12 }}>Avg Case Price ($)</div>
                <input type="range" min={500} max={6000} step={100} value={price}
                  onChange={e => setPrice(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#D4AF37', cursor: 'pointer', marginBottom: 10 }} />
                <div style={{ fontSize: 36, fontWeight: 800, color: '#D4AF37' }}>${price.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: DIM, textTransform: 'uppercase', marginBottom: 12 }}>Current Close Rate (%)</div>
                <input type="range" min={5} max={60} step={1} value={closeRate}
                  onChange={e => setCloseRate(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#E63434', cursor: 'pointer', marginBottom: 10 }} />
                <div style={{ fontSize: 36, fontWeight: 800, color: '#E63434' }}>{closeRate}%</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={{ background: '#161618', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '28px 24px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: DIM, textTransform: 'uppercase', marginBottom: 12 }}>Current Monthly Revenue</div>
                <div style={{ fontSize: 44, fontWeight: 800, color: '#F4F4F6', marginBottom: 6 }}>{fmt(currentRevenue)}</div>
                <div style={{ fontSize: 12, color: DIM }}>{closeRate}% close rate</div>
              </div>
              <div style={{ background: 'rgba(0,194,168,0.06)', border: `1px solid rgba(0,194,168,0.25)`, borderRadius: 12, padding: '28px 24px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#00C2A8', textTransform: 'uppercase', marginBottom: 12 }}>With byteSense</div>
                <div style={{ fontSize: 44, fontWeight: 800, color: '#00C2A8', marginBottom: 6 }}>{fmt(bytesenseRevenue)}</div>
                <div style={{ fontSize: 12, color: DIM }}>{projectedRate}% projected close rate</div>
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '14px 20px', background: 'rgba(212,175,55,0.08)', border: `1px solid rgba(212,175,55,0.2)`, borderRadius: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#D4AF37' }}>
                +{fmt(monthlyUplift)}/month · +{fmt(yearlyUplift)}/year potential uplift
              </span>
            </div>
          </div>

          {/* Descriptive text */}
          <div style={{ padding: isMobile ? '20px 16px 28px' : '28px 36px 36px', borderTop: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, marginBottom: 20, marginTop: 0 }}>
              byteSense transforms the appliance into a premium, technology-enabled patient experience.
              By combining protection with personalized sleep, stress, and recovery insights, your practice
              can offer a higher-value solution that patients are more emotionally connected to and more willing to invest in.
            </p>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F4', marginBottom: 10 }}>This creates opportunities to:</p>
            <div style={{ marginBottom: 20 }}>
              {[
                'Increase case acceptance',
                'Differentiate from low-cost competitors',
                'Strengthen patient retention',
                'Generate recurring follow-up conversations',
                'Position your office as a modern, technology-forward practice',
              ].map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 7, fontSize: 13, color: DIM, lineHeight: 1.7 }}>
                  <span style={{ color: RED_B, flexShrink: 0, marginTop: 1 }}>—</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, marginBottom: 16 }}>
              Patients no longer see the appliance as <em>"just plastic."</em>
            </p>
            <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, marginBottom: 16 }}>
              They see it as: a personalized health and wellness experience tied to their sleep, stress, and overall recovery.
            </p>
            <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: 0 }}>
              The result is a stronger perceived value for your treatment, deeper patient engagement,
              and a new category of premium dental care your practice can uniquely provide.
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

// ── Trust & Loyalty — full-width section ────────────────────────────────────
function TrustSection() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const bullets1 = [
    'Personalized insights tied to nighttime activity and appliance usage',
    'Notifications reinforcing provider recommendations',
    'Ongoing engagement between visits',
    'Educational feedback connected to stress, recovery, and grinding behavior',
  ];
  const inlineList = ['stress,', 'sleep quality,', 'nervous system activation,', 'recovery,', 'and long-term wellness behaviors.'];
  const bullets2 = [
    'Strengthen patient trust',
    'Increase treatment confidence',
    'Improve compliance and appliance usage',
    'Generate stronger referrals and word-of-mouth',
    'Build long-term patient loyalty',
    'Increase recurring patient engagement outside traditional hygiene visits',
  ];

  return (
    <div data-sid="ob-trust" style={{ padding: isMobile ? '24px 16px' : '72px 64px', borderTop: `1px solid ${BORDER}`, fontFamily: C.fn }}>
      {/* Headline row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 52 }}>
        <h2 style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.06, color: '#F4F4F4', margin: 0, letterSpacing: -1.5 }}>
          <span style={{ fontStyle: 'italic', fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}>Enhance Trust</span>
          {' '}& Loyalty.
        </h2>
      </div>

      {/* Three cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 28, alignItems: 'start' }}>
        <TrustCard1 />
        <TrustCard2 />
        <TrustCard3 />
      </div>

      {/* ── Learn more button ── */}
      <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => setOpen(o => !o)}
          onMouseEnter={e => { e.currentTarget.style.background = '#ffffff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#F4F4F0'; }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '13px 18px 13px 22px', borderRadius: 999, background: '#F4F4F0', color: '#14100E', fontSize: 12.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: C.fn, border: 'none', cursor: 'pointer', transition: 'background 0.18s ease' }}
        >
          {open ? 'Close' : 'Learn more'} <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: CB_AMBER, color: '#14100E', fontSize: 12 }}>{open ? '↑' : '→'}</span>
        </button>
      </div>

      {/* ── Dropdown ── */}
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 0.35s ease', marginTop: 16 }}>
        <div style={{ overflow: 'hidden', minHeight: 0 }}>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden', background: '#111111' }}>
            <div style={{ padding: isMobile ? '20px 16px 28px' : '20px 24px 32px' }}>
              {/* Intro */}
              <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, marginBottom: 20, marginTop: 0 }}>
                Patients trust providers who help them feel understood — not just treated. byteSense allows your practice to deliver a more personalized and modern patient experience by helping patients better understand how stress, sleep, nighttime behaviors, and recovery patterns may be affecting both their oral health and overall wellbeing.
              </p>

              {/* Platform list */}
              <p style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F4', marginBottom: 10 }}>
                Through the byteSense mobile platform, patients can receive:
              </p>
              <div style={{ marginBottom: 20 }}>
                {bullets1.map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 7, fontSize: 13, color: DIM, lineHeight: 1.7 }}>
                    <span style={{ color: RED_B, flexShrink: 0, marginTop: 1 }}>—</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              {/* Relationship paragraph */}
              <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, marginBottom: 8 }}>
                This creates a much deeper relationship between the patient and the practice. Instead of only seeing their dentist twice a year for cleanings or restorative work, patients begin viewing their provider as a more active partner in their long-term health, recovery, and preventative care journey.
              </p>
              <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, marginBottom: 20 }}>
                byteSense helps expand the perception of dentistry beyond simply "fixing teeth." It positions the provider as someone monitoring and helping patients better understand how oral health connects to broader physiological patterns such as:
              </p>

              {/* Physiological list */}
              <div style={{ marginBottom: 20 }}>
                {inlineList.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 7, fontSize: 13, color: DIM, lineHeight: 1.7 }}>
                    <span style={{ color: RED_B, flexShrink: 0, marginTop: 1 }}>—</span>
                    <span style={{ fontStyle: 'italic' }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* Shift paragraph */}
              <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, marginBottom: 16 }}>
                As healthcare continues shifting toward preventative and personalized care, patients increasingly value providers who look at them more holistically — not just mechanically.
              </p>

              {/* Benefits */}
              <p style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F4', marginBottom: 10 }}>
                That level of personalization and ongoing engagement helps:
              </p>
              <div style={{ marginBottom: 20 }}>
                {bullets2.map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 7, fontSize: 13, color: DIM, lineHeight: 1.7 }}>
                    <span style={{ color: RED_B, flexShrink: 0, marginTop: 1 }}>—</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              {/* Closing */}
              <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: 0 }}>
                In an increasingly competitive dental market, practices that create deeper patient relationships often build stronger retention, higher lifetime patient value, and greater long-term differentiation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Consumer helpers ──────────────────────────────────────────────────────────
const CB_MINT  = 'rgb(140,225,185)';
const CB_AMBER = 'rgb(255,180,100)';
const CB_TEAL  = 'rgb(120,200,220)';
const cbMintDot: React.CSSProperties = { width: 6, height: 6, borderRadius: '50%', background: CB_MINT,  boxShadow: '0 0 8px rgba(140,225,185,0.85)', flexShrink: 0 };
const cbAmberDot: React.CSSProperties= { width: 6, height: 6, borderRadius: '50%', background: CB_AMBER, boxShadow: '0 0 8px rgba(255,180,100,0.85)', flexShrink: 0 };
const cbTealDot: React.CSSProperties = { width: 6, height: 6, borderRadius: '50%', background: CB_TEAL,  boxShadow: '0 0 8px rgba(120,200,220,0.85)', flexShrink: 0 };

const cbPill = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  position: 'absolute', zIndex: 6,
  display: 'inline-flex', alignItems: 'center', gap: 7,
  padding: '5px 10px 5px 9px', borderRadius: 999,
  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)',
  fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em',
  color: '#F4EFEA', whiteSpace: 'nowrap', fontFamily: C.fn,
  ...extra,
});

const cbGlass = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  position: 'absolute', zIndex: 5,
  background: 'rgba(20,14,10,0.32)',
  backdropFilter: 'blur(28px) saturate(140%)',
  WebkitBackdropFilter: 'blur(28px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 24px 50px -20px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10)',
  color: '#F4EFEA',
  ...extra,
});

const cbVisual = (bg: string): React.CSSProperties => ({
  position: 'relative', aspectRatio: '1/1', borderRadius: 28, overflow: 'hidden',
  isolation: 'isolate',
  boxShadow: '0 30px 60px -25px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 0 0 1px rgba(255,255,255,0.04)',
  background: bg,
});

function CbSection({
  sid, index, heading, headingSans, eyebrow, body, visual,
  isMobile, open, onToggle, dropdownContent,
}: {
  sid: string; index: string; heading: string; headingSans: string;
  eyebrow: string; body: string; visual: React.ReactNode; isMobile: boolean;
  open?: boolean; onToggle?: () => void; dropdownContent?: React.ReactNode;
}) {
  const hasDropdown = !!dropdownContent;
  return (
    <div data-sid={sid} style={{ padding: isMobile ? '40px 16px' : '80px 64px', borderTop: `1px solid ${BORDER}`, fontFamily: C.fn }}>
      {/* Heading row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 40, marginBottom: isMobile ? 32 : 56, ...(isMobile ? { flexDirection: 'column', alignItems: 'flex-start', gap: 16 } : {}) }}>
        <h2 style={{ fontSize: isMobile ? 36 : 60, fontWeight: 400, lineHeight: 1.04, letterSpacing: '-0.015em', margin: 0, color: '#F4EFEA', fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', maxWidth: '18ch', textWrap: 'balance' as any }}>
          {heading}{' '}
          <span style={{ fontFamily: C.fn, fontStyle: 'normal', fontWeight: 500, letterSpacing: '-0.02em' }}>{headingSans}</span>
        </h2>
        <div style={{ fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(244,239,234,0.45)', flexShrink: 0, paddingBottom: isMobile ? 0 : 18, whiteSpace: 'nowrap' }}>
          {index}
        </div>
      </div>
      {/* Two-column body */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1.05fr) minmax(0,1fr)', gap: isMobile ? 48 : 80, alignItems: 'center' }}>
        {visual}
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#F4EFEA', marginBottom: 22, fontFamily: C.fn }}>{eyebrow}</div>
          <p style={{ fontSize: 17, lineHeight: 1.55, color: 'rgba(244,239,234,0.78)', margin: '0 0 32px', maxWidth: '46ch', textWrap: 'pretty' as any, fontFamily: C.fn }}>{body}</p>
          {hasDropdown ? (
            <button
              onClick={onToggle}
              onMouseEnter={e => { e.currentTarget.style.background = '#ffffff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#F4F4F0'; }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '13px 18px 13px 22px', borderRadius: 999, background: '#F4F4F0', color: '#14100E', fontSize: 12.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: C.fn, border: 'none', cursor: 'pointer', transition: 'background 0.18s ease' }}>
              {open ? 'Close' : 'Learn more'} <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: CB_AMBER, color: '#14100E', fontSize: 12 }}>{open ? '↑' : '→'}</span>
            </button>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '13px 18px 13px 22px', borderRadius: 999, background: '#F4F4F0', color: '#14100E', fontSize: 12.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: C.fn, cursor: 'default', opacity: 0.5 }}>
              Learn more <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: CB_AMBER, color: '#14100E', fontSize: 12 }}>→</span>
            </div>
          )}
        </div>
      </div>
      {/* Dropdown */}
      {hasDropdown && (
        <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 0.4s ease', marginTop: 40 }}>
          <div style={{ overflow: 'hidden', minHeight: 0 }}>
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, background: '#111111', overflow: 'hidden' }}>
              {dropdownContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 1. Track Sleep & Recovery ─────────────────────────────────────────────────
function ConsumerSleepSection() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const heights = [42,88,60,30,24,32,55,78,48,20,18,30,62,90,44,28,36,70,82,64,38];
  const tall = new Set([1,7,13,18]);

  const tracksBullets = [
    'Nighttime heart rate — how quickly it settles and whether it stays elevated',
    'HRV trends compared against your personal baseline across nights',
    'Movement patterns — restlessness windows, positional shifts, intensity',
    'Oral temperature — subtle changes that may correspond to recovery state',
  ];

  return (
    <CbSection
      sid="cb-sleep" index="01 · Patient Recovery Insight" isMobile={isMobile}
      heading="Show patients what recovery" headingSans="looked like overnight."
      eyebrow="Patient Sleep & Recovery Trends"
      body="Most patients only know how long they were in bed. byteSense helps your practice show whether their night looked truly restorative by translating sleep duration, heart patterns, movement, and oral temperature into a simple recovery picture — giving patients a clearer reason to care about what is happening overnight, not just whether their teeth are protected by plastic."
      open={open} onToggle={() => setOpen(o => !o)}
      dropdownContent={
        <div style={{ padding: isMobile ? '24px 16px 32px' : '32px 36px 40px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: CB_MINT, textTransform: 'uppercase', marginBottom: 18 }}>Sleep Quality & Overnight Recovery</div>

          <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: '0 0 14px' }}>
            Duration is the easy part. Whether your body <em>actually recovered</em> is a different question — and it's the one that explains how you feel when you wake up.
          </p>
          <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: '0 0 14px' }}>
            Sleep supports brain function, mood, immune health, tissue repair, and long-term wellbeing. But the quantity of sleep matters less than its quality — and quality is visible in the physiological signals your body produces overnight.
          </p>
          <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: '0 0 24px' }}>
            byteSense tracks those signals from inside the mouth while you sleep, giving your practice a richer picture of what recovery actually looked like — not just whether you were in bed long enough.
          </p>

          {/* Insight callout */}
          <div style={{ background: 'rgba(140,225,185,0.05)', border: `1px solid rgba(140,225,185,0.18)`, borderRadius: 10, padding: '18px 20px', marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: CB_MINT, textTransform: 'uppercase', marginBottom: 10 }}>What an insight looks like</div>
            <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontSize: 15, lineHeight: 1.55, color: '#F4EFEA', margin: 0 }}>
              "Your sleep duration was normal, but your recovery pattern was weaker than usual. Your heart rate stayed elevated longer after bedtime and your movement increased during the second half of the night."
            </p>
          </div>

          <p style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F4', margin: '0 0 10px' }}>byteSense tracks recovery through:</p>
          <div style={{ marginBottom: 20 }}>
            {tracksBullets.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 7, fontSize: 13, color: DIM, lineHeight: 1.7 }}>
                <span style={{ color: CB_MINT, flexShrink: 0, marginTop: 1 }}>—</span>
                <span>{b}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 13, color: DIM, lineHeight: 1.8, margin: 0, fontStyle: 'italic' }}>
            byteSense surfaces recovery patterns — not diagnoses. Language uses "appeared," "trended," and "compared to your baseline" to reflect personal signal changes rather than clinical findings.
          </p>
        </div>
      }
      visual={
        <div style={cbVisual(`
          radial-gradient(ellipse 80% 35% at 50% 100%, rgba(255,180,140,0.30) 0%, rgba(140,90,80,0.10) 35%, transparent 60%),
          linear-gradient(180deg, #0B1428 0%, #0A1330 35%, #0E1530 65%, #1A1820 100%)
        `)}>
          {/* Warm horizon glow */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '30%', background: 'radial-gradient(ellipse 70% 100% at 50% 100%, rgba(255,200,150,0.28), transparent 65%)', pointerEvents: 'none', zIndex: 1 }} />
          {/* Top stats */}
          <div style={{ position: 'absolute', top: 24, left: 24, right: 24, display: 'flex', gap: 32, alignItems: 'flex-start', zIndex: 5 }}>
            <div>
              <div style={{ fontWeight: 300, fontSize: 38, lineHeight: 1, letterSpacing: '-0.03em', color: '#F4EFEA' }}>7h 42m</div>
              <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(244,239,234,0.5)', marginTop: 6 }}>Total sleep</div>
            </div>
            <div>
              <div style={{ fontWeight: 300, fontSize: 38, lineHeight: 1, letterSpacing: '-0.03em', color: '#F4EFEA' }}>8h 18m</div>
              <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(244,239,234,0.5)', marginTop: 6 }}>Time in bed</div>
            </div>
          </div>
          {/* Bar chart */}
          <div style={{ position: 'absolute', left: 24, right: 24, bottom: '22%', display: 'flex', gap: 3, alignItems: 'flex-end', height: '38%', zIndex: 3 }}>
            {heights.map((h, i) => (
              <div key={i} style={{ flex: 1, borderRadius: 2, height: `${h}%`, background: tall.has(i) ? 'rgba(220,230,250,0.78)' : 'rgba(180,200,235,0.45)', boxShadow: tall.has(i) ? '0 0 6px rgba(180,200,235,0.4)' : 'none' }} />
            ))}
          </div>
          {/* Bottom glass */}
          <div style={cbGlass({ left: 24, right: 24, bottom: 24, padding: '14px 16px', borderRadius: 18, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 24px' })}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(244,239,234,0.55)', whiteSpace: 'nowrap' }}>Duration</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#F4EFEA', whiteSpace: 'nowrap' }}>Normal</div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(244,239,234,0.55)', whiteSpace: 'nowrap' }}>Recovery</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: CB_AMBER, whiteSpace: 'nowrap' }}>Lower than usual</div>
          </div>
        </div>
      }
    />
  );
}

// ── 2. Daily Readiness ────────────────────────────────────────────────────────
function ConsumerReadinessSection() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const readinessBullets = [
    'How quickly your heart rate settled after you fell asleep',
    'Whether your HRV trended above or below your personal baseline',
    'Periods of elevated activation during early or mid sleep',
    'Overall pattern compared to your own recent nights — not a population average',
  ];

  return (
    <CbSection
      sid="cb-readiness" index="02 · Stress & Oral Activity Context" isMobile={isMobile}
      heading="Connect stress, recovery," headingSans="and nighttime oral activity."
      eyebrow="Stress & Recovery Signals"
      body="Patients often understand that stress affects their body, but they rarely see what that looks like overnight. byteSense compares each night against the patient's own baseline to help show when the body appeared more activated, recovery looked lower, or nighttime oral activity increased — giving your practice a simple way to explain how sleep, stress, and oral health may be connected."
      open={open} onToggle={() => setOpen(o => !o)}
      dropdownContent={
        <div style={{ padding: isMobile ? '24px 16px 32px' : '32px 36px 40px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: CB_AMBER, textTransform: 'uppercase', marginBottom: 18 }}>Nervous System Readiness</div>

          <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: '0 0 14px' }}>
            Heart rate variability reflects autonomic nervous system activity — the body's internal regulation between rest and readiness. During sleep, HRV patterns shift across sleep phases, generally trending higher during deeper non-REM sleep and lower during REM.
          </p>
          <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: '0 0 14px' }}>
            What matters isn't a single HRV number. What matters is <em>your</em> number — how it trends night to night, whether it's moving above or below your personal baseline, and what that may signal about how recovered or elevated your system appears going into the day.
          </p>
          <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: '0 0 24px' }}>
            Daily Readiness in byteSense is designed around that principle: not a comparison against population averages, but a reflection of your own overnight patterns compared to your own recent history.
          </p>

          {/* Insight callout */}
          <div style={{ background: 'rgba(255,180,100,0.05)', border: `1px solid rgba(255,180,100,0.18)`, borderRadius: 10, padding: '18px 20px', marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: CB_AMBER, textTransform: 'uppercase', marginBottom: 10 }}>What an insight looks like</div>
            <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontSize: 15, lineHeight: 1.55, color: '#F4EFEA', margin: 0 }}>
              "Your readiness is lower today. Your HRV trended below your baseline and your heart rate remained elevated during early sleep. Consider a lighter morning, extra hydration, and a calmer evening routine tonight."
            </p>
          </div>

          <p style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F4', margin: '0 0 10px' }}>Readiness is shaped by:</p>
          <div style={{ marginBottom: 20 }}>
            {readinessBullets.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 7, fontSize: 13, color: DIM, lineHeight: 1.7 }}>
                <span style={{ color: CB_AMBER, flexShrink: 0, marginTop: 1 }}>—</span>
                <span>{b}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 13, color: DIM, lineHeight: 1.8, margin: 0, fontStyle: 'italic' }}>
            Readiness is a personal trend marker — not a diagnostic tool. It doesn't detect stress, illness, or cardiac conditions. It reflects patterns in your own overnight physiology compared to your own baseline.
          </p>
        </div>
      }
      visual={
        <div style={cbVisual(`
          radial-gradient(ellipse 70% 60% at 50% 50%, rgba(80,180,140,0.28) 0%, rgba(50,120,100,0.10) 40%, transparent 65%),
          radial-gradient(ellipse 90% 70% at 50% 110%, rgba(15,30,25,0.85) 0%, transparent 60%),
          linear-gradient(160deg, #0F1A18 0%, #0A1411 50%, #060A09 100%)
        `)}>
          {/* Pills */}
          <div style={cbPill({ top: 24, left: 24 })}><span style={cbMintDot} />Morning recovery signal</div>
          <div style={cbPill({ top: 24, right: 24 })}><span style={cbAmberDot} />More activated than usual</div>
          {/* Big number */}
          <div style={{ position: 'absolute', left: '50%', top: '48%', transform: 'translate(-50%,-50%)', fontWeight: 200, fontSize: 132, lineHeight: 1, letterSpacing: '-0.04em', color: '#F4EFEA', textShadow: '0 0 50px rgba(120,210,170,0.35)', zIndex: 4, whiteSpace: 'nowrap' }}>
            62<small style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontSize: 28, color: 'rgb(180,225,200)', marginLeft: 4, verticalAlign: 'top', textShadow: 'none' }}>/100</small>
          </div>
          {/* Caption */}
          <div style={{ position: 'absolute', left: '50%', top: 'calc(48% + 70px)', transform: 'translateX(-50%)', zIndex: 4, fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgba(244,239,234,0.5)', whiteSpace: 'nowrap' }}>
            Heart rate stayed elevated early in sleep
          </div>
          {/* Bottom glass */}
          <div style={cbGlass({ left: 24, right: 24, bottom: 24, padding: '14px 16px', borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 6 })}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', color: CB_AMBER }}>Recovery this morning</div>
            <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontSize: 18, lineHeight: 1.25, color: '#F4EFEA' }}>Recovery looked lower than usual.</div>
          </div>
        </div>
      }
    />
  );
}

// ── 3. Morning Outlook ────────────────────────────────────────────────────────
function ConsumerMorningSection() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const morningCovers = [
    'How recovery appeared overnight relative to your personal baseline',
    'Whether your body looked more activated or at rest',
    'Movement and restlessness patterns that may have affected sleep quality',
    'Personalized suggestions — hydration, light, timing, routine adjustments',
  ];

  return (
    <CbSection
      sid="cb-morning" index="03 · Morning Explanation" isMobile={isMobile}
      heading="Turn the morning into" headingSans="a clear patient conversation."
      eyebrow="Patient-Friendly Morning Summary"
      body="byteSense turns overnight signals into plain-language summaries patients can understand. Instead of confusing charts, your practice can point to simple insights: recovery looked lower, sleep was more restless, oral activity increased, or the body stayed more activated than usual — making the conversation easier, more credible, and more actionable."
      open={open} onToggle={() => setOpen(o => !o)}
      dropdownContent={
        <div style={{ padding: isMobile ? '24px 16px 32px' : '32px 36px 40px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: CB_AMBER, textTransform: 'uppercase', marginBottom: 18 }}>Your Personalized Morning Recovery Outlook</div>

          <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: '0 0 14px' }}>
            Most health apps show you a dashboard. byteSense gives you an interpretation — an answer to the question you're actually asking when you wake up: <em>"Why do I feel the way I feel?"</em>
          </p>
          <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: '0 0 14px' }}>
            Sleep affects mood, energy, focus, memory, reasoning, and decision-making. So a morning read of your overnight physiology isn't just informational — it's actionable. It gives you context for the day ahead and a direction for the evening behind it.
          </p>
          <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: '0 0 24px' }}>
            The Morning Outlook is your daily interpreter — not a static data display, but a personalized read of what your overnight signals may be suggesting.
          </p>

          {/* Insight callout */}
          <div style={{ background: 'rgba(255,180,100,0.05)', border: `1px solid rgba(255,180,100,0.18)`, borderRadius: 10, padding: '18px 20px', marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: CB_AMBER, textTransform: 'uppercase', marginBottom: 10 }}>What an insight looks like</div>
            <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontSize: 15, lineHeight: 1.55, color: '#F4EFEA', margin: 0 }}>
              "Your body looked more activated than usual overnight. Today may feel like a lower-energy day. Prioritize hydration, light exposure, and avoid stacking late caffeine with evening screen time."
            </p>
          </div>

          <p style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F4', margin: '0 0 10px' }}>Your morning outlook covers:</p>
          <div style={{ marginBottom: 20 }}>
            {morningCovers.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 7, fontSize: 13, color: DIM, lineHeight: 1.7 }}>
                <span style={{ color: CB_AMBER, flexShrink: 0, marginTop: 1 }}>—</span>
                <span>{b}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 13, color: DIM, lineHeight: 1.8, margin: 0, fontStyle: 'italic' }}>
            Outlooks are personalized guidance — not medical recommendations or treatment plans. Suggestions are grounded in general sleep-health awareness and your own nightly patterns.
          </p>
        </div>
      }
      visual={
        <div style={cbVisual(`
          radial-gradient(ellipse 80% 50% at 50% 100%, rgba(255,180,120,0.55) 0%, rgba(255,140,90,0.22) 25%, transparent 55%),
          radial-gradient(ellipse 70% 40% at 50% 105%, rgba(255,210,150,0.45) 0%, transparent 50%),
          linear-gradient(180deg, #060710 0%, #0A0F1E 30%, #1B1A22 60%, #2A2025 100%)
        `)}>
          {/* Extra warm glow at bottom */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: '60%', bottom: 0, background: 'radial-gradient(ellipse 60% 80% at 50% 100%, rgba(255,200,140,0.35), transparent 60%)', pointerEvents: 'none', zIndex: 1 }} />
          {/* Pill */}
          <div style={cbPill({ top: 24, left: 24 })}><span style={cbAmberDot} />Patient morning summary</div>
          {/* Time */}
          <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 5, fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.14em', color: 'rgba(244,239,234,0.55)', textTransform: 'uppercase' }}>6:42 AM · Fri</div>
          {/* Card */}
          <div style={cbGlass({ left: 24, right: 24, top: '44%', padding: '16px 18px', borderRadius: 20 })}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgba(244,239,234,0.55)', marginBottom: 6 }}>Overnight, in summary</div>
            <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontSize: 20, lineHeight: 1.18, color: '#F4EFEA', marginBottom: 12 }}>More activated than usual — recovery outlook is lower.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                { text: 'Heart rate stayed elevated longer than typical', color: CB_TEAL },
                { text: 'Oral activity increased during restless periods', color: CB_AMBER },
                { text: 'Consider avoiding late caffeine tonight', color: CB_MINT },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'rgba(244,239,234,0.78)', lineHeight: 1.4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: item.color, boxShadow: `0 0 6px ${item.color}99`, flexShrink: 0, marginTop: 6 }} />
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    />
  );
}

// ── 4. Intraoral Pulse ────────────────────────────────────────────────────────
function ConsumerCirculationSection() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const oralAdvantage = [
    'The oral cavity sits in close proximity to the brain and circulatory system',
    'The mouth is less susceptible to motion artifact that can degrade wrist-based readings',
    'Intraoral signals are captured while the appliance is in place — naturally stable all night',
    'The position provides a consistent, well-coupled sensing environment',
  ];

  return (
    <CbSection
      sid="cb-circulation" index="04 · Oral Signal Advantage" isMobile={isMobile}
      heading="Offer insight from a signal source" headingSans="only dentistry owns."
      eyebrow="Mouth-Based Body Signals"
      body="byteSense uses the mouth as a unique place to observe nighttime body signals while patients sleep. By reading patterns like heart rate, oral temperature, movement, and signal stability from inside the oral appliance, your practice can offer patients insight that feels directly connected to dentistry — not just another wrist-worn wellness tracker."
      open={open} onToggle={() => setOpen(o => !o)}
      dropdownContent={
        <div style={{ padding: isMobile ? '24px 16px 32px' : '32px 36px 40px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: CB_MINT, textTransform: 'uppercase', marginBottom: 18 }}>Pulse Signals from Inside the Mouth</div>

          <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: '0 0 14px' }}>
            byteSense captures intraoral blood-pulse signals during sleep — optical readings that detect blood-volume changes in the tissue of the oral cavity. This is the same sensing principle used in modern health wearables, applied from a position that most devices can't reach.
          </p>
          <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: '0 0 14px' }}>
            The result is a nighttime picture of heart rate, physiological activation, and recovery patterns — captured from inside the mouth, continuously, while the appliance is already in place.
          </p>
          <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: '0 0 24px' }}>
            This isn't "blood circulation tracking" in the clinical sense. It's a blood-pulse signal reading — a window into overnight physiological patterns that feels directly tied to the dental experience, not a generic wellness band.
          </p>

          {/* Insight callout */}
          <div style={{ background: 'rgba(140,225,185,0.05)', border: `1px solid rgba(140,225,185,0.18)`, borderRadius: 10, padding: '18px 20px', marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: CB_MINT, textTransform: 'uppercase', marginBottom: 10 }}>What an insight looks like</div>
            <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontSize: 15, lineHeight: 1.55, color: '#F4EFEA', margin: 0 }}>
              "Your overnight pulse signal was more stable than usual, with fewer periods of elevated heart rate and less movement disruption — suggesting a more settled night."
            </p>
          </div>

          <p style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F4', margin: '0 0 10px' }}>Why the oral position matters:</p>
          <div style={{ marginBottom: 20 }}>
            {oralAdvantage.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 7, fontSize: 13, color: DIM, lineHeight: 1.7 }}>
                <span style={{ color: CB_MINT, flexShrink: 0, marginTop: 1 }}>—</span>
                <span>{b}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 13, color: DIM, lineHeight: 1.8, margin: 0, fontStyle: 'italic' }}>
            byteSense does not measure blood flow, vascular health, or cardiovascular function. Intraoral pulse signals are used to surface overnight physiological patterns — not to diagnose or evaluate any medical condition.
          </p>
        </div>
      }
      visual={
        <div style={cbVisual(`
          radial-gradient(ellipse 60% 50% at 50% 50%, rgba(80,180,160,0.22) 0%, transparent 55%),
          radial-gradient(ellipse 90% 70% at 50% 110%, rgba(10,20,18,0.85) 0%, transparent 60%),
          linear-gradient(165deg, #0A1414 0%, #060B0B 50%, #030606 100%)
        `)}>
          {/* Pill */}
          <div style={cbPill({ top: 24, left: 24 })}><span style={cbMintDot} />Mouth-based signal · stable overnight</div>
          {/* Meta time */}
          <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 5, fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.14em', color: 'rgba(244,239,234,0.55)', textTransform: 'uppercase' }}>12:14 AM → 6:38 AM</div>
          {/* Center label */}
          <div style={{ position: 'absolute', left: '50%', top: '18%', transform: 'translateX(-50%)', zIndex: 4, fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontSize: 28, lineHeight: 1.1, letterSpacing: '-0.005em', color: '#F4EFEA', textAlign: 'center', textShadow: '0 0 30px rgba(140,225,200,0.25)', whiteSpace: 'nowrap' }}>
            From inside the mouth.
            <small style={{ display: 'block', fontFamily: C.fn, fontStyle: 'normal', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(244,239,234,0.55)', marginTop: 6 }}>Oral appliance signal</small>
          </div>
          {/* SVG pulse wave */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: '30%', bottom: '30%', zIndex: 3 }}>
            <svg viewBox="0 0 400 120" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
              <path d="M 0 60 L 400 60" stroke="rgba(244,239,234,0.08)" strokeWidth="1" strokeDasharray="2 4" fill="none" />
              <path d="M 0 60 L 30 60 L 38 58 L 46 64 L 54 60 L 90 60 L 96 38 L 102 84 L 108 50 L 114 60 L 150 60 L 158 58 L 166 62 L 174 60 L 210 60 L 216 36 L 222 86 L 228 50 L 234 60 L 270 60 L 278 58 L 286 64 L 294 60 L 330 60 L 336 38 L 342 84 L 348 50 L 354 60 L 400 60" fill="none" stroke="rgba(140,225,200,0.85)" strokeWidth="1.6" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 6px rgba(140,225,200,0.7))' }} />
            </svg>
          </div>
          {/* Bottom glass 3-col */}
          <div style={cbGlass({ left: 24, right: 24, bottom: 24, padding: '14px 16px', borderRadius: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 })}>
            {[
              { k: 'Signal stability', v: 'Improved', mint: true },
              { k: 'Heart-rate trend', v: 'Steady', mint: false },
              { k: 'Night activation', v: 'Lower', mint: false },
            ].map((col, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(244,239,234,0.42)' }}>{col.k}</span>
                <span style={{ fontSize: 14, fontWeight: 400, color: col.mint ? 'rgb(180,225,200)' : '#F4EFEA', letterSpacing: '-0.01em' }}>{col.v}</span>
              </div>
            ))}
          </div>
        </div>
      }
    />
  );
}

// ── 5. Sleep Position / Restlessness ─────────────────────────────────────────
function ConsumerPositionSection() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const positionCorrelates = [
    'Movement levels during different positional windows',
    'Heart-rate trends that may correspond to changes in position',
    'Restlessness windows and whether oral activity overlapped',
    'Which positions — based on your own data — tend to correlate with lower or higher movement overnight',
  ];

  return (
    <CbSection
      sid="cb-position" index="05 · Restlessness Insight" isMobile={isMobile}
      heading="Reveal when restlessness" headingSans="and oral activity overlap."
      eyebrow="Restlessness and Oral Activity Context"
      body="Patients may feel tired, tense, or unrested without understanding what happened overnight. byteSense helps your practice show when sleep became more restless and whether those periods overlapped with increased oral activity — making nighttime patterns more visible, understandable, and easier to discuss chairside."
      open={open} onToggle={() => setOpen(o => !o)}
      dropdownContent={
        <div style={{ padding: isMobile ? '24px 16px 32px' : '32px 36px 40px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: CB_TEAL, textTransform: 'uppercase', marginBottom: 18 }}>Position-Aware Sleep and Recovery Insights</div>

          <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: '0 0 14px' }}>
            Sleep position is one of the most intuitive variables in sleep. People instinctively understand that how they sleep affects how they feel — but they rarely have data to test that instinct.
          </p>
          <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: '0 0 14px' }}>
            byteSense tracks when you are on your side versus your back, and shows you how those periods relate to movement, heart-rate trends, and overnight restlessness. The result is a picture of whether position may be connected to how settled or activated your sleep appeared.
          </p>
          <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: '0 0 24px' }}>
            This is framed around <em>your patterns</em> — correlations and personal observations — not clinical claims about any specific position preventing or causing any condition.
          </p>

          {/* Insight callout */}
          <div style={{ background: 'rgba(120,200,220,0.05)', border: `1px solid rgba(120,200,220,0.18)`, borderRadius: 10, padding: '18px 20px', marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: CB_TEAL, textTransform: 'uppercase', marginBottom: 10 }}>What an insight looks like</div>
            <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontSize: 15, lineHeight: 1.55, color: '#F4EFEA', margin: 0 }}>
              {'"'}You spent more time on your back last night, and that window overlapped with higher movement and a slightly elevated heart-rate trend. Try tracking side-sleeping nights over the next week and compare.{'"'}
            </p>
          </div>

          <p style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F4', margin: '0 0 10px' }}>Position data is compared against:</p>
          <div style={{ marginBottom: 20 }}>
            {positionCorrelates.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 7, fontSize: 13, color: DIM, lineHeight: 1.7 }}>
                <span style={{ color: CB_TEAL, flexShrink: 0, marginTop: 1 }}>—</span>
                <span>{b}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 13, color: DIM, lineHeight: 1.8, margin: 0, fontStyle: 'italic' }}>
            Position insights describe correlations in your own data — not medical guidance. byteSense does not evaluate, detect, or address sleep apnea, snoring, reflux, or any other clinical condition.
          </p>
        </div>
      }
      visual={
        <div style={cbVisual(`
          radial-gradient(ellipse 70% 50% at 25% 30%, rgba(80,140,200,0.28) 0%, transparent 55%),
          radial-gradient(ellipse 70% 50% at 80% 80%, rgba(255,180,120,0.20) 0%, transparent 55%),
          linear-gradient(170deg, #0B1224 0%, #08101D 50%, #050810 100%)
        `)}>
          {/* Pills */}
          <div style={cbPill({ top: 24, left: 24 })}><span style={cbTealDot} />Restlessness and oral activity context</div>
          <div style={cbPill({ top: 24, right: 24 })}><span style={cbAmberDot} />More time on back</div>
          {/* Arc SVG */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: '28%', bottom: '38%', zIndex: 3, padding: '0 24px', boxSizing: 'border-box' }}>
            <svg viewBox="0 0 400 200" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
              <path d="M 0 130 L 400 130" stroke="rgba(244,239,234,0.10)" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M 4 130 L 96 130"  stroke={CB_TEAL}  strokeWidth="4" fill="none" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 6px rgba(120,200,220,0.6))' }} />
              <path d="M 100 130 L 240 130" stroke={CB_AMBER} strokeWidth="4" fill="none" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 6px rgba(255,180,100,0.6))' }} />
              <path d="M 244 130 L 396 130" stroke={CB_TEAL}  strokeWidth="4" fill="none" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 6px rgba(120,200,220,0.6))' }} />
              <path d="M 100 130 L 120 128 L 140 90 L 158 105 L 178 70 L 196 86 L 214 58 L 232 90 L 240 130" fill="none" stroke={CB_AMBER} strokeWidth="1.4" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 5px rgba(255,180,100,0.7))' }} />
              <circle cx="4"   cy="130" r="3" fill="rgba(244,239,234,0.65)" />
              <circle cx="96"  cy="130" r="3" fill="rgba(244,239,234,0.65)" />
              <circle cx="240" cy="130" r="3" fill="rgba(244,239,234,0.65)" />
              <circle cx="396" cy="130" r="3" fill="rgba(244,239,234,0.65)" />
            </svg>
          </div>
          {/* Axis labels */}
          <div style={{ position: 'absolute', left: 24, right: 24, top: 'calc(28% + (100% - 28% - 38%) * 0.65)', display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: 9.5, color: 'rgba(244,239,234,0.45)', letterSpacing: '0.08em', zIndex: 4 }}>
            <span>11:42 PM</span><span>2:08 AM</span><span>5:30 AM</span><span>6:38 AM</span>
          </div>
          {/* Bottom glass legend */}
          <div style={cbGlass({ left: 24, right: 24, bottom: 24, padding: '14px 16px', borderRadius: 16, display: 'flex', gap: 18, alignItems: 'center' })}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#F4EFEA' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: CB_TEAL, boxShadow: '0 0 6px rgba(120,200,220,0.7)', flexShrink: 0 }} />Side
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#F4EFEA' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: CB_AMBER, boxShadow: '0 0 6px rgba(255,180,100,0.7)', flexShrink: 0 }} />Back
            </div>
            <div style={{ flex: 1 }} />
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(244,239,234,0.55)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Restlessness increased during this window</span>
          </div>
        </div>
      }
    />
  );
}

// ── 6. Oral Intelligence ──────────────────────────────────────────────────────
function ConsumerOralSection() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const oralIntelBullets = [
    'Heart-rate trends captured from inside the oral appliance',
    'Movement and restlessness patterns across the night',
    'Oral temperature changes that may reflect physiological state',
    'Signal stability — how consistent and clean the overnight reading appeared',
    'Pattern interpretation across multiple nights, not just single-night snapshots',
  ];

  const chips = [
    { label: 'HR',   val: '62',    mint: true,  style: { left: '6%',  top: '22%' } },
    { label: 'Temp', val: '36.4°', mint: true,  style: { right: '6%', top: '18%' } },
    { label: 'HRV',  val: '↓ 12%', mint: false, style: { left: '4%',  top: '50%' } },
    { label: 'Move', val: '↑',     mint: false, style: { right: '4%', top: '56%' } },
  ];

  return (
    <CbSection
      sid="cb-oral" index="06 · Practice Positioning" isMobile={isMobile}
      heading="Move beyond" headingSans="plastic."
      eyebrow="Oral Intelligence and Whole-Body Context"
      body={'byteSense helps your practice move the conversation beyond “protect your teeth with plastic.” Nighttime oral activity can be part of a broader pattern involving stress, sleep disruption, recovery, restlessness, and body activation. By helping patients see those connections, your practice is positioned less like a commodity appliance provider and more like a modern oral-health partner.'}
      open={open} onToggle={() => setOpen(o => !o)}
      dropdownContent={
        <div style={{ padding: isMobile ? '24px 16px 32px' : '32px 36px 40px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: CB_MINT, textTransform: 'uppercase', marginBottom: 18 }}>AI-Powered Oral Intelligence</div>

          <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: '0 0 14px' }}>
            Decades of research have described the oral-systemic connection — biological links between the mouth and the broader body. The oral cavity has proximity to the brain, the circulatory system, the airway, and the nervous system. It is a rich, and largely untapped, sensing environment.
          </p>
          <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: '0 0 14px' }}>
            byteSense builds an AI interpretation layer on top of nighttime signals captured from inside the mouth — helping make sense of patterns that raw numbers alone do not explain. The goal is personalized understanding, not generalized scores.
          </p>
          <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: '0 0 24px' }}>
            This is what turns the appliance from plastic into a platform. Not just protection — but continuous, AI-interpreted nighttime intelligence, delivered through something already in your mouth.
          </p>

          {/* Insight callout */}
          <div style={{ background: 'rgba(140,225,185,0.05)', border: `1px solid rgba(140,225,185,0.18)`, borderRadius: 10, padding: '18px 20px', marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: CB_MINT, textTransform: 'uppercase', marginBottom: 10 }}>What an insight looks like</div>
            <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontSize: 15, lineHeight: 1.55, color: '#F4EFEA', margin: 0 }}>
              {'“'}Your mouth-based signals suggest a more activated night than usual: elevated heart-rate trend, increased movement, and a higher oral temperature pattern. Your recovery outlook may be lower today.{'”'}
            </p>
          </div>

          <p style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F4', margin: '0 0 10px' }}>Oral Intelligence interprets:</p>
          <div style={{ marginBottom: 20 }}>
            {oralIntelBullets.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 7, fontSize: 13, color: DIM, lineHeight: 1.7 }}>
                <span style={{ color: CB_MINT, flexShrink: 0, marginTop: 1 }}>—</span>
                <span>{b}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 13, color: DIM, lineHeight: 1.8, margin: 0, fontStyle: 'italic' }}>
            Oral Intelligence surfaces personal patterns and recovery context — not clinical assessments. byteSense is a wellness tool designed to support healthy sleep habits, not to diagnose, treat, or evaluate any medical condition.
          </p>
        </div>
      }
      visual={
        <div style={cbVisual(`
          radial-gradient(ellipse 60% 50% at 50% 50%, rgba(80,180,160,0.20) 0%, transparent 55%),
          radial-gradient(ellipse 70% 50% at 80% 30%, rgba(255,180,100,0.10) 0%, transparent 55%),
          radial-gradient(circle at 50% 50%, #0F1816 0%, #080C0B 60%, #030505 100%)
        `)}>
          {/* Pills */}
          <div style={cbPill({ top: 24, left: 24 })}><span style={cbMintDot} />Mouth signals · interpreted</div>
          <div style={cbPill({ top: 24, right: 24 })}><span style={cbAmberDot} />Nighttime activation {'↑'}</div>
          {/* Orbit SVG */}
          <div style={{ position: 'absolute', inset: '14% 14% 26% 14%', zIndex: 3 }}>
            <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
              <circle cx="100" cy="100" r="92" fill="none" stroke="rgba(244,239,234,0.08)" strokeWidth="1" />
              <circle cx="100" cy="100" r="68" fill="none" stroke="rgba(244,239,234,0.08)" strokeWidth="1" />
              <circle cx="100" cy="100" r="44" fill="none" stroke="rgba(244,239,234,0.08)" strokeWidth="1" />
              <path d="M 100 8 A 92 92 0 0 1 192 100" fill="none" stroke="rgba(140,225,200,0.45)" strokeWidth="1.4" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 4px rgba(140,225,200,0.5))' }} />
              <path d="M 100 32 A 68 68 0 1 1 32 100" fill="none" stroke="rgba(140,225,200,0.45)" strokeWidth="1.4" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 4px rgba(140,225,200,0.5))' }} />
            </svg>
          </div>
          {/* Glowing core */}
          <div style={{ position: 'absolute', left: '50%', top: 'calc(50% - 6%)', transform: 'translate(-50%,-50%)', width: '26%', aspectRatio: '1/1', borderRadius: '50%', background: 'radial-gradient(circle, rgba(180,235,210,0.35) 0%, rgba(120,210,170,0.15) 40%, transparent 70%)', zIndex: 3 }}>
            <div style={{ position: 'absolute', inset: '30%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,239,234,0.85) 0%, rgba(180,225,200,0.4) 40%, transparent 70%)', boxShadow: '0 0 24px rgba(180,225,200,0.6)' }} />
          </div>
          {/* Floating chips */}
          {chips.map((c, i) => (
            <div key={i} style={{ position: 'absolute', padding: '5px 9px', borderRadius: 999, background: 'rgba(20,14,10,0.45)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', fontFamily: 'monospace', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#F4EFEA', zIndex: 4, whiteSpace: 'nowrap', ...c.style }}>
              {c.label} <span style={{ color: c.mint ? 'rgb(180,225,200)' : CB_AMBER, marginLeft: 4, fontFamily: C.fn, fontSize: 11, letterSpacing: '-0.01em' }}>{c.val}</span>
            </div>
          ))}
          {/* Bottom glass */}
          <div style={cbGlass({ left: 24, right: 24, bottom: 24, padding: '14px 16px', borderRadius: 16 })}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgb(180,225,200)', marginBottom: 5 }}>Overnight intelligence</div>
            <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontSize: 17, lineHeight: 1.25, color: '#F4EFEA' }}>Recovery looked lower, with more nighttime activation than usual.</div>
          </div>
        </div>
      }
    />
  );
}

// ── 7. Discover What Impacts Sleep ────────────────────────────────────────────
function ConsumerDiscoverSection() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const causeChips = [
    { text: 'Earlier sleep start',       cls: 'cause', style: { top: '28%', left: '6%'  } },
    { text: 'Heart rate dropped sooner', cls: 'effect', style: { top: '32%', right: '6%' } },
    { text: 'Lower late-night movement', cls: 'cause', style: { top: '56%', left: '6%'  } },
    { text: 'Recovery trended higher',   cls: 'effect', style: { top: '60%', right: '6%' } },
  ];

  const loopSteps = [
    { label: 'Track', sub: 'Nightly data from the appliance', color: CB_MINT },
    { label: 'Interpret', sub: 'Patterns across behaviors & physiology', color: CB_AMBER },
    { label: 'Act', sub: 'Personalized habit suggestions', color: CB_TEAL },
    { label: 'Improve', sub: 'Recovery trends over time', color: 'rgb(180,225,200)' },
  ];

  const connectsBullets = [
    'Bedtime timing and how quickly heart rate settles',
    'Movement levels and overlapping oral activity',
    'Sleep position and restlessness windows',
    'Lifestyle habits — caffeine, alcohol, travel, stress — and recovery scores',
    'Consistency of sleep start time and overall recovery trend',
  ];

  return (
    <CbSection
      sid="cb-discover" index="07 · Between-Visit Touchpoints" isMobile={isMobile}
      heading="Keep patients engaged" headingSans="between visits."
      eyebrow="Ongoing Patient Engagement"
      body="byteSense helps your practice stay connected beyond the two hygiene visits per year. As patients begin seeing patterns across stress, sleep timing, caffeine, alcohol, travel, recovery, movement, and nighttime oral activity, the app creates ongoing reasons to re-engage, reinforce provider recommendations, and bring patients back into meaningful follow-up conversations."
      open={open} onToggle={() => setOpen(o => !o)}
      dropdownContent={
        <div style={{ padding: isMobile ? '24px 16px 32px' : '32px 36px 40px' }}>

          {/* Eyebrow */}
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: CB_MINT, textTransform: 'uppercase', marginBottom: 18 }}>Deeper Health Insight</div>

          {/* Intro */}
          <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: '0 0 14px' }}>
            Sleep is one of the most behaviorally modifiable aspects of health. What you do in the hours before bed, when you go to sleep, how still you stay, and how consistently you repeat those habits — these things are associated with meaningful differences in how restorative sleep looks overnight.
          </p>
          <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: '0 0 28px' }}>
            byteSense connects the dots between your behaviors, sleep environment, body position, and overnight physiology — so you can discover what may be helping or hurting your sleep, specific to <em>you</em>.
          </p>

          {/* Daily Insight Loop */}
          <p style={{ fontSize: 13, fontWeight: 600, color: '#F4EFEA', margin: '0 0 14px' }}>The Daily Insight Loop</p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10, marginBottom: 28 }}>
            {loopSteps.map((step, i) => (
              <div key={i} style={{ background: '#0D0D10', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 16px', position: 'relative' }}>
                <div style={{ fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgba(244,239,234,0.35)', marginBottom: 8 }}>0{i + 1}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: step.color, marginBottom: 6 }}>{step.label}</div>
                <div style={{ fontSize: 11, color: DIM, lineHeight: 1.5 }}>{step.sub}</div>
                {i < 3 && !isMobile && (
                  <div style={{ position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'rgba(244,239,234,0.25)', zIndex: 1 }}>→</div>
                )}
              </div>
            ))}
          </div>

          {/* Pattern insight callout */}
          <div style={{ background: 'rgba(140,225,185,0.05)', border: `1px solid rgba(140,225,185,0.18)`, borderRadius: 10, padding: '18px 20px', marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: CB_MINT, textTransform: 'uppercase', marginBottom: 10 }}>What an insight looks like</div>
            <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontSize: 16, lineHeight: 1.5, color: '#F4EFEA', margin: 0 }}>
              "Your best recovery nights tend to correlate with an earlier sleep start, lower late-night movement, and a heart rate that drops sooner after bedtime."
            </p>
          </div>

          {/* What it connects */}
          <p style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F4', margin: '0 0 10px' }}>byteSense looks for connections between:</p>
          <div style={{ marginBottom: 20 }}>
            {connectsBullets.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 7, fontSize: 13, color: DIM, lineHeight: 1.7 }}>
                <span style={{ color: CB_MINT, flexShrink: 0, marginTop: 1 }}>—</span>
                <span>{b}</span>
              </div>
            ))}
          </div>

          {/* Closing note */}
          <p style={{ fontSize: 13, color: DIM, lineHeight: 1.8, margin: 0, fontStyle: 'italic' }}>
            Language in the app uses "associated with," "linked with," and "may be related to" — reflecting real patterns in your data without overstating causation.
          </p>
        </div>
      }
      visual={
        <div style={cbVisual(`
          radial-gradient(ellipse 70% 50% at 30% 30%, rgba(80,180,140,0.22) 0%, transparent 55%),
          radial-gradient(ellipse 70% 50% at 80% 80%, rgba(255,180,100,0.15) 0%, transparent 55%),
          linear-gradient(165deg, #0B1614 0%, #080F0E 50%, #050807 100%)
        `)}>
          {/* Pills */}
          <div style={cbPill({ top: 24, left: 24 })}><span style={cbMintDot} />Patterns across patient nights</div>
          <div style={cbPill({ top: 24, right: 24 })}><span style={cbAmberDot} />Patient pattern noticed</div>
          {/* Flow SVG */}
          <div style={{ position: 'absolute', inset: '22% 8% 26% 8%', zIndex: 3 }}>
            <svg viewBox="0 0 400 220" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible', display: 'block' }}>
              <path d="M 80 60 C 160 60, 200 90, 320 110"  stroke="rgba(255,180,100,0.55)"  strokeWidth="1.4" fill="none" />
              <path d="M 80 150 C 160 150, 200 130, 320 100" stroke="rgba(140,225,200,0.45)" strokeWidth="1.4" fill="none" strokeDasharray="4 4" />
              <path d="M 80 60 C 160 80, 200 140, 320 160"  stroke="rgba(140,225,200,0.45)" strokeWidth="1.4" fill="none" strokeDasharray="4 4" />
            </svg>
          </div>
          {/* Cause/Effect chips */}
          {causeChips.map((c, i) => (
            <div key={i} style={{ position: 'absolute', padding: '7px 11px', borderRadius: 999, background: 'rgba(20,14,10,0.45)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', fontSize: 11, color: '#F4EFEA', zIndex: 4, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: C.fn, ...c.style }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.cls === 'cause' ? CB_AMBER : CB_MINT, boxShadow: c.cls === 'cause' ? '0 0 6px rgba(255,180,100,0.7)' : '0 0 6px rgba(140,225,200,0.7)', flexShrink: 0 }} />
              {c.text}
            </div>
          ))}
          {/* Bottom glass */}
          <div style={cbGlass({ left: 24, right: 24, bottom: 20, padding: '12px 16px', borderRadius: 16 })}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', color: CB_MINT, marginBottom: 4 }}>Pattern noticed</div>
            <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontSize: 15, lineHeight: 1.25, color: '#F4EFEA' }}>This patient's best nights tend to share a quieter, earlier start.</div>
          </div>
        </div>
      }
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProductExperienceScreen() {
  const [activeSection, setActiveSection] = useState('ob-revenue');
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

  const navItemStyle = (id: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 24px',
    fontSize: 13, fontWeight: activeSection === id ? 600 : 400,
    color: activeSection === id ? RED_B : DIM,
    background: activeSection === id ? RED_MUT : 'transparent',
    borderLeft: `2px solid ${activeSection === id ? RED_B : 'transparent'}`,
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
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: '#F4F4F4', marginBottom: 8 }}>
            byte<span style={{ color: RED_B }}>Sense</span>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 600, letterSpacing: 2, color: RED_B,
            background: RED_MUT, border: `1px solid ${RED_B}55`, padding: '3px 10px', display: 'inline-block',
          }}>BETA PARTNER</span>
        </div>

        {/* Nav */}
        <div style={{ padding: '16px 0', flex: 1 }}>
          {NAV_GROUPS.map((group) => (
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
          <div style={{ background: RED_MUT, border: `1px solid ${RED_B}55`, padding: 14 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: RED_B, fontWeight: 700, marginBottom: 6 }}>Contact Support</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F4', marginBottom: 2 }}>+1 (888) 397-7073</div>
            <div style={{ fontSize: 13, color: DIM }}>support@bytesense.ai</div>
          </div>
        </div>
      </nav>
      )}

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Mobile group selector + section tab strip */}
        {isMobile && (() => {
          const activeGroup = NAV_GROUPS.find(g => g.items.some(i => i.id === activeSection)) ?? NAV_GROUPS[0];
          return (
            <div style={{ position: 'sticky', top: 0, zIndex: 20, background: BG, flexShrink: 0 }}>
              {/* ── Group selector ── */}
              <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}` }}>
                {NAV_GROUPS.map(group => {
                  const isActive = group.label === activeGroup.label;
                  return (
                    <button
                      key={group.label}
                      onClick={() => {
                        const first = group.items[0];
                        scrollToSection(first.id);
                        scrollTabIntoView(first.id);
                      }}
                      style={{
                        flex: 1, padding: '11px 8px', border: 'none', cursor: 'pointer',
                        fontFamily: C.fn, fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
                        background: isActive ? RED_MUT : 'transparent',
                        color: isActive ? RED_B : '#555',
                        borderBottom: `2px solid ${isActive ? RED_B : 'transparent'}`,
                        transition: 'all 0.2s',
                      }}
                    >
                      {group.label}
                    </button>
                  );
                })}
              </div>

              {/* ── Section tab strip (filtered to active group) ── */}
              <div ref={tabStripRef} style={{ overflowX: 'auto', whiteSpace: 'nowrap', borderBottom: `1px solid ${BORDER}`, padding: '0 4px', WebkitOverflowScrolling: 'touch' as any }}>
                {activeGroup.items.map(item => (
                  <button key={item.id} data-tab={item.id}
                    onClick={() => { scrollToSection(item.id); scrollTabIntoView(item.id); }}
                    style={{
                      display: 'inline-block', padding: '9px 14px', fontSize: 11, fontWeight: 500,
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: activeSection === item.id ? RED_B : '#777',
                      borderBottom: `2px solid ${activeSection === item.id ? RED_B : 'transparent'}`,
                      whiteSpace: 'nowrap', minHeight: 40, fontFamily: C.fn,
                    }}>{item.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Section content */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>

          {/* Office Benefits header */}
          <div style={{ maxWidth: 900, padding: isMobile ? '24px 16px 0' : '48px 64px 0', fontFamily: C.fn }}>
            <div style={sectionTag}>For Your Practice — bytesense.ai/professionals</div>
            <h2 style={sectionTitle}>Office <span style={accent}>Benefits</span></h2>
            <p style={sectionSubtitle}>Why forward-thinking practices are adding bioSense™ to their protocol.</p>
          </div>

          {/* Office Benefit sections */}
          {OFFICE_ITEMS.map(item =>
            item.id === 'ob-trust'       ? <TrustSection key="ob-trust" /> :
            item.id === 'ob-revenue'     ? <PracticeRevenueSection key="ob-revenue" /> :
            item.id === 'ob-retention'   ? <PatientRetentionSection key="ob-retention" /> :
            item.id === 'ob-positioning' ? <SophisticationSection key="ob-positioning" /> :
            item.id === 'ob-liability'   ? <LiabilitySection key="ob-liability" /> :
            item.id === 'ob-premium'     ? <PremiumDifferentiationSection key="ob-premium" /> :
            (
              <div key={item.id} data-sid={item.id} style={{ maxWidth: 900, padding: isMobile ? '24px 16px' : '40px 64px', borderTop: `1px solid ${BORDER}`, fontFamily: C.fn }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#F4F4F4', marginBottom: 14 }}>{item.trigger}</h3>
                <p style={{ fontSize: 15, color: DIM, lineHeight: 1.8 }}>{item.body}</p>
              </div>
            )
          )}

          {/* Consumer Benefits header */}
          <div style={{ maxWidth: 900, padding: isMobile ? '24px 16px 0' : '48px 64px 0', borderTop: `2px solid ${BORDER}`, fontFamily: C.fn }}>
            <div style={sectionTag}>For Your Patients — bytesense.ai/consumers</div>
            <h2 style={sectionTitle}>Consumer <span style={accent}>Benefits</span></h2>
            <p style={sectionSubtitle}>What patients gain every night — turning passive protection into active health intelligence.</p>
          </div>

          {/* Consumer Benefit sections */}
          {CONSUMER_ITEMS.map(item =>
            item.id === 'cb-sleep'        ? <ConsumerSleepSection        key="cb-sleep" /> :
            item.id === 'cb-readiness'    ? <ConsumerReadinessSection    key="cb-readiness" /> :
            item.id === 'cb-morning'      ? <ConsumerMorningSection      key="cb-morning" /> :
            item.id === 'cb-circulation'  ? <ConsumerCirculationSection  key="cb-circulation" /> :
            item.id === 'cb-position'     ? <ConsumerPositionSection     key="cb-position" /> :
            item.id === 'cb-oral'         ? <ConsumerOralSection         key="cb-oral" /> :
            item.id === 'cb-discover'     ? <ConsumerDiscoverSection     key="cb-discover" /> :
            null
          )}

          {/* Footer */}
          <div style={{ maxWidth: 900, padding: '40px 64px', borderTop: `1px solid ${BORDER}`, textAlign: 'center', fontFamily: C.fn }}>
            <div style={{ fontSize: 11, color: FAINT, letterSpacing: 2, marginBottom: 8 }}>BYTESENSE · bytesense.ai</div>
            <div style={{ fontSize: 10, color: FAINT }}>Beta Partner Resource · Confidential · Not for Distribution</div>
          </div>

        </div>
      </div>
    </div>
  );
}
