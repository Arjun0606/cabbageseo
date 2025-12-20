/**
 * Unified SEO Data Service for CabbageSEO
 * 
 * Orchestrates DataForSEO and SerpAPI:
 * - DataForSEO: Keyword metrics, search volume, difficulty
 * - SerpAPI: SERP analysis, competitor data, PAA questions
 * 
 * Includes:
 * - Usage tracking for billing
 * - Graceful fallbacks
 * - Caching (TODO: Redis in production)
 * - Rate limiting per provider
 */

import { dataForSEO, DataForSEOClient } from "@/lib/integrations/dataforseo/client";
import { serpapi, SerpAPIClient } from "@/lib/integrations/serpapi/client";
import { recordSpending } from "@/lib/billing/wallet-monitor";

// Cost per API call (in cents) - adjust based on actual pricing
const API_COSTS = {
  dataforseo: {
    keywordData: 0.5,        // ~$0.005 per keyword
    keywordSuggestions: 1,   // ~$0.01 per request
    serpAnalysis: 2,         // ~$0.02 per request
    competitorKeywords: 2,   // ~$0.02 per request
    keywordGap: 3,           // ~$0.03 per request
  },
  serpapi: {
    search: 1,               // ~$0.01 per search (100 free/month then $50/5000)
    autocomplete: 0.5,       // ~$0.005 per request
    trends: 1,               // ~$0.01 per request
  },
};

// Simple in-memory cache (use Redis in production)
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
  volume: number;
  difficulty: number;
  cpc: number;
  competition: number;
  intent: "informational" | "commercial" | "transactional" | "navigational";
  trend?: "up" | "down" | "stable";
  serpFeatures?: string[];
}

export interface SerpResult {
  position: number;
  url: string;
  title: string;
  description: string;
  domain: string;
}

export interface SerpAnalysis {
  keyword: string;
  totalResults: number;
  organicResults: SerpResult[];
  peopleAlsoAsk: string[];
  relatedSearches: string[];
  serpFeatures: string[];
  hasLocalPack: boolean;
  hasKnowledgeGraph: boolean;
  hasAds: boolean;
  difficulty?: number;
}

export interface CompetitorAnalysis {
  domain: string;
  keywords: KeywordData[];
  topPages: Array<{ url: string; traffic: number; keywords: number }>;
  overlap: number;  // Percentage of keyword overlap with your site
}

export interface KeywordGapResult {
  keyword: string;
  volume: number;
  difficulty: number;
  yourPosition: number | null;
  competitorPositions: Array<{ domain: string; position: number }>;
  opportunity: "high" | "medium" | "low";
}

export interface ResearchOptions {
  location?: string;
  language?: string;
  country?: string;
  limit?: number;
}

// ============================================
// SEO DATA SERVICE
// ============================================

export class SEODataService {
  private dataForSEO: DataForSEOClient;
  private serpAPI: SerpAPIClient;
  private trackUsage: boolean;

  constructor(options: { trackUsage?: boolean } = {}) {
    this.dataForSEO = dataForSEO;
    this.serpAPI = serpapi;
    this.trackUsage = options.trackUsage ?? true;
  }

  /**
   * Track API cost for billing
   */
  private trackCost(provider: "dataforseo" | "serpapi", action: string, multiplier: number = 1): void {
    if (!this.trackUsage) return;
    
    const costs = API_COSTS[provider];
    const cost = (costs[action as keyof typeof costs] || 1) * multiplier;
    recordSpending(cost);
  }

  /**
   * Check which providers are configured
   */
  getProviderStatus(): {
    dataForSEO: boolean;
    serpAPI: boolean;
    anyAvailable: boolean;
  } {
    const dataForSEOConfigured = Boolean(
      process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD
    );
    const serpAPIConfigured = this.serpAPI.isConfigured();

    return {
      dataForSEO: dataForSEOConfigured,
      serpAPI: serpAPIConfigured,
      anyAvailable: dataForSEOConfigured || serpAPIConfigured,
    };
  }

  // ============================================
  // KEYWORD RESEARCH
  // ============================================

