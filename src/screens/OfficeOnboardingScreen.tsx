import { useState, useRef, useEffect } from 'react';
import { C } from '@/data/constants';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArrowLeft } from 'lucide-react';
import { t, Lang } from '@/data/translations';

// ── Colours (matches OfficeWorkflowScreen) ───────────────────────────────────
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

const cardStyle = (color: 'red' | 'teal' | 'none' = 'none'): React.CSSProperties => ({
  background: color === 'red' ? RED_MUT : color === 'teal' ? TEAL_MUT : CARD,
  border: `1px solid ${color === 'red' ? RED_BDR : color === 'teal' ? TEAL_C + '55' : BORDER2}`,
  padding: '20px 22px',
  marginBottom: 14,
  fontFamily: C.fn,
});

const checkList: React.CSSProperties = { listStyle: 'none', padding: 0, marginTop: 12 };

const checkLi: React.CSSProperties = {
  fontSize: 13, color: DIM, padding: '5px 0',
  display: 'flex', gap: 10, alignItems: 'flex-start',
};

const h3Style: React.CSSProperties = {
  fontSize: 18, fontWeight: 700, margin: '32px 0 16px', color: 'var(--bs-text)', fontFamily: C.fn,
};

function StepBlock({ num, title, body }: { num: number; title: string; body: string }) {
  return (
    <div style={{ display: 'flex', gap: 20, marginBottom: 24, alignItems: 'flex-start' }}>
      <div style={{ width: 38, height: 38, minWidth: 38, background: RED_B, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: 'white', flexShrink: 0 }}>{num}</div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: 'var(--bs-text)', fontFamily: C.fn }}>{title}</div>
        <div style={{ fontSize: 14, color: DIM, lineHeight: 1.7, fontFamily: C.fn }}>{body}</div>
      </div>
    </div>
  );
}

