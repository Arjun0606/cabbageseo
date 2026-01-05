/**
 * GEO Intelligence Engine
 * 
 * Complete GEO analysis beyond just citation tracking:
 * 1. GEO Score - How AI-friendly is your content?
 * 2. GEO Tips - Actionable optimization recommendations
 * 3. Query Intelligence - What questions is AI answering in your niche?
 * 4. Citation Opportunities - Where competitors are cited but you're not
 * 
 * "Don't just track citations. Understand WHY AI cites (or doesn't cite) you."
 */

import { createServiceClient } from "@/lib/supabase/server";

// ============================================
// TYPES
// ============================================

export interface GEOScore {
  overall: number;  // 0-100
  breakdown: {
    contentClarity: number;      // How clear and direct is the content?
    authoritySignals: number;    // Does it establish expertise?
    structuredData: number;      // Schema.org, FAQ markup, etc.
    citability: number;          // Short, quotable facts
    freshness: number;           // How recent is the content?
    topicalDepth: number;        // How comprehensive?
  };
  grade: "A" | "B" | "C" | "D" | "F";
  summary: string;
}

export interface GEOTip {
  id: string;
  category: "content" | "structure" | "authority" | "technical";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  impact: string;
  example?: string;
}

export interface QueryIntelligence {
  query: string;
  searchVolume: "high" | "medium" | "low";
  aiPlatforms: string[];  // Which platforms answer this
  topSources: string[];   // Who gets cited for this
  yourPosition: "cited" | "mentioned" | "absent";
  opportunity: boolean;
}

export interface CitationOpportunity {
  query: string;
  competitor: string;
  competitorSnippet: string;
  platform: string;
  suggestedAction: string;
  difficulty: "easy" | "medium" | "hard";
}

// ============================================
// GEO SCORE CALCULATOR
// ============================================

export class GEOScoreCalculator {
  private openaiKey: string | undefined;
  private geminiKey: string | undefined;

  constructor() {
    this.openaiKey = process.env.OPENAI_API_KEY;
    this.geminiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  }

  /**
   * Calculate GEO Score for a domain
   * Analyzes the site's content for AI-friendliness
   */
  async calculateScore(domain: string, content?: string): Promise<GEOScore> {
    // If we have content, analyze it directly
    // Otherwise, fetch and analyze the homepage
    const textToAnalyze = content || await this.fetchPageContent(domain);
    
    if (!textToAnalyze || !this.openaiKey) {
      return this.getDefaultScore();
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a GEO (Generative Engine Optimization) expert. Analyze content for how likely AI platforms (ChatGPT, Perplexity, Google AI) are to cite it.

Score each factor 0-100:
- contentClarity: Clear, direct answers to questions
- authoritySignals: Expertise, credentials, data, citations
- structuredData: Lists, headers, FAQ format, organized
- citability: Short, quotable facts and stats
- freshness: Recent, up-to-date information
- topicalDepth: Comprehensive coverage

Respond in JSON only:
{
  "breakdown": {
    "contentClarity": 75,
    "authoritySignals": 60,
    "structuredData": 80,
    "citability": 70,
    "freshness": 65,
    "topicalDepth": 85
  },
  "summary": "One sentence summary of GEO readiness"
}`
            },
            {
              role: "user",
              content: `Analyze this content for GEO/AI citation potential:\n\n${textToAnalyze.slice(0, 8000)}`
            }
          ],
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
      });

      const data = await response.json();
      const analysis = JSON.parse(data.choices?.[0]?.message?.content || "{}");
      
      const breakdown = analysis.breakdown || this.getDefaultScore().breakdown;
      const overall = Math.round(
        (breakdown.contentClarity + 
         breakdown.authoritySignals + 
         breakdown.structuredData + 
         breakdown.citability + 
         breakdown.freshness + 
         breakdown.topicalDepth) / 6
      );

      return {
        overall,
        breakdown,
        grade: this.scoreToGrade(overall),
        summary: analysis.summary || "Analysis complete.",
      };
    } catch (error) {
      console.error("[GEO Score] Error:", error);
      return this.getDefaultScore();
    }
  }

  private async fetchPageContent(domain: string): Promise<string | null> {
    try {
      const url = domain.startsWith("http") ? domain : `https://${domain}`;
      const response = await fetch(url, {
        headers: { "User-Agent": "CabbageSEO-Bot/1.0" },
        signal: AbortSignal.timeout(10000),
      });
      const html = await response.text();
      
      // Basic HTML to text extraction
      return html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 10000);
    } catch {
      return null;
    }
  }

  private scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
    if (score >= 90) return "A";
    if (score >= 75) return "B";
    if (score >= 60) return "C";
    if (score >= 40) return "D";
    return "F";
  }

  private getDefaultScore(): GEOScore {
    return {
      overall: 50,
      breakdown: {
        contentClarity: 50,
        authoritySignals: 50,
        structuredData: 50,
        citability: 50,
        freshness: 50,
        topicalDepth: 50,
      },
      grade: "C",
      summary: "Unable to analyze content. Add your site to get a detailed GEO score.",
    };
  }
}

