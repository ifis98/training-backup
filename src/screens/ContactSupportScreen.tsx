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

// ── Shared layout helpers ─────────────────────────────────────────────────────
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

const h3Style: React.CSSProperties = {
  fontSize: 18, fontWeight: 700, margin: '32px 0 16px', color: 'var(--bs-text)', fontFamily: C.fn,
};

const divider: React.CSSProperties = {
  borderTop: `1px solid ${BORDER}`, margin: '32px 0',
};

const cardStyle = (color: 'red' | 'teal' | 'none' = 'none'): React.CSSProperties => ({
  background: color === 'red' ? RED_MUT : color === 'teal' ? TEAL_MUT : CARD,
  border: `1px solid ${color === 'red' ? RED_BDR : color === 'teal' ? TEAL_C + '55' : BORDER2}`,
  padding: '20px 22px',
  marginBottom: 14,
  fontFamily: C.fn,
});

const cardBody: React.CSSProperties = {
  fontSize: 13, color: DIM, lineHeight: 1.75,
};

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

// ── Policies Section ──────────────────────────────────────────────────────────
function PoliciesSection() {
  const isMobile = useIsMobile();
  return (
    <div style={getSectionStyle(isMobile)}>
      <div style={sectionTag}>Section 15 — Support</div>
      <h2 style={sectionTitle}><strong>Policies</strong></h2>
      <p style={sectionSubtitle}>You are never alone in this. Here is exactly how to get help — for anything.</p>

      {/* Dr. Hendrik Lai */}
      <div style={{ ...cardStyle('teal'), marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: TEAL_C, marginBottom: 12 }}>MAIN DENTIST CONTACT</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--bs-text)', marginBottom: 4 }}>Dr. Hendrik Lai</div>
        <div style={{ fontSize: 13, color: DIM, marginBottom: 12 }}>Lead Dentist — Practice Point of Contact</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: TEAL_C, marginBottom: 4 }}>+1 (920) 331-7128</div>
        <div style={{ fontSize: 12, color: FAINT }}>Call or text for clinical questions, patient care decisions, and in-practice support.</div>
      </div>

      {/* Two-col */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 32 }}>
        {/* Natasha Blake */}
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

        {/* Right col */}
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

      {/* Warranty */}
      <div style={{ ...cardStyle('teal'), marginBottom: 32 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--bs-text)', marginBottom: 8 }}>12-Month Device Warranty</div>
        <div style={cardBody}>
          Every bioSense™ device is covered by a 12-month warranty from the date of delivery. The warranty covers manufacturing defects in the device and sensor systems. It does not cover loss, patient-caused damage, or normal wear from extended use. For warranty-related concerns, contact Natasha Blake or support@bytesense.ai with the patient name, case number, and description of the issue. Warranty decisions are made in partnership with the practice — your patient's satisfaction is our satisfaction.
        </div>
      </div>

      {/* Final Word */}
      <h3 style={h3Style}>A Final Word From byteSense</h3>
      <div style={highlightBox()}>
        <div style={hlLabel()}>Our Commitment to You</div>
        <h3 style={hlTitle}>We Are In This Together</h3>
        <p style={hlBody}>
          Your success with bioSense™ is not just our goal — it is our responsibility. If something isn't working, we want to know immediately. If your team needs additional training, we will provide it. If a patient has a concern, we will address it. You accepted the risk of being an early partner. We accept the responsibility of making that risk worthwhile. Call us. Text us. Show up on our doorstep if you need to. We are here.
        </p>
      </div>
    </div>
  );
}

