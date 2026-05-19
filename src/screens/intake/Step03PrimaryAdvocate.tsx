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

export default function Step03PrimaryAdvocate({ step, totalSteps, data, update, onBack, onNext }: Props) {
  const canContinue = !!(data.primary_name && data.primary_email);

  return (
    <IntakeShell
      step={step} totalSteps={totalSteps}
      title="Primary ByteSense Advocate"
      subtitle="Who should ByteSense work with day-to-day to help your office get started? This person is the internal champion who owns the program."
      onBack={onBack} onContinue={onNext}
      continueDisabled={!canContinue}
    >
      <div style={{ background: 'rgba(32,200,185,0.06)', border: `1px solid ${C.teal}30`, padding: '12px 14px', marginBottom: 20, borderRadius: 2 }}>
        <div style={{ fontSize: 12, color: 'var(--bs-ash)', lineHeight: 1.6 }}>
          Typically the lead Hygienist, Treatment Coordinator, or an engaged clinical team member.
        </div>
      </div>

      <IntakeSectionTitle>Contact Information</IntakeSectionTitle>
      <IntakeInput label="Full Name" value={data.primary_name} onChange={v => update({ primary_name: v })} placeholder="Full name" required />
      <IntakeInput label="Role / Title" value={data.primary_role} onChange={v => update({ primary_role: v })} placeholder="e.g. Lead Hygienist" />
      <IntakeInput label="Email" type="email" value={data.primary_email} onChange={v => update({ primary_email: v })} placeholder="email@practice.com" required />
      <IntakeInput label="Phone / Cell" type="tel" value={data.primary_phone} onChange={v => update({ primary_phone: v })} placeholder="(555) 000-0000" />
    </IntakeShell>
  );
}