// ── Scanner data ─────────────────────────────────────────────────────────────
const SCANNERS = [
  {
    id: 'itero',
    name: 'iTero Scanner Registration',
    model: 'Element Series (2, 5, 5D, Flex)',
    steps: [
      { title: 'Export STL Files from iTero', body: 'Open your iTero software and locate the patient case. Navigate to the case details and select "Export STL." Choose Export Upper Arch, Lower Arch, and Bite Registration as separate STL files. Save them to a clearly labelled folder (e.g., PatientLastName_ByteSense_Date).' },
      { title: 'Log Into Medit Link Web', body: 'Go to meditlink.com and sign in with your practice credentials. If your practice does not yet have a Medit Link account, contact Natasha Blake at 909-527-9602 to set one up before your first case — this is a required prerequisite.' },
      { title: 'Create a New Case Order', body: 'Click "New Order" and fill in patient details. Under Lab Partner, search for and select Florida Oral Labs. Select the byteSense device type from the product menu. Add any clinical notes relevant to this patient (arch size concerns, occlusal issues, etc.).' },
      { title: 'Upload Your Exported STLs', body: 'On the file upload screen, attach the three STL files you exported from iTero: Upper Arch, Lower Arch, and Bite Registration. Double-check that each file is correctly labelled and not corrupted before uploading.' },
      { title: 'Submit and Confirm', body: 'Review all case details and click Submit. Copy or screenshot your Medit order confirmation number — this is your case reference for all future follow-ups with the lab or byteSense. Store it in the patient chart.' },
    ],
  },
  {
    id: 'carestream',
    name: 'Carestream Scanner Registration',
    model: 'CS 3600 / CS 3700 Series',
    steps: [
      { title: 'Export STL from CS Imaging Software', body: 'Open CS Imaging or CS Model+ and locate the completed scan. Right-click the case and select "Export." Choose STL format and export Upper Arch, Lower Arch, and Bite Registration as individual files. Avoid exporting as a single merged file — Florida Oral Labs requires separate arch files.' },
      { title: 'Verify File Format and Quality', body: 'Open each STL in your preview viewer (CS Imaging has a built-in 3D viewer) to confirm no scan artifacts, holes, or missing gingival coverage. The Upper and Lower arches should each show ≥5mm of gingival tissue above every tooth. Reject and rescan if any arch is incomplete.' },
      { title: 'Log Into Medit Link and Create Order', body: 'Navigate to meditlink.com. Click "New Order," enter patient information, and select Florida Oral Labs as your lab partner. Select the byteSense appliance from the product list and include any clinical notes in the order notes field.' },
      { title: 'Upload STL Files', body: 'Attach your three exported Carestream STL files to the Medit order. Upper Arch, Lower Arch, and Bite Registration. Confirm file sizes appear reasonable (typically 2–15MB each). Zero-byte or unusually small files indicate an export error — re-export before uploading.' },
      { title: 'Submit and Record Confirmation', body: 'Complete and submit the order. Record the Medit confirmation number in the patient chart. Contact Natasha Blake if the lab does not acknowledge receipt within one business day.' },
    ],
  },
  {
    id: 'medit',
    name: 'Medit Scanner Registration',
    model: 'i700 / i700 Wireless / i900',
    steps: [
      { title: 'Scan Directly Within Medit Link', body: 'Medit scanners integrate natively with Medit Link, which simplifies the submission process significantly. After completing your intraoral scan (Upper Arch, Lower Arch, Bite Registration), do not close the case — proceed directly to the order submission screen within the Medit software.' },
      { title: 'Select Florida Oral Labs in the Order Screen', body: 'From the case order screen within Medit, select Florida Oral Labs as the receiving lab. The STL files are automatically attached from the active scan — you do not need to manually export or upload them. This is the primary advantage of native Medit-to-Medit Link workflows.' },
      { title: 'Select the byteSense Device Type', body: 'In the product/prescription section, select the byteSense appliance. Add any clinical notes about arch size, occlusal concerns, or patient-specific requirements in the notes field. Be specific — the lab reads these notes during fabrication.' },
      { title: 'Review and Submit', body: 'Confirm that all three scan components (Upper, Lower, Bite Registration) are visible as attached files on the order summary. Verify the lab, device type, and patient name are correct. Submit the order.' },
      { title: 'Record the Order Number', body: 'After submission, Medit displays a confirmation screen with your case order number. Copy this into the patient chart immediately. This number is your reference for all lab status inquiries and is required if you need to contact byteSense about a specific case.' },
    ],
  },
];

// ── Scanner detail page ───────────────────────────────────────────────────────
function ScannerDetailPage({ scanner, onBack }: { scanner: typeof SCANNERS[0]; onBack: () => void }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ maxWidth: 900, padding: isMobile ? '32px 20px' : '72px 64px', fontFamily: C.fn }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'none', border: 'none', cursor: 'pointer',
          color: DIM, fontSize: 13, fontFamily: C.fn, padding: 0,
          marginBottom: 36,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--bs-text)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = DIM; }}
      >
        <ArrowLeft size={15} strokeWidth={2} />
        Back to Scanner Registration
      </button>

      <div style={sectionTag}>Scanner Setup</div>
      <h2 style={sectionTitle}>
        {scanner.name.split(' ')[0]}{' '}
        <span style={accent}>{scanner.name.split(' ').slice(1).join(' ')}</span>
      </h2>
      <p style={sectionSubtitle}>{scanner.model} — Follow these steps to connect your scanner to Medit Link and submit your first byteSense case.</p>

      <div style={{ background: 'var(--bs-bg2)', border: `1px solid ${BORDER2}`, padding: '18px 22px', marginBottom: 40, display: 'flex', gap: 14 }}>
        <div style={{ color: TEAL_C, fontSize: 18, flexShrink: 0 }}>ℹ</div>
        <div style={{ fontSize: 13, color: DIM, lineHeight: 1.7, fontFamily: C.fn }}>
          All submissions go through <strong style={{ color: 'var(--bs-text)' }}>Medit Link</strong> to <strong style={{ color: 'var(--bs-text)' }}>Florida Oral Labs</strong>. Complete this once before your first case.
        </div>
      </div>

      {scanner.steps.map((step, i) => (

        <StepBlock key={i} num={i + 1} title={step.title} body={step.body} />
      ))}

      <div style={{ background: 'var(--bs-green-muted)', border: `1px solid var(--bs-green-border)`, padding: '20px 24px', display: 'flex', gap: 16, marginTop: 8 }}>
        <div style={{ color: '#38A169', fontSize: 20, flexShrink: 0 }}>✓</div>
        <div style={{ fontSize: 13, color: DIM, lineHeight: 1.75, fontFamily: C.fn }}>
          <strong style={{ color: 'var(--bs-text)' }}>Before your first submission:</strong> Contact Natasha Blake at 909-527-9602 to confirm your Medit Link lab connection is active and Florida Oral Labs is correctly linked to your account. This prevents delays on your first case.
        </div>
      </div>
    </div>
  );
}

