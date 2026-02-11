/**
 * Hybrid rate limiter for API routes.
 *
 * Strategy:
 * - If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set,
 *   uses distributed Redis-based rate limiting via @upstash/ratelimit.
 * - Otherwise, falls back to in-memory sliding window (single-process).
 *
 * The in-memory fallback is fine for low-traffic Vercel serverless usage,
 * but will not share state across instances. For production scale, set
 * the Upstash environment variables.
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });
 *   const result = await limiter.check(userId);
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

// ============================================
// UPSTASH REDIS BACKEND (distributed)
// ============================================

let upstashAvailable: boolean | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let RedisClass: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let RatelimitClass: any = null;

async function tryLoadUpstash() {
  if (upstashAvailable !== null) return upstashAvailable;

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    upstashAvailable = false;
    return false;
  }

  try {
    // Dynamic imports — @upstash/redis and @upstash/ratelimit are optional deps.
    // Install them with: npm i @upstash/redis @upstash/ratelimit
    // @ts-expect-error — optional dependency, resolved at runtime
    const redis = await import("@upstash/redis");
    // @ts-expect-error — optional dependency, resolved at runtime
    const ratelimit = await import("@upstash/ratelimit");
    RedisClass = redis.Redis;
    RatelimitClass = ratelimit.Ratelimit;
    upstashAvailable = true;
    return true;
  } catch {
    upstashAvailable = false;
    return false;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const upstashLimiters = new Map<string, any>();

function getUpstashLimiter(options: RateLimiterOptions) {
  const key = `${options.windowMs}-${options.max}`;
  if (upstashLimiters.has(key)) return upstashLimiters.get(key)!;

  if (!RedisClass || !RatelimitClass) throw new Error("Upstash not loaded");

  const redis = new RedisClass({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const limiter = new RatelimitClass({
    redis,
    limiter: RatelimitClass.slidingWindow(options.max, `${Math.round(options.windowMs / 1000)} s`),
    prefix: `rl:${key}`,
  });

  upstashLimiters.set(key, limiter);
  return limiter;
}

// ============================================
// IN-MEMORY BACKEND (single-process fallback)
// ============================================

const stores = new Map<string, Map<string, RateLimitEntry>>();

function getInMemoryStore(options: RateLimiterOptions) {
  const storeKey = `${options.windowMs}-${options.max}`;
  if (!stores.has(storeKey)) {
    stores.set(storeKey, new Map());
  }
  const store = stores.get(storeKey)!;

  // Periodic cleanup every 5 minutes
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
      }, 300_000);
    }
  }

  return store;
}

function checkInMemory(store: Map<string, RateLimitEntry>, identifier: string, options: RateLimiterOptions): RateLimitResult {
  const now = Date.now();
  const entry = store.get(identifier) || { timestamps: [] };

  entry.timestamps = entry.timestamps.filter(
    (t) => now - t < options.windowMs,
  );

  if (entry.timestamps.length >= options.max) {
    const oldestInWindow = entry.timestamps[0];
    const resetMs = oldestInWindow + options.windowMs - now;
    return { allowed: false, remaining: 0, resetMs: Math.max(0, resetMs) };
  }

  entry.timestamps.push(now);
  store.set(identifier, entry);

  return {
    allowed: true,
    remaining: options.max - entry.timestamps.length,
    resetMs: options.windowMs,
  };
}

// ============================================
// PUBLIC API
// ============================================

export function createRateLimiter(options: RateLimiterOptions) {
  const store = getInMemoryStore(options);

  return {
    async check(identifier: string): Promise<RateLimitResult> {
      // Try Upstash first (distributed)
      const hasUpstash = await tryLoadUpstash();
      if (hasUpstash) {
        try {
          const limiter = getUpstashLimiter(options);
          const result = await limiter.limit(identifier);
          return {
            allowed: result.success,
            remaining: result.remaining,
            resetMs: result.reset - Date.now(),
          };
        } catch {
          // Fall through to in-memory on Upstash error
        }
      }

      // Fallback: in-memory
      return checkInMemory(store, identifier, options);
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
