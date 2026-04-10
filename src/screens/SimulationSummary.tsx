import { useState, useEffect } from 'react';
import { C } from '@/data/constants';
import { scrollTop } from '@/lib/helpers';
import { AppState } from '@/hooks/useAppState';

interface SimulationSummaryProps {
  s: AppState;
  u: (d: Partial<AppState>) => void;
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

export default function SimulationSummary({ s, u }: SimulationSummaryProps) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateSummary();
  }, []);

  const generateSummary = async () => {
    try {
      const conversationText = s.simMsgs.map(m =>
        `${m.r === "user" ? "Staff" : "Patient"}: ${m.t}`
      ).join("\n");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(`${supabaseUrl}/functions/v1/ai-coach`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Here is the full simulation conversation:\n\n${conversationText}\n\nPlease analyze and provide the structured coaching summary.` }],
          mode: "summary",
        }),
      });

      if (!resp.ok) throw new Error("Failed to generate summary");

      const data = await resp.json();
      // Parse the JSON from the reply
      const jsonMatch = data.reply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        setSummary(JSON.parse(jsonMatch[0]));
      } else {
        throw new Error("Could not parse summary");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return C.green;
    if (score >= 60) return C.teal;
    if (score >= 40) return C.gold;
    return C.red;
  };

  return (
    <div style={{ fontFamily: C.fn, background: C.dark, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ padding: "14px 24px", borderBottom: `1px solid ${C.borderD}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: C.gold, textTransform: "uppercase", fontWeight: 700 }}>Session Summary</div>
        <div style={{ fontSize: 13, color: C.ash }}>{s.simP}/3 patients guided</div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 20px" }}>
        {loading && (
          <div style={{ textAlign: "center", color: C.ash, marginTop: 60 }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🧠</div>
            <div style={{ fontSize: 14 }}>Analyzing your performance...</div>
          </div>
        )}

        {error && (
          <div style={{ textAlign: "center", marginTop: 60 }}>
            <div style={{ color: C.red, fontSize: 14, marginBottom: 16 }}>Could not generate summary: {error}</div>
            <button onClick={() => { u({ phase: "dashboard" }); scrollTop(); }}
              style={{ background: C.teal, color: C.white, border: "none", padding: "12px 24px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer" }}>
              Return to Dashboard
            </button>
          </div>
        )}

        {summary && (
          <>
            {/* Score */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 56, fontWeight: 800, color: scoreColor(summary.score) }}>{summary.score}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: scoreColor(summary.score) }}>{summary.scoreLabel}</div>
              <div style={{ fontSize: 12, color: C.ash, marginTop: 8, lineHeight: 1.6, maxWidth: 400, margin: "8px auto 0" }}>
                {summary.overallFeedback}
              </div>
            </div>

            {/* Strengths */}
            {summary.strengths.length > 0 && (
              <div style={{ background: C.dark2, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>💪 Strengths</div>
                {summary.strengths.map((s, i) => (
                  <div key={i} style={{ fontSize: 13, color: C.white, marginBottom: 4, paddingLeft: 8, borderLeft: `2px solid ${C.green}`, lineHeight: 1.5 }}>{s}</div>
                ))}
              </div>
            )}

            {/* Improvements */}
            {summary.improvements.length > 0 && (
              <div style={{ background: C.dark2, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>📈 Areas to Improve</div>
                {summary.improvements.map((s, i) => (
                  <div key={i} style={{ fontSize: 13, color: C.white, marginBottom: 4, paddingLeft: 8, borderLeft: `2px solid ${C.gold}`, lineHeight: 1.5 }}>{s}</div>
                ))}
              </div>
            )}

            {/* Tips */}
            {summary.tips.length > 0 && (
              <div style={{ background: C.dark2, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>💡 Coaching Tips</div>
                {summary.tips.map((s, i) => (
                  <div key={i} style={{ fontSize: 13, color: C.white, marginBottom: 6, paddingLeft: 8, borderLeft: `2px solid ${C.teal}`, lineHeight: 1.5 }}>{s}</div>
                ))}
              </div>
            )}

            {/* Modules to Review */}
            {summary.modulesToReview.length > 0 && (
              <div style={{ background: "rgba(212,175,55,0.08)", borderLeft: `3px solid ${C.gold}`, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, marginBottom: 8 }}>📖 Recommended Review</div>
                {summary.modulesToReview.map((m, i) => (
                  <div key={i} style={{ fontSize: 13, color: C.ash, marginBottom: 2 }}>• {m}</div>
                ))}
              </div>
            )}

            {/* Return Button */}
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <button onClick={() => { u({ phase: "dashboard", simMsgs: [] }); scrollTop(); }}
                style={{ background: C.teal, color: C.white, border: "none", padding: "14px 32px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer" }}>
                Return to Dashboard →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
