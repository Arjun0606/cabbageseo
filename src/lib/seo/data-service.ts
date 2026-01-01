/**
 * GEO Data Service for CabbageSEO
 * 
 * 100% AI-POWERED - No third-party SEO tools
 * 
 * Focus: Generative Engine Optimization (GEO)
 * - Getting cited by ChatGPT, Perplexity, Google AI
 * - Location/context-aware optimization
 * - Semantic keyword intelligence
 * 
 * Only dependency: OpenAI (GPT-5-mini)
 */

import { keywordIntelligence, type AIKeyword } from "@/lib/ai/keyword-intelligence";
import { recordSpending } from "@/lib/billing/wallet-monitor";

// Cost per API call (in cents) - GPT-5-mini pricing (Jan 2026)
const API_COSTS = {
  keywordResearch: 1,      // ~$0.01 per full research
  keywordSuggestions: 0.5, // ~$0.005 per quick suggestions
  geoAnalysis: 0.3,        // ~$0.003 per GEO analysis
  competitorAnalysis: 1,   // ~$0.01 per competitor
  questionResearch: 0.3,   // ~$0.003 per question set
};

// Simple in-memory cache
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown, ttl: number = CACHE_TTL): void {
  cache.set(key, { data, expiresAt: Date.now() + ttl });
}

// ============================================
// TYPES
// ============================================

export interface KeywordData {
  keyword: string;
  volume: number;           // AI-estimated (high/medium/low → number)
  difficulty: number;       // AI-estimated
  intent: "informational" | "commercial" | "transactional" | "navigational";
  geoOpportunity: number;   // 0-100 score for AI citation potential
  questions: string[];      // Related questions AI engines answer
  entities: string[];       // Named entities for optimization
}

export interface GEOAnalysis {
  topic: string;
  location?: string;        // For location-aware optimization
  
  // AI citation scores (0-100)
  chatgptScore: number;
  perplexityScore: number;
  googleAiScore: number;
  overallScore: number;
  
  // What AI engines look for
  questionsToAnswer: string[];
  entitiesToInclude: string[];
  factsToMention: string[];
  structureRecommendations: string[];
  
  // Location-specific considerations
  locationContext?: {
    region: string;
    localEntities: string[];
    culturalConsiderations: string[];
  };
}

export interface ResearchOptions {
  location?: string;        // e.g., "India", "Germany", "United States"
  language?: string;
  limit?: number;
}

// ============================================
// GEO DATA SERVICE
// ============================================

export class SEODataService {
  private trackUsage: boolean;

  constructor(options: { trackUsage?: boolean } = {}) {
    this.trackUsage = options.trackUsage ?? true;
  }

  /**
   * Track API cost for billing
   */
  private trackCost(action: keyof typeof API_COSTS, multiplier: number = 1): void {
    if (!this.trackUsage) return;
    const cost = (API_COSTS[action] || 1) * multiplier;
    recordSpending(cost);
  }

