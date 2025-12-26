/**
 * Onboarding Analysis API
 * 
 * One-shot analysis for new users using UNIFIED analyzer:
 * 1. Validate & normalize URL
 * 2. Quick crawl (limited pages for speed)
 * 3. Unified SEO + AIO analysis (consistent with marketing analyzer)
 * 4. Keyword discovery
 * 5. Generate quick wins
 * 6. Save site to database
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createCrawler } from "@/lib/crawler";
import { analyzeMultiplePages, analyzePageUnified, type PageInput } from "@/lib/analyzer";
import { dataForSEO } from "@/lib/integrations/dataforseo/client";
import { claude } from "@/lib/ai/claude-client";

// Types - Now includes AIO score!
interface OnboardingResult {
  siteId: string;
  domain: string;
  seoScore: number;
  aioScore: number;      // NEW: AIO score
  combinedScore: number; // NEW: Combined score
  pagesAnalyzed: number;
  issues: {
    critical: number;
    warnings: number;
    passed: number;
  };
  keywords: Array<{
    keyword: string;
    volume: number;
    difficulty: number;
    opportunity: "high" | "medium" | "low";
  }>;
  contentIdeas: Array<{
    title: string;
    keyword: string;
    trafficPotential: number;
  }>;
  quickWins: Array<{
    type: string;
    title: string;
    impact: "high" | "medium" | "low";
    count?: number;
  }>;
  // NEW: Top recommendations
  topSeoFixes: string[];
  topAioFixes: string[];
}

// Helper: Extract domain from URL
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
  }
}

// Helper: Normalize URL
function normalizeUrl(input: string): string {
  let url = input.trim().toLowerCase();
  url = url.replace(/\/+$/, "");
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  return url;
}

// Helper: Classify opportunity
function classifyOpportunity(volume: number, difficulty: number): "high" | "medium" | "low" {
  const ratio = volume / (difficulty + 1);
  if (ratio > 200 && difficulty < 40) return "high";
  if (ratio > 100 && difficulty < 50) return "medium";
  return "low";
}

// Testing mode - read from environment
const TESTING_MODE = process.env.TESTING_MODE === "true";

export async function POST(request: NextRequest) {
  // Use service client for database writes (bypasses RLS)
  let serviceClient;
  try {
    serviceClient = createServiceClient();
  } catch (e) {
    console.error("[Onboarding Analyze] Failed to create service client:", e);
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  let userId: string;
  let userEmail: string;

  if (TESTING_MODE) {
    // TESTING: Use a test user context
    console.log("[Onboarding Analyze] TESTING_MODE: Bypassing auth");
    
    // Get or create a test user
    const { data: testUser } = await serviceClient
      .from("users")
      .select("id, email")
      .limit(1)
      .single();
    
    const typedTestUser = testUser as { id: string; email: string } | null;
    if (typedTestUser) {
      userId = typedTestUser.id;
      userEmail = typedTestUser.email || "test@example.com";
    } else {
      // Create a test user if none exists
      const testId = `test-user-${Date.now()}`;
      const testEmail = "test@cabbageseo.com";
      await serviceClient
        .from("users")
        .insert({
          id: testId,
          email: testEmail,
          full_name: "Test User",
        } as never);
      userId = testId;
      userEmail = testEmail;
    }
  } else {
    // Production: Require authentication
    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.id;
    userEmail = user.email || "";
  }

  try {
    const body = await request.json();
    const { url: rawUrl } = body;

    if (!rawUrl) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Normalize URL
    const url = normalizeUrl(rawUrl);
    const domain = extractDomain(url);

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Get user's organization (use service client to bypass RLS)
    const { data: userData } = await serviceClient
      .from("users")
      .select("organization_id")
      .eq("id", userId)
      .single();

    let organizationId = (userData as { organization_id?: string } | null)?.organization_id;

    // If user doesn't exist or no organization, create them
    if (!userData && !TESTING_MODE) {
      const { error: userError } = await serviceClient
        .from("users")
        .insert({
          id: userId,
          email: userEmail,
          full_name: userEmail?.split("@")[0] || "User",
        } as never);

      if (userError) {
        console.error("Failed to create user:", userError);
      }
    }

    // If no organization, create one
    if (!organizationId) {
      const { data: newOrg, error: orgError } = await serviceClient
        .from("organizations")
        .insert({
          name: `${userEmail?.split("@")[0] || "Test"}'s Organization`,
          slug: `org-${userId.slice(0, 8)}-${Date.now()}`,
          subscription_status: "trialing",
        } as never)
        .select("id")
        .single();

      if (orgError || !newOrg) {
        console.error("Failed to create organization:", orgError);
        const { data: existingOrg } = await serviceClient
          .from("organizations")
          .select("id")
          .eq("owner_id", userId)
          .single();
        
        if (existingOrg) {
          organizationId = (existingOrg as { id: string }).id;
        } else {
          return NextResponse.json({ 
            error: "Failed to setup account. Please try refreshing the page.",
            details: orgError?.message 
          }, { status: 500 });
        }
      } else {
        organizationId = (newOrg as { id: string }).id;
      }

      // Update user with organization
      await serviceClient
        .from("users")
        .upsert({ 
          id: userId,
          organization_id: organizationId,
          email: userEmail,
        } as never);
    }

    // Check if site already exists
    const { data: existingSite } = await serviceClient
      .from("sites")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("domain", domain)
      .single();

    let siteId: string;

    if (existingSite) {
      siteId = (existingSite as { id: string }).id;
    } else {
      // Create new site
      const { data: newSite, error: siteError } = await serviceClient
        .from("sites")
        .insert({
          organization_id: organizationId,
          domain,
          name: domain,
        } as never)
        .select("id")
        .single();

      if (siteError || !newSite) {
        console.error("Failed to create site:", siteError);
        return NextResponse.json({ error: "Failed to create site" }, { status: 500 });
      }

      siteId = (newSite as { id: string }).id;
    }

    // ========================================
    // STEP 1: Quick crawl with raw content for AIO analysis
    // ========================================
    const crawler = createCrawler({
      maxPages: 20,      // Quick scan for onboarding
      maxDepth: 2,
      delayMs: 300,
      respectRobotsTxt: true,
      followExternalLinks: false,
      includeRawContent: true, // IMPORTANT: Need raw HTML/text for AIO analysis
    });

    const crawlResult = await crawler.crawl(url);
    const pagesAnalyzed = crawlResult.pages?.length || 0;

    if (pagesAnalyzed === 0) {
      return NextResponse.json(
        { error: "Could not access the website. Please check the URL." },
        { status: 400 }
      );
    }

    // ========================================
    // STEP 2: UNIFIED SEO + AIO Analysis
    // ========================================
    // Convert crawl pages to PageInput format
    const pageInputs: PageInput[] = (crawlResult.pages || []).map(page => ({
      url: page.url,
      title: page.title,
      metaDescription: page.metaDescription,
      h1: page.h1,
      h2: page.h2,
      h3: page.h3,
      wordCount: page.wordCount,
      loadTimeMs: page.loadTimeMs,
      htmlSize: page.htmlSize,
      schemaMarkup: page.schemaMarkup,
      rawHtml: page.rawHtml,
      textContent: page.textContent,
      images: page.images?.map(img => ({
        src: img.src,
        alt: img.alt ?? undefined,
      })),
      links: page.links,
    }));

    // Use unified analyzer for consistent scoring
    const analysisResult = analyzeMultiplePages(pageInputs);
    
    // Also analyze the homepage specifically for detailed AIO insights
    const homepageAnalysis = pageInputs.length > 0 
      ? analyzePageUnified(pageInputs[0])
      : null;

    // ========================================
    // STEP 3: Keyword discovery (unchanged)
    // ========================================
    let keywords: OnboardingResult["keywords"] = [];
    
    try {
      const pageTexts = crawlResult.pages?.slice(0, 10).map(p => 
        `${p.title || ""} ${p.metaDescription || ""} ${(p.h1 || []).join(" ")} ${(p.h2 || []).join(" ")}`
      ).join(" ") || "";

      let seedKeywords: string[] = [];
      try {
        const keywordResponse = await claude.chat([{
          role: "user",
          content: `Extract 5 main topic keywords from this website content. Return ONLY a JSON array of strings, nothing else:

${pageTexts.slice(0, 2000)}

Example output: ["keyword1", "keyword2", "keyword3"]`
        }], undefined, { model: "haiku", maxTokens: 200 });

        seedKeywords = JSON.parse(keywordResponse.content);
      } catch {
        seedKeywords = [domain.replace(/\.(com|net|org|io)$/, "")];
      }

      if (seedKeywords.length > 0) {
        const keywordData = await dataForSEO.getKeywordSuggestions(
          seedKeywords[0],
          "United States",
          20
        );

        keywords = keywordData.slice(0, 10).map(k => ({
          keyword: k.keyword,
          volume: k.volume || 0,
          difficulty: k.difficulty || 50,
          opportunity: classifyOpportunity(k.volume || 0, k.difficulty || 50),
        }));
      }
    } catch (e) {
      console.log("Keyword research failed:", e);
    }

    // ========================================
    // STEP 4: Generate content ideas (unchanged)
    // ========================================
    let contentIdeas: OnboardingResult["contentIdeas"] = [];
    
    if (keywords.length > 0) {
      try {
        const ideaResponse = await claude.chat([{
          role: "user",
          content: `Based on these keywords, suggest 3 article titles that would rank well. Return ONLY a JSON array:

Keywords: ${keywords.slice(0, 5).map(k => k.keyword).join(", ")}

Format: [{"title": "Article Title", "keyword": "target keyword", "trafficPotential": 1000}]`
        }], undefined, { model: "haiku", maxTokens: 300 });

        contentIdeas = JSON.parse(ideaResponse.content);
      } catch {
        contentIdeas = keywords.slice(0, 3).map(k => ({
          title: `Complete Guide to ${k.keyword.charAt(0).toUpperCase() + k.keyword.slice(1)}`,
          keyword: k.keyword,
          trafficPotential: Math.round(k.volume * 0.3),
        }));
      }
    }

    // ========================================
    // STEP 5: Generate quick wins from unified analysis
    // ========================================
    const quickWins: OnboardingResult["quickWins"] = [];

    // Use unified recommendations
    if (analysisResult.topSeoFixes.length > 0) {
      quickWins.push({
        type: "seo",
        title: analysisResult.topSeoFixes[0],
        impact: "high",
      });
    }

    if (analysisResult.topAioFixes.length > 0) {
      quickWins.push({
        type: "aio",
        title: analysisResult.topAioFixes[0],
        impact: "high",
      });
    }

    // Add specific quick wins based on homepage analysis
    if (homepageAnalysis) {
      // AIO-specific quick wins
      if (!homepageAnalysis.aio.factors.hasSchema) {
        quickWins.push({
          type: "schema",
          title: "Add JSON-LD structured data for AI visibility",
          impact: "high",
        });
      }
      
      if (!homepageAnalysis.aio.factors.hasFAQSection) {
        quickWins.push({
          type: "faq",
          title: "Add FAQ section - AI platforms love Q&A format",
          impact: "high",
        });
      }
      
      if (!homepageAnalysis.aio.factors.hasDirectAnswers) {
        quickWins.push({
          type: "content",
          title: "Add direct definitions (X is...) for AI citations",
          impact: "medium",
        });
      }
    }

    // If not enough quick wins, add generic ones
    if (quickWins.length < 3) {
      if (analysisResult.issues.critical > 0) {
        quickWins.push({
          type: "technical",
          title: `Fix ${analysisResult.issues.critical} critical SEO issues`,
          impact: "high",
          count: analysisResult.issues.critical,
        });
      }
      
      if (analysisResult.issues.warnings > 0) {
        quickWins.push({
          type: "optimization",
          title: `Address ${analysisResult.issues.warnings} SEO warnings`,
          impact: "medium",
          count: analysisResult.issues.warnings,
        });
      }
    }

    // ========================================
    // STEP 6: Update site with scores (use serviceClient)
    // ========================================
    await serviceClient
      .from("sites")
      .update({
        is_active: true,
        seo_score: analysisResult.seoScore,
        aio_score_avg: analysisResult.aioScore,
        last_crawl_at: new Date().toISOString(),
        last_crawl_pages_count: pagesAnalyzed,
        aio_last_analyzed: new Date().toISOString(),
      } as never)
      .eq("id", siteId);

    // Save audit result (use serviceClient)
    await serviceClient
      .from("audits")
      .insert({
        site_id: siteId,
        type: "onboarding",
        overall_score: analysisResult.combinedScore,
        technical_score: analysisResult.seoScore,
        aio_score: analysisResult.aioScore,
        pages_scanned: pagesAnalyzed,
        issues_found: analysisResult.issues.critical + analysisResult.issues.warnings,
        critical_issues: analysisResult.issues.critical,
        warning_issues: analysisResult.issues.warnings,
        status: "completed",
        completed_at: new Date().toISOString(),
      } as never);

    // ========================================
    // STEP 7: Save individual issues to database
    // ========================================
    if (homepageAnalysis) {
      // Extract all issues (fail/warning) from SEO breakdown
      const allSeoItems = [
        ...homepageAnalysis.seo.details.technical.map(i => ({ ...i, category: "technical" })),
        ...homepageAnalysis.seo.details.content.map(i => ({ ...i, category: "content" })),
        ...homepageAnalysis.seo.details.meta.map(i => ({ ...i, category: "meta" })),
        ...homepageAnalysis.seo.details.performance.map(i => ({ ...i, category: "performance" })),
        ...homepageAnalysis.seo.details.accessibility.map(i => ({ ...i, category: "accessibility" })),
      ];

      // Also extract AIO issues
      const allAioItems = [
        ...homepageAnalysis.aio.details.structure.map(i => ({ ...i, category: "aio-structure" })),
        ...homepageAnalysis.aio.details.authority.map(i => ({ ...i, category: "aio-authority" })),
        ...homepageAnalysis.aio.details.schema.map(i => ({ ...i, category: "aio-schema" })),
        ...homepageAnalysis.aio.details.contentQuality.map(i => ({ ...i, category: "aio-content" })),
        ...homepageAnalysis.aio.details.quotability.map(i => ({ ...i, category: "aio-quotability" })),
      ];

      // Filter to only issues (fail or warning)
      const issues = [...allSeoItems, ...allAioItems]
        .filter(item => item.status === "fail" || item.status === "warning")
        .map(item => ({
          site_id: siteId,
          page_url: normalizedUrl,
          category: item.category,
          severity: item.status === "fail" ? "critical" : "warning",
          title: item.name,
          description: item.reason,
          suggested_value: item.howToFix || null,
          auto_fixable: false,
          status: "open",
          is_resolved: false,
        }));

      // Delete old issues for this site (fresh analysis)
      await serviceClient
        .from("issues")
        .delete()
        .eq("site_id", siteId);

      // Insert new issues
      if (issues.length > 0) {
        await serviceClient
          .from("issues")
          .insert(issues as never);
      }

      console.log(`[Onboarding Analysis] Saved ${issues.length} issues for site ${siteId}`);
    }

    // ========================================
    // Return results with AIO scores!
    // ========================================
    const result: OnboardingResult = {
      siteId,
      domain,
      seoScore: analysisResult.seoScore,
      aioScore: analysisResult.aioScore,
      combinedScore: analysisResult.combinedScore,
      pagesAnalyzed,
      issues: analysisResult.issues,
      keywords,
      contentIdeas,
      quickWins,
      topSeoFixes: analysisResult.topSeoFixes,
      topAioFixes: analysisResult.topAioFixes,
    };

    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error("[Onboarding Analysis] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
