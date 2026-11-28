export type RateLimitDecision = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

type RateLimiterOptions = {
  limit: number;
  windowMs: number;
  maxKeys?: number;
  now?: () => number;
};

/**
 * Process-local fixed-window limiter. This is a best-effort per-instance guard,
 * not a distributed quota; use an edge firewall or shared store for global limits.
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const { limit, windowMs, maxKeys = 10_000, now = Date.now } = options;
  const buckets = new Map<string, { count: number; resetAt: number }>();

  if (!Number.isInteger(limit) || limit < 1 || !Number.isFinite(windowMs) || windowMs < 1) {
    throw new Error("Rate limiter requires a positive integer limit and positive window");
  }

  function pruneExpired(timestamp: number) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= timestamp) buckets.delete(key);
    }
  }

  return {
    consume(key: string): RateLimitDecision {
      const timestamp = now();
      const normalizedKey = key.trim().slice(0, 256) || "unknown";
      let bucket = buckets.get(normalizedKey);

      if (!bucket || bucket.resetAt <= timestamp) {
        pruneExpired(timestamp);
        if (buckets.size >= maxKeys) {
          const oldestKey = buckets.keys().next().value as string | undefined;
          if (oldestKey) buckets.delete(oldestKey);
        }
        bucket = { count: 0, resetAt: timestamp + windowMs };
        buckets.set(normalizedKey, bucket);
      }

      if (bucket.count >= limit) {
        return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
      }

      bucket.count += 1;
      return {
        allowed: true,
        remaining: Math.max(0, limit - bucket.count),
        resetAt: bucket.resetAt,
      };
    },
  };
}

export function getRequestClientKey(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const addresses = forwarded.split(",").map((value) => value.trim()).filter(Boolean);
    if (addresses.length) return addresses[0];
  }

  return "unknown";
}
