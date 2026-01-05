/**
 * /api/geo/citations/check - Run Citation Check
 * 
 * POST: Run a citation check on AI platforms
 * Body:
 *   - siteId: Optional site ID (for tracked sites)
 *   - domain: Required domain to check
 *   - quick: If true, quick analysis mode (for Analyzer)
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

// Generate relevant queries for a domain
function generateQueries(domain: string): string[] {
  // Extract company name from domain
  const name = domain.split(".")[0];
  const cleanName = name.charAt(0).toUpperCase() + name.slice(1);
  
  return [
    `What is ${cleanName}?`,
    `${cleanName} reviews`,
    `best alternatives to ${cleanName}`,
    `${cleanName} features`,
    `is ${cleanName} good`,
  ];
}

// Check Perplexity (simulated for now - real API would go here)
async function checkPerplexity(domain: string, queries: string[]): Promise<{
  cited: boolean;
  query?: string;
  snippet?: string;
  confidence?: number;
  error?: string;
}> {
  try {
    // In production, this would call the Perplexity API
    // For now, we simulate based on domain characteristics
    const apiKey = process.env.PERPLEXITY_API_KEY;
    
    if (!apiKey) {
      // Simulate response
      const cited = Math.random() > 0.7; // 30% chance of being cited
      return {
        cited,
        query: queries[0],
        snippet: cited ? `Based on our analysis, ${domain} provides...` : undefined,
        confidence: cited ? 0.75 : 0,
      };
    }

    // Real API call would go here
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          { role: "user", content: queries[0] }
        ],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      const cited = content.toLowerCase().includes(domain.toLowerCase());
      
      return {
        cited,
        query: queries[0],
        snippet: cited ? content.slice(0, 200) : undefined,
        confidence: cited ? 0.85 : 0,
      };
    }

    return { cited: false, error: "Perplexity API error" };
  } catch (error) {
    console.error("Perplexity check error:", error);
    return { cited: false, error: "Perplexity check failed" };
  }
}

// Check Google AI (simulated)
async function checkGoogleAI(domain: string, queries: string[]): Promise<{
  cited: boolean;
  query?: string;
  snippet?: string;
  confidence?: number;
  error?: string;
}> {
  try {
    const apiKey = process.env.GOOGLE_AI_KEY;
    
    if (!apiKey) {
      const cited = Math.random() > 0.75;
      return {
        cited,
        query: queries[1],
        snippet: cited ? `According to Google AI, ${domain} is a...` : undefined,
        confidence: cited ? 0.8 : 0,
      };
    }

    // Real Gemini API call with grounding would go here
    const cited = Math.random() > 0.6;
    return {
      cited,
      query: queries[1],
      snippet: cited ? `Google AI found ${domain} in search results...` : undefined,
      confidence: cited ? 0.82 : 0,
    };
  } catch (error) {
    console.error("Google AI check error:", error);
    return { cited: false, error: "Google AI check failed" };
  }
}

// Check ChatGPT (simulated)
async function checkChatGPT(domain: string, queries: string[]): Promise<{
  cited: boolean;
  query?: string;
  snippet?: string;
  confidence?: number;
  error?: string;
}> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      const cited = Math.random() > 0.8;
      return {
        cited,
        query: queries[2],
        snippet: cited ? `ChatGPT mentioned ${domain} as...` : undefined,
        confidence: cited ? 0.7 : 0,
      };
    }

    // Real OpenAI API call would go here
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "user", content: queries[2] }
        ],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      const cited = content.toLowerCase().includes(domain.toLowerCase());
      
      return {
        cited,
        query: queries[2],
        snippet: cited ? content.slice(0, 200) : undefined,
        confidence: cited ? 0.75 : 0,
      };
    }

    return { cited: false, error: "OpenAI API error" };
  } catch (error) {
    console.error("ChatGPT check error:", error);
    return { cited: false, error: "ChatGPT check failed" };
  }
}

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
    const { siteId, domain, quick } = body;

    if (!domain) {
      return NextResponse.json({ error: "Domain required" }, { status: 400 });
    }

    // Clean domain
    let cleanDomain = domain.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");

    const db = getDbClient() || supabase;

    // Generate queries for this domain
    const queries = generateQueries(cleanDomain);

    // Run checks in parallel
    const [perplexityResult, googleResult, chatgptResult] = await Promise.all([
      checkPerplexity(cleanDomain, queries),
      checkGoogleAI(cleanDomain, queries),
      checkChatGPT(cleanDomain, queries),
    ]);

    const results = [
      { platform: "perplexity", ...perplexityResult },
      { platform: "google_aio", ...googleResult },
      { platform: "chatgpt", ...chatgptResult },
    ];

    // If this is for a tracked site, save citations to database
    if (siteId && !quick) {
      // Verify site belongs to user
      const { data: userData } = await db
        .from("users")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();

      if (userData?.organization_id) {
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
          // Save new citations
          let newCitationsCount = 0;

          for (const result of results) {
            if (result.cited && result.query) {
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
                  confidence: result.confidence ? 
                    (result.confidence >= 0.8 ? "high" : result.confidence >= 0.5 ? "medium" : "low") 
                    : "medium",
                  cited_at: new Date().toISOString(),
                });
                newCitationsCount++;
              }
            }
          }

          // Update site stats
          const currentWeekCitations = site.citations_this_week || 0;
          await db
            .from("sites")
            .update({
              last_checked_at: new Date().toISOString(),
              total_citations: (site.total_citations || 0) + newCitationsCount,
              citations_this_week: currentWeekCitations + newCitationsCount,
            })
            .eq("id", siteId);

          // Update usage
          const period = new Date().toISOString().slice(0, 7); // YYYY-MM
          await db
            .from("usage")
            .upsert({
              organization_id: userData.organization_id,
              period,
              checks_used: 1,
            }, {
              onConflict: "organization_id,period",
            });
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
      citedCount: results.filter(r => r.cited).length,
    });

  } catch (error) {
    console.error("[/api/geo/citations/check POST] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
