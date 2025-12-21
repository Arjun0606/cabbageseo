/**
 * Platform Analyzers Index
 * 
 * Supports the 4 main AI search platforms we can actually verify:
 * - Google AI Overviews (via SerpAPI)
 * - ChatGPT / SearchGPT (via OpenAI API)
 * - Perplexity (via Perplexity API)
 * - Bing Copilot (via Bing Search API)
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
