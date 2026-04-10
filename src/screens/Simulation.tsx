import { useState, useRef, useEffect, useCallback } from 'react';
import { C, ROLES } from '@/data/constants';
import { scrollTop, startSTT } from '@/lib/helpers';
import { AppState } from '@/hooks/useAppState';
import { t, Lang } from '@/data/translations';

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
  const [loading, setLoading] = useState(false);
  const [patientIdx, setPatientIdx] = useState(() => getRandomPatientIdx());
  const chatEnd = useRef<HTMLDivElement>(null);
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
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(`${supabaseUrl}/functions/v1/patient-sim`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
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
    if (s.lst) { u({ lst: false }); return; }
    u({ lst: true });
    startSTT((text: string) => { u({ lst: false, simIn: text }); setTimeout(() => sendMessage(text), 300); });
  };

  return (
    <div style={{ fontFamily: C.fn, background: C.dark, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.borderD}` }}>
        <button onClick={() => { if (s.simMsgs.length > 0) { u({ phase: "simSummary" }); } else { u({ phase: "dashboard" }); } scrollTop(); }}
          style={{ background: "none", border: "none", color: C.ash, fontSize: 13, cursor: "pointer", fontFamily: C.fn }}>{T("back")}</button>
        <div style={{ fontSize: 10, letterSpacing: 3, color: C.gold, textTransform: "uppercase", fontWeight: 700 }}>{T("patient_simulation")}</div>
        <div style={{ fontSize: 13, color: s.simP >= 3 ? C.green : C.ash, fontWeight: 700 }}>{s.simP}/3</div>
      </div>

      <div style={{ background: C.dark2, padding: "14px 24px", margin: "0 24px", marginTop: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>{T("patient_label")} {patient.name}, {patient.age}</div>
        <div style={{ fontSize: 12, color: C.ash }}>{patient.card}</div>
      </div>

      <div style={{ flex: 1, padding: "16px 24px", overflowY: "auto", minHeight: 200 }}>
        {s.simMsgs.length === 0 && (
          <div style={{ textAlign: "center", color: C.ash, fontSize: 13, marginTop: 40 }}>
            {T("start_conversation").replace("{name}", patient.name)}
          </div>
        )}
        {s.simMsgs.map((msg, i) => {
          if (msg.r === "user") {
            return (
              <div key={i} style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                <div style={{ maxWidth: "75%", background: C.teal, color: C.white, padding: "10px 14px", borderRadius: "14px 14px 4px 14px", fontSize: 13, lineHeight: 1.6 }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>{T("you_label")} ({sRoles.map(r => r.short).join(", ")})</div>
                  {msg.t}
                </div>
              </div>
            );
          }
          const { patientText, coachTip } = parseCoaching(msg.t);
          return (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ maxWidth: "75%", background: C.dark2, color: C.white, padding: "10px 14px", borderRadius: "14px 14px 14px 4px", fontSize: 13, lineHeight: 1.6 }}>
                  <div style={{ fontSize: 9, color: C.ash, marginBottom: 4 }}>{patient.name}</div>
                  {patientText}
                </div>
              </div>
              {coachTip && (
                <div style={{ marginTop: 8, marginLeft: 12, maxWidth: "80%", background: "rgba(212,175,55,0.08)", borderLeft: `3px solid ${C.gold}`, borderRadius: "0 8px 8px 0", padding: "10px 14px" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>{T("training_tip")}</div>
                  <div style={{ fontSize: 12, color: C.ash, lineHeight: 1.6 }}>{coachTip}</div>
                </div>
              )}
            </div>
          );
        })}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
            <div style={{ background: C.dark2, color: C.ash, padding: "10px 14px", borderRadius: "14px 14px 14px 4px", fontSize: 13 }}>{T("typing").replace("{name}", patient.name)}</div>
          </div>
        )}
        <div ref={chatEnd} />
      </div>

      {s.simP >= 3 && (
        <div style={{ background: C.green, color: C.white, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>3 {T("patients_guided")}</span>
          <button onClick={() => { u({ phase: "dashboard" }); scrollTop(); }}
            style={{ background: "rgba(255,255,255,0.2)", color: C.white, border: "none", padding: "8px 16px", fontSize: 13, fontWeight: 700, fontFamily: C.fn, cursor: "pointer" }}>
            {T("return_arrow")}
          </button>
        </div>
      )}

      {s.simMsgs.length >= 8 && s.simP < 3 && (
        <div style={{ padding: "8px 24px", textAlign: "center" }}>
          <button onClick={handleNewPatient}
            style={{ background: C.gold, color: C.dark, border: "none", padding: "10px 20px", fontSize: 13, fontWeight: 700, fontFamily: C.fn, cursor: "pointer" }}>
            {T("new_patient")}
          </button>
        </div>
      )}

      <div style={{ padding: "12px 24px", borderTop: `1px solid ${C.borderD}`, display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={handleMic}
          style={{ width: 40, height: 40, background: s.lst ? C.red : C.dark2, border: "none", borderRadius: "50%", fontSize: 18, cursor: "pointer", flexShrink: 0 }}>🎤</button>
        <input
          value={s.simIn}
          onChange={e => u({ simIn: e.target.value })}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder={T("talk_to").replace("{name}", patient.name)}
          style={{ flex: 1, background: C.dark2, border: "none", color: C.white, padding: "10px 14px", fontSize: 14, fontFamily: C.fn, outline: "none" }}
        />
        <button onClick={() => sendMessage()}
          style={{ background: C.teal, color: C.white, border: "none", padding: "10px 16px", fontSize: 13, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", flexShrink: 0 }}>
          {T("send")}
        </button>
      </div>
    </div>
  );
}
