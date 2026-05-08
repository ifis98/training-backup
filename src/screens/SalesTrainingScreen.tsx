import { useState } from 'react';
import Dashboard from '@/screens/Dashboard';
import { C } from '@/data/constants';
import { AppState } from '@/hooks/useAppState';
import { Role, Phase, Module } from '@/data/constants';
import { Lang } from '@/data/translations';

interface SalesTrainingScreenProps {
  s: AppState;
  u: (d: Partial<AppState>) => void;
  sRoles: Role[];
  myPH: Phase[];
  myM: Module[];
  dN: number;
  pr: number;
  allD: boolean;
  reset: () => void;
  openCoach: (mode: string) => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  onOpenPanel?: (src: string, title: string) => void;
  lang?: Lang;
}

export default function SalesTrainingScreen(props: SalesTrainingScreenProps) {
  const [view, setView] = useState<'module' | 'resources'>('module');

  const tabs = [
    { id: 'module',    label: 'Sales Training Module' },
    { id: 'resources', label: 'Sales Resources & Scripts' },
  ] as const;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Tab bar ── */}
      <div style={{
        background: 'rgba(8,8,12,0.97)',
        backdropFilter: C.blur,
        WebkitBackdropFilter: C.blur,
        borderBottom: '1px solid var(--bs-border)',
        display: 'flex',
        position: 'sticky',
        top: 0,
        zIndex: 29,
        flexShrink: 0,
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            style={{
              padding: '16px 28px',
              background: 'none',
              border: 'none',
              borderBottom: view === tab.id ? `2px solid ${C.teal}` : '2px solid transparent',
              color: view === tab.id ? C.teal : 'var(--bs-ash)',
              fontWeight: view === tab.id ? 700 : 400,
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: C.fn,
              transition: 'all 0.15s',
              letterSpacing: 0.2,
              flexShrink: 0,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {/* Training Module tab — real Dashboard with live Supabase data */}
        <div style={{ display: view === 'module' ? 'block' : 'none' }}>
          <Dashboard {...props} />
        </div>

        {/* Sales Resources tab — original HTML page (training-module section hidden) */}
        {view === 'resources' && (
          <iframe
            src="/sales-training.html?embed=resources"
            style={{ width: '100%', height: 'calc(100vh - 50px)', border: 'none', display: 'block' }}
            title="Sales Resources & Scripts"
          />
        )}
      </div>
    </div>
  );
}
