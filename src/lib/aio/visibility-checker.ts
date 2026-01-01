/**
 * AI Visibility Checker (GEO)
 * 
 * 100% AI-POWERED - No external SERP APIs required
 * 
 * Uses GPT-5-mini to analyze content and estimate citation likelihood
 * across AI platforms (ChatGPT, Perplexity, Google AI).
 * 
 * Focus: Generative Engine Optimization (GEO)
 * - Location-aware analysis
 * - Entity optimization
 * - Answer structure scoring
 * - Quotability assessment
 */

import { openai } from "@/lib/ai/openai-client";

// ============================================
// TYPES
// ============================================

interface PlatformScore {
  platform: "chatgpt" | "perplexity" | "google_aio";
  platformName: string;
  score: number;              // 0-100
  confidence: "high" | "medium" | "low";
  strengths: string[];
  improvements: string[];
}

interface VisibilityResult {
  url: string;
  domain: string;
  checkedAt: string;
  
  // Platform-specific scores
  platforms: {
    chatgpt: PlatformScore;
    perplexity: PlatformScore;
    googleAio: PlatformScore;
  };
  
  // Overall GEO score
  overallScore: number;
  
  // Key factors analyzed
  factors: {
    entityDensity: number;      // Named entities for topical authority
    quotability: number;        // Easy-to-extract answer snippets
    answerStructure: number;    // FAQs, definitions, how-tos
    freshness: number;          // Recent updates, current info
    expertAttribution: number;  // Expert quotes, author credentials
    locationRelevance: number;  // Location-specific content
  };
  
  // Top opportunities for improvement
  quickWins: string[];
  
  // Location context if analyzed
  location?: {
    region: string;
    localEntities: string[];
    recommendations: string[];
  };
}

interface CheckOptions {
  url: string;
  content?: string;           // Raw content (optional - will be fetched if not provided)
  keywords?: string[];        // Related keywords for context
  location?: string;          // e.g., "India", "Germany" for location-aware analysis
}

// ============================================
// AI VISIBILITY CHECKER
// ============================================

