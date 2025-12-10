/**
 * Surfer SEO API Client
 * Handles content optimization scoring and NLP analysis
 * 
 * Note: Surfer's public API is limited. This implementation covers
 * the available endpoints and includes fallback scoring logic.
 */

interface SurferConfig {
  apiKey?: string;
}

interface ContentScore {
  overall: number;         // 0-100 overall optimization score
  wordCount: number;
  targetWordCount: number;
  headingsScore: number;   // H1, H2, H3 optimization
  keywordScore: number;    // Keyword usage score
  readabilityScore: number;
  structureScore: number;  // Paragraphs, lists, etc.
  suggestions: ContentSuggestion[];
}

interface ContentSuggestion {
  type: "add" | "remove" | "modify";
  category: "keywords" | "headings" | "structure" | "readability" | "length";
  priority: "high" | "medium" | "low";
  suggestion: string;
  currentValue?: string | number;
  targetValue?: string | number;
}

interface KeywordAnalysis {
  keyword: string;
  count: number;
  density: number;
  recommendedCount: { min: number; max: number };
  status: "optimal" | "under" | "over";
}

interface CompetitorData {
  url: string;
  title: string;
  wordCount: number;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  keywords: string[];
  score?: number;
}

interface SERPAnalysis {
  keyword: string;
  avgWordCount: number;
  avgHeadings: number;
  commonTerms: Array<{ term: string; frequency: number }>;
  competitors: CompetitorData[];
  recommendations: {
    targetWordCount: { min: number; max: number };
    targetHeadings: { min: number; max: number };
    mustIncludeTerms: string[];
    relatedTerms: string[];
  };
}

export class SurferClient {
  private apiKey: string;
  private baseUrl = "https://api.surferseo.com/v1";

  constructor(config?: SurferConfig) {
    this.apiKey = config?.apiKey || process.env.SURFER_API_KEY || "";
  }

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Make authenticated request to Surfer API
   */
  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" = "GET",
    body?: unknown
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error("Surfer API key not configured");
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Surfer API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Analyze content and get optimization score
   * Falls back to local analysis if API unavailable
   */
  async analyzeContent(
    content: string,
    targetKeyword: string,
    options: {
      competitors?: string[];
      targetWordCount?: number;
    } = {}
  ): Promise<ContentScore> {
    // If API is configured, try to use it
    if (this.isConfigured()) {
      try {
        // Note: Actual Surfer API endpoints may differ
        // This is a representation of what the integration would look like
        const result = await this.request<{
          score: number;
          suggestions: ContentSuggestion[];
        }>("/content/analyze", "POST", {
          content,
          keyword: targetKeyword,
          competitors: options.competitors,
        });

        return {
          overall: result.score,
          wordCount: this.countWords(content),
          targetWordCount: options.targetWordCount || 2000,
          headingsScore: 0,
          keywordScore: 0,
          readabilityScore: 0,
          structureScore: 0,
          suggestions: result.suggestions,
        };
      } catch (error) {
        console.warn("Surfer API failed, falling back to local analysis:", error);
      }
    }

    // Fallback: Local content analysis
    return this.analyzeContentLocally(content, targetKeyword, options.targetWordCount);
  }

