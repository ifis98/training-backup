/**
 * manage-admin-alerts — Admin-gated CRUD for admin_alerts.
 *
 * Operations:
 *   - list:   { op: 'list', requesterClerkId }
 *   - update: { op: 'update', id, patch: { status?, admin_notes?, resolved_at? }, requesterClerkId }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_PATCH_FIELDS = new Set(["status", "admin_notes", "resolved_at"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: { op?: "list" | "update"; requesterClerkId?: string; id?: string; patch?: Record<string, unknown> };
  try { body = await req.json(); } catch { return ok({ success: false, error: "Invalid JSON body" }); }

  const { op, requesterClerkId } = body;
  if (!op || !requesterClerkId) return ok({ success: false, error: "op and requesterClerkId are required" });

  const { data: roleRow, error: roleErr } = await supabase
    .from("user_roles").select("role")
    .eq("clerk_user_id", requesterClerkId).eq("role", "bytesense_admin").maybeSingle();
  if (roleErr) return ok({ success: false, error: `DB error checking role: ${roleErr.message}` });
  if (!roleRow) return ok({ success: false, error: "Unauthorized — you are not a bytesense_admin" });

  if (op === "list") {
    const { data, error } = await supabase.from("admin_alerts").select("*").order("created_at", { ascending: false });
    if (error) return ok({ success: false, error: error.message });
    return ok({ success: true, op: "list", alerts: data ?? [] });
  }

  if (op === "update") {
    const id = (body.id ?? "").trim();
    if (!id) return ok({ success: false, error: "id is required" });
    const cleanPatch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body.patch ?? {})) {
      if (ALLOWED_PATCH_FIELDS.has(k)) cleanPatch[k] = v;
    }
    if (Object.keys(cleanPatch).length === 0) {
      return ok({ success: false, error: "patch must include at least one of: " + [...ALLOWED_PATCH_FIELDS].join(", ") });
    }
    const { error } = await supabase.from("admin_alerts").update(cleanPatch).eq("id", id);
    if (error) return ok({ success: false, error: error.message });
    return ok({ success: true, op: "update", id, patched: cleanPatch });
  }

  return ok({ success: false, error: `Unknown op: ${op}` });
});

function ok(data: unknown) {
  return new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
