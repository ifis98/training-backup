import IntakeShell from './IntakeShell';
import { IntakeRadio, IntakeSectionTitle } from './IntakeField';
import { IntakeData } from '@/hooks/useIntakeState';

interface Props {
  step: number; totalSteps: number;
  data: IntakeData;
  update: (d: Partial<IntakeData>) => void;
  onBack: () => void; onNext: () => void;
}

const VOLUME_OPTIONS = [
  { value: '0-2', label: '0–2 per month' },
  { value: '3-5', label: '3–5 per month' },
  { value: '6-10', label: '6–10 per month' },
  { value: '10+', label: '10+ per month' },
];

const PRESENTER_OPTIONS = [
  { value: 'dentist', label: 'Dentist' },
  { value: 'associate', label: 'Associate' },
  { value: 'hygienist', label: 'Hygienist' },
  { value: 'tc', label: 'Treatment Coordinator' },
  { value: 'manager', label: 'Office Manager' },
  { value: 'other', label: 'Other' },
];

export default function Step06NightGuard({ step, totalSteps, data, update, onBack, onNext }: Props) {
  const canContinue = !!(data.monthly_volume && data.who_presents);

  return (
    <IntakeShell
      step={step} totalSteps={totalSteps}
      title="Current Night Guard Workflow"
      subtitle="Tell us how night guards are currently handled so we can slot ByteSense into your existing flow."
      onBack={onBack} onContinue={onNext}
      continueDisabled={!canContinue}
    >
      <IntakeSectionTitle>How many night guards do you deliver per month?</IntakeSectionTitle>
      <IntakeRadio value={data.monthly_volume} onChange={v => update({ monthly_volume: v })} options={VOLUME_OPTIONS} />

      <IntakeSectionTitle>Who usually presents night guard treatment to patients?</IntakeSectionTitle>
      <IntakeRadio value={data.who_presents} onChange={v => update({ who_presents: v })} options={PRESENTER_OPTIONS} />
    </IntakeShell>
  );
}
