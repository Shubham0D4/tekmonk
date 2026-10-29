import "server-only";

type RateLimit = { count: number; resetAt: number };
const globalForRateLimit = globalThis as unknown as { tekmonkRateLimits?: Map<string, RateLimit> };
const buckets = globalForRateLimit.tekmonkRateLimits ?? new Map<string, RateLimit>();
globalForRateLimit.tekmonkRateLimits = buckets;

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  if (existing.count >= limit) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }
  existing.count += 1;
  return { allowed: true, retryAfter: 0 };
}

export function requestAddress(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
