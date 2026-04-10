import { useState, useEffect } from 'react';
import { C } from '@/data/constants';
import { scrollTop } from '@/lib/helpers';
import { AppState } from '@/hooks/useAppState';
import { t, Lang } from '@/data/translations';

interface SimulationSummaryProps {
  s: AppState;
  u: (d: Partial<AppState>) => void;
  lang?: Lang;
}

interface SummaryData {
  score: number;
  scoreLabel: string;
  strengths: string[];
  improvements: string[];
  tips: string[];
  modulesToReview: string[];
  overallFeedback: string;
}

export default function SimulationSummary({ s, u, lang = "en" }: SimulationSummaryProps) {
  const T = (key: string) => t(lang, key);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { generateSummary(); }, []);

  const generateSummary = async () => {
    try {
      const conversationText = s.simMsgs.map(m => `${m.r === "user" ? "Staff" : "Patient"}: ${m.t}`).join("\n");
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(`${supabaseUrl}/functions/v1/ai-coach`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
        body: JSON.stringify({ messages: [{ role: "user", content: `Here is the full simulation conversation:\n\n${conversationText}\n\nPlease analyze and provide the structured coaching summary.` }], mode: "summary", lang }),
      });
      if (!resp.ok) throw new Error("Failed to generate summary");
      const data = await resp.json();
      const jsonMatch = data.reply.match(/\{[\s\S]*\}/);
      if (jsonMatch) { setSummary(JSON.parse(jsonMatch[0])); } else { throw new Error("Could not parse summary"); }
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const scoreColor = (score: number) => score >= 80 ? C.green : score >= 60 ? C.teal : score >= 40 ? C.gold : C.red;

  return (
    <div style={{ fontFamily: C.fn, background: C.dark, minHeight: "100vh" }}>
      <div style={{ padding: "14px 24px", borderBottom: `1px solid ${C.borderD}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: C.gold, textTransform: "uppercase", fontWeight: 700 }}>{T("session_summary")}</div>
        <div style={{ fontSize: 13, color: C.ash }}>{s.simP}/3 {T("patients_guided")}</div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 20px" }}>
        {loading && (
          <div style={{ textAlign: "center", color: C.ash, marginTop: 60 }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🧠</div>
            <div style={{ fontSize: 14 }}>{T("analyzing")}</div>
          </div>
        )}

        {error && (
          <div style={{ textAlign: "center", marginTop: 60 }}>
            <div style={{ color: C.red, fontSize: 14, marginBottom: 16 }}>{T("summary_error")} {error}</div>
            <button onClick={() => { u({ phase: "dashboard" }); scrollTop(); }}
              style={{ background: C.teal, color: C.white, border: "none", padding: "12px 24px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer" }}>
              {T("return_dashboard")}
            </button>
          </div>
        )}

        {summary && (
          <>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 56, fontWeight: 800, color: scoreColor(summary.score) }}>{summary.score}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: scoreColor(summary.score) }}>{summary.scoreLabel}</div>
              <div style={{ fontSize: 12, color: C.ash, marginTop: 8, lineHeight: 1.6, maxWidth: 400, margin: "8px auto 0" }}>{summary.overallFeedback}</div>
            </div>

            {summary.strengths.length > 0 && (
              <div style={{ background: C.dark2, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>{T("strengths")}</div>
                {summary.strengths.map((item, i) => (
                  <div key={i} style={{ fontSize: 13, color: C.white, marginBottom: 4, paddingLeft: 8, borderLeft: `2px solid ${C.green}`, lineHeight: 1.5 }}>{item}</div>
                ))}
              </div>
            )}

            {summary.improvements.length > 0 && (
              <div style={{ background: C.dark2, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>{T("areas_improve")}</div>
                {summary.improvements.map((item, i) => (
                  <div key={i} style={{ fontSize: 13, color: C.white, marginBottom: 4, paddingLeft: 8, borderLeft: `2px solid ${C.gold}`, lineHeight: 1.5 }}>{item}</div>
                ))}
              </div>
            )}

            {summary.tips.length > 0 && (
              <div style={{ background: C.dark2, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>{T("coaching_tips")}</div>
                {summary.tips.map((item, i) => (
                  <div key={i} style={{ fontSize: 13, color: C.white, marginBottom: 6, paddingLeft: 8, borderLeft: `2px solid ${C.teal}`, lineHeight: 1.5 }}>{item}</div>
                ))}
              </div>
            )}

            {summary.modulesToReview.length > 0 && (
              <div style={{ background: "rgba(212,175,55,0.08)", borderLeft: `3px solid ${C.gold}`, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, marginBottom: 8 }}>{T("recommended_review")}</div>
                {summary.modulesToReview.map((m, i) => (
                  <div key={i} style={{ fontSize: 13, color: C.ash, marginBottom: 2 }}>• {m}</div>
                ))}
              </div>
            )}

            <div style={{ textAlign: "center", marginTop: 24 }}>
              <button onClick={() => { u({ phase: "dashboard", simMsgs: [] }); scrollTop(); }}
                style={{ background: C.teal, color: C.white, border: "none", padding: "14px 32px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer" }}>
                {T("return_dashboard_arrow")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
