import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'bsi1';
const TOTAL_STEPS = 10;

export interface IntakeData {
  // step 0 — practice info
  practice_name: string;
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
  add_staff_to_training: string;
  // step 9 — first case
  has_patient_in_mind: string;
  ideal_patient_profile: string[];
  first_case_timeline: string;
  main_blocker: string;
}

const defaultData: IntakeData = {
  practice_name: '',
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
  add_staff_to_training: '',
  has_patient_in_mind: '',
  ideal_patient_profile: [],
  first_case_timeline: '',
  main_blocker: '',
};

export function useIntakeState(clerkUserId: string | null) {
  const [step, setStep] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).step ?? 1;
    } catch {}
    return 1;
  });

  const [data, setData] = useState<IntakeData>(() => {
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
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, data })); } catch {}
  }, [step, data]);

  // Autosave to Supabase (debounced)
  useEffect(() => {
    if (!clerkUserId) return;
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
  }, [clerkUserId, step, data]);

  const complete = useCallback(async () => {
    if (!clerkUserId) return;
    try {
      await supabase
        .from('practice_intake')
        .upsert(
          { clerk_user_id: clerkUserId, current_step: TOTAL_STEPS, intake_complete: true, ...data },
          { onConflict: 'clerk_user_id' }
        );
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, [clerkUserId, data]);

  return { step, data, update, next, back, complete, totalSteps: TOTAL_STEPS };
}
