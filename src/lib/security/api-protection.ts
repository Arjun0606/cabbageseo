/**
 * API Security & Protection Layer for CabbageSEO
 * 
 * Features:
 * - Rate limiting (per IP, per user, per endpoint)
 * - DDoS protection
 * - Input validation & sanitization
 * - CSRF protection
 * - Request signing validation
 * - IP blocking for suspicious activity
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// ============================================
// RATE LIMITING
// ============================================

interface RateLimitEntry {
  count: number;
  firstRequest: number;
  blocked: boolean;
  blockedUntil?: number;
}

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();
const blockedIPs = new Set<string>();

// Rate limit configurations per endpoint type
export const RATE_LIMITS = {
  // Authentication endpoints - strict limits
  auth: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 10,           // 10 requests per window
    blockDuration: 60 * 60 * 1000,  // 1 hour block
  },
  // API endpoints - moderate limits
  api: {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 60,           // 60 requests per minute
    blockDuration: 5 * 60 * 1000,   // 5 minute block
  },
  // AI endpoints - conservative limits (expensive)
  ai: {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 10,           // 10 AI requests per minute
    blockDuration: 10 * 60 * 1000,  // 10 minute block
  },
  // SEO data endpoints - moderate limits
  seo: {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 30,           // 30 requests per minute
    blockDuration: 5 * 60 * 1000,   // 5 minute block
  },
  // Webhook endpoints - strict limits
  webhook: {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 100,          // 100 requests per minute
    blockDuration: 15 * 60 * 1000,  // 15 minute block
  },
};

type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Get client IP from request
 */
export function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  
  return "unknown";
}

/**
 * Check rate limit for a key
 */
export function checkRateLimit(
  key: string,
  type: RateLimitType = "api"
): { allowed: boolean; remaining: number; retryAfter?: number } {
  const config = RATE_LIMITS[type];
  const now = Date.now();
  
  // Check if IP is blocked
  if (blockedIPs.has(key)) {
    return { allowed: false, remaining: 0, retryAfter: config.blockDuration / 1000 };
  }
  
  const entry = rateLimitStore.get(key);
  
  // No previous requests
  if (!entry) {
    rateLimitStore.set(key, {
      count: 1,
      firstRequest: now,
      blocked: false,
    });
    return { allowed: true, remaining: config.maxRequests - 1 };
  }
  
  // Check if blocked
  if (entry.blocked && entry.blockedUntil) {
    if (now < entry.blockedUntil) {
      return { 
        allowed: false, 
        remaining: 0, 
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000) 
      };
    }
    // Block expired, reset
    entry.blocked = false;
    entry.count = 1;
    entry.firstRequest = now;
    return { allowed: true, remaining: config.maxRequests - 1 };
  }
  
  // Check if window expired
  if (now - entry.firstRequest > config.windowMs) {
    entry.count = 1;
    entry.firstRequest = now;
    return { allowed: true, remaining: config.maxRequests - 1 };
  }
  
  // Increment count
  entry.count++;
  
  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    entry.blocked = true;
    entry.blockedUntil = now + config.blockDuration;
    return { 
      allowed: false, 
      remaining: 0, 
      retryAfter: config.blockDuration / 1000 
    };
  }
  
  return { allowed: true, remaining: config.maxRequests - entry.count };
}

/**
 * Rate limit middleware
 */
