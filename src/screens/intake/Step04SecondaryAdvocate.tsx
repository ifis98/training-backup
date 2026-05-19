import IntakeShell from './IntakeShell';
import { IntakeInput, IntakeSectionTitle } from './IntakeField';
import { IntakeData } from '@/hooks/useIntakeState';
import { C } from '@/data/constants';

interface Props {
  step: number; totalSteps: number;
  data: IntakeData;
  update: (d: Partial<IntakeData>) => void;
  onBack: () => void; onNext: () => void;
}

export default function Step04SecondaryAdvocate({ step, totalSteps, data, update, onBack, onNext }: Props) {
  return (
    <IntakeShell
      step={step} totalSteps={totalSteps}
      title="Backup Contact"
      subtitle="Who should we contact if your primary ByteSense advocate is unavailable? This protects continuity when they're out."
      onBack={onBack} onContinue={onNext}
      continueLabel="Continue (skip if N/A)"
    >
      <div style={{ background: 'rgba(212,175,55,0.06)', border: `1px solid ${C.gold}30`, padding: '12px 14px', marginBottom: 20, borderRadius: 2 }}>
        <div style={{ fontSize: 12, color: 'var(--bs-ash)', lineHeight: 1.6 }}>
          Assists with case submissions, patient follow-ups, and team education when the primary is unavailable.
        </div>
      </div>

      <IntakeSectionTitle>Contact Information</IntakeSectionTitle>
      <IntakeInput label="Full Name" value={data.secondary_name} onChange={v => update({ secondary_name: v })} placeholder="Full name (optional)" />
      <IntakeInput label="Role / Title" value={data.secondary_role} onChange={v => update({ secondary_role: v })} placeholder="e.g. Front Desk Manager" />
      <IntakeInput label="Email" type="email" value={data.secondary_email} onChange={v => update({ secondary_email: v })} placeholder="email@practice.com" />
      <IntakeInput label="Phone / Cell" type="tel" value={data.secondary_phone} onChange={v => update({ secondary_phone: v })} placeholder="(555) 000-0000" />
    </IntakeShell>
  );
}
