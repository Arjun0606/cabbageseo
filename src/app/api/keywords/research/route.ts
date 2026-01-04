/**
 * Keyword Research API
 * POST /api/keywords/research
 * 
 * AI-powered keyword research using GPT-5-mini
 * Returns keyword suggestions with intent, GEO opportunity, and semantic clusters
 * 
 * Replaces DataForSEO - better for GEO optimization and much cheaper
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { keywordIntelligence, toDbKeywords, type AIKeyword } from "@/lib/ai/keyword-intelligence";
import { requireUsageLimit, incrementUsage } from "@/lib/api/check-usage";

export const maxDuration = 30;

const TESTING_MODE = process.env.TESTING_MODE === "true";

interface ResearchRequest {
  siteId: string;
  seedKeyword: string;
  type?: "suggestions" | "competitors" | "gap";
  competitorDomains?: string[];
  limit?: number;
}

export async function POST(request: NextRequest) {
  try {
    let supabase;
    try {
      supabase = TESTING_MODE ? createServiceClient() : await createClient();
    } catch (e) {
      console.error("[Keyword Research] Supabase error:", e);
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    // Check auth (skip in testing mode)
    let orgId: string | null = null;
    
    if (TESTING_MODE) {
      const { data: orgs } = await supabase.from("organizations").select("id").limit(1);
      orgId = (orgs?.[0] as { id: string } | undefined)?.id || null;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      // Get user's organization (use service client to bypass RLS)
      let serviceClient;
      try {
        serviceClient = createServiceClient();
      } catch {
        serviceClient = supabase;
      }
      
      const { data: userData } = await serviceClient
        .from("users")
        .select("organization_id")
        .eq("id", user.id)
        .single();
      orgId = (userData as { organization_id?: string } | null)?.organization_id || null;
    }

    if (!orgId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // Get user's plan for usage limits (reuse serviceClient if available)
    let planClient;
    try {
      planClient = createServiceClient();
    } catch {
      planClient = supabase;
    }
    
    const { data: orgData } = await planClient
      .from("organizations")
      .select("plan")
      .eq("id", orgId)
      .single();
    const plan = (orgData as { plan?: string } | null)?.plan || "starter";

    // Check usage limits for keywords (skip in testing mode)
    if (!TESTING_MODE) {
      const usageCheck = await requireUsageLimit(supabase, orgId, plan, "keywords", 50);
      if (!usageCheck.allowed) {
        return NextResponse.json({
          error: usageCheck.error.message,
          code: usageCheck.error.code,
          usage: { current: usageCheck.error.current, limit: usageCheck.error.limit },
          upgradeUrl: "/pricing",
        }, { status: 402 });
      }
    }

    const body: ResearchRequest = await request.json();
    const { siteId, seedKeyword, type = "suggestions", limit = 50 } = body;

    if (!siteId || !seedKeyword) {
      return NextResponse.json(
        { error: "siteId and seedKeyword are required" },
        { status: 400 }
      );
    }

    // Verify site ownership and get site context
    const { data: siteData } = await supabase
      .from("sites")
      .select("id, domain, name, industry")
      .eq("id", siteId)
      .eq("organization_id", orgId)
      .single();

    if (!siteData) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const site = siteData as { id: string; domain: string; name?: string; industry?: string };
    
    // Get existing pages/content to understand site context
    const { data: pagesData } = await supabase
      .from("pages")
      .select("title, url")
      .eq("site_id", siteId)
      .limit(10);
    
    const existingPages = (pagesData || []) as { title: string; url: string }[];
    const siteTopics = existingPages.map(p => p.title).filter(Boolean);
    
    console.log(`[Keyword Research] Site context: ${site.domain}, Industry: ${site.industry || "unknown"}, Pages: ${siteTopics.length}`);

    // Use AI-powered keyword intelligence (GPT-5-mini)
    console.log(`[Keyword Research] Using AI for: ${seedKeyword} (type: ${type})`);
    
    let aiKeywords: AIKeyword[] = [];
    
    let clusters: Array<{
      name: string;
      pillarKeyword: string;
      suggestedArticles: number;
    }> = [];
    
    let topQuestions: string[] = [];
    let contentGaps: string[] = [];

    try {
      switch (type) {
        case "suggestions": {
          const result = await keywordIntelligence.research(seedKeyword, {
            siteContext: {
              domain: site.domain,
              industry: site.industry || undefined,
              existingTopics: siteTopics,
            },
            limit,
          });
          aiKeywords = result.keywords;
          clusters = result.clusters.map(c => ({
            name: c.name,
            pillarKeyword: c.pillarKeyword,
            suggestedArticles: c.suggestedArticles,
          }));
          topQuestions = result.topQuestions;
          contentGaps = result.contentGaps;
          console.log(`[Keyword Research] AI generated ${aiKeywords.length} keywords, ${clusters.length} clusters`);
          break;
        }
        case "competitors": {
          const result = await keywordIntelligence.analyzeCompetitor(site.domain, {
            industry: site.industry || undefined,
            limit,
          });
          aiKeywords = result.keywords;
          contentGaps = result.contentGaps;
          console.log(`[Keyword Research] Competitor analysis: ${aiKeywords.length} keywords found`);
          break;
        }
        case "gap": {
          // For gap analysis, analyze first competitor
          if (body.competitorDomains?.length) {
            const result = await keywordIntelligence.analyzeCompetitor(body.competitorDomains[0], {
              yourDomain: site.domain,
              industry: site.industry || undefined,
              limit,
            });
            aiKeywords = result.keywords;
            contentGaps = result.contentGaps;
          }
          break;
        }
      }
    } catch (error) {
      console.error("[Keyword Research] AI error:", error);
      // Return error instead of falling back to mock data
      return NextResponse.json(
        { error: "Keyword research failed. Please try again." },
        { status: 500 }
      );
    }

    // Convert AI keywords to DB format with volume/difficulty estimates
    const volumeMap: Record<string, number> = { high: 5000, medium: 1000, low: 200 };
    const difficultyMap: Record<string, number> = { easy: 25, medium: 50, hard: 75 };
    
    const keywords = aiKeywords.map(kw => ({
      keyword: kw.keyword,
      volume: volumeMap[kw.estimatedVolume] || 500,
      difficulty: difficultyMap[kw.difficulty] || 50,
      cpc: 0, // Not relevant for GEO
      intent: kw.intent,
      geoOpportunity: kw.geoOpportunity,
      questions: kw.questions,
      entities: kw.entities,
    }));

    // Save keywords to database
    const keywordRows = toDbKeywords(aiKeywords, siteId);

    if (keywordRows.length > 0) {
      // Try to insert all keywords at once (more efficient)
      console.log(`[Keyword Research] Attempting to save ${keywordRows.length} keywords for site ${siteId}`);
      
      // First, get existing keywords to avoid duplicates
      const { data: existingKeywords } = await supabase
        .from("keywords")
        .select("keyword")
        .eq("site_id", siteId);
      
      const existingSet = new Set((existingKeywords || []).map((k: { keyword: string }) => k.keyword.toLowerCase()));
      
      // Filter to only new keywords
      const newKeywords = keywordRows.filter(row => !existingSet.has(row.keyword.toLowerCase()));
      
      if (newKeywords.length > 0) {
        const { data: inserted, error: insertError } = await supabase
          .from("keywords")
          .insert(newKeywords as never[])
          .select();
        
        if (insertError) {
          console.error(`[Keyword Research] Insert error:`, insertError);
        } else {
          console.log(`[Keyword Research] Successfully saved ${(inserted as unknown[])?.length || 0} new keywords`);
        }
      } else {
        console.log(`[Keyword Research] All ${keywordRows.length} keywords already exist`);
      }
    }

    // Increment usage counter
    try {
      await incrementUsage(supabase, orgId, "keywords", keywords.length);
      console.log(`[Keyword Research] Usage incremented: ${keywords.length} keywords for org ${orgId}`);
    } catch (usageError) {
      console.warn("[Keyword Research] Failed to increment usage:", usageError);
    }

    return NextResponse.json({
      success: true,
      data: {
        keywords,
        clusters,
        topQuestions,
        contentGaps,
        total: keywords.length,
        source: "ai", // GPT-5-mini powered
      },
    });

  } catch (error) {
    console.error("[Keyword Research] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Keyword research failed" },
      { status: 500 }
    );
  }
}
