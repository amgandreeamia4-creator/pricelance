// src/lib/rateLimit.ts

export type RateLimitResult =
  | { ok: true; retryAfterMs: 0 }
  | { ok: false; retryAfterMs: number };

const buckets = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  const existing = buckets.get(key) ?? [];
  const recent = existing.filter((ts) => ts >= windowStart);

  if (recent.length >= limit) {
    const oldest = recent[0];
    const retryAfterMs = Math.max(0, windowMs - (now - oldest));
    buckets.set(key, recent);
    return { ok: false, retryAfterMs };
  }

  recent.push(now);
  buckets.set(key, recent);
  return { ok: true, retryAfterMs: 0 };
}
