import IntakeShell from './IntakeShell';
import { IntakeRadio, IntakeMultiSelect, IntakeSectionTitle } from './IntakeField';
import { IntakeData } from '@/hooks/useIntakeState';

interface Props {
  step: number; totalSteps: number;
  data: IntakeData;
  update: (d: Partial<IntakeData>) => void;
  onBack: () => void; onNext: () => void;
}

const PATIENT_OPTIONS = [
  { value: 'yes', label: 'Yes — I have someone in mind' },
  { value: 'no', label: 'No — not yet' },
  { value: 'not_sure', label: 'Not sure' },
];

const PROFILE_OPTIONS = [
  { value: 'existing_bruxism', label: 'Existing bruxism patient' },
  { value: 'visible_wear', label: 'Patient with visible wear' },
  { value: 'considering_guard', label: 'Patient already considering a night guard' },
  { value: 'health_sleep', label: 'Patient interested in health / sleep data' },
  { value: 'premium_ffs', label: 'Premium or fee-for-service patient' },
  { value: 'not_sure', label: 'Not sure' },
];

const TIMELINE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This week' },
  { value: 'two_weeks', label: 'Within 2 weeks' },
  { value: 'not_sure', label: 'Not sure yet' },
];

const BLOCKER_OPTIONS = [
  { value: 'explain_patients', label: 'Unsure how to explain it to patients' },
  { value: 'submit_case', label: 'Unsure how to submit the case' },
  { value: 'staff_training', label: 'Staff needs training first' },
  { value: 'pricing', label: 'Need pricing guidance' },
  { value: 'clinical', label: 'Need clinical positioning help' },
  { value: 'technical', label: 'Need technical support' },
  { value: 'nothing', label: 'Nothing — ready to start' },
];

export default function Step09FirstCase({ step, totalSteps, data, update, onBack, onNext }: Props) {
  const canContinue = !!(data.has_patient_in_mind && data.first_case_timeline && data.main_blocker);

  return (
    <IntakeShell
      step={step} totalSteps={totalSteps}
      title="First Case Readiness"
      subtitle="This is the most important section. Your answers determine how ByteSense supports your launch."
      onBack={onBack} onContinue={onNext}
      continueDisabled={!canContinue}
    >
      <IntakeSectionTitle>Do you already have a patient in mind for your first ByteSense case?</IntakeSectionTitle>
      <IntakeRadio value={data.has_patient_in_mind} onChange={v => update({ has_patient_in_mind: v })} options={PATIENT_OPTIONS} />

      <IntakeSectionTitle>Ideal first patient profile — select all that apply</IntakeSectionTitle>
      <IntakeMultiSelect
        values={data.ideal_patient_profile}
        onChange={v => update({ ideal_patient_profile: v })}
        options={PROFILE_OPTIONS}
      />

      <IntakeSectionTitle>When do you expect to start your first case?</IntakeSectionTitle>
      <IntakeRadio value={data.first_case_timeline} onChange={v => update({ first_case_timeline: v })} options={TIMELINE_OPTIONS} />

      <IntakeSectionTitle>What would stop your office from starting the first case?</IntakeSectionTitle>
      <IntakeRadio value={data.main_blocker} onChange={v => update({ main_blocker: v })} options={BLOCKER_OPTIONS} />
    </IntakeShell>
  );
}
