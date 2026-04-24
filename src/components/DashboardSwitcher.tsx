import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Shield, ChevronUp } from 'lucide-react';
import { C } from '@/data/constants';

export default function DashboardSwitcher() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const items = [
    { label: 'Owner Dashboard', path: '/owner', icon: LayoutDashboard, match: pathname === '/owner' || pathname === '/' },
    { label: 'Staff View', path: '/staff', icon: Users, match: pathname === '/staff' },
    { label: 'ByteSense Admin', path: '/bytesense-admin', icon: Shield, match: pathname === '/bytesense-admin' },
  ];
  const active = items.find(i => i.match) || items[0];

  return (
    <div style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 200, fontFamily: C.fn }}>
      {open && (
        <div style={{
          background: C.dark2, border: `1px solid ${C.borderD}`, borderRadius: C.radiusSm,
          marginBottom: 8, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', minWidth: 220,
        }}>
          {items.map(i => {
            const Icon = i.icon;
            return (
              <button key={i.path} onClick={() => { nav(i.path); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '12px 14px', background: i.match ? 'rgba(204,16,16,0.15)' : 'transparent',
                  color: i.match ? C.white : C.ash, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, fontFamily: C.fn, textAlign: 'left',
                  borderBottom: `1px solid ${C.borderD}`,
                }}>
                <Icon size={16} /> {i.label}
              </button>
            );
          })}
        </div>
      )}
      <button onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
          background: C.gradRed, color: '#fff', border: 'none', borderRadius: 999,
          cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: C.fn,
          letterSpacing: 0.5, textTransform: 'uppercase', boxShadow: '0 8px 24px rgba(204,16,16,0.4)',
        }}>
        <active.icon size={14} /> {active.label} <ChevronUp size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
      </button>
    </div>
  );
}