// ── Staff FAQ Section ─────────────────────────────────────────────────────────
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
      q: "What if a patient says they're claustrophobic or can't wear something in their mouth while sleeping?",
      a: `Acknowledge their concern with empathy. Many patients who believe they can't wear an appliance find that a precisely custom-fit device is far more tolerable than they expected. Offer to show them the device and discuss the gradual wear-in protocol (start with 1–2 hours during relaxation, then progress to full-night wear). For patients who are genuinely unable to wear any intraoral appliance, bioSense™ is not the right fit at this time.`,
    },
    {
      q: "What if the device doesn't fit?",
      a: `byteSense offers a free one-time remake if: fit issues result from byteSense fabrication, the submitted scan met technical standards, and the issue is reported within 3 business days of delivery. We'll help verify scan quality before you submit.`,
    },
    {
      q: 'What scanning formats does byteSense support?',
      a: `We accept STL files from all major scanners, including iTero, 3Shape, Medit, and others. Files are uploaded securely via our provider portal.`,
    },
    {
      q: "What happens if my impression isn't usable?",
      a: `Our lab technicians check every file for fit accuracy. If your impression is rejected, we'll notify you (or your provider) within 24 hours and ship a replacement kit or request a new scan.`,
    },
    {
      q: 'How secure is byteSense data?',
      a: `All data is encrypted end-to-end, stored on HIPAA-compliant infrastructure, and fully controlled by the user.`,
    },
    {
      q: 'What makes byteSense different from traditional night guards?',
      a: `While traditional guards provide passive protection, byteSense empowers users with self-monitoring capabilities. Its integrated sensor tracks jaw activity and syncs with an app to encourage awareness — not treatment.`,
    },
    {
      q: 'Is the Oral Wearable billable to dental or medical insurance?',
      a: `No. The Oral Wearable is a general wellness product and is not billed to dental or medical insurance. It is offered as an out-of-pocket, elective purchase, similar to other consumer devices sold in practices. There are no insurance submissions, claims, or reimbursements associated with its use.`,
    },
    {
      q: 'Are there CDT or CPT codes associated with the Bitely Oral Wearable?',
      a: `No. There are no CDT or CPT codes associated with the Bitely Oral Wearable. It should not be coded or submitted as a dental or medical device. This eliminates coding complexity and avoids any risk related to improper insurance billing.`,
    },
    {
      q: 'Does recommending this Oral Wearable increase my professional or regulatory liability?',
      a: `No. Recommending the Oral Wearable does not require diagnosis, clinical interpretation, or treatment planning. The data presented is intended for customer self-awareness, and responsibility for interpretation remains with the customer. The product includes built-in disclaimers and usage boundaries to ensure it remains within general wellness scope, similar to other consumer wellness products (sports mouthguards, etc) offered in dental practices.`,
    },
    {
      q: 'Can providers access patient data?',
      a: `Only with the patient's permission. Patients control all sharing through the app and can export summaries in PDF format or invite their provider to view select data points.`,
    },
    {
      q: 'How is the Oral Wearable classified from a regulatory standpoint?',
      a: `byteSense Oral Wearable is positioned as a general wellness product. It is designed to support awareness of sleep-related and oral habits and to provide lifestyle-oriented insights. It is not intended to diagnose, treat, cure, or prevent any disease or medical condition, and it is not marketed or used as a medical device.`,
    },
    {
      q: 'Is this Oral Wearable a medical device or a general wellness product?',
      a: `This Oral Wearable is positioned and marketed strictly as a general wellness product. It is not intended to diagnose, treat, monitor, or prevent any disease or medical condition. All insights provided are designed to support awareness of patterns, habits, and lifestyle-related signals, not clinical decision-making. As such, it does not require FDA clearance for its current use and does not create a medical or diagnostic obligation for the dental professional.`,
    },
    {
      q: 'Is byteSense a diagnostic tool?',
      a: `No. byteSense is a general wellness device. It is not intended to diagnose, treat, or prevent any condition.`,
    },
    {
      q: 'How do I order byteSense?',
      a: `You can order directly from our website. After checkout, you'll receive an at-home impression kit or can schedule a scan with a partner provider. Dental offices can also order on behalf of patients and manage multiple units via our provider dashboard.`,
    },
    {
      q: 'What is the turnaround time?',
      a: `Once your impression or scan is received, your custom byteSense night guard is typically fabricated and shipped within 7–10 business days.`,
    },
    {
      q: "What's the return or refund policy?",
      a: `You may cancel your order for a full refund anytime before the device ships. After shipment, our support team will assist with any fit issues, adjustments, or warranty questions.`,
    },
    {
      q: 'Can byteSense be adjusted after delivery?',
      a: `If retention or comfort is off, our team will assess the issue. In some cases, a refit may be required. In-office chairside adjustments are not recommended due to embedded electronics.`,
    },
    {
      q: 'Is there a warranty for adjustment issues?',
      a: `Yes. byteSense offers a satisfaction guarantee for first-time fits. If your device requires rework due to manufacturing issues, we'll replace it at no cost.`,
    },
    {
      q: 'What does byteSense look and feel like?',
      a: `byteSense is a slim, ergonomic oral appliance weighing just 25 grams. It's designed to fit snugly on your upper arch without interfering with breathing, speaking, or sleep.`,
    },
    {
      q: 'Is it comfortable to wear all night?',
      a: `Yes. byteSense is engineered for overnight use. Its custom-molded design ensures secure, low-profile fit that minimizes bulk and maximizes comfort.`,
    },
    {
      q: 'What kind of data does byteSense collect?',
      a: `byteSense includes a built-in bruxism detection sensor that tracks the number and duration of nighttime clenching and grinding episodes. This behavior data is visible in the byteSense mobile app.`,
    },
    {
      q: 'What does the byteSense app do?',
      a: `The app syncs with the device via Bluetooth and shows a daily summary of jaw activity. Patients can view trends, download reports, and optionally share them with a dental provider.`,
    },
    {
      q: 'What is byteSense made from?',
      a: `The device is constructed using BPA-free, biocompatible, FDA-compliant dental resin. All materials are safe for extended intraoral use.`,
    },
    {
      q: 'How long does byteSense last?',
      a: `With proper care, byteSense can last between 18 to 60 months, depending on usage habits. The electronics are sealed for protection and can be recalibrated or replaced if necessary.`,
    },
    {
      q: 'How should it be cleaned?',
      a: `We recommend using an ultrasonic cleaner with water or a non-abrasive solution. Avoid alcohol-based or harsh chemicals that could degrade the material or sensor casing.`,
    },
  ];

  return (
    <div style={getSectionStyle(isMobile)}>
      <div style={sectionTag}>Section 12 — Reference</div>
      <h2 style={sectionTitle}>Staff <strong>FAQ</strong></h2>
      <p style={sectionSubtitle}>Answers to the most common questions your team will ask.</p>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, i) => (
          <AccordionItem
            key={i}
            value={`staff-faq-${i}`}
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

// ── Patient FAQ Section ───────────────────────────────────────────────────────
function PatientFAQSection() {
  const isMobile = useIsMobile();
  const faqs = [
    {
      q: 'Q: What exactly does the bioSense™ do?',
      a: `bioSense™ is a custom-fit oral appliance with medical-grade sensors built in. While you sleep, it measures six things simultaneously: your heart rate, your heart rate variability (a key stress and recovery indicator), your blood oxygen levels, your breathing rate, your body temperature, and your grinding activity — including exactly how long and how hard you grind. All of this data goes to an app on your phone. Every morning you see a health score and detailed breakdown of what your body did while you slept.`,
    },
    {
      q: 'Q: Is this the same as a night guard?',
      a: `Not at all. A night guard is protective — it prevents your upper and lower teeth from damaging each other when you grind. bioSense™ provides that same protection, but it also monitors your body all night long. Think of the difference between a seatbelt (which only protects you) and a car with a complete dashboard of sensors (which protects you AND tells you everything that's happening). bioSense™ is the complete dashboard.`,
    },
    {
      q: 'Q: Will my insurance cover this?',
      a: `bioSense™ is a wellness monitoring device — similar to an Apple Watch or Oura Ring — so it is not currently covered by dental or medical insurance. It is a patient-pay wellness investment. Your practice may be able to run your flex spending (FSA) or health savings account (HSA) funds toward this purchase — ask your coordinator.`,
    },
    {
      q: 'Q: How is the device made?',
      a: `The process starts with a digital scan of your teeth — there's no messy impression material. The scan data is sent to our specialized lab, where the device is custom-fabricated precisely to your dental arch. It arrives back at your dental office within approximately 2–3 weeks, and your dentist delivers and fits it at a separate appointment.`,
    },
    {
      q: 'Q: Is it comfortable to sleep in?',
      a: `Because it's completely custom-fit to your mouth, it's far more comfortable than a generic appliance. Like any new oral appliance, there's a brief adjustment period of 3–7 nights for most people. Within two weeks, the majority of patients report they don't notice it while sleeping and feel something is missing on nights they forget to wear it.`,
    },
    {
      q: 'Q: What does the app show me?',
      a: `Every morning you'll see your byteSense Score™ — a composite health intelligence rating — along with detailed breakdowns: Bruxism duration and episodes, resting heart rate, heart rate variability, overnight oxygen levels, respiratory rate, body temperature trends, and movement data. You can track trends over days, weeks, and months. Many patients find the data reveals patterns they had no awareness of — and that awareness empowers real health changes.`,
    },
    {
      q: 'Q: Is this device safe?',
      a: `Absolutely. bioSense™ is fabricated from biocompatible dental materials and built to dental laboratory standards. The embedded sensors are sealed within the appliance and are passive monitoring systems — they emit no signals and require no radiation. The device is a wellness monitoring tool, not a medical instrument, and is designed for safe nightly use.`,
    },
    {
      q: 'Q: What happens to my health data?',
      a: `Your health data is collected and stored securely through the byteSense platform. For detailed information about data privacy, security practices, and how your information is used, please review the byteSense privacy policy at bytesense.ai. By signing the Patient Wellness Device Consent Form, you authorize the collection and processing of your biometric wellness data for health monitoring purposes.`,
    },
    {
      q: 'Q: What if I have a problem with the device or the app?',
      a: `For clinical issues with the fit or physical device, contact your dental practice directly. For technical questions about the app, data, or device connectivity, contact byteSense support at support@bytesense.ai. The byteSense team is available to help you get the most from your device.`,
    },
  ];

  return (
    <div style={{ ...getSectionStyle(isMobile), borderBottom: 'none' }}>
      <div style={sectionTag}>Section 13 — Patient Resources</div>
      <h2 style={sectionTitle}>Patient <strong>FAQ</strong></h2>
      <p style={sectionSubtitle}>What your patients will ask — and exactly what to say. Feel free to print and provide this to patients.</p>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, i) => (
          <AccordionItem
            key={i}
            value={`patient-faq-${i}`}
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

// ── Main component ────────────────────────────────────────────────────────────
export default function ContactSupportScreen() {
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState('policies');

  const scrollRef = useRef<HTMLDivElement>(null);
  const tabStripRef = useRef<HTMLDivElement>(null);

  const scrollTabIntoView = (id: string) => {
    const strip = tabStripRef.current;
    if (!strip) return;
    const btn = strip.querySelector<HTMLElement>(`[data-tab="${id}"]`);
    if (!btn) return;
    strip.scrollTo({ left: btn.offsetLeft - strip.offsetWidth / 2 + btn.offsetWidth / 2, behavior: 'smooth' });
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
      label: 'Support',
      items: [
        { id: 'policies',    label: 'Policies' },
        { id: 'staff-faq',  label: 'Staff FAQ' },
        { id: 'patient-faq', label: 'Patient FAQ' },
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


        {isMobile && (
          <div ref={tabStripRef} style={{ overflowX: 'auto', whiteSpace: 'nowrap', borderBottom: `1px solid ${BORDER}`, padding: '0 4px', flexShrink: 0, WebkitOverflowScrolling: 'touch' as any, position: 'sticky', top: 0, zIndex: 20, background: BG }}>
            {[
              { id: 'policies', label: 'Policies' },
              { id: 'staff-faq', label: 'Staff FAQ' },
              { id: 'patient-faq', label: 'Patient FAQ' },
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
          <div data-sid="policies"><PoliciesSection /></div>
          <div data-sid="staff-faq"><StaffFAQSection /></div>
          <div data-sid="patient-faq"><PatientFAQSection /></div>
        </div>
      </div>
    </div>
  );
}
