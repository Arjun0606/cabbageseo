/**
 * AI Query API
 * 
 * Process natural language queries and route to appropriate actions
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAIClient } from "@/lib/ai/client";

interface QueryIntent {
  action: string;
  route?: string;
  params?: Record<string, string>;
  response: string;
}

// Intent detection patterns
const intentPatterns: Array<{ pattern: RegExp; intent: QueryIntent }> = [
  {
    pattern: /^(generate|create|suggest|give me).*(idea|topic|content)/i,
    intent: {
      action: "generate-ideas",
      route: "/content?action=generate-ideas",
      response: "I'll help you generate content ideas. Redirecting to content workspace...",
    },
  },
  {
    pattern: /^(write|create).*(article|blog|post|content)/i,
    intent: {
      action: "write-article",
      route: "/content/new",
      response: "Starting content generation wizard...",
    },
  },
  {
    pattern: /^(optimize|improve|enhance).*(page|content|seo)/i,
    intent: {
      action: "optimize-page",
      route: "/audit?tab=optimize",
      response: "I'll analyze your pages for optimization opportunities...",
    },
  },
  {
    pattern: /^(find|suggest|add).*(internal|link)/i,
    intent: {
      action: "internal-links",
      route: "/links",
      response: "Finding internal linking opportunities...",
    },
  },
  {
    pattern: /^(fix|resolve|address).*(issue|error|problem)/i,
    intent: {
      action: "fix-issues",
      route: "/audit?action=fix",
      response: "Scanning for issues to fix...",
    },
  },
  {
    pattern: /^(analyze|check|compare).*(competitor|competition)/i,
    intent: {
      action: "analyze-competitors",
      route: "/keywords?tab=competitors",
      response: "Analyzing competitor SEO strategies...",
    },
  },
  {
    pattern: /^(research|find|discover).*(keyword)/i,
    intent: {
      action: "research-keywords",
      route: "/keywords?tab=research",
      response: "Researching keyword opportunities...",
    },
  },
  {
    pattern: /^(crawl|scan|audit).*(site|website)/i,
    intent: {
      action: "run-crawl",
      route: "/sites?action=crawl",
      response: "Starting site crawl...",
    },
  },
  {
    pattern: /^(add|connect|new).*(site|website|domain)/i,
    intent: {
      action: "add-site",
      route: "/sites/new",
      response: "Let's add a new site...",
    },
  },
  {
    pattern: /^(check|show|view).*(rank|position|serp)/i,
    intent: {
      action: "check-rankings",
      route: "/analytics?tab=rankings",
      response: "Loading your ranking data...",
    },
  },
  {
    pattern: /^(what|how|why|explain|tell me)/i,
    intent: {
      action: "explain",
      response: "Let me help explain that...",
    },
  },
];

// POST - Process AI query
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { query, context } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Check for pattern matches
    for (const { pattern, intent } of intentPatterns) {
      if (pattern.test(query)) {
        return NextResponse.json({
          success: true,
          data: {
            type: "action",
            ...intent,
          },
        });
      }
    }

    // If no pattern matches, use AI to understand the query
    const ai = createAIClient();
    
    // Get context about user's sites
    const { data: sites } = await supabase
      .from("sites")
      .select("domain, name")
      .limit(5);

    const systemPrompt = `You are CabbageSEO's AI assistant. You help users with SEO tasks.
Available actions:
- Generate content ideas
- Write articles
- Optimize pages
- Find internal linking opportunities
- Fix SEO issues
- Analyze competitors
- Research keywords
- Run site crawls

User's sites: ${sites?.map(s => s.domain).join(", ") || "No sites yet"}

For any query, respond with:
1. A brief, helpful response (1-2 sentences)
2. The most relevant action to take (or "none" if just informational)

Respond in JSON: {"response": "...", "action": "...", "route": "..."}`;

    const aiResponse = await ai.generateText(
      `User query: "${query}"${context ? `\nContext: ${context}` : ""}`,
      systemPrompt,
      { maxTokens: 200 }
    );

    // Parse AI response
    try {
      const parsed = JSON.parse(aiResponse);
      return NextResponse.json({
        success: true,
        data: {
          type: parsed.action !== "none" ? "action" : "response",
          action: parsed.action !== "none" ? parsed.action : undefined,
          route: parsed.route,
          response: parsed.response,
        },
      });
    } catch {
      // If AI doesn't return valid JSON, use the text response
      return NextResponse.json({
        success: true,
        data: {
          type: "response",
          response: aiResponse || "I'm not sure how to help with that. Try asking about content, keywords, or SEO issues.",
        },
      });
    }

  } catch (error) {
    console.error("[AI Query API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process query" },
      { status: 500 }
    );
  }
}

