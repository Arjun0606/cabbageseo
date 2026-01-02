/**
 * GEO Quickstart API - 1-Click Onboarding
 * 
 * POST /api/geo/quickstart
 * 
 * The simplest possible onboarding:
 * 1. User enters URL
 * 2. We auto-analyze the site
 * 3. We set up autopilot
 * 4. They're done
 * 
 * "Enter your URL. We get you cited by AI."
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SiteCrawler } from "@/lib/crawler/site-crawler";
import { openai } from "@/lib/ai/openai-client";

interface QuickstartRequest {
  url: string;
  email?: string; // For non-authenticated users (free analyzer)
}

interface QuickstartResponse {
  success: boolean;
  siteId?: string;
  siteName?: string;
  domain?: string;
  analysis: {
    geoScore: number;
    topTopics: string[];
    contentGaps: string[];
    citationPotential: "high" | "medium" | "low";
    platforms: {
      chatgpt: number;
      perplexity: number;
      googleAio: number;
    };
  };
  autopilot: {
    enabled: boolean;
    articlesPerWeek: number;
    nextArticleDate: string;
    suggestedTopics: string[];
  };
  quickWins: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as QuickstartRequest;
    
    if (!body.url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Normalize URL
    let url = body.url.trim();
    if (!url.startsWith("http")) {
      url = `https://${url}`;
    }

    let domain: string;
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname.replace(/^www\./, "");
    } catch {
      return NextResponse.json(
        { error: "Invalid URL" },
        { status: 400 }
      );
    }

    // Check auth (optional - works for free analyzer too)
    const supabase = await createClient();
    let userId: string | null = null;
    let orgId: string | null = null;

    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
      
      if (userId) {
        // Get org
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_organization_id")
          .eq("id", userId)
          .single();
        orgId = (profile as { current_organization_id: string } | null)?.current_organization_id || null;
      }
    }

    // Step 1: Quick crawl (homepage + a few pages)
    const crawler = new SiteCrawler({
      maxPages: 5, // Just enough to understand the site
      maxDepth: 2,
      timeout: 10000,
    });

    const crawlResult = await crawler.crawl(url);
    const pages = crawlResult.pages || [];
    const homepage = pages[0];

    // Step 2: AI Analysis - Extract topics, assess GEO readiness
    const contentSample = pages
      .slice(0, 3)
      .map(p => `Title: ${p.title}\nContent: ${p.textContent?.slice(0, 500) || ""}`)
      .join("\n\n---\n\n");

    const analysisPrompt = `Analyze this website for GEO (Generative Engine Optimization) - optimizing to get cited by AI search engines like ChatGPT, Perplexity, and Google AI.

Website: ${domain}
${homepage?.title ? `Title: ${homepage.title}` : ""}
${homepage?.metaDescription ? `Description: ${homepage.metaDescription}` : ""}

Content samples:
${contentSample}

Analyze and return JSON:
{
  "geoScore": 0-100,
  "topTopics": ["topic1", "topic2", "topic3"],
  "contentGaps": ["missing topic 1", "missing topic 2"],
  "citationPotential": "high" | "medium" | "low",
  "platforms": {
    "chatgpt": 0-100,
    "perplexity": 0-100,
    "googleAio": 0-100
  },
  "suggestedArticles": [
    "Article title 1 that would get cited",
    "Article title 2 that would get cited",
    "Article title 3 that would get cited"
  ],
  "quickWins": [
    "Add FAQ section to homepage",
    "Include expert quotes in content",
    "Add structured data for key topics"
  ],
  "entityOpportunities": ["entity1", "entity2"],
  "businessType": "saas" | "ecommerce" | "blog" | "agency" | "other"
}

Focus on what makes AI cite content:
- Clear, quotable answers
- Expert attribution
- FAQ format
- Entity-rich content
- Structured data`;

    const analysis = await openai.getJSON<{
      geoScore: number;
      topTopics: string[];
      contentGaps: string[];
      citationPotential: "high" | "medium" | "low";
      platforms: { chatgpt: number; perplexity: number; googleAio: number };
      suggestedArticles: string[];
      quickWins: string[];
      entityOpportunities: string[];
      businessType: string;
    }>(analysisPrompt);

    // Step 3: Create site if authenticated
    let siteId: string | null = null;
    
    if (userId && orgId && supabase) {
      // Check if site already exists
      const { data: existingSite } = await supabase
        .from("sites")
        .select("id")
        .eq("organization_id", orgId)
        .eq("domain", domain)
        .single();

      if (existingSite) {
        siteId = (existingSite as { id: string }).id;
        
        // Update with new analysis
        await (supabase as any)
          .from("sites")
          .update({
            geo_score_avg: analysis.geoScore,
            main_topics: analysis.topTopics,
            autopilot_enabled: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", siteId);
      } else {
        // Create new site with autopilot enabled by default
        const { data: newSite, error: siteError } = await (supabase as any)
          .from("sites")
          .insert({
            organization_id: orgId,
            name: domain,
            domain: domain,
            url: url,
            geo_score_avg: analysis.geoScore,
            main_topics: analysis.topTopics,
            autopilot_enabled: true,
            status: "active",
          })
          .select("id")
          .single();

        if (siteError) {
          console.error("Error creating site:", siteError);
        } else {
          siteId = (newSite as { id: string }).id;
        }
      }

      // Store the analysis
      if (siteId) {
        await (supabase as any)
          .from("aio_analyses")
          .insert({
            site_id: siteId,
            combined_score: analysis.geoScore,
            chatgpt_score: analysis.platforms.chatgpt,
            perplexity_score: analysis.platforms.perplexity,
            google_aio_score: analysis.platforms.googleAio,
            improvement_suggestions: analysis.quickWins,
            analyzed_at: new Date().toISOString(),
          });
      }
    }

    // Calculate next article date (next Monday)
    const now = new Date();
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
    const nextMonday = new Date(now.getTime() + daysUntilMonday * 24 * 60 * 60 * 1000);
    nextMonday.setHours(9, 0, 0, 0); // 9 AM

    const response: QuickstartResponse = {
      success: true,
      siteId: siteId || undefined,
      siteName: domain,
      domain,
      analysis: {
        geoScore: analysis.geoScore,
        topTopics: analysis.topTopics,
        contentGaps: analysis.contentGaps,
        citationPotential: analysis.citationPotential,
        platforms: analysis.platforms,
      },
      autopilot: {
        enabled: Boolean(siteId),
        articlesPerWeek: 1, // Default for starter plan
        nextArticleDate: nextMonday.toISOString(),
        suggestedTopics: analysis.suggestedArticles,
      },
      quickWins: analysis.quickWins,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Quickstart error:", error);
    return NextResponse.json(
      { error: "Failed to analyze site", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

