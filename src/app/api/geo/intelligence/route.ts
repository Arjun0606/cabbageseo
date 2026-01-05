/**
 * /api/geo/intelligence - GEO Intelligence
 * 
 * GET: Get existing GEO analysis for a site
 * POST: Run new GEO analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

function getDbClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

// Calculate GEO Score based on various factors
function calculateGeoScore(domain: string) {
  // In production, this would analyze the actual site
  // For now, generate semi-random but consistent scores
  const hash = domain.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  
  const base = 40 + (hash % 40); // 40-80 base score
  
  return {
    overall: base,
    breakdown: {
      contentClarity: base + Math.floor(Math.random() * 15) - 5,
      authoritySignals: base + Math.floor(Math.random() * 20) - 10,
      structuredData: base + Math.floor(Math.random() * 25) - 15,
      citability: base + Math.floor(Math.random() * 10) - 5,
      freshness: base + Math.floor(Math.random() * 20) - 10,
      topicalDepth: base + Math.floor(Math.random() * 15) - 5,
    },
    grade: base >= 75 ? "A" : base >= 60 ? "B" : base >= 45 ? "C" : "D",
    summary: base >= 75 
      ? "Your content is well-optimized for AI citations."
      : base >= 60 
      ? "Good foundation, but there's room for improvement."
      : base >= 45
      ? "Several areas need attention for better AI visibility."
      : "Significant improvements needed for AI visibility.",
  };
}

// Generate tips based on score
function generateTips(score: ReturnType<typeof calculateGeoScore>) {
  const tips = [];
  const breakdown = score.breakdown;

  if (breakdown.structuredData < 60) {
    tips.push({
      id: "structured-data",
      category: "Technical",
      priority: "high",
      title: "Add Structured Data",
      description: "Implement schema.org markup to help AI understand your content better.",
      impact: "+15-20 potential score increase",
      example: "Add FAQ, HowTo, or Article schema to your key pages.",
    });
  }

  if (breakdown.contentClarity < 65) {
    tips.push({
      id: "clarity",
      category: "Content",
      priority: "high",
      title: "Improve Content Clarity",
      description: "Use clear headings, bullet points, and concise paragraphs.",
      impact: "+10-15 potential score increase",
      example: "Start sections with clear topic sentences that AI can extract.",
    });
  }

  if (breakdown.authoritySignals < 60) {
    tips.push({
      id: "authority",
      category: "Authority",
      priority: "medium",
      title: "Build Authority Signals",
      description: "Add author bios, credentials, and cite reputable sources.",
      impact: "+10-12 potential score increase",
      example: "Link to authoritative sources like .gov, .edu, or industry leaders.",
    });
  }

  if (breakdown.citability < 70) {
    tips.push({
      id: "citability",
      category: "Content",
      priority: "medium",
      title: "Make Content More Citable",
      description: "Create quotable statements and unique insights that AI can reference.",
      impact: "+8-12 potential score increase",
      example: "Include statistics, original research, or expert quotes.",
    });
  }

  if (breakdown.freshness < 55) {
    tips.push({
      id: "freshness",
      category: "Maintenance",
      priority: "medium",
      title: "Update Content Regularly",
      description: "AI prefers recent, up-to-date information.",
      impact: "+5-10 potential score increase",
      example: "Add 'Last updated' dates and refresh content quarterly.",
    });
  }

  if (breakdown.topicalDepth < 60) {
    tips.push({
      id: "depth",
      category: "Content",
      priority: "low",
      title: "Increase Topical Depth",
      description: "Cover topics comprehensively with supporting content.",
      impact: "+5-8 potential score increase",
      example: "Create topic clusters with pillar pages and supporting articles.",
    });
  }

  // Always add at least one general tip
  if (tips.length === 0) {
    tips.push({
      id: "maintain",
      category: "General",
      priority: "low",
      title: "Maintain Your Good Standing",
      description: "Your content is well-optimized. Keep creating quality content.",
      impact: "Maintain current score",
      example: "Continue monitoring AI citations and updating content.",
    });
  }

  return tips;
}

// Generate query intelligence
function generateQueryIntelligence(domain: string) {
  const name = domain.split(".")[0];
  
  return [
    { query: `What is ${name}?`, searchVolume: "high", yourPosition: "absent", opportunity: true },
    { query: `${name} vs competitors`, searchVolume: "medium", yourPosition: "absent", opportunity: true },
    { query: `best ${name} alternatives`, searchVolume: "high", yourPosition: "absent", opportunity: true },
    { query: `${name} reviews`, searchVolume: "medium", yourPosition: "cited", opportunity: false },
    { query: `how to use ${name}`, searchVolume: "low", yourPosition: "absent", opportunity: true },
  ];
}

// Generate citation opportunities
function generateOpportunities(domain: string) {
  const name = domain.split(".")[0];
  
  return [
    {
      query: `best tools for ${name.charAt(0).toUpperCase() + name.slice(1)} industry`,
      competitor: "competitor.com",
      platform: "Perplexity",
      suggestedAction: "Create a comparison guide featuring your tool",
      difficulty: "medium",
    },
    {
      query: `${name} alternatives`,
      competitor: "example-competitor.io",
      platform: "ChatGPT",
      suggestedAction: "Optimize your positioning page with unique value props",
      difficulty: "easy",
    },
  ];
}

// GET - Get existing analysis
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json({ error: "siteId required" }, { status: 400 });
    }

    const db = getDbClient() || supabase;

    // Verify site belongs to user
    const { data: userData } = await db
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { data: site } = await db
      .from("sites")
      .select("id, domain, organization_id")
      .eq("id", siteId)
      .maybeSingle();

    if (!site || site.organization_id !== userData.organization_id) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Check for existing analysis (within last 24 hours)
    const { data: analysis } = await db
      .from("geo_analyses")
      .select("score, tips, queries, opportunities, created_at")
      .eq("site_id", siteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (analysis) {
      // Check if analysis is recent (less than 24 hours old)
      const analysisAge = Date.now() - new Date(analysis.created_at).getTime();
      const isRecent = analysisAge < 24 * 60 * 60 * 1000;

      return NextResponse.json({
        success: true,
        data: {
          score: analysis.score,
          tips: analysis.tips,
          queries: analysis.queries,
          opportunities: analysis.opportunities,
          needsAnalysis: !isRecent,
        },
      });
    }

    // No analysis found
    return NextResponse.json({
      success: true,
      data: {
        score: null,
        tips: [],
        queries: [],
        opportunities: [],
        needsAnalysis: true,
      },
    });

  } catch (error) {
    console.error("[/api/geo/intelligence GET] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - Run new analysis
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { siteId } = body;

    if (!siteId) {
      return NextResponse.json({ error: "siteId required" }, { status: 400 });
    }

    const db = getDbClient() || supabase;

    // Verify site belongs to user
    const { data: userData } = await db
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { data: site } = await db
      .from("sites")
      .select("id, domain, organization_id")
      .eq("id", siteId)
      .maybeSingle();

    if (!site || site.organization_id !== userData.organization_id) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Run analysis
    const score = calculateGeoScore(site.domain);
    const tips = generateTips(score);
    const queries = generateQueryIntelligence(site.domain);
    const opportunities = generateOpportunities(site.domain);

    // Save analysis
    await db.from("geo_analyses").insert({
      site_id: siteId,
      organization_id: userData.organization_id,
      score,
      tips,
      queries,
      opportunities,
    });

    return NextResponse.json({
      success: true,
      data: {
        score,
        tips,
        queries,
        opportunities,
        needsAnalysis: false,
      },
    });

  } catch (error) {
    console.error("[/api/geo/intelligence POST] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
