/**
 * Platform Analyzers Index
 * 
 * 100% AI-POWERED GEO analysis for:
 * - ChatGPT / SearchGPT
 * - Perplexity AI
 * - Google AI Overviews
 * 
 * No external SERP APIs - uses GPT-5-mini for analysis
 */

export { BasePlatformAnalyzer } from "./base-analyzer";
export { GoogleAIOAnalyzer, googleAIOAnalyzer } from "./google-aio-analyzer";
export { ChatGPTAnalyzer, chatgptAnalyzer } from "./chatgpt-analyzer";
export { PerplexityAnalyzer, perplexityAnalyzer } from "./perplexity-analyzer";
export { BingCopilotAnalyzer, bingCopilotAnalyzer } from "./bing-copilot-analyzer";

import { googleAIOAnalyzer } from "./google-aio-analyzer";
import { chatgptAnalyzer } from "./chatgpt-analyzer";
import { perplexityAnalyzer } from "./perplexity-analyzer";
import { bingCopilotAnalyzer } from "./bing-copilot-analyzer";
import type { AIOPlatform } from "../types";
import type { BasePlatformAnalyzer } from "./base-analyzer";

export const platformAnalyzers: Record<AIOPlatform, BasePlatformAnalyzer> = {
  google_aio: googleAIOAnalyzer,
  chatgpt: chatgptAnalyzer,
  perplexity: perplexityAnalyzer,
  bing_copilot: bingCopilotAnalyzer,
};
