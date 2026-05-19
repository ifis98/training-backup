/**
 * manage-practices — Admin-gated read for the practices table (with joined
 * profiles + training_progress). RLS on practices is the old pre-Clerk
 * auth.uid() pattern which returns NULL under the anon publishable key, so
 * admin reads silently returned []. This function uses service role to
 * bypass RLS, gated by a bytesense_admin role check.
 *
 * Operations:
 *   - list: { op: 'list', requesterClerkId }
 *   - get:  { op: 'get', id, requesterClerkId }
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

  let body: { op?: "list" | "get"; requesterClerkId?: string; id?: string };
  try { body = await req.json(); } catch { return ok({ success: false, error: "Invalid JSON body" }); }

  const { op, requesterClerkId } = body;
  if (!op || !requesterClerkId) return ok({ success: false, error: "op and requesterClerkId are required" });

  const { data: roleRow, error: roleErr } = await supabase
    .from("user_roles").select("role")
    .eq("clerk_user_id", requesterClerkId).eq("role", "bytesense_admin").maybeSingle();
  if (roleErr) return ok({ success: false, error: `DB error checking role: ${roleErr.message}` });
  if (!roleRow) return ok({ success: false, error: "Unauthorized — you are not a bytesense_admin" });

  if (op === "list") {
    const { data, error } = await supabase
      .from("practices")
      .select("*, profiles(user_id, full_name, created_at), training_progress(user_id, done_modules, xp, completed_at, updated_at)")
      .order("created_at", { ascending: false });
    if (error) return ok({ success: false, error: error.message });
    return ok({ success: true, op: "list", practices: data ?? [] });
  }

  if (op === "get") {
    const id = (body.id ?? "").trim();
    if (!id) return ok({ success: false, error: "id is required" });
    const { data, error } = await supabase.from("practices").select("*").eq("id", id).maybeSingle();
    if (error) return ok({ success: false, error: error.message });
    return ok({ success: true, op: "get", practice: data });
  }

  return ok({ success: false, error: `Unknown op: ${op}` });
});

function ok(data: unknown) {
  return new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
