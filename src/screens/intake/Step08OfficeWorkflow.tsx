import IntakeShell from './IntakeShell';
import { IntakeRadio, IntakeSectionTitle } from './IntakeField';
import { IntakeData } from '@/hooks/useIntakeState';

interface Props {
  step: number; totalSteps: number;
  data: IntakeData;
  update: (d: Partial<IntakeData>) => void;
  onBack: () => void; onNext: () => void;
}

const SUBMITTER_OPTIONS = [
  { value: 'dentist', label: 'Dentist' },
  { value: 'manager', label: 'Office Manager' },
  { value: 'hygienist', label: 'Hygienist' },
  { value: 'assistant', label: 'Dental Assistant' },
  { value: 'scan_coordinator', label: 'Scan Coordinator' },
  { value: 'not_sure', label: 'Not sure yet' },
];

const STAFF_TRAINING_OPTIONS = [
  { value: 'yes', label: 'Yes — add staff members now' },
  { value: 'no', label: 'No — just me for now' },
  { value: 'later', label: 'Later — I\'ll add them after setup' },
];

export default function Step08OfficeWorkflow({ step, totalSteps, data, update, onBack, onNext }: Props) {
  const canContinue = !!(data.who_submits_cases && data.add_staff_to_training);

  return (
    <IntakeShell
      step={step} totalSteps={totalSteps}
      title="Office Workflow Setup"
      subtitle="This helps us assign the right training and configure case submission correctly."
      onBack={onBack} onContinue={onNext}
      continueDisabled={!canContinue}
    >
      <IntakeSectionTitle>Who will be responsible for submitting ByteSense cases?</IntakeSectionTitle>
      <IntakeRadio value={data.who_submits_cases} onChange={v => update({ who_submits_cases: v })} options={SUBMITTER_OPTIONS} />

      <IntakeSectionTitle>Do you want staff members added to this training?</IntakeSectionTitle>
      <IntakeRadio value={data.add_staff_to_training} onChange={v => update({ add_staff_to_training: v })} options={STAFF_TRAINING_OPTIONS} />
    </IntakeShell>
  );
}
