/**
 * AI-Powered Keyword Intelligence Service
 * 
 * Replaces DataForSEO for keyword research using GPT-5-mini.
 * 
 * Why AI > DataForSEO for GEO:
 * - GEO doesn't need exact search volumes (AI ranks by semantic relevance)
 * - AI understands intent, topics, and entity relationships better
 * - Clusters keywords by meaning, not just string similarity
 * - Identifies questions AI engines actually answer
 * - Much better margin (~$0.01 per research vs $0.10+ DataForSEO)
 */

import { openai } from "./openai-client";

// ============================================
// TYPES
// ============================================

export interface AIKeyword {
  keyword: string;
  intent: "informational" | "commercial" | "transactional" | "navigational";
  estimatedVolume: "high" | "medium" | "low";  // AI estimation tier
  difficulty: "easy" | "medium" | "hard";       // Based on competition analysis
  geoOpportunity: number;                       // 0-100 score for AI citation potential
  questions: string[];                          // Related questions AI engines answer
  entities: string[];                           // Named entities for GEO optimization
  cluster?: string;                             // Semantic cluster name
}

export interface KeywordCluster {
  name: string;
  pillarKeyword: string;
  keywords: AIKeyword[];
  suggestedArticles: number;
  totalGeoOpportunity: number;
}

export interface KeywordResearchResult {
  keywords: AIKeyword[];
  clusters: KeywordCluster[];
  topQuestions: string[];
  contentGaps: string[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    costCents: number;
  };
}

// ============================================
// PROMPTS
// ============================================

const KEYWORD_RESEARCH_PROMPT = `You are an expert SEO and GEO (Generative Engine Optimization) strategist.

Analyze the seed keyword and generate comprehensive keyword intelligence optimized for AI search engines (ChatGPT, Perplexity, Google AI Overviews).

For GEO, focus on:
- Questions that AI engines would answer (high citation potential)
- Topics with clear, quotable answers
- Entity-rich keywords that AI can understand
- Intent signals that indicate purchase/action readiness

Return JSON with this exact structure:
{
  "keywords": [
    {
      "keyword": "string",
      "intent": "informational|commercial|transactional|navigational",
      "estimatedVolume": "high|medium|low",
      "difficulty": "easy|medium|hard",
      "geoOpportunity": 0-100,
      "questions": ["related question 1", "related question 2"],
      "entities": ["entity1", "entity2"]
    }
  ],
  "clusters": [
    {
      "name": "Cluster Name",
      "pillarKeyword": "main keyword for this cluster",
      "keywordIndices": [0, 1, 2],
      "suggestedArticles": 1-5
    }
  ],
  "topQuestions": ["top 5 questions AI engines answer about this topic"],
  "contentGaps": ["topics competitors miss that AI would cite"]
}`;

const COMPETITOR_ANALYSIS_PROMPT = `You are an expert at competitive keyword analysis for GEO (Generative Engine Optimization).

Analyze the competitor domain and identify keywords they likely rank for, focusing on:
- Topics where AI engines would cite them
- Content gaps you could exploit
- Questions they answer that get AI citations
- Entities and topics they cover

Return JSON with this exact structure:
{
  "keywords": [
    {
      "keyword": "string",
      "intent": "informational|commercial|transactional|navigational", 
      "estimatedVolume": "high|medium|low",
      "difficulty": "easy|medium|hard",
      "geoOpportunity": 0-100,
      "questions": ["related question 1"],
      "entities": ["entity1"]
    }
  ],
  "contentGaps": ["topics they don't cover well"],
  "strengthAreas": ["topics they dominate"]
}`;

// ============================================
// MAIN SERVICE
// ============================================

