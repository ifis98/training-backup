/**
 * manage-staff-invitations — Practice-scoped staff invitations.
 *
 * Operations:
 *   - list:   { op: 'list', requesterClerkId, practiceId? }
 *   - create: { op: 'create', requesterClerkId, email }
 *   - update: { op: 'update', id, status, requesterClerkId } — status in {accepted,revoked}
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    email?: string;
    id?: string;
    status?: string;
  };
  try { body = await req.json(); } catch { return ok({ success: false, error: "Invalid JSON body" }); }

  const { op, requesterClerkId } = body;
  if (!op || !requesterClerkId) return ok({ success: false, error: "op and requesterClerkId are required" });

  const [{ data: profile }, { data: bsAdminRow }] = await Promise.all([
    supabase.from("profiles").select("practice_id").eq("clerk_user_id", requesterClerkId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("clerk_user_id", requesterClerkId).eq("role", "bytesense_admin").maybeSingle(),
  ]);
  const isBsAdmin = !!bsAdminRow;
  const callerPracticeId = profile?.practice_id ?? null;
  const practiceId = body.practiceId || callerPracticeId;

  if (!isBsAdmin && (!practiceId || practiceId !== callerPracticeId)) {
    return ok({ success: false, error: "Unauthorized — no practice context" });
  }

  if (op === "list") {
    let q = supabase.from("staff_invitations").select("*").order("created_at", { ascending: false });
    if (practiceId) q = q.eq("practice_id", practiceId);
    const { data, error } = await q;
    if (error) return ok({ success: false, error: error.message });
    return ok({ success: true, op: "list", invitations: data ?? [] });
  }

  if (op === "create") {
    const email = (body.email ?? "").trim().toLowerCase();
    if (!email) return ok({ success: false, error: "email is required" });
    if (!practiceId) return ok({ success: false, error: "practiceId required" });
    const { data, error } = await supabase.from("staff_invitations").insert({
      practice_id: practiceId,
      email,
      invited_by_clerk_user_id: requesterClerkId,
      status: "pending",
    }).select("*").maybeSingle();
    if (error) return ok({ success: false, error: error.message });
    return ok({ success: true, op: "create", invitation: data });
  }

  if (op === "update") {
    const id = (body.id ?? "").trim();
    const status = (body.status ?? "").trim();
    if (!id || !status) return ok({ success: false, error: "id and status are required" });
    if (!["pending", "accepted", "revoked"].includes(status)) {
      return ok({ success: false, error: "status must be one of: pending, accepted, revoked" });
    }
    // Verify caller's practice owns this invitation
    if (!isBsAdmin) {
      const { data: invRow } = await supabase.from("staff_invitations").select("practice_id").eq("id", id).maybeSingle();
      if (!invRow || invRow.practice_id !== callerPracticeId) {
        return ok({ success: false, error: "Unauthorized for this invitation" });
      }
    }
    const { error } = await supabase.from("staff_invitations").update({ status }).eq("id", id);
    if (error) return ok({ success: false, error: error.message });
    return ok({ success: true, op: "update", id, status });
  }

  return ok({ success: false, error: `Unknown op: ${op}` });
});

function ok(data: unknown) {
  return new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
