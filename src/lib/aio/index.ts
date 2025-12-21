/**
 * AIO (AI Optimization) Module
 * 
 * Optimizes content for AI search platforms:
 * - Google AI Overviews
 * - ChatGPT / SearchGPT
 * - Perplexity AI
 * - Bing Copilot
 */

// Types
export * from "./types";

// Platform Analyzers
export {
  BasePlatformAnalyzer,
  GoogleAIOAnalyzer,
  ChatGPTAnalyzer,
  PerplexityAnalyzer,
  BingCopilotAnalyzer,
  googleAIOAnalyzer,
  chatgptAnalyzer,
  perplexityAnalyzer,
  bingCopilotAnalyzer,
  platformAnalyzers,
} from "./platforms";

// Visibility Score Calculator
export {
  AIOVisibilityAnalyzer,
  createAIOAnalyzer,
  calculateCombinedScore,
  type VisibilityScoreOptions,
} from "./visibility-score";

// AIO Audit Engine
export {
  AIOAuditEngine,
  createAIOAuditEngine,
  type AIOIssue,
  type AIOAuditResult,
  type AIOAuditSummary,
  type AIOIssueType,
  type AIOIssueSeverity,
  type AIOIssueCategory,
} from "./aio-audit";

// Real AI Visibility Checker
export {
  AIVisibilityChecker,
  visibilityChecker,
  type VisibilityCheckResult,
  type PlatformVisibilityResult,
  type CitationResult,
  type VisibilityCheckOptions,
} from "./visibility-checker";
