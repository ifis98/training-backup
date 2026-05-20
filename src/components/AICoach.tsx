import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '@/data/constants';
import { t, Lang } from '@/data/translations';
import { toast } from 'sonner';
import { Brain, Copy, Star, Trash2, MessageSquare, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AICoachProps {
  mode?: string;
  lang?: Lang;
}

type Msg = { role: "user" | "assistant"; content: string };
type SavedResponse = { content: string; mode: string; savedAt: string };

const FAVORITES_KEY = "bsa6_favorites";
const SESSION_KEY = "bsa6_coach_session";

function loadFavorites(): SavedResponse[] {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"); } catch { return []; }
}

function loadSession(): { messages: Msg[]; mode: string } | null {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
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

export default function AICoach({ mode: modeProp, lang = "en" }: AICoachProps) {
  const T = (key: string) => t(lang, key);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const MODES = [
    { id: "general", label: T("ask_anything"), desc: T("ask_anything_desc"), icon: "✦" },
    { id: "followup", label: T("followup_label"), desc: T("followup_mode_desc"), icon: "✉" },
    { id: "treatment", label: T("treatment_label"), desc: T("treatment_mode_desc"), icon: "◈" },
    { id: "objections", label: T("objections_label"), desc: T("objections_mode_desc"), icon: "◇" },
    { id: "educational", label: T("education_label"), desc: T("education_mode_desc"), icon: "◎" },
  ];

  const goBack = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/app');
  }, [navigate]);

  // Restore prior session if the URL mode matches; otherwise start fresh.
  const initialSession = loadSession();
  const initialMode = modeProp || initialSession?.mode || "general";
  const initialMessages: Msg[] = initialSession && initialSession.mode === initialMode ? initialSession.messages : [];

  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(initialMode);
  const [tab, setTab] = useState<"chat" | "saved">("chat");
  const [favorites, setFavorites] = useState<SavedResponse[]>(loadFavorites);
  const chatEnd = useRef<HTMLDivElement>(null);

  // Sync mode from URL when route param changes
  useEffect(() => {
    if (modeProp && modeProp !== mode) {
      setMode(modeProp);
      const prior = loadSession();
      setMessages(prior && prior.mode === modeProp ? prior.messages : []);
    }
  }, [modeProp]);

  // Persist conversation across short nav so coming back keeps the chat
  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ messages, mode }));
  }, [messages, mode]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') goBack(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [goBack]);

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
        body: JSON.stringify({
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
          mode,
          lang,
          clerkUserId: (window as any).__clerkUserId,
        }),
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

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    setMessages([]);
    navigate(`/ai-coach/${newMode}`, { replace: true });
  };

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
    background: 'var(--bs-bg2)',
    border: '1px solid var(--bs-border)',
    borderRadius: C.radius,
  } as React.CSSProperties;

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      minHeight: "100vh",
      background: "radial-gradient(ellipse at top, var(--bs-bg3), var(--bs-bg))",
      fontFamily: C.fn,
      boxShadow: "none",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 24px",
        borderBottom: "1px solid var(--bs-border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: 'var(--bs-glass)',
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
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--bs-text)', letterSpacing: 0.5 }}>{T("ai_coach")}</div>
            <div style={{ fontSize: 11, color: C.ash }}>{MODES.find(m => m.id === mode)?.desc}</div>
          </div>
        </div>
        <button onClick={goBack} aria-label={T("close") || "Close"} style={{
          background: "var(--bs-card)", border: "1px solid var(--bs-border)",
          color: "var(--bs-ash)", width: 36, height: 36, borderRadius: C.radiusSm,
          fontSize: 16, cursor: "pointer", fontFamily: C.fn,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "var(--bs-card2)"; e.currentTarget.style.color = "var(--bs-text)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "var(--bs-card)"; e.currentTarget.style.color = "var(--bs-ash)"; }}
        ><X size={16} strokeWidth={2} /></button>
      </div>

      {/* Tab Bar */}
      <div style={{ display: "flex", gap: 4, padding: "10px 24px", borderBottom: "1px solid var(--bs-border)" }}>
        {[{ id: "chat" as const, label: T("chat"), Icon: MessageSquare }, { id: "saved" as const, label: `${T("saved_responses")} (${favorites.length})`, Icon: Star }].map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            style={{
              flex: 1, padding: "9px 12px", fontSize: 11, fontWeight: 700, fontFamily: C.fn,
              cursor: "pointer", border: tab === tb.id ? `1px solid rgba(201,168,76,0.25)` : "1px solid transparent", borderRadius: C.radiusXs,
              background: tab === tb.id ? "rgba(201,168,76,0.1)" : "transparent",
              color: tab === tb.id ? C.gold : "var(--bs-ash)",
              transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
            <tb.Icon size={12} strokeWidth={1.5} /> {tb.label}
          </button>
        ))}
      </div>

      {tab === "saved" ? (
        <div style={{ flex: 1, padding: "16px 24px", overflowY: "auto" }}>
          {favorites.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--bs-ash)", fontSize: 13, marginTop: 60 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--bs-card)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <Star size={22} strokeWidth={1.5} color="var(--bs-ash)" />
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
                  <button onClick={() => copyText(fav.content)} style={{ background: "var(--bs-card)", border: "none", color: "var(--bs-ash)", cursor: "pointer", fontFamily: C.fn, padding: "5px 8px", borderRadius: C.radiusXs, display: "flex", alignItems: "center" }}><Copy size={13} strokeWidth={1.5} /></button>
                  <button onClick={() => deleteFavorite(i)} style={{ background: "rgba(204,16,16,0.1)", border: "none", color: C.red, cursor: "pointer", fontFamily: C.fn, padding: "5px 8px", borderRadius: C.radiusXs, display: "flex", alignItems: "center" }}><Trash2 size={13} strokeWidth={1.5} /></button>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "var(--bs-text)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {fav.content.length > 300 ? fav.content.slice(0, 300) + "..." : fav.content}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Mode Pills */}
          <div style={{ display: "flex", gap: 6, padding: "10px 24px", overflowX: "auto", borderBottom: "1px solid var(--bs-border)" }}>
            {MODES.map(m => (
              <button key={m.id} onClick={() => handleModeChange(m.id)}
                style={{
                  background: mode === m.id ? C.gradGold : "var(--bs-card)",
                  color: mode === m.id ? C.dark : "var(--bs-ash)",
                  border: mode === m.id ? "none" : "1px solid var(--bs-border)",
                  padding: "7px 16px", fontSize: 11, fontWeight: 700,
                  fontFamily: C.fn, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                  borderRadius: 999, transition: "all 0.25s",
                  boxShadow: "none",
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
                <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 16, color: "var(--bs-text)" }}>{T("coach_welcome")}</div>
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
                  background: msg.role === "user" ? C.gradTeal : "var(--bs-bg2)",
                  backdropFilter: msg.role === "assistant" ? C.blur : undefined,
                  color: "var(--bs-text)",
                  padding: "12px 16px",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap",
                  border: msg.role === "assistant" ? "1px solid var(--bs-border)" : "none",
                  boxShadow: "none",
                }}>
                  {msg.role === "assistant" && (
                    <>
                      <div style={{ fontSize: 9, color: C.gold, marginBottom: 6, fontWeight: 700, letterSpacing: 2 }}>{T("ai_coach").toUpperCase()}</div>
                      {msg.content}
                      <div style={{ display: "flex", gap: 6, marginTop: 10, borderTop: "1px solid var(--bs-border)", paddingTop: 8 }}>
                        <button onClick={() => copyText(msg.content)}
                          style={{
                            background: "var(--bs-card)", border: "none", color: "var(--bs-ash)", fontSize: 11,
                            cursor: "pointer", fontFamily: C.fn, display: "flex", alignItems: "center", gap: 4,
                            padding: "5px 10px", borderRadius: C.radiusXs, transition: "all 0.2s",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "var(--bs-card2)"}
                          onMouseLeave={e => e.currentTarget.style.background = "var(--bs-card)"}>
                          <Copy size={11} strokeWidth={1.5} /> {T("copy")}
                        </button>
                        <button onClick={() => saveResponse(msg.content)}
                          style={{
                            background: "var(--bs-card)", border: "none", color: "var(--bs-ash)", fontSize: 11,
                            cursor: "pointer", fontFamily: C.fn, display: "flex", alignItems: "center", gap: 4,
                            padding: "5px 10px", borderRadius: C.radiusXs, transition: "all 0.2s",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "var(--bs-card2)"}
                          onMouseLeave={e => e.currentTarget.style.background = "var(--bs-card)"}>
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
            padding: "14px 24px", borderTop: "1px solid var(--bs-border)",
            display: "flex", gap: 10, alignItems: "center",
            background: "var(--bs-glass)", backdropFilter: C.blur,
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder={T("coach_placeholder")}
              style={{
                flex: 1, background: "var(--bs-card)", border: "1px solid var(--bs-border)",
                color: "var(--bs-text)", padding: "12px 18px", fontSize: 14, fontFamily: C.fn,
                outline: "none", borderRadius: C.radiusSm, transition: "border-color 0.2s",
              }}
              onFocus={e => e.currentTarget.style.borderColor = "rgba(201, 168, 76, 0.4)"}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--bs-border)'}
            />
            <button onClick={() => sendMessage()}
              style={{
                background: C.gradGold, color: C.dark, border: "none",
                padding: "12px 20px", fontSize: 13, fontWeight: 700, fontFamily: C.fn,
                cursor: "pointer", flexShrink: 0, borderRadius: C.radiusSm,
                boxShadow: "none", transition: "all 0.2s",
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
