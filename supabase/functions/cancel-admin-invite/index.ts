/**
 * cancel-admin-invite — Revokes a pending admin invitation end-to-end:
 *   1. Calls Clerk POST /v1/invitations/{id}/revoke so the email link is dead.
 *   2. Deletes the row from pending_admin_invites so the claim flow won't
 *      auto-promote on next sign-in.
 *
 * Backwards-compat: rows created before we started storing clerk_invitation_id
 * are handled by falling back to a list-and-match on Clerk's invitations
 * endpoint, so older pending rows still get the Clerk revoke as well.
 *
 * Guards:
 *  - Requester must be a bytesense_admin themselves.
 *
 * Body: { email: string, requesterClerkId: string }
 * Always returns HTTP 200 with { success, ... } or { success: false, error }.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CLERK_SECRET_KEY = Deno.env.get("CLERK_SECRET_KEY") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: { op?: "cancel" | "list"; email?: string; requesterClerkId?: string };
  try {
    body = await req.json();
  } catch {
    return ok({ success: false, error: "Invalid JSON body" });
  }

  const { email, requesterClerkId } = body;
  const op = body.op ?? "cancel";

  if (!requesterClerkId) {
    return ok({ success: false, error: "requesterClerkId is required" });
  }
  if (op === "cancel" && !email) {
    return ok({ success: false, error: "email is required for cancel" });
  }

  // 1. Verify requester is a bytesense_admin
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
    const { data, error } = await supabase
      .from("pending_admin_invites")
      .select("id, email, role, invited_at")
      .order("invited_at", { ascending: false });
    if (error) return ok({ success: false, error: error.message });
    return ok({ success: true, op: "list", invites: data ?? [] });
  }

  const normalizedEmail = (email as string).trim().toLowerCase();

  // 2. Look up the existing pending row so we know the Clerk invitation id.
  const { data: pendingRow } = await supabase
    .from("pending_admin_invites")
    .select("id, clerk_invitation_id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  // 3. Revoke the Clerk invitation. Best-effort — we always continue to
  //    delete the local row even if Clerk's API is unavailable.
  let clerkRevoked = false;
  let clerkRevokeError: string | null = null;
  let clerkInvitationId: string | null = pendingRow?.clerk_invitation_id ?? null;

  if (CLERK_SECRET_KEY) {
    try {
      // Fallback path: if we don't have an id stored locally (old row, or the
      // invite-admin lookup didn't capture it), list pending Clerk invitations
      // and match by email.
      if (!clerkInvitationId) {
        const listParams = new URLSearchParams();
        listParams.set("status", "pending");
        listParams.set("limit", "100");
        const listRes = await fetch(`https://api.clerk.com/v1/invitations?${listParams.toString()}`, {
          headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
        });
        if (listRes.ok) {
          const all = await listRes.json().catch(() => []);
          const match = Array.isArray(all)
            ? all.find((i: any) => (i?.email_address ?? "").toLowerCase() === normalizedEmail)
            : null;
          if (match?.id) clerkInvitationId = match.id;
        } else {
          clerkRevokeError = `Clerk invitation list returned ${listRes.status}`;
        }
      }

      if (clerkInvitationId) {
        const revokeRes = await fetch(
          `https://api.clerk.com/v1/invitations/${clerkInvitationId}/revoke`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
          },
        );
        if (revokeRes.ok) {
          clerkRevoked = true;
        } else {
          const errBody = await revokeRes.text().catch(() => "");
          clerkRevokeError = `Clerk revoke returned ${revokeRes.status}: ${errBody.slice(0, 200)}`;
          console.warn(clerkRevokeError);
        }
      } else if (!clerkRevokeError) {
        clerkRevokeError = "No matching pending Clerk invitation found for this email — nothing to revoke on Clerk's side.";
      }
    } catch (clerkErr) {
      clerkRevokeError = `Clerk revoke threw: ${String(clerkErr)}`;
      console.error(clerkRevokeError);
    }
  } else {
    clerkRevokeError = "CLERK_SECRET_KEY not set — skipped Clerk revoke";
  }

  // 4. Delete the local pending row.
  const { error: delErr, count } = await supabase
    .from("pending_admin_invites")
    .delete({ count: "exact" })
    .eq("email", normalizedEmail);

  if (delErr) {
    return ok({ success: false, error: `Failed to cancel invite: ${delErr.message}` });
  }

  return ok({
    success: true,
    deleted: count ?? 0,
    clerkRevoked,
    clerkInvitationId,
    clerkRevokeError,
  });
});

function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
