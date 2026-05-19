/**
 * remove-admin — Revokes the bytesense_admin role from a user AND clears any
 * pending_admin_invites row for the same email so a stale pending invite
 * doesn't silently re-grant the role on next login.
 *
 * Guards:
 *  - Requester must be a bytesense_admin themselves.
 *  - A user cannot remove their own admin access.
 *
 * Always returns HTTP 200 with { success: true } or { success: false, error }.
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

  // 1. Block self-removal
  if (targetClerkId === requesterClerkId) {
    return ok({ success: false, error: "You cannot remove your own admin access" });
  }

  // 2. Verify requester is a bytesense_admin
  const { data: roleRow, error: roleErr } = await supabase
    .from("user_roles")
    .select("role")
    .eq("clerk_user_id", requesterClerkId)
    .eq("role", "bytesense_admin")
    .maybeSingle();

  if (roleErr) {
    console.error("Role lookup error:", roleErr);
    return ok({ success: false, error: `DB error checking role: ${roleErr.message}` });
  }

  if (!roleRow) {
    return ok({ success: false, error: "Unauthorized — you are not a bytesense_admin" });
  }

  // 3. Best-effort lookup of the target's email from Clerk, used to clean up
  //    any matching pending_admin_invites row. Non-fatal if Clerk is unavailable.
  let targetEmail: string | null = null;
  if (CLERK_SECRET_KEY) {
    try {
      const clerkRes = await fetch(`https://api.clerk.com/v1/users/${targetClerkId}`, {
        headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
      });
      if (clerkRes.ok) {
        const u = await clerkRes.json().catch(() => ({}));
        targetEmail = (u?.email_addresses?.[0]?.email_address ?? "").toLowerCase() || null;
      } else {
        console.warn("Clerk user lookup non-OK:", clerkRes.status);
      }
    } catch (clerkErr) {
      console.warn("Clerk user lookup threw:", clerkErr);
    }
  }

  // 4. Delete the target's bytesense_admin role row
  const { error: deleteErr } = await supabase
    .from("user_roles")
    .delete()
    .eq("clerk_user_id", targetClerkId)
    .eq("role", "bytesense_admin");

  if (deleteErr) {
    console.error("Delete error:", deleteErr);
    return ok({ success: false, error: `Failed to remove role: ${deleteErr.message}` });
  }

  // 5. Also clear any stale pending invite for the same email AND revoke
  //    the matching Clerk invitation if one exists.
  let pendingCleared = false;
  let clerkInvitationRevoked = false;
  if (targetEmail) {
    const { data: pendingRow } = await supabase
      .from("pending_admin_invites")
      .select("id, clerk_invitation_id")
      .eq("email", targetEmail)
      .maybeSingle();

    let clerkInvitationId: string | null = pendingRow?.clerk_invitation_id ?? null;

    // Fallback: if we don't have the id stored, find it by listing.
    if (CLERK_SECRET_KEY && !clerkInvitationId) {
      try {
        const listParams = new URLSearchParams();
        listParams.set("status", "pending");
        listParams.set("limit", "100");
        const listRes = await fetch(`https://api.clerk.com/v1/invitations?${listParams.toString()}`, {
          headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
        });
        if (listRes.ok) {
          const all = await listRes.json().catch(() => []);
          const match = Array.isArray(all)
            ? all.find((i: any) => (i?.email_address ?? "").toLowerCase() === targetEmail)
            : null;
          if (match?.id) clerkInvitationId = match.id;
        }
      } catch (e) {
        console.warn("Clerk invitation list (remove-admin) threw:", e);
      }
    }

    if (CLERK_SECRET_KEY && clerkInvitationId) {
      try {
        const revokeRes = await fetch(
          `https://api.clerk.com/v1/invitations/${clerkInvitationId}/revoke`,
          { method: "POST", headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` } },
        );
        clerkInvitationRevoked = revokeRes.ok;
        if (!revokeRes.ok) {
          const errBody = await revokeRes.text().catch(() => "");
          console.warn("Clerk revoke (remove-admin) non-ok:", revokeRes.status, errBody.slice(0, 200));
        }
      } catch (e) {
        console.warn("Clerk revoke (remove-admin) threw:", e);
      }
    }

    const { error: pendingDelErr, count } = await supabase
      .from("pending_admin_invites")
      .delete({ count: "exact" })
      .eq("email", targetEmail);
    if (pendingDelErr) {
      console.warn("Pending invite cleanup failed (non-fatal):", pendingDelErr);
    } else {
      pendingCleared = (count ?? 0) > 0;
    }
  }

  return ok({ success: true, pendingCleared, clerkInvitationRevoked, targetEmail });
});

function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
