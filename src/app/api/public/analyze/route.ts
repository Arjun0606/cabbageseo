/**
 * Public Analysis API - No Authentication Required
 * 
 * This is the free tier entry point:
 * - User enters URL
 * - We crawl and analyze
 * - Return SEO + AIO scores with breakdown
 * - Encourage signup for full features
 * 
 * Rate limited by IP to prevent abuse
 */

import { NextRequest, NextResponse } from "next/server";
import { SiteCrawler } from "@/lib/crawler/site-crawler";
import { TechnicalAuditEngine } from "@/lib/crawler/technical-audit";
import { createAIOAnalyzer } from "@/lib/aio";

// Simple in-memory rate limiting (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // 5 requests per hour per IP
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || record.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  
  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count };
}

// ============================================
// AIO OPTIMIZATION FACTORS
// Based on research into Perplexity, ChatGPT, and Google AIO
// ============================================

interface AIOFactors {
  // Structure for AI extraction
  hasDirectAnswers: boolean;        // Content starts with clear, direct answers
  hasBulletedLists: boolean;        // Easy to extract key points
  hasNumberedSteps: boolean;        // Step-by-step instructions
  hasTableData: boolean;            // Structured data in tables
  hasFAQSection: boolean;           // Q&A format content
  
  // Entity & Authority signals
  hasAuthorInfo: boolean;           // Author name, credentials
  hasExpertQuotes: boolean;         // Quotes from experts/sources
  hasCitations: boolean;            // Links to authoritative sources
  hasPublishDate: boolean;          // Content freshness indicator
  hasUpdateDate: boolean;           // Shows content is maintained
  
  // Technical signals
  hasSchemaMarkup: boolean;         // Structured data (FAQ, HowTo, Article)
  hasFAQSchema: boolean;            // Specific FAQ schema
  hasHowToSchema: boolean;          // Step-by-step schema
  hasArticleSchema: boolean;        // Article/NewsArticle schema
  
  // Content quality signals
  hasDefinitions: boolean;          // "X is..." or "X refers to..." patterns
  hasComparisons: boolean;          // Comparison tables or "vs" content
  hasStatistics: boolean;           // Numbers, percentages, data points
  hasOriginalInsights: boolean;     // Unique perspectives, research
  
  // Quotability factors
  hasQuotableSnippets: boolean;     // Self-contained, citation-worthy sentences
  avgSentenceLength: number;        // Shorter sentences are more quotable
  hasKeyTakeaways: boolean;         // Summary section or key points
}

function analyzeAIOFactors(html: string, text: string): AIOFactors {
  const lowerText = text.toLowerCase();
  const lowerHtml = html.toLowerCase();
  
  return {
    // Structure checks
    hasDirectAnswers: /^[A-Z][^.!?]*(?:is|are|refers to|means|involves)[^.!?]*[.!?]/m.test(text),
    hasBulletedLists: /<ul[^>]*>[\s\S]*?<\/ul>/i.test(html),
    hasNumberedSteps: /<ol[^>]*>[\s\S]*?<\/ol>/i.test(html) || /step\s*\d|^\d+\./im.test(text),
    hasTableData: /<table[^>]*>[\s\S]*?<\/table>/i.test(html),
    hasFAQSection: /faq|frequently\s+asked|common\s+questions/i.test(text),
    
    // Authority signals
    hasAuthorInfo: /author|written\s+by|by\s+[A-Z][a-z]+\s+[A-Z][a-z]+/i.test(html),
    hasExpertQuotes: /"[^"]{20,}"[^"]*(?:said|says|according\s+to|notes)/i.test(text),
    hasCitations: /\[[0-9]+\]|\(source\)|according\s+to\s+[A-Z]/i.test(text),
    hasPublishDate: /publish(?:ed)?[\s:-]+\d{4}|date[\s:-]+\d{4}/i.test(lowerHtml),
    hasUpdateDate: /updat(?:ed)?[\s:-]+\d{4}|last\s+(?:updated|modified)/i.test(lowerHtml),
    
    // Schema markup
    hasSchemaMarkup: /application\/ld\+json/i.test(html),
    hasFAQSchema: /FAQPage/i.test(html),
    hasHowToSchema: /HowTo/i.test(html),
    hasArticleSchema: /Article|NewsArticle|BlogPosting/i.test(html),
    
    // Content quality
    hasDefinitions: /(?:is\s+(?:a|an|the)|refers\s+to|means|defined\s+as)/i.test(text),
    hasComparisons: /\bvs\.?\b|versus|compared\s+to|difference\s+between/i.test(text),
    hasStatistics: /\d+(?:\.\d+)?%|\d+\s+(?:million|billion|thousand)/i.test(text),
    hasOriginalInsights: /our\s+(?:research|analysis|findings)|we\s+(?:found|discovered|analyzed)/i.test(lowerText),
    
    // Quotability
    hasQuotableSnippets: text.split(/[.!?]/).filter(s => s.length > 20 && s.length < 150).length > 3,
    avgSentenceLength: text.split(/[.!?]/).reduce((sum, s) => sum + s.split(/\s+/).length, 0) / Math.max(1, text.split(/[.!?]/).length),
    hasKeyTakeaways: /key\s+takeaways?|summary|in\s+(?:summary|conclusion)|tl;?dr/i.test(lowerText),
  };
}

