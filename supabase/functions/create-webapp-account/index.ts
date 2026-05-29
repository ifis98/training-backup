/**
 * create-webapp-account
 *
 * Called by the training-app frontend after the user completes TypeformIntake.
 * Creates or auto-links a MongoDB doctor account via byteSenseBackend /user/signup/sso,
 * then records the result in the webapp_account Supabase table.
 *
 * Task 1 decisions honoured:
 *   #1  webappPassword is forwarded if provided; otherwise backend generates random token.
 *   #3  Email must be verified in Clerk before account creation.
 *   #4  n8n onboarding webhook fired here (non-blocking) after successful write.
 *   #5  Auto-link for existing MongoDB users handled by /signup/sso (transparent here).
 *
 * Auth: caller must send Clerk session token in X-Clerk-Token header.
 *       Token verified via JWKS; email_verified confirmed via Clerk Backend API.
 *
 * Idempotent: if webapp_account already has status='created', returns early.
 *
 * Env vars required (set via `supabase secrets set`):
 *   CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY  — already set in project
 *   EDGE_FUNCTION_SECRET                     — shared with byteSenseBackend
 *   BACKEND_URL                              — e.g. https://api.bytesense.ai:4000
 *   N8N_WEBHOOK_URL                          — n8n onboarding webhook URL
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { jwtVerify, createRemoteJWKSet } from "https://esm.sh/jose@5.9.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-clerk-token",
};

const CLERK_SECRET_KEY      = Deno.env.get("CLERK_SECRET_KEY") ?? "";
const CLERK_PUBLISHABLE_KEY = Deno.env.get("CLERK_PUBLISHABLE_KEY") ?? "";
const EDGE_FUNCTION_SECRET  = Deno.env.get("EDGE_FUNCTION_SECRET") ?? "";
const BACKEND_URL           = (Deno.env.get("BACKEND_URL") ?? "https://api.bytesense.ai:4000").replace(/\/$/, "");
const N8N_WEBHOOK_URL       = Deno.env.get("N8N_WEBHOOK_URL") ?? "";

// Derive Clerk Frontend API from publishable key (same pattern as claim-admin-invite).
function deriveFrontendApi(): string | null {
  try {
    const m = CLERK_PUBLISHABLE_KEY.match(/^pk_(test|live)_(.+)$/);
    if (!m) return null;
    return atob(m[2]).replace(/\$+$/, "") || null;
  } catch {
    return null;
  }
}

const FRONTEND_API    = deriveFrontendApi();
const JWKS            = FRONTEND_API
  ? createRemoteJWKSet(new URL(`https://${FRONTEND_API}/.well-known/jwks.json`))
  : null;
const EXPECTED_ISSUER = FRONTEND_API ? `https://${FRONTEND_API}` : null;

interface VerifiedClaim {
  sub: string;
  primaryEmail: string;
  emailVerified: boolean;
}

async function verifyCallerIdentity(token: string): Promise<VerifiedClaim | null> {
  if (!JWKS || !EXPECTED_ISSUER || !CLERK_SECRET_KEY) {
    console.warn("[create-webapp-account] Clerk env vars not configured");
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, JWKS, { issuer: EXPECTED_ISSUER });
    const sub = payload.sub as string | undefined;
    if (!sub) return null;

    const userRes = await fetch(`https://api.clerk.com/v1/users/${sub}`, {
      headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
    });
    if (!userRes.ok) return null;

    const user = await userRes.json();
    const emailObj      = user?.email_addresses?.[0];
    const primaryEmail  = (emailObj?.email_address ?? "").toLowerCase();
    const emailVerified = emailObj?.verification?.status === "verified";

    return { sub, primaryEmail, emailVerified };
  } catch (e) {
    console.warn("[create-webapp-account] Clerk token verification failed:", String(e));
    return null;
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // --- 1. Verify Clerk token (required — no legacy fallback) ---
  const callerToken =
    req.headers.get("x-clerk-token") ||
    req.headers.get("X-Clerk-Token") ||
    "";
  if (!callerToken) {
    return json({ success: false, error: "X-Clerk-Token header is required" }, 401);
  }

  const verified = await verifyCallerIdentity(callerToken);
  if (!verified) {
    return json({ success: false, error: "Invalid session token" }, 401);
  }

  // --- 2. Email must be verified in Clerk (Task 1 decision #3) ---
  if (!verified.emailVerified) {
    return json(
      { success: false, error: "Email must be verified before account creation" },
      403,
    );
  }

  const { sub: clerkUserId, primaryEmail } = verified;

  // --- 3. Parse request body (practice fields + optional webappPassword) ---
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // --- 4. Idempotency: return early if already created ---
  const { data: existing } = await supabase
    .from("webapp_account")
    .select("status, mongodb_user_id, is_new_user")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();

  if (existing?.status === "created") {
    return json({
      success: true,
      userId: existing.mongodb_user_id,
      isNewUser: existing.is_new_user,
      alreadyCreated: true,
    });
  }

  // --- 5. Mark attempt as pending ---
  await supabase.from("webapp_account").upsert(
    {
      clerk_user_id: clerkUserId,
      status: "pending",
      error_message: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "clerk_user_id" },
  );

  // --- 6. Call byteSenseBackend /user/signup/sso ---
  const backendPayload = {
    ...body,
    clerkUserId,
    emailVerified: true,
    email: primaryEmail,
    isDoctor: true,
  };

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_URL}/user/signup/sso`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Edge-Function-Secret": EDGE_FUNCTION_SECRET,
      },
      body: JSON.stringify(backendPayload),
    });
  } catch (err) {
    console.error("[create-webapp-account] Backend unreachable:", err);
    await supabase.from("webapp_account").update({
      status: "failed",
      error_message: "Backend unreachable",
      updated_at: new Date().toISOString(),
    }).eq("clerk_user_id", clerkUserId);
    return json({ success: false, error: "Backend unreachable" }, 502);
  }

  // 409 from backend = email already linked to another Clerk account (conflict)
  if (!backendRes.ok && backendRes.status !== 409) {
    const errText = await backendRes.text();
    console.error("[create-webapp-account] Backend error:", backendRes.status, errText);
    await supabase.from("webapp_account").update({
      status: "failed",
      error_message: `Backend ${backendRes.status}: ${errText.slice(0, 200)}`,
      updated_at: new Date().toISOString(),
    }).eq("clerk_user_id", clerkUserId);
    return json({ success: false, error: "Account creation failed" }, 502);
  }

  if (backendRes.status === 409) {
    const conflictData = await backendRes.json();
    await supabase.from("webapp_account").update({
      status: "failed",
      error_message: conflictData?.message ?? "Email conflict",
      updated_at: new Date().toISOString(),
    }).eq("clerk_user_id", clerkUserId);
    return json({ success: false, error: conflictData?.message ?? "Email already linked to another account" }, 409);
  }

  const backendData    = await backendRes.json();
  const mongoUserId    = backendData.userId as string | undefined;
  const isNewUser      = backendData.isNewUser as boolean | undefined;

  // --- 7. Update webapp_account to 'created' ---
  await supabase.from("webapp_account").update({
    status: "created",
    mongodb_user_id: mongoUserId ?? null,
    is_new_user: isNewUser ?? null,
    error_message: null,
    updated_at: new Date().toISOString(),
  }).eq("clerk_user_id", clerkUserId);

  // --- 8. Fire n8n onboarding webhook (non-blocking, Task 1 decision #4) ---
  if (N8N_WEBHOOK_URL) {
    fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        clerkUserId,
        email: primaryEmail,
        mongodbUserId: mongoUserId,
        isNewUser,
        webAppUrl: "https://app.bytesense.ai",
      }),
    }).catch((err) => {
      console.error("[create-webapp-account] n8n webhook failed:", err);
    });
  }

  return json(
    { success: true, userId: mongoUserId, isNewUser },
    backendRes.status === 201 ? 201 : 200,
  );
});
