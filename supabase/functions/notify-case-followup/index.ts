/**
 * notify-case-followup — Logs/sends a follow-up notification for a case.
 *
 * Phase B3 auth: caller must send their Clerk session token in X-Clerk-Token.
 * We verify the token and confirm the caller has a profile attached to the
 * same practice_id as the case being notified about — OR is a bytesense_admin.
 * Without this gate, anyone with the public anon key could trigger arbitrary
 * notifications by guessing case IDs.
 *
 * Legacy clients (no token) are accepted for one deploy cycle with a warning.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { jwtVerify, createRemoteJWKSet } from "https://esm.sh/jose@5.9.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-clerk-token",
};

const CLERK_SECRET_KEY = Deno.env.get("CLERK_SECRET_KEY") ?? "";
const CLERK_PUBLISHABLE_KEY = Deno.env.get("CLERK_PUBLISHABLE_KEY") ?? "";

function deriveFrontendApi(): string | null {
  try {
    const m = CLERK_PUBLISHABLE_KEY.match(/^pk_(test|live)_(.+)$/);
    if (!m) return null;
    const decoded = atob(m[2]).replace(/\$+$/, "");
    return decoded || null;
  } catch { return null; }
}

const FRONTEND_API = deriveFrontendApi();
const JWKS = FRONTEND_API
  ? createRemoteJWKSet(new URL(`https://${FRONTEND_API}/.well-known/jwks.json`))
  : null;
const EXPECTED_ISSUER = FRONTEND_API ? `https://${FRONTEND_API}` : null;

async function verifyCallerSub(token: string): Promise<string | null> {
  if (!JWKS || !EXPECTED_ISSUER) return null;
  try {
    const { payload } = await jwtVerify(token, JWKS, { issuer: EXPECTED_ISSUER });
    return (payload.sub as string) || null;
  } catch (e) {
    console.warn("Clerk token verification failed:", String(e));
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { caseId, patientName } = await req.json();
    if (!caseId || !patientName) {
      return json({ error: "Missing caseId or patientName" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Look up the case (needed for both auth check and notification logic)
    const { data: caseData } = await supabase
      .from("cases")
      .select("*, practice_id")
      .eq("id", caseId)
      .single();

    if (!caseData?.practice_id) {
      return json({ message: "Case not found or no practice" }, 200);
    }

    // --- Caller authorization (Phase B3) ---
    const callerToken = req.headers.get("x-clerk-token") || req.headers.get("X-Clerk-Token") || "";
    if (callerToken) {
      const callerSub = await verifyCallerSub(callerToken);
      if (!callerSub) {
        return json({ success: false, error: "Invalid session token" }, 200);
      }
      // Allow if the caller is a bytesense_admin OR their profile is attached
      // to the case's practice_id.
      const [{ data: roleRow }, { data: profileRow }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("clerk_user_id", callerSub).eq("role", "bytesense_admin").maybeSingle(),
        supabase.from("profiles").select("practice_id").eq("clerk_user_id", callerSub).maybeSingle(),
      ]);
      const isBsAdmin = !!roleRow;
      const samePractice = profileRow?.practice_id === caseData.practice_id;
      if (!isBsAdmin && !samePractice) {
        return json({ success: false, error: "Not authorized for this case" }, 200);
      }
    } else {
      console.warn("notify-case-followup called without X-Clerk-Token (legacy client)");
    }

    // Get all staff profiles for this practice to notify
    const { data: staffProfiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .eq("practice_id", caseData.practice_id);

    // Log the notification (email sending requires email domain setup)
    console.log(`Follow-up notification for case ${caseId} (${patientName}). Staff to notify: ${staffProfiles?.length || 0}`);

    return json({
      success: true,
      message: `Follow-up notification logged for ${patientName}`,
      staffCount: staffProfiles?.length || 0,
    }, 200);
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
