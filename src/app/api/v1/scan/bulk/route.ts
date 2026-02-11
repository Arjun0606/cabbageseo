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
 * Rate limit: 50 domains per request, 200 per hour per API key.
 */

import { NextRequest, NextResponse } from "next/server";

// In-memory rate limiting per API key
const keyUsage = new Map<string, { count: number; resetAt: number }>();
const HOURLY_LIMIT = 200;
const PER_REQUEST_LIMIT = 50;

function checkKeyLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = keyUsage.get(key);

  if (!entry || now > entry.resetAt) {
    keyUsage.set(key, { count: 0, resetAt: now + 60 * 60 * 1000 });
    return { allowed: true, remaining: HOURLY_LIMIT };
  }

  if (entry.count >= HOURLY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: HOURLY_LIMIT - entry.count };
}

function incrementUsage(key: string, count: number) {
  const entry = keyUsage.get(key);
  if (entry) {
    entry.count += count;
  }
}

// Valid API keys — in production, store these in the database
function isValidApiKey(key: string): boolean {
  const validKeys = (process.env.BULK_API_KEYS || "").split(",").filter(Boolean);
  return validKeys.includes(key);
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
  // Auth check
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey || !isValidApiKey(apiKey)) {
    return NextResponse.json(
      { error: "Invalid or missing API key. Set x-api-key header." },
      { status: 401 }
    );
  }

  // Rate limit check
  const { allowed, remaining } = checkKeyLimit(apiKey);
  if (!allowed) {
    return NextResponse.json(
      { error: "Hourly rate limit exceeded. Try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(HOURLY_LIMIT),
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
  incrementUsage(apiKey, domains.length);
  const newRemaining = remaining - domains.length;

  return NextResponse.json(
    {
      scanned: results.length,
      results,
      _meta: {
        rateLimit: HOURLY_LIMIT,
        remaining: newRemaining,
        batchSize: PER_REQUEST_LIMIT,
      },
    },
    {
      headers: {
        "X-RateLimit-Limit": String(HOURLY_LIMIT),
        "X-RateLimit-Remaining": String(Math.max(0, newRemaining)),
      },
    }
  );
}
