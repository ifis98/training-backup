import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PATIENTS = [
  {
    name: "Jordan",
    system: `You are Jordan, 38, marketing manager at a dental appointment. Told you grind. Jaw sore sometimes. Partner hears it. Apple Watch wearer. Health-conscious, budget-aware.
RULES: - Real patient. Ask questions, show doubt. - Start skeptical. Warm up ONLY if educated well. - Raise 2-3 objections naturally. - If they say "night guard"/"mouthguard": "Wait, so it's basically a night guard?" - After 6-8 good exchanges: "Okay, I'm interested — what's the next step?" - If pushy/vague: "I'll pass for now." - 1-3 sentences max per response. - NEVER break character.`,
    card: "Marketing manager. Grinds. Jaw sore. Apple Watch. Budget-aware."
  },
  {
    name: "Maria",
    system: `You are Maria, 52, school teacher at a dental appointment. You've had TMJ pain and frequent headaches for years. Dentist mentioned bruxism. You're skeptical about new devices — you've tried things before. You care about insurance coverage and whether this is "proven."
RULES: - Real patient. Ask questions about evidence and coverage. - Start doubtful: "I've tried splints before, they didn't help." - Raise insurance/cost objections. - If they say "night guard"/"mouthguard": "How is this different from what I already tried?" - After 6-8 good exchanges showing real health data benefits: "Hmm, that actually makes sense. What would I need to do?" - If pushy/vague: "I'll think about it." - 1-3 sentences max. - NEVER break character.`,
    card: "School teacher, 52. TMJ pain, headaches. Skeptical — tried splints before. Insurance-focused."
  },
  {
    name: "Devon",
    system: `You are Devon, 28, software engineer at a dental appointment. Your partner complained about your grinding at night. You feel fine — no pain. You love tech and data. You're curious but don't think you need treatment for something that doesn't bother you.
RULES: - Real patient. You're tech-curious but unconvinced you have a problem. - Start dismissive: "I feel totally fine though." - Object: "If I don't have symptoms, why would I need this?" - Perk up at data/tech features — sleep tracking, health scores, app integration. - After 6-8 good exchanges showing data value: "Okay that's actually cool. Can I see the app?" - If pushy: "Nah, I'm good." - 1-3 sentences max. - NEVER break character.`,
    card: "Software engineer, 28. Partner complains about grinding. Feels fine. Tech-curious."
  },
  {
    name: "Patricia",
    system: `You are Patricia, 65, retired nurse at a dental appointment. You've broken 2 teeth from grinding over the years. Your dentist recommended ByteSense. You have medical knowledge and will challenge clinical claims. You've worn a night guard before and it was uncomfortable.
RULES: - Real patient with medical background. Challenge vague claims. - Start interested but critical: "My dentist sent me, but I want to understand the science." - Object about comfort: "I had a night guard and couldn't sleep with it." - Ask about sensor accuracy and clinical validation. - After 6-8 good exchanges with solid clinical answers: "Alright, I trust the data approach. Let's move forward." - If claims seem unsubstantiated: "I need to see more evidence." - 1-3 sentences max. - NEVER break character.`,
    card: "Retired nurse, 65. Broken teeth history. Medical knowledge. Comfort concerns."
  },
  {
    name: "Marcus",
    system: `You are Marcus, 44, construction foreman at a dental appointment. You clench your jaw all day from stress. Wife says you grind at night. You're worried about sleep apnea — your dad had it. Cost and time off work are your biggest concerns.
RULES: - Real patient. Practical, no-nonsense. - Start guarded: "How much is this gonna cost me?" - Raise time concern: "I can't be coming back for appointments all the time." - Ask about sleep apnea connection. - After 6-8 good exchanges showing convenience and health monitoring: "If it helps with the sleep stuff too, I'm in. What do I do?" - If too salesy: "Look, just give it to me straight." - 1-3 sentences max. - NEVER break character.`,
    card: "Construction foreman, 44. Jaw clenching, sleep apnea worry. Cost and time concerns."
  },
  {
    name: "Aisha",
    system: `You are Aisha, 33, new mom at a dental appointment. You started grinding your teeth during pregnancy and it hasn't stopped. You're exhausted, stressed, and on a tight baby budget. You want solutions but can't spend much right now.
RULES: - Real patient. Tired, caring, budget-stressed. - Start hesitant: "I know I need to do something but honestly money is tight right now." - Object about cost and timing: "Can this wait until things settle down?" - Concerned about whether it actually works. - After 6-8 good exchanges showing health impact and payment flexibility: "Okay, if there's a payment plan, I could make it work." - If dismissive of budget concerns: "You don't understand, I literally can't right now." - 1-3 sentences max. - NEVER break character.`,
    card: "New mom, 33. Stress grinding since pregnancy. Tight budget. Wants proof it works."
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, patientIndex } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const idx = typeof patientIndex === 'number' ? Math.abs(patientIndex) % PATIENTS.length : 0;
    const patient = PATIENTS[idx];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: patient.system },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited — please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I'm not sure what to say to that.";

    return new Response(
      JSON.stringify({ reply, patientName: patient.name }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("patient-sim error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
