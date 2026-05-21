import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '@/data/constants';
import { useIsMobile } from '@/hooks/use-mobile';

interface RoleplaySimulationScreenProps {
  s: any;
  u: (d: any) => void;
  lang?: string;
}

// ── Colours ──────────────────────────────────────────────────────────────────
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

// ── Shared layout helpers ─────────────────────────────────────────────────────
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
  letterSpacing: -1, marginBottom: 8, color: 'var(--bs-text)', fontFamily: C.fn,
};

const sectionSubtitle: React.CSSProperties = {
  fontSize: 16, color: DIM, fontWeight: 400,
  marginBottom: 40, maxWidth: 600, fontFamily: C.fn,
};

const divider: React.CSSProperties = {
  borderTop: `1px solid ${BORDER}`, margin: '32px 0',
};

const highlightBox = (teal = false): React.CSSProperties => ({
  background: teal ? TEAL_MUT : RED_MUT,
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

const cardStyle = (color: 'red' | 'teal' | 'none' = 'none'): React.CSSProperties => ({
  background: color === 'red' ? RED_MUT : color === 'teal' ? TEAL_MUT : CARD,
  border: `1px solid ${color === 'red' ? RED_BDR : color === 'teal' ? TEAL_C + '55' : BORDER2}`,
  padding: '20px 22px',
  marginBottom: 14,
  fontFamily: C.fn,
});

const checkList: React.CSSProperties = {
  listStyle: 'none', padding: 0, marginTop: 12,
};

const checkLi: React.CSSProperties = {
  fontSize: 13, color: DIM, padding: '5px 0',
  display: 'flex', gap: 10, alignItems: 'flex-start',
};

// ── AI Simulations Section ────────────────────────────────────────────────────
function AISimulationsSection({ u }: { u: (d: any) => void }) {
  const patients = [
    { name: 'Jordan',   desc: 'Cost-focused · Skeptical' },
    { name: 'Maria',    desc: 'Anxious · Needs reassurance' },
    { name: 'Devon',    desc: 'Busy professional · Time-pressed' },
    { name: 'Patricia', desc: 'Insurance-first · Budget-minded' },
    { name: 'Marcus',   desc: 'Tech-savvy · Wants data' },
    { name: 'Aisha',    desc: 'Curious · Open to wellness' },
  ];

  const practices = [
    'Introducing bioSense™ naturally during an appointment',
    'Responding to price, insurance, and "I need to think about it" objections',
    'Keeping the conversation moving toward a confident close',
    'Adjusting your tone based on the patient\'s personality',
    'Completing 3 successful conversations to unlock your certificate',
  ];

  return (
    <div style={sectionStyle}>
      <div style={sectionTag}>Tool 01 — Practice &amp; Roleplay</div>
      <h2 style={sectionTitle}>AI Patient <strong>Simulations</strong></h2>
      <p style={sectionSubtitle}>
        Roleplay real patient conversations with AI. Practice objection handling, closing, and education in a safe environment — no judgment, unlimited attempts.
      </p>

      <div style={highlightBox(true)}>
        <div style={hlLabel(true)}>How It Works — Simulate Before You Sell</div>
        <p style={hlBody}>
          Each AI patient has a unique personality, hesitation style, and set of objections. Your job is to guide them through the decision — just like a real appointment. The AI responds naturally and adapts to your approach.
        </p>
      </div>

      <div style={divider} />

      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--bs-text)', marginBottom: 20, fontFamily: C.fn }}>
        Meet Your AI Patients
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 32 }}>
        {patients.map(({ name, desc }) => (
          <div
            key={name}
            style={{
              background: CARD,
              border: `1px solid ${BORDER2}`,
              padding: '16px 18px',
              fontFamily: C.fn,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--bs-text)', marginBottom: 4 }}>{name}</div>
            <div style={{ fontSize: 12, color: TEAL_C }}>{desc}</div>
          </div>
        ))}
      </div>

      <div style={divider} />

      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--bs-text)', marginBottom: 16, fontFamily: C.fn }}>
        What You'll Practice
      </div>
      <ul style={checkList}>
        {practices.map((item, i) => (
          <li key={i} style={checkLi}>
            <span style={{ color: TEAL_C, flexShrink: 0, fontWeight: 700 }}>✓</span>
            {item}
          </li>
        ))}
      </ul>

      <div style={divider} />

      <button
        onClick={() => u({ phase: 'simulation' })}
        style={{
          background: TEAL_C,
          color: '#000',
          border: 'none',
          padding: '14px 32px',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: C.fn,
          letterSpacing: 0.5,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      >
        Launch AI Simulations →
      </button>
    </div>
  );
}

// ── AI Coach Section ──────────────────────────────────────────────────────────
function AICoachSection() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const coachCards = [
    {
      title: 'Ask Anything',
      body: 'Get answers to any ByteSense, sales, or clinical question instantly. No waiting for a call — your coach is always on.',
    },
    {
      title: 'Patient Follow-Up',
      body: 'Generate personalized follow-up scripts for any patient. Share them with your TC or send directly.',
    },
    {
      title: 'Treatment Plan Language',
      body: `Get help explaining bioSense™ in clinical terms. Useful for case presentations and informed consent conversations.`,
    },
    {
      title: 'Objection Handling',
      body: `Describe an objection you heard and get a word-for-word response tailored to your patient's concern.`,
    },
  ];

  const coachingModes = [
    { label: 'General Q&A', desc: 'Any training or product question answered immediately' },
    { label: 'Follow-Up Coach', desc: 'Scripts and guidance for patients who didn\'t commit' },
    { label: 'Treatment Plan', desc: 'Language support for clinical case presentations' },
    { label: 'Objection Coach', desc: 'Responses to price, insurance, and hesitation objections' },
    { label: 'Education Coach', desc: 'Deep-dive on bruxism, sleep, and device science' },
  ];

  return (
    <div style={{ ...sectionStyle, borderBottom: 'none' }}>
      <div style={sectionTag}>Tool 02 — Personalized Coaching</div>
      <h2 style={sectionTitle}>AI <strong>Coach</strong></h2>
      <p style={sectionSubtitle}>
        Ask anything. Get instant, personalized guidance on patient conversations, objections, clinical concepts, or training questions — available 24/7.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 32 }}>
        {coachCards.map(({ title, body }) => (
          <div key={title} style={cardStyle('teal')}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--bs-text)', marginBottom: 8 }}>{title}</div>
            <div style={{ fontSize: 13, color: DIM, lineHeight: 1.75 }}>{body}</div>
          </div>
        ))}
      </div>

      <div style={divider} />

      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--bs-text)', marginBottom: 16, fontFamily: C.fn }}>
        Coaching Modes
      </div>
      <ul style={{ listStyle: 'none', padding: 0, marginBottom: 32 }}>
        {coachingModes.map(({ label, desc }, i) => (
          <li key={i} style={{ ...checkLi, paddingTop: 8, paddingBottom: 8, borderBottom: `1px solid ${BORDER}` }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: TEAL_C, flexShrink: 0, marginTop: 4,
            }} />
            <span>
              <strong style={{ color: 'var(--bs-text)' }}>{label}</strong>
              <span style={{ color: FAINT }}> — </span>
              {desc}
            </span>
          </li>
        ))}
      </ul>

      <div style={divider} />

      <button
        onClick={() => navigate('/ai-coach/general')}
        style={{
          background: TEAL_C,
          color: '#000',
          border: 'none',
          padding: '14px 32px',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: C.fn,
          letterSpacing: 0.5,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      >
        Open AI Coach →
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RoleplaySimulationScreen({ s, u, lang }: RoleplaySimulationScreenProps) {
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState('ai-simulations');

  const navGroups = [
    {
      label: 'Roleplay Tools',
      items: [
        { id: 'ai-simulations', label: 'AI Simulations' },
        { id: 'ai-coach',       label: 'AI Coach' },
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
    <div style={{ display: 'flex', minHeight: isMobile ? '100dvh' : '100vh', background: BG, fontFamily: C.fn }}>

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
                  onClick={() => setActiveSection(item.id)}
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

        {/* Sidebar footer contact */}
        <div style={{ padding: '20px 24px', borderTop: `1px solid ${BORDER}` }}>
          <div style={{ background: RED_MUT, border: `1px solid ${RED_BDR}`, padding: 14 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: RED_B, fontWeight: 700, marginBottom: 6 }}>Contact Support</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bs-text)', marginBottom: 2 }}>(855) 301-0424</div>
            <div style={{ fontSize: 13, color: DIM }}>support@bytesense.ai</div>
          </div>
        </div>
      </nav>
      )}

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>


        {isMobile && (
          <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', borderBottom: `1px solid ${BORDER}`, padding: '0 4px', flexShrink: 0 }}>
            {[
              { id: 'ai-simulations', label: 'AI Simulations' },
              { id: 'ai-coach', label: 'AI Coach' },
            ].map(item => (
              <button key={item.id} onClick={() => setActiveSection(item.id)}
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
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeSection === 'ai-simulations' && <AISimulationsSection u={u} />}
          {activeSection === 'ai-coach'       && <AICoachSection />}
        </div>
      </div>
    </div>
  );
}
