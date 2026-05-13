import { useState, useRef, useEffect, useCallback } from 'react';
import { C } from '@/data/constants';
import { t, Lang } from '@/data/translations';
import { toast } from 'sonner';
import { Brain, Copy, Star, Trash2, MessageSquare, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AICoachProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: string;
  lang?: Lang;
}

type Msg = { role: "user" | "assistant"; content: string };
type SavedResponse = { content: string; mode: string; savedAt: string };

const FAVORITES_KEY = "bsa6_favorites";

function loadFavorites(): SavedResponse[] {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"); } catch { return []; }
}

const TypingDots = () => (
  <div style={{ display: "flex", gap: 5, padding: "14px 18px", alignItems: "center" }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{
        width: 7, height: 7, borderRadius: "50%", background: C.gold,
        animation: `typing-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
      }} />
    ))}
  </div>
);

export default function AICoach({ isOpen, onClose, initialMode, lang = "en" }: AICoachProps) {
  const T = (key: string) => t(lang, key);
  const isMobile = useIsMobile();

  const MODES = [
    { id: "general", label: T("ask_anything"), desc: T("ask_anything_desc"), icon: "✦" },
    { id: "followup", label: T("followup_label"), desc: T("followup_mode_desc"), icon: "✉" },
    { id: "treatment", label: T("treatment_label"), desc: T("treatment_mode_desc"), icon: "◈" },
    { id: "objections", label: T("objections_label"), desc: T("objections_mode_desc"), icon: "◇" },
    { id: "educational", label: T("education_label"), desc: T("education_mode_desc"), icon: "◎" },
  ];

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(initialMode || "general");
  const [tab, setTab] = useState<"chat" | "saved">("chat");
  const [favorites, setFavorites] = useState<SavedResponse[]>(loadFavorites);
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Lock body scroll when panel is open
  useEffect(() => {
    if (isOpen) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

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
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
        body: JSON.stringify({ messages: newMsgs.map(m => ({ role: m.role, content: m.content })), mode, lang }),
      });
      if (!resp.ok) { const errData = await resp.json().catch(() => ({})); throw new Error(errData.error || `Error ${resp.status}`); }
      const data = await resp.json();
      setMessages([...newMsgs, { role: "assistant", content: data.reply }]);
    } catch (e: any) {
      setMessages([...newMsgs, { role: "assistant", content: `[Error: ${e.message}]` }]);
    } finally {
      setLoading(false);
    }
  }, [messages, input, loading, mode, lang]);

  const handleModeChange = (newMode: string) => { setMode(newMode); setMessages([]); };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(T("copied")));
  };

  const saveResponse = (content: string) => {
    const entry: SavedResponse = { content, mode, savedAt: new Date().toISOString() };
    const updated = [entry, ...favorites];
    setFavorites(updated);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    toast.success(T("saved"));
  };

  const deleteFavorite = (idx: number) => {
    const updated = favorites.filter((_, i) => i !== idx);
    setFavorites(updated);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  };

  const hintKey = `coach_${mode}_hint`;

  const glassCard = {
    background: C.glass,
    backdropFilter: C.blur,
    WebkitBackdropFilter: C.blur,
    border: `1px solid ${C.glassBorder}`,
    borderRadius: C.radius,
  } as React.CSSProperties;

  return (
    <div style={{
      position: "fixed",
      top: 0, right: 0, bottom: 0,
      left: isMobile ? 0 : "calc(var(--bs-sidebar-w, 220px) + var(--bs-roleplay-w, 0px))",
      zIndex: isMobile ? 300 : 200,
      display: "flex", flexDirection: "column",
      background: "radial-gradient(ellipse at top, var(--bs-bg3), var(--bs-bg))",
      fontFamily: C.fn,
      transform: isOpen ? "translateX(0)" : "translateX(105%)",
      transition: "transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)",
      willChange: "transform",
      boxShadow: isOpen ? "-8px 0 40px rgba(0,0,0,0.5)" : "none",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 24px",
        borderBottom: `1px solid ${C.glassBorder}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(20, 20, 28, 0.7)",
        backdropFilter: C.blur,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: C.radiusSm,
            background: "rgba(201,168,76,0.15)", border: `1px solid rgba(201,168,76,0.25)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Brain size={18} strokeWidth={1.5} color={C.gold} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.white, letterSpacing: 0.5 }}>{T("ai_coach")}</div>
            <div style={{ fontSize: 11, color: C.ash }}>{MODES.find(m => m.id === mode)?.desc}</div>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: "rgba(255,255,255,0.06)", border: `1px solid ${C.glassBorder}`,
          color: C.ash, width: 36, height: 36, borderRadius: C.radiusSm,
          fontSize: 16, cursor: "pointer", fontFamily: C.fn,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = C.white; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = C.ash; }}
        ><X size={16} strokeWidth={2} /></button>
      </div>

      {/* Tab Bar */}
      <div style={{ display: "flex", gap: 4, padding: "10px 24px", borderBottom: `1px solid ${C.glassBorder}` }}>
        {[{ id: "chat" as const, label: T("chat"), Icon: MessageSquare }, { id: "saved" as const, label: `${T("saved_responses")} (${favorites.length})`, Icon: Star }].map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            style={{
              flex: 1, padding: "9px 12px", fontSize: 11, fontWeight: 700, fontFamily: C.fn,
              cursor: "pointer", border: tab === tb.id ? `1px solid rgba(201,168,76,0.25)` : "1px solid transparent", borderRadius: C.radiusXs,
              background: tab === tb.id ? "rgba(201,168,76,0.1)" : "transparent",
              color: tab === tb.id ? C.gold : "rgba(255,255,255,0.35)",
              transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
            <tb.Icon size={12} strokeWidth={1.5} /> {tb.label}
          </button>
        ))}
      </div>

      {tab === "saved" ? (
        <div style={{ flex: 1, padding: "16px 24px", overflowY: "auto" }}>
          {favorites.length === 0 && (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13, marginTop: 60 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <Star size={22} strokeWidth={1.5} color="rgba(255,255,255,0.2)" />
              </div>
              {T("no_saved")}
            </div>
          )}
          {favorites.map((fav, i) => (
            <div key={i} style={{ ...glassCard, padding: "16px 18px", marginBottom: 10, animation: `float-up 0.3s ease-out ${i * 0.05}s both` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 9, color: C.gold, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
                  {fav.mode} · {new Date(fav.savedAt).toLocaleDateString()}
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => copyText(fav.content)} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: C.ash, cursor: "pointer", fontFamily: C.fn, padding: "5px 8px", borderRadius: C.radiusXs, display: "flex", alignItems: "center" }}><Copy size={13} strokeWidth={1.5} /></button>
                  <button onClick={() => deleteFavorite(i)} style={{ background: "rgba(204,16,16,0.1)", border: "none", color: C.red, cursor: "pointer", fontFamily: C.fn, padding: "5px 8px", borderRadius: C.radiusXs, display: "flex", alignItems: "center" }}><Trash2 size={13} strokeWidth={1.5} /></button>
                </div>
              </div>
              <div style={{ fontSize: 13, color: C.white, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {fav.content.length > 300 ? fav.content.slice(0, 300) + "..." : fav.content}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Mode Pills */}
          <div style={{ display: "flex", gap: 6, padding: "10px 24px", overflowX: "auto", borderBottom: `1px solid ${C.glassBorder}` }}>
            {MODES.map(m => (
              <button key={m.id} onClick={() => handleModeChange(m.id)}
                style={{
                  background: mode === m.id ? C.gradGold : "rgba(255,255,255,0.04)",
                  color: mode === m.id ? C.dark : C.ash,
                  border: mode === m.id ? "none" : `1px solid ${C.glassBorder}`,
                  padding: "7px 16px", fontSize: 11, fontWeight: 700,
                  fontFamily: C.fn, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                  borderRadius: 999, transition: "all 0.25s",
                  boxShadow: mode === m.id ? C.glow(C.gold, 0.2) : "none",
                }}>
                <span style={{ marginRight: 5 }}>{m.icon}</span>{m.label}
              </button>
            ))}
          </div>

          {/* Chat Area */}
          <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", color: C.ash, fontSize: 13, marginTop: 50, animation: "float-up 0.5s ease-out" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: C.radius,
                  background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px",
                }}>
                  <Brain size={28} strokeWidth={1.5} color={C.gold} />
                </div>
                <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 16, color: C.white }}>{T("coach_welcome")}</div>
                <div style={{ fontSize: 13, maxWidth: 340, margin: "0 auto", lineHeight: 1.7, color: C.ash }}>{T(hintKey)}</div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                marginBottom: 12, animation: `float-up 0.3s ease-out`,
              }}>
                <div style={{
                  maxWidth: "80%",
                  background: msg.role === "user" ? C.gradTeal : C.glass,
                  backdropFilter: msg.role === "assistant" ? C.blur : undefined,
                  color: C.white,
                  padding: "12px 16px",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap",
                  border: msg.role === "assistant" ? `1px solid ${C.glassBorder}` : "none",
                  boxShadow: msg.role === "user" ? C.glow(C.teal, 0.15) : C.shadowCard,
                }}>
                  {msg.role === "assistant" && (
                    <>
                      <div style={{ fontSize: 9, color: C.gold, marginBottom: 6, fontWeight: 700, letterSpacing: 2 }}>{T("ai_coach").toUpperCase()}</div>
                      {msg.content}
                      <div style={{ display: "flex", gap: 6, marginTop: 10, borderTop: `1px solid ${C.glassBorder}`, paddingTop: 8 }}>
                        <button onClick={() => copyText(msg.content)}
                          style={{
                            background: "rgba(255,255,255,0.06)", border: "none", color: C.ash, fontSize: 11,
                            cursor: "pointer", fontFamily: C.fn, display: "flex", alignItems: "center", gap: 4,
                            padding: "5px 10px", borderRadius: C.radiusXs, transition: "all 0.2s",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
                          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}>
                          <Copy size={11} strokeWidth={1.5} /> {T("copy")}
                        </button>
                        <button onClick={() => saveResponse(msg.content)}
                          style={{
                            background: "rgba(255,255,255,0.06)", border: "none", color: C.ash, fontSize: 11,
                            cursor: "pointer", fontFamily: C.fn, display: "flex", alignItems: "center", gap: 4,
                            padding: "5px 10px", borderRadius: C.radiusXs, transition: "all 0.2s",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
                          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}>
                          <Star size={11} strokeWidth={1.5} /> {T("save")}
                        </button>
                      </div>
                    </>
                  )}
                  {msg.role === "user" && msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
                <div style={{ ...glassCard, padding: 0 }}><TypingDots /></div>
              </div>
            )}
            <div ref={chatEnd} />
          </div>

          {/* Input */}
          <div style={{
            padding: "14px 24px", borderTop: `1px solid ${C.glassBorder}`,
            display: "flex", gap: 10, alignItems: "center",
            background: "rgba(20, 20, 28, 0.7)", backdropFilter: C.blur,
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder={T("coach_placeholder")}
              style={{
                flex: 1, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.glassBorder}`,
                color: C.white, padding: "12px 18px", fontSize: 14, fontFamily: C.fn,
                outline: "none", borderRadius: C.radiusSm, transition: "border-color 0.2s",
              }}
              onFocus={e => e.currentTarget.style.borderColor = "rgba(201, 168, 76, 0.4)"}
              onBlur={e => e.currentTarget.style.borderColor = C.glassBorder}
            />
            <button onClick={() => sendMessage()}
              style={{
                background: C.gradGold, color: C.dark, border: "none",
                padding: "12px 20px", fontSize: 13, fontWeight: 700, fontFamily: C.fn,
                cursor: "pointer", flexShrink: 0, borderRadius: C.radiusSm,
                boxShadow: C.glow(C.gold, 0.2), transition: "all 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
              {T("send")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
