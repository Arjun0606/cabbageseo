/**
 * GEO Improvement Tracking API
 * 
 * GET /api/geo/improvement?siteId=xxx
 * 
 * Returns real improvement data by comparing current GEO scores
 * with historical data from aio_analyses table.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSubscription } from "@/lib/api/require-subscription";

interface AioAnalysis {
  id: string;
  site_id: string;
  page_id: string;
  combined_score: number | null;
  chatgpt_score: number | null;
  perplexity_score: number | null;
  google_aio_score: number | null;
  analyzed_at: string;
}

interface ImprovementData {
  current: {
    overallScore: number;
    chatgptScore: number;
    perplexityScore: number;
    googleAioScore: number;
    analyzedAt: string;
  };
  previous: {
    overallScore: number;
    chatgptScore: number;
    perplexityScore: number;
    googleAioScore: number;
    analyzedAt: string;
  } | null;
  improvement: {
    overall: number;
    chatgpt: number;
    perplexity: number;
    googleAio: number;
    periodDays: number;
  } | null;
  trend: "up" | "down" | "stable";
  pagesAnalyzed: number;
  citationsFound: number;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Auth check
    const subscription = await requireSubscription(supabase);
    if (!subscription.authorized) {
      return subscription.error!;
    }

    const siteId = req.nextUrl.searchParams.get("siteId");
    if (!siteId) {
      return NextResponse.json(
        { error: "siteId is required" },
        { status: 400 }
      );
    }

    // Get current (latest) GEO scores for the site
    const { data: latestAnalysesRaw, error: latestError } = await supabase
      .from("aio_analyses")
      .select("*")
      .eq("site_id", siteId)
      .order("analyzed_at", { ascending: false })
      .limit(50);

    const latestAnalyses = (latestAnalysesRaw || []) as AioAnalysis[];

    if (latestError) {
      console.error("Error fetching latest analyses:", latestError);
      return NextResponse.json(
        { error: "Failed to fetch GEO data" },
        { status: 500 }
      );
    }

    if (!latestAnalyses || latestAnalyses.length === 0) {
      // No data yet - return empty improvement
      return NextResponse.json({
        success: true,
        data: {
          current: null,
          previous: null,
          improvement: null,
          trend: "stable",
          pagesAnalyzed: 0,
          citationsFound: 0,
          message: "No GEO analyses yet. Run your first analysis to start tracking improvements!",
        },
      });
    }

    // Calculate current average scores (last 24 hours)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentAnalyses = latestAnalyses.filter(
      a => new Date(a.analyzed_at) >= oneDayAgo
    );
    
    // If no recent analyses, use the most recent ones
    const currentAnalyses = recentAnalyses.length > 0 
      ? recentAnalyses 
      : latestAnalyses.slice(0, 10);

    // Get historical analyses for comparison (1 week ago or 1 month ago)
    const { data: historicalAnalysesRaw } = await supabase
      .from("aio_analyses")
      .select("*")
      .eq("site_id", siteId)
      .gte("analyzed_at", oneMonthAgo.toISOString())
      .lte("analyzed_at", oneWeekAgo.toISOString())
      .order("analyzed_at", { ascending: false })
      .limit(20);

    const historicalAnalyses = (historicalAnalysesRaw || []) as AioAnalysis[];

    // Calculate averages
    const calculateAvg = (analyses: AioAnalysis[], field: keyof AioAnalysis): number => {
      const values = analyses
        .map(a => a[field])
        .filter((v): v is number => typeof v === "number" && v !== null);
      return values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
    };

    const current = {
      overallScore: calculateAvg(currentAnalyses, "combined_score"),
      chatgptScore: calculateAvg(currentAnalyses, "chatgpt_score"),
      perplexityScore: calculateAvg(currentAnalyses, "perplexity_score"),
      googleAioScore: calculateAvg(currentAnalyses, "google_aio_score"),
      analyzedAt: currentAnalyses[0]?.analyzed_at || now.toISOString(),
    };

    let previous: ImprovementData["previous"] = null;
    let improvement: ImprovementData["improvement"] = null;
    let trend: "up" | "down" | "stable" = "stable";

    if (historicalAnalyses.length > 0) {
      previous = {
        overallScore: calculateAvg(historicalAnalyses, "combined_score"),
        chatgptScore: calculateAvg(historicalAnalyses, "chatgpt_score"),
        perplexityScore: calculateAvg(historicalAnalyses, "perplexity_score"),
        googleAioScore: calculateAvg(historicalAnalyses, "google_aio_score"),
        analyzedAt: historicalAnalyses[0]?.analyzed_at || "",
      };

      const overallChange = current.overallScore - previous.overallScore;
      
      improvement = {
        overall: overallChange,
        chatgpt: current.chatgptScore - previous.chatgptScore,
        perplexity: current.perplexityScore - previous.perplexityScore,
        googleAio: current.googleAioScore - previous.googleAioScore,
        periodDays: Math.round(
          (new Date(current.analyzedAt).getTime() - new Date(previous.analyzedAt).getTime()) / 
          (24 * 60 * 60 * 1000)
        ),
      };

      if (overallChange > 2) trend = "up";
      else if (overallChange < -2) trend = "down";
    }

    // Count unique pages analyzed
    const uniquePages = new Set(latestAnalyses.map(a => a.page_id)).size;

    // Count citations (approximation based on high perplexity scores)
    const citationsFound = latestAnalyses.filter(
      a => a.perplexity_score && a.perplexity_score >= 70
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        current,
        previous,
        improvement,
        trend,
        pagesAnalyzed: uniquePages,
        citationsFound,
        hasHistoricalData: previous !== null,
      } as ImprovementData,
    });
  } catch (error) {
    console.error("GEO improvement error:", error);
    return NextResponse.json(
      { error: "Failed to calculate improvement" },
      { status: 500 }
    );
  }
}

