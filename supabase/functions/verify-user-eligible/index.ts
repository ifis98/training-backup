/**
 * verify-user-eligible — Returns whether a Clerk user is allowed to use the
 * app. Closes the Google-OAuth-on-/login bypass where Clerk auto-creates an
 * account for any Google sign-in regardless of our code-gate.
 *
 * Called from useAuth.ts right after Clerk loads the user. If `allowed:false`
 * the frontend signs the user out and (optionally) hard-deletes their Clerk
 * account.
 *
 * Eligible if ANY of:
 *   - has a user_roles row (admin / staff / bytesense_admin)
 *   - has a registration_codes row with used_by_clerk_user_id matching
 *   - has a pending_admin_invites row for their email
 *   - email domain is on INTERNAL_DOMAINS (default: bytesense.ai)
 *   - has a practice_intake row (legacy users who completed intake before
 *     the link-on-redeem flow existed — grandfathered)
 *
 * Body: { clerkUserId, email }
 * Always returns HTTP 200 with { success, allowed, reason }.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-clerk-token",
};

const INTERNAL_DOMAINS = (Deno.env.get("INTERNAL_EMAIL_DOMAINS") ?? "bytesense.ai")
  .split(",").map(d => d.trim().toLowerCase()).filter(Boolean);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: { clerkUserId?: string; email?: string };
  try { body = await req.json(); } catch { return ok({ success: false, error: "Invalid JSON body" }); }

  const clerkUserId = (body.clerkUserId ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  if (!clerkUserId || !email) {
    return ok({ success: false, error: "clerkUserId and email are required" });
  }

  // 1. Internal email domain — fast path for staff
  const domain = email.split("@")[1] ?? "";
  if (INTERNAL_DOMAINS.includes(domain)) {
    return ok({ success: true, allowed: true, reason: "internal_domain" });
  }

  // 2. Has any role (admin/staff/bytesense_admin)
  const { data: roleRow } = await supabase
    .from("user_roles").select("role")
    .eq("clerk_user_id", clerkUserId).limit(1).maybeSingle();
  if (roleRow) {
    return ok({ success: true, allowed: true, reason: "has_role" });
  }

  // 3. Has a redeemed registration code linked to this clerk_user_id
  const { data: codeRow } = await supabase
    .from("registration_codes").select("id")
    .eq("used_by_clerk_user_id", clerkUserId).limit(1).maybeSingle();
  if (codeRow) {
    return ok({ success: true, allowed: true, reason: "redeemed_code" });
  }

  // 4. Has a pending admin invite for their email
  const { data: pendingRow } = await supabase
    .from("pending_admin_invites").select("id")
    .eq("email", email).limit(1).maybeSingle();
  if (pendingRow) {
    return ok({ success: true, allowed: true, reason: "pending_admin_invite" });
  }

  // 5. Legacy grandfather — completed the old intake before the link-on-redeem
  //    flow existed. A practice_intake row can only exist for a user who
  //    already passed an earlier gate, so this can't let a brand-new
  //    ineligible signup in: at their first login they have no row yet.
  const { data: intakeRow } = await supabase
    .from("practice_intake").select("clerk_user_id")
    .eq("clerk_user_id", clerkUserId).limit(1).maybeSingle();
  if (intakeRow) {
    return ok({ success: true, allowed: true, reason: "legacy_intake" });
  }

  return ok({ success: true, allowed: false, reason: "no_proof_of_invite" });
});

function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
