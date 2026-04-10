import { C } from '@/data/constants';

export const Logo = ({ size = 36, light = false }: { size?: number; light?: boolean }) => (
  <img src="/bytesense-logo.png" alt="ByteSense" style={{ height: size, width: "auto", filter: light ? "brightness(0) invert(1)" : undefined }} />
);

export const LogoText = ({ size = 24, light = false }: { size?: number; light?: boolean }) => (
  <img src="/bytesense-logo.png" alt="ByteSense" style={{ height: size, width: "auto", filter: light ? "brightness(0) invert(1)" : undefined }} />
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