// ============================================
// GEO TIPS GENERATOR
// ============================================

export class GEOTipsGenerator {
  /**
   * Generate actionable tips based on GEO Score
   */
  generateTips(score: GEOScore, citationCount: number = 0): GEOTip[] {
    const tips: GEOTip[] = [];
    const { breakdown } = score;

    // Content Clarity Tips
    if (breakdown.contentClarity < 70) {
      tips.push({
        id: "clarity-1",
        category: "content",
        priority: "high",
        title: "Add Direct Answer Paragraphs",
        description: "AI platforms prefer content that directly answers questions in the first 1-2 sentences. Start articles with clear, definitive answers.",
        impact: "High - AI extracts the first clear answer it finds",
        example: 'Instead of "In this article, we\'ll explore...", start with "The best way to [X] is [Y] because [Z]."',
      });
    }

    // Authority Signals Tips
    if (breakdown.authoritySignals < 70) {
      tips.push({
        id: "authority-1",
        category: "authority",
        priority: "high",
        title: "Add Data and Statistics",
        description: "Include specific numbers, percentages, and data points. AI loves citing concrete stats.",
        impact: "High - Stats are highly citable by AI",
        example: '"87% of users prefer X" is more citable than "most users prefer X"',
      });
      
      tips.push({
        id: "authority-2",
        category: "authority",
        priority: "medium",
        title: "Show Expertise Credentials",
        description: "Add author bios, company credentials, years of experience. AI weighs authority heavily.",
        impact: "Medium - Builds trust signals for AI",
      });
    }

    // Structured Data Tips
    if (breakdown.structuredData < 70) {
      tips.push({
        id: "structure-1",
        category: "structure",
        priority: "high",
        title: "Add FAQ Sections",
        description: "Include FAQ sections with Q&A format. AI platforms specifically look for this format to extract answers.",
        impact: "Very High - FAQ format is the #1 way to get cited",
        example: "Add 5-10 FAQs at the bottom of each main page answering common questions.",
      });
      
      tips.push({
        id: "structure-2",
        category: "structure",
        priority: "medium",
        title: "Use Clear Headings (H2/H3)",
        description: "Structure content with question-based headings. AI uses headings to understand content structure.",
        impact: "Medium - Improves content parsing by AI",
      });
    }

    // Citability Tips
    if (breakdown.citability < 70) {
      tips.push({
        id: "cite-1",
        category: "content",
        priority: "high",
        title: "Create Quotable Snippets",
        description: "Write short, self-contained facts that AI can quote directly. Aim for 1-2 sentence factoids.",
        impact: "High - Short facts are easy for AI to cite",
        example: '"CabbageSEO tracks citations across ChatGPT, Perplexity, and Google AI." - quotable fact',
      });
    }

    // Freshness Tips
    if (breakdown.freshness < 70) {
      tips.push({
        id: "fresh-1",
        category: "content",
        priority: "medium",
        title: "Update Content Regularly",
        description: "Add recent dates, update stats, mention current year. AI prefers fresh, up-to-date content.",
        impact: "Medium - Freshness is a ranking factor for AI",
      });
    }

    // Topical Depth Tips
    if (breakdown.topicalDepth < 70) {
      tips.push({
        id: "depth-1",
        category: "content",
        priority: "medium",
        title: "Cover Topics Comprehensively",
        description: "AI prefers authoritative sources that cover topics in depth. Add more subtopics and related content.",
        impact: "Medium - Comprehensive content builds topical authority",
      });
    }

    // Technical Tips (always relevant)
    tips.push({
      id: "tech-1",
      category: "technical",
      priority: "low",
      title: "Add Schema.org Markup",
      description: "Add FAQPage, HowTo, and Article schema. This helps AI understand and trust your content structure.",
      impact: "Medium - Schema helps AI parse content",
    });

    // Citation-specific tips
    if (citationCount === 0) {
      tips.unshift({
        id: "zero-citations",
        category: "content",
        priority: "high",
        title: "You Have Zero AI Citations!",
        description: "AI platforms aren't citing you yet. Focus on creating content that directly answers common questions in your niche.",
        impact: "Critical - Getting your first citation is the hardest part",
      });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return tips.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }
}

// ============================================
// QUERY INTELLIGENCE ENGINE
// ============================================

export class QueryIntelligenceEngine {
  private openaiKey: string | undefined;

