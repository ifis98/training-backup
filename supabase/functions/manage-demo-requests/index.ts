/**
 * manage-demo-requests — Admin-gated read/update for the demo_requests table.
 *
 * INSERT into demo_requests is intentionally NOT gated here — anonymous
 * visitors submit demo requests from the landing page via the anon Supabase
 * client and the existing "Anyone can submit demo request" RLS policy. This
 * function only handles the admin-side operations whose RLS policies were
 * left referencing the pre-Clerk auth.uid() helper (which evaluates to NULL
 * under the anon publishable key, so admin reads/writes silently return
 * empty or no-op).
 *
 * Operations:
 *   - list:   returns all demo_requests rows ordered by created_at desc.
 *     body: { op: 'list', requesterClerkId: string }
 *   - update: patches a single row by id.
 *     body: { op: 'update', id: string, patch: { status?: string, admin_notes?: string }, requesterClerkId: string }
 *
 * Always returns HTTP 200 with { success, ... } or { success: false, error }.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Patch fields the admin UI is allowed to update. Keep this list narrow.
const ALLOWED_PATCH_FIELDS = new Set(["status", "admin_notes"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: {
    op?: "list" | "update";
    requesterClerkId?: string;
    id?: string;
    patch?: Record<string, unknown>;
  };
  try {
    body = await req.json();
  } catch {
    return ok({ success: false, error: "Invalid JSON body" });
  }

  const { op, requesterClerkId } = body;
  if (!op || !requesterClerkId) {
    return ok({ success: false, error: "op and requesterClerkId are required" });
  }

  // Verify requester is a bytesense_admin
  const { data: roleRow, error: roleErr } = await supabase
    .from("user_roles")
    .select("role")
    .eq("clerk_user_id", requesterClerkId)
    .eq("role", "bytesense_admin")
    .maybeSingle();

  if (roleErr) {
    return ok({ success: false, error: `DB error checking role: ${roleErr.message}` });
  }
  if (!roleRow) {
    return ok({ success: false, error: "Unauthorized — you are not a bytesense_admin" });
  }

  if (op === "list") {
    const { data, error: listErr } = await supabase
      .from("demo_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (listErr) {
      return ok({ success: false, error: `Failed to list demos: ${listErr.message}` });
    }
    return ok({ success: true, op: "list", demos: data ?? [] });
  }

  if (op === "update") {
    const id = (body.id ?? "").trim();
    if (!id) {
      return ok({ success: false, error: "id is required" });
    }
    const rawPatch = body.patch ?? {};
    const cleanPatch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rawPatch)) {
      if (ALLOWED_PATCH_FIELDS.has(k)) cleanPatch[k] = v;
    }
    if (Object.keys(cleanPatch).length === 0) {
      return ok({ success: false, error: "patch must include at least one of: " + [...ALLOWED_PATCH_FIELDS].join(", ") });
    }

    const { error: updErr } = await supabase
      .from("demo_requests")
      .update(cleanPatch)
      .eq("id", id);
    if (updErr) {
      return ok({ success: false, error: `Failed to update demo: ${updErr.message}` });
    }
    return ok({ success: true, op: "update", id, patched: cleanPatch });
  }

  return ok({ success: false, error: `Unknown op: ${op}` });
});

function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
