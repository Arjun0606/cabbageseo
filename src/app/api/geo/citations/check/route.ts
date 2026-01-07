/**
 * /api/geo/citations/check - REAL Citation Checking
 * 
 * NO MOCK DATA. NO SIMULATIONS.
 * Uses actual AI platform APIs to detect citations.
 * 
 * Supported platforms:
 * - Perplexity: Real API with citation detection ✅
 * - Google AI (Gemini): With grounding feature ✅
 * - ChatGPT: Knowledge check (no web access) ⚠️
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
  const name = domain.split(".")[0];
  const cleanName = name.charAt(0).toUpperCase() + name.slice(1);
  
  // Base queries (always included)
  const baseQueries = [
    `What is ${cleanName} and what do they do?`,
    `Tell me about ${domain}`,
    `What are the best alternatives to ${cleanName}?`,
  ];
  
  // Category-specific queries
  const categoryQueries = category && CATEGORY_QUERIES[category.toLowerCase()] 
    ? CATEGORY_QUERIES[category.toLowerCase()] 
    : [];
  
  // Determine query count by plan
  let maxQueries = 3; // Free
  if (plan === "starter") maxQueries = 10;
  if (plan === "pro") maxQueries = 20;
  
  // Combine: custom queries first, then base, then category
  const allQueries = [
    ...customQueries.slice(0, plan === "pro" ? 100 : 5), // Custom queries (limited for starter)
    ...baseQueries,
    ...categoryQueries,
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

// ============================================
// PERPLEXITY - Real API with Citations
// ============================================
async function checkPerplexity(domain: string, queries: string[]): Promise<CheckResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  const query = queries[0];
  
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
    const citedInCitations = citations.some((c: string) => 
      c.toLowerCase().includes(domainLower)
    );
    const citedInContent = content.toLowerCase().includes(domainLower);
    const cited = citedInCitations || citedInContent;
    
    return {
      platform: "perplexity",
      cited,
      query,
      snippet: cited ? content.slice(0, 300) : undefined,
      confidence: citedInCitations ? 0.95 : citedInContent ? 0.75 : 0,
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
async function checkGoogleAI(domain: string, queries: string[]): Promise<CheckResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  const query = queries[1];
  
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
              google_search_retrieval: {
                dynamic_retrieval_config: {
                  mode: "MODE_DYNAMIC",
                  dynamic_threshold: 0.3
                }
              }
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          }
        }),
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
    const citedInGrounding = groundingChunks.some((chunk: { web?: { uri?: string } }) => 
      chunk.web?.uri?.toLowerCase().includes(domainLower)
    );
    const citedInContent = content.toLowerCase().includes(domainLower);
    const cited = citedInGrounding || citedInContent;

    return {
      platform: "google_aio",
      cited,
      query,
      snippet: cited ? content.slice(0, 300) : undefined,
      confidence: citedInGrounding ? 0.9 : citedInContent ? 0.7 : 0,
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
async function checkChatGPT(domain: string, queries: string[]): Promise<CheckResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const query = queries[2];
  
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
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant. If you know about a website or company, describe what you know. If you don't know, say so clearly."
          },
          { role: "user", content: query }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
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

    return {
      platform: "chatgpt",
      cited,
      query,
      snippet: cited ? content.slice(0, 300) : undefined,
      // Lower confidence for ChatGPT since it's from training data, not live web
      confidence: cited ? 0.6 : 0,
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
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { siteId, domain } = body;

    if (!domain) {
      return NextResponse.json({ error: "Domain required" }, { status: 400 });
    }

    // Clean domain
    let cleanDomain = domain.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");

    const db = getDbClient() || supabase;
    
    // Get user's plan and site data for smart query generation
    let plan = "free";
    let category: string | null = null;
    let customQueries: string[] = [];
    
    // Fetch user's organization and plan
    const { data: userData } = await db
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();
    
    if (userData?.organization_id) {
      const { data: orgData } = await db
        .from("organizations")
        .select("plan")
        .eq("id", userData.organization_id)
        .maybeSingle();
      
      if (orgData?.plan) {
        plan = orgData.plan;
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
    const queries = generateQueries(cleanDomain, category, customQueries, plan);
    
    console.log(`[Citation Check] Plan: ${plan}, Category: ${category}, Queries: ${queries.length}`);

    // Run ALL checks in parallel - real API calls only
    const [perplexityResult, googleResult, chatgptResult] = await Promise.all([
      checkPerplexity(cleanDomain, queries),
      checkGoogleAI(cleanDomain, queries),
      checkChatGPT(cleanDomain, queries),
    ]);

    const results = [perplexityResult, googleResult, chatgptResult];
    
    // Count how many APIs were actually called
    const apisCalled = results.filter(r => r.apiCalled).length;
    const citedCount = results.filter(r => r.cited).length;

    // If tracking a site, save citations to database
    if (siteId && userData?.organization_id) {
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

      if (site && site.organization_id === userData.organization_id) {
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
                await db.from("citations").insert({
                  site_id: siteId,
                  platform: result.platform,
                  query: result.query,
                  snippet: result.snippet,
                  confidence: result.confidence >= 0.8 ? "high" : result.confidence >= 0.5 ? "medium" : "low",
                  cited_at: new Date().toISOString(),
                });
                newCitationsCount++;
              }
            }
          }

          // Update site stats
          await db
            .from("sites")
            .update({
              last_checked_at: new Date().toISOString(),
              total_citations: (site.total_citations || 0) + newCitationsCount,
              citations_this_week: (site.citations_this_week || 0) + newCitationsCount,
            })
            .eq("id", siteId);

          // Update usage count
          const period = new Date().toISOString().slice(0, 7);
          const { data: existingUsage } = await db
            .from("usage")
            .select("checks_used")
            .eq("organization_id", userData.organization_id)
            .eq("period", period)
            .maybeSingle();

          if (existingUsage) {
            await db
              .from("usage")
              .update({ checks_used: (existingUsage.checks_used || 0) + 1 })
              .eq("organization_id", userData.organization_id)
              .eq("period", period);
          } else {
            await db.from("usage").insert({
              organization_id: userData.organization_id,
              period,
              checks_used: 1,
            });
          }
        }
      }
    }

    // Return enriched response with query info
    return NextResponse.json({
      success: true,
      results: results.map(r => ({
        platform: r.platform,
        cited: r.cited,
        query: r.query,
        snippet: r.snippet,
        confidence: r.confidence,
        error: r.error,
      })),
      summary: {
        apisCalled,
        apisConfigured: apisCalled,
        apisMissing: 3 - apisCalled,
        citedCount,
        checkedAt: new Date().toISOString(),
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
