// Health monitor — scans practices/staff and writes admin_alerts.
// Triggered by pg_cron hourly (and can be invoked manually).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAY_MS = 86_400_000;
const WEEKDAY = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function isClosed(date: Date, closedDays: string[], holidays: string[]): boolean {
  if (closedDays?.includes(WEEKDAY[date.getUTCDay()])) return true;
  const iso = date.toISOString().slice(0, 10);
  return holidays?.includes(iso) ?? false;
}

// Hours of inactivity, excluding closed days
function openHoursSince(since: Date, closedDays: string[], holidays: string[]): number {
  const now = new Date();
  let hours = 0;
  // Walk day by day
  const cursor = new Date(since);
  while (cursor < now) {
    const next = new Date(Math.min(cursor.getTime() + DAY_MS, now.getTime()));
    if (!isClosed(cursor, closedDays, holidays)) {
      hours += (next.getTime() - cursor.getTime()) / 3_600_000;
    }
    cursor.setTime(next.getTime());
  }
  return hours;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const created: string[] = [];

  async function upsertAlert(alert: {
    type: string; severity: string; practice_id?: string | null;
    target_user_id?: string | null; title: string; body: string; dedupe_key: string;
  }) {
    // Skip if an open alert with the same dedupe_key already exists
    const { data: existing } = await supabase
      .from("admin_alerts")
      .select("id, status")
      .eq("dedupe_key", alert.dedupe_key)
      .maybeSingle();
    if (existing && existing.status === "open") return;
    if (existing) {
      // re-open snoozed/resolved alerts of the same type if condition reappears
      await supabase.from("admin_alerts")
        .update({ status: "open", resolved_at: null, body: alert.body, title: alert.title })
        .eq("id", existing.id);
      created.push(`reopened:${alert.dedupe_key}`);
      return;
    }
    const { error } = await supabase.from("admin_alerts").insert(alert);
    if (!error) created.push(alert.dedupe_key);
  }

  // Load schedules
  const { data: schedules } = await supabase.from("practice_schedule").select("*");
  const scheduleMap = new Map<string, { closed_days: string[]; holidays: string[] }>();
  schedules?.forEach((s: any) => scheduleMap.set(s.practice_id, { closed_days: s.closed_days, holidays: s.holidays?.map((h: string) => String(h).slice(0, 10)) ?? [] }));

  // 1. Inactive 48h+ and 2. No modules within 48h
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, full_name, practice_id, created_at, last_seen_at");
  const { data: training } = await supabase.from("training_progress").select("user_id, done_modules");
  const tpMap = new Map<string, { done_modules: string[] }>();
  training?.forEach((t: any) => tpMap.set(t.user_id, { done_modules: t.done_modules ?? [] }));

  for (const p of profiles ?? []) {
    const sched = (p.practice_id && scheduleMap.get(p.practice_id)) || { closed_days: ["sat", "sun"], holidays: [] };
    const onboarded = new Date(p.created_at);
    const hoursSinceOnboard = openHoursSince(onboarded, sched.closed_days, sched.holidays);
    if (hoursSinceOnboard < 48) continue;

    const lastSeen = p.last_seen_at ? new Date(p.last_seen_at) : onboarded;
    const hoursSinceSeen = openHoursSince(lastSeen, sched.closed_days, sched.holidays);
    if (hoursSinceSeen >= 48) {
      await upsertAlert({
        type: "inactive_48h",
        severity: "high",
        practice_id: p.practice_id,
        target_user_id: p.user_id,
        title: `${p.full_name || "User"} inactive ${Math.round(hoursSinceSeen)}h`,
        body: `No login for ${Math.round(hoursSinceSeen)} open hours. Last seen ${p.last_seen_at ? new Date(p.last_seen_at).toLocaleString() : "never"}.`,
        dedupe_key: `inactive_48h:${p.user_id}`,
      });
    }

    const tp = tpMap.get(p.user_id);
    if (!tp || tp.done_modules.length === 0) {
      await upsertAlert({
        type: "no_modules",
        severity: "medium",
        practice_id: p.practice_id,
        target_user_id: p.user_id,
        title: `${p.full_name || "User"} no modules completed`,
        body: `Onboarded ${onboarded.toLocaleDateString()}, no modules completed yet.`,
        dedupe_key: `no_modules:${p.user_id}`,
      });
    }
  }

  // 3 + 4. Goal at risk / missed
  const { data: goals } = await supabase.from("practice_goals").select("*");
  const { data: cases } = await supabase.from("cases").select("practice_id, status, created_at");
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  const day = now.getUTCDate();
  const daysInMonth = monthEnd.getUTCDate();

  for (const g of goals ?? []) {
    if (!g.monthly_case_goal || g.monthly_case_goal <= 0) continue;
    const monthCases = (cases ?? []).filter((c: any) =>
      c.practice_id === g.practice_id &&
      c.status === "converted" &&
      new Date(c.created_at) >= monthStart
    ).length;
    const projected = day >= 1 ? (monthCases / day) * daysInMonth : 0;
    const monthKey = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`;

    if (day >= 7 && projected < g.monthly_case_goal * 0.8) {
      await upsertAlert({
        type: "goal_at_risk",
        severity: "medium",
        practice_id: g.practice_id,
        title: `Goal at risk for practice`,
        body: `Pace projection: ${Math.round(projected)} of ${g.monthly_case_goal} cases this month (${monthCases} so far).`,
        dedupe_key: `goal_at_risk:${g.practice_id}:${monthKey}`,
      });
    }
  }

  // 5. Support unanswered > 24h
  const cutoff = new Date(Date.now() - 24 * 3_600_000).toISOString();
  const { data: unanswered } = await supabase
    .from("support_bookings")
    .select("id, name, email, booking_date, created_at, assigned_to")
    .lt("created_at", cutoff)
    .is("assigned_to", null);

  for (const b of unanswered ?? []) {
    await upsertAlert({
      type: "support_unanswered",
      severity: "high",
      title: `Support request unanswered: ${b.name || b.email}`,
      body: `Booked ${b.booking_date}. Created ${new Date(b.created_at).toLocaleString()}. SLA window closing.`,
      dedupe_key: `support_unanswered:${b.id}`,
    });
  }

  return new Response(JSON.stringify({ ok: true, created: created.length, ids: created }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});