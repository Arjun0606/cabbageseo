/**
 * CabbageSEO - GEO Orchestration Layer
 * 
 * 100% AI-POWERED for Generative Engine Optimization
 * 
 * Focus: Getting cited by AI platforms
 * - ChatGPT
 * - Perplexity
 * - Google AI Overviews
 * 
 * Location-aware content optimization included.
 */

// GEO Data Service (AI-powered, no third-party tools)
export { seoData, SEODataService, type KeywordData, type GEOAnalysis } from "./data-service";

// Internal Linking (improves AI crawlability)
export { 
  InternalLinkingEngine, 
  internalLinking,
  type PageForLinking,
  type LinkSuggestion,
  type LinkingAnalysis,
  type LinkOpportunity,
} from "./internal-linking";

// Content Refresh (keep content fresh for AI)
export {
  ContentRefreshEngine,
  contentRefresh,
  type ContentForRefresh,
  type RefreshCandidate,
  type RefreshPlan,
  type RefreshReason,
  type TitleVariant,
} from "./content-refresh";
