/**
 * Minimal fixed-window rate limiter for the public forms.
 *
 * Deliberately in-process: it needs no extra service, and on a single instance
 * it stops the ordinary case — a bot hammering the membership or contact form.
 * If the site is ever scaled to several instances each keeps its own counter,
 * so the effective limit multiplies by the instance count; swap the Map for
 * Redis/Upstash at that point.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Drops expired buckets so the Map cannot grow without bound. */
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

/**
 * Best-effort client identity for rate limiting. Behind a proxy the real client
 * is the first entry in x-forwarded-for; the fallback keeps a single shared
 * bucket, which is stricter rather than looser.
 */
export async function clientKey(prefix: string) {
  const { headers } = await import("next/headers");
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return `${prefix}:${ip}`;
}
