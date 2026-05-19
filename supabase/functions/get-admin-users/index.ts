/**
 * get-admin-users — Fetches Clerk user details (name + email) for a list of clerk_user_ids.
 *
 * Called from ByteSenseAdmin.tsx to enrich the "Current Admins" list with real names
 * instead of showing "(no name)" for admins who were added directly to user_roles
 * without going through the normal onboarding flow.
 *
 * Always returns HTTP 200 with { success: true, users: [...] } or { success: false, error }.
 */

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

  let body: { clerkIds?: string[] };
  try {
    body = await req.json();
  } catch {
    return ok({ success: false, error: "Invalid JSON body" });
  }

  const { clerkIds } = body;

  if (!clerkIds || !Array.isArray(clerkIds) || clerkIds.length === 0) {
    return ok({ success: true, users: [] });
  }

  // Clerk supports batch lookup via repeated `user_id` query params (not the
  // bracketed `user_id[]` form — that one is silently ignored and returns
  // arbitrary users).
  // https://clerk.com/docs/reference/backend-api/tag/Users#operation/GetUserList
  try {
    const params = new URLSearchParams();
    clerkIds.forEach(id => params.append("user_id", id));
    // Limit to 100 max (Clerk default page size)
    params.set("limit", String(Math.min(clerkIds.length, 100)));

    const clerkRes = await fetch(`https://api.clerk.com/v1/users?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!clerkRes.ok) {
      const errBody = await clerkRes.json().catch(() => ({}));
      console.error("Clerk API error:", clerkRes.status, JSON.stringify(errBody));
      return ok({ success: false, error: `Clerk API returned ${clerkRes.status}` });
    }

    const clerkUsers = await clerkRes.json();

    // Normalize to a flat, safe shape
    const users = (Array.isArray(clerkUsers) ? clerkUsers : []).map((u: any) => ({
      clerk_user_id: u.id,
      firstName: u.first_name || "",
      lastName: u.last_name || "",
      email: u.email_addresses?.[0]?.email_address ?? "",
    }));

    return ok({ success: true, users });
  } catch (err) {
    console.error("get-admin-users error:", err);
    return ok({ success: false, error: String(err) });
  }
});

function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
