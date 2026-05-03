/**
 * TypeformIntake — Typeform-style onboarding flow.
 *
 * UX rules:
 * - One question per full screen, centered
 * - Radio: tap/click auto-advances after 500ms
 * - Multi-select + text: OK button or Enter key
 * - Keyboard: 1-9 / a-i to select option, Enter to advance, Backspace to go back
 * - Smooth slide-up (forward) / slide-down (back) transitions
 * - Thin teal progress bar at very top
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useIntakeState, IntakeData } from '@/hooks/useIntakeState';
import { C } from '@/data/constants';
import { useIsMobile } from '@/hooks/use-mobile';
import { Logo } from '@/components/ByteSenseLogo';

// ─── Question definitions ─────────────────────────────────────────────────────

type QType = 'welcome' | 'radio' | 'multiselect' | 'fields' | 'complete';

interface Option { key: string; label: string; value: string }
interface Field  { id: keyof IntakeData; label: string; placeholder?: string; type?: string; required?: boolean }

interface QuestionDef {
  id: string;
  type: QType;
  num?: string;                              // "01", "02" …
  question?: string;
  description?: string;
  options?: Option[];
  fields?: Field[];
  dataKey?: keyof IntakeData;               // single-value field
  showIf?: (d: IntakeData) => boolean;
  autoAdvance?: boolean;                     // radio auto-advance (default true for radio)
}

const OPTS = {
  YN: [
    { key: 'A', label: 'Yes', value: 'yes' },
    { key: 'B', label: 'No', value: 'no' },
  ],
  YESNO_SHARED: [
    { key: 'A', label: 'Yes', value: 'yes' },
    { key: 'B', label: 'No', value: 'no' },
    { key: 'C', label: 'Shared decision maker', value: 'shared' },
  ],
  VOLUME: [
    { key: 'A', label: '0 – 2 per month', value: '0-2' },
    { key: 'B', label: '3 – 5 per month', value: '3-5' },
    { key: 'C', label: '6 – 10 per month', value: '6-10' },
    { key: 'D', label: '10 + per month', value: '10+' },
  ],
  PRESENTER: [
    { key: 'A', label: 'Dentist', value: 'dentist' },
    { key: 'B', label: 'Associate', value: 'associate' },
    { key: 'C', label: 'Hygienist', value: 'hygienist' },
    { key: 'D', label: 'Treatment Coordinator', value: 'tc' },
    { key: 'E', label: 'Office Manager', value: 'manager' },
    { key: 'F', label: 'Other', value: 'other' },
  ],
  BILLER: [
    { key: 'A', label: 'Dentist', value: 'dentist' },
    { key: 'B', label: 'Office Manager', value: 'manager' },
    { key: 'C', label: 'Treatment Coordinator', value: 'tc' },
    { key: 'D', label: 'Front Desk', value: 'front' },
    { key: 'E', label: 'Other', value: 'other' },
  ],
  PAYMENT: [
    { key: 'A', label: 'Upfront', value: 'upfront' },
    { key: 'B', label: 'Deposit + balance at delivery', value: 'deposit' },
    { key: 'C', label: 'Insurance submission', value: 'insurance' },
    { key: 'D', label: 'Other', value: 'other' },
  ],
  GUIDANCE: [
    { key: 'A', label: 'Yes', value: 'yes' },
    { key: 'B', label: 'No', value: 'no' },
    { key: 'C', label: 'Not sure', value: 'not_sure' },
  ],
  SUBMITTER: [
    { key: 'A', label: 'Dentist', value: 'dentist' },
    { key: 'B', label: 'Office Manager', value: 'manager' },
    { key: 'C', label: 'Hygienist', value: 'hygienist' },
    { key: 'D', label: 'Dental Assistant', value: 'assistant' },
    { key: 'E', label: 'Scan Coordinator', value: 'scan_coordinator' },
    { key: 'F', label: 'Not sure yet', value: 'not_sure' },
  ],
  STAFF_TRAINING: [
    { key: 'A', label: 'Yes — add staff members now', value: 'yes' },
    { key: 'B', label: 'No — just me for now', value: 'no' },
    { key: 'C', label: 'Later — I\'ll add them after setup', value: 'later' },
  ],
  PATIENT: [
    { key: 'A', label: 'Yes — I have someone in mind', value: 'yes' },
    { key: 'B', label: 'No — not yet', value: 'no' },
    { key: 'C', label: 'Not sure', value: 'not_sure' },
  ],
  TIMELINE: [
    { key: 'A', label: 'Today', value: 'today' },
    { key: 'B', label: 'This week', value: 'this_week' },
    { key: 'C', label: 'Within 2 weeks', value: 'two_weeks' },
    { key: 'D', label: 'Not sure yet', value: 'not_sure' },
  ],
  BLOCKER: [
    { key: 'A', label: 'Unsure how to explain it to patients', value: 'explain_patients' },
    { key: 'B', label: 'Unsure how to submit the case', value: 'submit_case' },
    { key: 'C', label: 'Staff needs training first', value: 'staff_training' },
    { key: 'D', label: 'Need pricing guidance', value: 'pricing' },
    { key: 'E', label: 'Need clinical positioning help', value: 'clinical' },
    { key: 'F', label: 'Need technical support', value: 'technical' },
    { key: 'G', label: 'Nothing — ready to start', value: 'nothing' },
  ],
  ROLES: [
    { key: 'A', label: 'Practice Owner / Dentist', value: 'owner' },
    { key: 'B', label: 'Associate Dentist', value: 'associate' },
    { key: 'C', label: 'Hygienist', value: 'hygienist' },
    { key: 'D', label: 'Treatment Coordinator', value: 'tc' },
    { key: 'E', label: 'Office Manager', value: 'manager' },
    { key: 'F', label: 'Dental Assistant', value: 'assistant' },
    { key: 'G', label: 'Front Desk', value: 'front' },
  ],
  PROFILE: [
    { key: 'A', label: 'Existing bruxism patient', value: 'existing_bruxism' },
    { key: 'B', label: 'Patient with visible wear', value: 'visible_wear' },
    { key: 'C', label: 'Patient already considering a night guard', value: 'considering_guard' },
    { key: 'D', label: 'Patient interested in health / sleep data', value: 'health_sleep' },
    { key: 'E', label: 'Premium or fee-for-service patient', value: 'premium_ffs' },
    { key: 'F', label: 'Not sure', value: 'not_sure' },
  ],
};

const QUESTIONS: QuestionDef[] = [
  {
    id: 'welcome',
    type: 'welcome',
  },
  {
    id: 'decision_maker',
    type: 'radio',
    num: '01',
    question: 'Are you the primary decision maker for your office?',
    options: OPTS.YESNO_SHARED,
    dataKey: 'is_decision_maker',
  },
  {
    id: 'codecision_contact',
    type: 'fields',
    num: '02',
    question: 'Who else should be included in setup decisions?',
    description: 'We\'ll make sure they\'re looped in.',
    showIf: d => d.is_decision_maker === 'no' || d.is_decision_maker === 'shared',
    fields: [
      { id: 'codecision_name', label: 'Full Name', placeholder: 'Jane Smith' },
      { id: 'codecision_role', label: 'Role', placeholder: 'e.g. Office Manager' },
      { id: 'codecision_email', label: 'Email', placeholder: 'jane@practice.com', type: 'email' },
      { id: 'codecision_phone', label: 'Phone', placeholder: '(555) 000-0000', type: 'tel' },
    ],
  },
  {
    id: 'primary_advocate',
    type: 'fields',
    num: '03',
    question: 'Who is your Primary ByteSense Advocate?',
    description: 'This person owns the program internally and is our day-to-day contact.',
    fields: [
      { id: 'primary_name', label: 'Full Name', placeholder: 'Jane Smith', required: true },
      { id: 'primary_role', label: 'Role / Title', placeholder: 'e.g. Lead Hygienist' },
      { id: 'primary_email', label: 'Email', placeholder: 'jane@practice.com', type: 'email', required: true },
      { id: 'primary_phone', label: 'Phone', placeholder: '(555) 000-0000', type: 'tel' },
    ],
  },
  {
    id: 'secondary_advocate',
    type: 'fields',
    num: '04',
    question: 'Who is your Backup Contact?',
    description: 'Who should we reach if your primary advocate is unavailable? (Optional)',
    fields: [
      { id: 'secondary_name', label: 'Full Name', placeholder: 'John Smith' },
      { id: 'secondary_role', label: 'Role / Title', placeholder: 'e.g. Front Desk Manager' },
      { id: 'secondary_email', label: 'Email', placeholder: 'john@practice.com', type: 'email' },
      { id: 'secondary_phone', label: 'Phone', placeholder: '(555) 000-0000', type: 'tel' },
    ],
  },
  {
    id: 'staff_roles',
    type: 'multiselect',
    num: '05',
    question: 'What is your role in the practice?',
    description: 'Select all that apply — this personalizes your training path.',
    options: OPTS.ROLES,
    dataKey: 'staff_roles',
  },
  {
    id: 'monthly_volume',
    type: 'radio',
    num: '06',
    question: 'How many night guards does your practice deliver per month?',
    options: OPTS.VOLUME,
    dataKey: 'monthly_volume',
  },
  {
    id: 'who_presents',
    type: 'radio',
    num: '07',
    question: 'Who usually presents night guard treatment to patients?',
    options: OPTS.PRESENTER,
    dataKey: 'who_presents',
  },
  {
    id: 'who_bills',
    type: 'radio',
    num: '08',
    question: 'Who handles billing and payment collection for appliance cases?',
    options: OPTS.BILLER,
    dataKey: 'who_bills',
  },
  {
    id: 'payment_collection',
    type: 'radio',
    num: '09',
    question: 'How do you usually collect payment for night guards?',
    options: OPTS.PAYMENT,
    dataKey: 'payment_collection',
  },
  {
    id: 'wants_billing_guidance',
    type: 'radio',
    num: '10',
    question: 'Do you want ByteSense to provide pricing and billing guidance?',
    options: OPTS.GUIDANCE,
    dataKey: 'wants_billing_guidance',
  },
  {
    id: 'who_submits_cases',
    type: 'radio',
    num: '11',
    question: 'Who will be responsible for submitting ByteSense cases?',
    options: OPTS.SUBMITTER,
    dataKey: 'who_submits_cases',
  },
  {
    id: 'add_staff_to_training',
    type: 'radio',
    num: '12',
    question: 'Do you want to add other staff members to this training?',
    options: OPTS.STAFF_TRAINING,
    dataKey: 'add_staff_to_training',
  },
  {
    id: 'has_patient_in_mind',
    type: 'radio',
    num: '13',
    question: 'Do you already have a patient in mind for your first ByteSense case?',
    options: OPTS.PATIENT,
    dataKey: 'has_patient_in_mind',
  },
  {
    id: 'ideal_patient_profile',
    type: 'multiselect',
    num: '14',
    question: 'What does your ideal first patient look like?',
    description: 'Select all that apply.',
    options: OPTS.PROFILE,
    dataKey: 'ideal_patient_profile',
  },
  {
    id: 'first_case_timeline',
    type: 'radio',
    num: '15',
    question: 'When do you expect to start your first ByteSense case?',
    options: OPTS.TIMELINE,
    dataKey: 'first_case_timeline',
  },
  {
    id: 'main_blocker',
    type: 'radio',
    num: '16',
    question: 'What would stop your office from starting the first case?',
    options: OPTS.BLOCKER,
    dataKey: 'main_blocker',
  },
  {
    id: 'complete',
    type: 'complete',
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  clerkUserId: string | null;
  onDone: (staffRoles: string[]) => void;
}

export default function TypeformIntake({ clerkUserId, onDone }: Props) {
  const { data, update, complete } = useIntakeState(clerkUserId);
  const isMobile = useIsMobile();

  // Visible question index (into QUESTIONS array, after filtering showIf)
  const [qIdx, setQIdx] = useState(0);
  const [animStyle, setAnimStyle] = useState<React.CSSProperties>({ opacity: 1, transform: 'translateY(0px)' });
  const [saving, setSaving] = useState(false);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Visible questions filtered by showIf
  const visibleQs = QUESTIONS.filter(q => !q.showIf || q.showIf(data));
  const current = visibleQs[qIdx];
  const totalQ = visibleQs.length - 2; // exclude welcome + complete
  const visibleNum = qIdx - 1; // 0-based question number (excl welcome)
  const progress = qIdx === 0 ? 0 : Math.min(100, Math.round((visibleNum / totalQ) * 100));

  // ── animation helpers ──────────────────────────────────────────────────────
  const transition = useCallback(async (dir: 'forward' | 'backward', fn: () => void) => {
    const exitY = dir === 'forward' ? '-50px' : '50px';
    const enterY = dir === 'forward' ? '50px' : '-50px';

    setAnimStyle({ opacity: 0, transform: `translateY(${exitY})`, transition: 'opacity 0.22s ease, transform 0.22s ease' });
    await new Promise(r => setTimeout(r, 230));
    fn();
    setAnimStyle({ opacity: 0, transform: `translateY(${enterY})`, transition: 'none' });
    await new Promise(r => setTimeout(r, 16));
    setAnimStyle({ opacity: 1, transform: 'translateY(0px)', transition: 'opacity 0.28s ease, transform 0.28s ease' });
  }, []);

  const goNext = useCallback(() => {
    if (qIdx >= visibleQs.length - 1) return;
    transition('forward', () => setQIdx(i => i + 1));
  }, [qIdx, visibleQs.length, transition]);

  const goBack = useCallback(() => {
    if (qIdx === 0) return;
    transition('backward', () => setQIdx(i => i - 1));
  }, [qIdx, transition]);

  // ── auto-advance for radio ─────────────────────────────────────────────────
  const selectRadio = useCallback((q: QuestionDef, value: string) => {
    if (!q.dataKey) return;
    update({ [q.dataKey]: value } as Partial<IntakeData>);
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    autoAdvanceTimer.current = setTimeout(() => goNext(), 500);
  }, [update, goNext]);

  // ── keyboard handler ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      if (e.key === 'Enter') { e.preventDefault(); handleOK(); return; }
      if (e.key === 'Backspace') { e.preventDefault(); goBack(); return; }

      if (!current?.options) return;
      const letterIdx = e.key.toLowerCase().charCodeAt(0) - 97; // a=0, b=1 …
      const numIdx = parseInt(e.key, 10) - 1;                   // 1=0, 2=1 …
      const idx = letterIdx >= 0 && letterIdx < 26 ? letterIdx : numIdx;
      if (idx >= 0 && idx < current.options.length) {
        const opt = current.options[idx];
        if (current.type === 'radio') {
          selectRadio(current, opt.value);
        } else if (current.type === 'multiselect' && current.dataKey) {
          const arr = (data[current.dataKey] as string[]) || [];
          update({ [current.dataKey]: arr.includes(opt.value) ? arr.filter(v => v !== opt.value) : [...arr, opt.value] } as Partial<IntakeData>);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [current, data, goBack, selectRadio, update]);

  // Focus first input on fields questions
  useEffect(() => {
    if (current?.type === 'fields') {
      setTimeout(() => inputRefs.current[0]?.focus(), 350);
    }
  }, [qIdx, current?.type]);

  // ── canAdvance logic ───────────────────────────────────────────────────────
  const canAdvance = useCallback(() => {
    if (!current) return false;
    if (current.type === 'welcome' || current.type === 'complete') return true;
    if (current.type === 'radio' && current.dataKey) {
      return !!(data[current.dataKey] as string);
    }
    if (current.type === 'multiselect' && current.dataKey) {
      return ((data[current.dataKey] as string[]) || []).length > 0;
    }
    if (current.type === 'fields') {
      // Only check required fields
      return (current.fields || []).filter(f => f.required).every(f => !!(data[f.id] as string)?.trim());
    }
    return true;
  }, [current, data]);

  const handleOK = useCallback(() => {
    if (!canAdvance()) return;
    if (current?.type === 'complete') return;
    goNext();
  }, [canAdvance, current, goNext]);

  // ── complete handler ───────────────────────────────────────────────────────
  const handleComplete = useCallback(async () => {
    setSaving(true);
    await complete();
    setSaving(false);
    onDone(data.staff_roles);
  }, [complete, data.staff_roles, onDone]);

  if (!current) return null;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      fontFamily: C.fn, background: '#0A0A0C', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
    }}>
      {/* Progress bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.06)', zIndex: 10 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: C.teal, transition: 'width 0.5s ease', borderRadius: '0 2px 2px 0' }} />
      </div>

      {/* Back button */}
      {qIdx > 0 && current.type !== 'complete' && (
        <button onClick={goBack} style={{
          position: 'fixed', top: 18, left: isMobile ? 16 : 24, zIndex: 10,
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
          fontSize: 13, cursor: 'pointer', fontFamily: C.fn,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 0',
        }}>
          ↑ Back
        </button>
      )}

      {/* Logo */}
      {current.type === 'welcome' && (
        <div style={{ position: 'fixed', top: 16, left: isMobile ? 16 : 28, zIndex: 10 }}>
          <Logo size={22} light />
        </div>
      )}

      {/* Main content */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? '80px 20px 100px' : '80px 24px 100px',
      }}>
        <div style={{ ...animStyle, width: '100%', maxWidth: 640 }}>
          <QuestionRenderer
            q={current}
            data={data}
            update={update}
            onRadioSelect={selectRadio}
            onOK={handleOK}
            onComplete={handleComplete}
            canAdvance={canAdvance()}
            saving={saving}
            isMobile={isMobile}
            inputRefs={inputRefs}
          />
        </div>
      </div>

      {/* Bottom bar — OK button + Enter hint (not on welcome/complete) */}
      {current.type !== 'welcome' && current.type !== 'complete' && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10,
          padding: isMobile ? '14px 20px 20px' : '16px 32px 24px',
          background: 'linear-gradient(to top, #0A0A0C 60%, transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12,
        }}>
          {current.type !== 'radio' && (
            <button
              onClick={handleOK}
              disabled={!canAdvance()}
              style={{
                background: canAdvance() ? C.teal : 'rgba(255,255,255,0.08)',
                color: canAdvance() ? C.white : 'rgba(255,255,255,0.25)',
                border: 'none', borderRadius: 6,
                padding: isMobile ? '11px 20px' : '12px 22px',
                fontSize: 14, fontWeight: 700, fontFamily: C.fn,
                cursor: canAdvance() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'background 0.2s',
              }}
            >
              OK <span style={{ fontSize: 16 }}>✓</span>
            </button>
          )}
          {!isMobile && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: 0.5 }}>
              press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 3, fontFamily: 'monospace' }}>Enter</kbd>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Question renderer ────────────────────────────────────────────────────────

