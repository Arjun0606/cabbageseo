/**
 * AI Visibility Checker (GEO)
 * 
 * HYBRID APPROACH:
 * - Perplexity: REAL citation checking via API
 * - ChatGPT: Simulated search queries via OpenAI
 * - Google AI & Bing: AI-powered estimation (no API available)
 * 
 * Focus: Generative Engine Optimization (GEO)
 * - Location-aware analysis
 * - Entity optimization
 * - Answer structure scoring
 * - Quotability assessment
 */

import { openai } from "@/lib/ai/openai-client";

// ============================================
// TYPES
// ============================================

interface PlatformScore {
  platform: "chatgpt" | "perplexity" | "google_aio" | "bing_copilot";
  platformName: string;
  score: number;              // 0-100
  confidence: "high" | "medium" | "low";
  strengths: string[];
  improvements: string[];
  isRealCheck: boolean;       // true if we actually queried the platform
  citations?: string[];       // Actual citations found (for real checks)
}

interface VisibilityResult {
  url: string;
  domain: string;
  checkedAt: string;
  
  // Platform-specific scores
  platforms: {
    chatgpt: PlatformScore;
    perplexity: PlatformScore;
    googleAio: PlatformScore;
  };
  
  // Overall GEO score
  overallScore: number;
  
  // Key factors analyzed
  factors: {
    entityDensity: number;      // Named entities for topical authority
    quotability: number;        // Easy-to-extract answer snippets
    answerStructure: number;    // FAQs, definitions, how-tos
    freshness: number;          // Recent updates, current info
    expertAttribution: number;  // Expert quotes, author credentials
    locationRelevance: number;  // Location-specific content
  };
  
  // Top opportunities for improvement
  quickWins: string[];
  
  // Location context if analyzed
  location?: {
    region: string;
    localEntities: string[];
    recommendations: string[];
  };
}

interface CheckOptions {
  url: string;
  content?: string;           // Raw content (optional - will be fetched if not provided)
  keywords?: string[];        // Related keywords for context
  location?: string;          // e.g., "India", "Germany" for location-aware analysis
}

// ============================================
// PERPLEXITY CLIENT
// ============================================

class PerplexityClient {
  private apiKey: string | undefined;
  private baseUrl = "https://api.perplexity.ai";

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
}

/**
   * Query Perplexity and check if domain is cited
   */
  async checkCitation(
    domain: string,
    query: string
  ): Promise<{
    isCited: boolean;
    citations: string[];
    snippet: string;
    confidence: "high" | "medium" | "low";
  }> {
    if (!this.apiKey) {
      return { isCited: false, citations: [], snippet: "", confidence: "low" };
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online", // Online model with citations
          messages: [
            {
              role: "system",
              content: "You are a helpful search assistant. Always cite your sources with URLs.",
            },
            {
              role: "user",
              content: query,
            },
          ],
          return_citations: true,
          return_related_questions: false,
        }),
      });

      if (!response.ok) {
        console.error("Perplexity API error:", response.status);
        return { isCited: false, citations: [], snippet: "", confidence: "low" };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      const citations: string[] = data.citations || [];

      // Check if our domain appears in citations
      const domainLower = domain.toLowerCase();
      const matchingCitations = citations.filter((url: string) => 
        url.toLowerCase().includes(domainLower)
      );

      // Also check if domain is mentioned in the response
      const mentionedInContent = content.toLowerCase().includes(domainLower);

    return {
        isCited: matchingCitations.length > 0 || mentionedInContent,
        citations: matchingCitations,
        snippet: content.slice(0, 200),
        confidence: matchingCitations.length > 0 ? "high" : (mentionedInContent ? "medium" : "low"),
      };
    } catch (error) {
      console.error("Perplexity check error:", error);
      return { isCited: false, citations: [], snippet: "", confidence: "low" };
    }
  }

  /**
   * Run multiple queries to get a comprehensive citation score
   */
  async getCitationScore(
    domain: string,
    keywords: string[]
  ): Promise<{
    score: number;
    citedQueries: number;
    totalQueries: number;
    citations: string[];
    confidence: "high" | "medium" | "low";
  }> {
    // Generate search queries from keywords
    const queries = keywords.slice(0, 5).map(kw => 
      `What is ${kw}? Provide detailed information with sources.`
    );

    if (queries.length === 0) {
      queries.push(`Tell me about ${domain}`);
    }

    let citedCount = 0;
    const allCitations: string[] = [];

      for (const query of queries) {
      const result = await this.checkCitation(domain, query);
      if (result.isCited) {
        citedCount++;
        allCitations.push(...result.citations);
      }
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 200));
    }

    const score = Math.round((citedCount / queries.length) * 100);
    
    return {
      score,
      citedQueries: citedCount,
      totalQueries: queries.length,
      citations: [...new Set(allCitations)], // Dedupe
      confidence: citedCount > 2 ? "high" : (citedCount > 0 ? "medium" : "low"),
    };
  }
}

