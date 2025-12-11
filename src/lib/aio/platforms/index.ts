/**
 * Platform Analyzers Index
 */

export { BasePlatformAnalyzer } from "./base-analyzer";
export { GoogleAIOAnalyzer, googleAIOAnalyzer } from "./google-aio-analyzer";
export { ChatGPTAnalyzer, chatgptAnalyzer } from "./chatgpt-analyzer";
export { PerplexityAnalyzer, perplexityAnalyzer } from "./perplexity-analyzer";
export { ClaudeAnalyzer, claudeAnalyzer } from "./claude-analyzer";
export { GeminiAnalyzer, geminiAnalyzer } from "./gemini-analyzer";

import { googleAIOAnalyzer } from "./google-aio-analyzer";
import { chatgptAnalyzer } from "./chatgpt-analyzer";
import { perplexityAnalyzer } from "./perplexity-analyzer";
import { claudeAnalyzer } from "./claude-analyzer";
import { geminiAnalyzer } from "./gemini-analyzer";
import type { AIOPlatform } from "../types";
import type { BasePlatformAnalyzer } from "./base-analyzer";

export const platformAnalyzers: Record<AIOPlatform, BasePlatformAnalyzer> = {
  google_aio: googleAIOAnalyzer,
  chatgpt: chatgptAnalyzer,
  perplexity: perplexityAnalyzer,
  claude: claudeAnalyzer,
  gemini: geminiAnalyzer,
};

