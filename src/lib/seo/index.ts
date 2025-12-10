/**
 * CabbageSEO - SEO Orchestration Layer
 * 
 * This is where we bring everything together.
 * We DON'T rebuild SEO tools.
 * We INTEGRATE and ORCHESTRATE existing solutions.
 */

// Unified SEO Data Service (DataForSEO + SerpAPI)
export { seoData, SEODataService } from "./data-service";

// Backlink Service (Ahrefs alternative - DataForSEO + GSC + Claude)
export {
  BacklinkService,
  backlinks,
  type BacklinkProfile,
  type CompetitorAnalysis,
  type LinkGapOpportunity,
} from "./backlink-service";

// Internal Linking (LinkWhisper-style)
export { 
  InternalLinkingEngine, 
  internalLinking,
  type PageForLinking,
  type LinkSuggestion,
  type LinkingAnalysis,
  type LinkOpportunity,
} from "./internal-linking";

// Content Refresh (auto-detect stale content)
export {
  ContentRefreshEngine,
  contentRefresh,
  type ContentForRefresh,
  type RefreshCandidate,
  type RefreshPlan,
  type RefreshReason,
  type TitleVariant,
} from "./content-refresh";

// Backlink Outreach (Hunter + Instantly orchestration)
export {
  OutreachOrchestrator,
  outreach,
  type OutreachTarget,
  type OutreachReason,
  type OutreachCampaign,
  type OutreachEmail,
  type OutreachProspect,
} from "./outreach-orchestrator";
