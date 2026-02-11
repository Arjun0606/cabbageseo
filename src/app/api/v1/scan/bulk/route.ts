/**
 * Bulk Domain Scanning API
 *
 * Accepts an array of domains and returns AI visibility results for each.
 * Designed for agencies, influencers, and programmatic integrations.
 *
 * POST /api/v1/scan/bulk
 * Headers: x-api-key: <key>
 * Body: { domains: string[] }
 *
 * Rate limit: 50 domains per request, configurable per API key (default 200/hr).
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// In-memory rate limiting per API key (supplementary — key-level limits stored in DB)
const keyUsage = new Map<string, { count: number; resetAt: number }>();
const PER_REQUEST_LIMIT = 50;

function checkKeyLimit(key: string, hourlyLimit: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = keyUsage.get(key);

  if (!entry || now > entry.resetAt) {
    keyUsage.set(key, { count: 0, resetAt: now + 60 * 60 * 1000 });
    return { allowed: true, remaining: hourlyLimit };
  }

  if (entry.count >= hourlyLimit) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: hourlyLimit - entry.count };
}

function incrementUsage(key: string, count: number) {
  const entry = keyUsage.get(key);
  if (entry) {
    entry.count += count;
  }
}

/**
 * Validates an API key against the database.
 * Returns the key record if valid, null otherwise.
 */
async function validateApiKey(key: string) {
  const [record] = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.key, key), eq(apiKeys.isActive, true)))
    .limit(1);

  if (!record) return null;

  // Check expiration
  if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
    return null;
  }

  // Update last used timestamp (fire-and-forget)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, record.id))
    .catch(() => {});

  return record;
}

function cleanDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

export async function POST(request: NextRequest) {
  // Auth check — validate against database
  const rawKey = request.headers.get("x-api-key");
  if (!rawKey) {
    return NextResponse.json(
      { error: "Missing API key. Set x-api-key header." },
      { status: 401 }
    );
  }

  const keyRecord = await validateApiKey(rawKey);
  if (!keyRecord) {
    return NextResponse.json(
      { error: "Invalid or expired API key." },
      { status: 401 }
    );
  }

  const hourlyLimit = keyRecord.hourlyLimit ?? 200;

  // Rate limit check
  const { allowed, remaining } = checkKeyLimit(rawKey, hourlyLimit);
  if (!allowed) {
    return NextResponse.json(
      { error: "Hourly rate limit exceeded. Try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(hourlyLimit),
          "X-RateLimit-Remaining": "0",
          "Retry-After": "3600",
        },
      }
    );
  }

  // Parse body
  let body: { domains?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.domains) || body.domains.length === 0) {
    return NextResponse.json(
      { error: "Body must contain a non-empty 'domains' array" },
      { status: 400 }
    );
  }

  const rawDomains = body.domains as string[];

  if (rawDomains.length > PER_REQUEST_LIMIT) {
    return NextResponse.json(
      { error: `Maximum ${PER_REQUEST_LIMIT} domains per request` },
      { status: 400 }
    );
  }

  // Check if we have enough remaining quota
  if (rawDomains.length > remaining) {
    return NextResponse.json(
      { error: `Only ${remaining} scans remaining in this hour. Reduce domain count or wait.` },
      { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } }
    );
  }

  // Clean and deduplicate domains
  const domains = [...new Set(rawDomains.map(cleanDomain).filter(Boolean))];

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cabbageseo.com";

  // Scan each domain via our own teaser endpoint
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"
  );

  const results: Array<{
    domain: string;
    visibilityScore: number;
    isInvisible: boolean;
    mentionedCount: number;
    reportId: string | null;
    reportUrl: string | null;
    error?: string;
  }> = [];

  // Process in batches of 3 to avoid overwhelming AI APIs
  const BATCH_SIZE = 3;
  for (let i = 0; i < domains.length; i += BATCH_SIZE) {
    const batch = domains.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.allSettled(
      batch.map(async (domain) => {
        try {
          const res = await fetch(`${baseUrl}/api/geo/teaser`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ domain }),
          });

          if (!res.ok) {
            return {
              domain,
              visibilityScore: 0,
              isInvisible: true,
              mentionedCount: 0,
              reportId: null,
              reportUrl: null,
              error: `Scan failed: ${res.status}`,
            };
          }

          const data = await res.json();
          const reportId = data.reportId || null;

          return {
            domain,
            visibilityScore: data.summary?.isInvisible ? 0 : Math.min(100, (data.summary?.mentionedCount || 0) * 25),
            isInvisible: data.summary?.isInvisible ?? true,
            mentionedCount: data.summary?.mentionedCount || 0,
            reportId,
            reportUrl: reportId ? `${APP_URL}/teaser/${reportId}` : null,
          };
        } catch (err) {
          return {
            domain,
            visibilityScore: 0,
            isInvisible: true,
            mentionedCount: 0,
            reportId: null,
            reportUrl: null,
            error: "Scan failed: network error",
          };
        }
      })
    );

    for (const settled of batchResults) {
      if (settled.status === "fulfilled") {
        results.push(settled.value);
      }
    }

    // Brief pause between batches (not on last batch)
    if (i + BATCH_SIZE < domains.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Increment usage counter
  incrementUsage(rawKey, domains.length);
  const newRemaining = remaining - domains.length;

  return NextResponse.json(
    {
      scanned: results.length,
      results,
      _meta: {
        rateLimit: hourlyLimit,
        remaining: newRemaining,
        batchSize: PER_REQUEST_LIMIT,
      },
    },
    {
      headers: {
        "X-RateLimit-Limit": String(hourlyLimit),
        "X-RateLimit-Remaining": String(Math.max(0, newRemaining)),
      },
    }
  );
}