  constructor() {
    this.openaiKey = process.env.OPENAI_API_KEY;
  }

  /**
   * Discover what queries AI is answering in a niche
   */
  async discoverQueries(
    domain: string,
    niche: string,
    existingCitations: Array<{ query: string; platform: string }>
  ): Promise<QueryIntelligence[]> {
    if (!this.openaiKey) {
      return [];
    }

    try {
      // Generate relevant queries for the niche
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `Generate 15 common questions people ask AI assistants about "${niche}". 
Include a mix of:
- Basic "what is" questions
- "How to" questions  
- "Best" and comparison questions
- Specific problem-solving questions

Return JSON array of strings only: ["question 1", "question 2", ...]`
            },
            {
              role: "user",
              content: `Generate questions for the ${niche} niche that people commonly ask ChatGPT, Perplexity, or Google AI.`
            }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" },
        }),
      });

      const data = await response.json();
      let queries: string[] = [];
      
      try {
        const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
        queries = parsed.queries || parsed.questions || Object.values(parsed).flat().filter((q: unknown) => typeof q === "string");
      } catch {
        queries = [];
      }

      // Map queries to intelligence
      const existingQuerySet = new Set(existingCitations.map(c => c.query.toLowerCase()));
      
      return queries.slice(0, 15).map((query, i) => ({
        query,
        searchVolume: i < 5 ? "high" : i < 10 ? "medium" : "low",
        aiPlatforms: ["ChatGPT", "Perplexity", "Google AI"],
        topSources: [], // Would need to actually query each platform
        yourPosition: existingQuerySet.has(query.toLowerCase()) ? "cited" : "absent",
        opportunity: !existingQuerySet.has(query.toLowerCase()),
      }));
    } catch (error) {
      console.error("[Query Intelligence] Error:", error);
      return [];
    }
  }

  /**
   * Store discovered queries in database for tracking
   */
  async storeQueries(siteId: string, queries: QueryIntelligence[]): Promise<void> {
    const supabase = createServiceClient();
    if (!supabase) return;

    for (const q of queries) {
      try {
        await (supabase as any).from("query_intelligence").upsert({
          site_id: siteId,
          query: q.query,
          search_volume: q.searchVolume,
          your_position: q.yourPosition,
          is_opportunity: q.opportunity,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "site_id,query",
        });
      } catch (error) {
        // Ignore duplicates
      }
    }
  }
}

// ============================================
// CITATION OPPORTUNITIES FINDER
// ============================================

