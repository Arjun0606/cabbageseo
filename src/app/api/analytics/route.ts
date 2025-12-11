/**
 * Analytics API
 * 
 * Aggregates SEO performance data from GSC, GA4, and internal tracking
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface KeywordRow {
  keyword: string;
  search_volume: number | null;
  position: number | null;
  clicks: number | null;
  impressions: number | null;
  ctr: number | null;
}

interface ContentRow {
  id: string;
  title: string;
  url: string | null;
  status: string;
  impressions: number | null;
  clicks: number | null;
  ctr: number | null;
  avg_position: number | null;
}

// GET - Fetch analytics data
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const period = searchParams.get("period") || "30d"; // 7d, 30d, 90d
    const type = searchParams.get("type") || "overview"; // overview, keywords, pages, traffic

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = (userData as { organization_id?: string } | null)?.organization_id;
    if (!orgId) {
      return NextResponse.json({
        success: true,
        data: getEmptyAnalytics(type),
      });
    }

    // Get site(s)
    let sites: { id: string; domain: string }[] = [];
    if (siteId) {
      const { data: site } = await supabase
        .from("sites")
        .select("id, domain")
        .eq("id", siteId)
        .eq("organization_id", orgId)
        .single();
      if (site) sites = [site as { id: string; domain: string }];
    } else {
      const { data: allSites } = await supabase
        .from("sites")
        .select("id, domain")
        .eq("organization_id", orgId);
      sites = (allSites || []) as { id: string; domain: string }[];
    }

    if (sites.length === 0) {
      return NextResponse.json({
        success: true,
        data: getEmptyAnalytics(type),
      });
    }

    const siteIds = sites.map(s => s.id);

    // Fetch data based on type
    switch (type) {
      case "overview":
        return NextResponse.json({
          success: true,
          data: await getOverviewData(supabase, siteIds, period),
        });

      case "keywords":
        return NextResponse.json({
          success: true,
          data: await getKeywordsData(supabase, siteIds, period),
        });

      case "pages":
        return NextResponse.json({
          success: true,
          data: await getPagesData(supabase, siteIds, period),
        });

      case "traffic":
        return NextResponse.json({
          success: true,
          data: await getTrafficData(supabase, siteIds, period),
        });

      default:
        return NextResponse.json({
          success: true,
          data: await getOverviewData(supabase, siteIds, period),
        });
    }

  } catch (error) {
    console.error("[Analytics API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

// ============================================
// DATA FETCHERS
// ============================================

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function getOverviewData(supabase: NonNullable<SupabaseClient>, siteIds: string[], period: string) {
  // Get keywords with tracking data
  const { data: keywords } = await supabase
    .from("keywords")
    .select("keyword, search_volume, position, clicks, impressions, ctr")
    .in("site_id", siteIds);

  const keywordRows = (keywords || []) as KeywordRow[];

  // Get content performance
  const { data: content } = await supabase
    .from("content")
    .select("id, title, url, status, impressions, clicks, ctr, avg_position")
    .in("site_id", siteIds)
    .eq("status", "published");

  const contentRows = (content || []) as ContentRow[];

  // Calculate metrics
  const totalClicks = keywordRows.reduce((sum, k) => sum + (k.clicks || 0), 0);
  const totalImpressions = keywordRows.reduce((sum, k) => sum + (k.impressions || 0), 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  
  const positions = keywordRows.filter(k => k.position !== null).map(k => k.position as number);
  const avgPosition = positions.length > 0 
    ? positions.reduce((a, b) => a + b, 0) / positions.length 
    : 0;

  // Top keywords
  const topKeywords = keywordRows
    .filter(k => k.clicks !== null && k.clicks > 0)
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
    .slice(0, 10)
    .map(k => ({
      query: k.keyword,
      clicks: k.clicks || 0,
      impressions: k.impressions || 0,
      ctr: k.ctr || 0,
      position: k.position || 0,
      change: 0, // Would need historical data
    }));

  // Top pages
  const topPages = contentRows
    .filter(c => c.clicks !== null && c.clicks > 0)
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
    .slice(0, 10)
    .map(c => ({
      url: c.url || "",
      title: c.title,
      clicks: c.clicks || 0,
      impressions: c.impressions || 0,
      ctr: c.ctr || 0,
      position: c.avg_position || 0,
    }));

  // Position distribution
  const positionBuckets = {
    top3: positions.filter(p => p <= 3).length,
    top10: positions.filter(p => p <= 10 && p > 3).length,
    top20: positions.filter(p => p <= 20 && p > 10).length,
    top50: positions.filter(p => p <= 50 && p > 20).length,
    beyond: positions.filter(p => p > 50).length,
  };

  return {
    period,
    metrics: {
      totalClicks,
      totalImpressions,
      avgCtr: Math.round(avgCtr * 100) / 100,
      avgPosition: Math.round(avgPosition * 10) / 10,
      trackedKeywords: keywordRows.length,
      publishedContent: contentRows.length,
    },
    changes: {
      clicks: 0, // Would need historical comparison
      impressions: 0,
      ctr: 0,
      position: 0,
    },
    topQueries: topKeywords,
    topPages,
    positionDistribution: positionBuckets,
  };
}

async function getKeywordsData(supabase: NonNullable<SupabaseClient>, siteIds: string[], period: string) {
  const { data: keywords } = await supabase
    .from("keywords")
    .select("*")
    .in("site_id", siteIds)
    .order("clicks", { ascending: false, nullsFirst: false });

  const keywordRows = (keywords || []) as KeywordRow[];

  return {
    period,
    keywords: keywordRows.map(k => ({
      query: k.keyword,
      clicks: k.clicks || 0,
      impressions: k.impressions || 0,
      ctr: k.ctr || 0,
      position: k.position || null,
      searchVolume: k.search_volume || 0,
      change: 0,
      trend: "neutral",
    })),
    summary: {
      total: keywordRows.length,
      withRankings: keywordRows.filter(k => k.position !== null).length,
      avgPosition: calculateAvg(keywordRows.map(k => k.position)),
      totalClicks: keywordRows.reduce((sum, k) => sum + (k.clicks || 0), 0),
    },
  };
}

async function getPagesData(supabase: NonNullable<SupabaseClient>, siteIds: string[], period: string) {
  const { data: content } = await supabase
    .from("content")
    .select("*")
    .in("site_id", siteIds)
    .order("clicks", { ascending: false, nullsFirst: false });

  const contentRows = (content || []) as ContentRow[];

  return {
    period,
    pages: contentRows.map(c => ({
      url: c.url || "",
      title: c.title,
      status: c.status,
      clicks: c.clicks || 0,
      impressions: c.impressions || 0,
      ctr: c.ctr || 0,
      position: c.avg_position || null,
    })),
    summary: {
      total: contentRows.length,
      published: contentRows.filter(c => c.status === "published").length,
      withTraffic: contentRows.filter(c => (c.clicks || 0) > 0).length,
      totalClicks: contentRows.reduce((sum, c) => sum + (c.clicks || 0), 0),
    },
  };
}

async function getTrafficData(supabase: NonNullable<SupabaseClient>, siteIds: string[], period: string) {
  // Traffic sources would come from GA4 integration
  // For now, aggregate from our data

  const { data: content } = await supabase
    .from("content")
    .select("clicks, impressions, created_at")
    .in("site_id", siteIds);

  const contentRows = (content || []) as { clicks: number | null; impressions: number | null; created_at: string }[];

  const totalClicks = contentRows.reduce((sum, c) => sum + (c.clicks || 0), 0);

  return {
    period,
    sources: [
      { source: "Organic Search", sessions: totalClicks, percentage: 100, change: 0 },
    ],
    trend: [], // Would need time-series data
    summary: {
      totalSessions: totalClicks,
      organicPercentage: 100,
    },
  };
}

// ============================================
// HELPERS
// ============================================

function getEmptyAnalytics(type: string) {
  switch (type) {
    case "keywords":
      return { period: "30d", keywords: [], summary: { total: 0, withRankings: 0, avgPosition: 0, totalClicks: 0 } };
    case "pages":
      return { period: "30d", pages: [], summary: { total: 0, published: 0, withTraffic: 0, totalClicks: 0 } };
    case "traffic":
      return { period: "30d", sources: [], trend: [], summary: { totalSessions: 0, organicPercentage: 0 } };
    default:
      return {
        period: "30d",
        metrics: { totalClicks: 0, totalImpressions: 0, avgCtr: 0, avgPosition: 0, trackedKeywords: 0, publishedContent: 0 },
        changes: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
        topQueries: [],
        topPages: [],
        positionDistribution: { top3: 0, top10: 0, top20: 0, top50: 0, beyond: 0 },
      };
  }
}

function calculateAvg(values: (number | null)[]): number {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return 0;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
}

