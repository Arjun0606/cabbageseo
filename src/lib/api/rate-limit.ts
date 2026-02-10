/**
 * Lightweight in-memory rate limiter for API routes.
 *
 * Uses a sliding window approach. Not distributed (single-process only),
 * which is fine for Vercel serverless since each instance has its own memory.
 * For truly global rate limiting at scale, swap to Upstash Redis.
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });
 *   const result = limiter.check(userId);
 *   if (!result.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimiterOptions {
  /** Time window in milliseconds */
  windowMs: number;
  /** Max requests per window */
  max: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

export function createRateLimiter(options: RateLimiterOptions) {
  const storeKey = `${options.windowMs}-${options.max}`;
  if (!stores.has(storeKey)) {
    stores.set(storeKey, new Map());
  }
  const store = stores.get(storeKey)!;

  // Periodic cleanup every 5 minutes to prevent memory leaks
  if (typeof globalThis !== "undefined") {
    const cleanupKey = `__ratelimit_cleanup_${storeKey}`;
    if (!(globalThis as Record<string, unknown>)[cleanupKey]) {
      (globalThis as Record<string, unknown>)[cleanupKey] = true;
      setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store.entries()) {
          entry.timestamps = entry.timestamps.filter(
            (t) => now - t < options.windowMs,
          );
          if (entry.timestamps.length === 0) {
            store.delete(key);
          }
        }
      }, 300_000); // 5 min cleanup
    }
  }

  return {
    check(identifier: string): RateLimitResult {
      const now = Date.now();
      const entry = store.get(identifier) || { timestamps: [] };

      // Remove expired timestamps
      entry.timestamps = entry.timestamps.filter(
        (t) => now - t < options.windowMs,
      );

      if (entry.timestamps.length >= options.max) {
        const oldestInWindow = entry.timestamps[0];
        const resetMs = oldestInWindow + options.windowMs - now;
        return {
          allowed: false,
          remaining: 0,
          resetMs: Math.max(0, resetMs),
        };
      }

      entry.timestamps.push(now);
      store.set(identifier, entry);

      return {
        allowed: true,
        remaining: options.max - entry.timestamps.length,
        resetMs: options.windowMs,
      };
    },
  };
}

/**
 * Pre-configured limiters for different endpoint types
 */

/** Citation check: 10 per minute per user (each costs ~$0.03 in AI API calls) */
export const citationCheckLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 10,
});

/** Page generation: 5 per minute per user (heavy AI generation) */
export const pageGenerationLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 5,
});

/** Bulk scan: 3 per minute per API key */
export const bulkScanLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 3,
});

/** Intelligence/action plans: 10 per minute per user */
export const intelligenceLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 10,
});

/** Auth attempts: 5 per minute per IP */
export const authLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 5,
});

/** Site creation: 5 per minute per user */
export const siteCreationLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 5,
});
