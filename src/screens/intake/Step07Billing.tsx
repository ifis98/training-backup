import IntakeShell from './IntakeShell';
import { IntakeRadio, IntakeSectionTitle } from './IntakeField';
import { IntakeData } from '@/hooks/useIntakeState';

interface Props {
  step: number; totalSteps: number;
  data: IntakeData;
  update: (d: Partial<IntakeData>) => void;
  onBack: () => void; onNext: () => void;
}

const BILLER_OPTIONS = [
  { value: 'dentist', label: 'Dentist' },
  { value: 'manager', label: 'Office Manager' },
  { value: 'tc', label: 'Treatment Coordinator' },
  { value: 'front', label: 'Front Desk' },
  { value: 'other', label: 'Other' },
];

const PAYMENT_OPTIONS = [
  { value: 'upfront', label: 'Upfront' },
  { value: 'deposit', label: 'Deposit + balance at delivery' },
  { value: 'insurance', label: 'Insurance submission' },
  { value: 'other', label: 'Other' },
];

const GUIDANCE_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not_sure', label: 'Not sure' },
];

export default function Step07Billing({ step, totalSteps, data, update, onBack, onNext }: Props) {
  const canContinue = !!(data.who_bills && data.payment_collection && data.wants_billing_guidance);

  return (
    <IntakeShell
      step={step} totalSteps={totalSteps}
      title="Billing Setup"
      subtitle="Understanding how payment is collected helps ByteSense provide the right guidance for your team."
      onBack={onBack} onContinue={onNext}
      continueDisabled={!canContinue}
    >
      <IntakeSectionTitle>Who handles billing / payment collection for appliance cases?</IntakeSectionTitle>
      <IntakeRadio value={data.who_bills} onChange={v => update({ who_bills: v })} options={BILLER_OPTIONS} />

      <IntakeSectionTitle>How do you usually collect payment for night guards?</IntakeSectionTitle>
      <IntakeRadio value={data.payment_collection} onChange={v => update({ payment_collection: v })} options={PAYMENT_OPTIONS} />

      <IntakeSectionTitle>Do you want ByteSense to provide pricing / billing guidance?</IntakeSectionTitle>
      <IntakeRadio value={data.wants_billing_guidance} onChange={v => update({ wants_billing_guidance: v })} options={GUIDANCE_OPTIONS} />
    </IntakeShell>
  );
}
