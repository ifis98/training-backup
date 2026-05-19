/**
 * delete-clerk-user — Hard-delete a Clerk user and clean up all Supabase
 * rows referencing them. Admin-only.
 *
 * Guards:
 *  - Requester must be a bytesense_admin.
 *  - A user cannot delete themselves.
 *
 * Body: { targetClerkId, requesterClerkId }
 * Always returns HTTP 200 with { success, ... }.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CLERK_SECRET_KEY = Deno.env.get("CLERK_SECRET_KEY") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!CLERK_SECRET_KEY) {
    return ok({ success: false, error: "Server misconfigured: CLERK_SECRET_KEY not set" });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: { targetClerkId?: string; requesterClerkId?: string };
  try {
    body = await req.json();
  } catch {
    return ok({ success: false, error: "Invalid JSON body" });
  }

  const { targetClerkId, requesterClerkId } = body;
  if (!targetClerkId || !requesterClerkId) {
    return ok({ success: false, error: "targetClerkId and requesterClerkId are required" });
  }

  if (targetClerkId === requesterClerkId) {
    return ok({ success: false, error: "You cannot delete your own account from here" });
  }

  // Verify requester is a bytesense_admin
  const { data: roleRow, error: roleErr } = await supabase
    .from("user_roles").select("role")
    .eq("clerk_user_id", requesterClerkId).eq("role", "bytesense_admin").maybeSingle();
  if (roleErr) return ok({ success: false, error: `DB error checking role: ${roleErr.message}` });
  if (!roleRow) return ok({ success: false, error: "Unauthorized — you are not a bytesense_admin" });

  // Best-effort: look up the target's email so we can also clear any pending
  // admin invites and revoke any matching Clerk invitation.
  let targetEmail: string | null = null;
  try {
    const userRes = await fetch(`https://api.clerk.com/v1/users/${targetClerkId}`, {
      headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
    });
    if (userRes.ok) {
      const u = await userRes.json().catch(() => ({}));
      targetEmail = (u?.email_addresses?.[0]?.email_address ?? "").toLowerCase() || null;
    }
  } catch (e) {
    console.warn("Clerk user lookup before delete failed:", e);
  }

  // Cascade clean-up in Supabase (each step is best-effort)
  const cleanup: Record<string, unknown> = {};
  for (const table of ["user_roles", "profiles", "training_progress", "simulation_reviews", "practice_intake", "cases", "support_bookings"]) {
    try {
      const { error, count } = await supabase
        .from(table)
        .delete({ count: "exact" })
        .eq("clerk_user_id", targetClerkId);
      cleanup[table] = error ? `err: ${error.message}` : (count ?? 0);
    } catch (e) {
      cleanup[table] = `threw: ${String(e)}`;
    }
  }

  // Clear any pending admin invite for this email
  if (targetEmail) {
    try {
      const { error, count } = await supabase
        .from("pending_admin_invites")
        .delete({ count: "exact" })
        .eq("email", targetEmail);
      cleanup.pending_admin_invites = error ? `err: ${error.message}` : (count ?? 0);
    } catch (e) {
      cleanup.pending_admin_invites = `threw: ${String(e)}`;
    }
  }

  // Finally: delete the Clerk user itself.
  let clerkDeleted = false;
  let clerkErrorDetail: string | null = null;
  try {
    const delRes = await fetch(`https://api.clerk.com/v1/users/${targetClerkId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
    });
    if (delRes.ok) {
      clerkDeleted = true;
    } else {
      const errBody = await delRes.text().catch(() => "");
      clerkErrorDetail = `Clerk DELETE returned ${delRes.status}: ${errBody.slice(0, 200)}`;
      console.error(clerkErrorDetail);
    }
  } catch (e) {
    clerkErrorDetail = `Clerk DELETE threw: ${String(e)}`;
    console.error(clerkErrorDetail);
  }

  return ok({
    success: true,
    clerkDeleted,
    clerkErrorDetail,
    targetEmail,
    cleanup,
  });
});

function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