interface QProps {
  q: QuestionDef;
  data: IntakeData;
  update: (d: Partial<IntakeData>) => void;
  onRadioSelect: (q: QuestionDef, value: string) => void;
  onOK: () => void;
  onComplete: () => Promise<void>;
  canAdvance: boolean;
  saving: boolean;
  isMobile: boolean;
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
}

function QuestionRenderer({ q, data, update, onRadioSelect, onOK, onComplete, canAdvance, saving, isMobile, inputRefs }: QProps) {
  switch (q.type) {
    case 'welcome':   return <WelcomeScreen onStart={onOK} isMobile={isMobile} />;
    case 'complete':  return <CompleteScreen onComplete={onComplete} saving={saving} isMobile={isMobile} />;
    case 'radio':     return <RadioScreen q={q} data={data} onSelect={v => onRadioSelect(q, v)} isMobile={isMobile} />;
    case 'multiselect': return <MultiScreen q={q} data={data} update={update} isMobile={isMobile} />;
    case 'fields':    return <FieldsScreen q={q} data={data} update={update} onOK={onOK} inputRefs={inputRefs} isMobile={isMobile} />;
    default: return null;
  }
}

// ─── Screen types ─────────────────────────────────────────────────────────────

function WelcomeScreen({ onStart, isMobile }: { onStart: () => void; isMobile: boolean }) {
  return (
    <div style={{ textAlign: 'center', padding: isMobile ? '0 4px' : '0 20px' }}>
      <Logo size={36} light />
      <h1 style={{ fontSize: isMobile ? 28 : 38, fontWeight: 800, color: C.white, margin: '28px 0 16px', lineHeight: 1.2 }}>
        Get Your Practice Ready<br />for ByteSense
      </h1>
      <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, marginBottom: 20, maxWidth: 460, margin: '0 auto 24px' }}>
        Takes about <strong style={{ color: 'rgba(255,255,255,0.7)' }}>2–3 minutes</strong>. Just answer as you go — we'll configure everything for you.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', marginBottom: 36 }}>
        {['Staff training', 'Scanner & lab setup', 'Case workflow', 'Ongoing support'].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
            <span style={{ color: C.teal, fontSize: 14 }}>✓</span> {item}
          </div>
        ))}
      </div>
      <button onClick={onStart} style={{
        background: C.teal, color: C.white, border: 'none',
        padding: isMobile ? '15px 40px' : '16px 48px',
        fontSize: 15, fontWeight: 700, fontFamily: C.fn,
        cursor: 'pointer', borderRadius: 6, letterSpacing: 0.3,
      }}>
        Start Setup →
      </button>
    </div>
  );
}

