/**
 * SEO Module for CabbageSEO
 * 
 * Unified access to SEO data and research:
 * - Keyword metrics & suggestions
 * - SERP analysis
 * - Competitor research
 * - Keyword gap analysis
 * 
 * Usage:
 * ```ts
 * import { seoData, KeywordData, SerpAnalysis } from "@/lib/seo";
 * 
 * // Get keyword metrics
 * const metrics = await seoData.getKeywordMetrics(["keyword1", "keyword2"]);
 * 
 * // Get suggestions
 * const suggestions = await seoData.getKeywordSuggestions("coffee");
 * 
 * // Analyze SERP
 * const serp = await seoData.analyzeSERP("best coffee shops");
 * ```
 */

export {
  SEODataService,
  seoData,
  type KeywordData,
  type SerpResult,
  type SerpAnalysis,
  type CompetitorAnalysis,
  type KeywordGapResult,
  type ResearchOptions,
} from "./data-service";

