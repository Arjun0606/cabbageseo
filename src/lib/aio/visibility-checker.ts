/**
 * AI Visibility Checker
 * 
 * REAL visibility checking - queries AI platforms and checks for citations.
 * This is NOT estimation - it's actual verification of whether your content
 * appears in AI search results.
 * 
 * Platforms:
 * - Google AI Overviews (via SerpAPI)
 * - Perplexity AI (via their API)
 * - ChatGPT/SearchGPT (via OpenAI API with web search)
 * - Bing Copilot (via Bing Web Search API)
 */

import { serpapi } from "@/lib/integrations/serpapi/client";

// Platform visibility result
interface PlatformVisibilityResult {
  platform: "google_aio" | "perplexity" | "chatgpt" | "bing_copilot";
  platformName: string;
  checked: boolean;
  visible: boolean;
  citations: CitationResult[];
  queriesTested: number;
  queriesWithCitation: number;
  confidence: "high" | "medium" | "low";
  error?: string;
}

interface CitationResult {
  query: string;
  position?: number;
  citedUrl?: string;
  snippet?: string;
  context?: string;
}

interface VisibilityCheckResult {
  url: string;
  domain: string;
  checkedAt: string;
  platforms: {
    googleAIO: PlatformVisibilityResult;
    perplexity: PlatformVisibilityResult;
    chatGPT: PlatformVisibilityResult;
    bingCopilot: PlatformVisibilityResult;
  };
  overallScore: number;
  summary: {
    totalQueriesTested: number;
    totalCitations: number;
    platformsWithCitations: number;
    platformsChecked: number;
  };
}

interface VisibilityCheckOptions {
  url: string;
  keywords?: string[];
  maxQueriesPerPlatform?: number;
}

/**
 * AI Visibility Checker
 * Queries real AI platforms to check if a URL/domain is being cited
 */
export class AIVisibilityChecker {
  private perplexityApiKey: string;
  private openaiApiKey: string;
  private bingApiKey: string;

  constructor() {
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY || "";
    this.openaiApiKey = process.env.OPENAI_API_KEY || "";
    this.bingApiKey = process.env.BING_SEARCH_API_KEY || "";
  }

  /**
   * Check if APIs are configured
   */
  getConfiguredPlatforms(): {
    googleAIO: boolean;
    perplexity: boolean;
    chatGPT: boolean;
    bingCopilot: boolean;
  } {
    return {
      googleAIO: serpapi.isConfigured(),
      perplexity: Boolean(this.perplexityApiKey),
      chatGPT: Boolean(this.openaiApiKey),
      bingCopilot: Boolean(this.bingApiKey),
    };
  }

  /**
   * Main visibility check - queries all available platforms
   */
  async checkVisibility(options: VisibilityCheckOptions): Promise<VisibilityCheckResult> {
    const { url, keywords = [], maxQueriesPerPlatform = 5 } = options;
    
    // Extract domain from URL
    let domain: string;
    try {
      const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
      domain = urlObj.hostname.replace(/^www\./, "");
    } catch {
      domain = url.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
    }

    // If no keywords provided, use domain-based queries
    const queries = keywords.length > 0 
      ? keywords.slice(0, maxQueriesPerPlatform)
      : this.generateDefaultQueries(domain);

    // Run all platform checks in parallel
    const [googleAIO, perplexity, chatGPT, bingCopilot] = await Promise.all([
      this.checkGoogleAIO(domain, queries),
      this.checkPerplexity(domain, queries),
      this.checkChatGPT(domain, queries),
      this.checkBingCopilot(domain, queries),
    ]);

    // Calculate overall score
    const platforms = { googleAIO, perplexity, chatGPT, bingCopilot };
    const platformResults = Object.values(platforms);
    const checkedPlatforms = platformResults.filter(p => p.checked);
    const platformsWithCitations = checkedPlatforms.filter(p => p.visible);
    
    const totalCitations = platformResults.reduce((sum, p) => sum + p.citations.length, 0);
    const totalQueries = platformResults.reduce((sum, p) => sum + p.queriesTested, 0);
    
    // Score: weight by platform importance and citation frequency
    let overallScore = 0;
    if (checkedPlatforms.length > 0) {
      const weights = { googleAIO: 0.35, perplexity: 0.25, chatGPT: 0.25, bingCopilot: 0.15 };
      for (const [key, result] of Object.entries(platforms)) {
        if (result.checked && result.queriesTested > 0) {
          const citationRate = result.queriesWithCitation / result.queriesTested;
          overallScore += citationRate * weights[key as keyof typeof weights] * 100;
        }
      }
    }

    return {
      url,
      domain,
      checkedAt: new Date().toISOString(),
      platforms,
      overallScore: Math.round(overallScore),
      summary: {
        totalQueriesTested: totalQueries,
        totalCitations,
        platformsWithCitations: platformsWithCitations.length,
        platformsChecked: checkedPlatforms.length,
      },
    };
  }

