/**
 * Content Generation Pipeline for CabbageSEO
 * 
 * Orchestrates the full content creation workflow:
 * 1. Research & Ideation
 * 2. Outline Generation
 * 3. Content Writing
 * 4. Optimization & Scoring
 * 5. Schema & Meta Generation
 * 
 * Includes usage tracking and cost controls.
 */

// NOW USES OPENAI instead of Claude for better reliability
import { claude, OpenAIClient as ClaudeClient, RateLimitError, UsageLimitError } from "./openai-client";
import { PROMPTS, estimateTokens, truncateForTokens } from "./prompts";

// ============================================
// TYPES
// ============================================

export interface ContentOutline {
  title: string;
  metaTitle: string;
  metaDescription: string;
  headings: Array<{
    level: number;
    text: string;
    points: string[];
    wordCount?: number;
  }>;
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
  uniqueAngles?: string[];
  internalLinkOpportunities?: string[];
}

export interface GeneratedContent {
  title: string;
  metaTitle: string;
  metaDescription: string;
  body: string;
  bodyHtml?: string;
  outline: ContentOutline;
  wordCount: number;
  readingTime: number;
  faqs?: Array<{ question: string; answer: string }>;
  suggestedInternalLinks?: Array<{ anchor: string; url: string }>;
  seoScore?: number;
  usage: {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCostCents: number;
    steps: Array<{
      step: string;
      model: string;
      costCents: number;
    }>;
  };
}

export interface ContentIdea {
  title: string;
  keyword: string;
  intent: "informational" | "commercial" | "transactional" | "navigational";
  difficulty: "easy" | "medium" | "hard";
  trafficPotential: "low" | "medium" | "high";
}

export interface KeywordCluster {
  name: string;
  pillarKeyword: string;
  keywords: string[];
  intent: string;
  suggestedArticles: number;
  difficulty: string;
}

export interface ContentAnalysis {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: Array<{
    priority: "high" | "medium" | "low";
    category: string;
    issue: string;
    fix: string;
  }>;
  keywordAnalysis: {
    primaryKeywordCount: number;
    density: string;
    placement: string;
    variations: string[];
  };
  readability: {
    level: string;
    avgSentenceLength: number;
    suggestions: string[];
  };
}

export interface PipelineOptions {
  organizationId?: string;
  brandVoice?: string;
  targetWordCount?: number;
  generateFaqs?: boolean;
  suggestInternalLinks?: boolean;
  availablePages?: Array<{ url: string; title: string; keywords?: string[] }>;
  /** AIO optimization mode */
  optimizationMode?: "seo" | "aio" | "balanced";
  /** Add key takeaways section */
  addKeyTakeaways?: boolean;
  /** Inject additional entities */
  entitiesToAdd?: string[];
  /** Optimize paragraphs for quotability */
  optimizeQuotability?: boolean;
}

export interface AIOAnalysisResult {
  overallScore: number;
  platformScores: {
    googleAIO: number;
    chatGPT: number;
    perplexity: number;
    claude: number;
    gemini: number;
  };
  breakdown: {
    entityDensity: { score: number; found: number; recommended: number };
    quotability: { score: number; avgParagraphWords: number; quotableSnippets: number };
    answerStructure: { score: number; hasDirectAnswer: boolean; hasKeyTakeaways: boolean };
    schemaReadiness: { score: number; detectedTypes: string[]; recommendedTypes: string[] };
    freshness: { score: number; lastUpdated: string | null; recommendation: string };
  };
  topIssues: Array<{
    priority: "high" | "medium" | "low";
    issue: string;
    fix: string;
    impact: string;
  }>;
  entitiesFound: string[];
  quotableSnippets: string[];
}

// ============================================
// USAGE TRACKING
// ============================================

interface UsageTracker {
  inputTokens: number;
  outputTokens: number;
  costCents: number;
  steps: Array<{
    step: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    costCents: number;
  }>;
}