// ── Scanner Registration section ─────────────────────────────────────────────
function ScannerRegistrationSection({ onSelectScanner }: { onSelectScanner: (id: string) => void }) {
  const isMobile = useIsMobile();
  return (
    <div style={getSectionStyle(isMobile)}>
      <div style={sectionTag}>Section 01 — Scanner Setup</div>
      <h2 style={sectionTitle}>Scanner <span style={accent}>Registration</span></h2>
      <p style={sectionSubtitle}>Connect your intraoral scanner to Medit Link and Florida Oral Labs before submitting your first case. Select your scanner below.</p>

      <div style={{ background: 'var(--bs-bg2)', border: `1px solid ${BORDER2}`, padding: '18px 22px', marginBottom: 36, display: 'flex', gap: 14 }}>
        <div style={{ color: TEAL_C, fontSize: 18, flexShrink: 0 }}>ℹ</div>
        <div style={{ fontSize: 13, color: DIM, lineHeight: 1.7, fontFamily: C.fn }}>
          All case submissions go through <strong style={{ color: 'var(--bs-text)' }}>Medit Link</strong> to <strong style={{ color: 'var(--bs-text)' }}>Florida Oral Labs</strong>, regardless of which scanner your practice uses. Complete this registration once — it takes approximately 10 minutes.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        {SCANNERS.map(scanner => (
          <button
            key={scanner.id}
            onClick={() => onSelectScanner(scanner.id)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '22px 28px',
              background: RED_B, border: 'none',
              cursor: 'pointer', fontFamily: C.fn,
              textAlign: 'left', transition: 'all 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#C53030'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = RED_B; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 3, letterSpacing: -0.2 }}>{scanner.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.3 }}>{scanner.model}</div>
            </div>
            <ArrowLeft size={18} color="rgba(255,255,255,0.7)" style={{ transform: 'rotate(180deg)', flexShrink: 0 }} />
          </button>
        ))}
      </div>

      <div style={{ ...cardStyle('teal') }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: TEAL_C, marginBottom: 10 }}>Don't see your scanner?</div>
        <div style={{ fontSize: 14, color: DIM, lineHeight: 1.7 }}>
          If your practice uses a different intraoral scanner (3Shape, Planmeca, etc.), contact Natasha Blake at <strong style={{ color: 'var(--bs-text)' }}>909-527-9602</strong>. All scanners that export STL files can submit cases.
        </div>
      </div>
    </div>
  );
}

