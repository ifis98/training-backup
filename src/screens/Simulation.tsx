import { useState, useRef, useEffect, useCallback } from 'react';
import { C, ROLES } from '@/data/constants';
import { ChevronLeft, Mic, MicOff, Send } from 'lucide-react';
import { scrollTop, startSTT } from '@/lib/helpers';
import { AppState } from '@/hooks/useAppState';
import { t, Lang } from '@/data/translations';
import { useIsMobile } from '@/hooks/use-mobile';
import { FUNCTIONS_URL, FUNCTIONS_KEY } from '@/integrations/supabase/client';

interface SimulationProps {
  s: AppState;
  u: (d: Partial<AppState>) => void;
  lang?: Lang;
}

const SUCCESS_REGEX = /(interested|next step|sign me up|let's do it|schedule|sounds good|i'm in|let's move forward|make it work)/i;
const COACH_REGEX = /\[COACH:\s*([\s\S]*?)\]$/;

function parseCoaching(text: string): { patientText: string; coachTip: string | null } {
  const match = text.match(COACH_REGEX);
  if (match) return { patientText: text.slice(0, match.index).trim(), coachTip: match[1].trim() };
  return { patientText: text, coachTip: null };
}

const PATIENTS = [
  { name: "Jordan", age: 38, card: "Marketing manager. Grinds. Jaw sore. Apple Watch. Budget-aware." },
  { name: "Maria", age: 52, card: "School teacher. TMJ pain, headaches. Skeptical — tried splints before. Insurance-focused." },
  { name: "Devon", age: 28, card: "Software engineer. Partner complains about grinding. Feels fine. Tech-curious." },
  { name: "Patricia", age: 65, card: "Retired nurse. Broken teeth history. Medical knowledge. Comfort concerns." },
  { name: "Marcus", age: 44, card: "Construction foreman. Jaw clenching, sleep apnea worry. Cost and time concerns." },
  { name: "Aisha", age: 33, card: "New mom. Stress grinding since pregnancy. Tight budget. Wants proof it works." },
];

function getRandomPatientIdx(exclude?: number): number {
  let idx = Math.floor(Math.random() * PATIENTS.length);
  if (exclude !== undefined && PATIENTS.length > 1) {
    while (idx === exclude) idx = Math.floor(Math.random() * PATIENTS.length);
  }
  return idx;
}

export default function Simulation({ s, u, lang = "en" }: SimulationProps) {
  const T = (key: string) => t(lang, key);
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [patientIdx, setPatientIdx] = useState(() => getRandomPatientIdx());
  const chatEnd = useRef<HTMLDivElement>(null);
  const sttRef = useRef<any>(null);
  const sRoles = ROLES.filter(r => s.roles.includes(r.id));
  const patient = PATIENTS[patientIdx];

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [s.simMsgs]);

  const sendMessage = useCallback(async (overrideText?: string) => {
    const msg = (overrideText || s.simIn).trim();
    if (!msg || loading) return;
    const msgs = [...s.simMsgs, { r: "user", t: msg }];
    u({ simMsgs: msgs, simIn: "" });
    setLoading(true);
    try {
      const resp = await fetch(`${FUNCTIONS_URL}/functions/v1/patient-sim`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${FUNCTIONS_KEY}` },
        body: JSON.stringify({ messages: msgs.map(m => ({ role: m.r === "user" ? "user" : "assistant", content: m.t })), patientIndex: patientIdx }),
      });
      if (!resp.ok) { const errData = await resp.json().catch(() => ({})); throw new Error(errData.error || `Error ${resp.status}`); }
      const data = await resp.json();
      const aiText = data.reply || "I'm not sure what to say to that.";
      let newSimP = s.simP, newXp = s.xp;
      if (SUCCESS_REGEX.test(aiText) && s.simP < 3) { newSimP = s.simP + 1; newXp = s.xp + 150; }
      u({ simMsgs: [...msgs, { r: "ai", t: aiText }], simP: newSimP, xp: newXp });
    } catch (e: any) {
      u({ simMsgs: [...msgs, { r: "ai", t: `[Error: ${e.message}]` }] });
    } finally { setLoading(false); }
  }, [s.simMsgs, s.simIn, s.simP, s.xp, loading, u, patientIdx]);

  const handleNewPatient = () => { setPatientIdx(getRandomPatientIdx(patientIdx)); u({ simMsgs: [] }); };
  const handleMic = () => {
    if (s.lst) {
      sttRef.current?.stop();
      sttRef.current = null;
      u({ lst: false });
      return;
    }
    u({ lst: true });
    sttRef.current = startSTT(
      (text: string) => { u({ simIn: text }); },
      () => { u({ lst: false }); sttRef.current = null; }
    );
  };

  return (
    // height: 100dvh = dynamic viewport height (shrinks when iOS keyboard appears)
    // overflow: hidden = outer shell never scrolls; only the chat list scrolls internally
    <div style={{ fontFamily: C.fn, background: "var(--bs-bg)", height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── Header (fixed top) ── */}
      <div style={{ padding: isMobile ? "12px 16px" : "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--bs-border)", flexShrink: 0 }}>
        <button onClick={() => { if (s.simMsgs.length > 0) { u({ phase: "simSummary" }); } else { u({ phase: "dashboard" }); } scrollTop(); }}
          style={{ background: "none", border: "none", color: C.ash, fontSize: 13, cursor: "pointer", fontFamily: C.fn, display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
          <ChevronLeft size={16} strokeWidth={2} /> {T("back")}
        </button>
        <div style={{ fontSize: 10, letterSpacing: "0.2em", color: C.gold, textTransform: "uppercase", fontWeight: 700 }}>{T("patient_simulation")}</div>
        <div style={{ fontSize: 13, color: s.simP >= 3 ? C.green : C.ash, fontWeight: 700, minWidth: 30, textAlign: "right" }}>{s.simP}/3</div>
      </div>

      {/* ── Patient card (fixed below header) ── */}
      <div style={{ margin: isMobile ? "10px 12px 0" : "14px 24px 0", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: isMobile ? "10px 14px" : "14px 20px", flexShrink: 0 }}>
        <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: C.white, marginBottom: 2 }}>{T("patient_label")} {patient.name}, {patient.age}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{patient.card}</div>
      </div>

      {/* ── Completion banner (shown above chat when done) ── */}
      {s.simP >= 3 && (
        <div style={{ background: C.green, color: C.white, padding: isMobile ? "10px 16px" : "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, margin: isMobile ? "8px 12px 0" : "10px 24px 0", borderRadius: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>3 {T("patients_guided")}</span>
          <button onClick={() => { u({ phase: "dashboard" }); scrollTop(); }}
            style={{ background: "rgba(255,255,255,0.2)", color: C.white, border: "none", padding: "6px 14px", fontSize: 12, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: 6 }}>
            {T("return_arrow")}
          </button>
        </div>
      )}

      {/* ── New patient prompt ── */}
      {s.simMsgs.length >= 8 && s.simP < 3 && (
        <div style={{ padding: isMobile ? "6px 12px" : "6px 24px", textAlign: "center", flexShrink: 0 }}>
          <button onClick={handleNewPatient}
            style={{ background: C.gold, color: C.dark, border: "none", padding: "8px 18px", fontSize: 12, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", borderRadius: 6 }}>
            {T("new_patient")}
          </button>
        </div>
      )}

      {/* ── Chat messages (scrollable fill) ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "12px 12px" : "16px 24px", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
        {s.simMsgs.length === 0 && (
          <div style={{ textAlign: "center", color: C.ash, fontSize: 13, marginTop: 40 }}>
            {T("start_conversation").replace("{name}", patient.name)}
          </div>
        )}
        {s.simMsgs.map((msg, i) => {
          if (msg.r === "user") {
            // Look ahead to the next AI message — it contains the coaching tip that evaluates THIS message
            const nextMsg = s.simMsgs[i + 1];
            const coachTip = nextMsg?.r === "ai" ? parseCoaching(nextMsg.t).coachTip : null;
            return (
              <div key={i} style={{ marginBottom: coachTip ? 6 : 10 }}>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ maxWidth: isMobile ? "88%" : "75%", background: C.teal, color: C.white, padding: "10px 14px", borderRadius: "14px 14px 4px 14px", fontSize: 13, lineHeight: 1.6 }}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>{T("you_label")} ({sRoles.map(r => r.short).join(", ")})</div>
                    {msg.t}
                  </div>
                </div>
                {coachTip && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6, marginBottom: 4 }}>
                    <div style={{ maxWidth: isMobile ? "92%" : "80%", background: "rgba(212,175,55,0.08)", borderLeft: `3px solid ${C.gold}`, borderRadius: "0 8px 8px 0", padding: "10px 14px" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>{T("training_tip")}</div>
                      <div style={{ fontSize: 12, color: C.ash, lineHeight: 1.6 }}>{coachTip}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          }
          // AI patient message — strip the coaching tag (tip is shown below the user's message above)
          const { patientText } = parseCoaching(msg.t);
          return (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ maxWidth: isMobile ? "88%" : "75%", background: "var(--bs-bg2)", color: "var(--bs-text)", padding: "10px 14px", borderRadius: "14px 14px 14px 4px", fontSize: 13, lineHeight: 1.6 }}>
                  <div style={{ fontSize: 9, color: C.ash, marginBottom: 4 }}>{patient.name}</div>
                  {patientText}
                </div>
              </div>
            </div>
          );
        })}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
            <div style={{ background: "var(--bs-bg2)", color: "var(--bs-ash)", padding: "10px 14px", borderRadius: "14px 14px 14px 4px", fontSize: 13 }}>{T("typing").replace("{name}", patient.name)}</div>
          </div>
        )}
        <div ref={chatEnd} />
      </div>

      {/* ── Input bar (fixed bottom) ── */}
      <div style={{
        padding: isMobile ? "10px 12px" : "12px 24px",
        paddingBottom: isMobile ? "calc(10px + env(safe-area-inset-bottom))" : "12px",
        borderTop: `1px solid var(--bs-border)`,
        display: "flex", gap: 8, alignItems: "center",
        background: "var(--bs-bg)", flexShrink: 0,
      }}>
        <button onClick={handleMic}
          style={{ width: 40, height: 40, background: s.lst ? `${C.red}25` : "rgba(255,255,255,0.06)", border: `1px solid ${s.lst ? C.red : "rgba(255,255,255,0.1)"}`, borderRadius: "50%", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {s.lst ? <MicOff size={16} strokeWidth={1.5} color={C.red} /> : <Mic size={16} strokeWidth={1.5} color={C.ash} />}
        </button>
        <input
          value={s.simIn}
          onChange={e => u({ simIn: e.target.value })}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder={T("talk_to").replace("{name}", patient.name)}
          style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, color: C.white, padding: isMobile ? "10px 12px" : "10px 14px", fontSize: isMobile ? 14 : 14, fontFamily: C.fn, outline: "none", minWidth: 0 }}
        />
        <button onClick={() => sendMessage()} disabled={!s.simIn.trim() || loading}
          style={{ width: 40, height: 40, background: s.simIn.trim() && !loading ? C.teal : "rgba(255,255,255,0.06)", border: "none", borderRadius: "50%", cursor: s.simIn.trim() && !loading ? "pointer" : "default", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}>
          <Send size={16} strokeWidth={2} color={s.simIn.trim() && !loading ? C.dark : C.ash} />
        </button>
      </div>
    </div>
  );
}