function createUsageTracker(): UsageTracker {
  return {
    inputTokens: 0,
    outputTokens: 0,
    costCents: 0,
    steps: [],
  };
}

function recordUsage(
  tracker: UsageTracker,
  step: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  costCents: number
): void {
  tracker.inputTokens += inputTokens;
  tracker.outputTokens += outputTokens;
  tracker.costCents += costCents;
  tracker.steps.push({ step, model, inputTokens, outputTokens, costCents });
}

// ============================================
// CONTENT PIPELINE CLASS
// ============================================

export class ContentPipeline {
  private client: ClaudeClient;

  constructor(client?: ClaudeClient) {
    this.client = client || claude;
  }

  /**
   * Check if pipeline is ready
   */
  isReady(): boolean {
    return this.client.isConfigured();
  }

  // ============================================
  // KEYWORD RESEARCH
  // ============================================

  /**
   * Cluster keywords into topical groups
   */
  async clusterKeywords(keywords: string[]): Promise<{
    clusters: KeywordCluster[];
    usage: { costCents: number };
  }> {
    if (!this.isReady()) {
      throw new Error("AI client not configured");
    }

    const prompt = PROMPTS.clusterKeywords(keywords);
    
    const response = await this.client.chat(
      [{ role: "user", content: prompt.user }],
      prompt.system,
      { model: "haiku" }
    );

    const clusters = this.parseJSON<KeywordCluster[]>(response.content);

    return {
      clusters,
      usage: { costCents: response.usage.costCents },
    };
  }

  /**
   * Generate content ideas for a topic
   */
  async generateContentIdeas(
    topic: string,
    existingTitles: string[] = [],
    count: number = 10
  ): Promise<{
    ideas: ContentIdea[];
    usage: { costCents: number };
  }> {
    if (!this.isReady()) {
      throw new Error("AI client not configured");
    }

    const prompt = PROMPTS.generateContentIdeas(topic, existingTitles, count);
    
    const response = await this.client.chat(
      [{ role: "user", content: prompt.user }],
      prompt.system,
      { model: "haiku" }
    );

    const ideas = this.parseJSON<ContentIdea[]>(response.content);

    return {
      ideas,
      usage: { costCents: response.usage.costCents },
    };
  }

  // ============================================
  // CONTENT GENERATION
  // ============================================

  /**
   * Generate a content outline from SERP data
   */
  async generateOutline(
    keyword: string,
    serpResults: Array<{ title: string; snippet: string }>,
    targetWordCount: number = 2000
  ): Promise<{
    outline: ContentOutline;
    usage: { costCents: number };
  }> {
    if (!this.isReady()) {
      throw new Error("AI client not configured");
    }

    const prompt = PROMPTS.generateOutline(keyword, serpResults, targetWordCount);
    
    const response = await this.client.chat(
      [{ role: "user", content: prompt.user }],
      prompt.system,
      { model: "sonnet", maxTokens: 4096 }
    );

    let outline: ContentOutline;
    try {
      outline = this.parseJSON<ContentOutline>(response.content);
    } catch (parseError) {
      // Fallback: create a basic outline if parsing fails
      console.warn("[Content Pipeline] Outline parse failed, using fallback:", parseError);
      const capitalizedKeyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      outline = {
        title: `The Complete Guide to ${capitalizedKeyword}`,
        metaTitle: `${capitalizedKeyword} - Complete Guide`,
        metaDescription: `Learn everything about ${keyword}. Comprehensive guide with expert tips and actionable strategies.`,
        headings: [
          { level: 2, text: `What is ${capitalizedKeyword}?`, points: ["Definition", "Key concepts"], wordCount: 300 },
          { level: 2, text: `Why ${capitalizedKeyword} Matters`, points: ["Benefits", "Impact"], wordCount: 300 },
          { level: 2, text: `Getting Started with ${capitalizedKeyword}`, points: ["Step 1", "Step 2", "Step 3"], wordCount: 400 },
          { level: 2, text: `Best Practices`, points: ["Tip 1", "Tip 2", "Tip 3"], wordCount: 300 },
          { level: 2, text: `Common Mistakes to Avoid`, points: ["Mistake 1", "Mistake 2"], wordCount: 300 },
          { level: 2, text: `Conclusion`, points: ["Summary", "Next steps"], wordCount: 200 },
        ],
        faqs: [
          { question: `What is ${keyword}?`, answer: `A brief overview of ${keyword}.` },
          { question: `How do I get started?`, answer: `Start by understanding the basics...` },
        ],
      };
    }

    return {
      outline,
      usage: { costCents: response.usage.costCents },
    };
  }

