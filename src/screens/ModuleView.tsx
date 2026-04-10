import { C, PH, Module } from '@/data/constants';
import { ContentRenderer } from '@/components/ByteSenseLogo';
import { scrollTop, speak, stopSpeech } from '@/lib/helpers';
import { ShuffledQuestion } from '@/lib/helpers';
import { AppState } from '@/hooks/useAppState';

interface ModuleViewProps {
  s: AppState;
  u: (d: Partial<AppState>) => void;
  myM: Module[];
  getQuestion: (id: string) => ShuffledQuestion | null;
}

export default function ModuleView({ s, u, myM, getQuestion }: ModuleViewProps) {
  const mod = myM.find(m => m.id === s.curMod);
  if (!mod) { u({ phase: "dashboard" }); return null; }

  const idx = myM.indexOf(mod);
  const next = myM[idx + 1];
  const q = getQuestion(mod.id);

  return (
    <div style={{ fontFamily: C.fn, background: C.snow, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: C.dark, padding: "14px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => { u({ phase: "dashboard", curMod: null, ckA: null }); stopSpeech(); u({ spk: false }); scrollTop(); }}
            style={{ background: "none", border: "none", color: C.ash, fontSize: 13, cursor: "pointer", fontFamily: C.fn }}>← Dashboard</button>
          <button onClick={() => {
            if (s.spk) { stopSpeech(); u({ spk: false }); }
            else { speak(mod.content); u({ spk: true }); }
          }}
            style={{ background: "none", border: `1px solid ${C.borderD}`, color: s.spk ? C.teal : C.ash, padding: "6px 12px", fontSize: 11, cursor: "pointer", fontFamily: C.fn }}>
            {s.spk ? "■ Stop" : "▶ Listen"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ background: C.white, padding: "32px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: C.tealD, textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>
            {PH.find(p => p.id === mod.phase)?.label || mod.phase}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.charcoal, marginBottom: 4 }}>{mod.title}</h2>
          <div style={{ fontSize: 12, color: C.ash, marginBottom: 20 }}>{mod.time}</div>
          <ContentRenderer text={mod.content} />
        </div>
      </div>

      {/* Knowledge Check */}
      {q && (
        <div style={{ background: C.ivory, padding: "28px 24px", borderTop: `1px solid ${C.mist}` }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.tealD, textTransform: "uppercase", marginBottom: 10 }}>Knowledge Check</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.charcoal, marginBottom: 14 }}>{q.q}</div>

            {q.opts.map((o, i) => {
              const ans = s.ckA !== null;
              const sel = s.ckA === i;
              const cor = ans && i === q.correct;
              const wr = ans && sel && i !== q.correct;
              return (
                <div key={i} onClick={() => {
                  if (!ans) {
                    u({ ckA: i });
                    // Award XP
                    const correct = i === q.correct;
                    const xpAdd = correct ? 50 : 10;
                    u({ ckA: i, xp: s.xp + xpAdd, done: s.done.includes(mod.id) ? s.done : [...s.done, mod.id] });
                  }
                }}
                  style={{ padding: "11px 14px", marginBottom: 4, background: cor ? C.greenBg : wr ? C.redBg : sel ? C.tealBg : C.white, border: `1.5px solid ${cor ? C.green : wr ? C.red : sel ? C.teal : C.border}`, cursor: ans ? "default" : "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${cor ? C.green : wr ? C.red : sel ? C.teal : C.mist}`, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: C.charcoal, flex: 1 }}>{o}</span>
                  {cor && <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>Correct</span>}
                  {wr && <span style={{ fontSize: 11, color: C.red, fontWeight: 700 }}>Review</span>}
                </div>
              );
            })}

            {s.ckA !== null && (
              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                {next ? (
                  <button onClick={() => { u({ phase: "module", curMod: next.id, ckA: null, spk: false }); stopSpeech(); scrollTop(); }}
                    style={{ background: C.teal, color: "#fff", border: "none", padding: "14px 28px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
                    Next Section →
                  </button>
                ) : (
                  <button onClick={() => { u({ phase: "dashboard", curMod: null, ckA: null, spk: false }); stopSpeech(); scrollTop(); }}
                    style={{ background: C.teal, color: "#fff", border: "none", padding: "14px 28px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
                    Complete & Return →
                  </button>
                )}
                <button onClick={() => { u({ phase: "dashboard", curMod: null, ckA: null, spk: false }); stopSpeech(); scrollTop(); }}
                  style={{ background: "transparent", color: C.slate, border: `1px solid ${C.border}`, padding: "14px 28px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer" }}>
                  Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
