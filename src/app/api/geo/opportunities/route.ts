/**
 * GET /api/geo/opportunities?siteId=X
 *
 * Returns content opportunities: queries where competitors are cited but user isn't.
 * Combines lost queries from geo_analyses with existing generated pages
 * to show which opportunities have been addressed and which are still open.
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

interface LostQuery {
  query: string;
  competitors?: string[];
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
  competitors: string[];
  platform: string;
  snippet: string;
  impact: "high" | "medium" | "low";
  hasPage: boolean;
  pageId: string | null;
  pageStatus: string | null;
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

    // Verify site belongs to user's organization
    const { data: siteData } = await db
      .from("sites")
      .select("id, domain")
      .eq("id", siteId)
      .eq("organization_id", currentUser.organizationId)
      .maybeSingle();

    if (!siteData) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Fetch lost queries and generated pages in parallel
    const [analysisResult, pagesResult] = await Promise.all([
      db
        .from("geo_analyses")
        .select("queries, created_at")
        .eq("site_id", siteId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      db
        .from("generated_pages")
        .select("id, query, status, word_count, created_at")
        .eq("site_id", siteId),
    ]);

    const lostQueries: LostQuery[] =
      (analysisResult.data as { queries: LostQuery[] } | null)?.queries || [];
    const pages: PageRow[] = (pagesResult.data as PageRow[] | null) || [];
    const analyzedAt = (analysisResult.data as { created_at: string } | null)?.created_at || null;

    // Build a lookup of generated pages by normalized query
    const pagesByQuery = new Map<string, { id: string; status: string }>();
    for (const page of pages) {
      pagesByQuery.set(page.query.toLowerCase().trim(), {
        id: page.id,
        status: page.status,
      });
    }

    // Transform lost queries into opportunities
    const opportunities: Opportunity[] = lostQueries.map((lq, i) => {
      const normalizedQuery = (lq.query || "").toLowerCase().trim();
      const existingPage = pagesByQuery.get(normalizedQuery);
      const competitors = lq.competitors || [];

      // Impact: high if 3+ competitors, medium if 1-2, low if none listed
      const impact: "high" | "medium" | "low" =
        competitors.length >= 3 ? "high" : competitors.length >= 1 ? "medium" : "low";

      return {
        id: `opp-${i}-${normalizedQuery.slice(0, 20).replace(/\s+/g, "-")}`,
        query: lq.query || "",
        competitors,
        platform: lq.platform || "unknown",
        snippet: lq.snippet || "",
        impact,
        hasPage: !!existingPage,
        pageId: existingPage?.id || null,
        pageStatus: existingPage?.status || null,
      };
    });

    // Sort: open opportunities first (no page), then by impact
    const impactOrder = { high: 0, medium: 1, low: 2 };
    opportunities.sort((a, b) => {
      if (a.hasPage !== b.hasPage) return a.hasPage ? 1 : -1;
      return impactOrder[a.impact] - impactOrder[b.impact];
    });

    // Summary stats
    const totalOpportunities = opportunities.length;
    const openOpportunities = opportunities.filter((o) => !o.hasPage).length;
    const addressedOpportunities = opportunities.filter((o) => o.hasPage).length;
    const publishedPages = pages.filter((p) => p.status === "published").length;

    return NextResponse.json({
      success: true,
      data: {
        opportunities,
        summary: {
          total: totalOpportunities,
          open: openOpportunities,
          addressed: addressedOpportunities,
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
