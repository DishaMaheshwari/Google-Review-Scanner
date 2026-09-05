/**
 * A deliberately small in-memory sliding-window limiter.
 *
 * Scope and honesty about it: serverless instances do not share memory, so this
 * is a speed bump against casual abuse from one device, not a hard guarantee.
 * It is enough to stop a single person from burning the OpenAI budget by
 * holding down "Generate another". If the page ever gets real traffic, swap
 * this for a shared store (Upstash Redis, Vercel KV) — the interface below is
 * the only thing the route depends on.
 */

interface Window {
  hits: number[];
}

const buckets = new Map<string, Window>();

/** Drop buckets that have gone quiet so the map cannot grow without bound. */
function prune(now: number, windowMs: number) {
  for (const [key, bucket] of buckets) {
    const live = bucket.hits.filter((t) => now - t < windowMs);
    if (live.length === 0) buckets.delete(key);
    else bucket.hits = live;
  }
}

export interface RateLimitOptions {
  /** Unique caller key, normally the client IP. */
  key: string;
  /**
   * Namespaces the bucket. Without this every route would share one allowance
   * per caller, so generating a few reviews would lock the caller out of
   * sending feedback.
   */
  scope: string;
  /** Requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the caller may retry, when blocked. */
  retryAfter: number;
}

export function rateLimit({
  key,
  scope,
  limit,
  windowMs,
}: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const bucketKey = `${scope}:${key}`;

  // Cheap opportunistic cleanup rather than a timer.
  if (buckets.size > 500) prune(now, windowMs);

  const bucket = buckets.get(bucketKey) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    buckets.set(bucketKey, bucket);
    const oldest = bucket.hits[0];
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
    };
  }

  bucket.hits.push(now);
  buckets.set(bucketKey, bucket);
  return { allowed: true, retryAfter: 0 };
}

/**
 * Best-effort client identity. Vercel sets x-forwarded-for; the first entry is
 * the original client. Falls back to a shared bucket, which is intentionally
 * conservative — unknown callers share one allowance.
 */
export function getClientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown-client";
}