// ============================================
// GOOGLE AI CLIENT (Gemini with Search Grounding)
// ============================================

class GoogleAIClient {
  private apiKey: string | undefined;
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta";

  constructor() {
    this.apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Query Gemini with search grounding to check citations
   */
  async checkCitation(
    domain: string,
    query: string
  ): Promise<{
    isCited: boolean;
    citations: string[];
    snippet: string;
    confidence: "high" | "medium" | "low";
  }> {
    if (!this.apiKey) {
      return { isCited: false, citations: [], snippet: "", confidence: "low" };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: query }],
              },
            ],
            tools: [
              {
                google_search_retrieval: {
                  dynamic_retrieval_config: {
                    mode: "MODE_DYNAMIC",
                    dynamic_threshold: 0.3,
                  },
                },
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        console.error("Google AI API error:", response.status);
        return { isCited: false, citations: [], snippet: "", confidence: "low" };
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const groundingMetadata = data.candidates?.[0]?.groundingMetadata;
      
      // Extract grounding sources
      const groundingChunks = groundingMetadata?.groundingChunks || [];
      const citations: string[] = groundingChunks
        .filter((chunk: any) => chunk.web?.uri)
        .map((chunk: any) => chunk.web.uri);

      // Check if our domain appears in citations
      const domainLower = domain.toLowerCase();
      const matchingCitations = citations.filter((url: string) =>
        url.toLowerCase().includes(domainLower)
      );

      // Also check if domain is mentioned in the response
      const mentionedInContent = content.toLowerCase().includes(domainLower);

      return {
        isCited: matchingCitations.length > 0 || mentionedInContent,
        citations: matchingCitations,
        snippet: content.slice(0, 200),
        confidence: matchingCitations.length > 0 ? "high" : (mentionedInContent ? "medium" : "low"),
      };
    } catch (error) {
      console.error("Google AI check error:", error);
      return { isCited: false, citations: [], snippet: "", confidence: "low" };
    }
  }

  /**
   * Run multiple queries to get a comprehensive citation score
   */
  async getCitationScore(
    domain: string,
    keywords: string[]
  ): Promise<{
    score: number;
    citedQueries: number;
    totalQueries: number;
    citations: string[];
    confidence: "high" | "medium" | "low";
  }> {
    const queries = keywords.slice(0, 5).map(kw =>
      `What is ${kw}? Provide detailed information.`
    );

    if (queries.length === 0) {
      queries.push(`Tell me about ${domain}`);
    }

    let citedCount = 0;
    const allCitations: string[] = [];

    for (const query of queries) {
      const result = await this.checkCitation(domain, query);
      if (result.isCited) {
        citedCount++;
        allCitations.push(...result.citations);
      }
      await new Promise(r => setTimeout(r, 200));
    }

    const score = Math.round((citedCount / queries.length) * 100);

    return {
      score,
      citedQueries: citedCount,
      totalQueries: queries.length,
      citations: [...new Set(allCitations)],
      confidence: citedCount > 2 ? "high" : (citedCount > 0 ? "medium" : "low"),
    };
  }
}

// ============================================
// OPENAI CHATGPT CLIENT (Simulation)
// ============================================

