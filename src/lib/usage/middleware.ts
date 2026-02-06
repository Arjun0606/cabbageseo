/**
 * Rate Limiting & DDoS Protection Middleware
 * 
 * Implements:
 * 1. Per-organization rate limits
 * 2. IP-based rate limits (for unauthenticated requests)
 * 3. Endpoint-specific limits
 * 4. Gradual backoff for repeated violations
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "./tracker";

// Rate limit tiers
const RATE_LIMIT_CONFIG = {
  // Unauthenticated requests (by IP)
  unauthenticated: {
    requests_per_minute: 20,
    requests_per_hour: 100,
    requests_per_day: 500,
  },
  
  // Authenticated - Scout plan
  scout: {
    requests_per_minute: 60,
    requests_per_hour: 500,
    requests_per_day: 5000,
  },

  // Authenticated - Command plan
  command: {
    requests_per_minute: 120,
    requests_per_hour: 2000,
    requests_per_day: 20000,
  },

  // Authenticated - Dominate plan
  dominate: {
    requests_per_minute: 300,
    requests_per_hour: 5000,
    requests_per_day: 50000,
  },
} as const;

// Endpoint-specific rate limits (more restrictive for expensive operations)
const ENDPOINT_LIMITS: Record<string, { requests: number; windowMs: number }> = {
  "/api/content/generate": { requests: 10, windowMs: 60000 }, // 10/min
  "/api/keywords/research": { requests: 20, windowMs: 60000 }, // 20/min
  "/api/content/publish": { requests: 30, windowMs: 60000 }, // 30/min
  "/api/sites": { requests: 60, windowMs: 60000 }, // 60/min
};

// In-memory store for rate limiting (use Redis in production)
interface RateLimitEntry {
  count: number;
  firstRequest: number;
  violations: number;
  blockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    // Remove entries older than 24 hours
    if (now - entry.firstRequest > 86400000) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Every minute

/**
 * Get client identifier (org ID or IP)
 */
function getClientIdentifier(request: NextRequest): {
  identifier: string;
  isAuthenticated: boolean;
  plan?: string;
} {
  // Try to get organization from session/token
  const authHeader = request.headers.get("authorization");
  const orgId = request.headers.get("x-organization-id");
  
  if (orgId) {
    // In production, validate this against the session
    const plan = request.headers.get("x-plan") || "scout";
    return {
      identifier: `org:${orgId}`,
      isAuthenticated: true,
      plan,
    };
  }
  
  // Fall back to IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || 
             request.headers.get("x-real-ip") || 
             "unknown";
  
  return {
    identifier: `ip:${ip}`,
    isAuthenticated: false,
  };
}

/**
 * Check if client is rate limited
 */