  /**
   * Get keyword metrics (volume, difficulty, CPC)
   * Requires DataForSEO - no mock data fallback
   */
  async getKeywordMetrics(
    keywords: string[],
    options: ResearchOptions = {}
  ): Promise<KeywordData[]> {
    const cacheKey = `metrics:${keywords.join(",")}:${options.location || "US"}`;
    const cached = getCached<KeywordData[]>(cacheKey);
    if (cached) return cached;

    const status = this.getProviderStatus();

    if (status.dataForSEO) {
      try {
        this.trackCost("dataforseo", "keywordData", keywords.length);
        const data = await this.dataForSEO.getKeywordData(
          keywords,
          options.location || "United States",
          options.language || "en"
        );
        
        const result = data.map(d => ({
          ...d,
          intent: this.normalizeIntent(d.intent),
        }));
        
        setCache(cacheKey, result);
        return result;
      } catch (error) {
        console.error("DataForSEO error:", error);
        // Fall through to error - no mock data
      }
    }

    // Require real API - no mock data
    throw new Error("DataForSEO not configured. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in environment.");
  }

  /**
   * Get keyword suggestions/related keywords
   * Primary: DataForSEO | Fallback: SerpAPI autocomplete
   */
  async getKeywordSuggestions(
    seedKeyword: string,
    options: ResearchOptions = {}
  ): Promise<KeywordData[]> {
    const cacheKey = `suggestions:${seedKeyword}:${options.location || "US"}`;
    const cached = getCached<KeywordData[]>(cacheKey);
    if (cached) return cached;

    const status = this.getProviderStatus();

    // Try DataForSEO first (has volume data)
    if (status.dataForSEO) {
      try {
        this.trackCost("dataforseo", "keywordSuggestions");
        const suggestions = await this.dataForSEO.getKeywordSuggestions(
          seedKeyword,
          options.location || "United States",
          options.limit || 100
        );
        
        const result = suggestions.map(s => ({
          ...s,
          intent: this.normalizeIntent(s.intent),
        }));
        
        setCache(cacheKey, result);
        return result;
      } catch (error) {
        console.error("DataForSEO suggestion error:", error);
      }
    }

    // Fallback to SerpAPI autocomplete (no volume data)
    if (status.serpAPI) {
      try {
        this.trackCost("serpapi", "autocomplete", 5); // Multiple calls
        const suggestions = await this.serpAPI.getKeywordSuggestions(seedKeyword, {
          language: options.language || "en",
          country: options.country || "us",
        });
        
        // No volume data from autocomplete, return with 0s
        const result = suggestions.slice(0, options.limit || 100).map(s => ({
          keyword: s,
          volume: 0,
          difficulty: 0,
          cpc: 0,
          competition: 0,
          intent: "informational" as const,
        }));
        
        setCache(cacheKey, result);
        return result;
      } catch (error) {
        console.error("SerpAPI autocomplete error:", error);
      }
    }

    // No mock data - require real API
    throw new Error("SEO APIs not configured. Set DATAFORSEO or SERPAPI credentials in environment.");
  }

  // ============================================
  // SERP ANALYSIS
  // ============================================

  /**
   * Analyze SERP for a keyword
   * Primary: SerpAPI (richer data) | Fallback: DataForSEO
   */
  async analyzeSERP(
    keyword: string,
    options: ResearchOptions = {}
  ): Promise<SerpAnalysis> {
    const cacheKey = `serp:${keyword}:${options.location || "US"}`;
    const cached = getCached<SerpAnalysis>(cacheKey);
    if (cached) return cached;

    const status = this.getProviderStatus();

    // Try SerpAPI first (has PAA, related searches, etc.)
    if (status.serpAPI) {
      try {
        this.trackCost("serpapi", "search");
        const analysis = await this.serpAPI.analyzeSERP(keyword, {
          location: options.location,
          language: options.language,
          country: options.country,
          numResults: options.limit || 10,
        });
        
        setCache(cacheKey, analysis);
        return analysis;
      } catch (error) {
        console.error("SerpAPI SERP error:", error);
      }
    }

    // Fallback to DataForSEO
    if (status.dataForSEO) {
      try {
        this.trackCost("dataforseo", "serpAnalysis");
        const analysis = await this.dataForSEO.analyzeSERP(
          keyword,
          options.location || "United States"
        );
        
        const result: SerpAnalysis = {
          keyword: analysis.keyword,
          totalResults: analysis.totalResults,
          organicResults: analysis.results,
          peopleAlsoAsk: [],
          relatedSearches: [],
          serpFeatures: analysis.serpFeatures,
          hasLocalPack: analysis.serpFeatures.includes("local_pack"),
          hasKnowledgeGraph: analysis.serpFeatures.includes("knowledge_graph"),
          hasAds: analysis.serpFeatures.includes("ads"),
        };
        
        setCache(cacheKey, result);
        return result;
      } catch (error) {
        console.error("DataForSEO SERP error:", error);
      }
    }

    // No mock data - require real API
    throw new Error("SEO APIs not configured. Set DATAFORSEO or SERPAPI credentials in environment.");
  }

