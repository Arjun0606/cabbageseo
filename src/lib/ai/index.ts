/**
 * AI Module for CabbageSEO
 * 
 * Exports:
 * - claude: Low-level Claude client with rate limiting
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

// Core client
export { 
  ClaudeClient, 
  claude,
  RateLimitError,
  OverloadedError,
  AuthenticationError,
  UsageLimitError,
  type ClaudeModel,
} from "./claude-client";

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
} from "./content-pipeline";

// Prompts
export { PROMPTS, estimateTokens, truncateForTokens } from "./prompts";

