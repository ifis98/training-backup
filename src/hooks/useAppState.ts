import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ROLES, PH, BL } from '@/data/constants';
import { M } from '@/data/modules';
import { ShuffledQuestion, shuffleQuestion } from '@/lib/helpers';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'bsa6';
const SYNC_DEBOUNCE = 2000;

export interface AppState {
  phase: string;
  name: string;
  roles: string[];
  practice: string;
  seed: number;
  bl: number[];
  blIdx: number;
  blScore: number | null;
  blQs: any[] | null;
  curMod: string | null;
  done: string[];
  ckA: number | null;
  mQs: Record<string, ShuffledQuestion>;
  simMsgs: { r: string; t: string }[];
  simIn: string;
  simP: number;
  lst: boolean;
  xp: number;
  spk: boolean;
  signed: boolean;
  lang: string;
  intakeDone: boolean;
  mainBlocker: string;
  monthlyVolume: string;
}

const defaultState: AppState = {
  phase: 'splash',
  name: '',
  roles: [],
  practice: '',
  seed: 0,
  bl: [],
  blIdx: 0,
  blScore: null,
  blQs: null,
  curMod: null,
  done: [],
  ckA: null,
  mQs: {},
  simMsgs: [],
  simIn: '',
  simP: 0,
  lst: false,
  xp: 0,
  spk: false,
  signed: false,
  lang: 'en',
  intakeDone: false,
  mainBlocker: '',
  monthlyVolume: '',
};

/** Pass the Clerk user ID so we can sync to the DB without calling supabase.auth */
export function useAppState(clerkUserId: string | null = null) {
  const [s, setS] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d?.phase && d.phase !== 'splash') {
          return {
            ...defaultState,
            ...d,
            phase: d.phase === 'module' ? 'dashboard' : d.phase,
            lst: false,
          };
        }
      }
    } catch {}
    return defaultState;
  });

  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const u = useCallback((d: Partial<AppState>) => {
    setS(p => ({ ...p, ...d }));
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (s.phase !== 'splash') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...s, lst: false }));
      } catch {}
    }
  }, [s]);

  // Debounced sync to database
  useEffect(() => {
    if (!clerkUserId || s.phase === 'splash') return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      try {
        const payload = {
          training_roles: s.roles,
          baseline_score: s.blScore,
          done_modules: s.done,
          xp: s.xp,
          sim_patients: s.simP,
          signed: s.signed,
          completed_at: s.signed ? new Date().toISOString() : null,
          name: s.name,
          practice: s.practice,
        };
        await supabase
          .from('training_progress')
          .upsert({ clerk_user_id: clerkUserId, ...payload }, { onConflict: 'clerk_user_id' });
      } catch {}
    }, SYNC_DEBOUNCE);
    return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
  }, [clerkUserId, s.roles, s.blScore, s.done, s.xp, s.simP, s.signed, s.name, s.practice]);

  // Load from DB on mount (when we have a Clerk user)
  useEffect(() => {
    if (!clerkUserId) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('training_progress')
          .select('*')
          .eq('clerk_user_id', clerkUserId)
          .maybeSingle();

        if (data) {
          const restoredName = (data as any).name || '';
          const restoredPractice = (data as any).practice || '';
          setS(prev => {
            const hasProgress = data.done_modules?.length > 0 || data.training_roles?.length > 0;
            return {
              ...prev,
              roles: data.training_roles?.length ? data.training_roles : prev.roles,
              blScore: data.baseline_score ?? prev.blScore,
              done: data.done_modules?.length ? data.done_modules : prev.done,
              xp: data.xp || prev.xp,
              simP: data.sim_patients || prev.simP,
              signed: data.signed || prev.signed,
              name: restoredName || prev.name,
              practice: restoredPractice || prev.practice,
              phase: (restoredName && hasProgress && prev.phase === 'splash') ? 'dashboard' : prev.phase,
            };
          });
        }
      } catch {}
    })();
  }, [clerkUserId]);

  const sRoles = useMemo(() => ROLES.filter(r => s.roles.includes(r.id)), [s.roles]);
  const sc = s.blScore || 0;
  const myPH = useMemo(() => PH.filter(p => (p.minScore === -1 ? sc <= p.maxScore : true)), [sc]);
  const myM = useMemo(() => M.filter(m => {
    const phOk = myPH.some(p => p.id === m.phase);
    const roleOk = m.roles.includes('all') || m.roles.some(r => s.roles.includes(r));
    return phOk && roleOk;
  }), [myPH, s.roles]);

  const dN = useMemo(() => s.done.filter(c => myM.some(m => m.id === c)).length, [s.done, myM]);
  const pr = myM.length > 0 ? Math.round((dN / myM.length) * 100) : 0;
  const allD = dN === myM.length && myM.length > 0;

  const getQuestion = useCallback((id: string): ShuffledQuestion | null => {
    if (s.mQs[id]) return s.mQs[id];
    const mod = M.find(m => m.id === id);
    if (!mod?.checks?.length) return null;
    const p = mod.checks[s.seed % mod.checks.length];
    const sq = shuffleQuestion(p, s.seed + id.charCodeAt(0) * 37);
    setS(prev => ({ ...prev, mQs: { ...prev.mQs, [id]: sq } }));
    return sq;
  }, [s.mQs, s.seed]);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setS(defaultState);
  }, []);

  return { s, u, sRoles, sc, myPH, myM, dN, pr, allD, getQuestion, reset };
}