class ChatGPTClient {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Simulate ChatGPT/SearchGPT by asking GPT if it knows about a domain
   */
  async checkCitation(
    domain: string,
    query: string
  ): Promise<{
    isCited: boolean;
    snippet: string;
    confidence: "high" | "medium" | "low";
  }> {
    if (!this.apiKey) {
      return { isCited: false, snippet: "", confidence: "low" };
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
          "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant. When answering, recommend specific websites or sources you know are authoritative on the topic.",
            },
            {
              role: "user",
              content: `${query} Please mention any specific websites or companies you'd recommend.`,
            },
          ],
          max_tokens: 500,
          }),
        });

        if (!response.ok) {
        return { isCited: false, snippet: "", confidence: "low" };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      const domainLower = domain.toLowerCase();
      const isCited = content.toLowerCase().includes(domainLower);

      return {
        isCited,
        snippet: content.slice(0, 200),
        confidence: isCited ? "medium" : "low", // Medium because it's simulation
      };
    } catch (error) {
      console.error("ChatGPT check error:", error);
      return { isCited: false, snippet: "", confidence: "low" };
    }
  }

  /**
   * Run multiple queries for citation score
   */
  async getCitationScore(
    domain: string,
    keywords: string[]
  ): Promise<{
    score: number;
    citedQueries: number;
    totalQueries: number;
    confidence: "high" | "medium" | "low";
  }> {
    const queries = keywords.slice(0, 5).map(kw =>
      `What are the best tools or resources for ${kw}?`
    );

    if (queries.length === 0) {
      queries.push(`What do you know about ${domain}?`);
    }

    let citedCount = 0;

    for (const query of queries) {
      const result = await this.checkCitation(domain, query);
      if (result.isCited) citedCount++;
      await new Promise(r => setTimeout(r, 200));
    }

    const score = Math.round((citedCount / queries.length) * 100);

    return {
      score,
      citedQueries: citedCount,
      totalQueries: queries.length,
      confidence: citedCount > 2 ? "medium" : "low",
    };
  }
}

// ============================================
// AI VISIBILITY CHECKER
// ============================================

export class AIVisibilityChecker {
  private perplexity: PerplexityClient;
  private googleAI: GoogleAIClient;
  private chatgpt: ChatGPTClient;

  constructor() {
    this.perplexity = new PerplexityClient();
    this.googleAI = new GoogleAIClient();
    this.chatgpt = new ChatGPTClient();
  }