function calculateAIOBreakdown(factors: AIOFactors) {
  const breakdown = {
    structureScore: 0,
    authorityScore: 0,
    schemaScore: 0,
    contentQualityScore: 0,
    quotabilityScore: 0,
  };
  
  // Structure (0-20)
  if (factors.hasDirectAnswers) breakdown.structureScore += 5;
  if (factors.hasBulletedLists) breakdown.structureScore += 4;
  if (factors.hasNumberedSteps) breakdown.structureScore += 4;
  if (factors.hasTableData) breakdown.structureScore += 3;
  if (factors.hasFAQSection) breakdown.structureScore += 4;
  
  // Authority (0-20)
  if (factors.hasAuthorInfo) breakdown.authorityScore += 5;
  if (factors.hasExpertQuotes) breakdown.authorityScore += 4;
  if (factors.hasCitations) breakdown.authorityScore += 5;
  if (factors.hasPublishDate) breakdown.authorityScore += 3;
  if (factors.hasUpdateDate) breakdown.authorityScore += 3;
  
  // Schema (0-20)
  if (factors.hasSchemaMarkup) breakdown.schemaScore += 5;
  if (factors.hasFAQSchema) breakdown.schemaScore += 5;
  if (factors.hasHowToSchema) breakdown.schemaScore += 5;
  if (factors.hasArticleSchema) breakdown.schemaScore += 5;
  
  // Content Quality (0-20)
  if (factors.hasDefinitions) breakdown.contentQualityScore += 5;
  if (factors.hasComparisons) breakdown.contentQualityScore += 4;
  if (factors.hasStatistics) breakdown.contentQualityScore += 5;
  if (factors.hasOriginalInsights) breakdown.contentQualityScore += 6;
  
  // Quotability (0-20)
  if (factors.hasQuotableSnippets) breakdown.quotabilityScore += 6;
  if (factors.avgSentenceLength < 25) breakdown.quotabilityScore += 5;
  if (factors.avgSentenceLength < 20) breakdown.quotabilityScore += 3;
  if (factors.hasKeyTakeaways) breakdown.quotabilityScore += 6;
  
  return breakdown;
}

interface SEOBreakdown {
  technicalScore: number;
  contentScore: number;
  metaScore: number;
  performanceScore: number;
  accessibilityScore: number;
}

function calculateSEOBreakdown(issues: { severity: string; category: string }[]): SEOBreakdown {
  const breakdown: SEOBreakdown = {
    technicalScore: 20,
    contentScore: 20,
    metaScore: 20,
    performanceScore: 20,
    accessibilityScore: 20,
  };
  
  // Map categories to score types
  // Categories: meta, headings, images, links, content, technical, performance, schema
  
  for (const issue of issues) {
    const penalty = issue.severity === "critical" ? 5 : issue.severity === "warning" ? 3 : 1;
    
    switch (issue.category) {
      case "technical":
      case "links":
      case "schema":
        breakdown.technicalScore = Math.max(0, breakdown.technicalScore - penalty);
        break;
      case "content":
      case "headings":
        breakdown.contentScore = Math.max(0, breakdown.contentScore - penalty);
        break;
      case "meta":
        breakdown.metaScore = Math.max(0, breakdown.metaScore - penalty);
        break;
      case "images":
        breakdown.accessibilityScore = Math.max(0, breakdown.accessibilityScore - penalty);
        break;
      case "performance":
      default:
        breakdown.performanceScore = Math.max(0, breakdown.performanceScore - penalty);
        break;
    }
  }
  
  return breakdown;
}

