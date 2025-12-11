/**
 * AI Visibility Score Calculator
 * 
 * Calculates combined AIO score from individual platform scores using weighted average.
 */

import type {
  AIOPlatform,
  AIOScores,
  PlatformScore,
  Recommendation,
  AIOAnalysisInput,
  AIOAnalysisResult,
  ExtractedEntity,
  QuotableSnippet,
  ContentStructure,
  MissingElement,
} from "./types";
import { PLATFORM_WEIGHTS, AIO_PLATFORMS } from "./types";
import { platformAnalyzers } from "./platforms";

export interface VisibilityScoreOptions {
  /** Platforms to analyze (default: all) */
  platforms?: AIOPlatform[];
  /** Custom weights (must sum to 1.0) */
  customWeights?: Partial<Record<AIOPlatform, number>>;
}

/**
 * Calculate combined AI visibility score from platform scores
 */
export function calculateCombinedScore(
  platformScores: Record<AIOPlatform, number>,
  options?: VisibilityScoreOptions
): number {
  const weights = { ...PLATFORM_WEIGHTS, ...options?.customWeights };
  const platforms = options?.platforms || AIO_PLATFORMS;

  // Normalize weights for selected platforms
  const totalWeight = platforms.reduce((sum, p) => sum + (weights[p] || 0), 0);

  if (totalWeight === 0) return 0;

  const weightedSum = platforms.reduce((sum, platform) => {
    const score = platformScores[platform] || 0;
    const weight = weights[platform] || 0;
    return sum + score * weight;
  }, 0);

  return Math.round(weightedSum / totalWeight);
}

/**
 * Full AIO Visibility Analyzer
 * Orchestrates all platform analyzers and produces comprehensive results
 */
export class AIOVisibilityAnalyzer {
  private options: VisibilityScoreOptions;

  constructor(options?: VisibilityScoreOptions) {
    this.options = options || {};
  }

  /**
   * Run full AIO analysis on content
   */
  async analyze(input: AIOAnalysisInput): Promise<AIOAnalysisResult> {
    const startTime = Date.now();
    const platforms = this.options.platforms || AIO_PLATFORMS;

    // Run all platform analyzers in parallel
    const platformResults = await Promise.all(
      platforms.map(async (platform) => {
        const analyzer = platformAnalyzers[platform];
        return analyzer.analyze(input);
      })
    );

    // Extract scores
    const platformScoresRecord: Record<AIOPlatform, number> = {} as Record<AIOPlatform, number>;
    for (const result of platformResults) {
      platformScoresRecord[result.platform] = result.score;
    }

    // Calculate combined score
    const combinedScore = calculateCombinedScore(platformScoresRecord, this.options);

    // Extract entities (combined from content analysis)
    const entities = this.extractEntities(input.content);

    // Calculate entity density
    const wordCount = input.wordCount || input.content.split(/\s+/).length;
    const entityDensity = (entities.length / Math.max(wordCount, 1)) * 1000;

    // Extract quotable snippets
    const quotableSnippets = this.extractQuotableSnippets(input.content);
    const quotabilityScore = this.calculateQuotabilityScore(quotableSnippets, input.content);

    // Analyze content structure
    const contentStructure = this.analyzeContentStructure(input);
    const answerStructureScore = this.calculateAnswerStructureScore(contentStructure);

    // Find missing elements
    const missingElements = this.findMissingElements(contentStructure, input);

    // Aggregate recommendations from all platforms
    const allRecommendations: Recommendation[] = [];
    for (const result of platformResults) {
      allRecommendations.push(...result.recommendations);
    }

    // Deduplicate and prioritize recommendations
    const recommendations = this.deduplicateRecommendations(allRecommendations);

    // Calculate breakdown scores
    const breakdown = this.calculateBreakdownScores(
      entities,
      wordCount,
      quotabilityScore,
      answerStructureScore,
      input,
      contentStructure
    );

    const analysisDurationMs = Date.now() - startTime;

    return {
      scores: {
        combined: combinedScore,
        platforms: platformScoresRecord,
        breakdown,
      },
      platformScores: platformResults,
      entities,
      entityDensity,
      quotableSnippets,
      quotabilityScore,
      contentStructure,
      answerStructureScore,
      missingElements,
      recommendations,
      analyzedAt: new Date(),
      modelUsed: "rule-based-v1", // Will be enhanced with Claude later
      tokensUsed: 0,
      analysisDurationMs,
    };
  }

