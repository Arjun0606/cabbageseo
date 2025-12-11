/**
 * Perplexity AI Analyzer
 * 
 * Optimizes for Perplexity's citation-based AI search.
 * 
 * Key factors:
 * - Source diversity (comprehensive coverage)
 * - Citation-worthy snippets
 * - Factual accuracy and specificity
 * - Expert credentials
 * - Original research/data
 * - External validation (being cited by others)
 */

import { BasePlatformAnalyzer } from "./base-analyzer";
import type {
  AIOAnalysisInput,
  PlatformScore,
  ScoreFactor,
  ContentStructure,
  ExtractedEntity,
} from "../types";

export class PerplexityAnalyzer extends BasePlatformAnalyzer {
  readonly platform = "perplexity" as const;
  readonly platformName = "Perplexity AI";

  async analyze(input: AIOAnalysisInput): Promise<PlatformScore> {
    const factors: ScoreFactor[] = [];

    const structure = this.analyzeStructure(input);
    const entities = this.extractEntities(input.content);
    const wordCount = input.wordCount || input.content.split(/\s+/).length;
    const citationMetrics = this.analyzeCitationWorthiness(input);

    // 1. Citation Worthiness (25%)
    factors.push(this.calculateCitationFactor(citationMetrics));

    // 2. Comprehensive Coverage (20%)
    factors.push(this.calculateCoverageFactor(input, structure, wordCount));

    // 3. Entity Density (15%)
    factors.push(this.calculateEntityDensityFactor(entities, wordCount));

    // 4. Authority Signals (20%)
    factors.push(
      this.calculateAuthorityFactor(
        structure.hasExpertAttribution,
        this.hasCredentials(input.content),
        citationMetrics.hasSourceLinks,
        citationMetrics.externalLinkCount
      )
    );

    // 5. Original Content (10%)
    factors.push(this.calculateOriginalityFactor(input, structure));

    // 6. Content Freshness (10%)
    factors.push(this.calculateFreshnessFactor(input.publishedAt, input.lastModified));

    const score = this.calculateScoreFromFactors(factors);
    const recommendations = this.generateRecommendations(factors);

    // Perplexity-specific recommendations
    if (citationMetrics.externalLinkCount < 3) {
      recommendations.push({
        priority: "medium",
        title: "Add more authoritative sources",
        description:
          "Perplexity values well-sourced content. Link to 3-5 authoritative external sources.",
        impact: "+10-15 points",
        autoFixable: false,
      });
    }

    if (!citationMetrics.hasOriginalData) {
      recommendations.push({
        priority: "high",
        title: "Include original data or research",
        description:
          "Perplexity prioritizes pages with unique data, statistics, or original research. Add surveys, case studies, or proprietary insights.",
        impact: "+15-20 points",
        autoFixable: false,
      });
    }

    return {
      platform: this.platform,
      score,
      factors,
      recommendations,
    };
  }

  private analyzeStructure(input: AIOAnalysisInput): ContentStructure {
    const content = input.content.toLowerCase();
    const headings = input.headings || [];

    return {
      hasDirectAnswer: this.hasDirectAnswer(input.content),
      hasKeyTakeaways:
        content.includes("key takeaway") ||
        content.includes("summary") ||
        content.includes("conclusion"),
      hasFAQSection:
        content.includes("faq") ||
        headings.some((h) => h.text.toLowerCase().includes("question")),
      hasHowToSection:
        content.includes("how to") || content.includes("step by step"),
      hasStepByStep: /step\s*[1-9]/.test(content),
      hasExpertAttribution:
        content.includes("according to") ||
        content.includes("expert") ||
        content.includes("study") ||
        content.includes("research"),
      hasStatistics: /\d+%|\d+\s*(million|billion)|\$\d+/.test(content),
      hasDefinitions:
        content.includes("is defined as") || content.includes("refers to"),
      headingHierarchy: headings.length >= 5 ? "good" : headings.length >= 2 ? "fair" : "poor",
      paragraphStructure: this.evaluateParagraphStructure(input.content),
    };
  }

  private hasDirectAnswer(content: string): boolean {
    const firstParagraph = content.split(/\n\n/)[0] || "";
    return firstParagraph.length >= 100;
  }

