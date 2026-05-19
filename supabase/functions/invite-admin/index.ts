/**
 * invite-admin — Grants the bytesense_admin role to an email.
 *
 * Flow:
 *   1. Verify caller is bytesense_admin.
 *   2. Ask Clerk if a user with this email already exists.
 *      - If yes: upsert user_roles directly with their clerk_user_id. No email needed.
 *      - If no:  create a Clerk invitation (sends sign-up email) AND upsert
 *                pending_admin_invites so the role is claimed on first login.
 *   3. Always upsert pending_admin_invites for the not-yet-registered case,
 *      so the claim flow handles late sign-ups deterministically.
 *
 * Always returns HTTP 200 with { success, ...details } or { success: false, error }.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CLERK_SECRET_KEY = Deno.env.get("CLERK_SECRET_KEY") ?? "";
const APP_URL = "https://training.bytesense.ai";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!CLERK_SECRET_KEY) {
    return ok({ success: false, error: "Server misconfigured: CLERK_SECRET_KEY not set" });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: { email?: string; inviterClerkId?: string };
  try {
    body = await req.json();
  } catch {
    return ok({ success: false, error: "Invalid JSON body" });
  }

  const { email, inviterClerkId } = body;

  if (!email || !inviterClerkId) {
    return ok({ success: false, error: "email and inviterClerkId are required" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // 1. Verify caller is a bytesense_admin
  const { data: roleRow, error: roleErr } = await supabase
    .from("user_roles")
    .select("role")
    .eq("clerk_user_id", inviterClerkId)
    .eq("role", "bytesense_admin")
    .maybeSingle();

  if (roleErr) {
    console.error("Role lookup error:", roleErr);
    return ok({ success: false, error: `DB error checking role: ${roleErr.message}` });
  }

  if (!roleRow) {
    return ok({ success: false, error: "Unauthorized — inviter is not a bytesense_admin" });
  }

  // 2. Check if the email already maps to a Clerk user.
  //    Clerk's GET /v1/users filter uses the bracketed-array form
  //    `email_address[]=foo` — a plain `email_address=foo` is silently ignored.
  let existingClerkUserId: string | null = null;
  let lookupErrorDetail: string | null = null;
  try {
    // Clerk uses repeated `email_address` query params (not `email_address[]`
    // which is silently ignored and returns arbitrary users — same gotcha as
    // user_id[]).
    const lookupParams = new URLSearchParams();
    lookupParams.append("email_address", normalizedEmail);
    lookupParams.set("limit", "1");
    const lookupRes = await fetch(
      `https://api.clerk.com/v1/users?${lookupParams.toString()}`,
      { headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` } },
    );
    if (lookupRes.ok) {
      const found = await lookupRes.json().catch(() => []);
      if (Array.isArray(found) && found.length > 0) {
        // Defensive: confirm the returned user's primary email matches.
        const first = found[0];
        const primaryEmail = (first?.email_addresses?.[0]?.email_address ?? "").toLowerCase();
        if (primaryEmail === normalizedEmail) {
          existingClerkUserId = first.id ?? null;
        } else {
          lookupErrorDetail = `Clerk returned a user whose email (${primaryEmail}) doesn't match the lookup. Ignoring.`;
          console.warn(lookupErrorDetail);
        }
      }
    } else {
      const errBody = await lookupRes.text().catch(() => "");
      lookupErrorDetail = `Clerk user lookup returned ${lookupRes.status}: ${errBody.slice(0, 200)}`;
      console.warn(lookupErrorDetail);
    }
  } catch (lookupErr) {
    lookupErrorDetail = `Clerk user lookup threw: ${String(lookupErr)}`;
    console.error(lookupErrorDetail);
  }

  // 3a. Already-registered user → grant role directly, skip pending flow.
  if (existingClerkUserId) {
    const { error: upsertErr } = await supabase
      .from("user_roles")
      .upsert(
        { clerk_user_id: existingClerkUserId, role: "bytesense_admin" },
        { onConflict: "clerk_user_id,role" },
      );

    if (upsertErr) {
      // Fall back to plain insert in case the unique constraint isn't on the composite.
      const { error: insertErr } = await supabase
        .from("user_roles")
        .insert({ clerk_user_id: existingClerkUserId, role: "bytesense_admin" });
      if (insertErr && !insertErr.message.toLowerCase().includes("duplicate")) {
        console.error("user_roles upsert error:", upsertErr, insertErr);
        return ok({ success: false, error: `Failed to grant role: ${upsertErr.message}` });
      }
    }

    // Also clear any stale pending row for this email.
    await supabase.from("pending_admin_invites").delete().eq("email", normalizedEmail);

    return ok({
      success: true,
      email: normalizedEmail,
      mode: "direct_grant",
      clerkEmailSent: false,
      message: "User already has a Clerk account — admin role granted directly. No email sent.",
    });
  }

  // 3b. New user → send a Clerk invitation email AND record a pending invite.
  let clerkEmailSent = false;
  let clerkAlreadyInvited = false;
  let clerkErrorDetail: string | null = null;
  let clerkInvitationId: string | null = null;
  try {
    const clerkRes = await fetch("https://api.clerk.com/v1/invitations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: normalizedEmail,
        redirect_url: `${APP_URL}/register`,
      }),
    });

    const clerkBody = await clerkRes.json().catch(() => ({}));
    console.log("Clerk /invitations response:", clerkRes.status, JSON.stringify(clerkBody));

    if (clerkRes.ok) {
      clerkEmailSent = true;
      clerkInvitationId = clerkBody?.id ?? null;
    } else if (clerkRes.status === 422) {
      // 422 = "invitation already exists for this email". The email was NOT
      // re-sent. Look up the existing pending Clerk invitation so we can
      // still store its id and let cancel/remove revoke it later.
      clerkAlreadyInvited = true;
      clerkErrorDetail = "Clerk already has a pending invitation for this email — no new email sent.";
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
            ? all.find((i: any) => (i?.email_address ?? "").toLowerCase() === normalizedEmail)
            : null;
          if (match?.id) clerkInvitationId = match.id;
        }
      } catch (listErr) {
        console.warn("Could not look up pre-existing Clerk invitation id:", listErr);
      }
    } else {
      clerkErrorDetail = `Clerk returned ${clerkRes.status}: ${JSON.stringify(clerkBody).slice(0, 200)}`;
      console.error("Clerk API non-fatal error:", clerkErrorDetail);
    }
  } catch (clerkErr) {
    clerkErrorDetail = `Clerk fetch threw: ${String(clerkErr)}`;
    console.error(clerkErrorDetail);
  }

  // Upsert the pending invite either way — claim flow runs on first login.
  const upsertPayload: Record<string, unknown> = {
    email: normalizedEmail,
    role: "bytesense_admin",
  };
  if (clerkInvitationId) upsertPayload.clerk_invitation_id = clerkInvitationId;

  const { error: upsertErr } = await supabase
    .from("pending_admin_invites")
    .upsert(upsertPayload, { onConflict: "email" });

  if (upsertErr) {
    console.error("DB upsert error:", upsertErr);
    return ok({ success: false, error: `Failed to store pending invite: ${upsertErr.message}` });
  }

  return ok({
    success: true,
    email: normalizedEmail,
    mode: "pending_invite",
    clerkEmailSent,
    clerkAlreadyInvited,
    clerkErrorDetail,
    lookupErrorDetail,
    message: clerkEmailSent
      ? "Invitation email sent via Clerk"
      : clerkAlreadyInvited
        ? "Pending invite recorded — Clerk already had an invitation; share the sign-up link manually if needed."
        : "Pending invite recorded — Clerk email could not be sent; share the sign-up link manually.",
  });
});

function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
