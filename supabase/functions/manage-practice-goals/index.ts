/**
 * manage-practice-goals — Practice-scoped upsert/list for practice_goals.
 *
 * Operations:
 *   - get:    { op: 'get', requesterClerkId, practiceId? } → returns the single
 *             goal row for the practice
 *   - upsert: { op: 'upsert', requesterClerkId, payload: { monthly_case_goal, monthly_revenue_goal, price_per_case } }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_FIELDS = new Set(["monthly_case_goal", "monthly_revenue_goal", "price_per_case"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: {
    op?: "get" | "upsert";
    requesterClerkId?: string;
    practiceId?: string;
    payload?: Record<string, unknown>;
  };
  try { body = await req.json(); } catch { return ok({ success: false, error: "Invalid JSON body" }); }

  const { op, requesterClerkId } = body;
  if (!op || !requesterClerkId) return ok({ success: false, error: "op and requesterClerkId are required" });

  const { data: profile } = await supabase
    .from("profiles").select("practice_id").eq("clerk_user_id", requesterClerkId).maybeSingle();
  const callerPracticeId = profile?.practice_id ?? null;
  const practiceId = body.practiceId || callerPracticeId;

  if (!practiceId) {
    return ok({ success: false, error: "No practice context for caller" });
  }

  if (op === "get") {
    const { data, error } = await supabase
      .from("practice_goals").select("*").eq("practice_id", practiceId).maybeSingle();
    if (error) return ok({ success: false, error: error.message });
    return ok({ success: true, op: "get", goals: data });
  }

  if (op === "upsert") {
    if (callerPracticeId !== practiceId) {
      return ok({ success: false, error: "Unauthorized for this practice" });
    }
    const raw = body.payload ?? {};
    const cleanPayload: Record<string, unknown> = { practice_id: practiceId };
    for (const [k, v] of Object.entries(raw)) {
      if (ALLOWED_FIELDS.has(k)) cleanPayload[k] = v;
    }
    const { data, error } = await supabase
      .from("practice_goals").upsert(cleanPayload, { onConflict: "practice_id" }).select("*").maybeSingle();
    if (error) return ok({ success: false, error: error.message });
    return ok({ success: true, op: "upsert", goals: data });
  }

  return ok({ success: false, error: `Unknown op: ${op}` });
});

function ok(data: unknown) {
  return new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
