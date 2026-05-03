import { useEffect, useState } from 'react';
import { C } from '@/data/constants';
import { useIsMobile } from '@/hooks/use-mobile';
import { Logo } from '@/components/ByteSenseLogo';

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
    <div style={{ fontFamily: C.fn, background: C.dark, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '24px 16px' : '40px 24px' }}>
      <Logo size={40} light />

      <div style={{ textAlign: 'center', maxWidth: 440, marginTop: 32 }}>
        {saving ? (
          <>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
            <div style={{ fontSize: 16, color: C.ash }}>Saving your setup…</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: C.teal, textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>
              Setup Complete
            </div>
            <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: C.white, marginBottom: 14, lineHeight: 1.3 }}>
              Your practice is configured.
            </h1>
            <p style={{ fontSize: 14, color: C.ash, lineHeight: 1.75, marginBottom: 32 }}>
              ByteSense has everything it needs to get started. Your team will now go through a short training to prepare for your first patient case.
            </p>
            <button
              onClick={onFinish}
              style={{
                width: '100%', background: C.teal, color: C.white,
                border: 'none', padding: '16px 24px', fontSize: 15,
                fontWeight: 700, fontFamily: C.fn, cursor: 'pointer', borderRadius: 2,
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
