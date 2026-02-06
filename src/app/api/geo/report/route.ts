/**
 * /api/geo/report - Shareable AI Visibility Report
 *
 * GET: Generate a report for a site
 *   - Authenticated mode: ?siteId=xxx (requires subscription)
 *   - Public mode: ?id=xxx&public=true (no auth, requires public_profile_enabled)
 *
 * Returns site momentum, citations, and competitor data.
 * Public mode anonymizes competitor domains.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireSubscription } from "@/lib/api/require-subscription";
import type { SupabaseClient } from "@supabase/supabase-js";

function getDbClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get("public") === "true";

    // ============================================
    // PUBLIC MODE — no auth required
    // ============================================
    if (isPublic) {
      const siteId = searchParams.get("id");
      if (!siteId) {
        return NextResponse.json({ error: "id parameter required" }, { status: 400 });
      }

      const db = getDbClient();
      if (!db) {
        return NextResponse.json({ error: "Database not configured" }, { status: 500 });
      }

      // Get site — only if public profile is enabled
      const { data: site } = await db
        .from("sites")
        .select("id, domain, momentum_score, momentum_change, total_citations, citations_this_week, public_profile_enabled")
        .eq("id", siteId)
        .maybeSingle();

      if (!site || !site.public_profile_enabled) {
        return NextResponse.json(
          { error: "Report not found or not public", code: "NOT_PUBLIC" },
          { status: 404 }
        );
      }

      // Get recent citations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: citations } = await db
        .from("citations")
        .select("id, platform, query, cited_at")
        .eq("site_id", siteId)
        .gte("cited_at", thirtyDaysAgo.toISOString())
        .order("cited_at", { ascending: false });

      const citationList = (citations || []) as Array<{
        id: string;
        platform: string;
        query: string;
        cited_at: string;
      }>;

      // Calculate top platforms
      const platformCounts: Record<string, number> = {};
      for (const c of citationList) {
        platformCounts[c.platform] = (platformCounts[c.platform] || 0) + 1;
      }
      const topPlatforms = Object.entries(platformCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([platform]) => {
          // Friendly names
          const names: Record<string, string> = {
            chatgpt: "ChatGPT",
            perplexity: "Perplexity",
            google_aio: "Google AI",
            gemini: "Google AI",
            claude: "Claude",
          };
          return names[platform] || platform;
        });

      // Get competitors — anonymized for public mode
      const { data: competitors } = await db
        .from("competitors")
        .select("id, domain, total_citations")
        .eq("site_id", siteId)
        .order("total_citations", { ascending: false })
        .limit(10);

      const competitorList = (competitors || []).map(
        (c: { id: string; domain: string; total_citations: number }, i: number) => ({
          domain: `Competitor ${i + 1}`,
          citations: c.total_citations || 0,
        })
      );

      return NextResponse.json({
        data: {
          site: {
            domain: site.domain,
            momentumScore: site.momentum_score || 0,
            momentumChange: site.momentum_change || 0,
          },
          citations: {
            total: site.total_citations || 0,
            thisWeek: site.citations_this_week || 0,
            topPlatforms,
          },
          competitors: competitorList,
          generatedAt: new Date().toISOString(),
        },
      });
    }

    // ============================================
    // AUTHENTICATED MODE — requires subscription
    // ============================================
    const siteId = searchParams.get("siteId");
    if (!siteId) {
      return NextResponse.json({ error: "siteId parameter required" }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    // Verify subscription
    const auth = await requireSubscription(supabase);
    if (!auth.authorized || auth.error) {
      return auth.error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDbClient() || supabase;

    // Verify site belongs to user's org
    const { data: site } = await db
      .from("sites")
      .select("id, domain, organization_id, momentum_score, momentum_change, total_citations, citations_this_week")
      .eq("id", siteId)
      .maybeSingle();

    if (!site || site.organization_id !== auth.organizationId) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Get recent citations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: citations } = await db
      .from("citations")
      .select("id, platform, query, snippet, cited_at")
      .eq("site_id", siteId)
      .gte("cited_at", thirtyDaysAgo.toISOString())
      .order("cited_at", { ascending: false });

    const citationList = (citations || []) as Array<{
      id: string;
      platform: string;
      query: string;
      snippet?: string;
      cited_at: string;
    }>;

    // Calculate top platforms
    const platformCounts: Record<string, number> = {};
    for (const c of citationList) {
      platformCounts[c.platform] = (platformCounts[c.platform] || 0) + 1;
    }
    const topPlatforms = Object.entries(platformCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([platform]) => {
        const names: Record<string, string> = {
          chatgpt: "ChatGPT",
          perplexity: "Perplexity",
          google_aio: "Google AI",
          gemini: "Google AI",
          claude: "Claude",
        };
        return names[platform] || platform;
      });

    // Get competitors — full domain visible in authenticated mode
    const { data: competitors } = await db
      .from("competitors")
      .select("id, domain, total_citations")
      .eq("site_id", siteId)
      .order("total_citations", { ascending: false })
      .limit(10);

    const competitorList = (competitors || []).map(
      (c: { id: string; domain: string; total_citations: number }) => ({
        domain: c.domain,
        citations: c.total_citations || 0,
      })
    );

    return NextResponse.json({
      data: {
        site: {
          domain: site.domain,
          momentumScore: site.momentum_score || 0,
          momentumChange: site.momentum_change || 0,
        },
        citations: {
          total: site.total_citations || 0,
          thisWeek: site.citations_this_week || 0,
          topPlatforms,
        },
        competitors: competitorList,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[/api/geo/report GET] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