export class KeywordIntelligence {
  /**
   * Research keywords from a seed keyword using AI
   */
  async research(
    seedKeyword: string,
    options: {
      siteContext?: {
        domain?: string;
        industry?: string;
        existingTopics?: string[];
      };
      limit?: number;
    } = {}
  ): Promise<KeywordResearchResult> {
    const { siteContext, limit = 30 } = options;

    const contextInfo = siteContext
      ? `\n\nSite Context:
- Domain: ${siteContext.domain || "unknown"}
- Industry: ${siteContext.industry || "general"}
- Existing topics: ${siteContext.existingTopics?.slice(0, 10).join(", ") || "none"}`
      : "";

    const prompt = `Seed keyword: "${seedKeyword}"
${contextInfo}

Generate ${limit} related keywords with full GEO intelligence.
Focus on keywords with high AI citation potential.
Group them into semantic clusters.`;

    const response = await openai.chat(
      [{ role: "user", content: prompt }],
      KEYWORD_RESEARCH_PROMPT,
      { model: "fast", maxTokens: 4096, temperature: 0.7 }
    );

    const data = this.parseResponse(response.content) as {
      keywords?: AIKeyword[];
      clusters?: Array<{
        name: string;
        pillarKeyword: string;
        keywordIndices: number[];
        suggestedArticles: number;
      }>;
      topQuestions?: string[];
      contentGaps?: string[];
    };
    
    // Build clusters from indices
    const clusters: KeywordCluster[] = (data.clusters || []).map((c: {
      name: string;
      pillarKeyword: string;
      keywordIndices: number[];
      suggestedArticles: number;
    }) => ({
      name: c.name,
      pillarKeyword: c.pillarKeyword,
      keywords: (c.keywordIndices || [])
        .map((i: number) => data.keywords?.[i])
        .filter(Boolean) as AIKeyword[],
      suggestedArticles: c.suggestedArticles || 1,
      totalGeoOpportunity: (c.keywordIndices || [])
        .map((i: number) => data.keywords?.[i]?.geoOpportunity || 0)
        .reduce((a: number, b: number) => a + b, 0),
    }));

    return {
      keywords: data.keywords || [],
      clusters,
      topQuestions: data.topQuestions || [],
      contentGaps: data.contentGaps || [],
      usage: response.usage,
    };
  }

  /**
   * Analyze competitor keywords using AI
   */
  async analyzeCompetitor(
    competitorDomain: string,
    options: {
      yourDomain?: string;
      industry?: string;
      limit?: number;
    } = {}
  ): Promise<{
    keywords: AIKeyword[];
    contentGaps: string[];
    strengthAreas: string[];
    usage: { inputTokens: number; outputTokens: number; costCents: number };
  }> {
    const { yourDomain, industry, limit = 20 } = options;

    const prompt = `Competitor domain: ${competitorDomain}
${yourDomain ? `Your domain: ${yourDomain}` : ""}
${industry ? `Industry: ${industry}` : ""}

Analyze what keywords this competitor likely targets.
Identify ${limit} keywords with their GEO potential.
Focus on opportunities where you could outrank them in AI citations.`;

    const response = await openai.chat(
      [{ role: "user", content: prompt }],
      COMPETITOR_ANALYSIS_PROMPT,
      { model: "fast", maxTokens: 3000, temperature: 0.7 }
    );

    const data = this.parseResponse(response.content) as {
      keywords?: AIKeyword[];
      contentGaps?: string[];
      strengthAreas?: string[];
    };

    return {
      keywords: data.keywords || [],
      contentGaps: data.contentGaps || [],
      strengthAreas: data.strengthAreas || [],
      usage: response.usage,
    };
  }

  /**
   * Get keyword suggestions (simpler, faster version)
   */
  async getSuggestions(
    seedKeyword: string,
    limit: number = 15
  ): Promise<AIKeyword[]> {
    const prompt = `Generate ${limit} related keywords for: "${seedKeyword}"

Return JSON array of keywords with intent, volume estimate, difficulty, and GEO opportunity score (0-100).
Focus on keywords AI search engines would answer.

Format: [{"keyword": "...", "intent": "informational", "estimatedVolume": "medium", "difficulty": "easy", "geoOpportunity": 75, "questions": [], "entities": []}]`;

    const response = await openai.chat(
      [{ role: "user", content: prompt }],
      "Return only valid JSON array. No markdown, no explanation.",
      { model: "fast", maxTokens: 2000, temperature: 0.8 }
    );

    const result = this.parseResponse(response.content);
    if (Array.isArray(result)) {
      return result as AIKeyword[];
    }
    return ((result as { keywords?: AIKeyword[] }).keywords || []) as AIKeyword[];
  }