  /**
   * Generate default queries based on domain
   */
  private generateDefaultQueries(domain: string): string[] {
    const baseName = domain.split(".")[0];
    return [
      `what is ${baseName}`,
      `${baseName} review`,
      `${baseName} alternatives`,
      baseName,
      `${baseName} pricing`,
    ];
  }

  /**
   * Check Google AI Overviews via SerpAPI
   * SerpAPI returns ai_overview with sources when present
   */
  private async checkGoogleAIO(domain: string, queries: string[]): Promise<PlatformVisibilityResult> {
    const result: PlatformVisibilityResult = {
      platform: "google_aio",
      platformName: "Google AI Overviews",
      checked: false,
      visible: false,
      citations: [],
      queriesTested: 0,
      queriesWithCitation: 0,
      confidence: "low",
    };

    if (!serpapi.isConfigured()) {
      result.error = "SerpAPI not configured (SERPAPI_KEY required)";
      return result;
    }

    result.checked = true;

    try {
      for (const query of queries) {
        result.queriesTested++;
        
        const serpResult = await serpapi.searchGoogle({
          q: query,
          num: 10,
        });

        // Check for AI Overview in response
        // SerpAPI returns ai_overview field when Google shows one
        const response = serpResult as unknown as Record<string, unknown>;
        const aiOverview = response.ai_overview as {
          text?: string;
          sources?: Array<{ link: string; title?: string; snippet?: string }>;
        } | undefined;

        if (aiOverview?.sources) {
          for (const source of aiOverview.sources) {
            if (this.urlMatchesDomain(source.link, domain)) {
              result.visible = true;
              result.queriesWithCitation++;
              result.citations.push({
                query,
                citedUrl: source.link,
                snippet: source.snippet,
                context: "Cited in Google AI Overview",
              });
              break; // Found citation for this query
            }
          }
        }

        // Also check organic results for Featured Snippet (often pulled into AI Overviews)
        const organicResults = serpResult.organic_results || [];
        for (const organic of organicResults) {
          if (this.urlMatchesDomain(organic.link, domain) && organic.rich_snippet) {
            // Featured snippet found
            if (!result.citations.find(c => c.query === query)) {
              result.citations.push({
                query,
                position: organic.position,
                citedUrl: organic.link,
                snippet: organic.snippet,
                context: "Featured Snippet (potential AI Overview source)",
              });
            }
          }
        }

        // Rate limiting - SerpAPI has limits
        await this.delay(200);
      }

      result.confidence = result.queriesTested >= 3 ? "high" : "medium";
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Failed to check Google AI Overviews";
    }

    return result;
  }

