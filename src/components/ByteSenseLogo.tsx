import { C } from '@/data/constants';

export const Logo = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M16 1L29 8.5V23.5L16 31L3 23.5V8.5L16 1Z" fill="url(#rg)" />
    <path d="M16 8L23 12V20L16 24L9 20V12L16 8Z" fill="white" />
    <defs>
      <linearGradient id="rg" x1="3" y1="1" x2="29" y2="31">
        <stop stopColor="#FF3030" />
        <stop offset="1" stopColor="#990000" />
      </linearGradient>
    </defs>
  </svg>
);

export const LogoText = ({ size = 24 }: { size?: number }) => (
  <span style={{ fontSize: size, fontWeight: 800, fontFamily: C.fn }}>
    byte<span style={{ color: C.redL }}>Sense</span>
  </span>
);

export const ContentRenderer = ({ text }: { text: string }) => (
  <div>
    {text.split('\n').map((l, i) => {
      const t = l.trim();
      if (!t) return <div key={i} style={{ height: 8 }} />;
      if (t.startsWith('**') && t.endsWith('**'))
        return <h3 key={i} style={{ fontSize: 15, fontWeight: 800, color: C.red, margin: "14px 0 6px" }}>{t.replace(/\*\*/g, '')}</h3>;
      if (t.startsWith('- ')) {
        const ps = t.slice(2).split(/\*\*(.*?)\*\*/g);
        return (
          <div key={i} style={{ paddingLeft: 16, color: C.slate, marginBottom: 3, display: "flex", gap: 8, lineHeight: 1.75, fontSize: 14 }}>
            <span style={{ color: C.teal, flexShrink: 0 }}>·</span>
            <span>{ps.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: C.charcoal }}>{p}</strong> : p)}</span>
          </div>
        );
      }
      if (t.startsWith('"'))
        return <div key={i} style={{ background: C.ivory, borderLeft: `3px solid ${C.teal}`, padding: "12px 16px", margin: "8px 0", fontStyle: "italic", color: C.charcoal, fontSize: 13, lineHeight: 1.7 }}>{t}</div>;
      const ps = t.split(/\*\*(.*?)\*\*/g);
      return <p key={i} style={{ color: C.slate, marginBottom: 5, lineHeight: 1.75, fontSize: 14 }}>{ps.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: C.charcoal }}>{p}</strong> : p)}</p>;
    })}
  </div>
);