  /**
   * Generate a full article from an outline
   */
  async generateArticle(
    keyword: string,
    outline: ContentOutline,
    options: PipelineOptions = {}
  ): Promise<GeneratedContent> {
    if (!this.isReady()) {
      throw new Error("AI client not configured");
    }

    const tracker = createUsageTracker();
    const targetWordCount = options.targetWordCount || 2000;

    // Step 1: Generate main content
    const articlePrompt = PROMPTS.generateArticle(
      keyword,
      outline,
      options.brandVoice,
      targetWordCount
    );

    const articleResponse = await this.client.chat(
      [{ role: "user", content: articlePrompt.user }],
      articlePrompt.system,
      { model: "sonnet", maxTokens: 8192 }
    );

    recordUsage(
      tracker,
      "article_generation",
      "sonnet",
      articleResponse.usage.inputTokens,
      articleResponse.usage.outputTokens,
      articleResponse.usage.costCents
    );

    let body = articleResponse.content;
    const wordCount = body.split(/\s+/).length;

    // Step 2: Generate FAQs if needed and not in outline
    let faqs = outline.faqs;
    if (options.generateFaqs && (!faqs || faqs.length === 0)) {
      const faqPrompt = PROMPTS.generateFAQs(body, keyword, 5);
      const faqResponse = await this.client.chat(
        [{ role: "user", content: faqPrompt.user }],
        faqPrompt.system,
        { model: "haiku" }
      );

      recordUsage(
        tracker,
        "faq_generation",
        "haiku",
        faqResponse.usage.inputTokens,
        faqResponse.usage.outputTokens,
        faqResponse.usage.costCents
      );

      faqs = this.parseJSON<Array<{ question: string; answer: string }>>(faqResponse.content);
    }

    // Step 3: Suggest internal links if requested
    let suggestedInternalLinks: Array<{ anchor: string; url: string }> | undefined;
    if (options.suggestInternalLinks && options.availablePages?.length) {
      const linkPrompt = PROMPTS.suggestInternalLinks(body, options.availablePages);
      const linkResponse = await this.client.chat(
        [{ role: "user", content: linkPrompt.user }],
        linkPrompt.system,
        { model: "haiku" }
      );

      recordUsage(
        tracker,
        "internal_links",
        "haiku",
        linkResponse.usage.inputTokens,
        linkResponse.usage.outputTokens,
        linkResponse.usage.costCents
      );

      const links = this.parseJSON<Array<{ anchor: string; url: string }>>(linkResponse.content);
      suggestedInternalLinks = links;
    }

    return {
      title: outline.title,
      metaTitle: outline.metaTitle,
      metaDescription: outline.metaDescription,
      body,
      outline,
      wordCount,
      readingTime: Math.ceil(wordCount / 200),
      faqs,
      suggestedInternalLinks,
      usage: {
        totalInputTokens: tracker.inputTokens,
        totalOutputTokens: tracker.outputTokens,
        totalCostCents: tracker.costCents,
        steps: tracker.steps,
      },
    };
  }

