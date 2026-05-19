import { useState } from 'react';
import { useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { X, LogOut, Check, Award } from 'lucide-react';
import { C, ROLES } from '@/data/constants';
import { LANG_OPTIONS, Lang, t } from '@/data/translations';
import { AppState } from '@/hooks/useAppState';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  s: AppState;
  u: (d: Partial<AppState>) => void;
  lang: Lang;
  allComplete?: boolean;
}

export default function SettingsModal({ open, onClose, s, u, lang, allComplete }: SettingsModalProps) {
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const T = (key: string) => t(lang, key);
  const [pendingRoles, setPendingRoles] = useState<string[]>(s.roles);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = s.theme === 'dark' || (s.theme === 'system' && prefersDark);

  if (!open) return null;

  const toggleRole = (id: string) => {
    setPendingRoles(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleSaveRoles = () => {
    u({ roles: pendingRoles });
    onClose();
  };

  const handleSignOut = async () => {
    const uid = (window as any).__clerkUserId;
    if (uid) localStorage.removeItem(`bsa6_${uid}`);
    localStorage.removeItem('bsa6');
    await signOut({ redirectUrl: '/' });
  };

  const overlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    zIndex: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  };

  const panel: React.CSSProperties = {
    background: isDark ? '#141418' : '#FFFFFF',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.1)'}`,
    borderRadius: 20,
    width: '100%',
    maxWidth: 480,
    maxHeight: '90vh',
    overflowY: 'auto',
    fontFamily: C.fn,
    color: isDark ? C.white : C.dark,
    boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
  };

  const section: React.CSSProperties = {
    padding: '20px 24px',
    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
  };

  const label: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: isDark ? C.ash : C.slate,
    marginBottom: 12,
  };

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={panel}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}` }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Settings</div>
            <div style={{ fontSize: 12, color: isDark ? C.ash : C.slate, marginTop: 2 }}>Manage your preferences</div>
          </div>
          <button onClick={onClose} style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: isDark ? C.ash : C.slate }}>
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Language */}
        <div style={section}>
          <div style={label}>Language</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {LANG_OPTIONS.map(l => {
              const isActive = s.lang === l.id;
              return (
                <button
                  key={l.id}
                  onClick={() => u({ lang: l.id })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                    fontSize: 13, fontFamily: C.fn, fontWeight: isActive ? 700 : 400,
                    background: isActive
                      ? (isDark ? `${C.teal}22` : `${C.teal}18`)
                      : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
                    border: `1px solid ${isActive ? C.teal : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.09)')}`,
                    color: isActive ? C.teal : (isDark ? C.ash : C.slate),
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 16 }}>{l.flag}</span>
                  {l.label}
                  {isActive && <Check size={12} strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Appearance */}
        <div style={section}>
          <div style={label}>Appearance</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['light', 'dark', 'system'] as const).map(mode => {
              const isActive = s.theme === mode;
              return (
                <button
                  key={mode}
                  onClick={() => u({ theme: mode })}
                  style={{
                    padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                    fontSize: 13, fontFamily: C.fn, fontWeight: isActive ? 700 : 400,
                    background: isActive
                      ? (isDark ? `${C.teal}22` : `${C.teal}18`)
                      : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
                    border: `1px solid ${isActive ? C.teal : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.09)')}`,
                    color: isActive ? C.teal : (isDark ? C.ash : C.slate),
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  {isActive && <Check size={12} strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Roles */}
        <div style={section}>
          <div style={label}>Your Role(s)</div>
          <div style={{ fontSize: 12, color: isDark ? C.ash : C.slate, marginBottom: 12 }}>
            Select all roles that apply — this customises your training modules.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {ROLES.map(role => {
              const isSelected = pendingRoles.includes(role.id);
              return (
                <button
                  key={role.id}
                  onClick={() => toggleRole(role.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                    textAlign: 'left', fontFamily: C.fn,
                    background: isSelected
                      ? (isDark ? `${role.color}18` : `${role.color}10`)
                      : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'),
                    border: `1.5px solid ${isSelected ? role.color : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)')}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{role.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: isSelected ? role.color : (isDark ? C.white : C.dark), lineHeight: 1.2 }}>{role.short}</div>
                  </div>
                  {isSelected && (
                    <div style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: 999, background: role.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={10} strokeWidth={3} color="#fff" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleSaveRoles}
            disabled={pendingRoles.length === 0}
            style={{
              marginTop: 14, width: '100%', padding: '12px', borderRadius: 12, cursor: pendingRoles.length === 0 ? 'not-allowed' : 'pointer',
              background: pendingRoles.length === 0 ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)') : C.gradTeal,
              border: 'none', color: pendingRoles.length === 0 ? C.ash : '#fff',
              fontSize: 13, fontWeight: 700, fontFamily: C.fn, transition: 'all 0.15s',
            }}
          >
            {pendingRoles.length === 0 ? 'Select at least one role' : 'Save Roles'}
          </button>
        </div>

        {/* Reports & Certificates */}
        <div style={section}>
          <div style={label}>Reports &amp; Certificates</div>
          <button
            onClick={() => {
              if (!allComplete && !s.signed) return;
              u({ phase: 'report' });
              navigate('/app');
              onClose();
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              width: '100%', padding: '14px 16px', borderRadius: 12,
              cursor: allComplete || s.signed ? 'pointer' : 'not-allowed',
              background: allComplete || s.signed ? `${C.teal}15` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${allComplete || s.signed ? `${C.teal}50` : 'rgba(255,255,255,0.07)'}`,
              opacity: allComplete || s.signed ? 1 : 0.45,
              textAlign: 'left', fontFamily: C.fn, transition: 'all 0.15s',
            }}
          >
            <Award size={18} strokeWidth={1.5} color={allComplete || s.signed ? C.teal : C.ash} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: allComplete || s.signed ? C.teal : 'var(--bs-text)' }}>Training Certificate</div>
              <div style={{ fontSize: 11, color: C.ash, marginTop: 2 }}>
                {allComplete || s.signed ? 'View your results and download certificate' : 'Complete all modules & 3 simulations to unlock'}
              </div>
            </div>
          </button>
        </div>

        {/* Sign Out */}
        <div style={{ padding: '20px 24px' }}>
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              width: '100%', padding: '12px', borderRadius: 12, cursor: 'pointer',
              background: 'rgba(204,16,16,0.07)', border: '1px solid rgba(204,16,16,0.2)',
              color: '#FF5555', fontSize: 13, fontWeight: 700, fontFamily: C.fn,
            }}
          >
            <LogOut size={15} strokeWidth={2} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
