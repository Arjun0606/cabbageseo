/**
 * Onboarding Analysis API
 * 
 * One-shot analysis for new users:
 * 1. Validate & normalize URL
 * 2. Discover sitemap
 * 3. Quick crawl (limited pages for speed)
 * 4. Technical audit
 * 5. Keyword discovery
 * 6. Generate quick wins
 * 7. Save site to database
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createCrawler, createAuditEngine } from "@/lib/crawler";
import { dataForSEO } from "@/lib/integrations/dataforseo/client";
import { claude } from "@/lib/ai/claude-client";

// Types
interface AnalysisResult {
  siteId: string;
  domain: string;
  seoScore: number;
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
  
  // Remove trailing slashes
  url = url.replace(/\/+$/, "");
  
  // Add protocol if missing
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  
  return url;
}

// Helper: Calculate SEO score from audit
// Note: Audit engine uses "critical", "warning", "info" severities
function calculateSeoScore(issues: { severity: string }[]): number {
  const critical = issues.filter(i => i.severity === "critical").length;
  const warning = issues.filter(i => i.severity === "warning").length;
  const info = issues.filter(i => i.severity === "info").length;
  
  // Start at 100 and deduct points
  let score = 100;
  score -= critical * 15;  // Critical issues are severe
  score -= warning * 5;    // Warnings are moderate
  score -= info * 1;       // Info issues are minor
  
  return Math.max(0, Math.min(100, score));
}

// Helper: Classify opportunity
// High: good volume-to-difficulty ratio AND low difficulty
// Medium: decent ratio AND reasonable difficulty (both conditions must be true)
// Low: everything else
function classifyOpportunity(volume: number, difficulty: number): "high" | "medium" | "low" {
  const ratio = volume / (difficulty + 1);
  if (ratio > 200 && difficulty < 40) return "high";
  if (ratio > 100 && difficulty < 50) return "medium";
  return "low";
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service client for database writes (bypasses RLS)
  const serviceClient = createServiceClient();

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
      .eq("id", user.id)
      .single();

    let organizationId = (userData as { organization_id?: string } | null)?.organization_id;

    // If user doesn't exist or no organization, create them
    if (!userData) {
      // User doesn't exist in users table yet - create user first
      const { error: userError } = await serviceClient
        .from("users")
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0],
          avatar_url: user.user_metadata?.avatar_url,
        } as never);

      if (userError) {
        console.error("Failed to create user:", userError);
        // Continue anyway - might already exist
      }
    }

    // If no organization, create one
    if (!organizationId) {
      const { data: newOrg, error: orgError } = await serviceClient
        .from("organizations")
        .insert({
          name: `${user.email?.split("@")[0]}'s Organization`,
          slug: `org-${user.id.slice(0, 8)}-${Date.now()}`,
          owner_id: user.id,
          subscription_status: "trialing",
        } as never)
        .select("id")
        .single();

      if (orgError || !newOrg) {
        console.error("Failed to create organization:", orgError);
        // Try to get existing org (might have been created by trigger)
        const { data: existingOrg } = await serviceClient
          .from("organizations")
          .select("id")
          .eq("owner_id", user.id)
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
          id: user.id,
          organization_id: organizationId,
          email: user.email,
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
          url,
          status: "analyzing",
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
    // STEP 1: Quick crawl (limited for speed)
    // ========================================
    // Note: We could use sitemap for faster crawling, but for onboarding
    // we want a quick representative sample, so we just crawl directly
    const crawler = createCrawler({
      maxPages: 30,      // Quick scan for onboarding
      maxDepth: 2,
      delayMs: 300,
      respectRobotsTxt: true,
      followExternalLinks: false,
    });

    const crawlResult = await crawler.crawl(url);
    const pagesAnalyzed = crawlResult.pages?.length || 0;

    // ========================================
    // STEP 3: Technical audit
    // ========================================
    const auditEngine = createAuditEngine();
    const auditResult = auditEngine.audit(crawlResult);

    const issues = auditResult.issues || [];
    const criticalCount = issues.filter(i => i.severity === "critical").length;
    const warningCount = issues.filter(i => i.severity === "warning").length;
    const infoCount = issues.filter(i => i.severity === "info").length;
    const passedCount = Math.max(0, (pagesAnalyzed * 5) - criticalCount - warningCount - infoCount); // Estimate

    const seoScore = calculateSeoScore(issues);

    // ========================================
    // STEP 4: Keyword discovery
    // ========================================
    let keywords: AnalysisResult["keywords"] = [];
    
    try {
      // Extract potential keywords from page content
      const pageTexts = crawlResult.pages?.slice(0, 10).map(p => 
        `${p.title || ""} ${p.metaDescription || ""} ${(p.h1 || []).join(" ")} ${(p.h2 || []).join(" ")}`
      ).join(" ") || "";

      // Use Claude to extract seed keywords
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
        // Fallback: use domain-based keywords
        seedKeywords = [domain.replace(/\.(com|net|org|io)$/, "")];
      }

      // Get keyword data from DataForSEO
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
      // Return empty keywords - not critical for onboarding
    }

    // ========================================
    // STEP 5: Generate content ideas with AI
    // ========================================
    let contentIdeas: AnalysisResult["contentIdeas"] = [];
    
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
        // Fallback content ideas
        contentIdeas = keywords.slice(0, 3).map(k => ({
          title: `Complete Guide to ${k.keyword.charAt(0).toUpperCase() + k.keyword.slice(1)}`,
          keyword: k.keyword,
          trafficPotential: Math.round(k.volume * 0.3),
        }));
      }
    }

    // ========================================
    // STEP 6: Generate quick wins
    // ========================================
    const quickWins: AnalysisResult["quickWins"] = [];

    // Missing meta descriptions
    const missingMeta = crawlResult.pages?.filter(p => !p.metaDescription).length || 0;
    if (missingMeta > 0) {
      quickWins.push({
        type: "meta",
        title: `Add missing meta descriptions to ${missingMeta} pages`,
        impact: missingMeta > 5 ? "high" : "medium",
        count: missingMeta,
      });
    }

    // Missing title tags
    const missingTitles = crawlResult.pages?.filter(p => !p.title).length || 0;
    if (missingTitles > 0) {
      quickWins.push({
        type: "title",
        title: `Add missing title tags to ${missingTitles} pages`,
        impact: "high",
        count: missingTitles,
      });
    }

    // Images without alt text
    const imagesWithoutAlt = crawlResult.pages?.reduce((sum, p) => 
      sum + (p.images?.filter(img => !img.alt).length || 0), 0) || 0;
    if (imagesWithoutAlt > 0) {
      quickWins.push({
        type: "images",
        title: `Add alt text to ${imagesWithoutAlt} images`,
        impact: imagesWithoutAlt > 10 ? "high" : "medium",
        count: imagesWithoutAlt,
      });
    }

    // Broken links (category is "links")
    const brokenLinks = issues.filter(i => i.category === "links").length;
    if (brokenLinks > 0) {
      quickWins.push({
        type: "links",
        title: `Fix ${brokenLinks} link issues`,
        impact: "high",
        count: brokenLinks,
      });
    }

    // Slow pages
    const slowPages = crawlResult.pages?.filter(p => (p.loadTimeMs || 0) > 3000).length || 0;
    if (slowPages > 0) {
      quickWins.push({
        type: "speed",
        title: `Optimize ${slowPages} slow-loading pages`,
        impact: "medium",
        count: slowPages,
      });
    }

    // If no quick wins found, add generic ones
    if (quickWins.length === 0) {
      quickWins.push({
        type: "content",
        title: "Create content targeting low-competition keywords",
        impact: "high",
      });
      quickWins.push({
        type: "links",
        title: "Build internal links between related pages",
        impact: "medium",
      });
    }

    // ========================================
    // STEP 7: Update site status
    // ========================================
    await supabase
      .from("sites")
      .update({
        is_active: true,
        seo_score: seoScore,
        last_crawl_at: new Date().toISOString(),
        last_crawl_pages_count: pagesAnalyzed,
      } as never)
      .eq("id", siteId);

    // Save audit result
    await supabase
      .from("audits")
      .upsert({
        site_id: siteId,
        overall_score: seoScore,
        issues_found: issues.length,
        critical_issues: criticalCount,
        warning_issues: warningCount,
        info_issues: infoCount,
        results: auditResult,
        status: "completed",
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      } as never);

    // ========================================
    // Return results
    // ========================================
    const result: AnalysisResult = {
      siteId,
      domain,
      seoScore,
      pagesAnalyzed,
      issues: {
        critical: criticalCount,
        warnings: warningCount,
        passed: passedCount,
      },
      keywords,
      contentIdeas,
      quickWins,
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