  /**
   * Check if OpenAI is configured (required)
   */
  isConfigured(): boolean {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  /**
   * Check what platforms we can actually verify
   */
  getCapabilities(): {
    perplexity: { real: boolean; method: string };
    chatgpt: { real: boolean; method: string };
    googleAio: { real: boolean; method: string };
    bingCopilot: { real: boolean; method: string };
  } {
    return {
      perplexity: {
        real: this.perplexity.isConfigured(),
        method: this.perplexity.isConfigured() 
          ? "✅ Real citation check via Perplexity API" 
          : "AI-powered estimation (no API key)",
      },
      chatgpt: {
        real: this.chatgpt.isConfigured(),
        method: this.chatgpt.isConfigured()
          ? "✅ OpenAI simulation (checks if GPT mentions your domain)"
          : "AI-powered estimation (no API key)",
      },
      googleAio: {
        real: this.googleAI.isConfigured(),
        method: this.googleAI.isConfigured()
          ? "✅ Real check via Gemini API with search grounding"
          : "AI-powered estimation (add GOOGLE_AI_API_KEY for real checks)",
      },
      bingCopilot: {
        real: false,
        method: "❌ No public API available",
      },
    };
  }

  /**
   * Main visibility check - REAL checks on all platforms with APIs
   */
  async checkVisibility(options: CheckOptions): Promise<VisibilityResult> {
    const { url, content = "", keywords = [], location } = options;
    
    // Extract domain
    let domain: string;
    try {
      const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
      domain = urlObj.hostname.replace(/^www\./, "");
    } catch {
      domain = url.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
    }

    // Run ALL checks in parallel for speed
    const [perplexityResult, googleResult, chatgptResult, aiAnalysis] = await Promise.all([
      // Real Perplexity check
      this.perplexity.isConfigured()
        ? this.perplexity.getCitationScore(domain, keywords)
        : null,
      // Real Google AI check (Gemini with search grounding)
      this.googleAI.isConfigured()
        ? this.googleAI.getCitationScore(domain, keywords)
        : null,
      // ChatGPT simulation
      this.chatgpt.isConfigured()
        ? this.chatgpt.getCitationScore(domain, keywords)
        : null,
      // AI analysis for fallback/additional factors
      this.getAIAnalysis(domain, content, keywords, location),
    ]);

    // Build Perplexity score
    const perplexityScore: PlatformScore = perplexityResult
      ? {
          platform: "perplexity",
          platformName: "Perplexity AI",
          score: perplexityResult.score,
          confidence: perplexityResult.confidence,
          strengths: perplexityResult.citedQueries > 0 
            ? [`✅ Cited in ${perplexityResult.citedQueries}/${perplexityResult.totalQueries} queries`]
            : [],
          improvements: perplexityResult.citedQueries === 0 
            ? ["Not currently cited - improve content authority and quotability"]
            : [],
          isRealCheck: true,
          citations: perplexityResult.citations,
        }
      : {
          platform: "perplexity",
          platformName: "Perplexity AI",
          score: aiAnalysis.platforms.perplexity.score,
          confidence: "low" as const,
          strengths: aiAnalysis.platforms.perplexity.strengths,
          improvements: ["Add PERPLEXITY_API_KEY for real citation checks"],
          isRealCheck: false,
        };

    // Build Google AI score
    const googleAioScore: PlatformScore = googleResult
      ? {
          platform: "google_aio",
          platformName: "Google AI Overview",
          score: googleResult.score,
          confidence: googleResult.confidence,
          strengths: googleResult.citedQueries > 0
            ? [`✅ Cited in ${googleResult.citedQueries}/${googleResult.totalQueries} queries`]
            : [],
          improvements: googleResult.citedQueries === 0
            ? ["Not cited in AI Overviews - add structured data and FAQ sections"]
            : [],
          isRealCheck: true,
          citations: googleResult.citations,
        }
      : {
          platform: "google_aio",
          platformName: "Google AI Overview",
          score: aiAnalysis.platforms.googleAio.score,
          confidence: "low" as const,
          strengths: aiAnalysis.platforms.googleAio.strengths,
          improvements: ["Add GOOGLE_AI_API_KEY for real citation checks via Gemini"],
          isRealCheck: false,
        };

    // Build ChatGPT score
    const chatgptScore: PlatformScore = chatgptResult
      ? {
          platform: "chatgpt",
          platformName: "ChatGPT / SearchGPT",
          score: chatgptResult.score,
          confidence: chatgptResult.confidence,
          strengths: chatgptResult.citedQueries > 0
            ? [`✅ Mentioned in ${chatgptResult.citedQueries}/${chatgptResult.totalQueries} queries`]
            : [],
          improvements: chatgptResult.citedQueries === 0
            ? ["Build brand recognition - GPT learns from widespread mentions"]
            : [],
          isRealCheck: true,
        }
      : {
          platform: "chatgpt",
          platformName: "ChatGPT / SearchGPT",
          score: aiAnalysis.platforms.chatgpt.score,
          confidence: "low" as const,
          strengths: aiAnalysis.platforms.chatgpt.strengths,
          improvements: aiAnalysis.platforms.chatgpt.improvements,
          isRealCheck: false,
        };

    // Calculate overall score - weighted by real checks
    const overallScore = Math.round(
      chatgptScore.score * 0.30 +
      perplexityScore.score * 0.35 +
      googleAioScore.score * 0.35
    );

    // Determine how many platforms have real checks
    const realCheckCount = [perplexityResult, googleResult, chatgptResult].filter(Boolean).length;

    return {
      url,
      domain,
      checkedAt: new Date().toISOString(),
      platforms: {
        chatgpt: chatgptScore,
        perplexity: perplexityScore,
        googleAio: googleAioScore,
      },
      overallScore,
      factors: aiAnalysis.factors,
      quickWins: realCheckCount < 3 
        ? [...aiAnalysis.quickWins, `Add API keys for ${3 - realCheckCount} more platforms for comprehensive tracking`]
        : aiAnalysis.quickWins,
      location: aiAnalysis.location,
    };
  }

  /**
   * AI-powered analysis for platforms we can't directly check
   */
  private async getAIAnalysis(
    domain: string,
    content: string,
    keywords: string[],
    location?: string
  ): Promise<{
    platforms: {
      chatgpt: { score: number; confidence: string; strengths: string[]; improvements: string[] };
      perplexity: { score: number; confidence: string; strengths: string[]; improvements: string[] };
      googleAio: { score: number; confidence: string; strengths: string[]; improvements: string[] };
    };
    factors: {
      entityDensity: number;
      quotability: number;
      answerStructure: number;
      freshness: number;
      expertAttribution: number;
      locationRelevance: number;
    };
    quickWins: string[];
    location?: {
      region: string;
      localEntities: string[];
      recommendations: string[];
    };
  }> {
    const contentContext = content.length > 0 
      ? `Content to analyze (first 5000 chars):\n${content.slice(0, 5000)}`
      : `Domain: ${domain}\nKeywords: ${keywords.join(", ")}`;

    const locationContext = location 
      ? `User location: ${location}. Analyze for location-specific relevance.`
      : "";

    const prompt = `You are a GEO (Generative Engine Optimization) expert. Analyze this content for visibility in AI platforms.

${contentContext}

${locationContext}

Analyze for visibility in:
1. ChatGPT/SearchGPT - Prefers authoritative, well-structured answers with expert attribution
2. Perplexity - Prefers cited sources, recent information, factual content
3. Google AI Overviews - Prefers clear answers, structured data, schema markup

For each platform, score 0-100 based on:
- Entity density (named entities for topical authority)
- Quotability (easy-to-extract snippets AI can cite)
- Answer structure (FAQs, definitions, step-by-step)
- Freshness (current/updated content signals)
- Expert attribution (author credentials, expert quotes)
${location ? "- Location relevance (region-specific information)" : ""}

Return JSON:
{
  "platforms": {
    "chatgpt": { "score": 75, "confidence": "high", "strengths": ["..."], "improvements": ["..."] },
    "perplexity": { "score": 68, "confidence": "medium", "strengths": ["..."], "improvements": ["..."] },
    "googleAio": { "score": 72, "confidence": "high", "strengths": ["..."], "improvements": ["..."] }
  },
  "factors": {
    "entityDensity": 70,
    "quotability": 65,
    "answerStructure": 80,
    "freshness": 60,
    "expertAttribution": 50,
    "locationRelevance": ${location ? "75" : "0"}
  },
  "quickWins": ["Add FAQ schema", "Include more named entities", "Add expert quotes"],
  ${location ? '"location": { "region": "...", "localEntities": ["..."], "recommendations": ["..."] },' : ""}
}`;

    return openai.getJSON(prompt);
  }

  /**
   * Quick score check (faster, less detailed)
   */
  async quickCheck(url: string): Promise<{
    overallScore: number;
    chatgpt: number;
    perplexity: number;
    googleAio: number;
    topImprovement: string;
    perplexityIsReal: boolean;
  }> {
    // Extract domain
    let domain: string;
    try {
      const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
      domain = urlObj.hostname.replace(/^www\./, "");
    } catch {
      domain = url;
    }

    // Quick Perplexity check if available
    let perplexityScore = 50;
    let perplexityIsReal = false;

    if (this.perplexity.isConfigured()) {
      const check = await this.perplexity.checkCitation(domain, `Tell me about ${domain}`);
      perplexityScore = check.isCited ? 75 : 25;
      perplexityIsReal = true;
  }

    const prompt = `Quick GEO visibility score for ${url}:
Return JSON: { "chatgpt": 0-100, "googleAio": 0-100, "topImprovement": "one quick win" }`;

    const result = await openai.getJSON<{
      chatgpt: number;
      googleAio: number;
      topImprovement: string;
    }>(prompt);

    const overallScore = Math.round(
      result.chatgpt * 0.35 + perplexityScore * 0.30 + result.googleAio * 0.35
    );

    return {
      overallScore,
      chatgpt: result.chatgpt,
      perplexity: perplexityScore,
      googleAio: result.googleAio,
      topImprovement: result.topImprovement,
      perplexityIsReal,
    };
  }

  /**
   * Compare before/after content changes
   */
  async compareVersions(
    url: string,
    beforeContent: string,
    afterContent: string
  ): Promise<{
    beforeScore: number;
    afterScore: number;
    improvement: number;
    changes: string[];
  }> {
    const prompt = `Compare these two versions of content for GEO visibility improvement:

BEFORE:
${beforeContent.slice(0, 2000)}

AFTER:
${afterContent.slice(0, 2000)}

Return JSON: {
  "beforeScore": 0-100,
  "afterScore": 0-100,
  "changes": ["what improved", "what still needs work"]
}`;

    const result = await openai.getJSON<{
      beforeScore: number;
      afterScore: number;
      changes: string[];
    }>(prompt);

    return {
      ...result,
      improvement: result.afterScore - result.beforeScore,
    };
  }
}

// ============================================
// SINGLETON + EXPORTS
// ============================================

export const visibilityChecker = new AIVisibilityChecker();

// Also export the newer naming for consistency
export const geoVisibilityChecker = visibilityChecker;
