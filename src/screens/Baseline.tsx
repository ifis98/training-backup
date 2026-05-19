import { C, BL } from '@/data/constants';
import { scrollTop } from '@/lib/helpers';
import { AppState } from '@/hooks/useAppState';
import { t, Lang } from '@/data/translations';
import { useIsMobile } from '@/hooks/use-mobile';
import IntakeShell from '@/screens/intake/IntakeShell';

interface BaselineProps {
  s: AppState;
  u: (d: Partial<AppState>) => void;
  lang?: Lang;
}

export default function Baseline({ s, u, lang = 'en' }: BaselineProps) {
  const T = (key: string) => t(lang, key);
  const isMobile = useIsMobile();
  const qs = s.blQs || BL.map((v, i) => v[(s.seed + i) % v.length]);
  const q = qs[s.blIdx];
  const sel = s.bl[s.blIdx];
  const isLast = s.blIdx >= qs.length - 1;
  const totalSteps = qs.length;

  const goBack = () => {
    if (s.blIdx > 0) {
      u({ blIdx: s.blIdx - 1 });
      scrollTop();
    }
  };

  const goNext = () => {
    if (!isLast) {
      u({ blIdx: s.blIdx + 1 });
      scrollTop();
    } else {
      const score = Math.round(s.bl.reduce((a, v) => a + v * 25, 0) / qs.length);
      u({ phase: 'blR', blScore: score });
      scrollTop();
    }
  };

  return (
    <IntakeShell
      step={s.blIdx + 1}
      totalSteps={totalSteps}
      title={q.q}
      subtitle={T('no_wrong_answers')}
      onBack={s.blIdx > 0 ? goBack : undefined}
      onContinue={goNext}
      continueLabel={isLast ? T('see_results') : T('next_arrow')}
      continueDisabled={sel === undefined}
    >
      <div style={{ marginBottom: 20 }}>
        {q.opts.map((o: string, i: number) => {
          const isSel = sel === i;
          return (
            <div
              key={i}
              onClick={() => { const b = [...s.bl]; b[s.blIdx] = i; u({ bl: b }); }}
              style={{
                padding: isMobile ? '13px 14px' : '14px 16px',
                marginBottom: 6,
                cursor: 'pointer',
                background: isSel ? 'var(--bs-teal-muted)' : 'var(--bs-card)',
                border: `1.5px solid ${isSel ? C.teal : 'var(--bs-border)'}`,
                display: 'flex', alignItems: 'center', gap: 12, borderRadius: 2,
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                border: `2px solid ${isSel ? C.teal : 'var(--bs-ash)'}`,
                background: isSel ? C.teal : 'transparent',
                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isSel && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
              </div>
              <span style={{ fontSize: 14, color: isSel ? 'var(--bs-text)' : 'var(--bs-text2)' }}>{o}</span>
            </div>
          );
        })}
      </div>
    </IntakeShell>
  );
}
