import { useState, useEffect } from 'react';
import { AppState } from '@/hooks/useAppState';
import { Lang } from '@/data/translations';
import Simulation from '@/screens/Simulation';
import AICoach from '@/components/AICoach';
import { C } from '@/data/constants';
import { Bot, Brain } from 'lucide-react';

interface Props {
  s: AppState;
  u: (d: Partial<AppState>) => void;
  lang: Lang;
}

const SIDEBAR_W = 260;

export default function RoleplayHub({ s, u, lang }: Props) {
  const [active, setActive] = useState<'simulations' | 'coach' | null>(null);

  // Tell AICoach to offset by the roleplay sidebar width, without touching --bs-sidebar-w
  // (which drives the main content marginLeft and must stay at the app sidebar width)
  useEffect(() => {
    document.documentElement.style.setProperty('--bs-roleplay-w', `${SIDEBAR_W}px`);
    return () => {
      document.documentElement.style.setProperty('--bs-roleplay-w', '0px');
    };
  }, []);

  const navItems = [
    { id: 'simulations' as const, icon: Bot,   label: 'AI Simulations' },
    { id: 'coach'       as const, icon: Brain, label: 'AI Coach' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: C.fn }}>

      {/* ── Roleplay sidebar ── */}
      <div style={{
        width: SIDEBAR_W, minWidth: SIDEBAR_W, flexShrink: 0,
        background: 'var(--bs-bg2)', borderRight: '1px solid var(--bs-border)',
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid var(--bs-border)' }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--bs-text)', marginBottom: 8 }}>
            byte<span style={{ color: '#E63434' }}>Sense</span>
          </div>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: 2, color: '#D01B1B',
            background: 'var(--bs-red-muted)', border: '1px solid var(--bs-red-border)', padding: '3px 10px', display: 'inline-block',
          }}>
            BETA PARTNER
          </div>
        </div>

        {/* Nav */}
        <div style={{ padding: '16px 0', flex: 1 }}>
          <div style={{
            padding: '8px 24px 4px', fontSize: 9, fontWeight: 700,
            letterSpacing: 2.5, color: 'var(--bs-ash)', textTransform: 'uppercase',
          }}>
            Roleplay Tools
          </div>

          {navItems.map(item => {
            const isActive = active === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setActive(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 24px', fontSize: 13, fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#E63434' : 'var(--bs-ash)',
                  cursor: 'pointer',
                  borderLeft: isActive ? '2px solid #D01B1B' : '2px solid transparent',
                  background: isActive ? 'var(--bs-red-muted)' : 'transparent',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bs-bg3)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: isActive ? '#E63434' : '#555555', flexShrink: 0,
                }} />
                {item.label}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--bs-border)' }}>
          <div style={{ background: 'var(--bs-red-muted)', border: '1px solid var(--bs-red-border)', padding: 14 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: '#E63434', fontWeight: 700, marginBottom: 6 }}>
              CONTACT SUPPORT
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bs-text)', marginBottom: 2 }}>(855) 301-0424</div>
            <div style={{ fontSize: 13, color: 'var(--bs-ash)' }}>support@bytesense.ai</div>
          </div>
        </div>
      </div>

      {/* ── Content area ──
          transform: translate(0) creates a new containing block for position:fixed
          children (Simulation's header/footer, AICoach panel), keeping them within this column.
          --bs-sidebar-w / --bs-roleplay-w zeroed so AICoach left:0 = left edge of this column. ── */}
      <div style={{
        flex: 1, minWidth: 0,
        transform: 'translate(0)',
        overflow: 'hidden',
        position: 'relative',
        ['--bs-sidebar-w' as any]: '0px',
        ['--bs-roleplay-w' as any]: '0px',
      }}>
        {active === 'simulations' ? (
          <Simulation s={s} u={u} lang={lang} />
        ) : active === 'coach' ? (
          <AICoach isOpen={true} onClose={() => setActive(null)} initialMode="general" lang={lang} />
        ) : (
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 20,
            background: 'var(--bs-bg)',
          }}>
            <div style={{ fontSize: 32, opacity: 0.15 }}>◈</div>
            <div style={{ fontSize: 14, color: 'var(--bs-ash)', textAlign: 'center', lineHeight: 1.6 }}>
              Select a tool from the sidebar<br />
              <span style={{ fontSize: 12, opacity: 0.6 }}>AI Simulations or AI Coach</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