  /**
   * Local content analysis (fallback when API unavailable)
   * Implements SEO scoring heuristics
   */
  private analyzeContentLocally(
    content: string,
    targetKeyword: string,
    targetWordCount: number = 2000
  ): ContentScore {
    const wordCount = this.countWords(content);
    const lowerContent = content.toLowerCase();
    const lowerKeyword = targetKeyword.toLowerCase();

    // Keyword analysis
    const keywordCount = (lowerContent.match(new RegExp(lowerKeyword, "g")) || []).length;
    const keywordDensity = (keywordCount / wordCount) * 100;
    const optimalDensity = { min: 0.5, max: 2.5 };
    
    let keywordScore = 100;
    if (keywordDensity < optimalDensity.min) {
      keywordScore = (keywordDensity / optimalDensity.min) * 100;
    } else if (keywordDensity > optimalDensity.max) {
      keywordScore = Math.max(0, 100 - ((keywordDensity - optimalDensity.max) * 20));
    }

    // Word count score
    let wordCountScore = 100;
    if (wordCount < targetWordCount * 0.7) {
      wordCountScore = (wordCount / (targetWordCount * 0.7)) * 100;
    } else if (wordCount > targetWordCount * 1.5) {
      wordCountScore = 80; // Slight penalty for being too long
    }

    // Headings analysis
    const h1Count = (content.match(/<h1|^#\s/gmi) || []).length;
    const h2Count = (content.match(/<h2|^##\s/gmi) || []).length;
    const h3Count = (content.match(/<h3|^###\s/gmi) || []).length;
    
    let headingsScore = 100;
    if (h1Count !== 1) headingsScore -= 20;
    if (h2Count < 3) headingsScore -= 10 * (3 - h2Count);
    if (h2Count > 10) headingsScore -= 10;

    // Structure score (paragraphs, lists)
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
    const avgParagraphLength = wordCount / paragraphs.length;
    
    let structureScore = 100;
    if (avgParagraphLength > 150) structureScore -= 20;
    if (avgParagraphLength > 200) structureScore -= 20;
    
    const hasList = /<[ou]l>|^[-*]\s|^\d+\./m.test(content);
    if (!hasList && wordCount > 500) structureScore -= 10;

    // Readability (simplified Flesch-Kincaid)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = wordCount / sentences.length;
    
    let readabilityScore = 100;
    if (avgWordsPerSentence > 25) readabilityScore -= 20;
    if (avgWordsPerSentence > 30) readabilityScore -= 20;
    if (avgWordsPerSentence < 10) readabilityScore -= 10;

    // Overall score (weighted average)
    const overall = Math.round(
      (keywordScore * 0.25) +
      (wordCountScore * 0.2) +
      (headingsScore * 0.2) +
      (structureScore * 0.15) +
      (readabilityScore * 0.2)
    );

    // Generate suggestions
    const suggestions: ContentSuggestion[] = [];

    if (wordCount < targetWordCount * 0.8) {
      suggestions.push({
        type: "add",
        category: "length",
        priority: "high",
        suggestion: `Add more content. Current: ${wordCount} words, target: ${targetWordCount} words.`,
        currentValue: wordCount,
        targetValue: targetWordCount,
      });
    }

    if (keywordDensity < optimalDensity.min) {
      suggestions.push({
        type: "add",
        category: "keywords",
        priority: "high",
        suggestion: `Add more mentions of "${targetKeyword}". Current density: ${keywordDensity.toFixed(2)}%, target: ${optimalDensity.min}-${optimalDensity.max}%.`,
        currentValue: keywordDensity.toFixed(2),
        targetValue: `${optimalDensity.min}-${optimalDensity.max}`,
      });
    } else if (keywordDensity > optimalDensity.max) {
      suggestions.push({
        type: "remove",
        category: "keywords",
        priority: "medium",
        suggestion: `Reduce keyword stuffing. Current density: ${keywordDensity.toFixed(2)}%, target: ${optimalDensity.min}-${optimalDensity.max}%.`,
        currentValue: keywordDensity.toFixed(2),
        targetValue: `${optimalDensity.min}-${optimalDensity.max}`,
      });
    }

    if (h1Count === 0) {
      suggestions.push({
        type: "add",
        category: "headings",
        priority: "high",
        suggestion: "Add an H1 heading with your target keyword.",
      });
    } else if (h1Count > 1) {
      suggestions.push({
        type: "modify",
        category: "headings",
        priority: "medium",
        suggestion: `Use only one H1 heading per page. Currently: ${h1Count} H1 tags.`,
        currentValue: h1Count,
        targetValue: 1,
      });
    }

    if (h2Count < 3) {
      suggestions.push({
        type: "add",
        category: "headings",
        priority: "medium",
        suggestion: `Add more H2 headings to break up content. Currently: ${h2Count}, recommended: 3-8.`,
        currentValue: h2Count,
        targetValue: "3-8",
      });
    }

    if (avgWordsPerSentence > 25) {
      suggestions.push({
        type: "modify",
        category: "readability",
        priority: "medium",
        suggestion: `Shorten sentences for better readability. Average: ${avgWordsPerSentence.toFixed(1)} words, target: 15-20.`,
        currentValue: avgWordsPerSentence.toFixed(1),
        targetValue: "15-20",
      });
    }

    if (avgParagraphLength > 150) {
      suggestions.push({
        type: "modify",
        category: "structure",
        priority: "low",
        suggestion: "Break up long paragraphs. Keep paragraphs under 100 words for better readability.",
      });
    }

    if (!hasList && wordCount > 500) {
      suggestions.push({
        type: "add",
        category: "structure",
        priority: "low",
        suggestion: "Add bullet points or numbered lists to improve scannability.",
      });
    }

    return {
      overall,
      wordCount,
      targetWordCount,
      headingsScore,
      keywordScore,
      readabilityScore,
      structureScore,
      suggestions,
    };
  }

  /**
   * Analyze keyword usage in content
   */
  analyzeKeywordUsage(
    content: string,
    keywords: string[]
  ): KeywordAnalysis[] {
    const wordCount = this.countWords(content);
    const lowerContent = content.toLowerCase();

    return keywords.map(keyword => {
      const lowerKeyword = keyword.toLowerCase();
      const count = (lowerContent.match(new RegExp(`\\b${this.escapeRegex(lowerKeyword)}\\b`, "g")) || []).length;
      const density = (count / wordCount) * 100;
      
      // Recommended count based on content length and keyword type
      const targetDensity = keyword.split(" ").length > 2 ? 0.5 : 1.5; // Long-tail vs short keywords
      const recommendedMin = Math.floor((targetDensity * 0.5 * wordCount) / 100);
      const recommendedMax = Math.ceil((targetDensity * 1.5 * wordCount) / 100);

      let status: "optimal" | "under" | "over" = "optimal";
      if (count < recommendedMin) status = "under";
      if (count > recommendedMax) status = "over";

      return {
        keyword,
        count,
        density,
        recommendedCount: { min: recommendedMin, max: recommendedMax },
        status,
      };
    });
  }

  /**
   * Analyze SERP and get content recommendations
   * Uses local analysis if API unavailable
   */
  async analyzeSERP(
    keyword: string,
    topResults: Array<{ url: string; title: string; content?: string }>
  ): Promise<SERPAnalysis> {
    // If API is configured, try to use it
    if (this.isConfigured()) {
      try {
        const result = await this.request<SERPAnalysis>("/serp/analyze", "POST", {
          keyword,
          urls: topResults.map(r => r.url),
        });
        return result;
      } catch (error) {
        console.warn("Surfer SERP API failed, falling back to local analysis:", error);
      }
    }

    // Fallback: Local SERP analysis
    return this.analyzeSERPLocally(keyword, topResults);
  }

  /**
   * Local SERP analysis (fallback)
   */
  private analyzeSERPLocally(
    keyword: string,
    topResults: Array<{ url: string; title: string; content?: string }>
  ): SERPAnalysis {
    const competitors: CompetitorData[] = [];
    const wordCounts: number[] = [];
    const headingCounts: number[] = [];
    const allTerms: Map<string, number> = new Map();

    for (const result of topResults) {
      const content = result.content || "";
      const wordCount = this.countWords(content);
      wordCounts.push(wordCount);

      // Extract headings
      const h1Matches = content.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
      const h2Matches = content.match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
      const h3Matches = content.match(/<h3[^>]*>(.*?)<\/h3>/gi) || [];
      
      headingCounts.push(h1Matches.length + h2Matches.length + h3Matches.length);

      // Extract common terms (simple NLP)
      const words = content.toLowerCase()
        .replace(/<[^>]*>/g, " ")
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter(w => w.length > 4);

      for (const word of words) {
        allTerms.set(word, (allTerms.get(word) || 0) + 1);
      }

      competitors.push({
        url: result.url,
        title: result.title,
        wordCount,
        headings: {
          h1: h1Matches.map(h => h.replace(/<[^>]*>/g, "")),
          h2: h2Matches.map(h => h.replace(/<[^>]*>/g, "")),
          h3: h3Matches.map(h => h.replace(/<[^>]*>/g, "")),
        },
        keywords: [],
      });
    }

    // Calculate averages
    const avgWordCount = wordCounts.length > 0
      ? Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length)
      : 1500;
    const avgHeadings = headingCounts.length > 0
      ? Math.round(headingCounts.reduce((a, b) => a + b, 0) / headingCounts.length)
      : 5;

    // Get top terms
    const sortedTerms = Array.from(allTerms.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([term, frequency]) => ({ term, frequency }));

    // Filter out common stop words
    const stopWords = new Set(["about", "their", "there", "these", "those", "which", "would", "could", "should", "being", "having", "other"]);
    const meaningfulTerms = sortedTerms.filter(t => !stopWords.has(t.term));

    return {
      keyword,
      avgWordCount,
      avgHeadings,
      commonTerms: meaningfulTerms,
      competitors,
      recommendations: {
        targetWordCount: {
          min: Math.round(avgWordCount * 0.8),
          max: Math.round(avgWordCount * 1.2),
        },
        targetHeadings: {
          min: Math.max(3, avgHeadings - 2),
          max: avgHeadings + 3,
        },
        mustIncludeTerms: meaningfulTerms.slice(0, 5).map(t => t.term),
        relatedTerms: meaningfulTerms.slice(5, 15).map(t => t.term),
      },
    };
  }

  /**
   * Helper: Count words in text
   */
  private countWords(text: string): number {
    return text
      .replace(/<[^>]*>/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 0).length;
  }

  /**
   * Helper: Escape regex special characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}

// Export singleton instance
export const surfer = new SurferClient();
