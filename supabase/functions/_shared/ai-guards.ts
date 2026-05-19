/**
 * Shared rate-limiting + prompt-injection helpers for AI edge functions.
 *
 * Rate limit: 30 requests per 5-minute sliding window (default), keyed by
 * Clerk user_id when the frontend passes one, else by client IP. Backed by
 * Deno KV (built into the edge runtime). Fails open if KV is unavailable —
 * don't block real users due to infra hiccups.
 *
 * Prompt injection guard: strips common LLM-control tokens and trims each
 * user message to a max length so attackers can't smuggle in large
 * jailbreak payloads.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export async function checkRateLimit(
  userKey: string,
  limit = Number(Deno.env.get("AI_RATE_LIMIT_PER_WINDOW") ?? 30),
  windowSec = Number(Deno.env.get("AI_RATE_WINDOW_SECONDS") ?? 300),
): Promise<RateLimitResult> {
  try {
    const kv = await Deno.openKv();
    const bucket = Math.floor(Date.now() / 1000 / windowSec);
    const key = ["rl", userKey, bucket];
    const entry = await kv.get<number>(key);
    const count = (entry.value ?? 0) + 1;
    if (count > limit) {
      return { allowed: false, remaining: 0 };
    }
    await kv.set(key, count, { expireIn: windowSec * 1000 });
    return { allowed: true, remaining: Math.max(0, limit - count) };
  } catch (e) {
    console.warn("Rate limit KV error, failing open:", String(e));
    return { allowed: true, remaining: limit };
  }
}

export function getUserKey(req: Request, body: Record<string, unknown>): string {
  const cid = body?.clerkUserId;
  if (typeof cid === "string" && cid.length > 0) return `user:${cid}`;
  const ip = req.headers.get("cf-connecting-ip")
    ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
  return `ip:${ip}`;
}

const INJECTION_PATTERNS = [
  /\[\/?(INST|SYSTEM|sys|im_(start|end))\]/gi,
  /<\/?(system|im_start|im_end)>/gi,
  /\|im_(start|end)\|/gi,
];

const MAX_MESSAGE_CHARS = 4000;

export function sanitizeMessages<T extends { role: string; content: unknown }>(messages: T[]): T[] {
  return messages.map((m) => {
    if (typeof m.content !== "string") return m;
    let content = m.content.slice(0, MAX_MESSAGE_CHARS);
    for (const re of INJECTION_PATTERNS) {
      content = content.replace(re, "[redacted]");
    }
    return { ...m, content } as T;
  });
}