  /**
   * Cluster existing keywords semantically
   */
  async clusterKeywords(
    keywords: string[]
  ): Promise<KeywordCluster[]> {
    if (keywords.length === 0) return [];

    const prompt = `Cluster these keywords into semantic groups:

${keywords.map((k, i) => `${i}. ${k}`).join("\n")}

Return JSON with clusters. Each cluster should have:
- name: descriptive cluster name
- pillarKeyword: main keyword for this cluster  
- keywordIndices: array of indices from the list above
- suggestedArticles: how many articles this cluster needs (1-5)

Format: {"clusters": [...]}`;

    const response = await openai.chat(
      [{ role: "user", content: prompt }],
      "Return only valid JSON. No markdown.",
      { model: "fast", maxTokens: 2000, temperature: 0.5 }
    );

    const data = this.parseResponse(response.content) as {
      clusters?: Array<{
        name: string;
        pillarKeyword: string;
        keywordIndices: number[];
        suggestedArticles: number;
      }>;
    };
    
    return (data.clusters || []).map((c) => ({
      name: c.name,
      pillarKeyword: c.pillarKeyword,
      keywords: (c.keywordIndices || []).map((i: number) => ({
        keyword: keywords[i],
        intent: "informational" as const,
        estimatedVolume: "medium" as const,
        difficulty: "medium" as const,
        geoOpportunity: 50,
        questions: [],
        entities: [],
      })),
      suggestedArticles: c.suggestedArticles || 1,
      totalGeoOpportunity: 50 * (c.keywordIndices?.length || 1),
    }));
  }

  /**
   * Get questions AI engines answer about a topic
   */
  async getAIQuestions(
    topic: string,
    limit: number = 10
  ): Promise<string[]> {
    const prompt = `What are the top ${limit} questions that AI search engines (ChatGPT, Perplexity, Google AI) would answer about: "${topic}"

Focus on questions where a well-structured answer would get cited.
Return JSON array of strings.`;

    const response = await openai.chat(
      [{ role: "user", content: prompt }],
      "Return only a JSON array of question strings.",
      { model: "nano", maxTokens: 1000, temperature: 0.7 }
    );

    const questions = this.parseResponse(response.content);
    return Array.isArray(questions) ? questions as string[] : [];
  }

  /**
   * Parse AI response, handling markdown code blocks
   */
  private parseResponse(content: string): Record<string, unknown> | unknown[] {
    try {
      // Strip markdown code blocks
      let cleaned = content
        .replace(/^```(?:json|JSON)?\s*\n?/gm, "")
        .replace(/\n?```\s*$/gm, "")
        .replace(/```(?:json|JSON)?/g, "")
        .trim();

      // Try direct parse
      try {
        return JSON.parse(cleaned);
      } catch {
        // Try extracting JSON object/array
        const jsonMatch = cleaned.match(/[\[{][\s\S]*[\]}]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      return JSON.parse(content);
    } catch (error) {
      console.error("[KeywordIntelligence] Failed to parse response:", content.slice(0, 200));
      return { keywords: [], clusters: [], topQuestions: [], contentGaps: [] };
    }
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const keywordIntelligence = new KeywordIntelligence();

/**
 * Convert AI keywords to database format
 */
export function toDbKeywords(
  aiKeywords: AIKeyword[],
  siteId: string
): Array<{
  site_id: string;
  keyword: string;
  volume: number | null;
  difficulty: number | null;
  intent: string;
  status: "discovered";
}> {
  // Map estimated volume to numeric approximations
  const volumeMap = { high: 5000, medium: 1000, low: 200 };
  const difficultyMap = { easy: 25, medium: 50, hard: 75 };

  return aiKeywords.map((kw) => ({
    site_id: siteId,
    keyword: kw.keyword.toLowerCase().trim(),
    volume: volumeMap[kw.estimatedVolume] || 500,
    difficulty: difficultyMap[kw.difficulty] || 50,
    intent: kw.intent || "informational",
    status: "discovered" as const,
  }));
}

