/**
 * AIO Trends API
 * 
 * Track AI visibility score changes over time.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const period = searchParams.get("period") || "30d"; // 7d, 30d, 90d

    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    // Verify site ownership
    const { data: site } = await supabase
      .from("sites")
      .select("id, organization_id")
      .eq("id", siteId)
      .eq("organization_id", userData.organization_id)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Calculate date range
    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get historical AIO analyses
    const { data: analyses } = await supabase
      .from("aio_analyses")
      .select(`
        analyzed_at,
        combined_score,
        google_aio_score,
        chatgpt_score,
        perplexity_score,
        claude_score,
        gemini_score
      `)
      .eq("site_id", siteId)
      .gte("analyzed_at", startDate.toISOString())
      .order("analyzed_at", { ascending: true });

    // Group by day and calculate averages
    const dailyScores: Record<string, {
      date: string;
      combined: number[];
      google_aio: number[];
      chatgpt: number[];
      perplexity: number[];
      claude: number[];
      gemini: number[];
    }> = {};

    for (const analysis of analyses || []) {
      const date = new Date(analysis.analyzed_at).toISOString().split("T")[0];
      if (!dailyScores[date]) {
        dailyScores[date] = {
          date,
          combined: [],
          google_aio: [],
          chatgpt: [],
          perplexity: [],
          claude: [],
          gemini: [],
        };
      }
      if (analysis.combined_score) dailyScores[date].combined.push(analysis.combined_score);
      if (analysis.google_aio_score) dailyScores[date].google_aio.push(analysis.google_aio_score);
      if (analysis.chatgpt_score) dailyScores[date].chatgpt.push(analysis.chatgpt_score);
      if (analysis.perplexity_score) dailyScores[date].perplexity.push(analysis.perplexity_score);
      if (analysis.claude_score) dailyScores[date].claude.push(analysis.claude_score);
      if (analysis.gemini_score) dailyScores[date].gemini.push(analysis.gemini_score);
    }

    // Calculate averages
    const trends = Object.values(dailyScores).map((day) => ({
      date: day.date,
      combined: day.combined.length ? Math.round(day.combined.reduce((a, b) => a + b, 0) / day.combined.length) : null,
      google_aio: day.google_aio.length ? Math.round(day.google_aio.reduce((a, b) => a + b, 0) / day.google_aio.length) : null,
      chatgpt: day.chatgpt.length ? Math.round(day.chatgpt.reduce((a, b) => a + b, 0) / day.chatgpt.length) : null,
      perplexity: day.perplexity.length ? Math.round(day.perplexity.reduce((a, b) => a + b, 0) / day.perplexity.length) : null,
      claude: day.claude.length ? Math.round(day.claude.reduce((a, b) => a + b, 0) / day.claude.length) : null,
      gemini: day.gemini.length ? Math.round(day.gemini.reduce((a, b) => a + b, 0) / day.gemini.length) : null,
    }));

    // Calculate change from start to end
    const firstWithData = trends.find(t => t.combined !== null);
    const lastWithData = [...trends].reverse().find(t => t.combined !== null);

    const change = firstWithData && lastWithData ? {
      combined: (lastWithData.combined || 0) - (firstWithData.combined || 0),
      google_aio: (lastWithData.google_aio || 0) - (firstWithData.google_aio || 0),
      chatgpt: (lastWithData.chatgpt || 0) - (firstWithData.chatgpt || 0),
      perplexity: (lastWithData.perplexity || 0) - (firstWithData.perplexity || 0),
      claude: (lastWithData.claude || 0) - (firstWithData.claude || 0),
      gemini: (lastWithData.gemini || 0) - (firstWithData.gemini || 0),
    } : null;

    return NextResponse.json({
      success: true,
      data: {
        period,
        trends,
        change,
        summary: {
          current: lastWithData,
          previous: firstWithData,
          dataPoints: trends.filter(t => t.combined !== null).length,
        },
      },
    });
  } catch (error) {
    console.error("AIO trends error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trends" },
      { status: 500 }
    );
  }
}

