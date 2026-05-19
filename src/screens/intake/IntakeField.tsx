/** Shared form primitives for intake screens. Theme-aware (light + dark). */
import { C } from '@/data/constants';

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--bs-ash)',
  letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6,
};

const fieldBaseStyle: React.CSSProperties = {
  background: 'var(--bs-card)',
  border: '1px solid var(--bs-border)',
  color: 'var(--bs-text)',
  borderRadius: 2,
};

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}

export function IntakeInput({ label, value, onChange, placeholder, type = 'text', required }: FieldProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: C.red, marginLeft: 3 }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          ...fieldBaseStyle,
          width: '100%',
          padding: '12px 14px',
          fontSize: 14,
          fontFamily: C.fn,
          outline: 'none',
          boxSizing: 'border-box',
        }}
        onFocus={e => { e.target.style.borderColor = C.teal; }}
        onBlur={e => { e.target.style.borderColor = 'var(--bs-border)'; }}
      />
    </div>
  );
}

interface RadioGroupProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

export function IntakeRadio({ label, value, onChange, options }: RadioGroupProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      {label && (
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--bs-ash)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
          {label}
        </div>
      )}
      {options.map(o => {
        const sel = value === o.value;
        return (
          <div
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              padding: '13px 16px', marginBottom: 6, cursor: 'pointer',
              background: sel ? 'var(--bs-teal-muted)' : 'var(--bs-card)',
              border: `1.5px solid ${sel ? C.teal : 'var(--bs-border)'}`,
              display: 'flex', alignItems: 'center', gap: 12, borderRadius: 2,
              transition: 'all 0.15s',
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              border: `2px solid ${sel ? C.teal : 'var(--bs-ash)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {sel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.teal }} />}
            </div>
            <span style={{ fontSize: 14, color: sel ? 'var(--bs-text)' : 'var(--bs-text2)' }}>{o.label}</span>
          </div>
        );
      })}
    </div>
  );
}

interface MultiSelectProps {
  label?: string;
  values: string[];
  onChange: (v: string[]) => void;
  options: { value: string; label: string }[];
}

export function IntakeMultiSelect({ label, values, onChange, options }: MultiSelectProps) {
  const toggle = (v: string) => {
    onChange(values.includes(v) ? values.filter(x => x !== v) : [...values, v]);
  };
  return (
    <div style={{ marginBottom: 20 }}>
      {label && (
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--bs-ash)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
          {label}
        </div>
      )}
      {options.map(o => {
        const sel = values.includes(o.value);
        return (
          <div
            key={o.value}
            onClick={() => toggle(o.value)}
            style={{
              padding: '13px 16px', marginBottom: 6, cursor: 'pointer',
              background: sel ? 'var(--bs-teal-muted)' : 'var(--bs-card)',
              border: `1.5px solid ${sel ? C.teal : 'var(--bs-border)'}`,
              display: 'flex', alignItems: 'center', gap: 12, borderRadius: 2,
              transition: 'all 0.15s',
            }}
          >
            <div style={{
              width: 18, height: 18,
              border: `2px solid ${sel ? C.teal : 'var(--bs-ash)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              background: sel ? C.teal : 'transparent', borderRadius: 2,
            }}>
              {sel && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>✓</span>}
            </div>
            <span style={{ fontSize: 14, color: sel ? 'var(--bs-text)' : 'var(--bs-text2)' }}>{o.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function IntakeSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14, marginTop: 8 }}>
      {children}
    </div>
  );
}
