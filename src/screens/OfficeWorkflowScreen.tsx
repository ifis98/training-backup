import { useState, useRef, useEffect } from 'react';
import { C } from '@/data/constants';
import { useIsMobile } from '@/hooks/use-mobile';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// ── Colours ──────────────────────────────────────────────────────────────────
const BG      = 'var(--bs-bg)';
const SURFACE = 'var(--bs-bg2)';
const CARD    = 'var(--bs-bg3)';
const BORDER  = 'var(--bs-border)';
const BORDER2 = 'var(--bs-border)';
const DIM     = 'var(--bs-ash)';
const FAINT   = 'var(--bs-ash)';
const RED_B   = '#E63434';
const RED_MUT = '#3A1515';
const RED_BDR = '#5a1010';
const TEAL_C  = '#00B4AD';
const TEAL_MUT= '#003D3B';

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

// ── Step block ───────────────────────────────────────────────────────────────
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

// ── Sections ─────────────────────────────────────────────────────────────────

function PatientSelectionSection() {
  const isMobile = useIsMobile();
  return (
    <div style={getSectionStyle(isMobile)}>
      <div style={sectionTag}>Section 05 — Patient Selection</div>
      <h2 style={sectionTitle}>Patient <span style={accent}>Inclusion</span> &amp; Exclusion Criteria</h2>
      <p style={sectionSubtitle}>Selecting the right patients ensures a great device, a satisfied patient, and a clean case submission.</p>

      {/* Warning notice */}
      <div style={{ background: '#1a0a0a', border: `1px solid ${RED_BDR}`, padding: '20px 24px', marginBottom: 32, display: 'flex', gap: 16 }}>
        <div style={{ color: RED_B, fontSize: 20, flexShrink: 0, marginTop: 2 }}>⚑</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--bs-text)', marginBottom: 8 }}>If a Patient Does Not Meet Mandatory Criteria</div>
          <div style={{ fontSize: 13, color: DIM, lineHeight: 1.75 }}>
            If a device cannot be fabricated for a patient due to mandatory exclusion criteria, you will receive a full refund and a standard nightguard will be sent at no additional charge. When in doubt, contact the lab or Natasha before submitting the scan.
          </div>
        </div>
      </div>

      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 40 }}>
        {/* LEFT — Mandatory */}
        <div style={{ ...cardStyle('red') }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: RED_B, textTransform: 'uppercase', marginBottom: 14 }}>Mandatory Criteria</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {[
              ['Maxillary Arch Perimeter > 123 mm', 'This may exclude some children and smaller adults. Measure if uncertain.'],
              ['No Irregular Tooth Eruptions or Severe Overcrowding', 'Significantly erupted, rotated, or impacted teeth will prevent proper device fabrication.'],
              ['Minimum 1.7 mm Occlusal Clearance', 'Patients who cannot tolerate this minimum thickness must be excluded.'],
              ['Flat Plane Full-Contact Occlusal Splint Compatible', 'We fabricate flat plane, full contact occlusal splints only. Patients requiring anterior guidance, posterior ramps, or other occlusal schemes are excluded.'],
            ].map(([title, body]) => (
              <li key={title} style={{ padding: '10px 0', borderBottom: `1px solid ${RED_BDR}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--bs-text)', marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 12, color: DIM, lineHeight: 1.65 }}>{body}</div>
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT — Preferred */}
        <div style={{ ...cardStyle('teal') }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: TEAL_C, textTransform: 'uppercase', marginBottom: 10 }}>Preferred Criteria</div>
          <div style={{ fontSize: 12, color: DIM, lineHeight: 1.65, marginBottom: 14, fontStyle: 'italic' }}>
            Patients not meeting preferred criteria may have a more uncomfortable experience, but are not necessarily excluded. Use clinical judgment.
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {[
              ['Canine-to-Canine Maxillary Perimeter < 55 mm', 'Larger anterior arches may find the device more prominent in the anterior region.'],
              ['Shortest Tooth Height > 8 mm', 'Shorter clinical crowns may result in more gum contact with the device flanges.'],
              ['No Sensitive Buccal Area', 'Patients with buccal sensitivity may find the device flanges uncomfortable.'],
            ].map(([title, body]) => (
              <li key={title} style={{ padding: '10px 0', borderBottom: `1px solid ${TEAL_C}33` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--bs-text)', marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 12, color: DIM, lineHeight: 1.65 }}>{body}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Ideal patient profile table */}
      <h3 style={h3Style}>Ideal Patient Profile — Your First 10</h3>
      <div style={tableWrap}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Clinical Sign</th>
              <th style={thStyle}>What It Tells You</th>
              <th style={thStyle}>Presentation Priority</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Wear Facets / Attrition', 'Active or historical bruxism — patient is destroying their teeth', 'HIGHEST', '#E63434'],
              ['Fractured / Cracked Cusps', 'Significant nocturnal force — immediate protection need', 'HIGHEST', '#E63434'],
              ['Reports Jaw Pain / Headaches', 'Symptomatic bruxism — patient is already in pain and motivated', 'HIGHEST', '#E63434'],
              ['History of Previous Night Guard', 'Already accepts the concept — needs upgrade narrative', 'HIGH', '#E6A534'],
              ['Reports Poor Sleep / Fatigue', 'Data-driven solution for something already bothering them', 'HIGH', '#E6A534'],
              ['Fitness Tracker User', 'Already in the data-for-health mindset — easy sell', 'HIGH', '#E6A534'],
              ['Cervical Abfractions', 'Likely bruxism etiology — clinical documentation opportunity', 'MODERATE', '#888888'],
              ['High Stress / High-Pressure Career', 'HRV and stress monitoring messaging resonates strongly', 'MODERATE', '#888888'],
            ].map(([sign, tell, priority, color]) => (
              <tr key={sign}>
                <td style={tdStyle}><strong style={{ color: 'var(--bs-text)' }}>{sign}</strong></td>
                <td style={tdStyle}>{tell}</td>
                <td style={{ ...tdStyle, color: color as string, fontWeight: 700, fontSize: 11, letterSpacing: 0.5 }}>{priority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScanningSection() {
  const isMobile = useIsMobile();
  return (
    <div style={getSectionStyle(isMobile)}>
      <div style={sectionTag}>Section 06 — Clinical Protocol</div>
      <h2 style={sectionTitle}>Scanning <span style={accent}>Protocol</span></h2>
      <p style={sectionSubtitle}>Precise scans ensure a perfect device. Rejected scans delay patient care. Follow this protocol exactly.</p>

      {/* Warning notice */}
      <div style={{ background: '#1a0a0a', border: `1px solid ${RED_BDR}`, padding: '20px 24px', marginBottom: 32, display: 'flex', gap: 16 }}>
        <div style={{ color: RED_B, fontSize: 20, flexShrink: 0, marginTop: 2 }}>⚑</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--bs-text)', marginBottom: 8 }}>Scans That Do Not Meet Criteria Will Be Rejected</div>
          <div style={{ fontSize: 13, color: DIM, lineHeight: 1.75 }}>
            We only accept intraoral 3D digital scans. Physical impressions are not accepted. A rejected scan delays patient delivery and requires a rescan appointment. Following this protocol eliminates rejections entirely.
          </div>
        </div>
      </div>

      {/* Required / Optional cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 32 }}>
        <div style={cardStyle('red')}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: RED_B, marginBottom: 12 }}>Required</div>
          <ul style={checkList}>
            {['Upper Arch STL', 'Lower Arch STL', 'Scans in Bite Orientation'].map(item => (
              <li key={item} style={checkLi}><span style={{ color: RED_B, flexShrink: 0 }}>—</span>{item}</li>
            ))}
          </ul>
        </div>
        <div style={cardStyle('teal')}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: TEAL_C, marginBottom: 12 }}>Optional (Recommended)</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--bs-text)', marginBottom: 6 }}>Bite Registration STL</div>
          <div style={{ fontSize: 13, color: DIM, lineHeight: 1.7 }}>Preferred with slight open bite. Improves appliance accuracy significantly when included.</div>
        </div>
      </div>

      {/* 4 numbered steps */}
      <h3 style={h3Style}>Protocol Steps</h3>
      <StepBlock
        num={1}
        title="No Missing Sections, Holes, or Scan Artifacts"
        body="Every tooth and surrounding tissue must be fully and cleanly captured. Scans with holes, skips, stitching errors, or scan artifacts will be automatically rejected. Re-scan affected areas immediately if the scanner preview shows gaps or data corruption."
      />
      <StepBlock
        num={2}
        title="Minimum 5mm of Gum Tissue Captured Above Every Tooth"
        body="Extend the scan superiorly (for the maxilla) or inferiorly (for the mandible) to capture at least 5mm of gum tissue above each tooth. The total height of gum tissue plus tooth surface must be at least 11mm for every tooth in the arch. This ensures proper appliance border design and retention."
      />
      <StepBlock
        num={3}
        title="All Teeth Fully Captured with Clear Gum Line"
        body="Every tooth must be completely captured — from cusp tip or incisal edge to the gum margin, with the marginal gingiva clearly visible in the scan. Partially captured teeth or obscured gum margins will result in rejection. Pay particular attention to posterior teeth and buccal aspects."
      />
      <StepBlock
        num={4}
        title="Patient Positioning and Comfort"
        body="Ensure the patient's cheeks and lips are retracted appropriately during scanning. Intraoral retractors are recommended. Keep the patient's head relatively still and coach controlled breathing. A relaxed, well-positioned patient produces a cleaner scan in less time."
      />

      {/* Success notice */}
      <div style={{ background: '#0a1a0a', border: `1px solid #1a5a1a`, padding: '20px 24px', display: 'flex', gap: 16 }}>
        <div style={{ color: '#38A169', fontSize: 20, flexShrink: 0, marginTop: 2 }}>✓</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--bs-text)', marginBottom: 8 }}>Scan Quality Checkpoint Before Submitting</div>
          <div style={{ fontSize: 13, color: DIM, lineHeight: 1.75 }}>
            After scanning, zoom through the 3D model and verify: (1) No holes or missing areas, (2) At least 5mm of gingiva captured above every tooth, (3) All tooth surfaces fully rendered, (4) No soft tissue or cheek artifacts. If uncertain — rescan. It takes 3 minutes. Rejection takes 3 days.
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmissionSection() {
  const isMobile = useIsMobile();
  return (
    <div style={getSectionStyle(isMobile)}>
      <div style={sectionTag}>Section 07 — Case Workflow</div>
      <h2 style={sectionTitle}>Case <span style={accent}>Submission</span> Workflow</h2>
      <p style={sectionSubtitle}>From signed consent to delivered device — the complete case lifecycle.</p>

      <StepBlock
        num={1}
        title="Patient Signs Consent Form"
        body="Before any clinical work begins, the patient must sign the byteSense Patient Wellness Device Consent Form. File the original in the patient's chart. Retain a copy for your byteSense records. This form must accompany every case submission. No consent = no case submitted."
      />
      <StepBlock
        num={2}
        title="Complete Eligibility Check"
        body="Confirm the patient meets all Mandatory Inclusion Criteria from Section 5. Document your clinical assessment in the patient chart noting: arch perimeter (if measured), tooth eruption pattern, and any clinical concerns. This documentation protects you and the patient."
      />
      <StepBlock
        num={3}
        title="Take Intraoral Scans Per Protocol"
        body="Scan per the protocol in Section 6. Obtain: Upper arch STL, Lower arch STL, and (recommended) bite registration STL. Verify quality before the patient leaves the chair — always. Export STL files from your scanner software."
      />
      <StepBlock
        num={4}
        title="Submit via Medit Link to Florida Oral Labs"
        body="Log into Medit Link Web. Create a new case order. Select Florida Oral Labs as your lab partner. Upload all STL files. Include any special notes or patient-specific instructions in the order notes field. Submit the order and retain your Medit order confirmation number."
      />
      <StepBlock
        num={5}
        title="Collect Payment"
        body="Collect patient payment at the time of scan or prior to the scan appointment. Do not submit cases without confirmed patient payment. Your practice pays the lab fee to Florida Oral Labs; the patient pays your practice the full device fee."
      />
      <StepBlock
        num={6}
        title="Device Delivery, Insertion, and App Setup"
        body="Upon device arrival from the lab, schedule a 15–30 minute delivery appointment. Verify fit (standard splint delivery protocol). Guide the patient through downloading the byteSense app and pairing the device. Ensure the patient understands how to read their byteSense Score™ before leaving."
      />
      <StepBlock
        num={7}
        title="Schedule 2-Week Follow-Up"
        body="Schedule a brief 10–15 minute follow-up at 2 weeks to assess fit, comfort, and patient engagement with the app data. This touchpoint dramatically improves patient satisfaction, reduces adjustments, and generates referrals. Ask to see their data and express genuine interest."
      />

      {/* Technical support highlight box */}
      <div style={highlightBox()}>
        <div style={hlLabel()}>Technical Support — Device or App Technical Issues</div>
        <h3 style={hlTitle}>Direct Patients to byteSense Support</h3>
        <p style={hlBody}>For technical support related to the device, app connectivity, or data questions, patients can contact byteSense directly at <strong style={{ color: 'var(--bs-text)' }}>support@bytesense.ai</strong>. Your practice does not need to handle technical troubleshooting. Redirect patients to this support channel for all technology-related questions.</p>
      </div>
    </div>
  );
}

function StaffFAQSection() {
  const isMobile = useIsMobile();
  const faqs = [
    {
      q: 'How is bioSense™ different from a night guard?',
      a: `bioSense™ is categorically not a night guard. A night guard provides passive mechanical protection. bioSense™ provides that same protection PLUS active biometric monitoring through six embedded sensor systems. The device monitors heart rate, HRV, SpO₂, respiratory rate, body temperature, bruxism activity, and motion — delivering nightly health intelligence to a smartphone app. The protection is a feature. The intelligence is the product.`,
    },
    {
      q: 'Is this a medical device? Will we need special licensing to offer it?',
      a: `No. bioSense™ is a wellness device — in the same regulatory category as consumer health wearables like the Oura Ring or Apple Watch. It is not a medical device and does not require special licensing beyond your standard practice scope. Always use the Wellness Device Consent Form and never make claims that it diagnoses, treats, cures, or prevents any disease or medical condition.`,
    },
    {
      q: 'How do we code and bill this?',
      a: `bioSense™ is currently billed as a patient-pay wellness device. It is not submitted to insurance. You may choose to use existing occlusal guard CDT codes for the appliance component for record-keeping purposes, but insurance filing for the full bioSense™ device is not currently supported. Collect payment at time of scan or prior to delivery.`,
    },
    {
      q: 'What if the patient has questions about the app or device data?',
      a: `For technical questions about the app, device pairing, or interpreting their data, patients can contact byteSense directly at support@bytesense.ai. You are not expected to provide technical support. If there is a clinical concern related to data the patient shares (e.g., concerning oxygen readings), treat it as you would any patient-reported clinical information — using your clinical judgment and referring appropriately.`,
    },
    {
      q: 'What if a patient wants to return the device?',
      a: `Because bioSense™ is a custom-fabricated device, returns are not available after delivery. This is clearly stated in the patient consent form. However, we stand behind the fit and quality of every device. If there is a clinical issue with fit, adjustments are covered. Contact Natasha Blake at 909-527-9602 to discuss any patient satisfaction concerns — we will work with you to find a resolution.`,
    },
    {
      q: 'What if a scan is rejected by the lab?',
      a: `The lab will notify you of the rejection and the specific reason. Rescan the patient per the corrected criteria and resubmit via Medit. There is no additional lab fee for a resubmission caused by scan quality issues. Contact Natasha Blake or the lab directly if you need guidance on the specific issue causing rejection.`,
    },
    {
      q: 'How long does it take to receive the device after submission?',
      a: `Typical fabrication and delivery time from Florida Oral Labs is currently 10–14 business days from case submission. Set patient expectations at approximately 2–3 weeks from the scan date. The delivery appointment should be pre-scheduled for approximately 3 weeks out at the time of scanning.`,
    },
    {
      q: `What if a patient says they're claustrophobic or can't wear something in their mouth while sleeping?`,
      a: `Acknowledge their concern with empathy. Many patients who believe they can't wear an appliance find that a precisely custom-fit device is far more tolerable than they expected. Offer to show them the device and discuss the gradual wear-in protocol (start with 1–2 hours during relaxation, then progress to full-night wear). For patients who are genuinely unable to wear any intraoral appliance, bioSense™ is not the right fit at this time.`,
    },
  ];

  return (
    <div style={getSectionStyle(isMobile)}>
      <div style={sectionTag}>Section 12 — Reference</div>
      <h2 style={sectionTitle}>Staff <span style={accent}>FAQ</span></h2>
      <p style={sectionSubtitle}>Answers to the most common questions your team will ask.</p>

      <Accordion type="single" collapsible className="w-full">
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
                color: RED_B,
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

function PatientFAQSection() {
  const isMobile = useIsMobile();
  const faqs = [
    {
      q: 'What exactly does the bioSense™ do?',
      a: `bioSense™ is a custom-fit oral appliance with medical-grade sensors built in. While you sleep, it measures six things simultaneously: your heart rate, your heart rate variability (a key stress and recovery indicator), your blood oxygen levels, your breathing rate, your body temperature, and your grinding activity — including exactly how long and how hard you grind. All of this data goes to an app on your phone. Every morning you see a health score and detailed breakdown of what your body did while you slept.`,
    },
    {
      q: 'Is this the same as a night guard?',
      a: `Not at all. A night guard is protective — it prevents your upper and lower teeth from damaging each other when you grind. bioSense™ provides that same protection, but it also monitors your body all night long. Think of the difference between a seatbelt (which only protects you) and a car with a complete dashboard of sensors (which protects you AND tells you everything that's happening). bioSense™ is the complete dashboard.`,
    },
    {
      q: 'Will my insurance cover this?',
      a: `bioSense™ is a wellness monitoring device — similar to an Apple Watch or Oura Ring — so it is not currently covered by dental or medical insurance. It is a patient-pay wellness investment. Your practice may be able to run your flex spending (FSA) or health savings account (HSA) funds toward this purchase — ask your coordinator.`,
    },
    {
      q: 'How is the device made?',
      a: `The process starts with a digital scan of your teeth — there's no messy impression material. The scan data is sent to our specialized lab, where the device is custom-fabricated precisely to your dental arch. It arrives back at your dental office within approximately 2–3 weeks, and your dentist delivers and fits it at a separate appointment.`,
    },
    {
      q: 'Is it comfortable to sleep in?',
      a: `Because it's completely custom-fit to your mouth, it's far more comfortable than a generic appliance. Like any new oral appliance, there's a brief adjustment period of 3–7 nights for most people. Within two weeks, the majority of patients report they don't notice it while sleeping and feel something is missing on nights they forget to wear it.`,
    },
    {
      q: 'What does the app show me?',
      a: `Every morning you'll see your byteSense Score™ — a composite health intelligence rating — along with detailed breakdowns: Bruxism duration and episodes, resting heart rate, heart rate variability, overnight oxygen levels, respiratory rate, body temperature trends, and movement data. You can track trends over days, weeks, and months. Many patients find the data reveals patterns they had no awareness of — and that awareness empowers real health changes.`,
    },
    {
      q: 'Is this device safe?',
      a: `Absolutely. bioSense™ is fabricated from biocompatible dental materials and built to dental laboratory standards. The embedded sensors are sealed within the appliance and are passive monitoring systems — they emit no signals and require no radiation. The device is a wellness monitoring tool, not a medical instrument, and is designed for safe nightly use.`,
    },
    {
      q: 'What happens to my health data?',
      a: `Your health data is collected and stored securely through the byteSense platform. For detailed information about data privacy, security practices, and how your information is used, please review the byteSense privacy policy at bytesense.ai. By signing the Patient Wellness Device Consent Form, you authorize the collection and processing of your biometric wellness data for health monitoring purposes.`,
    },
    {
      q: 'What if I have a problem with the device or the app?',
      a: `For clinical issues with the fit or physical device, contact your dental practice directly. For technical questions about the app, data, or device connectivity, contact byteSense support at support@bytesense.ai. The byteSense team is available to help you get the most from your device.`,
    },
  ];

  return (
    <div style={getSectionStyle(isMobile)}>
      <div style={sectionTag}>Section 13 — Patient Resources</div>
      <h2 style={sectionTitle}>Patient <span style={accent}>FAQ</span></h2>
      <p style={sectionSubtitle}>What your patients will ask — and exactly what to say. Feel free to print and provide this to patients.</p>

      <Accordion type="single" collapsible className="w-full">
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

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 32 }}>
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
export default function OfficeWorkflowScreen() {
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState('patient-selection');

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
      label: 'Clinical Setup',
      items: [
        { id: 'patient-selection', label: 'Patient Selection' },
        { id: 'scanning', label: 'Scanning Protocol' },
        { id: 'submission', label: 'Case Submission' },
      ],
    },
    {
      label: 'Operations',
      items: [
        { id: 'staff-faq', label: 'Staff FAQ' },
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
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bs-text)', marginBottom: 2 }}>909-527-9602</div>
            <div style={{ fontSize: 13, color: DIM }}>support@bytesense.ai</div>
          </div>
        </div>
      </nav>
      )}

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>


        {isMobile && (
          <div ref={tabStripRef} style={{ overflowX: 'auto', whiteSpace: 'nowrap', borderBottom: `1px solid ${BORDER}`, padding: '0 4px', flexShrink: 0, WebkitOverflowScrolling: 'touch' as any, position: 'sticky', top: 0, zIndex: 20, background: BG }}>
            {[
              { id: 'patient-selection', label: 'Patient Selection' },
              { id: 'scanning', label: 'Scanning Protocol' },
              { id: 'submission', label: 'Case Submission' },
              { id: 'staff-faq', label: 'Staff FAQ' },
              { id: 'patient-faq', label: 'Patient FAQ' },
              { id: 'support', label: 'Support & Warranty' },
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
          <div data-sid="patient-selection"><PatientSelectionSection /></div>
          <div data-sid="scanning"><ScanningSection /></div>
          <div data-sid="submission"><SubmissionSection /></div>
          <div data-sid="staff-faq"><StaffFAQSection /></div>
          <div data-sid="patient-faq"><PatientFAQSection /></div>
          <div data-sid="support"><SupportSection /></div>
        </div>
      </div>
    </div>
  );
}