// ── In-Office Launch ─────────────────────────────────────────────────────────
function InOfficeLaunchSection() {
  const isMobile = useIsMobile();
  return (
    <div style={getSectionStyle(isMobile)}>
      <div style={sectionTag}>Section 02 — Launch</div>
      <h2 style={sectionTitle}>In-Office <span style={accent}>Launch</span></h2>
      <p style={sectionSubtitle}>Your practice is set up. Your team is trained. Here is how you run a clean, confident first week with byteSense in-office.</p>

      <h3 style={h3Style}>Team Briefing</h3>
      <StepBlock
        num={1}
        title="Hold a Pre-Launch Huddle (15 Minutes)"
        body="Before you see your first byteSense patient, gather the full clinical team. Walk through the patient journey end-to-end: identification → conversation → consent → scan → submission → delivery. Assign clear ownership for each stage — who introduces it, who takes consent, who scans, who submits. Ambiguity in the room creates hesitation in front of the patient."
      />
      <StepBlock
        num={2}
        title="Assign a byteSense Point Person"
        body="Designate one team member as the byteSense coordinator for your practice — typically a Treatment Coordinator or Office Manager. This person owns case submission tracking, patient follow-up scheduling, Medit Link order management, and direct communication with Natasha Blake. One point of ownership eliminates dropped cases."
      />
      <StepBlock
        num={3}
        title="Print and Stock Physical Materials"
        body="Print the byteSense Patient FAQ (available in the Contact Support section) and stock them at your front desk and in operatories. Patients who read a physical one-pager while waiting are significantly more prepared for the conversation. Keep consent forms stocked at every operatory where byteSense presentations happen."
      />

      <div style={{ height: 1, background: BORDER, margin: '32px 0' }} />

      <h3 style={h3Style}>Operatory Setup</h3>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 32 }}>
        <div style={cardStyle('red')}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: RED_B, marginBottom: 14 }}>Required at Each Operatory</div>
          <ul style={checkList}>
            {[
              'Signed patient consent forms (stock 10+)',
              'Scanner connected and calibrated',
              'Medit Link access confirmed on clinic computer',
              'Staff login credentials available',
              'byteSense device sample (if available)',
            ].map(item => (
              <li key={item} style={checkLi}><span style={{ color: RED_B, flexShrink: 0 }}>—</span>{item}</li>
            ))}
          </ul>
        </div>
        <div style={cardStyle('teal')}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: TEAL_C, marginBottom: 14 }}>Recommended</div>
          <ul style={checkList}>
            {[
              'Patient FAQ one-pager within reach',
              'Phone or tablet to show the byteSense app',
              'Natasha\'s number saved in your phone',
              'Morning huddle agenda includes byteSense review',
            ].map(item => (
              <li key={item} style={checkLi}><span style={{ color: TEAL_C, flexShrink: 0 }}>—</span>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <h3 style={h3Style}>First Week Protocol</h3>
      <StepBlock
        num={4}
        title="Identify 3–5 Ideal Patients Before They Arrive"
        body="Each morning, review that day's schedule with your coordinator. Identify patients showing bruxism indicators, wear facets, jaw pain history, or previous night guard use. Flag their charts. Don't leave identification to chance during a busy appointment — a 5-minute pre-huddle review per day generates all the volume you need."
      />
      <StepBlock
        num={5}
        title="Run the Conversation — Don't Ask Permission"
        body="When you see your flagged patient, introduce byteSense as part of your clinical finding: 'I can see you've been grinding — I want to show you something we just introduced.' Present it as a clinical observation, not a sales ask. The patient should feel like they're receiving relevant, personalized information, not a pitch."
      />
      <StepBlock
        num={6}
        title="Debrief at End of Each Day"
        body="Take 10 minutes at end-of-day to review: How many patients were flagged? How many received the presentation? How many consented? How many cases were submitted? What objections came up? Early tracking reveals friction in the system before it becomes a pattern. Share wins with the team — momentum is contagious."
      />

      <div style={{ background: 'var(--bs-red-muted)', border: `1px solid ${RED_BDR}`, padding: '20px 24px', display: 'flex', gap: 16 }}>
        <div style={{ color: RED_B, fontSize: 20, flexShrink: 0 }}>⚑</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--bs-text)', marginBottom: 8 }}>First Week Target: 3 Submitted Cases</div>
          <div style={{ fontSize: 13, color: DIM, lineHeight: 1.75 }}>
            Getting 3 cases submitted in your first week establishes the habit, proves the system works, and gets patients through the pipeline quickly enough to generate real testimonials. Don't aim for perfect — aim for moving. Natasha is available throughout your first week for real-time coaching. Use her.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Activation / First Order Gate ───────────────────────────────────────────
function ActivationSection() {
  const isMobile = useIsMobile();
  return (
    <div style={{ ...getSectionStyle(isMobile), borderBottom: 'none' }}>
      <div style={sectionTag}>Section 03 — Activation</div>
      <h2 style={sectionTitle}>Activation &amp; <span style={accent}>First Order Gate</span></h2>
      <p style={sectionSubtitle}>Everything that must be in place before your first case is submitted. Check these off once — then you are clear to run.</p>

      {/* Checklist */}
      <h3 style={h3Style}>Pre-Activation Checklist</h3>
      {[
        { label: 'Scanner Registration Complete', desc: 'Your scanner is linked to Medit Link and Florida Oral Labs is confirmed as your lab partner.', color: 'teal' as const },
        { label: 'Team Training Complete', desc: 'All staff who will present, consent, scan, or submit cases have completed the relevant training modules in this platform.', color: 'teal' as const },
        { label: 'Consent Forms Printed and Stocked', desc: 'Patient Wellness Device Consent Forms are printed and available at every presentation operatory.', color: 'teal' as const },
        { label: 'Payment Process Confirmed', desc: 'Your team knows how to collect patient payment at time of scan. Payment must be confirmed before a case is submitted.', color: 'teal' as const },
        { label: 'Natasha Briefed on Your Launch Date', desc: 'Text or call Natasha at 909-527-9602 to confirm your first case is coming. She will be on standby to support your first submission.', color: 'red' as const },
        { label: 'Medit Link Login Tested', desc: 'At least one team member has logged into Medit Link, created a test case draft, and confirmed Florida Oral Labs appears as a lab option.', color: 'red' as const },
      ].map((item, i) => (
        <div key={i} style={{
          display: 'flex', gap: 16, padding: '18px 22px',
          background: item.color === 'teal' ? TEAL_MUT : RED_MUT,
          border: `1px solid ${item.color === 'teal' ? TEAL_C + '44' : RED_BDR}`,
          marginBottom: 10, alignItems: 'flex-start', fontFamily: C.fn,
        }}>
          <div style={{
            width: 22, height: 22, minWidth: 22, border: `2px solid ${item.color === 'teal' ? TEAL_C : RED_B}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, color: item.color === 'teal' ? TEAL_C : RED_B, fontWeight: 800, flexShrink: 0, marginTop: 1,
          }}>☐</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--bs-text)', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 13, color: DIM, lineHeight: 1.65 }}>{item.desc}</div>
          </div>
        </div>
      ))}

      <div style={{ height: 1, background: BORDER, margin: '40px 0' }} />

      <h3 style={h3Style}>First Order Walkthrough</h3>
      <StepBlock
        num={1}
        title="Select Your First Patient"
        body="Your first case should be a motivated, straightforward patient — ideally someone with clear bruxism indicators, a positive relationship with your practice, and no significant occlusal contraindications. This is not the time to test edge-case patients. An easy first case builds team confidence faster than anything else."
      />
      <StepBlock
        num={2}
        title="Obtain Signed Consent Before Any Clinical Work"
        body="Present the byteSense Patient Wellness Device Consent Form and walk the patient through it verbally. Answer questions directly. File the original in the chart. A case submitted without a signed consent form will not be fabricated. This step cannot be skipped or completed retroactively."
      />
      <StepBlock
        num={3}
        title="Take the Scan — Verify Quality Before the Patient Leaves"
        body="Scan per the protocol in the Office Workflow section: Upper Arch, Lower Arch, and Bite Registration (recommended). After scanning, review the 3D model carefully before the patient gets up. Look for holes, missing gingival coverage, and scan artifacts. If anything looks off — rescan immediately. The patient is still in the chair. This is the lowest-cost moment to catch an error."
      />
      <StepBlock
        num={4}
        title="Submit the Case via Medit Link"
        body="Log into Medit Link. Create a new order, select Florida Oral Labs, attach your STL files, select the byteSense device, and add any clinical notes. Submit. Copy the confirmation number into the patient chart and text it to Natasha so she can monitor the case on her end."
      />
      <StepBlock
        num={5}
        title="Collect Patient Payment"
        body="Collect patient payment at the time of scan — before the case is submitted, or immediately after, before the patient leaves. Do not submit cases on a pending-payment basis. Your practice pays the lab fee to Florida Oral Labs; confirm your lab account billing method is set up before the first submission."
      />
      <StepBlock
        num={6}
        title="Schedule the Delivery Appointment"
        body="Before the patient leaves the office, schedule their delivery appointment approximately 3 weeks out. Pre-scheduling at the scan appointment dramatically reduces no-shows and delivery delays. Block 15–30 minutes for fit verification and app pairing."
      />

      {/* Final callout */}
      <div style={{ background: TEAL_MUT, border: `1px solid ${TEAL_C}55`, padding: '28px 32px', marginTop: 40 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: TEAL_C, marginBottom: 10, textTransform: 'uppercase' }}>You Are Live</div>
        <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--bs-text)', marginBottom: 12, fontFamily: C.fn }}>Your First Case Is In the Lab</h3>
        <p style={{ fontSize: 14, color: DIM, lineHeight: 1.8, margin: 0, fontFamily: C.fn }}>
          From this point forward, the system runs on rhythm. Morning huddle → patient identification → presentation → consent → scan → submit → collect → schedule delivery. Each repetition gets faster. Each case builds confidence in your team and trust in your patients. You are already ahead of every practice that is still waiting for the perfect moment to start.
        </p>
      </div>

      <div style={{ marginTop: 40, paddingTop: 32, borderTop: `1px solid ${BORDER}`, textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: FAINT, letterSpacing: 2, marginBottom: 8 }}>BYTESENSE · bytesense.ai</div>
        <div style={{ fontSize: 10, color: FAINT }}>Beta Partner Onboarding Package · Confidential · Not for Distribution</div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface OfficeOnboardingScreenProps {
  lang?: Lang;
}

export default function OfficeOnboardingScreen({ lang = 'en' }: OfficeOnboardingScreenProps) {
  const T = (key: string) => t(lang, key);
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState('scanner-registration');
  const [selectedScanner, setSelectedScanner] = useState<string | null>(null);

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

  const navItems = [
    { id: 'scanner-registration', label: 'Scanner Registration',         short: 'Scanner Setup' },
    { id: 'in-office-launch',     label: 'In-Office Launch',             short: 'In-Office Launch' },
    { id: 'activation',           label: 'Activation / First Order Gate', short: 'Activation' },
  ];

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
          {/* Header */}
          <div style={{ padding: '28px 24px 20px', borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: 'var(--bs-text)', marginBottom: 8 }}>
              byte<span style={{ color: RED_B }}>Sense</span>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: 2, color: RED_B,
              background: RED_MUT, border: `1px solid ${RED_BDR}`, padding: '3px 10px', display: 'inline-block',
            }}>OFFICE ONBOARDING</span>
          </div>

          {/* Nav */}
          <div style={{ padding: '16px 0', flex: 1 }}>
            <div style={{ padding: '8px 24px 4px', fontSize: 9, fontWeight: 700, letterSpacing: '2.5px', color: FAINT, textTransform: 'uppercase' }}>
              Onboarding Steps
            </div>
            {navItems.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  // If we're currently viewing a scanner detail page, clearing
                  // the selection first re-mounts the three section anchors so
                  // scrollToSection can find them on the next paint.
                  if (selectedScanner) {
                    setSelectedScanner(null);
                    setActiveSection(item.id);
                    requestAnimationFrame(() => scrollToSection(item.id));
                  } else {
                    scrollToSection(item.id);
                  }
                }}
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

          {/* Footer */}
          <div style={{ padding: '20px 24px', borderTop: `1px solid ${BORDER}` }}>
            <div style={{ background: RED_MUT, border: `1px solid ${RED_BDR}`, padding: 14 }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: RED_B, fontWeight: 700, marginBottom: 6 }}>Natasha Blake</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bs-text)', marginBottom: 2 }}>909-527-9602</div>
              <div style={{ fontSize: 11, color: DIM }}>Onboarding support</div>
            </div>
          </div>
        </nav>
      )}

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Mobile top nav — matches ProductExperienceScreen group-selector pattern */}
        {isMobile && (
          <div style={{ position: 'sticky', top: 0, zIndex: 20, background: BG, flexShrink: 0 }}>
            {/* ── Row 1: Section selector (bold group-style) ── */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}` }}>
              {navItems.map(item => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (selectedScanner) setSelectedScanner(null);
                      scrollToSection(item.id);
                      setActiveSection(item.id);
                    }}
                    style={{
                      flex: 1, padding: '12px 6px', border: 'none', cursor: 'pointer',
                      fontFamily: C.fn, fontSize: 10, fontWeight: 700, letterSpacing: 0.2,
                      lineHeight: 1.35, textAlign: 'center',
                      background: isActive ? RED_MUT : 'transparent',
                      color: isActive ? RED_B : '#555',
                      borderBottom: `2px solid ${isActive ? RED_B : 'transparent'}`,
                      transition: 'all 0.2s',
                    }}
                  >
                    {item.short}
                  </button>
                );
              })}
            </div>

            {/* ── Row 2: Scrollable sub-items for active section ── */}
            <div ref={tabStripRef} style={{ overflowX: 'auto', whiteSpace: 'nowrap', borderBottom: `1px solid ${BORDER}`, padding: '0 4px', WebkitOverflowScrolling: 'touch' as any }}>
              {activeSection === 'scanner-registration' && SCANNERS.map(sc => (
                <button key={sc.id} data-tab={sc.id}
                  onClick={() => setSelectedScanner(sc.id)}
                  style={{
                    display: 'inline-block', padding: '8px 14px', fontSize: 11, fontWeight: 500,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: selectedScanner === sc.id ? RED_B : '#777',
                    borderBottom: `2px solid ${selectedScanner === sc.id ? RED_B : 'transparent'}`,
                    whiteSpace: 'nowrap', minHeight: 38, fontFamily: C.fn,
                  }}
                >
                  {sc.name.split(' ')[0]}
                </button>
              ))}
              {activeSection === 'in-office-launch' && ['Team Briefing', 'Operatory Setup', 'First Week'].map(label => (
                <span key={label} style={{
                  display: 'inline-block', padding: '8px 14px', fontSize: 11,
                  color: '#555', fontFamily: C.fn, whiteSpace: 'nowrap',
                }}>{label}</span>
              ))}
              {activeSection === 'activation' && ['Pre-Activation Checklist', 'First Order Walkthrough'].map(label => (
                <span key={label} style={{
                  display: 'inline-block', padding: '8px 14px', fontSize: 11,
                  color: '#555', fontFamily: C.fn, whiteSpace: 'nowrap',
                }}>{label}</span>
              ))}
            </div>
          </div>
        )}

        {/* Section content */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {selectedScanner ? (
            <ScannerDetailPage
              scanner={SCANNERS.find(s => s.id === selectedScanner)!}
              onBack={() => setSelectedScanner(null)}
            />
          ) : (
            <>
              <div data-sid="scanner-registration">
                <ScannerRegistrationSection onSelectScanner={setSelectedScanner} />
              </div>
              <div data-sid="in-office-launch"><InOfficeLaunchSection /></div>
              <div data-sid="activation"><ActivationSection /></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
