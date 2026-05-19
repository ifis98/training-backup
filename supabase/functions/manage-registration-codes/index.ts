/**
 * manage-registration-codes — Admin-gated CRUD for registration_codes.
 *
 * Pattern matches invite-admin / remove-admin: verify the caller is a
 * bytesense_admin via user_roles, then write with the service-role key so
 * RLS doesn't need to be loosened. Keeps the table locked down at the DB
 * layer while still letting the admin UI work after the Clerk migration
 * (which broke the auth.uid()-based RLS policy).
 *
 * Operations (selected by `op`):
 *   - list:     return all registration_codes ordered by created_at desc
 *     body: { op: 'list', requesterClerkId: string }
 *   - generate: insert N rows of registration_codes
 *     body: { op: 'generate', practiceName: string, repName?: string, count?: number, requesterClerkId: string }
 *   - revoke:   set status='revoked' on a single row by id
 *     body: { op: 'revoke', id: string, requesterClerkId: string }
 *   - link:     bind a redeemed code to the Clerk user who finished signup
 *     body: { op: 'link', code: string, clerkUserId: string, email: string }
 *     (no requesterClerkId admin gate — invoked by the user themselves
 *      post-signup; first-writer-wins to prevent attribution stealing.)
 *
 * Always returns HTTP 200 with { success, ... } or { success: false, error }.
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
    op?: "list" | "generate" | "revoke" | "link";
    requesterClerkId?: string;
    practiceName?: string;
    repName?: string;
    count?: number;
    id?: string;
    code?: string;
    clerkUserId?: string;
    email?: string;
  };
  try {
    body = await req.json();
  } catch {
    return ok({ success: false, error: "Invalid JSON body" });
  }

  const { op, requesterClerkId } = body;
  if (!op) return ok({ success: false, error: "op is required" });

  // ── link op: invoked by the redeeming user post-signup. No admin gate.
  //    First-writer-wins so an attacker can't steal attribution.
  if (op === "link") {
    const code = (body.code ?? "").trim().toUpperCase();
    const clerkUserId = (body.clerkUserId ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    if (!code || !clerkUserId) {
      return ok({ success: false, error: "code and clerkUserId are required" });
    }
    const { data: existing, error: lookupErr } = await supabase
      .from("registration_codes")
      .select("id, status, used_by_clerk_user_id")
      .eq("code", code)
      .maybeSingle();
    if (lookupErr) return ok({ success: false, error: lookupErr.message });
    if (!existing) return ok({ success: false, error: "Code not found" });
    if (existing.status !== "used") {
      return ok({ success: false, error: `Code is ${existing.status}, not used — cannot link` });
    }
    if (existing.used_by_clerk_user_id && existing.used_by_clerk_user_id !== clerkUserId) {
      return ok({ success: false, error: "Code already linked to a different user" });
    }
    const { error: updErr } = await supabase
      .from("registration_codes")
      .update({ used_by_clerk_user_id: clerkUserId, used_by_email: email || null })
      .eq("id", existing.id);
    if (updErr) return ok({ success: false, error: updErr.message });
    return ok({ success: true, op: "link", code, clerkUserId, email });
  }

  // All other ops require an admin caller.
  if (!requesterClerkId) {
    return ok({ success: false, error: "requesterClerkId is required" });
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
      .from("registration_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (listErr) {
      return ok({ success: false, error: `Failed to list codes: ${listErr.message}` });
    }
    return ok({ success: true, op: "list", codes: data ?? [] });
  }

  if (op === "generate") {
    const practiceName = (body.practiceName ?? "").trim();
    const repName = (body.repName ?? "").trim();
    const count = Math.max(1, Math.min(50, Number(body.count) || 1));

    if (!practiceName) {
      return ok({ success: false, error: "practiceName is required" });
    }

    const inserts = Array.from({ length: count }, () => ({
      practice_name: practiceName,
      rep_name: repName,
    }));

    const { data, error: insertErr } = await supabase
      .from("registration_codes")
      .insert(inserts)
      .select("id, code, practice_name, rep_name, status, expires_at, created_at");

    if (insertErr) {
      return ok({ success: false, error: `Failed to generate codes: ${insertErr.message}` });
    }

    return ok({ success: true, op: "generate", count: data?.length ?? 0, codes: data ?? [] });
  }

  if (op === "revoke") {
    const id = (body.id ?? "").trim();
    if (!id) {
      return ok({ success: false, error: "id is required" });
    }

    const { error: updErr } = await supabase
      .from("registration_codes")
      .update({ status: "revoked" })
      .eq("id", id);

    if (updErr) {
      return ok({ success: false, error: `Failed to revoke code: ${updErr.message}` });
    }

    return ok({ success: true, op: "revoke", id });
  }

  return ok({ success: false, error: `Unknown op: ${op}` });
});

function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
