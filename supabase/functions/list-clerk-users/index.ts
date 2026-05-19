/**
 * list-clerk-users — Paginated list of all Clerk users, joined with Supabase
 * profile + role + training data. Admin-gated.
 *
 * Body: {
 *   requesterClerkId: string,
 *   query?: string,        // free-text search across name + email
 *   limit?: number,        // default 50, max 100
 *   offset?: number,       // default 0
 *   orderBy?: 'created_at' | 'last_active_at' | 'email_address',
 *   orderDir?: 'asc' | 'desc',
 * }
 *
 * Returns: {
 *   success: true,
 *   totalCount: number,
 *   users: Array<{
 *     clerk_user_id, firstName, lastName, email,
 *     created_at, last_active_at,
 *     roles: string[],
 *     full_name: string | null,
 *     practice_id: string | null,
 *     practice_name: string | null,
 *     intake_done: boolean,
 *     done_modules: string[],
 *     module_count: number,
 *     xp: number,
 *     training_updated_at: string | null,
 *     training_completed_at: string | null,
 *   }>
 * }
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

  let body: {
    requesterClerkId?: string;
    query?: string;
    limit?: number;
    offset?: number;
    orderBy?: "created_at" | "last_active_at" | "email_address";
    orderDir?: "asc" | "desc";
  };
  try {
    body = await req.json();
  } catch {
    return ok({ success: false, error: "Invalid JSON body" });
  }

  const { requesterClerkId } = body;
  if (!requesterClerkId) {
    return ok({ success: false, error: "requesterClerkId is required" });
  }

  // 1. Verify caller is a bytesense_admin
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

  // 2. Build Clerk request
  const limit = Math.max(1, Math.min(100, Number(body.limit) || 50));
  const offset = Math.max(0, Number(body.offset) || 0);
  const orderBy = body.orderBy ?? "created_at";
  const orderDir = body.orderDir ?? "desc";
  const orderByParam = `${orderDir === "asc" ? "+" : "-"}${orderBy}`;

  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  params.set("order_by", orderByParam);
  if (body.query && body.query.trim()) {
    params.set("query", body.query.trim());
  }

  let clerkUsers: any[] = [];
  let totalCount = 0;
  try {
    // Fetch users page
    const usersRes = await fetch(`https://api.clerk.com/v1/users?${params.toString()}`, {
      headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
    });
    if (!usersRes.ok) {
      const errBody = await usersRes.json().catch(() => ({}));
      return ok({ success: false, error: `Clerk users API ${usersRes.status}: ${JSON.stringify(errBody).slice(0, 200)}` });
    }
    clerkUsers = await usersRes.json();
    if (!Array.isArray(clerkUsers)) clerkUsers = [];

    // Fetch total count (Clerk has a separate /users/count endpoint)
    const countParams = new URLSearchParams();
    if (body.query && body.query.trim()) countParams.set("query", body.query.trim());
    const countRes = await fetch(`https://api.clerk.com/v1/users/count?${countParams.toString()}`, {
      headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
    });
    if (countRes.ok) {
      const countBody = await countRes.json().catch(() => ({}));
      totalCount = Number(countBody?.total_count ?? 0);
    }
  } catch (e) {
    return ok({ success: false, error: `Clerk fetch threw: ${String(e)}` });
  }

  if (clerkUsers.length === 0) {
    return ok({ success: true, totalCount, users: [] });
  }

  const clerkIds = clerkUsers.map((u: any) => u.id).filter(Boolean);

  // 3. Pull Supabase data in parallel
  const [rolesRes, profilesRes, trainingRes] = await Promise.all([
    supabase.from("user_roles").select("clerk_user_id, role").in("clerk_user_id", clerkIds),
    supabase.from("profiles").select("clerk_user_id, full_name, practice_id").in("clerk_user_id", clerkIds),
    supabase
      .from("training_progress")
      .select("clerk_user_id, done_modules, xp, intake_done, completed_at, updated_at")
      .in("clerk_user_id", clerkIds),
  ]);

  const rolesByUser: Record<string, string[]> = {};
  (rolesRes.data ?? []).forEach((r: any) => {
    if (!rolesByUser[r.clerk_user_id]) rolesByUser[r.clerk_user_id] = [];
    rolesByUser[r.clerk_user_id].push(r.role);
  });

  const profileByUser: Record<string, any> = {};
  (profilesRes.data ?? []).forEach((p: any) => { profileByUser[p.clerk_user_id] = p; });

  const trainingByUser: Record<string, any> = {};
  (trainingRes.data ?? []).forEach((t: any) => { trainingByUser[t.clerk_user_id] = t; });

  // Optionally enrich with practice names
  const practiceIds = Array.from(new Set(Object.values(profileByUser).map((p: any) => p?.practice_id).filter(Boolean)));
  const practiceNameById: Record<string, string> = {};
  if (practiceIds.length > 0) {
    const { data: practicesData } = await supabase
      .from("practices")
      .select("id, name")
      .in("id", practiceIds as string[]);
    (practicesData ?? []).forEach((p: any) => { practiceNameById[p.id] = p.name; });
  }

  // 4. Merge
  const users = clerkUsers.map((u: any) => {
    const id = u.id;
    const profile = profileByUser[id] ?? null;
    const training = trainingByUser[id] ?? null;
    const doneModules: string[] = Array.isArray(training?.done_modules) ? training.done_modules : [];
    return {
      clerk_user_id: id,
      firstName: u.first_name ?? "",
      lastName: u.last_name ?? "",
      email: u.email_addresses?.[0]?.email_address ?? "",
      created_at: u.created_at ? new Date(u.created_at).toISOString() : null,
      last_active_at: u.last_active_at ? new Date(u.last_active_at).toISOString() : null,
      roles: rolesByUser[id] ?? [],
      full_name: profile?.full_name ?? null,
      practice_id: profile?.practice_id ?? null,
      practice_name: profile?.practice_id ? practiceNameById[profile.practice_id] ?? null : null,
      intake_done: !!training?.intake_done,
      done_modules: doneModules,
      module_count: doneModules.length,
      xp: Number(training?.xp ?? 0),
      training_updated_at: training?.updated_at ?? null,
      training_completed_at: training?.completed_at ?? null,
    };
  });

  return ok({ success: true, totalCount, users });
});

function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
