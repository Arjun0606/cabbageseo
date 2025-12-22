import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSubscription } from "@/lib/api/require-subscription";
import { dataForSEO } from "@/lib/integrations/dataforseo/client";
import { ai } from "@/lib/integrations/openai/client";

export async function POST(request: NextRequest) {
  try {
    // Authentication and subscription check
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await requireSubscription(supabase);
    if (!subscription.authorized) {
      return subscription.error!;
    }

    const body = await request.json();
    const { seedKeywords, domain, location = "United States" } = body;

    if (!seedKeywords || seedKeywords.length === 0) {
      return NextResponse.json(
        { error: "Seed keywords are required" },
        { status: 400 }
      );
    }

    // Get keyword suggestions from DataForSEO
    const allKeywords: Array<{
      keyword: string;
      volume: number;
      difficulty: number;
      cpc: number;
      competition: number;
      intent: string;
      serpFeatures: string[];
    }> = [];

    for (const seed of seedKeywords.slice(0, 5)) {
      const suggestions = await dataForSEO.getKeywordSuggestions(
        seed,
        location,
        50
      );
      allKeywords.push(...suggestions);
    }

    // Get competitor keywords if domain provided
    if (domain) {
      const competitorKeywords = await dataForSEO.getCompetitorKeywords(
        domain,
        50
      );
      allKeywords.push(...competitorKeywords);
    }

    // Remove duplicates
    const uniqueKeywords = Array.from(
      new Map(allKeywords.map((k) => [k.keyword, k])).values()
    );

    // Cluster keywords using AI
    const clusters = await ai.clusterKeywords(
      uniqueKeywords.map((k) => k.keyword)
    );

    // Match keywords to clusters
    const keywordsWithClusters = uniqueKeywords.map((keyword) => {
      const cluster = clusters.find((c) =>
        c.keywords.includes(keyword.keyword)
      );
      return {
        ...keyword,
        clusterId: cluster?.name || null,
        clusterName: cluster?.name || "Uncategorized",
      };
    });

    // Sort by volume and difficulty
    const sortedKeywords = keywordsWithClusters.sort((a, b) => {
      // Prioritize high volume, low difficulty
      const scoreA = a.volume / (a.difficulty + 1);
      const scoreB = b.volume / (b.difficulty + 1);
      return scoreB - scoreA;
    });

    return NextResponse.json({
      keywords: sortedKeywords,
      clusters,
      totalKeywords: sortedKeywords.length,
    });
  } catch (error) {
    console.error("Keyword research error:", error);
    return NextResponse.json(
      { error: "Failed to research keywords" },
      { status: 500 }
    );
  }
}