function isRateLimited(
  identifier: string,
  isAuthenticated: boolean,
  plan: string = "scout",
  endpoint: string
): { limited: boolean; retryAfter?: number; reason?: string } {
  const now = Date.now();
  const key = `${identifier}:${endpoint}`;
  
  // Check if client is blocked due to repeated violations
  const entry = rateLimitStore.get(identifier);
  if (entry?.blockedUntil && now < entry.blockedUntil) {
    return {
      limited: true,
      retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
      reason: "Too many rate limit violations. Temporarily blocked.",
    };
  }
  
  // Get appropriate limits
  const tierLimits = isAuthenticated 
    ? RATE_LIMIT_CONFIG[plan as keyof typeof RATE_LIMIT_CONFIG] || RATE_LIMIT_CONFIG.scout
    : RATE_LIMIT_CONFIG.unauthenticated;
  
  // Check endpoint-specific limit
  const endpointLimit = ENDPOINT_LIMITS[endpoint];
  if (endpointLimit) {
    const endpointKey = `${identifier}:endpoint:${endpoint}`;
    const endpointEntry = rateLimitStore.get(endpointKey);
    
    if (endpointEntry) {
      const windowElapsed = now - endpointEntry.firstRequest;
      
      if (windowElapsed < endpointLimit.windowMs) {
        if (endpointEntry.count >= endpointLimit.requests) {
          return {
            limited: true,
            retryAfter: Math.ceil((endpointLimit.windowMs - windowElapsed) / 1000),
            reason: `Rate limit exceeded for this endpoint. Max ${endpointLimit.requests} requests per minute.`,
          };
        }
        endpointEntry.count++;
      } else {
        // Reset window
        rateLimitStore.set(endpointKey, { count: 1, firstRequest: now, violations: 0 });
      }
    } else {
      rateLimitStore.set(endpointKey, { count: 1, firstRequest: now, violations: 0 });
    }
  }
  
  // Check per-minute limit
  const minuteKey = `${identifier}:minute`;
  const minuteEntry = rateLimitStore.get(minuteKey);
  
  if (minuteEntry) {
    const windowElapsed = now - minuteEntry.firstRequest;
    
    if (windowElapsed < 60000) {
      if (minuteEntry.count >= tierLimits.requests_per_minute) {
        // Record violation
        recordViolation(identifier);
        
        return {
          limited: true,
          retryAfter: Math.ceil((60000 - windowElapsed) / 1000),
          reason: `Rate limit exceeded. Max ${tierLimits.requests_per_minute} requests per minute.`,
        };
      }
      minuteEntry.count++;
    } else {
      rateLimitStore.set(minuteKey, { count: 1, firstRequest: now, violations: 0 });
    }
  } else {
    rateLimitStore.set(minuteKey, { count: 1, firstRequest: now, violations: 0 });
  }
  
  return { limited: false };
}

/**
 * Record a rate limit violation (for progressive blocking)
 */
function recordViolation(identifier: string): void {
  const entry = rateLimitStore.get(identifier) || { 
    count: 0, 
    firstRequest: Date.now(), 
    violations: 0 
  };
  
  entry.violations++;
  
  // Progressive blocking based on violations
  if (entry.violations >= 10) {
    // Block for 1 hour after 10 violations
    entry.blockedUntil = Date.now() + 3600000;
  } else if (entry.violations >= 5) {
    // Block for 10 minutes after 5 violations
    entry.blockedUntil = Date.now() + 600000;
  } else if (entry.violations >= 3) {
    // Block for 1 minute after 3 violations
    entry.blockedUntil = Date.now() + 60000;
  }
  
  rateLimitStore.set(identifier, entry);
}

/**
 * Rate limiting middleware for API routes
 */
export async function rateLimitMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  const { identifier, isAuthenticated, plan } = getClientIdentifier(request);
  const endpoint = new URL(request.url).pathname;
  
  // Skip rate limiting for webhooks (they have their own auth)
  if (endpoint.startsWith("/api/webhooks")) {
    return null;
  }
  
  const { limited, retryAfter, reason } = isRateLimited(
    identifier,
    isAuthenticated,
    plan,
    endpoint
  );
  
  if (limited) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: reason,
        retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter || 60),
          "X-RateLimit-Reset": String(Date.now() + (retryAfter || 60) * 1000),
        },
      }
    );
  }
  
  return null; // Continue to handler
}

/**
 * Helper to create rate-limited API handler
 */
export function withRateLimit<T>(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const rateLimitResponse = await rateLimitMiddleware(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    return handler(request);
  };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  identifier: string,
  plan: string = "scout"
): Record<string, string> {
  const tierLimits = RATE_LIMIT_CONFIG[plan as keyof typeof RATE_LIMIT_CONFIG] ||
                     RATE_LIMIT_CONFIG.scout;
  
  const minuteKey = `${identifier}:minute`;
  const entry = rateLimitStore.get(minuteKey);
  
  const remaining = entry 
    ? Math.max(0, tierLimits.requests_per_minute - entry.count)
    : tierLimits.requests_per_minute;
  
  const resetAt = entry 
    ? entry.firstRequest + 60000
    : Date.now() + 60000;
  
  return {
    "X-RateLimit-Limit": String(tierLimits.requests_per_minute),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(resetAt),
  };
}