export class AIVisibilityChecker {
  /**
   * Check if OpenAI is configured (our only dependency)
   */
  isConfigured(): boolean {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  /**
   * Main visibility check - AI-powered analysis
   */
  async checkVisibility(options: CheckOptions): Promise<VisibilityResult> {
    const { url, content = "", keywords = [], location } = options;
    
    // Extract domain
    let domain: string;
    try {
      const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
      domain = urlObj.hostname.replace(/^www\./, "");
    } catch {
      domain = url.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
    }

    const contentContext = content.length > 0 
      ? `Content to analyze (first 5000 chars):\n${content.slice(0, 5000)}`
      : `Domain: ${domain}\nKeywords: ${keywords.join(", ")}`;

    const locationContext = location 
      ? `User location: ${location}. Analyze for location-specific relevance.`
      : "";

    const prompt = `You are a GEO (Generative Engine Optimization) expert. Analyze this content for visibility in AI platforms.

${contentContext}

${locationContext}

Analyze for visibility in:
1. ChatGPT - Prefers authoritative, well-structured answers
2. Perplexity - Prefers cited sources, recent information
3. Google AI Overviews - Prefers clear answers, structured data

For each platform, score 0-100 based on:
- Entity density (named entities for topical authority)
- Quotability (easy-to-extract snippets)
- Answer structure (FAQs, definitions, step-by-step)
- Freshness (current/updated content)
- Expert attribution (author credentials, expert quotes)
${location ? "- Location relevance (region-specific information)" : ""}

Return JSON:
{
  "platforms": {
    "chatgpt": { "score": 75, "confidence": "high", "strengths": ["..."], "improvements": ["..."] },
    "perplexity": { "score": 68, "confidence": "medium", "strengths": ["..."], "improvements": ["..."] },
    "googleAio": { "score": 72, "confidence": "high", "strengths": ["..."], "improvements": ["..."] }
  },
  "factors": {
    "entityDensity": 70,
    "quotability": 65,
    "answerStructure": 80,
    "freshness": 60,
    "expertAttribution": 50,
    "locationRelevance": ${location ? "75" : "0"}
  },
  "quickWins": ["Add FAQ schema", "Include more named entities", "Add expert quotes"],
  ${location ? '"location": { "region": "...", "localEntities": ["..."], "recommendations": ["..."] },' : ""}
}`;

    const result = await openai.getJSON<{
      platforms: {
        chatgpt: { score: number; confidence: string; strengths: string[]; improvements: string[] };
        perplexity: { score: number; confidence: string; strengths: string[]; improvements: string[] };
        googleAio: { score: number; confidence: string; strengths: string[]; improvements: string[] };
      };
      factors: {
        entityDensity: number;
        quotability: number;
        answerStructure: number;
        freshness: number;
        expertAttribution: number;
        locationRelevance: number;
      };
      quickWins: string[];
      location?: {
        region: string;
        localEntities: string[];
        recommendations: string[];
      };
    }>(prompt);

    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      result.platforms.chatgpt.score * 0.35 +
      result.platforms.perplexity.score * 0.30 +
      result.platforms.googleAio.score * 0.35
    );

    return {
      url,
      domain,
      checkedAt: new Date().toISOString(),
      platforms: {
        chatgpt: {
          platform: "chatgpt",
          platformName: "ChatGPT",
          score: result.platforms.chatgpt.score,
          confidence: result.platforms.chatgpt.confidence as "high" | "medium" | "low",
          strengths: result.platforms.chatgpt.strengths,
          improvements: result.platforms.chatgpt.improvements,
        },
        perplexity: {
          platform: "perplexity",
          platformName: "Perplexity AI",
          score: result.platforms.perplexity.score,
          confidence: result.platforms.perplexity.confidence as "high" | "medium" | "low",
          strengths: result.platforms.perplexity.strengths,
          improvements: result.platforms.perplexity.improvements,
        },
        googleAio: {
          platform: "google_aio",
          platformName: "Google AI Overviews",
          score: result.platforms.googleAio.score,
          confidence: result.platforms.googleAio.confidence as "high" | "medium" | "low",
          strengths: result.platforms.googleAio.strengths,
          improvements: result.platforms.googleAio.improvements,
        },
      },
      overallScore,
      factors: result.factors,
      quickWins: result.quickWins,
      location: result.location,
    };
  }

  /**
   * Quick score check (faster, less detailed)
   */
  async quickCheck(url: string): Promise<{
    overallScore: number;
    chatgpt: number;
    perplexity: number;
    googleAio: number;
    topImprovement: string;
  }> {
    const prompt = `Quick GEO visibility score for ${url}:
Return JSON: { "chatgpt": 0-100, "perplexity": 0-100, "googleAio": 0-100, "topImprovement": "one quick win" }`;

    const result = await openai.getJSON<{
      chatgpt: number;
      perplexity: number;
      googleAio: number;
      topImprovement: string;
    }>(prompt);

    return {
      overallScore: Math.round(
        result.chatgpt * 0.35 + result.perplexity * 0.30 + result.googleAio * 0.35
      ),
      ...result,
    };
  }

  /**
   * Compare before/after content changes
   */
  async compareVersions(
    url: string,
    beforeContent: string,
    afterContent: string
  ): Promise<{
    beforeScore: number;
    afterScore: number;
    improvement: number;
    changes: string[];
  }> {
    const prompt = `Compare these two versions of content for GEO visibility improvement:

BEFORE:
${beforeContent.slice(0, 2000)}

AFTER:
${afterContent.slice(0, 2000)}

Return JSON: {
  "beforeScore": 0-100,
  "afterScore": 0-100,
  "changes": ["what improved", "what still needs work"]
}`;

    const result = await openai.getJSON<{
      beforeScore: number;
      afterScore: number;
      changes: string[];
    }>(prompt);

    return {
      ...result,
      improvement: result.afterScore - result.beforeScore,
    };
  }
}

// ============================================
// SINGLETON + EXPORTS
// ============================================

export const visibilityChecker = new AIVisibilityChecker();

// Also export the newer naming for consistency
export const geoVisibilityChecker = visibilityChecker;
