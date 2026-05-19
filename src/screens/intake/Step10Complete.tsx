import { useEffect, useState } from 'react';
import { C } from '@/data/constants';
import { useIsMobile } from '@/hooks/use-mobile';
import { Logo } from '@/components/ByteSenseLogo';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface Props {
  onFinish: () => void;
  onComplete: () => Promise<void>;
}

export default function Step10Complete({ onFinish, onComplete }: Props) {
  const isMobile = useIsMobile();
  const [saving, setSaving] = useState(true);

  useEffect(() => {
    onComplete().finally(() => setSaving(false));
  }, []);

  return (
    <div style={{ fontFamily: C.fn, background: "var(--bs-bg)", minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '24px 16px' : '40px 24px' }}>
      <Logo size={40} light />

      <div style={{ textAlign: 'center', maxWidth: 440, marginTop: 32 }}>
        {saving ? (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <Loader2 size={36} strokeWidth={1.5} color={C.teal} style={{ animation: "spin 1s linear infinite" }} />
            </div>
            <div style={{ fontSize: 16, color: 'var(--bs-ash)' }}>Saving your setup…</div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <CheckCircle2 size={48} strokeWidth={1.5} color={C.teal} />
            </div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: C.teal, textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>
              Setup Complete
            </div>
            <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: 'var(--bs-text)', marginBottom: 14, lineHeight: 1.3 }}>
              Your practice is configured.
            </h1>
            <p style={{ fontSize: 14, color: 'var(--bs-ash)', lineHeight: 1.75, marginBottom: 32 }}>
              ByteSense has everything it needs to get started. Your team will now go through a short training to prepare for your first patient case.
            </p>
            <button
              onClick={onFinish}
              style={{
                width: '100%', background: C.teal, color: '#fff',
                border: 'none', padding: '16px 24px', fontSize: 15,
                fontWeight: 700, fontFamily: C.fn, cursor: 'pointer', borderRadius: 12,
              }}
            >
              Start Training →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
