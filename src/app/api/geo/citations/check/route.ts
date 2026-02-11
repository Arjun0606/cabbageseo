/**
 * /api/geo/citations/check - AI REVENUE INTELLIGENCE
 * 
 * NO MOCK DATA. NO SIMULATIONS.
 * Uses actual AI platform APIs to detect WHO AI RECOMMENDS.
 * 
 * This is the core of the revenue intelligence engine:
 * - Who is AI recommending?
 * - How much money are you losing?
 * - What do you need to fix?
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  calculateBuyerIntent,
} from "@/lib/ai-revenue";
import {
  extractSources,
  getTrustSourceInfo,
  TRUST_SOURCES,
} from "@/lib/ai-revenue/sources";
import {
  canRunManualCheck,
  canAccessProduct,
  getAutoGenPerScan,
} from "@/lib/billing/citation-plans";
import { getUser } from "@/lib/api/get-user";
import { logRecommendations, extractCitationRecommendations } from "@/lib/geo/recommendation-logger";
import { citationCheckLimiter } from "@/lib/api/rate-limit";
import { timingSafeEqual } from "crypto";

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function getDbClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

// Category-specific query templates
const CATEGORY_QUERIES: Record<string, string[]> = {
  productivity: [
    "What is the best productivity app?",
    "Best note-taking apps for teams",
    "Top productivity tools for remote work",
    "Best apps for organizing projects",
    "What tools do startups use for documentation?",
  ],
  crm: [
    "What is the best CRM software?",
    "Best CRM for small businesses",
    "Top sales management tools",
    "Salesforce alternatives",
    "Best free CRM tools",
  ],
  ecommerce: [
    "Best ecommerce platforms",
    "Shopify alternatives",
    "How to start an online store",
    "Best tools for selling online",
    "Top ecommerce solutions for small business",
  ],
  marketing: [
    "Best marketing automation tools",
    "Top email marketing platforms",
    "Best SEO tools",
    "Social media management tools",
    "Best analytics tools for marketing",
  ],
  design: [
    "Best design tools for teams",
    "Figma alternatives",
    "Top UI/UX design software",
    "Best prototyping tools",
    "Collaborative design platforms",
  ],
  development: [
    "Best developer tools",
    "Top code editors",
    "Best hosting platforms for developers",
    "CI/CD tools comparison",
    "Best API management tools",
  ],
  analytics: [
    "Best analytics platforms",
    "Google Analytics alternatives",
    "Top business intelligence tools",
    "Best data visualization software",
    "Website analytics tools",
  ],
  communication: [
    "Best team communication tools",
    "Slack alternatives",
    "Top video conferencing software",
    "Best collaboration platforms",
    "Team chat apps comparison",
  ],
  finance: [
    "Best accounting software",
    "Top invoicing tools",
    "Best expense tracking apps",
    "Payroll software for small business",
    "Financial planning tools",
  ],
  education: [
    "Best online learning platforms",
    "Top educational tools",
    "E-learning software comparison",
    "Best LMS platforms",
    "Online course creation tools",
  ],
};

// Generate queries based on domain, category, and plan
function generateQueries(
  domain: string,
  category: string | null,
  customQueries: string[],
  plan: string
): string[] {
  const name = domain.replace(/\.(com|io|co|ai|app|dev|org|net|me|sh|cc|so|biz|xyz|tech|tools|software|cloud|pro|gg|fm|tv|to|ly|co\.uk|com\.au)$/, "").split(".").pop() || domain.split(".")[0];
  const cleanName = name.charAt(0).toUpperCase() + name.slice(1);

  // Base queries (always included — simulate real buyer questions)
  const baseQueries = [
    `What is ${cleanName} and what do they do?`,
    `Tell me about ${domain}`,
    `What are the best alternatives to ${cleanName}?`,
  ];

  // Expanded intent queries for paid plans (work for any domain/category)
  const intentQueries = [
    `Best alternatives to ${cleanName} ${new Date().getFullYear()}`,
    `${cleanName} vs competitors comparison`,
    `Is ${cleanName} any good?`,
    `Products similar to ${cleanName}`,
    `${cleanName} reviews and pricing`,
    `Should I use ${cleanName}?`,
    `${cleanName} pros and cons`,
    `Who competes with ${cleanName}?`,
    `Top tools like ${cleanName}`,
    `What do people think about ${cleanName}?`,
    `How does ${cleanName} compare to other options?`,
    `${cleanName} features overview`,
    `Recommend something like ${domain}`,
    `Why do people choose ${cleanName}?`,
    `${cleanName} for small businesses`,
  ];

  // Category-specific queries
  const categoryQueries = category && CATEGORY_QUERIES[category.toLowerCase()]
    ? CATEGORY_QUERIES[category.toLowerCase()]
    : [];

  // Determine query count by plan (must match queriesPerCheck in citation-plans.ts)
  let maxQueries = 3; // Free
  if (plan === "scout") maxQueries = 10;
  if (plan === "command") maxQueries = 20;
  if (plan === "dominate") maxQueries = 30;

  // Combine: custom queries first, then base, then category, then intent
  const allQueries = [
    ...customQueries.slice(0, (plan === "command" || plan === "dominate") ? 100 : 5),
    ...baseQueries,
    ...categoryQueries,
    ...intentQueries,
  ];

  // Return unique queries up to the plan limit
  return [...new Set(allQueries)].slice(0, maxQueries);
}

interface CheckResult {
  platform: string;
  cited: boolean;
  query: string;
  snippet?: string;
  confidence: number;
  error?: string;
  apiCalled: boolean;
}

interface TrustSourcePresence {
  source: string;
  domain: string;
  isListed: boolean;
  profileUrl?: string;
  error?: string;
}

// ============================================
// TRUST SOURCE VERIFICATION
// Uses Perplexity to check if domain is listed on G2, Capterra, etc.
// ============================================
async function checkTrustSourcePresence(
  domain: string,
  sourcesToCheck: string[] = ["g2.com", "capterra.com", "producthunt.com"]
): Promise<TrustSourcePresence[]> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    return sourcesToCheck.map(source => ({
      source,
      domain: source,
      isListed: false,
      error: "API not configured",
    }));
  }

  const results: TrustSourcePresence[] = [];

  for (const source of sourcesToCheck) {
    try {
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            { 
              role: "system", 
              content: "Answer with yes or no, then provide the URL if available. Be concise." 
            },
            { 
              role: "user", 
              content: `Is ${domain} listed on ${source}? If yes, what's the profile URL?` 
            },
          ],
          return_citations: true,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        results.push({
          source,
          domain: source,
          isListed: false,
          error: `API error: ${response.status}`,
        });
        continue;
      }

      const data = await response.json();
      const content = (data.choices?.[0]?.message?.content || "").toLowerCase();
      const citations = data.citations || [];
      
      // Check if answer indicates listing
      const isListed = content.includes("yes") && 
                       !content.includes("no") && 
                       !content.includes("not listed") &&
                       !content.includes("not found");
      
      // Try to extract profile URL
      let profileUrl: string | undefined;
      const sourceBase = source.replace(".com", "").replace(".net", "");
      
      // Check citations for direct link
      const directLink = citations.find((c: string) => 
        c.toLowerCase().includes(sourceBase) && 
        c.toLowerCase().includes(domain.toLowerCase().replace("www.", "").split(".")[0])
      );
      
      if (directLink) {
        profileUrl = directLink;
      }
      
      results.push({
        source,
        domain: source,
        isListed,
        profileUrl,
      });

      // Rate limit
      await new Promise(r => setTimeout(r, 200));
      
    } catch (error) {
      results.push({
        source,
        domain: source,
        isListed: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

// ============================================
// PERPLEXITY - Real API with Citations
// ============================================
async function checkPerplexity(domain: string, query: string): Promise<CheckResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    return {
      platform: "perplexity",
      cited: false,
      query,
      confidence: 0,
      error: "Perplexity API key not configured",
      apiCalled: false,
    };
  }

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant. Always cite your sources when possible."
          },
          { role: "user", content: query }
        ],
        return_citations: true,
        return_related_questions: false,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error:", response.status, errorText);
      return {
        platform: "perplexity",
        cited: false,
        query,
        confidence: 0,
        error: `API error: ${response.status}`,
        apiCalled: true,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];
    
    // Check if domain appears in citations or content
    const domainLower = domain.toLowerCase();
    const contentLower = content.toLowerCase();
    const citedInCitations = citations.some((c: string) => {
      try {
        const h = new URL(c).hostname.replace(/^www\./, "").toLowerCase();
        return h === domainLower || h.endsWith("." + domainLower);
      } catch {
        return c.toLowerCase().includes(domainLower);
      }
    });
    const citedInContent = contentLower.includes(domainLower);
    const cited = citedInCitations || citedInContent;

    // Granular confidence based on signal strength
    let confidence = 0;
    if (citedInCitations) {
      // Direct citation link — high base confidence
      const citationCount = citations.filter((c: string) => c.toLowerCase().includes(domainLower)).length;
      confidence = 0.88 + Math.min(0.09, citationCount * 0.03); // 0.88-0.97
      // Bonus if also mentioned in text body
      if (citedInContent) confidence = Math.min(0.98, confidence + 0.02);
    } else if (citedInContent) {
      // Mentioned in text but not in citation links
      const mentionCount = contentLower.split(domainLower).length - 1;
      const earlyMention = contentLower.indexOf(domainLower) < 500;
      confidence = 0.62 + Math.min(0.14, mentionCount * 0.04); // 0.62-0.76
      if (earlyMention) confidence += 0.03; // mentioned early = more prominent
    }

    return {
      platform: "perplexity",
      cited,
      query,
      snippet: cited ? content.slice(0, 300) : undefined,
      confidence: Math.round(confidence * 100) / 100,
      apiCalled: true,
    };

  } catch (error) {
    console.error("Perplexity check error:", error);
    return {
      platform: "perplexity",
      cited: false,
      query,
      confidence: 0,
      error: error instanceof Error ? error.message : "Unknown error",
      apiCalled: true,
    };
  }
}

// ============================================
// GOOGLE AI (Gemini) - With Search Grounding
// ============================================
async function checkGoogleAI(domain: string, query: string): Promise<CheckResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return {
      platform: "google_aio",
      cited: false,
      query,
      confidence: 0,
      error: "Google AI API key not configured",
      apiCalled: false,
    };
  }

  try {
    // Use Gemini with Google Search grounding
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: query }]
            }
          ],
          tools: [
            {
              google_search: {}
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          }
        }),
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google AI API error:", response.status, errorText);
      return {
        platform: "google_aio",
        cited: false,
        query,
        confidence: 0,
        error: `API error: ${response.status}`,
        apiCalled: true,
      };
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const groundingMetadata = data.candidates?.[0]?.groundingMetadata;
    const searchEntryPoint = groundingMetadata?.searchEntryPoint;
    const groundingChunks = groundingMetadata?.groundingChunks || [];
    
    // Check grounding chunks for domain
    const domainLower = domain.toLowerCase();
    const contentLower = content.toLowerCase();
    const citedInGrounding = groundingChunks.some((chunk: { web?: { uri?: string } }) => {
      try {
        const h = new URL(chunk.web?.uri || "").hostname.replace(/^www\./, "").toLowerCase();
        return h === domainLower || h.endsWith("." + domainLower);
      } catch {
        return (chunk.web?.uri || "").toLowerCase().includes(domainLower);
      }
    });
    const citedInContent = contentLower.includes(domainLower);
    const cited = citedInGrounding || citedInContent;

    // Granular confidence based on grounding evidence
    let confidence = 0;
    if (citedInGrounding) {
      const groundingCount = groundingChunks.filter(
        (chunk: { web?: { uri?: string } }) => {
          try {
            const h = new URL(chunk.web?.uri || "").hostname.replace(/^www\./, "").toLowerCase();
            return h === domainLower || h.endsWith("." + domainLower);
          } catch { return false; }
        }
      ).length;
      confidence = 0.82 + Math.min(0.13, groundingCount * 0.04); // 0.82-0.95
      if (citedInContent) confidence = Math.min(0.97, confidence + 0.02);
    } else if (citedInContent) {
      const mentionCount = contentLower.split(domainLower).length - 1;
      confidence = 0.58 + Math.min(0.17, mentionCount * 0.05); // 0.58-0.75
    }

    return {
      platform: "google_aio",
      cited,
      query,
      snippet: cited ? content.slice(0, 300) : undefined,
      confidence: Math.round(confidence * 100) / 100,
      apiCalled: true,
    };

  } catch (error) {
    console.error("Google AI check error:", error);
    return {
      platform: "google_aio",
      cited: false,
      query,
      confidence: 0,
      error: error instanceof Error ? error.message : "Unknown error",
      apiCalled: true,
    };
  }
}

// ============================================
// CHATGPT - Knowledge Check (No Web Access)
// ============================================
async function checkChatGPT(domain: string, query: string): Promise<CheckResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return {
      platform: "chatgpt",
      cited: false,
      query,
      confidence: 0,
      error: "OpenAI API key not configured",
      apiCalled: false,
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant. If you know about a website or company, describe what you know. If you don't know, say so clearly."
          },
          { role: "user", content: query }
        ],
        max_completion_tokens: 4000,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      return {
        platform: "chatgpt",
        cited: false,
        query,
        confidence: 0,
        error: `API error: ${response.status}`,
        apiCalled: true,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Check if domain is mentioned and response shows knowledge
    const domainLower = domain.toLowerCase();
    const domainMentioned = content.toLowerCase().includes(domainLower);
    
    // Check for "I don't know" patterns
    const unknownPatterns = [
      "i don't have information",
      "i'm not familiar",
      "i don't know",
      "i couldn't find",
      "no information available",
      "not aware of",
    ];
    const isUnknown = unknownPatterns.some(p => content.toLowerCase().includes(p));
    
    const cited = domainMentioned && !isUnknown;

    // Granular confidence — lower base for ChatGPT (training data, not live web)
    let confidence = 0;
    if (cited) {
      const contentLower = content.toLowerCase();
      const mentionCount = contentLower.split(domainLower).length - 1;
      const earlyMention = contentLower.indexOf(domainLower) < 300;
      confidence = 0.42 + Math.min(0.22, mentionCount * 0.06); // 0.42-0.64
      if (earlyMention) confidence += 0.04; // mentioned early = more prominent
      if (mentionCount >= 3) confidence += 0.03; // heavily referenced
    }

    return {
      platform: "chatgpt",
      cited,
      query,
      snippet: cited ? content.slice(0, 300) : undefined,
      confidence: Math.round(confidence * 100) / 100,
      apiCalled: true,
    };

  } catch (error) {
    console.error("ChatGPT check error:", error);
    return {
      platform: "chatgpt",
      cited: false,
      query,
      confidence: 0,
      error: error instanceof Error ? error.message : "Unknown error",
      apiCalled: true,
    };
  }
}

// ============================================
// MAIN HANDLER
// ============================================
export async function POST(request: NextRequest) {
  try {
    // ============================================
    // AUTH: User session OR service role (Inngest)
    // ============================================
    const authHeader = request.headers.get("Authorization");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const isServiceRole =
      !!serviceKey &&
      serviceKey.length >= 32 &&
      !!authHeader &&
      safeCompare(authHeader, `Bearer ${serviceKey}`);

    let currentUser: Awaited<ReturnType<typeof getUser>> = null;
    if (!isServiceRole) {
      currentUser = await getUser();
      if (!currentUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // Rate limit: 10 checks per minute per user (skip for automated jobs)
      const rateLimit = citationCheckLimiter.check(currentUser.id);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: "Too many requests. Please wait a moment.", remaining: 0 },
          { status: 429 },
        );
      }
    }

    const userEmail = currentUser?.email || null;

    const body = await request.json();
    let { siteId, domain } = body;
    const singleQuery: string | undefined = body.query;

    const db = getDbClient();
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Resolve orgId: from user session, or from site record for service role calls
    let orgId = currentUser?.organizationId ?? null;

    if (isServiceRole && siteId) {
      // Service role call (Inngest) — resolve org from site record directly
      const { data: siteRow } = await db
        .from("sites")
        .select("domain, organization_id")
        .eq("id", siteId)
        .maybeSingle();
      if (!siteRow) {
        return NextResponse.json({ error: "Site not found" }, { status: 404 });
      }
      orgId = siteRow.organization_id;
      if (!domain) domain = siteRow.domain;
    } else if (siteId && !domain) {
      // User session — look up domain with org ownership check
      if (!orgId) {
        return NextResponse.json({ error: "No organization found" }, { status: 400 });
      }
      const { data: siteData } = await db
        .from("sites")
        .select("domain")
        .eq("id", siteId)
        .eq("organization_id", orgId)
        .maybeSingle();
      if (siteData?.domain) {
        domain = siteData.domain;
      }
    }

    if (!domain) {
      return NextResponse.json({ error: "Domain required" }, { status: 400 });
    }

    // Clean domain
    let cleanDomain = domain.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");

    // Get user's plan and site data for smart query generation
    let plan = "free";
    let category: string | null = null;
    let customQueries: string[] = [];
    if (orgId) {
      // Fetch org plan from database
      const { data: orgData } = await db
        .from("organizations")
        .select("plan")
        .eq("id", orgId)
        .maybeSingle();

      if (orgData) {
        plan = orgData.plan || "free";
      }

      // ============================================
      // PLAN ENFORCEMENT - CRITICAL (skip for service role)
      // ============================================
      if (!isServiceRole) {
        // Check if free user needs to subscribe (bypass for test accounts)
        if (plan === "free") {
          const access = canAccessProduct(plan, userEmail);
          if (!access.allowed) {
            return NextResponse.json({
              error: access.reason || "A subscription is required.",
              code: "SUBSCRIPTION_REQUIRED",
              upgradeRequired: true,
            }, { status: 403 });
          }
        }

        // Check daily manual check limit for free users
        if (plan === "free" && orgId) {
          const today = new Date().toISOString().split('T')[0];
          const { data: todayUsage } = await db
            .from("usage")
            .select("checks_used")
            .eq("organization_id", orgId)
            .eq("period", today)
            .maybeSingle();

          const checksToday = todayUsage?.checks_used || 0;

          const canCheck = canRunManualCheck(plan, checksToday);
          if (!canCheck.allowed) {
            return NextResponse.json({
              error: canCheck.reason || "Daily limit reached. Upgrade for unlimited checks.",
              code: "PLAN_LIMIT_EXCEEDED",
              upgradeRequired: true,
            }, { status: 403 });
          }
        }
      }

      // If we have a siteId, get the site's category and custom queries
      if (siteId) {
        const { data: siteInfo } = await db
          .from("sites")
          .select("category, custom_queries")
          .eq("id", siteId)
          .maybeSingle();

        if (siteInfo) {
          category = siteInfo.category || null;
          customQueries = Array.isArray(siteInfo.custom_queries)
            ? siteInfo.custom_queries
            : [];
        }
      }
    }
    
    // Generate queries based on plan, category, and custom queries
    const generatedQueries = generateQueries(cleanDomain, category, customQueries, plan);

    // Log check metadata (no PII)
    console.error(`[Citation Check] queries=${generatedQueries.length}${singleQuery ? ' (re-check)' : ''}`);

    // Build check tasks — distribute queries across all 3 AI platforms.
    // Free (3 queries): 1 per platform. Scout (10): 3-4 each. Command (20): 6-7 each. Dominate (30): 10 each.
    const checkTasks: Promise<CheckResult>[] = [];

    if (singleQuery) {
      // Single query re-check: test the same query on all 3 platforms
      checkTasks.push(checkPerplexity(cleanDomain, singleQuery));
      checkTasks.push(checkGoogleAI(cleanDomain, singleQuery));
      checkTasks.push(checkChatGPT(cleanDomain, singleQuery));
    } else {
      // Full scan: round-robin distribute generated queries across platforms
      const platformCheckers = [
        (q: string) => checkPerplexity(cleanDomain, q),
        (q: string) => checkGoogleAI(cleanDomain, q),
        (q: string) => checkChatGPT(cleanDomain, q),
      ];
      for (let i = 0; i < generatedQueries.length; i++) {
        checkTasks.push(platformCheckers[i % 3](generatedQueries[i]));
      }
    }

    // Run ALL checks in parallel (plus trust source presence)
    const [results, trustSourceResults] = await Promise.all([
      Promise.all(checkTasks),
      checkTrustSourcePresence(cleanDomain, ["g2.com", "capterra.com", "producthunt.com", "trustpilot.com"]),
    ]);
    
    // Count how many APIs were actually called
    const apisCalled = results.filter(r => r.apiCalled).length;
    const citedCount = results.filter(r => r.cited).length;
    
    // Trust source presence
    const trustSources = trustSourceResults.filter(t => !t.error);

    // If tracking a site, save citations to database
    if (siteId && orgId) {
      const { data: siteData } = await db
        .from("sites")
        .select("id, organization_id, total_citations, citations_this_week")
        .eq("id", siteId)
        .maybeSingle();
      
      const site = siteData as { 
        id: string; 
        organization_id: string; 
        total_citations: number; 
        citations_this_week: number 
      } | null;

      if (site && site.organization_id === orgId) {
          let newCitationsCount = 0;

          // Save new citations (only from successful API calls)
          for (const result of results) {
            if (result.cited && result.apiCalled && !result.error) {
              // Check if this citation already exists
              const { data: existing } = await db
                .from("citations")
                .select("id")
                .eq("site_id", siteId)
                .eq("platform", result.platform)
                .eq("query", result.query)
                .maybeSingle();

              if (!existing) {
                // Extract which trust sources were mentioned in the AI response
                const mentionedSources = result.snippet ? extractSources(result.snippet) : [];
                const primarySource = mentionedSources.length > 0 ? mentionedSources[0] : null;
                
                await db.from("citations").insert({
                  site_id: siteId,
                  platform: result.platform,
                  query: result.query,
                  snippet: result.snippet,
                  confidence: result.confidence >= 0.8 ? "high" : result.confidence >= 0.5 ? "medium" : "low",
                  cited_at: new Date().toISOString(),
                  source_domain: primarySource, // Track which trust source was involved
                });
                newCitationsCount++;
              }
            }
          }

          // Update site stats + GEO score (exponential moving average)
          const validResults = results.filter(r => r.apiCalled && !r.error);
          const citedResults = results.filter(r => r.cited);
          const newScore = validResults.length > 0 ? Math.round((citedResults.length / validResults.length) * 100) : null;

          // EMA: blend new check with previous score (70% old, 30% new) for stability
          let geoScoreAvg: number | null = null;
          if (newScore !== null) {
            const { data: currentSiteScore } = await db
              .from("sites")
              .select("geo_score_avg")
              .eq("id", siteId)
              .maybeSingle();
            const oldScore = (currentSiteScore as { geo_score_avg?: number } | null)?.geo_score_avg;
            geoScoreAvg = oldScore != null
              ? Math.round(0.7 * oldScore + 0.3 * newScore)
              : newScore; // First check — use raw score
          }

          await db
            .from("sites")
            .update({
              last_checked_at: new Date().toISOString(),
              total_citations: (site.total_citations || 0) + newCitationsCount,
              citations_this_week: (site.citations_this_week || 0) + newCitationsCount,
              ...(geoScoreAvg !== null && { geo_score_avg: geoScoreAvg }),
            })
            .eq("id", siteId);
          
          // Save trust source presence (upsert to avoid duplicates)
          for (const trustResult of trustSources) {
            const sourceName = trustResult.source.replace(".com", "").replace(".net", "");
            const capitalizedName = sourceName.charAt(0).toUpperCase() + sourceName.slice(1);
            
            // Check if listing already exists
            const { data: existingListing } = await db
              .from("source_listings")
              .select("id")
              .eq("site_id", siteId)
              .eq("source_domain", trustResult.source)
              .maybeSingle();
            
            if (existingListing) {
              // Update existing listing
              await db
                .from("source_listings")
                .update({
                  status: trustResult.isListed ? "verified" : "unverified",
                  profile_url: trustResult.profileUrl || null,
                  verified_at: trustResult.isListed ? new Date().toISOString() : null,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", existingListing.id);
            } else {
              // Insert new listing
              await db.from("source_listings").insert({
                site_id: siteId,
                source_domain: trustResult.source,
                source_name: capitalizedName,
                profile_url: trustResult.profileUrl || null,
                status: trustResult.isListed ? "verified" : "unverified",
                verified_at: trustResult.isListed ? new Date().toISOString() : null,
              });
            }
          }

          // Update usage count (only for manual checks, not auto-checks from Inngest)
          const isFreePlan = plan === "free";
          if (isServiceRole) {
            // Skip usage increment for automated Inngest checks
          } else {
          // Use daily period for free tier to track daily limits, monthly for paid
          const period = isFreePlan 
            ? new Date().toISOString().split('T')[0] // Daily for free tier
            : new Date().toISOString().slice(0, 7);  // Monthly for paid tiers
          
          const { data: existingUsage } = await db
            .from("usage")
            .select("checks_used")
            .eq("organization_id", orgId)
            .eq("period", period)
            .maybeSingle();

          if (existingUsage) {
            await db
              .from("usage")
              .update({ checks_used: (existingUsage.checks_used || 0) + 1 })
              .eq("organization_id", orgId)
              .eq("period", period);
          } else {
            await db.from("usage").insert({
              organization_id: orgId,
              period,
              checks_used: 1,
            });
          }
          }
        }
      }

    // Analyze results for visibility gaps
    const competitiveResults = results.map(r => {
      const buyerIntent = calculateBuyerIntent(r.query);

      // Extract sources from AI response
      const sources = r.snippet ? extractSources(r.snippet) : [];
      const trustedSources = sources
        .map(s => getTrustSourceInfo(s))
        .filter((s): s is NonNullable<typeof s> => s !== null);

      return {
        platform: r.platform,
        cited: r.cited,
        query: r.query,
        snippet: r.snippet,
        confidence: r.confidence,
        error: r.error,
        isLoss: !r.cited,
        buyerIntent,
        // Trust sources
        sources: trustedSources.map(s => ({
          domain: s.domain,
          name: s.name,
          trustScore: s.trustScore,
        })),
      };
    });
    
    // Count real query results
    const totalMentions = competitiveResults.filter(r => !r.error).length;
    const yourMentions = competitiveResults.filter(r => r.cited).length;

    // Record visibility snapshot with real query counts
    if (db && siteId && totalMentions > 0) {
      const today = new Date().toISOString().split("T")[0];
      await db
        .from("market_share_snapshots")
        .upsert({
          site_id: siteId,
          market_share: 0, // deprecated — use queries_won/queries_lost instead
          total_queries: totalMentions,
          queries_won: yourMentions,
          queries_lost: totalMentions - yourMentions,
          snapshot_date: today,
        } as never, { onConflict: "site_id,snapshot_date" });

      // Persist full check results to geo_analyses for dashboard persistence
      if (orgId) {
        try {
          await db.from("geo_analyses").insert({
            site_id: siteId,
            organization_id: orgId,
            score: {
              overall: totalMentions > 0 ? Math.round((yourMentions / totalMentions) * 100) : 0,
              queriesWon: yourMentions,
              queriesLost: totalMentions - yourMentions,
              totalQueries: totalMentions,
            },
            queries: competitiveResults
              .filter((r) => r.isLoss && !r.error)
              .map((r) => ({
                query: r.query,
                platform: r.platform,
                snippet: r.snippet,
              })),
            raw_data: competitiveResults,
          } as never);
        } catch (e) {
          console.error("[check] Failed to persist geo_analyses:", e);
        }
      }
    }

    // Collect all sources mentioned across results
    const allSources = [...new Set(competitiveResults.flatMap(r => r.sources.map(s => s.domain)))];
    
    // Find distribution gaps (sources mentioned in queries you're losing)
    const sourcesMentioningLosses = competitiveResults
      .filter(r => r.isLoss && !r.error)
      .flatMap(r => r.sources.map(s => s.name));
    const uniqueLossSources = [...new Set(sourcesMentioningLosses)];

    // Log AI recommendations to data moat (non-blocking, fire-and-forget)
    const recEntries = extractCitationRecommendations(cleanDomain, siteId, results);
    logRecommendations(recEntries);

    // Auto-generate fix pages for lost queries (non-blocking, fire-and-forget)
    // Scale by tier: Scout 2, Command 5, Dominate 10 pages per scan
    const autoGenLimit = getAutoGenPerScan(plan);
    if (siteId && orgId && autoGenLimit > 0) {
      const lostForPages = competitiveResults
        .filter(r => r.isLoss && !r.error)
        .slice(0, autoGenLimit)
        .map(r => ({ query: r.query, platform: r.platform }));

      if (lostForPages.length > 0) {
        const autoGenUrl = process.env.NEXT_PUBLIC_APP_URL
          || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
        fetch(`${autoGenUrl}/api/geo/pages/auto-generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ siteId, organizationId: orgId, lostQueries: lostForPages, maxPages: autoGenLimit }),
        })
          .then(r => r.text()) // Consume response body
          .catch(err => console.error("[auto-gen] fire-and-forget failed:", err));
      }
    }

    // Return enriched response with REVENUE INTELLIGENCE
    return NextResponse.json({
      success: true,
      results: competitiveResults,
      summary: {
        apisCalled,
        apisConfigured: apisCalled,
        apisMissing: 3 - apisCalled,
        citedCount,
        checkedAt: new Date().toISOString(),
      },
      // Visibility intelligence
      revenueIntelligence: {
        totalQueriesChecked: totalMentions,
        queriesWon: yourMentions,
        queriesLost: totalMentions - yourMentions,
        category: category,
      },
      // Distribution intelligence (based on actual check results)
      distributionIntelligence: {
        sourcesFound: allSources.length,
        sourcesInLostQueries: uniqueLossSources,
        trustSourcePresence: trustSources.map(t => ({
          source: t.source,
          isListed: t.isListed,
          profileUrl: t.profileUrl,
        })),
      },
    });

  } catch (error) {
    console.error("[/api/geo/citations/check POST] Error:", error);
    return NextResponse.json({ 
      error: "Server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
