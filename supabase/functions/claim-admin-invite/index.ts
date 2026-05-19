/**
 * claim-admin-invite — Assigns the bytesense_admin role to a newly signed-in user
 * if their email has a pending invite in pending_admin_invites.
 *
 * Auth (Phase B2):
 *   The caller MUST send their Clerk session token in `X-Clerk-Token` header.
 *   We verify the token's signature using the Clerk instance's JWKS (derived
 *   from CLERK_PUBLISHABLE_KEY) and confirm:
 *     1. token.sub === request body's clerkUserId
 *     2. the Clerk user's primary email === request body's email
 *
 *   For one deploy cycle the function ACCEPTS calls without the header (legacy
 *   client) and logs a warning. Once the frontend ships with the header, a
 *   follow-up deploy can make the header required.
 *
 * Called from useAuth.ts after a user logs in and is found to have no roles yet.
 * Returns { success: true, role } or { success: false }.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { jwtVerify, createRemoteJWKSet } from "https://esm.sh/jose@5.9.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-clerk-token",
};

const CLERK_SECRET_KEY = Deno.env.get("CLERK_SECRET_KEY") ?? "";
const CLERK_PUBLISHABLE_KEY = Deno.env.get("CLERK_PUBLISHABLE_KEY") ?? "";

// Derive Clerk Frontend API URL from publishable key.
// Format: pk_(test|live)_<base64-encoded "<frontend-api>$">
function deriveFrontendApi(): string | null {
  try {
    const m = CLERK_PUBLISHABLE_KEY.match(/^pk_(test|live)_(.+)$/);
    if (!m) return null;
    const decoded = atob(m[2]).replace(/\$+$/, "");
    return decoded || null;
  } catch {
    return null;
  }
}

const FRONTEND_API = deriveFrontendApi();
const JWKS = FRONTEND_API
  ? createRemoteJWKSet(new URL(`https://${FRONTEND_API}/.well-known/jwks.json`))
  : null;
const EXPECTED_ISSUER = FRONTEND_API ? `https://${FRONTEND_API}` : null;

interface VerifiedClaim {
  sub: string;
  primaryEmail: string;
}

async function verifyCallerIdentity(token: string): Promise<VerifiedClaim | null> {
  if (!JWKS || !EXPECTED_ISSUER) {
    console.warn("Clerk JWKS not configured (CLERK_PUBLISHABLE_KEY missing)");
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, JWKS, { issuer: EXPECTED_ISSUER });
    const sub = payload.sub as string | undefined;
    if (!sub) return null;

    // Look up the user via Clerk Backend API to get the verified primary email.
    if (!CLERK_SECRET_KEY) return null;
    const userRes = await fetch(`https://api.clerk.com/v1/users/${sub}`, {
      headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
    });
    if (!userRes.ok) return null;
    const user = await userRes.json();
    const primaryEmail = (user?.email_addresses?.[0]?.email_address ?? "").toLowerCase();
    return { sub, primaryEmail };
  } catch (e) {
    console.warn("Clerk token verification failed:", String(e));
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: { email?: string; clerkUserId?: string };
  try {
    body = await req.json();
  } catch {
    return json({ success: false, error: "Invalid JSON body" });
  }

  const { email, clerkUserId } = body;
  if (!email || !clerkUserId) {
    return json({ success: false, error: "email and clerkUserId are required" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // --- Caller verification (Phase B2) ---
  // Legacy clients (one deploy cycle) may not send the header — we accept the
  // call but log a warning. New clients send X-Clerk-Token; we verify it
  // matches the supplied (clerkUserId, email).
  const callerToken = req.headers.get("x-clerk-token") || req.headers.get("X-Clerk-Token") || "";
  if (callerToken) {
    const verified = await verifyCallerIdentity(callerToken);
    if (!verified) {
      return json({ success: false, error: "Invalid session token" });
    }
    if (verified.sub !== clerkUserId) {
      console.warn(`Token sub (${verified.sub}) does not match clerkUserId (${clerkUserId})`);
      return json({ success: false, error: "Token user mismatch" });
    }
    if (verified.primaryEmail !== normalizedEmail) {
      console.warn(`Token email (${verified.primaryEmail}) does not match email (${normalizedEmail})`);
      return json({ success: false, error: "Token email mismatch" });
    }
  } else {
    console.warn("claim-admin-invite called without X-Clerk-Token header (legacy client)");
  }

  // --- 1. Look up pending invite ---
  const { data: invite } = await supabase
    .from("pending_admin_invites")
    .select("id, role")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (!invite) {
    return json({ success: false });
  }

  // --- 2. Insert user_roles row (idempotent) ---
  const { error: roleErr } = await supabase
    .from("user_roles")
    .upsert(
      { clerk_user_id: clerkUserId, role: invite.role },
      { onConflict: "clerk_user_id,role" },
    );

  if (roleErr) {
    const { error: insertErr } = await supabase
      .from("user_roles")
      .insert({ clerk_user_id: clerkUserId, role: invite.role });

    if (insertErr && !insertErr.message.includes("duplicate")) {
      console.error("user_roles insert error:", insertErr);
      return json({ success: false, error: "Failed to assign role" });
    }
  }

  // --- 3. Delete the pending invite (cleanup) ---
  await supabase.from("pending_admin_invites").delete().eq("id", invite.id);

  return json({ success: true, role: invite.role });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
