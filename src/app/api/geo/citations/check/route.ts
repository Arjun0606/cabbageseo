/**
 * Citation Check API
 * POST /api/geo/citations/check
 * 
 * Runs a real-time check across AI platforms to find citations.
 * Uses:
 * - Perplexity API (real)
 * - Google Gemini with grounding (real)
 * - ChatGPT simulation (asks if it knows the domain)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const maxDuration = 60;

// ============================================
// PERPLEXITY CHECK
// ============================================

async function checkPerplexity(domain: string): Promise<{
  cited: boolean;
  citations: Array<{ query: string; snippet: string }>;
}> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return { cited: false, citations: [] };
  }

  const queries = [
    `What is ${domain}?`,
    `Tell me about ${domain}`,
    `Is ${domain} a good tool?`,
  ];

  const citations: Array<{ query: string; snippet: string }> = [];

  for (const query of queries) {
    try {
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [{ role: "user", content: query }],
          return_citations: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        const citationUrls = data.citations || [];
        
        // Check if our domain is in the citations
        const isCited = citationUrls.some((url: string) => 
          url.toLowerCase().includes(domain.toLowerCase())
        );
        
        if (isCited) {
          citations.push({
            query,
            snippet: content.slice(0, 300),
          });
        }
      }
    } catch (error) {
      console.error("[Perplexity Check] Error:", error);
    }
  }

  return { cited: citations.length > 0, citations };
}

// ============================================
// GOOGLE AI CHECK (Gemini with grounding)
// ============================================

async function checkGoogleAI(domain: string): Promise<{
  cited: boolean;
  citations: Array<{ query: string; snippet: string }>;
}> {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { cited: false, citations: [] };
  }

  const queries = [
    `What is ${domain}?`,
    `Tell me about ${domain}`,
  ];

  const citations: Array<{ query: string; snippet: string }> = [];

  for (const query of queries) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: query }] }],
            tools: [{ googleSearchRetrieval: { dynamicRetrievalConfig: { mode: "MODE_DYNAMIC" } } }],
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const groundingMetadata = data.candidates?.[0]?.groundingMetadata;
        
        // Check grounding sources for our domain
        const sources = groundingMetadata?.groundingChunks || [];
        const isCited = sources.some((chunk: { web?: { uri?: string } }) =>
          chunk.web?.uri?.toLowerCase().includes(domain.toLowerCase())
        );
        
        if (isCited || content.toLowerCase().includes(domain.toLowerCase())) {
          citations.push({
            query,
            snippet: content.slice(0, 300),
          });
        }
      }
    } catch (error) {
      console.error("[Google AI Check] Error:", error);
    }
  }

  return { cited: citations.length > 0, citations };
}

// ============================================
// CHATGPT CHECK (Simulation)
// ============================================

async function checkChatGPT(domain: string): Promise<{
  cited: boolean;
  citations: Array<{ query: string; snippet: string }>;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { cited: false, citations: [] };
  }

  const queries = [
    `What do you know about ${domain}?`,
    `Can you tell me about the website ${domain}?`,
  ];

  const citations: Array<{ query: string; snippet: string }> = [];

  for (const query of queries) {
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
              content: "You are a helpful assistant. If you know about a website or company, describe what they do. If you don't know, say so.",
            },
            { role: "user", content: query },
          ],
          max_tokens: 500,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        
        // Check if ChatGPT knows about the domain (not just "I don't know")
        const unknownPhrases = [
          "i don't have",
          "i'm not familiar",
          "i don't know",
          "no specific information",
          "cannot find",
          "don't have access",
        ];
        
        const knows = !unknownPhrases.some(phrase => 
          content.toLowerCase().includes(phrase)
        ) && content.length > 100;
        
        if (knows) {
          citations.push({
            query,
            snippet: content.slice(0, 300),
          });
        }
      }
    } catch (error) {
      console.error("[ChatGPT Check] Error:", error);
    }
  }

  return { cited: citations.length > 0, citations };
}

// ============================================
// MAIN HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { siteId, domain } = body;

    if (!siteId || !domain) {
      return NextResponse.json({ error: "siteId and domain required" }, { status: 400 });
    }

    console.log(`[Citation Check] Starting check for ${domain}`);

    // Run checks in parallel
    const [perplexity, googleAI, chatgpt] = await Promise.all([
      checkPerplexity(domain),
      checkGoogleAI(domain),
      checkChatGPT(domain),
    ]);

    console.log(`[Citation Check] Results - Perplexity: ${perplexity.cited}, Google: ${googleAI.cited}, ChatGPT: ${chatgpt.cited}`);

    // Save citations to database
    const serviceClient = createServiceClient();
    const allCitations = [
      ...perplexity.citations.map(c => ({ ...c, platform: "perplexity" as const })),
      ...googleAI.citations.map(c => ({ ...c, platform: "google_aio" as const })),
      ...chatgpt.citations.map(c => ({ ...c, platform: "chatgpt" as const })),
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = serviceClient as any;
    
    for (const citation of allCitations) {
      // Check if citation already exists
      const { data: existing } = await db
        .from("citations")
        .select("id")
        .eq("site_id", siteId)
        .eq("platform", citation.platform)
        .eq("query", citation.query)
        .single();

      if (existing) {
        // Update last_seen
        await db
          .from("citations")
          .update({ last_checked_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        // Insert new citation
        await db
          .from("citations")
          .insert({
            site_id: siteId,
            platform: citation.platform,
            query: citation.query,
            snippet: citation.snippet,
            confidence: "medium",
            cited_at: new Date().toISOString(),
            last_checked_at: new Date().toISOString(),
          });
      }
    }

    // Update site's last check timestamp
    await db
      .from("sites")
      .update({ last_checked_at: new Date().toISOString() })
      .eq("id", siteId);

    return NextResponse.json({
      success: true,
      results: {
        perplexity: { cited: perplexity.cited, count: perplexity.citations.length },
        googleAI: { cited: googleAI.cited, count: googleAI.citations.length },
        chatgpt: { cited: chatgpt.cited, count: chatgpt.citations.length },
      },
      totalNewCitations: allCitations.length,
    });
  } catch (error) {
    console.error("[Citation Check] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Check failed" },
      { status: 500 }
    );
  }
}

