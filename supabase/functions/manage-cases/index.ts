/**
 * manage-cases — User-facing CRUD for cases, gated by practice membership.
 *
 * The original RLS used auth.uid() which is null under Clerk. This function
 * uses service role to bypass RLS, and enforces authorization at the
 * application layer:
 *   - All ops require `requesterClerkId` matching a profile with a practice_id.
 *   - list:   any user belonging to practice X can see cases for that practice.
 *   - create: any user belonging to practice X can create cases for that practice.
 *   - update: any user belonging to practice X can update cases for that practice.
 *   - bytesense_admin can do everything.
 *
 * Operations:
 *   - list:   { op: 'list', requesterClerkId, practiceId? }
 *   - create: { op: 'create', requesterClerkId, payload: { patient_name, ... } }
 *   - update: { op: 'update', id, patch: { status?, notes?, case_value? }, requesterClerkId }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_CREATE_FIELDS = new Set([
  "patient_name", "case_value", "notes", "status",
]);
const ALLOWED_UPDATE_FIELDS = new Set([
  "status", "notes", "case_value", "patient_name", "assigned_to",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: {
    op?: "list" | "create" | "update";
    requesterClerkId?: string;
    practiceId?: string;
    id?: string;
    patch?: Record<string, unknown>;
    payload?: Record<string, unknown>;
  };
  try { body = await req.json(); } catch { return ok({ success: false, error: "Invalid JSON body" }); }

  const { op, requesterClerkId } = body;
  if (!op || !requesterClerkId) return ok({ success: false, error: "op and requesterClerkId are required" });

  // Resolve caller's practice + role context
  const [{ data: profile }, { data: bsAdminRow }] = await Promise.all([
    supabase.from("profiles").select("id, practice_id").eq("clerk_user_id", requesterClerkId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("clerk_user_id", requesterClerkId).eq("role", "bytesense_admin").maybeSingle(),
  ]);
  const isBsAdmin = !!bsAdminRow;
  const callerPracticeId = profile?.practice_id ?? null;

  if (op === "list") {
    const practiceId = body.practiceId || callerPracticeId;
    if (!isBsAdmin && (!practiceId || practiceId !== callerPracticeId)) {
      return ok({ success: false, error: "Unauthorized — no practice context" });
    }
    let q = supabase.from("cases").select("*").order("created_at", { ascending: false });
    if (practiceId) q = q.eq("practice_id", practiceId);
    const { data, error } = await q;
    if (error) return ok({ success: false, error: error.message });
    return ok({ success: true, op: "list", cases: data ?? [] });
  }

  if (op === "create") {
    if (!isBsAdmin && !callerPracticeId) {
      return ok({ success: false, error: "Unauthorized — no practice context" });
    }
    const raw = body.payload ?? {};
    const cleanCreate: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (ALLOWED_CREATE_FIELDS.has(k)) cleanCreate[k] = v;
    }
    cleanCreate.clerk_user_id = requesterClerkId;
    cleanCreate.practice_id = callerPracticeId;
    if (!cleanCreate.patient_name) {
      return ok({ success: false, error: "patient_name is required" });
    }
    const { data, error } = await supabase.from("cases").insert(cleanCreate).select("*").maybeSingle();
    if (error) return ok({ success: false, error: error.message });
    return ok({ success: true, op: "create", case: data });
  }

  if (op === "update") {
    const id = (body.id ?? "").trim();
    if (!id) return ok({ success: false, error: "id is required" });
    // Verify the case belongs to caller's practice (or caller is bsAdmin)
    if (!isBsAdmin) {
      const { data: caseRow } = await supabase.from("cases").select("practice_id").eq("id", id).maybeSingle();
      if (!caseRow || caseRow.practice_id !== callerPracticeId) {
        return ok({ success: false, error: "Unauthorized for this case" });
      }
    }
    const cleanPatch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body.patch ?? {})) {
      if (ALLOWED_UPDATE_FIELDS.has(k)) cleanPatch[k] = v;
    }
    if (Object.keys(cleanPatch).length === 0) {
      return ok({ success: false, error: "patch must include at least one of: " + [...ALLOWED_UPDATE_FIELDS].join(", ") });
    }
    const { error } = await supabase.from("cases").update(cleanPatch).eq("id", id);
    if (error) return ok({ success: false, error: error.message });
    return ok({ success: true, op: "update", id, patched: cleanPatch });
  }

  return ok({ success: false, error: `Unknown op: ${op}` });
});

function ok(data: unknown) {
  return new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
