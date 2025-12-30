/**
 * AI Module for CabbageSEO
 * 
 * NOW USES OPENAI (GPT-4o-mini) instead of Claude
 * - Faster response times
 * - More reliable API
 * - Better cost efficiency
 * 
 * Exports:
 * - claude: AI client (now OpenAI, kept name for compatibility)
 * - contentPipeline: High-level content generation
 * - PROMPTS: SEO-optimized prompt templates
 * 
 * Usage:
 * ```ts
 * import { contentPipeline, claude } from "@/lib/ai";
 * 
 * // High-level: Generate full article
 * const article = await contentPipeline.generateFullContent(keyword, serpResults);
 * 
 * // Low-level: Custom chat
 * const response = await claude.chat([{ role: "user", content: "..." }]);
 * ```
 */

// Core client - NOW USING OPENAI
export { 
  OpenAIClient as ClaudeClient,  // Backward compatible alias
  OpenAIClient,
  claude,
  openai,
  RateLimitError,
  OverloadedError,
  AuthenticationError,
  UsageLimitError,
  type AIModel as ClaudeModel,   // Backward compatible alias
  type AIModel,
} from "./openai-client";

// Content pipeline
export {
  ContentPipeline,
  contentPipeline,
  type ContentOutline,
  type GeneratedContent,
  type ContentIdea,
  type KeywordCluster,
  type ContentAnalysis,
  type PipelineOptions,
  type AIOAnalysisResult,
} from "./content-pipeline";

// Prompts
export { PROMPTS, estimateTokens, truncateForTokens } from "./prompts";

// Usage tracking (Cursor-style billing)
export { 
  withUsageTracking, 
  preCheckUsage, 
  getEstimatedCost,
} from "./with-usage";
