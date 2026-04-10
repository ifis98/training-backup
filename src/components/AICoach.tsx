import { useState, useRef, useEffect, useCallback } from 'react';
import { C } from '@/data/constants';

interface AICoachProps {
  onClose: () => void;
  initialMode?: string;
}

type Msg = { role: "user" | "assistant"; content: string };

const MODES = [
  { id: "general", label: "💬 Ask Anything", desc: "General advice & training Q&A" },
  { id: "followup", label: "✉️ Follow-Up", desc: "Generate SMS, email, letters" },
  { id: "treatment", label: "📋 Treatment Plan", desc: "Scripts & presentations" },
  { id: "objections", label: "🛡️ Objections", desc: "Handle tough situations" },
  { id: "educational", label: "📚 Education", desc: "Patient-facing materials" },
];

export default function AICoach({ onClose, initialMode }: AICoachProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(initialMode || "general");
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (overrideText?: string) => {
    const msg = (overrideText || input).trim();
    if (!msg || loading) return;

    const newMsgs: Msg[] = [...messages, { role: "user", content: msg }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(`${supabaseUrl}/functions/v1/ai-coach`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
          mode,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${resp.status}`);
      }

      const data = await resp.json();
      setMessages([...newMsgs, { role: "assistant", content: data.reply }]);
    } catch (e: any) {
      setMessages([...newMsgs, { role: "assistant", content: `[Error: ${e.message}]` }]);
    } finally {
      setLoading(false);
    }
  }, [messages, input, loading, mode]);

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    setMessages([]);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", flexDirection: "column",
      background: C.dark, fontFamily: C.fn,
    }}>
      {/* Header */}
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.borderD}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: C.gold, textTransform: "uppercase", fontWeight: 700 }}>AI Coach</div>
          <div style={{ fontSize: 11, color: C.ash }}>{MODES.find(m => m.id === mode)?.desc}</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.ash, fontSize: 20, cursor: "pointer", fontFamily: C.fn }}>✕</button>
      </div>

      {/* Mode Tabs */}
      <div style={{ display: "flex", gap: 4, padding: "8px 12px", overflowX: "auto", borderBottom: `1px solid ${C.borderD}` }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => handleModeChange(m.id)}
            style={{
              background: mode === m.id ? C.gold : C.dark2,
              color: mode === m.id ? C.dark : C.ash,
              border: "none", padding: "6px 12px", fontSize: 11, fontWeight: 700,
              fontFamily: C.fn, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, padding: "16px 20px", overflowY: "auto" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: C.ash, fontSize: 13, marginTop: 40 }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🧠</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>ByteSense AI Coach</div>
            <div style={{ fontSize: 12, maxWidth: 300, margin: "0 auto", lineHeight: 1.6 }}>
              {mode === "general" && "Ask me anything about ByteSense, patient handling, objections, or training concepts."}
              {mode === "followup" && "Describe the patient situation and I'll generate a follow-up message (SMS, email, or letter)."}
              {mode === "treatment" && "Tell me about the patient and I'll create a presentation script and talking points."}
              {mode === "objections" && "Describe the objection and I'll give you a word-for-word script to handle it."}
              {mode === "educational" && "Tell me what you need — brochures, FAQs, social posts, or patient handouts."}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
            <div style={{
              maxWidth: "80%",
              background: msg.role === "user" ? C.teal : C.dark2,
              color: C.white,
              padding: "10px 14px",
              borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap",
            }}>
              {msg.role === "assistant" && (
                <div style={{ fontSize: 9, color: C.gold, marginBottom: 4, fontWeight: 700 }}>AI COACH</div>
              )}
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
            <div style={{ background: C.dark2, color: C.ash, padding: "10px 14px", borderRadius: "14px 14px 14px 4px", fontSize: 13 }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={chatEnd} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.borderD}`, display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Ask your AI Coach..."
          style={{ flex: 1, background: C.dark2, border: "none", color: C.white, padding: "10px 14px", fontSize: 14, fontFamily: C.fn, outline: "none" }}
        />
        <button onClick={() => sendMessage()}
          style={{ background: C.gold, color: C.dark, border: "none", padding: "10px 16px", fontSize: 13, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", flexShrink: 0 }}>
          Send
        </button>
      </div>
    </div>
  );
}
