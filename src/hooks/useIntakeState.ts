import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'bsi1';
const TOTAL_STEPS = 10;

export interface IntakeData {
  // step 0 — practice info
  practice_name: string;
  // portal account — contact
  fName: string;
  lName: string;
  preferredPhoneNumber: string;
  companyName: string;
  officeEmail: string;
  primaryContactName: string;
  primaryContactRole: string;
  primaryContactPhoneNumber: string;
  preferredContactMethodPhone: boolean;
  preferredContactMethodEmail: boolean;
  // portal account — shipping
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
  attentionRecipientName: string;
  preferredNotificationMethod: string;
  // portal account — operational
  estimatedOrdersPerMonth: string;
  dentalLicenseNumber: string;
  // legal + auth
  termsAccepted: boolean;
  webappPassword: string;
  // step 2 — decision maker
  is_decision_maker: string;
  codecision_name: string;
  codecision_role: string;
  codecision_email: string;
  codecision_phone: string;
  // step 3 — primary advocate
  primary_name: string;
  primary_role: string;
  primary_email: string;
  primary_phone: string;
  // step 4 — secondary advocate
  secondary_name: string;
  secondary_role: string;
  secondary_email: string;
  secondary_phone: string;
  // step 5 — role
  staff_roles: string[];
  // step 6 — night guard
  monthly_volume: string;
  who_presents: string;
  // step 7 — billing
  who_bills: string;
  payment_collection: string;
  wants_billing_guidance: string;
  // step 8 — office workflow
  who_submits_cases: string;
  scanner_type: string;
  add_staff_to_training: string;
  // step 9 — first case
  has_patient_in_mind: string;
  ideal_patient_profile: string[];
  first_case_timeline: string;
  main_blocker: string;
}

const defaultData: IntakeData = {
  practice_name: '',
  fName: '',
  lName: '',
  preferredPhoneNumber: '',
  companyName: '',
  officeEmail: '',
  primaryContactName: '',
  primaryContactRole: '',
  primaryContactPhoneNumber: '',
  preferredContactMethodPhone: false,
  preferredContactMethodEmail: false,
  addressLine1: '',
  city: '',
  state: '',
  zipCode: '',
  attentionRecipientName: '',
  preferredNotificationMethod: '',
  estimatedOrdersPerMonth: '',
  dentalLicenseNumber: '',
  termsAccepted: false,
  webappPassword: '',
  is_decision_maker: '',
  codecision_name: '',
  codecision_role: '',
  codecision_email: '',
  codecision_phone: '',
  primary_name: '',
  primary_role: '',
  primary_email: '',
  primary_phone: '',
  secondary_name: '',
  secondary_role: '',
  secondary_email: '',
  secondary_phone: '',
  staff_roles: [],
  monthly_volume: '',
  who_presents: '',
  who_bills: '',
  payment_collection: '',
  wants_billing_guidance: '',
  who_submits_cases: '',
  scanner_type: '',
  add_staff_to_training: '',
  has_patient_in_mind: '',
  ideal_patient_profile: [],
  first_case_timeline: '',
  main_blocker: '',
};

export function useIntakeState(clerkUserId: string | null, opts: { persist?: boolean } = {}) {
  // persist=false (portal re-entry mode) makes this hook side-effect-free:
  // no localStorage, no practice_intake autosave, no complete() write — so a
  // legacy user completing only the portal steps can never overwrite their
  // existing intake row with empty training fields.
  const persist = opts.persist !== false;

  const [step, setStep] = useState(() => {
    if (!persist) return 1;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).step ?? 1;
    } catch {}
    return 1;
  });

  const [data, setData] = useState<IntakeData>(() => {
    if (!persist) return defaultData;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...defaultData, ...(JSON.parse(saved).data ?? {}) };
    } catch {}
    return defaultData;
  });

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = useCallback((patch: Partial<IntakeData>) => {
    setData(prev => ({ ...prev, ...patch }));
  }, []);

  const next = useCallback(() => {
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
  }, []);

  const back = useCallback(() => {
    setStep(s => Math.max(s - 1, 1));
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!persist) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, data })); } catch {}
  }, [step, data, persist]);

  // Autosave to Supabase (debounced)
  useEffect(() => {
    if (!clerkUserId || !persist) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await supabase
          .from('practice_intake')
          .upsert(
            { clerk_user_id: clerkUserId, current_step: step, ...data },
            { onConflict: 'clerk_user_id' }
          );
      } catch {}
    }, 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [clerkUserId, step, data, persist]);

  const complete = useCallback(async () => {
    if (!clerkUserId || !persist) return;
    try {
      await supabase
        .from('practice_intake')
        .upsert(
          { clerk_user_id: clerkUserId, current_step: TOTAL_STEPS, intake_complete: true, ...data },
          { onConflict: 'clerk_user_id' }
        );
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, [clerkUserId, data, persist]);

  return { step, data, update, next, back, complete, totalSteps: TOTAL_STEPS };
}
