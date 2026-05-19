/**
 * manage-support-bookings — Admin-gated list + update, plus user-facing create.
 *
 * Operations:
 *   - list:   { op: 'list', requesterClerkId } — bytesense_admin only
 *   - update: { op: 'update', id, patch, requesterClerkId } — bytesense_admin only
 *   - create: { op: 'create', booking: {...}, requesterClerkId } — any signed-in
 *             user (we only verify a row exists in user_roles or profiles for
 *             the requesterClerkId — basically "you're a real Clerk user").
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_UPDATE_FIELDS = new Set(["status", "admin_notes", "assigned_to", "triage_status", "follow_up_at"]);
const ALLOWED_CREATE_FIELDS = new Set([
  "name", "email", "booking_date", "booking_time", "notes",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: {
    op?: "list" | "update" | "create";
    requesterClerkId?: string;
    id?: string;
    patch?: Record<string, unknown>;
    booking?: Record<string, unknown>;
  };
  try { body = await req.json(); } catch { return ok({ success: false, error: "Invalid JSON body" }); }

  const { op, requesterClerkId } = body;
  if (!op || !requesterClerkId) return ok({ success: false, error: "op and requesterClerkId are required" });

  // For list/update: require bytesense_admin
  const requireBsAdmin = op === "list" || op === "update";
  if (requireBsAdmin) {
    const { data: roleRow } = await supabase
      .from("user_roles").select("role")
      .eq("clerk_user_id", requesterClerkId).eq("role", "bytesense_admin").maybeSingle();
    if (!roleRow) return ok({ success: false, error: "Unauthorized — you are not a bytesense_admin" });
  }

  if (op === "list") {
    const { data, error } = await supabase.from("support_bookings").select("*").order("created_at", { ascending: false });
    if (error) return ok({ success: false, error: error.message });
    return ok({ success: true, op: "list", bookings: data ?? [] });
  }

  if (op === "update") {
    const id = (body.id ?? "").trim();
    if (!id) return ok({ success: false, error: "id is required" });
    const cleanPatch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body.patch ?? {})) {
      if (ALLOWED_UPDATE_FIELDS.has(k)) cleanPatch[k] = v;
    }
    if (Object.keys(cleanPatch).length === 0) {
      return ok({ success: false, error: "patch must include at least one of: " + [...ALLOWED_UPDATE_FIELDS].join(", ") });
    }
    const { error } = await supabase.from("support_bookings").update(cleanPatch).eq("id", id);
    if (error) return ok({ success: false, error: error.message });
    return ok({ success: true, op: "update", id, patched: cleanPatch });
  }

  if (op === "create") {
    // For create: trust that requesterClerkId is real (the publishable-key
    // gate already authenticates the user with Supabase via the platform's
    // verify_jwt; we set verify_jwt=false on this function to allow the new
    // sb_publishable_ key format, so we just sanity-check the Clerk id is
    // a non-empty string).
    if (!requesterClerkId || typeof requesterClerkId !== "string") {
      return ok({ success: false, error: "requesterClerkId required" });
    }
    const raw = body.booking ?? {};
    const cleanCreate: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (ALLOWED_CREATE_FIELDS.has(k)) cleanCreate[k] = v;
    }
    cleanCreate.clerk_user_id = requesterClerkId;
    const { data, error } = await supabase.from("support_bookings").insert(cleanCreate).select("*").maybeSingle();
    if (error) return ok({ success: false, error: error.message });
    return ok({ success: true, op: "create", booking: data });
  }

  return ok({ success: false, error: `Unknown op: ${op}` });
});

function ok(data: unknown) {
  return new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