  /**
   * Check if AI is configured
   */
  isConfigured(): boolean {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  // ============================================
  // KEYWORD INTELLIGENCE (AI-Powered)
  // ============================================

  /**
   * Get keyword suggestions with GEO opportunity scores
   */
  async getKeywordSuggestions(
    seedKeyword: string,
    options: ResearchOptions = {}
  ): Promise<KeywordData[]> {
    const cacheKey = `kw:${seedKeyword}:${options.location || "global"}`;
    const cached = getCached<KeywordData[]>(cacheKey);
    if (cached) return cached;

    this.trackCost("keywordSuggestions");

    const aiKeywords = await keywordIntelligence.getSuggestions(
      seedKeyword,
      options.limit || 30
    );

    const volumeMap: Record<string, number> = { high: 5000, medium: 1000, low: 200 };
    const difficultyMap: Record<string, number> = { easy: 25, medium: 50, hard: 75 };

    const result: KeywordData[] = aiKeywords.map((k: AIKeyword) => ({
      keyword: k.keyword,
      volume: volumeMap[k.estimatedVolume] || 500,
      difficulty: difficultyMap[k.difficulty] || 50,
      intent: k.intent,
      geoOpportunity: k.geoOpportunity,
      questions: k.questions || [],
      entities: k.entities || [],
    }));

    setCache(cacheKey, result);
    return result;
  }

  /**
   * Full keyword research with clustering
   */
  async researchKeywords(
    seedKeyword: string,
    options: ResearchOptions = {}
  ): Promise<{
    keywords: KeywordData[];
    clusters: Array<{
      name: string;
      pillarKeyword: string;
      keywords: KeywordData[];
      suggestedArticles: number;
    }>;
    topQuestions: string[];
    contentGaps: string[];
  }> {
    this.trackCost("keywordResearch");

    const result = await keywordIntelligence.research(seedKeyword, {
      siteContext: {
        domain: options.location ? `site in ${options.location}` : undefined,
      },
      limit: options.limit || 30,
    });

    const volumeMap: Record<string, number> = { high: 5000, medium: 1000, low: 200 };
    const difficultyMap: Record<string, number> = { easy: 25, medium: 50, hard: 75 };

    const keywords: KeywordData[] = result.keywords.map(k => ({
      keyword: k.keyword,
      volume: volumeMap[k.estimatedVolume] || 500,
      difficulty: difficultyMap[k.difficulty] || 50,
      intent: k.intent,
      geoOpportunity: k.geoOpportunity,
      questions: k.questions || [],
      entities: k.entities || [],
    }));

    const clusters = result.clusters.map(c => ({
      name: c.name,
      pillarKeyword: c.pillarKeyword,
      keywords: c.keywords.map(k => ({
        keyword: k.keyword,
        volume: volumeMap[k.estimatedVolume] || 500,
        difficulty: difficultyMap[k.difficulty] || 50,
        intent: k.intent,
        geoOpportunity: k.geoOpportunity,
        questions: k.questions || [],
        entities: k.entities || [],
      })),
      suggestedArticles: c.suggestedArticles,
    }));

    return {
      keywords,
      clusters,
      topQuestions: result.topQuestions,
      contentGaps: result.contentGaps,
    };
  }

  /**
   * Get questions AI engines answer about a topic
   * These are high-value for getting cited
   */
  async getAIQuestions(
    topic: string,
    options: ResearchOptions = {}
  ): Promise<string[]> {
    const cacheKey = `q:${topic}:${options.location || "global"}`;
    const cached = getCached<string[]>(cacheKey);
    if (cached) return cached;

    this.trackCost("questionResearch");

    const questions = await keywordIntelligence.getAIQuestions(
      options.location ? `${topic} in ${options.location}` : topic,
      options.limit || 10
    );

    setCache(cacheKey, questions);
    return questions;
  }

  /**
   * Analyze competitor for GEO opportunities
   */
  async analyzeCompetitor(
    competitorDomain: string,
    options: ResearchOptions = {}
  ): Promise<{
    keywords: KeywordData[];
    contentGaps: string[];
    strengthAreas: string[];
  }> {
    this.trackCost("competitorAnalysis");

    const result = await keywordIntelligence.analyzeCompetitor(competitorDomain, {
      limit: options.limit || 20,
    });

    const volumeMap: Record<string, number> = { high: 5000, medium: 1000, low: 200 };
    const difficultyMap: Record<string, number> = { easy: 25, medium: 50, hard: 75 };

    return {
      keywords: result.keywords.map(k => ({
        keyword: k.keyword,
        volume: volumeMap[k.estimatedVolume] || 500,
        difficulty: difficultyMap[k.difficulty] || 50,
        intent: k.intent,
        geoOpportunity: k.geoOpportunity,
        questions: k.questions || [],
        entities: k.entities || [],
      })),
      contentGaps: result.contentGaps,
      strengthAreas: result.strengthAreas,
    };
  }

  // ============================================
  // LOCATION-AWARE GEO ANALYSIS
  // ============================================

  /**
   * Analyze topic for GEO optimization with location awareness
   * 
   * Example: "taxi service" in India → Ola, Uber
   * Example: "taxi service" in Germany → FreeNow, Uber
   */
  async analyzeForGEO(
    topic: string,
    location?: string
  ): Promise<GEOAnalysis> {
    this.trackCost("geoAnalysis");

    const { openai } = await import("@/lib/ai/openai-client");

    const locationContext = location
      ? `The user is in ${location}. Provide location-specific recommendations.`
      : "Provide global recommendations.";

    const prompt = `Analyze this topic for GEO (Generative Engine Optimization):

Topic: "${topic}"
${location ? `Location: ${location}` : ""}

GEO is about getting content cited by AI engines (ChatGPT, Perplexity, Google AI).

${locationContext}

Analyze:
1. How likely would content about this be cited by each AI platform? (score 0-100)
2. What questions do users ask that AI would answer about this?
3. What entities (people, companies, places, concepts) should be mentioned?
4. What facts/statistics would make content more citable?
5. How should content be structured for AI extraction?
${location ? "6. What location-specific entities, companies, or cultural considerations apply?" : ""}

Return JSON:
{
  "chatgptScore": number,
  "perplexityScore": number,
  "googleAiScore": number,
  "questionsToAnswer": ["question1", "question2", ...],
  "entitiesToInclude": ["entity1", "entity2", ...],
  "factsToMention": ["fact1", "fact2", ...],
  "structureRecommendations": ["use FAQ schema", "include definitions", ...],
  ${location ? '"locationContext": {"region": "...", "localEntities": [...], "culturalConsiderations": [...]}' : ""}
}`;

    const response = await openai.getJSON<{
      chatgptScore: number;
      perplexityScore: number;
      googleAiScore: number;
      questionsToAnswer: string[];
      entitiesToInclude: string[];
      factsToMention: string[];
      structureRecommendations: string[];
      locationContext?: {
        region: string;
        localEntities: string[];
        culturalConsiderations: string[];
      };
    }>(prompt);

    return {
      topic,
      location,
      chatgptScore: response.chatgptScore,
      perplexityScore: response.perplexityScore,
      googleAiScore: response.googleAiScore,
      overallScore: Math.round(
        (response.chatgptScore + response.perplexityScore + response.googleAiScore) / 3
      ),
      questionsToAnswer: response.questionsToAnswer,
      entitiesToInclude: response.entitiesToInclude,
      factsToMention: response.factsToMention,
      structureRecommendations: response.structureRecommendations,
      locationContext: response.locationContext,
    };
  }

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Get high-GEO-opportunity keywords (likely to get AI citations)
   */
  async getGEOOpportunities(
    seedKeyword: string,
    options: ResearchOptions = {}
  ): Promise<KeywordData[]> {
    const keywords = await this.getKeywordSuggestions(seedKeyword, options);
    
    // Filter for high GEO opportunity (score > 60)
    return keywords
      .filter(k => k.geoOpportunity > 60)
      .sort((a, b) => b.geoOpportunity - a.geoOpportunity);
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const seoData = new SEODataService();