  private extractEntities(content: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const entityCounts = new Map<string, number>();

    // Extract capitalized phrases (simple NER)
    const phrases = content.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
    
    for (const phrase of phrases) {
      const normalized = phrase.toLowerCase();
      entityCounts.set(normalized, (entityCounts.get(normalized) || 0) + 1);
    }

    // Convert to entity objects
    for (const [name, mentions] of entityCounts) {
      if (name.length > 3) {
        const type = this.inferEntityType(name);
        entities.push({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          type,
          mentions,
          contextQuality: this.assessContextQuality(name, content),
        });
      }
    }

    // Sort by mentions and return top 50
    return entities
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 50);
  }

  private inferEntityType(name: string): ExtractedEntity["type"] {
    const lower = name.toLowerCase();
    
    // Simple heuristics - will be enhanced with Claude
    if (lower.includes("inc") || lower.includes("corp") || lower.includes("llc")) {
      return "organization";
    }
    if (lower.includes("dr") || lower.includes("mr") || lower.includes("ms")) {
      return "person";
    }
    // Default to other
    return "other";
  }

  private assessContextQuality(entityName: string, content: string): number {
    const lower = content.toLowerCase();
    const nameLower = entityName.toLowerCase();

    // Check if entity is defined/explained
    if (
      lower.includes(`${nameLower} is`) ||
      lower.includes(`${nameLower}, which`) ||
      lower.includes(`${nameLower} refers`)
    ) {
      return 80;
    }

    // Check if mentioned multiple times (implies importance)
    const mentions = (lower.match(new RegExp(nameLower, "g")) || []).length;
    if (mentions >= 5) return 70;
    if (mentions >= 3) return 60;

    return 50;
  }

  private extractQuotableSnippets(content: string): QuotableSnippet[] {
    const snippets: QuotableSnippet[] = [];
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 20);

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      const words = sentence.split(/\s+/).length;

      // Skip too short or too long sentences
      if (words < 10 || words > 50) continue;

      const type = this.categorizeSnippet(sentence);
      const quotabilityScore = this.scoreSnippetQuotability(sentence, type);

      if (quotabilityScore >= 60) {
        snippets.push({
          text: sentence,
          type,
          position: content.indexOf(sentence),
          quotabilityScore,
        });
      }
    }

    return snippets.slice(0, 20); // Top 20 quotable snippets
  }

  private categorizeSnippet(sentence: string): QuotableSnippet["type"] {
    const lower = sentence.toLowerCase();

    if (/\d+%|\d+\s*(million|billion)|\$\d+/.test(sentence)) {
      return "statistic";
    }
    if (lower.includes("is defined as") || lower.includes("refers to")) {
      return "definition";
    }
    if (/step\s*\d|first,|second,/i.test(sentence)) {
      return "step";
    }
    if (lower.includes("key") || lower.includes("important") || lower.includes("main")) {
      return "key_point";
    }
    if (sentence.includes("?")) {
      return "answer";
    }

    return "fact";
  }

  private scoreSnippetQuotability(sentence: string, type: QuotableSnippet["type"]): number {
    let score = 50;

    // Type bonuses
    const typeBonus: Record<QuotableSnippet["type"], number> = {
      statistic: 20,
      definition: 20,
      step: 15,
      key_point: 15,
      answer: 10,
      fact: 5,
    };
    score += typeBonus[type] || 0;

    // Length bonus (ideal: 15-30 words)
    const words = sentence.split(/\s+/).length;
    if (words >= 15 && words <= 30) {
      score += 15;
    } else if (words >= 10 && words <= 40) {
      score += 10;
    }

    // Contains specific claim
    if (/\d/.test(sentence)) {
      score += 10;
    }

    // Contains expert reference
    if (/according to|expert|research|study/i.test(sentence)) {
      score += 10;
    }

    return Math.min(100, score);
  }

  private calculateQuotabilityScore(
    snippets: QuotableSnippet[],
    content: string
  ): number {
    if (snippets.length === 0) return 30;

    // Average quotability of snippets
    const avgQuotability =
      snippets.reduce((sum, s) => sum + s.quotabilityScore, 0) / snippets.length;

    // Snippet density (quotable snippets per 1000 words)
    const wordCount = content.split(/\s+/).length;
    const density = (snippets.length / Math.max(wordCount, 1)) * 1000;

    // Ideal: 5-15 quotable snippets per 1000 words
    let densityScore = 0;
    if (density >= 5 && density <= 15) {
      densityScore = 100;
    } else if (density >= 3 && density < 5) {
      densityScore = 70;
    } else if (density > 15) {
      densityScore = 80;
    } else {
      densityScore = density * 20;
    }

    return Math.round((avgQuotability * 0.6 + densityScore * 0.4));
  }

  private analyzeContentStructure(input: AIOAnalysisInput): ContentStructure {
    const content = input.content.toLowerCase();
    const headings = input.headings || [];

    return {
      hasDirectAnswer: this.hasDirectAnswer(input.content),
      hasKeyTakeaways:
        content.includes("key takeaway") ||
        content.includes("key point") ||
        content.includes("tl;dr") ||
        content.includes("summary"),
      hasFAQSection:
        content.includes("faq") ||
        content.includes("frequently asked") ||
        headings.some((h) => h.text.toLowerCase().includes("question")),
      hasHowToSection: content.includes("how to") || content.includes("step by step"),
      hasStepByStep: /step\s*[1-9]|first,.*second,|1\.\s/.test(content),
      hasExpertAttribution:
        content.includes("according to") ||
        content.includes("expert") ||
        content.includes("research"),
      hasStatistics: /\d+%|\d+\s*(million|billion)|\$\d+/.test(content),
      hasDefinitions:
        content.includes("is defined as") ||
        content.includes("refers to") ||
        content.includes("means that"),
      headingHierarchy: this.evaluateHeadingHierarchy(headings),
      paragraphStructure: this.evaluateParagraphStructure(input.content),
    };
  }

  private hasDirectAnswer(content: string): boolean {
    const firstParagraph = content.split(/\n\n/)[0] || "";
    return firstParagraph.length >= 100 && firstParagraph.length <= 500;
  }

  private evaluateHeadingHierarchy(
    headings: { level: number; text: string }[]
  ): "good" | "fair" | "poor" {
    if (headings.length === 0) return "poor";
    if (headings.length >= 5) return "good";
    if (headings.length >= 2) return "fair";
    return "poor";
  }

  private evaluateParagraphStructure(content: string): "good" | "fair" | "poor" {
    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0);
    if (paragraphs.length === 0) return "poor";

    const avgLength =
      paragraphs.reduce((sum, p) => sum + p.split(/\s+/).length, 0) /
      paragraphs.length;

    if (avgLength >= 40 && avgLength <= 150) return "good";
    if (avgLength >= 30 && avgLength <= 200) return "fair";
    return "poor";
  }

  private calculateAnswerStructureScore(structure: ContentStructure): number {
    let score = 0;

    if (structure.hasDirectAnswer) score += 25;
    if (structure.hasKeyTakeaways) score += 15;
    if (structure.hasFAQSection) score += 15;
    if (structure.hasStepByStep) score += 10;
    if (structure.hasStatistics) score += 10;
    if (structure.hasDefinitions) score += 10;
    if (structure.headingHierarchy === "good") score += 10;
    else if (structure.headingHierarchy === "fair") score += 5;
    if (structure.paragraphStructure === "good") score += 5;

    return Math.min(100, score);
  }

  private findMissingElements(
    structure: ContentStructure,
    input: AIOAnalysisInput
  ): MissingElement[] {
    const missing: MissingElement[] = [];

    if (!structure.hasDirectAnswer) {
      missing.push({
        element: "Direct Answer",
        importance: "critical",
        description: "First paragraph should directly answer the main query",
        suggestion: "Lead with a clear, concise answer in the first 100-150 words",
      });
    }

    if (!structure.hasKeyTakeaways) {
      missing.push({
        element: "Key Takeaways",
        importance: "high",
        description: "Summary section for quick reference",
        suggestion: "Add a 'Key Takeaways' or 'TL;DR' section near the top",
      });
    }

    if (!structure.hasFAQSection) {
      missing.push({
        element: "FAQ Section",
        importance: "high",
        description: "Question-answer format is highly cited by AI",
        suggestion: "Add 3-5 common questions with concise answers",
      });
    }

    if (!structure.hasStatistics) {
      missing.push({
        element: "Statistics & Data",
        importance: "medium",
        description: "Specific numbers increase credibility and citations",
        suggestion: "Include relevant statistics, percentages, or data points",
      });
    }

    if (!structure.hasExpertAttribution) {
      missing.push({
        element: "Expert Attribution",
        importance: "medium",
        description: "Expert quotes and credentials boost authority",
        suggestion: "Add author credentials or expert quotes",
      });
    }

    // Check schema
    const html = input.htmlContent || "";
    if (!html.includes('"@type"')) {
      missing.push({
        element: "Schema Markup",
        importance: "high",
        description: "Structured data helps AI understand content",
        suggestion: "Add Article, FAQ, or HowTo schema markup",
      });
    }

    return missing;
  }

  private calculateBreakdownScores(
    entities: ExtractedEntity[],
    wordCount: number,
    quotabilityScore: number,
    answerStructureScore: number,
    input: AIOAnalysisInput,
    structure: ContentStructure
  ): AIOScores["breakdown"] {
    // Entity density score
    const density = (entities.length / Math.max(wordCount, 1)) * 1000;
    let entityDensityScore = 0;
    if (density >= 5 && density <= 15) {
      entityDensityScore = 100;
    } else if (density >= 3) {
      entityDensityScore = 70;
    } else {
      entityDensityScore = Math.round(density * 20);
    }

    // Schema presence score
    const html = input.htmlContent || "";
    let schemaPresence = 0;
    if (html.includes('"@type":"faqpage"')) schemaPresence += 40;
    if (html.includes('"@type":"howto"')) schemaPresence += 30;
    if (html.includes('"@type":"article"')) schemaPresence += 30;
    schemaPresence = Math.min(100, schemaPresence);

    // Freshness score
    let freshness = 50;
    if (input.lastModified || input.publishedAt) {
      const refDate = input.lastModified || input.publishedAt!;
      const daysSince = Math.floor(
        (Date.now() - refDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince <= 30) freshness = 100;
      else if (daysSince <= 90) freshness = 85;
      else if (daysSince <= 180) freshness = 70;
      else if (daysSince <= 365) freshness = 55;
      else freshness = 40;
    }

    // Authority score
    let authority = 40;
    if (structure.hasExpertAttribution) authority += 30;
    if (structure.hasStatistics) authority += 20;
    if (structure.hasDefinitions) authority += 10;

    return {
      entityDensity: entityDensityScore,
      quotability: quotabilityScore,
      answerStructure: answerStructureScore,
      schemaPresence,
      freshness,
      authority: Math.min(100, authority),
    };
  }

  private deduplicateRecommendations(
    recommendations: Recommendation[]
  ): Recommendation[] {
    const seen = new Map<string, Recommendation>();

    for (const rec of recommendations) {
      const key = rec.title.toLowerCase();
      const existing = seen.get(key);

      if (!existing) {
        seen.set(key, rec);
      } else {
        // Keep the higher priority one
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        if (priorityOrder[rec.priority] < priorityOrder[existing.priority]) {
          seen.set(key, rec);
        }
      }
    }

    // Sort by priority
    return Array.from(seen.values()).sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
}

/**
 * Create a new AIO Visibility Analyzer
 */
export function createAIOAnalyzer(
  options?: VisibilityScoreOptions
): AIOVisibilityAnalyzer {
  return new AIOVisibilityAnalyzer(options);
}