  /**
   * Get "People Also Ask" questions for content ideas
   */
  async getQuestions(
    keyword: string,
    options: ResearchOptions = {}
  ): Promise<string[]> {
    const serp = await this.analyzeSERP(keyword, options);
    return serp.peopleAlsoAsk;
  }

  /**
   * Get related searches
   */
  async getRelatedSearches(
    keyword: string,
    options: ResearchOptions = {}
  ): Promise<string[]> {
    const serp = await this.analyzeSERP(keyword, options);
    return serp.relatedSearches;
  }

  // ============================================
  // COMPETITOR ANALYSIS
  // ============================================

  /**
   * Get competitor's keywords
   */
  async getCompetitorKeywords(
    domain: string,
    options: ResearchOptions = {}
  ): Promise<KeywordData[]> {
    const cacheKey = `competitor:${domain}`;
    const cached = getCached<KeywordData[]>(cacheKey);
    if (cached) return cached;

    const status = this.getProviderStatus();

    if (status.dataForSEO) {
      try {
        this.trackCost("dataforseo", "competitorKeywords");
        const keywords = await this.dataForSEO.getCompetitorKeywords(
          domain,
          options.limit || 100
        );
        
        const result = keywords.map(k => ({
          ...k,
          intent: this.normalizeIntent(k.intent),
        }));
        
        setCache(cacheKey, result);
        return result;
      } catch (error) {
        console.error("Competitor keywords error:", error);
      }
    }

    throw new Error("DataForSEO not configured. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in environment.");
  }

  /**
   * Get keyword gap analysis
   */
  async getKeywordGap(
    yourDomain: string,
    competitorDomains: string[],
    options: ResearchOptions = {}
  ): Promise<KeywordGapResult[]> {
    const status = this.getProviderStatus();

    if (status.dataForSEO) {
      try {
        this.trackCost("dataforseo", "keywordGap");
        const gap = await this.dataForSEO.getKeywordGap(yourDomain, competitorDomains);
        
        return gap.map(k => ({
          keyword: k.keyword,
          volume: k.volume,
          difficulty: k.difficulty,
          yourPosition: null,
          competitorPositions: competitorDomains.map(d => ({ domain: d, position: 0 })),
          opportunity: this.calculateOpportunity(k.volume, k.difficulty),
        }));
      } catch (error) {
        console.error("Keyword gap error:", error);
      }
    }

    return [];
  }

  /**
   * Check ranking for a domain
   */
  async checkRanking(
    keyword: string,
    domain: string,
    options: ResearchOptions = {}
  ): Promise<{
    keyword: string;
    domain: string;
    position: number | null;
    url: string | null;
  }> {
    const status = this.getProviderStatus();

    if (status.serpAPI) {
      try {
        this.trackCost("serpapi", "search");
        const result = await this.serpAPI.checkRanking(keyword, domain, {
          location: options.location,
          maxResults: 100,
        });
        
        return {
          keyword: result.keyword,
          domain: result.domain,
          position: result.ranking,
          url: result.url,
        };
      } catch (error) {
        console.error("Ranking check error:", error);
      }
    }

    return {
      keyword,
      domain,
      position: null,
      url: null,
    };
  }

  // ============================================
  // HELPERS
  // ============================================

  private normalizeIntent(intent: string): "informational" | "commercial" | "transactional" | "navigational" {
    const normalized = intent?.toLowerCase() || "informational";
    if (["commercial", "transactional", "navigational"].includes(normalized)) {
      return normalized as "commercial" | "transactional" | "navigational";
    }
    return "informational";
  }

  private calculateOpportunity(volume: number, difficulty: number): "high" | "medium" | "low" {
    const score = (volume / 1000) * (100 - difficulty) / 100;
    if (score > 50) return "high";
    if (score > 20) return "medium";
    return "low";
  }

}

// ============================================
// SINGLETON EXPORT
// ============================================

export const seoData = new SEODataService();

