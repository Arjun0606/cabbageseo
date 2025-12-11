/**
 * AIO (AI Optimization) Module
 * 
 * Optimizes content for AI search platforms:
 * - Google AI Overviews
 * - ChatGPT / SearchGPT
 * - Perplexity AI
 * - Claude-based search
 * - Google Gemini
 */

// Types
export * from "./types";

// Platform Analyzers
export {
  BasePlatformAnalyzer,
  GoogleAIOAnalyzer,
  ChatGPTAnalyzer,
  PerplexityAnalyzer,
  ClaudeAnalyzer,
  GeminiAnalyzer,
  googleAIOAnalyzer,
  chatgptAnalyzer,
  perplexityAnalyzer,
  claudeAnalyzer,
  geminiAnalyzer,
  platformAnalyzers,
} from "./platforms";

// Visibility Score Calculator
export {
  AIOVisibilityAnalyzer,
  createAIOAnalyzer,
  calculateCombinedScore,
  type VisibilityScoreOptions,
} from "./visibility-score";