  private evaluateParagraphStructure(content: string): "good" | "fair" | "poor" {
    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0);
    if (paragraphs.length >= 10) return "good";
    if (paragraphs.length >= 5) return "fair";
    return "poor";
  }

  private extractEntities(content: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const seen = new Set<string>();

    // Capitalized multi-word phrases (organizations, products, people)
    const phrases = content.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g) || [];
    for (const phrase of phrases) {
      const normalized = phrase.toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        entities.push({
          name: phrase,
          type: "other",
          mentions: 1,
          contextQuality: 60,
        });
      }
    }

    return entities.slice(0, 50);
  }

  private analyzeCitationWorthiness(input: AIOAnalysisInput): {
    quotableStatements: number;
    hasSourceLinks: boolean;
    externalLinkCount: number;
    hasOriginalData: boolean;
    uniqueClaimCount: number;
  } {
    const content = input.content.toLowerCase();
    const html = input.htmlContent || "";

    // Count external links
    const externalLinks = (html.match(/href="https?:\/\/(?!www\.example\.com)/g) || []).length;

    // Count quotable statements (sentences with specific claims)
    const sentences = input.content.split(/[.!?]+/);
    const quotableStatements = sentences.filter((s) => {
      return /\d+%|\d+\s*(million|billion)|study|research|according to/i.test(s);
    }).length;

    // Original data indicators
    const hasOriginalData =
      content.includes("our data") ||
      content.includes("we surveyed") ||
      content.includes("our research") ||
      content.includes("case study") ||
      content.includes("original") ||
      content.includes("proprietary");

    return {
      quotableStatements,
      hasSourceLinks: externalLinks > 0,
      externalLinkCount: externalLinks,
      hasOriginalData,
      uniqueClaimCount: quotableStatements,
    };
  }

  private hasCredentials(content: string): boolean {
    const lower = content.toLowerCase();
    return (
      lower.includes("phd") ||
      lower.includes("md") ||
      lower.includes("professor") ||
      lower.includes("dr.") ||
      lower.includes("ceo") ||
      lower.includes("founder") ||
      lower.includes("years of experience")
    );
  }

  private calculateCitationFactor(metrics: {
    quotableStatements: number;
    hasSourceLinks: boolean;
    externalLinkCount: number;
    hasOriginalData: boolean;
    uniqueClaimCount: number;
  }): ScoreFactor {
    let score = 0;

    // Quotable statements (max 40)
    score += Math.min(40, metrics.quotableStatements * 8);

    // Source links present
    if (metrics.hasSourceLinks) {
      score += 15;
    }

    // External link quality
    score += Math.min(15, metrics.externalLinkCount * 5);

    // Original data is highly valued
    if (metrics.hasOriginalData) {
      score += 20;
    }

    // Unique claims
    score += Math.min(10, metrics.uniqueClaimCount * 2);

    return {
      name: "Citation Worthiness",
      score: Math.min(100, score),
      weight: 0.25,
      description: "Specific, quotable claims with proper sourcing that Perplexity can cite",
    };
  }

  private calculateCoverageFactor(
    input: AIOAnalysisInput,
    structure: ContentStructure,
    wordCount: number
  ): ScoreFactor {
    let score = 0;

    // Comprehensive length (1500+ words for pillar content)
    if (wordCount >= 2500) {
      score += 30;
    } else if (wordCount >= 1500) {
      score += 25;
    } else if (wordCount >= 1000) {
      score += 15;
    } else {
      score += 5;
    }

    // Multiple sections
    const headingCount = (input.headings || []).length;
    score += Math.min(25, headingCount * 5);

    // Covers different aspects
    let aspectCount = 0;
    if (structure.hasStatistics) aspectCount++;
    if (structure.hasExpertAttribution) aspectCount++;
    if (structure.hasDefinitions) aspectCount++;
    if (structure.hasHowToSection) aspectCount++;
    if (structure.hasFAQSection) aspectCount++;
    score += aspectCount * 9; // Max 45

    return {
      name: "Comprehensive Coverage",
      score: Math.min(100, score),
      weight: 0.20,
      description: "In-depth coverage of the topic from multiple angles",
    };
  }

  private calculateOriginalityFactor(
    input: AIOAnalysisInput,
    structure: ContentStructure
  ): ScoreFactor {
    let score = 50; // Base score

    const content = input.content.toLowerCase();

    // Original research indicators
    if (
      content.includes("our research") ||
      content.includes("we found") ||
      content.includes("our study")
    ) {
      score += 25;
    }

    // Case studies
    if (content.includes("case study")) {
      score += 15;
    }

    // Personal experience
    if (
      content.includes("in my experience") ||
      content.includes("i've tested") ||
      content.includes("we tested")
    ) {
      score += 10;
    }

    // Unique data
    if (content.includes("survey") || content.includes("interviewed")) {
      score += 20;
    }

    return {
      name: "Original Content",
      score: Math.min(100, score),
      weight: 0.10,
      description: "Unique research, data, or insights not found elsewhere",
    };
  }
}

export const perplexityAnalyzer = new PerplexityAnalyzer();