  /**
   * Full content generation pipeline: keyword → outline → article
   */
  async generateFullContent(
    keyword: string,
    serpResults: Array<{ title: string; snippet: string }>,
    options: PipelineOptions = {}
  ): Promise<GeneratedContent> {
    const targetWordCount = options.targetWordCount || 2000;

    // Step 1: Generate outline
    const { outline, usage: outlineUsage } = await this.generateOutline(
      keyword,
      serpResults,
      targetWordCount
    );

    // Step 2: Generate article
    const result = await this.generateArticle(keyword, outline, options);

    // Add outline cost to total
    result.usage.totalCostCents += outlineUsage.costCents;
    result.usage.steps.unshift({
      step: "outline_generation",
      model: "sonnet",
      costCents: outlineUsage.costCents,
    });

    return result;
  }

  // ============================================
  // CONTENT OPTIMIZATION
  // ============================================

  /**
   * Analyze and score existing content
   */
  async analyzeContent(
    content: string,
    keyword: string
  ): Promise<{
    analysis: ContentAnalysis;
    usage: { costCents: number };
  }> {
    if (!this.isReady()) {
      throw new Error("AI client not configured");
    }

    const prompt = PROMPTS.analyzeContent(content, keyword);
    
    const response = await this.client.chat(
      [{ role: "user", content: prompt.user }],
      prompt.system,
      { model: "sonnet", maxTokens: 2048 }
    );

    const analysis = this.parseJSON<ContentAnalysis>(response.content);

    return {
      analysis,
      usage: { costCents: response.usage.costCents },
    };
  }

  /**
   * Optimize existing content
   */
  async optimizeContent(
    content: string,
    keyword: string,
    suggestions: string[]
  ): Promise<{
    optimizedContent: string;
    usage: { costCents: number };
  }> {
    if (!this.isReady()) {
      throw new Error("AI client not configured");
    }

    const prompt = PROMPTS.optimizeContent(content, keyword, suggestions);
    
    const response = await this.client.chat(
      [{ role: "user", content: prompt.user }],
      prompt.system,
      { model: "sonnet", maxTokens: 8192 }
    );

    return {
      optimizedContent: response.content,
      usage: { costCents: response.usage.costCents },
    };
  }

  /**
   * Generate meta tags for content
   */
  async generateMeta(
    content: string,
    keyword: string
  ): Promise<{
    metaTitle: string;
    metaDescription: string;
    usage: { costCents: number };
  }> {
    if (!this.isReady()) {
      throw new Error("AI client not configured");
    }

    const prompt = PROMPTS.generateMeta(content, keyword);
    
    const response = await this.client.chat(
      [{ role: "user", content: prompt.user }],
      prompt.system,
      { model: "haiku" }
    );

    const meta = this.parseJSON<{ metaTitle: string; metaDescription: string }>(response.content);

    return {
      ...meta,
      usage: { costCents: response.usage.costCents },
    };
  }

  /**
   * Quick SEO score for a page
   */
  async quickScore(siteData: {
    title?: string;
    metaDescription?: string;
    h1?: string;
    headings?: string[];
    wordCount?: number;
    hasSchema?: boolean;
    loadTime?: number;
  }): Promise<{
    score: number;
    grade: string;
    quickWins: string[];
    criticalIssues: string[];
    breakdown: { content: number; technical: number; onPage: number };
    usage: { costCents: number };
  }> {
    if (!this.isReady()) {
      throw new Error("AI client not configured");
    }

    const prompt = PROMPTS.quickSiteScore(siteData);
    
    const response = await this.client.chat(
      [{ role: "user", content: prompt.user }],
      prompt.system,
      { model: "haiku" }
    );

    const result = this.parseJSON<{
      score: number;
      grade: string;
      quickWins: string[];
      criticalIssues: string[];
      breakdown: { content: number; technical: number; onPage: number };
    }>(response.content);

    return {
      ...result,
      usage: { costCents: response.usage.costCents },
    };
  }