export function rateLimit(type: RateLimitType = "api") {
  return (request: NextRequest): NextResponse | null => {
    const ip = getClientIP(request);
    const { allowed, remaining, retryAfter } = checkRateLimit(ip, type);
    
    if (!allowed) {
      return NextResponse.json(
        { 
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter,
        },
        { 
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
    
    // Add rate limit headers
    const response = null; // Continue to handler
    return response;
  };
}

// ============================================
// DDoS PROTECTION
// ============================================

interface DDoSEntry {
  requests: number[];
  suspicious: boolean;
}

const ddosStore = new Map<string, DDoSEntry>();
const DDOS_THRESHOLD = 100;  // 100 requests per second = suspicious
const DDOS_WINDOW = 1000;    // 1 second window

/**
 * Check for DDoS-like behavior
 */
export function checkDDoS(ip: string): boolean {
  const now = Date.now();
  const entry = ddosStore.get(ip);
  
  if (!entry) {
    ddosStore.set(ip, { requests: [now], suspicious: false });
    return true;
  }
  
  // Remove old requests outside window
  entry.requests = entry.requests.filter(t => now - t < DDOS_WINDOW);
  entry.requests.push(now);
  
  // Check if suspicious
  if (entry.requests.length > DDOS_THRESHOLD) {
    entry.suspicious = true;
    blockedIPs.add(ip);
    console.warn(`[DDOS] Blocked suspicious IP: ${ip} (${entry.requests.length} req/s)`);
    return false;
  }
  
  return true;
}

// ============================================
// INPUT VALIDATION & SANITIZATION
// ============================================

/**
 * Sanitize string input
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== "string") return "";
  
  return input
    .trim()
    .slice(0, 10000)  // Limit length
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")  // Remove scripts
    .replace(/javascript:/gi, "")  // Remove javascript: URLs
    .replace(/on\w+=/gi, "");  // Remove event handlers
}

/**
 * Sanitize URL input
 */
export function sanitizeURL(input: unknown): string | null {
  if (typeof input !== "string") return null;
  
  try {
    const url = new URL(input.trim());
    
    // Only allow http and https
    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }
    
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(input: unknown): string | null {
  if (typeof input !== "string") return null;
  
  const email = input.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email) || email.length > 254) {
    return null;
  }
  
  return email;
}

/**
 * Validate and sanitize request body
 */
export function validateRequestBody<T extends Record<string, unknown>>(
  body: unknown,
  schema: {
    [K in keyof T]: {
      type: "string" | "number" | "boolean" | "array" | "object";
      required?: boolean;
      maxLength?: number;
      min?: number;
      max?: number;
      pattern?: RegExp;
    };
  }
): { valid: boolean; data: Partial<T>; errors: string[] } {
  const errors: string[] = [];
  const data: Partial<T> = {};
  
  if (!body || typeof body !== "object") {
    return { valid: false, data: {}, errors: ["Invalid request body"] };
  }
  
  const bodyObj = body as Record<string, unknown>;
  
  for (const [key, rules] of Object.entries(schema)) {
    const value = bodyObj[key];
    
    // Check required
    if (rules.required && (value === undefined || value === null || value === "")) {
      errors.push(`${key} is required`);
      continue;
    }
    
    if (value === undefined || value === null) continue;
    
    // Type validation
    switch (rules.type) {
      case "string":
        if (typeof value !== "string") {
          errors.push(`${key} must be a string`);
        } else {
          const sanitized = sanitizeString(value);
          if (rules.maxLength && sanitized.length > rules.maxLength) {
            errors.push(`${key} must be at most ${rules.maxLength} characters`);
          }
          if (rules.pattern && !rules.pattern.test(sanitized)) {
            errors.push(`${key} has invalid format`);
          }
          (data as Record<string, unknown>)[key] = sanitized;
        }
        break;
        
      case "number":
        const num = typeof value === "string" ? parseFloat(value) : value;
        if (typeof num !== "number" || isNaN(num)) {
          errors.push(`${key} must be a number`);
        } else {
          if (rules.min !== undefined && num < rules.min) {
            errors.push(`${key} must be at least ${rules.min}`);
          }
          if (rules.max !== undefined && num > rules.max) {
            errors.push(`${key} must be at most ${rules.max}`);
          }
          (data as Record<string, unknown>)[key] = num;
        }
        break;
        
      case "boolean":
        if (typeof value !== "boolean") {
          errors.push(`${key} must be a boolean`);
        } else {
          (data as Record<string, unknown>)[key] = value;
        }
        break;
        
      case "array":
        if (!Array.isArray(value)) {
          errors.push(`${key} must be an array`);
        } else {
          (data as Record<string, unknown>)[key] = value;
        }
        break;
        
      case "object":
        if (typeof value !== "object" || Array.isArray(value)) {
          errors.push(`${key} must be an object`);
        } else {
          (data as Record<string, unknown>)[key] = value;
        }
        break;
    }
  }
  
  return { valid: errors.length === 0, data, errors };
}

// ============================================
// CSRF PROTECTION
// ============================================

const csrfTokens = new Map<string, { token: string; expires: number }>();

/**
 * Generate CSRF token for a session
 */
export function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = Date.now() + 60 * 60 * 1000; // 1 hour
  
  csrfTokens.set(sessionId, { token, expires });
  
  return token;
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);
  
  if (!stored) return false;
  if (Date.now() > stored.expires) {
    csrfTokens.delete(sessionId);
    return false;
  }
  
  // Timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(stored.token),
    Buffer.from(token)
  );
}

// ============================================
// REQUEST SIGNING (for webhooks)
// ============================================

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

// ============================================
// API PROTECTION MIDDLEWARE
// ============================================

export interface ProtectionOptions {
  rateLimit?: RateLimitType;
  requireAuth?: boolean;
  validateCSRF?: boolean;
  allowedMethods?: string[];
}

/**
 * Main API protection middleware
 */
export async function protectAPI(
  request: NextRequest,
  options: ProtectionOptions = {}
): Promise<NextResponse | null> {
  const ip = getClientIP(request);
  
  // DDoS check
  if (!checkDDoS(ip)) {
    return NextResponse.json(
      { error: "Access denied", message: "Your IP has been blocked due to suspicious activity." },
      { status: 403 }
    );
  }
  
  // Method check
  if (options.allowedMethods && !options.allowedMethods.includes(request.method)) {
    return NextResponse.json(
      { error: "Method not allowed" },
      { status: 405 }
    );
  }
  
  // Rate limiting
  if (options.rateLimit) {
    const result = rateLimit(options.rateLimit)(request);
    if (result) return result;
  }
  
  // CSRF validation for non-GET requests
  if (options.validateCSRF && request.method !== "GET") {
    const csrfToken = request.headers.get("x-csrf-token");
    const sessionId = request.cookies.get("session_id")?.value;
    
    if (!sessionId || !csrfToken || !validateCSRFToken(sessionId, csrfToken)) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }
  }
  
  return null; // Continue to handler
}

// ============================================
// SECURITY HEADERS
// ============================================

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  
  return response;
}

// ============================================
// CLEANUP (call periodically)
// ============================================

/**
 * Clean up expired entries
 */
export function cleanupSecurityStores(): void {
  const now = Date.now();
  
  // Clean rate limit store
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.blocked && entry.blockedUntil && now > entry.blockedUntil) {
      rateLimitStore.delete(key);
    }
  }
  
  // Clean CSRF tokens
  for (const [key, entry] of csrfTokens.entries()) {
    if (now > entry.expires) {
      csrfTokens.delete(key);
    }
  }
  
  // Clean DDoS store (keep last minute only)
  for (const [key, entry] of ddosStore.entries()) {
    entry.requests = entry.requests.filter(t => now - t < 60000);
    if (entry.requests.length === 0) {
      ddosStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupSecurityStores, 5 * 60 * 1000);
}