function QHeader({ num, question, description, isMobile }: { num?: string; question?: string; description?: string; isMobile: boolean }) {
  return (
    <div style={{ marginBottom: 28 }}>
      {num && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.teal }}>{num}</span>
          <span style={{ color: C.teal, fontSize: 13 }}>→</span>
        </div>
      )}
      <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: C.white, margin: 0, lineHeight: 1.3 }}>
        {question}
      </h2>
      {description && (
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 10, lineHeight: 1.7, marginBottom: 0 }}>
          {description}
        </p>
      )}
    </div>
  );
}

function RadioScreen({ q, data, onSelect, isMobile }: { q: QuestionDef; data: IntakeData; onSelect: (v: string) => void; isMobile: boolean }) {
  const selected = q.dataKey ? (data[q.dataKey] as string) : '';

  return (
    <div>
      <QHeader num={q.num} question={q.question} description={q.description} isMobile={isMobile} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(q.options || []).map(opt => {
          const isSel = selected === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: isMobile ? '13px 16px' : '14px 18px',
                background: isSel ? 'rgba(32,200,185,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${isSel ? C.teal : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s ease', width: '100%',
              }}
            >
              <span style={{
                width: 26, height: 26, borderRadius: 5,
                border: `1.5px solid ${isSel ? C.teal : 'rgba(255,255,255,0.2)'}`,
                background: isSel ? C.teal : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800,
                color: isSel ? C.dark : 'rgba(255,255,255,0.4)',
                flexShrink: 0, transition: 'all 0.15s',
              }}>
                {isSel ? '✓' : opt.key}
              </span>
              <span style={{ fontSize: isMobile ? 14 : 15, color: isSel ? C.white : 'rgba(255,255,255,0.75)', fontWeight: isSel ? 600 : 400 }}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MultiScreen({ q, data, update, isMobile }: { q: QuestionDef; data: IntakeData; update: (d: Partial<IntakeData>) => void; isMobile: boolean }) {
  const values = q.dataKey ? ((data[q.dataKey] as string[]) || []) : [];

  const toggle = (value: string) => {
    if (!q.dataKey) return;
    update({ [q.dataKey]: values.includes(value) ? values.filter(v => v !== value) : [...values, value] } as Partial<IntakeData>);
  };

  return (
    <div>
      <QHeader num={q.num} question={q.question} description={q.description} isMobile={isMobile} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(q.options || []).map(opt => {
          const isSel = values.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: isMobile ? '13px 16px' : '14px 18px',
                background: isSel ? 'rgba(32,200,185,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${isSel ? C.teal : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s ease', width: '100%',
              }}
            >
              <span style={{
                width: 26, height: 26, borderRadius: 5,
                border: `1.5px solid ${isSel ? C.teal : 'rgba(255,255,255,0.2)'}`,
                background: isSel ? C.teal : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800,
                color: isSel ? C.dark : 'rgba(255,255,255,0.4)',
                flexShrink: 0, transition: 'all 0.15s',
              }}>
                {isSel ? '✓' : opt.key}
              </span>
              <span style={{ fontSize: isMobile ? 14 : 15, color: isSel ? C.white : 'rgba(255,255,255,0.75)', fontWeight: isSel ? 600 : 400 }}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FieldsScreen({ q, data, update, onOK, inputRefs, isMobile }: {
  q: QuestionDef; data: IntakeData; update: (d: Partial<IntakeData>) => void;
  onOK: () => void; inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>; isMobile: boolean;
}) {
  const fields = q.fields || [];

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (idx < fields.length - 1) {
        inputRefs.current[idx + 1]?.focus();
      } else {
        onOK();
      }
    }
  };

  return (
    <div>
      <QHeader num={q.num} question={q.question} description={q.description} isMobile={isMobile} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {fields.map((field, i) => (
          <div key={field.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 4, marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
              {field.label}{field.required && <span style={{ color: C.teal, marginLeft: 3 }}>*</span>}
            </label>
            <input
              ref={el => inputRefs.current[i] = el}
              type={field.type || 'text'}
              value={(data[field.id] as string) || ''}
              onChange={e => update({ [field.id]: e.target.value } as Partial<IntakeData>)}
              onKeyDown={e => handleKey(e, i)}
              placeholder={field.placeholder}
              style={{
                width: '100%', background: 'transparent', border: 'none',
                color: C.white, fontSize: isMobile ? 16 : 18, fontFamily: C.fn,
                padding: '6px 0', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function CompleteScreen({ onComplete, saving, isMobile }: { onComplete: () => Promise<void>; saving: boolean; isMobile: boolean }) {
  const [called, setCalled] = useState(false);

  useEffect(() => {
    if (!called) { setCalled(true); onComplete(); }
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: isMobile ? '0 8px' : '0 20px' }}>
      {saving ? (
        <>
          <div style={{ fontSize: 40, marginBottom: 20 }}>⏳</div>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>Saving your setup…</p>
        </>
      ) : (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 11, letterSpacing: 3, color: C.teal, textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>
            Setup Complete
          </div>
          <h2 style={{ fontSize: isMobile ? 24 : 30, fontWeight: 800, color: C.white, marginBottom: 14, lineHeight: 1.3 }}>
            Your practice is configured.
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, maxWidth: 400, margin: '0 auto' }}>
            ByteSense has everything it needs. Now let's get your team trained and ready for the first patient case.
          </p>
        </>
      )}
    </div>
  );
}
