/**
 * /api/sites/impact - AI Impact Tracking
 * 
 * GET - Get impact summary for a site
 * 
 * This is the "missing 10%" that turns CabbageSEO from promising to unstoppable.
 * Shows: "You did this, and it worked."
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TRUST_SOURCES } from "@/lib/ai-revenue/sources";
import {
  generateImpactSummary,
  generateImpactTimeline,
  generateWeeklyImpactReport,
  calculateGoalProgress,
} from "@/lib/ai-revenue/impact-tracking";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const siteId = request.nextUrl.searchParams.get("siteId");
    if (!siteId) {
      return NextResponse.json({ error: "siteId required" }, { status: 400 });
    }

    // Get site with category
    const { data: site } = await supabase
      .from("sites")
      .select("id, domain, category")
      .eq("id", siteId)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Get source listings
    const { data: listingsData } = await supabase
      .from("source_listings")
      .select("*")
      .eq("site_id", siteId)
      .order("listed_at", { ascending: true });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listings = ((listingsData || []) as any[]).map(l => ({
      id: l.id as string,
      siteId: l.site_id as string,
      sourceDomain: l.source_domain as string,
      sourceName: l.source_name as string,
      listedAt: new Date(l.listed_at as string),
      verifiedAt: l.verified_at ? new Date(l.verified_at as string) : undefined,
      profileUrl: l.profile_url as string | undefined,
      status: l.status as "pending" | "verified" | "unverified",
    }));

    // Get citations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: citationsData } = await supabase
      .from("citations")
      .select("*")
      .eq("site_id", siteId)
      .gte("cited_at", thirtyDaysAgo.toISOString())
      .order("cited_at", { ascending: true });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const citations = ((citationsData || []) as any[]).map(c => ({
      citedAt: new Date(c.cited_at as string),
      query: c.query as string,
      platform: c.platform as string,
      sourceDomain: c.source_domain as string | undefined,
    }));

    // Get market share snapshots
    const { data: snapshotsData } = await supabase
      .from("market_share_snapshots")
      .select("*")
      .eq("site_id", siteId)
      .order("snapshot_date", { ascending: true })
      .limit(30);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const marketShareHistory = ((snapshotsData || []) as any[]).map(s => ({
      date: s.snapshot_date as string,
      share: s.market_share as number,
    }));

    // Calculate citations by source
    const citationsBySource = new Map<string, { before: number; after: number }>();
    for (const listing of listings) {
      const listingDate = listing.listedAt;
      const before = citations.filter(c => 
        c.sourceDomain === listing.sourceDomain && 
        c.citedAt < listingDate
      ).length;
      const after = citations.filter(c => 
        c.sourceDomain === listing.sourceDomain && 
        c.citedAt >= listingDate
      ).length;
      citationsBySource.set(listing.sourceDomain, { before, after });
    }

    // Generate impact summary
    const impactSummary = generateImpactSummary(
      listings,
      citationsBySource,
      marketShareHistory,
      (site as { category: string | null }).category
    );

    // Generate timeline
    const timeline = generateImpactTimeline(
      listings,
      citations,
      marketShareHistory.map(h => ({ date: new Date(h.date), share: h.share }))
    );

    // Generate weekly report
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const citationsThisWeek = citations.filter(c => c.citedAt >= sevenDaysAgo).length;
    const citationsLastWeek = citations.filter(c => 
      c.citedAt >= fourteenDaysAgo && c.citedAt < sevenDaysAgo
    ).length;

    const currentMarketShare = marketShareHistory[marketShareHistory.length - 1]?.share || 0;
    const previousMarketShare = marketShareHistory[marketShareHistory.length - 8]?.share || 0;

    const weeklyReport = generateWeeklyImpactReport(
      listings,
      citationsThisWeek,
      citationsLastWeek,
      currentMarketShare,
      previousMarketShare,
      impactSummary.topWins,
      impactSummary.pendingOpportunities,
      (site as { category: string | null }).category
    );

    // Calculate goal progress
    const goals = calculateGoalProgress(
      citations.length,
      currentMarketShare,
      listings.length,
      50, // Target 50 citations
      25, // Target 25% market share
      10  // Target 10 sources listed
    );

    // Build the "You did this, and it worked" message
    const recentWins: string[] = [];
    for (const impact of impactSummary.topWins.slice(0, 3)) {
      if (impact.listing && impact.impact.citationsGained > 0) {
        recentWins.push(
          `You got listed on ${impact.source.name} → +${impact.impact.citationsGained} AI recommendations`
        );
      }
    }

    return NextResponse.json({
      success: true,
      impact: {
        summary: impactSummary,
        timeline: timeline.slice(0, 20),
        weeklyReport,
        goals,
        recentWins,
        
        // Key metrics for dashboard
        metrics: {
          totalSourcesListed: listings.length,
          totalSourcesAvailable: TRUST_SOURCES.length,
          coveragePercent: Math.round((listings.length / TRUST_SOURCES.length) * 100),
          citationsThisMonth: citations.length,
          marketShareNow: currentMarketShare,
          estimatedRevenueGained: impactSummary.estimatedRevenueGained,
        },
        
        // Message for users
        message: recentWins.length > 0 
          ? `🎉 ${recentWins[0]}`
          : impactSummary.pendingOpportunities.length > 0
            ? `💡 Get listed on ${impactSummary.pendingOpportunities[0].name} to start gaining AI recommendations`
            : "Keep tracking! AI visibility takes time to build.",
      },
    });
  } catch (error) {
    console.error("Impact GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