export async function POST(request: NextRequest) {
  // Get client IP for rate limiting
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || 
             request.headers.get("x-real-ip") || 
             "unknown";
  
  const rateLimit = checkRateLimit(ip);
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { 
        error: "Rate limit exceeded. Please try again in an hour or sign up for unlimited access.",
        signupUrl: "/signup",
      },
      { 
        status: 429,
        headers: {
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Date.now() + RATE_WINDOW),
        },
      }
    );
  }

  try {
    const body = await request.json();
    let { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Normalize URL
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Crawl the page (just the homepage for free tier)
    // Enable raw content for AIO analysis
    const crawler = new SiteCrawler({
      maxPages: 1,
      respectRobotsTxt: true,
      timeout: 15000,
      includeRawContent: true, // Required for AIO analysis
    });

    const crawlResult = await crawler.crawl(url);
    
    if (crawlResult.pages.length === 0) {
      return NextResponse.json(
        { error: "Could not access the website. Please check the URL and try again." },
        { status: 400 }
      );
    }

    const page = crawlResult.pages[0];

    // Run technical SEO audit
    const auditEngine = new TechnicalAuditEngine();
    const auditResult = auditEngine.audit(crawlResult);
    
    // Calculate SEO breakdown
    const seoBreakdown = calculateSEOBreakdown(
      auditResult.issues.map(i => ({ severity: i.severity, category: i.category }))
    );
    const seoScore = Object.values(seoBreakdown).reduce((a, b) => a + b, 0);

    // Analyze AIO factors using real HTML and text content
    const aioFactors = analyzeAIOFactors(page.rawHtml || "", page.textContent || "");
    const aioBreakdown = calculateAIOBreakdown(aioFactors);
    const aioScore = Object.values(aioBreakdown).reduce((a, b) => a + b, 0);

    // Generate specific recommendations
    const seoRecommendations: string[] = [];
    const aioRecommendations: string[] = [];

    // SEO recommendations
    if (seoBreakdown.metaScore < 15) {
      seoRecommendations.push("Add or improve your meta title and description for better click-through rates");
    }
    if (seoBreakdown.contentScore < 15) {
      seoRecommendations.push("Ensure each page has a unique, descriptive H1 heading");
    }
    if (seoBreakdown.technicalScore < 15) {
      seoRecommendations.push("Fix broken links and optimize page loading speed");
    }
    if (!page.schemaMarkup?.length) {
      seoRecommendations.push("Add structured data (Schema.org) to help search engines understand your content");
    }

    // AIO recommendations - Perplexity & ChatGPT specific
    if (!aioFactors.hasDirectAnswers) {
      aioRecommendations.push("Start content with direct, factual answers - AI models prefer extractable statements");
    }
    if (!aioFactors.hasFAQSection) {
      aioRecommendations.push("Add an FAQ section - Perplexity and ChatGPT frequently cite Q&A formatted content");
    }
    if (!aioFactors.hasCitations) {
      aioRecommendations.push("Include citations and sources - builds authority for AI citation");
    }
    if (!aioFactors.hasAuthorInfo) {
      aioRecommendations.push("Add author credentials - AI models favor content with clear expertise signals");
    }
    if (!aioFactors.hasFAQSchema) {
      aioRecommendations.push("Implement FAQ Schema markup - significantly increases AI visibility");
    }
    if (!aioFactors.hasDefinitions) {
      aioRecommendations.push("Include clear definitions ('X is...' or 'X refers to...') - AI models love to cite these");
    }
    if (!aioFactors.hasQuotableSnippets) {
      aioRecommendations.push("Write quotable sentences (20-100 words) that can stand alone as citations");
    }
    if (!aioFactors.hasKeyTakeaways) {
      aioRecommendations.push("Add a 'Key Takeaways' or summary section at the top for quick AI extraction");
    }
    if (aioFactors.avgSentenceLength > 25) {
      aioRecommendations.push("Shorten sentences - AI models prefer concise, extractable content");
    }
    if (!aioFactors.hasStatistics) {
      aioRecommendations.push("Include specific statistics and data points - makes content more citable");
    }

    // Platform-specific scores
    const platformScores = {
      googleAIO: Math.min(100, Math.round(
        (aioBreakdown.structureScore * 2) + 
        (aioBreakdown.schemaScore * 2) + 
        (seoScore * 0.3)
      )),
      perplexity: Math.min(100, Math.round(
        (aioBreakdown.quotabilityScore * 2) + 
        (aioBreakdown.authorityScore * 2) + 
        (aioBreakdown.contentQualityScore * 1.5)
      )),
      chatGPT: Math.min(100, Math.round(
        (aioBreakdown.structureScore * 1.5) + 
        (aioBreakdown.contentQualityScore * 2) + 
        (aioBreakdown.quotabilityScore * 1.5)
      )),
      claude: Math.min(100, Math.round(
        (aioBreakdown.contentQualityScore * 2) + 
        (aioBreakdown.authorityScore * 1.5) + 
        (aioBreakdown.structureScore * 1.5)
      )),
    };

    return NextResponse.json({
      success: true,
      data: {
        url: page.url,
        title: page.title || "Untitled",
        
        // Overall scores
        seoScore,
        aioScore,
        combinedScore: Math.round((seoScore + aioScore) / 2),
        
        // SEO breakdown
        seo: {
          score: seoScore,
          breakdown: seoBreakdown,
          issueCount: {
            critical: auditResult.issues.filter(i => i.severity === "critical").length,
            warning: auditResult.issues.filter(i => i.severity === "warning").length,
            info: auditResult.issues.filter(i => i.severity === "info").length,
          },
          recommendations: seoRecommendations.slice(0, 5),
        },
        
        // AIO breakdown
        aio: {
          score: aioScore,
          breakdown: aioBreakdown,
          factors: {
            hasDirectAnswers: aioFactors.hasDirectAnswers,
            hasFAQSection: aioFactors.hasFAQSection,
            hasSchema: aioFactors.hasSchemaMarkup,
            hasAuthorInfo: aioFactors.hasAuthorInfo,
            hasCitations: aioFactors.hasCitations,
            hasKeyTakeaways: aioFactors.hasKeyTakeaways,
            avgSentenceLength: Math.round(aioFactors.avgSentenceLength),
          },
          platformScores,
          recommendations: aioRecommendations.slice(0, 5),
        },
        
        // Page info
        pageInfo: {
          wordCount: page.wordCount || 0,
          hasH1: !!page.h1?.length,
          hasMetaDescription: !!page.metaDescription,
          schemaTypes: (page.schemaMarkup || []).map((s: { "@type"?: string }) => s["@type"]).filter(Boolean),
          loadTime: `${page.loadTimeMs}ms`,
        },
        
        // CTA
        cta: {
          message: aioScore < 50 || seoScore < 50 
            ? "Your site needs optimization! Get full analysis + auto-fix with CabbageSEO."
            : "Good start! Unlock advanced insights and autopilot optimization.",
          signupUrl: "/signup",
          features: [
            "Full site audit (all pages)",
            "Keyword research & tracking",
            "AI content generation",
            "Auto-fix issues",
            "Publish to WordPress/Webflow",
            "Continuous monitoring",
          ],
        },
      },
      rateLimit: {
        remaining: rateLimit.remaining,
        resetIn: "1 hour",
      },
    }, {
      headers: {
        "X-RateLimit-Remaining": String(rateLimit.remaining),
      },
    });

  } catch (error) {
    console.error("[Public Analyze] Error:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Analysis failed. Please try again.",
        signupUrl: "/signup",
      },
      { status: 500 }
    );
  }
}

