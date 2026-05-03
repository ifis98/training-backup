import IntakeShell from './IntakeShell';
import { IntakeMultiSelect } from './IntakeField';
import { IntakeData } from '@/hooks/useIntakeState';

interface Props {
  step: number; totalSteps: number;
  data: IntakeData;
  update: (d: Partial<IntakeData>) => void;
  onBack: () => void; onNext: () => void;
}

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Practice Owner / Dentist' },
  { value: 'associate', label: 'Associate Dentist' },
  { value: 'hygienist', label: 'Hygienist' },
  { value: 'tc', label: 'Treatment Coordinator' },
  { value: 'manager', label: 'Office Manager' },
  { value: 'assistant', label: 'Dental Assistant' },
  { value: 'front', label: 'Front Desk' },
];

export default function Step05RoleSelect({ step, totalSteps, data, update, onBack, onNext }: Props) {
  return (
    <IntakeShell
      step={step} totalSteps={totalSteps}
      title="What is your role in the practice?"
      subtitle="Select all that apply. This personalizes your training path."
      onBack={onBack} onContinue={onNext}
      continueDisabled={data.staff_roles.length === 0}
    >
      <IntakeMultiSelect
        values={data.staff_roles}
        onChange={v => update({ staff_roles: v })}
        options={ROLE_OPTIONS}
      />
    </IntakeShell>
  );
}
