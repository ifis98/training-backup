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
import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useSession } from '@clerk/clerk-react';
import { useIntakeState, IntakeData } from '@/hooks/useIntakeState';
import { C } from '@/data/constants';
import { useIsMobile } from '@/hooks/use-mobile';
import { Logo } from '@/components/ByteSenseLogo';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { FUNCTIONS_URL, FUNCTIONS_KEY } from '@/integrations/supabase/client';

// ─── Country phone codes ──────────────────────────────────────────────────────
const COUNTRIES = [
  { code: '+1',   flag: '🇺🇸', name: 'United States' },
  { code: '+1',   flag: '🇨🇦', name: 'Canada' },
  { code: '+44',  flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: '+64',  flag: '🇳🇿', name: 'New Zealand' },
  { code: '+91',  flag: '🇮🇳', name: 'India' },
  { code: '+86',  flag: '🇨🇳', name: 'China' },
  { code: '+81',  flag: '🇯🇵', name: 'Japan' },
  { code: '+82',  flag: '🇰🇷', name: 'South Korea' },
  { code: '+65',  flag: '🇸🇬', name: 'Singapore' },
  { code: '+63',  flag: '🇵🇭', name: 'Philippines' },
  { code: '+60',  flag: '🇲🇾', name: 'Malaysia' },
  { code: '+66',  flag: '🇹🇭', name: 'Thailand' },
  { code: '+62',  flag: '🇮🇩', name: 'Indonesia' },
  { code: '+84',  flag: '🇻🇳', name: 'Vietnam' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+973', flag: '🇧🇭', name: 'Bahrain' },
  { code: '+968', flag: '🇴🇲', name: 'Oman' },
  { code: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: '+33',  flag: '🇫🇷', name: 'France' },
  { code: '+34',  flag: '🇪🇸', name: 'Spain' },
  { code: '+39',  flag: '🇮🇹', name: 'Italy' },
  { code: '+31',  flag: '🇳🇱', name: 'Netherlands' },
  { code: '+46',  flag: '🇸🇪', name: 'Sweden' },
  { code: '+47',  flag: '🇳🇴', name: 'Norway' },
  { code: '+45',  flag: '🇩🇰', name: 'Denmark' },
  { code: '+358', flag: '🇫🇮', name: 'Finland' },
  { code: '+41',  flag: '🇨🇭', name: 'Switzerland' },
  { code: '+43',  flag: '🇦🇹', name: 'Austria' },
  { code: '+32',  flag: '🇧🇪', name: 'Belgium' },
  { code: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: '+48',  flag: '🇵🇱', name: 'Poland' },
  { code: '+55',  flag: '🇧🇷', name: 'Brazil' },
  { code: '+52',  flag: '🇲🇽', name: 'Mexico' },
  { code: '+54',  flag: '🇦🇷', name: 'Argentina' },
  { code: '+57',  flag: '🇨🇴', name: 'Colombia' },
  { code: '+56',  flag: '🇨🇱', name: 'Chile' },
  { code: '+27',  flag: '🇿🇦', name: 'South Africa' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
];

function parsePhone(v: string) {
  if (!v) return { country: COUNTRIES[0], number: '' };
  const sorted = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);
  const match = sorted.find(c => v.startsWith(c.code));
  if (match) return { country: match, number: v.slice(match.code.length).replace(/^\s+/, '') };
  return { country: COUNTRIES[0], number: v };
}

function PhoneInput({ value, onChange, placeholder, fontSize, fontFamily }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; fontSize?: number; fontFamily?: string;
}) {
  const init = useMemo(() => parsePhone(value), []);
  const [country, setCountry] = useState(init.country);
  const [number, setNumber] = useState(init.number);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const fs = fontSize || 16;
  const ff = fontFamily || C.fn;

  const filtered = useMemo(() =>
    COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search)
    ), [search]);

  const selectCountry = (c: typeof COUNTRIES[0]) => {
    setCountry(c); setOpen(false); setSearch('');
    onChange(c.code + (number ? ' ' + number : ''));
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Country picker button */}
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ background: 'var(--bs-card)', border: '1px solid var(--bs-border)', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: 'var(--bs-text)', fontSize: fs - 2, fontFamily: ff, flexShrink: 0 }}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>{country.flag}</span>
        <span>{country.code}</span>
        <span style={{ opacity: 0.4, fontSize: 10 }}>▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 200, width: 270, maxHeight: 300, display: 'flex', flexDirection: 'column', background: 'var(--bs-bg2)', border: '1px solid var(--bs-border)', borderRadius: 10, boxShadow: "none", overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--bs-border)' }}>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search country..."
              style={{ width: '100%', background: 'var(--bs-card)', border: '1px solid var(--bs-border)', borderRadius: 6, padding: '6px 10px', color: 'var(--bs-text)', fontSize: 13, fontFamily: ff, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.map((c, i) => {
              const isActive = c.code === country.code && c.flag === country.flag;
              return (
                <div key={c.name} onClick={() => selectCountry(c)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer', background: isActive ? 'rgba(20,184,166,0.1)' : 'transparent', color: isActive ? C.teal : 'var(--bs-text2)', fontSize: 13, fontFamily: ff, borderBottom: i < filtered.length - 1 ? '1px solid var(--bs-border)' : 'none' }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'var(--bs-card)'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
                  <span style={{ fontSize: 18 }}>{c.flag}</span>
                  <span style={{ flex: 1 }}>{c.name}</span>
                  <span style={{ fontSize: 11, opacity: 0.45 }}>{c.code}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Number input */}
      <input type="tel" value={number}
        onChange={e => { setNumber(e.target.value); onChange(country.code + (e.target.value ? ' ' + e.target.value : '')); }}
        placeholder={placeholder || '000-000-0000'}
        style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--bs-text)', fontSize: fs, fontFamily: ff, padding: '6px 0', outline: 'none' }} />
    </div>
  );
}

// ─── Question definitions ─────────────────────────────────────────────────────

type QType = 'welcome' | 'radio' | 'multiselect' | 'fields' | 'complete' | 'submit';

interface Option { key: string; label: string; value: string }
interface Field  { id: keyof IntakeData; label: string; placeholder?: string; type?: string; required?: boolean; hint?: string }

interface QuestionDef {
  id: string;
  type: QType;
  num?: string;
  question?: string;
  description?: string;
  options?: Option[];
  fields?: Field[];
  dataKey?: keyof IntakeData;
  showIf?: (d: IntakeData) => boolean;
  autoAdvance?: boolean;
  onSubmit?: (d: IntakeData) => Promise<{ success: boolean; error?: string }>;
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
    { key: 'E', label: 'Office Manager', value: 'om' },
    { key: 'F', label: 'Dental Assistant', value: 'assistant' },
    { key: 'G', label: 'Front Desk', value: 'frontdesk' },
  ],
  PROFILE: [
    { key: 'A', label: 'Existing bruxism patient', value: 'existing_bruxism' },
    { key: 'B', label: 'Patient with visible wear', value: 'visible_wear' },
    { key: 'C', label: 'Patient already considering a night guard', value: 'considering_guard' },
    { key: 'D', label: 'Patient interested in health / sleep data', value: 'health_sleep' },
    { key: 'E', label: 'Premium or fee-for-service patient', value: 'premium_ffs' },
    { key: 'F', label: 'Not sure', value: 'not_sure' },
  ],
  TERMS: [
    { key: 'A', label: 'Yes, I agree', value: 'yes' },
    { key: 'B', label: 'No', value: 'no' },
  ],
  NOTIFY_METHOD: [
    { key: 'A', label: 'Email', value: 'email' },
    { key: 'B', label: 'SMS / Phone', value: 'sms' },
    { key: 'C', label: 'Both', value: 'both' },
  ],
  ORDERS: [
    { key: 'A', label: '1 – 5 per month', value: '1-5' },
    { key: 'B', label: '6 – 10 per month', value: '6-10' },
    { key: 'C', label: '11 – 20 per month', value: '11-20' },
    { key: 'D', label: '20 + per month', value: '20+' },
    { key: 'E', label: 'Not sure yet', value: 'not_sure' },
  ],
};

const QUESTIONS: QuestionDef[] = [
  {
    id: 'welcome',
    type: 'welcome',
  },
  {
    id: 'contact-basic',
    type: 'fields',
    num: 'P1',
    question: "Let's set up your byteSense portal account — starting with your basic info.",
    fields: [
      { id: 'fName', label: 'First Name', type: 'text', required: true, placeholder: 'John' },
      { id: 'lName', label: 'Last Name', type: 'text', required: true, placeholder: 'Smith' },
      { id: 'preferredPhoneNumber', label: 'Phone Number', type: 'tel', required: true },
    ],
  },
  {
    id: 'contact-practice',
    type: 'fields',
    num: 'P2',
    question: 'What is your practice or company information?',
    fields: [
      { id: 'companyName', label: 'Practice / Company Name', type: 'text', required: true, placeholder: 'e.g. Smile Dental Studio' },
      { id: 'officeEmail', label: 'Office Email', type: 'email', required: true, placeholder: 'office@practice.com' },
    ],
  },
  {
    id: 'primary-contact',
    type: 'fields',
    num: 'P3',
    question: 'Who is the primary contact for your account?',
    description: 'We\u2019ll use this info for order confirmations and account updates.',
    fields: [
      { id: 'primaryContactName', label: 'Full Name', type: 'text', required: true, placeholder: 'Jane Smith' },
      { id: 'primaryContactRole', label: 'Role / Title', type: 'text', placeholder: 'e.g. Office Manager' },
      { id: 'primaryContactPhoneNumber', label: 'Direct Phone', type: 'tel', placeholder: '(555) 000-0000' },
    ],
  },
  {
    id: 'shipping-address',
    type: 'fields',
    num: 'P4',
    question: 'What is your shipping address?',
    description: 'Where should we send ByteSense supplies and hardware?',
    fields: [
      { id: 'addressLine1', label: 'Street Address', type: 'text', required: true, placeholder: '123 Main St, Suite 100' },
      { id: 'city', label: 'City', type: 'text', required: true, placeholder: 'Los Angeles' },
      { id: 'state', label: 'State / Province', type: 'text', required: true, placeholder: 'CA' },
      { id: 'zipCode', label: 'ZIP / Postal Code', type: 'text', required: true, placeholder: '90001' },
    ],
  },
  {
    id: 'shipping-delivery',
    type: 'fields',
    num: 'P5',
    question: 'Delivery preferences',
    description: 'Tell us who receives shipments and how you prefer to be contacted.',
    fields: [
      { id: 'attentionRecipientName', label: 'Attention / Recipient Name', type: 'text', required: true, placeholder: 'Jane Smith or Office Manager' },
    ],
  },
  {
    id: 'shipping-notify',
    type: 'radio',
    num: 'P5b',
    question: 'How should we notify you about shipments?',
    options: OPTS.NOTIFY_METHOD,
    dataKey: 'preferredNotificationMethod',
  },
  {
    id: 'contact-preferences',
    type: 'fields',
    num: 'P5c',
    question: 'Preferred contact methods',
    description: 'Check all that apply.',
    fields: [
      { id: 'preferredContactMethodPhone', label: 'Phone', type: 'checkbox' },
      { id: 'preferredContactMethodEmail', label: 'Email', type: 'checkbox' },
    ],
  },
  {
    id: 'operational',
    type: 'fields',
    num: 'P6',
    question: 'Operational details',
    description: 'Help us understand your practice volume and credentials.',
    fields: [
      { id: 'dentalLicenseNumber', label: 'Dental License Number', type: 'text', placeholder: 'e.g. CA-12345' },
    ],
  },
  {
    id: 'operational-orders',
    type: 'radio',
    num: 'P6b',
    question: 'How many night guard orders do you estimate per month?',
    options: OPTS.ORDERS,
    dataKey: 'estimatedOrdersPerMonth',
  },
  {
    id: 'legal-terms',
    type: 'radio',
    num: 'P7',
    question: 'Do you agree to the byteSense Terms of Service and Privacy Policy?',
    description: 'You must agree to continue.',
    options: OPTS.TERMS,
  },
  {
    id: 'sso-password',
    type: 'fields',
    num: 'P8',
    question: 'Set a password for the byteSense portal (app.bytesense.ai)',
    description: 'You signed in with Google. Set a password so you can also log in directly.',
    showIf: () => !!(window as any).__isOAuthUser,
    fields: [
      { id: 'webappPassword', label: 'Portal Password', type: 'password', required: false,
        hint: 'Minimum 4 characters. Skip if you don\u2019t want to set one now.', placeholder: '••••••••' },
    ],
  },
  {
    id: 'review-submit',
    type: 'submit',
    num: 'P9',
    question: 'Review your portal account details',
    description: 'Take a look before we create your account and set up your training.',
  },
  {
    id: 'practice_info',
    type: 'fields',
    num: '00',
    question: 'What\'s your practice called?',
    description: 'This personalizes your entire training experience.',
    fields: [
      { id: 'practice_name', label: 'Practice Name', placeholder: 'e.g. Smile Dental Studio', required: true },
    ],
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
    description: 'A different person to reach when your primary advocate is unavailable. (Optional — skip if not applicable)',
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
  onDone: (staffRoles: string[], intakeData: IntakeData) => void;
  prefilledPracticeName?: string;
}

export default function TypeformIntake({ clerkUserId, onDone, prefilledPracticeName }: Props) {
  const { data, update, complete } = useIntakeState(clerkUserId);
  const { session } = useSession();
  const isMobile = useIsMobile();

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Pre-fill practice name from invite code if the field is still empty
  useEffect(() => {
    if (prefilledPracticeName && !data.practice_name) {
      update({ practice_name: prefilledPracticeName });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledPracticeName]);

  // ── submit handler for the review-submit step ───────────────────────────────
  const handleSubmit = useCallback(async (intakeData: IntakeData) => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const sessionToken = await session?.getToken();

      const resp = await fetch(
        `${FUNCTIONS_URL}/functions/v1/create-webapp-account`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${FUNCTIONS_KEY}`,
            'X-Clerk-Token': sessionToken ?? '',
          },
          body: JSON.stringify({
            fName: intakeData.fName,
            lName: intakeData.lName,
            preferredPhoneNumber: intakeData.preferredPhoneNumber,
            companyName: intakeData.companyName,
            officeEmail: intakeData.officeEmail,
            primaryContactName: intakeData.primaryContactName,
            primaryContactRole: intakeData.primaryContactRole,
            primaryContactPhoneNumber: intakeData.primaryContactPhoneNumber,
            preferredContactMethodPhone: intakeData.preferredContactMethodPhone,
            preferredContactMethodEmail: intakeData.preferredContactMethodEmail,
            addressLine1: intakeData.addressLine1,
            city: intakeData.city,
            state: intakeData.state,
            zipCode: intakeData.zipCode,
            attentionRecipientName: intakeData.attentionRecipientName,
            preferredNotificationMethod: intakeData.preferredNotificationMethod,
            estimatedOrdersPerMonth: intakeData.estimatedOrdersPerMonth,
            dentalLicenseNumber: intakeData.dentalLicenseNumber,
            webappPassword: intakeData.webappPassword || undefined,
          }),
        }
      );

      if (!resp.ok && resp.status !== 201) {
        const err = await resp.json().catch(() => ({ error: 'Account creation failed' }));
        throw new Error(err.error || 'Account creation failed');
      }

      return { success: true as const };
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
      return { success: false as const, error: err.message };
    } finally {
      setSubmitting(false);
    }
  }, [session]);

  // Visible question index (into QUESTIONS array, after filtering showIf)
  const [qIdx, setQIdx] = useState(0);
  const [animStyle, setAnimStyle] = useState<React.CSSProperties>({ opacity: 1, transform: 'translateY(0px)' });
  const [saving, setSaving] = useState(false);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Keyboard-navigation cursor for radio / multiselect option lists. Up/Down
  // moves this index (visual only); Enter confirms the highlighted option.
  // Ref shadows state so the keyboard handler reads the latest value without
  // having to depend on highlightedIdx in its useEffect (which would re-bind
  // the listener on every arrow keystroke).
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const highlightedIdxRef = useRef(-1);
  useEffect(() => { highlightedIdxRef.current = highlightedIdx; }, [highlightedIdx]);

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
    if (q.id === 'legal-terms') {
      update({ termsAccepted: value === 'yes' });
      if (value === 'yes') {
        if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
        autoAdvanceTimer.current = setTimeout(() => goNext(), 500);
      }
      return;
    }
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

      // ArrowUp/Down: move the highlighted option (highlight only, no select)
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && current?.options?.length) {
        e.preventDefault();
        const len = current.options.length;
        setHighlightedIdx(i => {
          if (i < 0) return 0;
          return e.key === 'ArrowDown' ? (i + 1) % len : (i - 1 + len) % len;
        });
        return;
      }

      // Enter: confirm the highlighted option (or advance if nothing highlighted)
      if (e.key === 'Enter') {
        e.preventDefault();
        if (current?.options?.length && highlightedIdxRef.current >= 0 && highlightedIdxRef.current < current.options.length) {
          const opt = current.options[highlightedIdxRef.current];
          if (current.type === 'radio') {
            selectRadio(current, opt.value);
            return;
          }
          if (current.type === 'multiselect' && current.dataKey) {
            const arr = (data[current.dataKey] as string[]) || [];
            update({ [current.dataKey]: arr.includes(opt.value) ? arr.filter(v => v !== opt.value) : [...arr, opt.value] } as Partial<IntakeData>);
            return;
          }
        }
        handleOK();
        return;
      }

      if (e.key === 'Backspace') { e.preventDefault(); goBack(); return; }

      if (!current?.options) return;

      // Only treat single-character keys as hotkeys. Excludes ArrowUp/Down,
      // Tab, Shift, Backspace, Enter, etc. — all of which had been mapped to
      // option indices by the previous `e.key.toLowerCase().charCodeAt(0)`
      // hack (ArrowDown→'a'→idx 0, Tab→'t'→idx 19, …).
      if (e.key.length !== 1) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const ch = e.key.toLowerCase();
      const letterIdx = ch >= 'a' && ch <= 'z' ? ch.charCodeAt(0) - 97 : -1;
      const numIdx    = ch >= '1' && ch <= '9' ? Number(ch) - 1          : -1;
      const idx = letterIdx >= 0 ? letterIdx : numIdx;
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
    // Note: handleOK is intentionally accessed via a ref (below) so this
    // listener doesn't need to be rebound on every render — and so we
    // don't run into a temporal-dead-zone error from listing handleOK in
    // the deps array before it's declared.
  }, [current, data, goBack, selectRadio, update]);

  // Focus first input on fields questions
  useEffect(() => {
    if (current?.type === 'fields') {
      setTimeout(() => inputRefs.current[0]?.focus(), 350);
    }
  }, [qIdx, current?.type]);

  // Reset keyboard highlight when the question changes.
  useEffect(() => { setHighlightedIdx(-1); }, [qIdx]);

  // ── canAdvance logic ───────────────────────────────────────────────────────
  const canAdvance = useCallback(() => {
    if (!current) return false;
    if (current.type === 'welcome' || current.type === 'complete' || current.type === 'submit') return true;
    if (current.type === 'radio' && current.dataKey) {
      return !!(data[current.dataKey] as string);
    }
    // legal-terms radio step — must accept
    if (current.type === 'radio' && current.id === 'legal-terms') {
      return data.termsAccepted === true;
    }
    if (current.type === 'multiselect' && current.dataKey) {
      return ((data[current.dataKey] as string[]) || []).length > 0;
    }
    if (current.type === 'fields') {
      const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return (current.fields || []).filter(f => f.required).every(f => {
        if (f.type === 'checkbox') return true;
        const val = (data[f.id] as string)?.trim();
        if (!val) return false;
        if (f.type === 'email') return EMAIL_RE.test(val);
        return true;
      });
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
    onDone(data.staff_roles, data);
  }, [complete, data, onDone]);

  if (!current) return null;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      fontFamily: C.fn, background: 'var(--bs-bg)', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
    }}>
      {/* Progress bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'var(--bs-bg2)', zIndex: 10 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: C.teal, transition: 'width 0.5s ease', borderRadius: '0 2px 2px 0' }} />
      </div>

      {/* Back button */}
      {qIdx > 0 && current.type !== 'complete' && (
        <button onClick={goBack} style={{
          position: 'fixed', top: 18, left: isMobile ? 16 : 24, zIndex: 10,
          background: 'none', border: 'none', color: 'var(--bs-ash)',
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
            onSubmit={handleSubmit}
            canAdvance={canAdvance()}
            saving={saving}
            submitting={submitting}
            submitError={submitError}
            isMobile={isMobile}
            inputRefs={inputRefs}
            highlightedIdx={highlightedIdx}
          />
        </div>
      </div>

      {/* Bottom bar — OK button + Enter hint (not on welcome/complete) */}
      {current.type !== 'welcome' && current.type !== 'complete' && current.type !== 'submit' && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10,
          padding: isMobile ? '14px 20px 20px' : '16px 32px 24px',
          background: 'linear-gradient(to top, var(--bs-bg) 60%, transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12,
        }}>
          {current.type !== 'radio' && (
            <button
              onClick={handleOK}
              disabled={!canAdvance()}
              style={{
                background: canAdvance() ? C.teal : 'var(--bs-card)',
                color: canAdvance() ? C.white : 'var(--bs-ash)',
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
            <span style={{ fontSize: 11, color: 'var(--bs-ash)', letterSpacing: 0.5 }}>
              press <kbd style={{ background: 'var(--bs-card)', padding: '2px 6px', borderRadius: 3, fontFamily: 'monospace' }}>Enter</kbd>
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
  onSubmit: (d: IntakeData) => Promise<{ success: boolean; error?: string }>;
  canAdvance: boolean;
  saving: boolean;
  submitting: boolean;
  submitError: string | null;
  isMobile: boolean;
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  highlightedIdx: number;
}

function QuestionRenderer({ q, data, update, onRadioSelect, onOK, onComplete, onSubmit, canAdvance, saving, submitting, submitError, isMobile, inputRefs, highlightedIdx }: QProps) {
  switch (q.type) {
    case 'welcome':   return <WelcomeScreen onStart={onOK} isMobile={isMobile} />;
    case 'complete':  return <CompleteScreen onComplete={onComplete} saving={saving} isMobile={isMobile} />;
    case 'radio':     return <RadioScreen q={q} data={data} onSelect={v => onRadioSelect(q, v)} isMobile={isMobile} highlightedIdx={highlightedIdx} />;
    case 'multiselect': return <MultiScreen q={q} data={data} update={update} isMobile={isMobile} highlightedIdx={highlightedIdx} />;
    case 'fields':    return <FieldsScreen q={q} data={data} update={update} onOK={onOK} inputRefs={inputRefs} isMobile={isMobile} />;
    case 'submit':    return <SubmitScreen q={q} data={data} onSubmit={onSubmit} onOK={onOK} submitting={submitting} submitError={submitError} isMobile={isMobile} />;
    default: return null;
  }
}

// ─── Screen types ─────────────────────────────────────────────────────────────

function WelcomeScreen({ onStart, isMobile }: { onStart: () => void; isMobile: boolean }) {
  return (
    <div style={{ textAlign: 'center', padding: isMobile ? '0 4px' : '0 20px' }}>
      <Logo size={36} light />
      <h1 style={{ fontSize: isMobile ? 28 : 38, fontWeight: 800, color: 'var(--bs-text)', margin: '28px 0 16px', lineHeight: 1.2 }}>
        Get Your Practice Ready<br />for ByteSense
      </h1>
      <p style={{ fontSize: 16, color: 'var(--bs-ash)', lineHeight: 1.8, marginBottom: 20, maxWidth: 460, margin: '0 auto 24px' }}>
        Takes about <strong style={{ color: 'var(--bs-text)' }}>2–3 minutes</strong>. Just answer as you go — we'll configure everything for you.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', marginBottom: 36 }}>
        {['Staff training', 'Scanner & lab setup', 'Case workflow', 'Ongoing support'].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--bs-ash)' }}>
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
      <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: 'var(--bs-text)', margin: 0, lineHeight: 1.3 }}>
        {question}
      </h2>
      {description && (
        <p style={{ fontSize: 14, color: 'var(--bs-ash)', marginTop: 10, lineHeight: 1.7, marginBottom: 0 }}>
          {description}
        </p>
      )}
    </div>
  );
}

function RadioScreen({ q, data, onSelect, isMobile, highlightedIdx }: { q: QuestionDef; data: IntakeData; onSelect: (v: string) => void; isMobile: boolean; highlightedIdx: number }) {
  const selected = q.id === 'legal-terms'
    ? (data.termsAccepted ? 'yes' : '')
    : q.dataKey ? (data[q.dataKey] as string) : '';

  return (
    <div>
      <QHeader num={q.num} question={q.question} description={q.description} isMobile={isMobile} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(q.options || []).map((opt, i) => {
          const isSel = selected === opt.value;
          const isHl = highlightedIdx === i;
          return (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: isMobile ? '13px 16px' : '14px 18px',
                background: isSel ? 'rgba(32,200,185,0.12)' : 'var(--bs-card)',
                border: `1.5px solid ${isSel ? C.teal : isHl ? 'var(--bs-ash)' : 'var(--bs-border)'}`,
                borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s ease', width: '100%',
                outline: isHl && !isSel ? '2px solid var(--bs-ash)' : 'none',
                outlineOffset: isHl && !isSel ? 2 : 0,
              }}
            >
              <span style={{
                width: 26, height: 26, borderRadius: 5,
                border: `1.5px solid ${isSel ? C.teal : 'var(--bs-border)'}`,
                background: isSel ? C.teal : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800,
                color: isSel ? '#fff' : 'var(--bs-ash)',
                flexShrink: 0, transition: 'all 0.15s',
              }}>
                {isSel ? '✓' : opt.key}
              </span>
              <span style={{ fontSize: isMobile ? 14 : 15, color: isSel ? 'var(--bs-text)' : 'var(--bs-ash)', fontWeight: isSel ? 600 : 400 }}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MultiScreen({ q, data, update, isMobile, highlightedIdx }: { q: QuestionDef; data: IntakeData; update: (d: Partial<IntakeData>) => void; isMobile: boolean; highlightedIdx: number }) {
  const values = q.dataKey ? ((data[q.dataKey] as string[]) || []) : [];

  const toggle = (value: string) => {
    if (!q.dataKey) return;
    update({ [q.dataKey]: values.includes(value) ? values.filter(v => v !== value) : [...values, value] } as Partial<IntakeData>);
  };

  return (
    <div>
      <QHeader num={q.num} question={q.question} description={q.description} isMobile={isMobile} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(q.options || []).map((opt, i) => {
          const isSel = values.includes(opt.value);
          const isHl = highlightedIdx === i;
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: isMobile ? '13px 16px' : '14px 18px',
                background: isSel ? 'rgba(32,200,185,0.12)' : 'var(--bs-card)',
                border: `1.5px solid ${isSel ? C.teal : isHl ? 'var(--bs-ash)' : 'var(--bs-border)'}`,
                borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s ease', width: '100%',
                outline: isHl ? '2px solid var(--bs-ash)' : 'none',
                outlineOffset: isHl ? 2 : 0,
              }}
            >
              <span style={{
                width: 26, height: 26, borderRadius: 5,
                border: `1.5px solid ${isSel ? C.teal : 'var(--bs-border)'}`,
                background: isSel ? C.teal : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800,
                color: isSel ? '#fff' : 'var(--bs-ash)',
                flexShrink: 0, transition: 'all 0.15s',
              }}>
                {isSel ? '✓' : opt.key}
              </span>
              <span style={{ fontSize: isMobile ? 14 : 15, color: isSel ? 'var(--bs-text)' : 'var(--bs-ash)', fontWeight: isSel ? 600 : 400 }}>
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
        {fields.map((field, i) => {
          if (field.type === 'checkbox') {
            const checked = !!(data[field.id] as unknown as boolean);
            return (
              <div key={field.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--bs-border)', marginBottom: 16 }}>
                <button
                  type="button"
                  onClick={() => update({ [field.id]: !checked } as Partial<IntakeData>)}
                  style={{
                    width: 22, height: 22, borderRadius: 4,
                    border: `1.5px solid ${checked ? C.teal : 'var(--bs-border)'}`,
                    background: checked ? C.teal : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                    padding: 0,
                  }}
                >
                  {checked && <span style={{ color: '#fff', fontSize: 12, fontWeight: 800 }}>✓</span>}
                </button>
                <span style={{ fontSize: isMobile ? 14 : 16, color: 'var(--bs-text)', fontFamily: C.fn }}>{field.label}</span>
              </div>
            );
          }
          return (
            <div key={field.id} style={{ borderBottom: '1px solid var(--bs-border)', paddingBottom: 4, marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--bs-ash)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                {field.label}{field.required && <span style={{ color: C.teal, marginLeft: 3 }}>*</span>}
              </label>
              {field.type === 'tel' ? (
                <PhoneInput
                  value={(data[field.id] as string) || ''}
                  onChange={v => update({ [field.id]: v } as Partial<IntakeData>)}
                  placeholder={field.placeholder}
                  fontSize={isMobile ? 16 : 18}
                  fontFamily={C.fn}
                />
              ) : (
                <>
                  <input
                    ref={el => inputRefs.current[i] = el}
                    type={field.type || 'text'}
                    value={(data[field.id] as string) || ''}
                    onChange={e => update({ [field.id]: e.target.value } as Partial<IntakeData>)}
                    onKeyDown={e => handleKey(e, i)}
                    placeholder={field.placeholder}
                    style={{
                      width: '100%', background: 'transparent', border: 'none',
                      color: 'var(--bs-text)', fontSize: isMobile ? 16 : 18, fontFamily: C.fn,
                      padding: '6px 0', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                  {field.hint && (
                    <div style={{ fontSize: 11, color: 'var(--bs-ash)', marginTop: 4 }}>{field.hint}</div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SubmitScreen({ q, data, onSubmit, onOK, submitting, submitError, isMobile }: {
  q: QuestionDef; data: IntakeData; onSubmit: (d: IntakeData) => Promise<{ success: boolean; error?: string }>;
  onOK: () => void; submitting: boolean; submitError: string | null; isMobile: boolean;
}) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(submitError);

  useEffect(() => {
    if (submitError) { setStatus('error'); setErrorMsg(submitError); }
  }, [submitError]);

  const handleSubmitClick = async () => {
    setStatus('submitting');
    setErrorMsg(null);
    const result = await onSubmit(data);
    if (result.success) {
      setStatus('success');
      setTimeout(() => onOK(), 800);
    } else {
      setStatus('error');
      setErrorMsg(result.error || 'Something went wrong.');
    }
  };

  const summary = [
    { label: 'Name', value: [data.fName, data.lName].filter(Boolean).join(' ') || '—' },
    { label: 'Practice', value: data.companyName || '—' },
    { label: 'Email', value: data.officeEmail || '—' },
    { label: 'Phone', value: data.preferredPhoneNumber || '—' },
    { label: 'Primary Contact', value: data.primaryContactName || '—' },
    { label: 'Address', value: [data.addressLine1, data.city, data.state, data.zipCode].filter(Boolean).join(', ') || '—' },
  ];

  return (
    <div>
      <QHeader num={q.num} question={q.question} description={q.description} isMobile={isMobile} />

      {/* Summary card */}
      <div style={{
        background: 'var(--bs-card)', border: '1px solid var(--bs-border)', borderRadius: 10,
        padding: isMobile ? '16px 18px' : '20px 24px', marginBottom: 24,
      }}>
        {summary.map((row, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            padding: '8px 0', borderBottom: i < summary.length - 1 ? '1px solid var(--bs-border)' : 'none',
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--bs-ash)', letterSpacing: 1, textTransform: 'uppercase', minWidth: 100 }}>
              {row.label}
            </span>
            <span style={{ fontSize: 14, color: 'var(--bs-text)', textAlign: 'right', wordBreak: 'break-word' }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Error state */}
      {status === 'error' && errorMsg && (
        <div style={{
          background: 'rgba(229,62,62,0.1)', border: '1px solid rgba(229,62,62,0.3)', borderRadius: 8,
          padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <AlertCircle size={18} color={C.red} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: C.red, fontFamily: C.fn }}>{errorMsg}</span>
        </div>
      )}

      {/* Action button */}
      {status === 'success' ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <CheckCircle2 size={40} strokeWidth={1.5} color={C.teal} />
          </div>
          <p style={{ fontSize: 14, color: C.teal, fontFamily: C.fn, fontWeight: 600 }}>Account created! Continuing…</p>
        </div>
      ) : (
        <button
          onClick={handleSubmitClick}
          disabled={submitting || status === 'submitting'}
          style={{
            width: '100%', background: submitting || status === 'submitting' ? 'var(--bs-card)' : C.teal,
            color: submitting || status === 'submitting' ? 'var(--bs-ash)' : C.white,
            border: 'none', borderRadius: 6, padding: isMobile ? '14px 20px' : '15px 24px',
            fontSize: 15, fontWeight: 700, fontFamily: C.fn,
            cursor: submitting || status === 'submitting' ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'background 0.2s',
          }}
        >
          {submitting || status === 'submitting' ? (
            <>
              <Loader2 size={18} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />
              Creating account…
            </>
          ) : status === 'error' ? (
            'Retry — Submit & Create Account'
          ) : (
            'Submit & Create Account'
          )}
        </button>
      )}
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
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <Loader2 size={44} strokeWidth={1.5} color={C.teal} style={{ animation: "spin 1s linear infinite" }} />
          </div>
          <p style={{ fontSize: 16, color: 'var(--bs-ash)' }}>Saving your setup…</p>
        </>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <CheckCircle2 size={56} strokeWidth={1.5} color={C.teal} />
          </div>
          <div style={{ fontSize: 11, letterSpacing: 3, color: C.teal, textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>
            Setup Complete
          </div>
          <h2 style={{ fontSize: isMobile ? 24 : 30, fontWeight: 800, color: 'var(--bs-text)', marginBottom: 14, lineHeight: 1.3 }}>
            Your practice is configured.
          </h2>
          <p style={{ fontSize: 15, color: 'var(--bs-ash)', lineHeight: 1.8, maxWidth: 400, margin: '0 auto' }}>
            ByteSense has everything it needs. Now let's get your team trained and ready for the first patient case.
          </p>
        </>
      )}
    </div>
  );
}