  /**
   * Generate content plan
   */
  async generateContentPlan(
    topic: string,
    keywords: string[],
    timeframeDays: number = 30
  ): Promise<{
    plan: {
      overview: string;
      contentPieces: Array<{
        week: number;
        title: string;
        keyword: string;
        type: string;
        priority: string;
        estimatedTraffic: string;
        difficulty: string;
      }>;
      clusterStrategy: string;
      expectedResults: string;
    };
    usage: { costCents: number };
  }> {
    if (!this.isReady()) {
      throw new Error("AI client not configured");
    }

    const prompt = PROMPTS.generateContentPlan(topic, keywords, timeframeDays);
    
    const response = await this.client.chat(
      [{ role: "user", content: prompt.user }],
      prompt.system,
      { model: "haiku", maxTokens: 2048 }
    );

    const plan = this.parseJSON<{
      overview: string;
      contentPieces: Array<{
        week: number;
        title: string;
        keyword: string;
        type: string;
        priority: string;
        estimatedTraffic: string;
        difficulty: string;
      }>;
      clusterStrategy: string;
      expectedResults: string;
    }>(response.content);

    return {
      plan,
      usage: { costCents: response.usage.costCents },
    };
  }

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Parse JSON from AI response with robust extraction
   */
  private parseJSON<T>(content: string): T {
    // Strip any leading/trailing whitespace
    let cleaned = content.trim();
    
    // FIRST: Aggressively strip markdown code blocks (most common issue)
    // Handle: ```json\n{...}\n``` and ```\n{...}\n``` and ```json{...}```
    cleaned = cleaned
      .replace(/^```(?:json|JSON)?\s*\n?/gm, '')  // Opening fence
      .replace(/\n?```\s*$/gm, '')                  // Closing fence
      .replace(/```(?:json|JSON)?/g, '')           // Any remaining fences
      .trim();
    
    // Remove common AI response prefixes
    const prefixPatterns = [
      /^here(?:'s| is) (?:the )?(?:json|response|data)[:\s]*/i,
      /^(?:json|response|data)[:\s]*/i,
      /^sure[,!]?\s*/i,
      /^okay[,!]?\s*/i,
    ];
    for (const pattern of prefixPatterns) {
      cleaned = cleaned.replace(pattern, "");
    }
    
    // Try direct parse first (most efficient)
    try {
      return JSON.parse(cleaned);
    } catch {
      // Continue to extraction methods
    }
    
    // Try to extract JSON from inline code (backticks)
    const inlineMatch = cleaned.match(/`([\[\{][\s\S]*?[\]\}])`/);
    if (inlineMatch && inlineMatch[1]) {
      try {
        return JSON.parse(inlineMatch[1].trim());
      } catch {
        // Continue
      }
    }

    // Try to find balanced JSON by finding start and matching end
    const trimmed = cleaned.trim();
    
    // Find the first [ or {
    const arrayStart = trimmed.indexOf('[');
    const objectStart = trimmed.indexOf('{');
    
    let startIndex = -1;
    let isArray = false;
    
    if (arrayStart >= 0 && (objectStart < 0 || arrayStart < objectStart)) {
      startIndex = arrayStart;
      isArray = true;
    } else if (objectStart >= 0) {
      startIndex = objectStart;
      isArray = false;
    }
    
    if (startIndex >= 0) {
      // Try to parse from this position, looking for valid JSON
      const jsonCandidate = trimmed.slice(startIndex);
      
      // Try parsing progressively shorter strings until we find valid JSON
      // This handles cases where there's trailing text after the JSON
      const endChar = isArray ? ']' : '}';
      let lastEndIndex = jsonCandidate.lastIndexOf(endChar);
      
      while (lastEndIndex >= 0) {
        const attempt = jsonCandidate.slice(0, lastEndIndex + 1);
        try {
          return JSON.parse(attempt);
        } catch {
          // Find the previous end character
          lastEndIndex = jsonCandidate.lastIndexOf(endChar, lastEndIndex - 1);
        }
      }
    }

    // FALLBACK: Try to fix common JSON issues (truncated strings, etc.)
    try {
      // Try to fix truncated JSON by closing open structures
      let fixed = trimmed;
      if (startIndex >= 0) {
        fixed = trimmed.slice(startIndex);
      }
      
      // Count brackets to see what needs closing
      let braceCount = 0;
      let bracketCount = 0;
      let inString = false;
      let escaped = false;
      
      for (let i = 0; i < fixed.length; i++) {
        const char = fixed[i];
        if (escaped) {
          escaped = false;
          continue;
        }
        if (char === '\\') {
          escaped = true;
          continue;
        }
        if (char === '"') {
          inString = !inString;
          continue;
        }
        if (!inString) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
          if (char === '[') bracketCount++;
          if (char === ']') bracketCount--;
        }
      }
      
      // If we're in a string, close it
      if (inString) {
        fixed += '"';
      }
      
      // Close any open brackets/braces
      while (bracketCount > 0) {
        fixed += ']';
        bracketCount--;
      }
      while (braceCount > 0) {
        fixed += '}';
        braceCount--;
      }
      
      return JSON.parse(fixed);
    } catch {
      // Continue to final error
    }

    // Last resort: try parsing the entire content
    try {
      return JSON.parse(trimmed);
    } catch (error) {
      console.error("Failed to parse JSON. Raw content length:", content.length);
      console.error("First 500 chars:", content.slice(0, 500));
      console.error("Last 500 chars:", content.slice(-500));
      throw new Error(`Failed to parse AI response as JSON: ${(error as Error).message}`);
    }
  }

  /**
   * Estimate cost before running pipeline
   */
  estimatePipelineCost(
    contentLength: number,
    options: { includeOutline?: boolean; includeFaqs?: boolean; includeLinks?: boolean } = {}
  ): number {
    let totalCents = 0;

    // Outline generation (Sonnet)
    if (options.includeOutline) {
      totalCents += this.client.estimateCost("sonnet", 2000, 1500);
    }

    // Article generation (Sonnet) - main cost
    totalCents += this.client.estimateCost("sonnet", 3000, contentLength);

    // FAQs (Haiku)
    if (options.includeFaqs) {
      totalCents += this.client.estimateCost("haiku", 2000, 500);
    }

    // Internal links (Haiku)
    if (options.includeLinks) {
      totalCents += this.client.estimateCost("haiku", 3000, 500);
    }

    return Math.ceil(totalCents);
  }

  // ============================================
  // AIO (AI OPTIMIZATION) METHODS
  // ============================================

  /**
   * Optimize content for AI visibility
   */
  async optimizeForAIO(
    content: string,
    keyword: string,
    mode: "seo" | "aio" | "balanced" = "balanced"
  ): Promise<{
    optimizedContent: string;
    usage: { costCents: number };
  }> {
    if (!this.isReady()) {
      throw new Error("AI client not configured");
    }

    const prompt = PROMPTS.optimizeForAIO(content, keyword, mode);
    
    const response = await this.client.chat(
      [{ role: "user", content: prompt.user }],
      prompt.system,
      { model: "sonnet", maxTokens: 8192 }
    );

    return {
      optimizedContent: response.content,
      usage: { costCents: response.usage.costCents },
    };
  }

  /**
   * Generate AIO-optimized outline
   */
  async generateAIOOutline(
    keyword: string,
    serpResults: Array<{ title: string; snippet: string }>,
    targetWordCount: number = 2000
  ): Promise<{
    outline: ContentOutline & {
      keyTakeaways?: string[];
      definitions?: string[];
      statistics?: string[];
      expertQuotes?: string[];
      schemaTypes?: string[];
    };
    usage: { costCents: number };
  }> {
    if (!this.isReady()) {
      throw new Error("AI client not configured");
    }

    const prompt = PROMPTS.generateAIOOutline(keyword, serpResults, targetWordCount);
    
    const response = await this.client.chat(
      [{ role: "user", content: prompt.user }],
      prompt.system,
      { model: "sonnet", maxTokens: 4096 }
    );

    type AIOOutline = ContentOutline & {
      keyTakeaways?: string[];
      definitions?: string[];
      statistics?: string[];
      expertQuotes?: string[];
      schemaTypes?: string[];
    };

    let outline: AIOOutline;
    try {
      outline = this.parseJSON<AIOOutline>(response.content);
    } catch (parseError) {
      // Fallback: create a basic outline if parsing fails
      console.warn("[Content Pipeline] AIO outline parse failed, using fallback:", parseError);
      const capitalizedKeyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      outline = {
        title: `The Complete Guide to ${capitalizedKeyword}`,
        metaTitle: `${capitalizedKeyword} - Complete Guide | CabbageSEO`,
        metaDescription: `Learn everything about ${keyword}. Comprehensive guide with expert tips, best practices, and actionable strategies.`,
        headings: [
          { level: 2, text: `What is ${capitalizedKeyword}?`, points: ["Definition", "Key concepts"], wordCount: 300 },
          { level: 2, text: `Why ${capitalizedKeyword} Matters`, points: ["Benefits", "Impact"], wordCount: 300 },
          { level: 2, text: `How to Get Started with ${capitalizedKeyword}`, points: ["Step 1", "Step 2", "Step 3"], wordCount: 400 },
          { level: 2, text: `Best Practices for ${capitalizedKeyword}`, points: ["Tip 1", "Tip 2", "Tip 3"], wordCount: 300 },
          { level: 2, text: `Common Mistakes to Avoid`, points: ["Mistake 1", "Mistake 2"], wordCount: 300 },
          { level: 2, text: `Conclusion`, points: ["Summary", "Next steps"], wordCount: 200 },
        ],
        faqs: [
          { question: `What is ${keyword}?`, answer: `A brief overview of ${keyword}.` },
          { question: `How do I get started with ${keyword}?`, answer: `Start by understanding the basics...` },
          { question: `What are the benefits of ${keyword}?`, answer: `The main benefits include...` },
        ],
        keyTakeaways: [
          `Understanding ${keyword} is essential for success`,
          `Start with the fundamentals before advanced techniques`,
          `Consistent practice leads to better results`,
        ],
      };
    }

    return {
      outline,
      usage: { costCents: response.usage.costCents },
    };
  }

  /**
   * Generate key takeaways from content
   */
  async generateKeyTakeaways(
    content: string,
    keyword: string
  ): Promise<{
    takeaways: string[];
    usage: { costCents: number };
  }> {
    if (!this.isReady()) {
      throw new Error("AI client not configured");
    }

    const prompt = PROMPTS.generateKeyTakeaways(content, keyword);
    
    const response = await this.client.chat(
      [{ role: "user", content: prompt.user }],
      prompt.system,
      { model: "haiku" }
    );

    const takeaways = this.parseJSON<string[]>(response.content);

    return {
      takeaways,
      usage: { costCents: response.usage.costCents },
    };
  }

  /**
   * Inject entities into content
   */
  async injectEntities(
    content: string,
    entities: string[]
  ): Promise<{
    enhancedContent: string;
    usage: { costCents: number };
  }> {
    if (!this.isReady()) {
      throw new Error("AI client not configured");
    }

    const prompt = PROMPTS.injectEntities(content, entities);
    
    const response = await this.client.chat(
      [{ role: "user", content: prompt.user }],
      prompt.system,
      { model: "haiku", maxTokens: 4096 }
    );

    return {
      enhancedContent: response.content,
      usage: { costCents: response.usage.costCents },
    };
  }

  /**
   * Improve content quotability
   */
  async improveQuotability(
    content: string
  ): Promise<{
    improvedContent: string;
    usage: { costCents: number };
  }> {
    if (!this.isReady()) {
      throw new Error("AI client not configured");
    }

    const prompt = PROMPTS.improveQuotability(content);
    
    const response = await this.client.chat(
      [{ role: "user", content: prompt.user }],
      prompt.system,
      { model: "sonnet", maxTokens: 8192 }
    );

    return {
      improvedContent: response.content,
      usage: { costCents: response.usage.costCents },
    };
  }

  /**
   * Analyze content for AIO readiness
   */
  async analyzeAIOReadiness(
    content: string,
    keyword: string
  ): Promise<{
    analysis: AIOAnalysisResult;
    usage: { costCents: number };
  }> {
    if (!this.isReady()) {
      throw new Error("AI client not configured");
    }

    const prompt = PROMPTS.analyzeAIOReadiness(content, keyword);
    
    const response = await this.client.chat(
      [{ role: "user", content: prompt.user }],
      prompt.system,
      { model: "sonnet", maxTokens: 2048 }
    );

    const analysis = this.parseJSON<AIOAnalysisResult>(response.content);

    return {
      analysis,
      usage: { costCents: response.usage.costCents },
    };
  }

  /**
   * Full AIO content generation pipeline
   */
  async generateAIOContent(
    keyword: string,
    serpResults: Array<{ title: string; snippet: string }>,
    options: PipelineOptions = {}
  ): Promise<GeneratedContent> {
    const tracker = createUsageTracker();
    const targetWordCount = options.targetWordCount || 2000;

    // Step 1: Generate AIO-optimized outline
    const { outline, usage: outlineUsage } = await this.generateAIOOutline(
      keyword,
      serpResults,
      targetWordCount
    );

    recordUsage(
      tracker,
      "aio_outline",
      "sonnet",
      0,
      0,
      outlineUsage.costCents
    );

    // Step 2: Generate article
    const result = await this.generateArticle(keyword, outline, {
      ...options,
      generateFaqs: true,
    });

    // Update usage
    result.usage.totalCostCents += outlineUsage.costCents;

    // Step 3: Optimize for AIO if requested
    if (options.optimizationMode === "aio" || options.optimizationMode === "balanced") {
      const { optimizedContent, usage: aioUsage } = await this.optimizeForAIO(
        result.body,
        keyword,
        options.optimizationMode
      );
      result.body = optimizedContent;
      result.usage.totalCostCents += aioUsage.costCents;
      result.usage.steps.push({
        step: "aio_optimization",
        model: "sonnet",
        costCents: aioUsage.costCents,
      });
    }

    // Step 4: Add key takeaways if requested
    if (options.addKeyTakeaways) {
      const { takeaways, usage: takeawaysUsage } = await this.generateKeyTakeaways(
        result.body,
        keyword
      );
      
      // Prepend key takeaways to body
      const takeawaysSection = `## Key Takeaways\n\n${takeaways.map(t => `- ${t}`).join("\n")}\n\n`;
      result.body = takeawaysSection + result.body;
      result.usage.totalCostCents += takeawaysUsage.costCents;
      result.usage.steps.push({
        step: "key_takeaways",
        model: "haiku",
        costCents: takeawaysUsage.costCents,
      });
    }

    // Step 5: Inject entities if provided
    if (options.entitiesToAdd && options.entitiesToAdd.length > 0) {
      const { enhancedContent, usage: entityUsage } = await this.injectEntities(
        result.body,
        options.entitiesToAdd
      );
      result.body = enhancedContent;
      result.usage.totalCostCents += entityUsage.costCents;
      result.usage.steps.push({
        step: "entity_injection",
        model: "haiku",
        costCents: entityUsage.costCents,
      });
    }

    // Step 6: Improve quotability if requested
    if (options.optimizeQuotability) {
      const { improvedContent, usage: quotabilityUsage } = await this.improveQuotability(
        result.body
      );
      result.body = improvedContent;
      result.usage.totalCostCents += quotabilityUsage.costCents;
      result.usage.steps.push({
        step: "quotability_optimization",
        model: "sonnet",
        costCents: quotabilityUsage.costCents,
      });
    }

    // Recalculate word count
    result.wordCount = result.body.split(/\s+/).length;
    result.readingTime = Math.ceil(result.wordCount / 200);

    return result;
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const contentPipeline = new ContentPipeline();

