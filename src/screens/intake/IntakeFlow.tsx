/**
 * IntakeFlow — orchestrates all 10 intake steps.
 * Receives the Clerk user ID for autosave.
 * Calls onDone() when the flow is complete so Index.tsx can transition to training.
 */
import { useIntakeState } from '@/hooks/useIntakeState';
import Step01Welcome from './Step01Welcome';
import Step02DecisionMaker from './Step02DecisionMaker';
import Step03PrimaryAdvocate from './Step03PrimaryAdvocate';
import Step04SecondaryAdvocate from './Step04SecondaryAdvocate';
import Step05RoleSelect from './Step05RoleSelect';
import Step06NightGuard from './Step06NightGuard';
import Step07Billing from './Step07Billing';
import Step08OfficeWorkflow from './Step08OfficeWorkflow';
import Step09FirstCase from './Step09FirstCase';
import Step10Complete from './Step10Complete';

interface Props {
  clerkUserId: string | null;
  /** Called when intake is complete; receives the selected staff roles so
   *  the training flow can be pre-seeded with role data. */
  onDone: (staffRoles: string[]) => void;
}

export default function IntakeFlow({ clerkUserId, onDone }: Props) {
  const { step, data, update, next, back, complete, totalSteps } = useIntakeState(clerkUserId);

  const sharedProps = { step, totalSteps, data, update };

  switch (step) {
    case 1:
      return <Step01Welcome onStart={next} />;
    case 2:
      return <Step02DecisionMaker {...sharedProps} onBack={back} onNext={next} />;
    case 3:
      return <Step03PrimaryAdvocate {...sharedProps} onBack={back} onNext={next} />;
    case 4:
      return <Step04SecondaryAdvocate {...sharedProps} onBack={back} onNext={next} />;
    case 5:
      return <Step05RoleSelect {...sharedProps} onBack={back} onNext={next} />;
    case 6:
      return <Step06NightGuard {...sharedProps} onBack={back} onNext={next} />;
    case 7:
      return <Step07Billing {...sharedProps} onBack={back} onNext={next} />;
    case 8:
      return <Step08OfficeWorkflow {...sharedProps} onBack={back} onNext={next} />;
    case 9:
      return <Step09FirstCase {...sharedProps} onBack={back} onNext={next} />;
    case 10:
      return (
        <Step10Complete
          onComplete={complete}
          onFinish={() => onDone(data.staff_roles)}
        />
      );
    default:
      return null;
  }
}
