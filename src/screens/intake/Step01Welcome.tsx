import { C } from '@/data/constants';
import { useIsMobile } from '@/hooks/use-mobile';
import { Logo } from '@/components/ByteSenseLogo';

interface Props { onStart: () => void; }

export default function Step01Welcome({ onStart }: Props) {
  const isMobile = useIsMobile();

  return (
    <div style={{ fontFamily: C.fn, background: 'var(--bs-bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: isMobile ? '20px 16px' : '24px 32px' }}>
        <Logo size={28} light />
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '0 16px 80px' : '0 24px' }}>
        <div style={{ maxWidth: 520, width: '100%' }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: C.teal, textTransform: 'uppercase', fontWeight: 700, marginBottom: 14 }}>
            Practice Setup
          </div>
          <h1 style={{ fontSize: isMobile ? 26 : 32, fontWeight: 800, color: 'var(--bs-text)', lineHeight: 1.25, marginBottom: 16 }}>
            Get Your Practice Ready for ByteSense
          </h1>
          <p style={{ fontSize: 15, color: 'var(--bs-ash)', lineHeight: 1.75, marginBottom: 32 }}>
            This takes about <strong style={{ color: 'var(--bs-text)' }}>2–3 minutes</strong>. No prep needed — just answer based on your current setup.
            <br /><br />
            We'll ask a few quick questions to understand your practice so we can configure everything correctly for you.
            Once you complete this, we'll take care of the rest — including staff training, scanner & lab setup, case workflow, and ongoing support.
          </p>

          <div style={{ background: 'var(--bs-bg2)', border: '1px solid var(--bs-border)', padding: isMobile ? '16px' : '20px', marginBottom: 32, borderLeft: `3px solid ${C.teal}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
              By the end, your practice will be ready to:
            </div>
            {[
              'Start your first ByteSense case',
              'Use it with a real patient',
              'Begin integrating it into your daily workflow',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                <span style={{ color: C.teal, fontSize: 14, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 13, color: 'var(--bs-text)', lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onStart}
            style={{
              width: '100%', background: C.teal, color: '#fff',
              border: 'none', padding: '16px 24px', fontSize: 15,
              fontWeight: 700, fontFamily: C.fn, cursor: 'pointer', borderRadius: 2,
            }}
          >
            Start Setup →
          </button>
        </div>
      </div>
    </div>
  );
}
