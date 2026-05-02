import { C, BL } from '@/data/constants';
import { scrollTop } from '@/lib/helpers';
import { AppState } from '@/hooks/useAppState';
import { t, Lang } from '@/data/translations';
import { useIsMobile } from '@/hooks/use-mobile';

interface BaselineProps {
  s: AppState;
  u: (d: Partial<AppState>) => void;
  lang?: Lang;
}

export default function Baseline({ s, u, lang = "en" }: BaselineProps) {
  const T = (key: string) => t(lang, key);
  const isMobile = useIsMobile();
  const qs = s.blQs || BL.map((v, i) => v[(s.seed + i) % v.length]);
  const q = qs[s.blIdx];
  const sel = s.bl[s.blIdx];

  return (
    <div style={{ fontFamily: C.fn, background: C.white, minHeight: "100vh" }}>
      <div style={{ background: C.dark, padding: isMobile ? "14px 16px" : "18px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: C.ash, textTransform: "uppercase" }}>{T("step2_baseline")}</div>
          <p style={{ fontSize: 13, color: C.ash, marginTop: 4 }}>{T("no_wrong_answers")}</p>
          <div style={{ display: "flex", gap: 3, marginTop: 10 }}>
            {qs.map((_: any, i: number) => <div key={i} style={{ flex: 1, height: 3, background: i <= s.blIdx ? C.teal : C.dark3 }} />)}
          </div>
        </div>
      </div>
      <div style={{ background: C.white, padding: isMobile ? "24px 16px" : "32px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ fontSize: 12, color: C.ash, marginBottom: 8 }}>Q {s.blIdx + 1}/{qs.length}</div>
          <div style={{ fontSize: isMobile ? 15 : 16, fontWeight: 700, color: C.charcoal, marginBottom: 18, lineHeight: 1.5 }}>{q.q}</div>
          {q.opts.map((o: string, i: number) => (
            <div key={i} onClick={() => { const b = [...s.bl]; b[s.blIdx] = i; u({ bl: b }); }}
              style={{ padding: isMobile ? "12px 14px" : "13px 16px", marginBottom: 5, background: sel === i ? C.tealBg : C.snow, border: `1.5px solid ${sel === i ? C.teal : C.border}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${sel === i ? C.teal : C.mist}`, background: sel === i ? C.teal : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {sel === i && <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.white }} />}
              </div>
              <span style={{ fontSize: 14, color: C.charcoal }}>{o}</span>
            </div>
          ))}
          {sel !== undefined && (
            <button onClick={() => {
              if (s.blIdx < qs.length - 1) { u({ blIdx: s.blIdx + 1 }); scrollTop(); }
              else { u({ phase: "blR", blScore: Math.round(s.bl.reduce((a, v) => a + v * 25, 0) / qs.length) }); scrollTop(); }
            }}
              style={{ background: C.teal, color: "#fff", border: "none", padding: isMobile ? "13px 20px" : "14px 28px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", marginTop: 14, display: isMobile ? "flex" : "inline-flex", width: isMobile ? "100%" : "auto", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {s.blIdx < qs.length - 1 ? T("next_arrow") : T("see_results")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
