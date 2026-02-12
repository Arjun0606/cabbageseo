/**
 * GET /api/geo/opportunities?siteId=X
 *
 * Returns content opportunities (visibility gaps) from geo_analyses.
 *
 * Impact scoring is based on real data:
 * - Buyer intent of the query (high-intent buying queries = high impact)
 * - How many platforms missed you (all 3 = critical, 1 = lower)
 * - Whether the query is contested (other domains cited = higher priority)
 *
 * Merges with generated_pages to show which gaps are addressed.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/api/get-user";
import type { SupabaseClient } from "@supabase/supabase-js";

function getDbClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

// Enriched gap data from the scan engine
interface EnrichedLostQuery {
  query: string;
  platform?: string;
  snippet?: string;
  buyerIntent?: number;
  citedOnPlatforms?: string[];
  missedOnPlatforms?: string[];
  citedDomains?: string[];
}

// Legacy format (older scans)
interface LegacyLostQuery {
  query: string;
  platform?: string;
  snippet?: string;
}

interface PageRow {
  id: string;
  query: string;
  status: string;
  word_count: number | null;
  created_at: string;
}

export interface Opportunity {
  id: string;
  query: string;
  platform: string;
  snippet: string;
  impact: "high" | "medium" | "low";
  impactReason: string;
  hasPage: boolean;
  pageId: string | null;
  pageStatus: string | null;
  /** How many platforms missed you for this query */
  missedPlatformCount: number;
  /** Names of platforms that DO cite you for this query */
  citedOnPlatforms: string[];
  /** Domains AI cited instead of you */
  citedDomains: string[];
  /** Buyer intent score (0-1) */
  buyerIntent: number;
}

/**
 * Calculate meaningful impact based on real data, not snippet length.
 */
function calculateImpact(gap: EnrichedLostQuery | LegacyLostQuery): {
  impact: "high" | "medium" | "low";
  reason: string;
} {
  const enriched = gap as EnrichedLostQuery;

  // If we have enriched data from the new scan engine
  if (enriched.buyerIntent !== undefined || enriched.missedOnPlatforms) {
    const intent = enriched.buyerIntent ?? 0.5;
    const missedCount = enriched.missedOnPlatforms?.length ?? 1;
    const hasCitedDomains = (enriched.citedDomains?.length ?? 0) > 0;

    // High impact: high buyer intent + missed on multiple platforms + others ARE cited
    if (intent >= 0.7 && missedCount >= 2) {
      return {
        impact: "high",
        reason: hasCitedDomains
          ? `High-intent query, missed on ${missedCount} platforms, other domains are being cited`
          : `High-intent query, missed on ${missedCount} platforms`,
      };
    }

    // High impact: missed on ALL platforms (even low intent)
    if (missedCount >= 3) {
      return {
        impact: "high",
        reason: "Invisible across all AI platforms for this query",
      };
    }

    // Medium: moderate intent or moderate coverage gap
    if (intent >= 0.5 || missedCount >= 2) {
      return {
        impact: "medium",
        reason: missedCount >= 2
          ? `Missed on ${missedCount} platforms`
          : "Moderate buyer-intent query with visibility gap",
      };
    }

    return { impact: "low", reason: "Lower-intent query with partial coverage" };
  }

  // Legacy fallback: use what we have
  if (gap.snippet && gap.snippet.length > 100) {
    return { impact: "medium", reason: "Detailed AI response exists without mentioning you" };
  }
  return { impact: "low", reason: "Visibility gap detected" };
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const siteId = request.nextUrl.searchParams.get("siteId");
    if (!siteId) {
      return NextResponse.json({ error: "siteId required" }, { status: 400 });
    }

    const db = getDbClient();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { data: siteData } = await db
      .from("sites")
      .select("id, domain")
      .eq("id", siteId)
      .eq("organization_id", currentUser.organizationId)
      .maybeSingle();

    if (!siteData) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Fetch last 3 analyses + pages in parallel
    // Using multiple scans lets us catch gaps from recent history, not just the last scan
    const [analysisResult, pagesResult] = await Promise.all([
      db
        .from("geo_analyses")
        .select("queries, created_at")
        .eq("site_id", siteId)
        .order("created_at", { ascending: false })
        .limit(3),
      db
        .from("generated_pages")
        .select("id, query, status, word_count, created_at")
        .eq("site_id", siteId),
    ]);

    const analyses = (analysisResult.data || []) as { queries: (EnrichedLostQuery | LegacyLostQuery)[]; created_at: string }[];
    const pages: PageRow[] = (pagesResult.data as PageRow[] | null) || [];
    const analyzedAt = analyses[0]?.created_at || null;

    // Deduplicate gaps across multiple scans (keep the most recent version of each query)
    const seenQueries = new Set<string>();
    const allGaps: (EnrichedLostQuery | LegacyLostQuery)[] = [];
    for (const analysis of analyses) {
      for (const gap of (analysis.queries || [])) {
        const key = (gap.query || "").toLowerCase().trim();
        if (key && !seenQueries.has(key)) {
          seenQueries.add(key);
          allGaps.push(gap);
        }
      }
    }

    // Build page lookup
    const pagesByQuery = new Map<string, { id: string; status: string }>();
    for (const page of pages) {
      pagesByQuery.set(page.query.toLowerCase().trim(), {
        id: page.id,
        status: page.status,
      });
    }

    // Transform gaps into enriched opportunities
    const opportunities: Opportunity[] = allGaps.map((gap, i) => {
      const normalizedQuery = (gap.query || "").toLowerCase().trim();
      const existingPage = pagesByQuery.get(normalizedQuery);
      const enriched = gap as EnrichedLostQuery;
      const { impact, reason } = calculateImpact(gap);

      return {
        id: `opp-${i}-${normalizedQuery.slice(0, 20).replace(/\s+/g, "-")}`,
        query: gap.query || "",
        platform: gap.platform || "unknown",
        snippet: gap.snippet || "",
        impact,
        impactReason: reason,
        hasPage: !!existingPage,
        pageId: existingPage?.id || null,
        pageStatus: existingPage?.status || null,
        missedPlatformCount: enriched.missedOnPlatforms?.length ?? 1,
        citedOnPlatforms: enriched.citedOnPlatforms || [],
        citedDomains: enriched.citedDomains || [],
        buyerIntent: enriched.buyerIntent ?? 0.5,
      };
    });

    // Sort: open first, then by impact (high > medium > low), then by buyer intent
    const impactOrder = { high: 0, medium: 1, low: 2 };
    opportunities.sort((a, b) => {
      if (a.hasPage !== b.hasPage) return a.hasPage ? 1 : -1;
      const impactDiff = impactOrder[a.impact] - impactOrder[b.impact];
      if (impactDiff !== 0) return impactDiff;
      return b.buyerIntent - a.buyerIntent;
    });

    const totalOpportunities = opportunities.length;
    const openOpportunities = opportunities.filter(o => !o.hasPage).length;
    const addressedOpportunities = opportunities.filter(o => o.hasPage).length;
    const publishedPages = pages.filter(p => p.status === "published").length;
    const highImpactOpen = opportunities.filter(o => !o.hasPage && o.impact === "high").length;

    return NextResponse.json({
      success: true,
      data: {
        opportunities,
        summary: {
          total: totalOpportunities,
          open: openOpportunities,
          addressed: addressedOpportunities,
          highImpactOpen,
          pagesGenerated: pages.length,
          pagesPublished: publishedPages,
        },
        analyzedAt,
      },
    });
  } catch (error) {
    console.error("[/api/geo/opportunities] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
