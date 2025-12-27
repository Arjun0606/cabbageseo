/**
 * AIO (AI Optimization) Types
 * Core types for AI search visibility scoring and optimization
 */

// ============================================
// PLATFORM TYPES
// ============================================

export type AIOPlatform = 
  | "google_aio"    // Google AI Overviews
  | "chatgpt"       // ChatGPT / SearchGPT
  | "perplexity"    // Perplexity AI
  | "bing_copilot"; // Bing Copilot

// All platforms (including legacy bing_copilot for type compatibility)
export const AIO_PLATFORMS: AIOPlatform[] = [
  "google_aio",
  "chatgpt", 
  "perplexity",
  "bing_copilot",
];

// Platforms shown in the UI (excludes Bing - no API available)
export const VISIBLE_AIO_PLATFORMS: AIOPlatform[] = [
  "google_aio",
  "chatgpt", 
  "perplexity",
];

export const PLATFORM_LABELS: Record<AIOPlatform, string> = {
  google_aio: "Google AI Overviews",
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  bing_copilot: "Bing Copilot", // Legacy - not shown in UI
};

// Platform weights for combined score (must sum to 1.0)
// Only includes platforms we actually track
export const PLATFORM_WEIGHTS: Record<AIOPlatform, number> = {
  google_aio: 0.45,   // 45% - Most important (Google still dominates search)
  chatgpt: 0.35,      // 35% - Largest AI user base (200M+ weekly)
  perplexity: 0.20,   // 20% - Growing fast in AI search
  bing_copilot: 0.00, // 0% - Not tracked (API not available)
};

// ============================================
// SCORE TYPES
// ============================================

export interface PlatformScore {
  platform: AIOPlatform;
  score: number; // 0-100
  factors: ScoreFactor[];
  recommendations: Recommendation[];
}

export interface ScoreFactor {
  name: string;
  score: number; // 0-100
  weight: number; // Contribution to platform score
  description: string;
}

export interface Recommendation {
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  impact: string; // Expected score improvement
  autoFixable: boolean;
  action?: string; // Action code for auto-fix
}

export interface AIOScores {
  combined: number; // Weighted average (0-100)
  platforms: Record<AIOPlatform, number>;
  breakdown: {
    entityDensity: number;
    quotability: number;
    answerStructure: number;
    schemaPresence: number;
    freshness: number;
    authority: number;
  };
}

// ============================================
// ENTITY TYPES
// ============================================

export type EntityType = 
  | "person"
  | "organization"
  | "product"
  | "concept"
  | "location"
  | "event"
  | "technology"
  | "other";

export interface ExtractedEntity {
  name: string;
  type: EntityType;
  mentions: number;
  contextQuality: number; // 0-100, how well explained
  wikidataId?: string;
  wikipediaUrl?: string;
  description?: string;
}

// ============================================
// CONTENT ANALYSIS TYPES
// ============================================

export interface QuotableSnippet {
  text: string;
  type: "definition" | "fact" | "statistic" | "step" | "answer" | "key_point";
  position: number; // Character position in content
  quotabilityScore: number; // 0-100
}

export interface ContentStructure {
  hasDirectAnswer: boolean;
  hasKeyTakeaways: boolean;
  hasFAQSection: boolean;
  hasHowToSection: boolean;
  hasStepByStep: boolean;
  hasExpertAttribution: boolean;
  hasStatistics: boolean;
  hasDefinitions: boolean;
  headingHierarchy: "good" | "fair" | "poor";
  paragraphStructure: "good" | "fair" | "poor"; // Short, quotable paragraphs
}

export interface MissingElement {
  element: string;
  importance: "critical" | "high" | "medium" | "low";
  description: string;
  suggestion: string;
}

// ============================================
// ANALYSIS RESULT TYPES
// ============================================

export interface AIOAnalysisInput {
  url: string;
  title: string;
  content: string; // Raw text content
  htmlContent?: string; // Full HTML for schema detection
  metaDescription?: string;
  headings?: { level: number; text: string }[];
  publishedAt?: Date;
  lastModified?: Date;
  wordCount?: number;
  existingSchema?: object[];
}

export interface AIOAnalysisResult {
  // Scores
  scores: AIOScores;
  platformScores: PlatformScore[];
  
  // Entities
  entities: ExtractedEntity[];
  entityDensity: number; // Entities per 1000 words
  
  // Quotability
  quotableSnippets: QuotableSnippet[];
  quotabilityScore: number;
  
  // Structure
  contentStructure: ContentStructure;
  answerStructureScore: number;
  
  // Missing elements
  missingElements: MissingElement[];
  
  // Aggregated recommendations
  recommendations: Recommendation[];
  
  // Metadata
  analyzedAt: Date;
  modelUsed: string;
  tokensUsed: number;
  analysisDurationMs: number;
}

// ============================================
// CITATION TYPES
// ============================================

export type CitationType = 
  | "direct_quote"
  | "paraphrase" 
  | "source_link"
  | "featured";

export interface AICitation {
  platform: AIOPlatform;
  query: string;
  citationType: CitationType;
  snippet?: string;
  position?: number;
  confidence: number;
  discoveredAt: Date;
}

// ============================================
// OPTIMIZATION TYPES
// ============================================

export type OptimizationMode = "seo" | "aio" | "balanced";

export interface AIOOptimizationOptions {
  mode: OptimizationMode;
  targetPlatforms: AIOPlatform[];
  includeEntities: boolean;
  addFAQSection: boolean;
  addKeyTakeaways: boolean;
  optimizeQuotability: boolean;
  addExpertAttribution: boolean;
}

export interface AIOOptimizationSuggestion {
  type: "add" | "modify" | "remove";
  element: string;
  before?: string;
  after: string;
  reason: string;
  platformImpact: Partial<Record<AIOPlatform, number>>; // Expected score change
}