export class CitationOpportunityFinder {
  /**
   * Find queries where competitors are cited but you're not
   */
  async findOpportunities(
    siteId: string,
    domain: string,
    competitors: string[]
  ): Promise<CitationOpportunity[]> {
    const supabase = createServiceClient();
    if (!supabase || competitors.length === 0) {
      return [];
    }

    const opportunities: CitationOpportunity[] = [];

    try {
      // Get your citations
      const { data: yourCitations } = await (supabase as any)
        .from("citations")
        .select("query, platform")
        .eq("site_id", siteId);

      const yourQueries = new Set(
        (yourCitations || []).map((c: { query: string }) => c.query.toLowerCase())
      );

      // Get competitor citations (from competitors table)
      const { data: competitorData } = await (supabase as any)
        .from("competitors")
        .select("domain, citation_count, last_citations")
        .eq("site_id", siteId);

      // Find gaps - queries where competitors have citations but you don't
      for (const comp of (competitorData || [])) {
        const compCitations = comp.last_citations || [];
        
        for (const citation of compCitations) {
          if (!yourQueries.has(citation.query?.toLowerCase())) {
            opportunities.push({
              query: citation.query,
              competitor: comp.domain,
              competitorSnippet: citation.snippet || "",
              platform: citation.platform,
              suggestedAction: this.getSuggestedAction(citation.query),
              difficulty: this.assessDifficulty(citation.query),
            });
          }
        }
      }

      // Deduplicate by query
      const seen = new Set<string>();
      return opportunities.filter(o => {
        if (seen.has(o.query.toLowerCase())) return false;
        seen.add(o.query.toLowerCase());
        return true;
      }).slice(0, 20);
    } catch (error) {
      console.error("[Opportunity Finder] Error:", error);
      return [];
    }
  }

  private getSuggestedAction(query: string): string {
    const q = query.toLowerCase();
    
    if (q.includes("what is") || q.includes("what are")) {
      return "Create a comprehensive definition/explainer article with clear opening paragraph";
    }
    if (q.includes("how to") || q.includes("how do")) {
      return "Write a step-by-step guide with numbered steps and clear instructions";
    }
    if (q.includes("best") || q.includes("top")) {
      return "Create a comparison/listicle with specific recommendations and reasoning";
    }
    if (q.includes("vs") || q.includes("versus") || q.includes("compare")) {
      return "Write a detailed comparison article covering pros/cons of each option";
    }
    
    return "Create targeted content that directly answers this question in the first paragraph";
  }

  private assessDifficulty(query: string): "easy" | "medium" | "hard" {
    const q = query.toLowerCase();
    
    // Easy - simple informational queries
    if (q.includes("what is") || q.includes("definition")) {
      return "easy";
    }
    
    // Hard - competitive comparison queries
    if (q.includes("best") || q.includes("top") || q.includes("vs")) {
      return "hard";
    }
    
    return "medium";
  }
}

// ============================================
// UNIFIED GEO INTELLIGENCE API
// ============================================

export const geoIntelligence = {
  score: new GEOScoreCalculator(),
  tips: new GEOTipsGenerator(),
  queries: new QueryIntelligenceEngine(),
  opportunities: new CitationOpportunityFinder(),

  /**
   * Get complete GEO analysis for a site
   */
  async getFullAnalysis(
    siteId: string,
    domain: string,
    niche: string,
    competitors: string[] = []
  ): Promise<{
    score: GEOScore;
    tips: GEOTip[];
    queries: QueryIntelligence[];
    opportunities: CitationOpportunity[];
  }> {
    const supabase = createServiceClient();
    
    // Get existing citations
    let existingCitations: Array<{ query: string; platform: string }> = [];
    let citationCount = 0;
    
    if (supabase) {
      const { data, count } = await (supabase as any)
        .from("citations")
        .select("query, platform", { count: "exact" })
        .eq("site_id", siteId);
      existingCitations = data || [];
      citationCount = count || 0;
    }

    // Run all analyses in parallel
    const [score, queries, opportunities] = await Promise.all([
      this.score.calculateScore(domain),
      this.queries.discoverQueries(domain, niche, existingCitations),
      this.opportunities.findOpportunities(siteId, domain, competitors),
    ]);

    // Generate tips based on score and citations
    const tips = this.tips.generateTips(score, citationCount);

    return {
      score,
      tips,
      queries,
      opportunities,
    };
  },
};

export default geoIntelligence;

