import IntakeShell from './IntakeShell';
import { IntakeRadio, IntakeInput, IntakeSectionTitle } from './IntakeField';
import { IntakeData } from '@/hooks/useIntakeState';

interface Props {
  step: number; totalSteps: number;
  data: IntakeData;
  update: (d: Partial<IntakeData>) => void;
  onBack: () => void; onNext: () => void;
}

const DM_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'shared', label: 'Shared decision maker' },
];

export default function Step02DecisionMaker({ step, totalSteps, data, update, onBack, onNext }: Props) {
  const needsContact = data.is_decision_maker === 'no' || data.is_decision_maker === 'shared';
  const canContinue = !!data.is_decision_maker;

  return (
    <IntakeShell
      step={step} totalSteps={totalSteps}
      title="Are you the primary decision maker for your office?"
      onBack={onBack} onContinue={onNext}
      continueDisabled={!canContinue}
    >
      <IntakeRadio value={data.is_decision_maker} onChange={v => update({ is_decision_maker: v })} options={DM_OPTIONS} />

      {needsContact && (
        <>
          <IntakeSectionTitle>Who else should be included in setup decisions?</IntakeSectionTitle>
          <IntakeInput label="Name" value={data.codecision_name} onChange={v => update({ codecision_name: v })} placeholder="Full name" />
          <IntakeInput label="Role" value={data.codecision_role} onChange={v => update({ codecision_role: v })} placeholder="e.g. Office Manager" />
          <IntakeInput label="Email" type="email" value={data.codecision_email} onChange={v => update({ codecision_email: v })} placeholder="email@practice.com" />
          <IntakeInput label="Phone" type="tel" value={data.codecision_phone} onChange={v => update({ codecision_phone: v })} placeholder="(555) 000-0000" />
        </>
      )}
    </IntakeShell>
  );
}
