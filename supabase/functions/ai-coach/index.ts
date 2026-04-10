import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TRAINING_KNOWLEDGE = `
You are the ByteSense AI Coach — a knowledgeable, encouraging mentor for dental practice staff who are learning the ByteSense system.

COMPLETE TRAINING KNOWLEDGE:
- ByteSense is a WELLNESS HEALTH INTELLIGENCE PLATFORM. NEVER call it a "night guard" or "mouthguard."
- 6 embedded sensors: Heart Rate/HRV, EMG (grinding intensity), Respiratory, Temperature, Motion/Sleep Position, Blood Oxygen (SpO2)
- bitely companion app: daily ByteSense Score (0-100), trends, sleep quality data
- Integrates with Apple Health & Google Health
- Wellness device category (like Apple Watch for your mouth) — no prescription needed
- Custom-fit from an exact digital scan of the patient's teeth. Comfort: 3-7 nights to fully adjust
- Cost reframe: one-time investment vs. $15K–$40K in cumulative dental damage over 10 years (crowns, implants, root canals)
- Objection handling frameworks:
  • Feel-Felt-Found: "I understand how you feel. Many patients have felt the same way. What they found was..."
  • Isolation Technique (for "I need to think about it"): "Absolutely, what specifically would you like to think about?"
  • Price Moment: State the price confidently, then SILENCE. Let the patient respond first.
  • "Too expensive" reframe: Compare to cost of NOT treating (damaged teeth, TMJ surgery, sleep issues)
- 8-stage patient journey: Awareness → Screening → Education → Recommendation → Commitment → Fitting → Onboarding → Follow-up
- Warm handoff protocol: clinician introduces by name, states why ByteSense fits THIS patient specifically
- Insurance: ByteSense is not typically covered by insurance but financing/payment plans are available
- Clinical validation: FDA-registered, peer-reviewed sensor accuracy, real-time biometric monitoring
- Key roles: Owner, Associate Dentist, Hygienist, Treatment Coordinator, Office Manager, Dental Assistant, Front Desk
- Each role has specific duties and bonus structures ($15-$75 per case depending on role)
- Morning huddle structure: schedule review, patient flags, goals, wins
- Post-delivery follow-up: 24-hour check-in call, 1-week, 2-week, 1-month, 3-month touchpoints
- Referral program: satisfied patients generate referrals + Google reviews
- Scanning: precision digital scan, submit via Medit Link Web, quality criteria for zero rejections
- Delivery: set up bitely app, pair device, walk through first-night instructions, video testimonial
`;

const MODE_PROMPTS: Record<string, string> = {
  general: `${TRAINING_KNOWLEDGE}
You are in GENERAL COACHING mode. Staff can ask you anything about ByteSense, handling situations, patient questions, or training concepts. Give clear, actionable advice. Reference specific training frameworks when relevant. Be encouraging but precise.`,

  followup: `${TRAINING_KNOWLEDGE}
You are in PATIENT FOLLOW-UP mode. Help staff write professional, warm follow-up messages for patients. The user will describe the patient situation and you should generate a ready-to-send message. Always include:
- Personal touch referencing their visit
- Value reminder (not pushy)
- Clear next step / call to action
- Professional but warm tone
Format the message clearly so they can copy/paste it. Ask what format they need (SMS, email, or letter) if not specified.`,

  treatment: `${TRAINING_KNOWLEDGE}
You are in TREATMENT PLAN mode. Help staff create treatment plan talking points and presentation scripts for specific patient scenarios. Include:
- How to present ByteSense to this specific patient type
- Which objections to anticipate
- Recommended framework (Feel-Felt-Found, Isolation, etc.)
- Specific value propositions for their situation
- Financial conversation script`,

  objections: `${TRAINING_KNOWLEDGE}
You are in OBJECTION HANDLING mode. Staff will describe a patient objection or difficult situation. Provide:
- The best framework to use (Feel-Felt-Found, Isolation, Price Moment, etc.)
- A word-for-word script they can practice
- Why this approach works psychologically
- Common follow-up objections and how to handle those too
- Encouragement and confidence building`,

  educational: `${TRAINING_KNOWLEDGE}
You are in EDUCATIONAL MATERIAL mode. Help staff create patient-facing educational content about ByteSense. This could be:
- Brochure text explaining ByteSense benefits
- FAQ answers for common patient questions
- Social media posts about oral wellness
- Waiting room information cards
- Email newsletter content about grinding/bruxism awareness
Make content professional, accurate, and patient-friendly. Never use clinical jargon. Focus on benefits and wellness.`,

  summary: `${TRAINING_KNOWLEDGE}
You are in SIMULATION SUMMARY mode. You will receive a full patient simulation conversation between a staff member and an AI patient. Analyze the conversation and provide a structured coaching summary.

RESPOND IN THIS EXACT JSON FORMAT:
{
  "score": <number 1-100>,
  "scoreLabel": "<Excellent/Good/Needs Improvement/Struggling>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area 1>", "<area 2>", "<area 3>"],
  "tips": ["<actionable tip 1>", "<actionable tip 2>", "<actionable tip 3>"],
  "modulesToReview": ["<module name 1>", "<module name 2>"],
  "overallFeedback": "<2-3 sentence encouraging summary>"
}

Score guide:
- 80-100: Used training frameworks correctly, addressed objections well, maintained proper terminology
- 60-79: Good effort, some missed opportunities, minor terminology issues
- 40-59: Needs more practice, missed key objection handling, weak value presentation
- 1-39: Struggling significantly, used forbidden terms, couldn't address basic questions

Be specific in your feedback. Reference exact things they said (good or bad). Be encouraging but honest.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode = "general", lang = "en" } = await req.json();

    const LANG_NAMES: Record<string, string> = { en: "English", es: "Spanish", pt: "Portuguese", fr: "French", zh: "Chinese" };
    const langInstruction = lang !== "en" ? `\n\nIMPORTANT: Respond entirely in ${LANG_NAMES[lang] || "English"}. All advice, scripts, templates, and content must be in ${LANG_NAMES[lang] || "English"}.` : "";

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.general;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please wait a moment and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please contact your administrator." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I'm not sure how to help with that.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-coach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