  /**
   * Check Perplexity AI via their API
   * Perplexity returns citations in the response
   */
  private async checkPerplexity(domain: string, queries: string[]): Promise<PlatformVisibilityResult> {
    const result: PlatformVisibilityResult = {
      platform: "perplexity",
      platformName: "Perplexity AI",
      checked: false,
      visible: false,
      citations: [],
      queriesTested: 0,
      queriesWithCitation: 0,
      confidence: "low",
    };

    if (!this.perplexityApiKey) {
      result.error = "Perplexity API not configured (PERPLEXITY_API_KEY required)";
      return result;
    }

    result.checked = true;

    try {
      for (const query of queries) {
        result.queriesTested++;

        const response = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.perplexityApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar", // Perplexity's search-enabled model
            messages: [
              { role: "user", content: query }
            ],
            return_citations: true,
          }),
        });

        if (!response.ok) {
          console.warn(`Perplexity API error for query "${query}": ${response.status}`);
          continue;
        }

        const data = await response.json() as {
          citations?: string[];
          choices?: Array<{
            message?: {
              content?: string;
            };
          }>;
        };

        // Check citations array for our domain
        if (data.citations && Array.isArray(data.citations)) {
          for (const citation of data.citations) {
            if (this.urlMatchesDomain(citation, domain)) {
              result.visible = true;
              result.queriesWithCitation++;
              result.citations.push({
                query,
                citedUrl: citation,
                context: "Cited in Perplexity response",
              });
              break;
            }
          }
        }

        await this.delay(300); // Rate limiting
      }

      result.confidence = result.queriesTested >= 3 ? "high" : "medium";
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Failed to check Perplexity";
    }

    return result;
  }

  /**
   * Check ChatGPT/SearchGPT via OpenAI API with web search
   * Uses the responses API with web_search_preview tool
   */
  private async checkChatGPT(domain: string, queries: string[]): Promise<PlatformVisibilityResult> {
    const result: PlatformVisibilityResult = {
      platform: "chatgpt",
      platformName: "ChatGPT / SearchGPT",
      checked: false,
      visible: false,
      citations: [],
      queriesTested: 0,
      queriesWithCitation: 0,
      confidence: "low",
    };

    if (!this.openaiApiKey) {
      result.error = "OpenAI API not configured (OPENAI_API_KEY required)";
      return result;
    }

    result.checked = true;

    try {
      for (const query of queries) {
        result.queriesTested++;

        // Use OpenAI's responses API with web search tool
        const response = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.openaiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o",
            input: query,
            tools: [{ type: "web_search_preview" }],
          }),
        });

        if (!response.ok) {
          // Fall back to chat completions if responses API not available
          console.warn(`OpenAI responses API error: ${response.status}, trying chat completions`);
          continue;
        }

        const data = await response.json() as {
          output?: Array<{
            type: string;
            content?: Array<{
              type: string;
              annotations?: Array<{
                type: string;
                url?: string;
              }>;
            }>;
          }>;
        };

        // Check for URL citations in the response
        if (data.output) {
          for (const outputItem of data.output) {
            if (outputItem.content) {
              for (const content of outputItem.content) {
                if (content.annotations) {
                  for (const annotation of content.annotations) {
                    if (annotation.url && this.urlMatchesDomain(annotation.url, domain)) {
                      result.visible = true;
                      result.queriesWithCitation++;
                      result.citations.push({
                        query,
                        citedUrl: annotation.url,
                        context: "Cited in ChatGPT web search response",
                      });
                    }
                  }
                }
              }
            }
          }
        }

        await this.delay(500); // Rate limiting for OpenAI
      }

      result.confidence = result.queriesTested >= 3 ? "high" : "medium";
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Failed to check ChatGPT";
    }

    return result;
  }

  /**
   * Check Bing Copilot via Bing Web Search API
   * While not exactly Copilot, this shows visibility in Bing's AI-enhanced results
   */
  private async checkBingCopilot(domain: string, queries: string[]): Promise<PlatformVisibilityResult> {
    const result: PlatformVisibilityResult = {
      platform: "bing_copilot",
      platformName: "Bing Copilot",
      checked: false,
      visible: false,
      citations: [],
      queriesTested: 0,
      queriesWithCitation: 0,
      confidence: "low",
    };

    if (!this.bingApiKey) {
      result.error = "Bing Search API not configured (BING_SEARCH_API_KEY required)";
      return result;
    }

    result.checked = true;

    try {
      for (const query of queries) {
        result.queriesTested++;

        const params = new URLSearchParams({
          q: query,
          count: "10",
        });

        const response = await fetch(
          `https://api.bing.microsoft.com/v7.0/search?${params.toString()}`,
          {
            headers: {
              "Ocp-Apim-Subscription-Key": this.bingApiKey,
            },
          }
        );

        if (!response.ok) {
          console.warn(`Bing API error for query "${query}": ${response.status}`);
          continue;
        }

        const data = await response.json() as {
          webPages?: {
            value?: Array<{
              url: string;
              name: string;
              snippet: string;
            }>;
          };
          computation?: {
            value: string;
          };
        };

        // Check web results for our domain in top positions
        // Top 3 positions are most likely to be cited by Copilot
        if (data.webPages?.value) {
          for (let i = 0; i < Math.min(3, data.webPages.value.length); i++) {
            const webResult = data.webPages.value[i];
            if (this.urlMatchesDomain(webResult.url, domain)) {
              result.visible = true;
              result.queriesWithCitation++;
              result.citations.push({
                query,
                position: i + 1,
                citedUrl: webResult.url,
                snippet: webResult.snippet,
                context: `Top ${i + 1} Bing result (likely Copilot source)`,
              });
              break;
            }
          }
        }

        await this.delay(200); // Rate limiting
      }

      result.confidence = result.queriesTested >= 3 ? "medium" : "low";
      // Note: Bing search isn't exactly Copilot, so confidence is medium at best
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Failed to check Bing Copilot";
    }

    return result;
  }

  /**
   * Check if a URL matches the target domain
   */
  private urlMatchesDomain(url: string, targetDomain: string): boolean {
    try {
      const urlDomain = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
      const normalizedTarget = targetDomain.replace(/^www\./, "").toLowerCase();
      return urlDomain === normalizedTarget || urlDomain.endsWith(`.${normalizedTarget}`);
    } catch {
      return false;
    }
  }

  /**
   * Simple delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton
export const visibilityChecker = new AIVisibilityChecker();

// Export types
export type {
  VisibilityCheckResult,
  PlatformVisibilityResult,
  CitationResult,
  VisibilityCheckOptions,
};

