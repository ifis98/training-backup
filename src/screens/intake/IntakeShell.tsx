/**
 * IntakeShell — wraps every intake step with consistent layout:
 * progress bar, step counter, title, back button, and Continue CTA.
 */
import { C } from '@/data/constants';
import { useIsMobile } from '@/hooks/use-mobile';
import { Logo } from '@/components/ByteSenseLogo';

interface IntakeShellProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onContinue: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  children: React.ReactNode;
}

export default function IntakeShell({
  step, totalSteps, title, subtitle, onBack, onContinue,
  continueLabel = 'Continue', continueDisabled = false, children,
}: IntakeShellProps) {
  const isMobile = useIsMobile();
  const pct = Math.round(((step - 1) / totalSteps) * 100);

  return (
    <div style={{ fontFamily: C.fn, background: 'var(--bs-bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ padding: isMobile ? '14px 16px' : '16px 24px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--bs-border)' }}>
        <Logo size={24} light />
        <div style={{ flex: 1 }}>
          {/* Progress bar */}
          <div style={{ height: 3, background: 'var(--bs-bg2)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: C.teal, transition: 'width 0.4s ease', borderRadius: 2 }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--bs-ash)', marginTop: 5, letterSpacing: 1 }}>
            STEP {step} OF {totalSteps}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '28px 16px 120px' : '40px 0 100px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: isMobile ? '0' : '0 24px' }}>
          <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: 'var(--bs-text)', marginBottom: subtitle ? 8 : 24, lineHeight: 1.3 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: 14, color: 'var(--bs-ash)', lineHeight: 1.7, marginBottom: 28, maxWidth: 460 }}>
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>

      {/* Bottom action bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: isMobile ? '12px 16px' : '16px 24px',
        background: 'var(--bs-glass)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--bs-border)',
        display: 'flex', gap: 10, maxWidth: 560, margin: '0 auto',
        width: '100%', boxSizing: 'border-box',
      }}>
        {onBack && (
          <button onClick={onBack} style={{
            background: 'transparent', border: '1px solid var(--bs-border)',
            color: 'var(--bs-ash)', padding: '13px 20px', fontSize: 13, fontWeight: 700,
            fontFamily: C.fn, cursor: 'pointer', borderRadius: 2,
          }}>
            Back
          </button>
        )}
        <button
          onClick={onContinue}
          disabled={continueDisabled}
          style={{
            flex: 1, background: continueDisabled ? 'var(--bs-bg3)' : C.teal,
            color: continueDisabled ? 'var(--bs-ash)' : '#fff',
            border: 'none', padding: '13px 20px', fontSize: 14,
            fontWeight: 700, fontFamily: C.fn,
            cursor: continueDisabled ? 'not-allowed' : 'pointer', borderRadius: 2,
            transition: 'background 0.2s',
          }}
        >
          {continueLabel}
        </button>
      </div>
    </div>
  );
}
