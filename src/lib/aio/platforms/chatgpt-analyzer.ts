/**
 * ChatGPT / SearchGPT Analyzer
 * 
 * Optimizes for ChatGPT's browsing mode and SearchGPT.
 * 
 * Key factors:
 * - Content quotability (concise, well-structured paragraphs)
 * - Factual density
 * - Entity richness
 * - Source authority (backlinks still matter)
 * - Recency for time-sensitive queries
 * - Direct answers to common questions
 */

import { BasePlatformAnalyzer } from "./base-analyzer";
import type {
  AIOAnalysisInput,
  PlatformScore,
  ScoreFactor,
  ContentStructure,
  ExtractedEntity,
} from "../types";

export class ChatGPTAnalyzer extends BasePlatformAnalyzer {
  readonly platform = "chatgpt" as const;
  readonly platformName = "ChatGPT / SearchGPT";

  async analyze(input: AIOAnalysisInput): Promise<PlatformScore> {
    const factors: ScoreFactor[] = [];

    const structure = this.analyzeStructure(input);
    const entities = this.extractEntities(input.content);
    const wordCount = input.wordCount || input.content.split(/\s+/).length;
    const quotabilityMetrics = this.analyzeQuotability(input.content);

    // 1. Quotability (25%) - ChatGPT needs easily quotable content
    const quotabilityFactor = this.calculateQuotabilityFactor(
      quotabilityMetrics.avgParagraphLength,
      structure.hasKeyTakeaways,
      quotabilityMetrics.quotableSnippets
    );
    quotabilityFactor.weight = 0.25;
    factors.push(quotabilityFactor);

    // 2. Entity Density (20%)
    const entityFactor = this.calculateEntityDensityFactor(entities, wordCount);
    entityFactor.weight = 0.20;
    factors.push(entityFactor);

    // 3. Factual Density (20%)
    factors.push(this.calculateFactualDensityFactor(input, structure));

    // 4. Answer Structure (15%)
    const answerFactor = this.calculateAnswerStructureFactor(structure);
    answerFactor.weight = 0.15;
    factors.push(answerFactor);

    // 5. Content Freshness (10%)
    factors.push(this.calculateFreshnessFactor(input.publishedAt, input.lastModified));

    // 6. LLM Extractability (10%)
    factors.push(this.calculateExtractabilityFactor(input, structure));

    const score = this.calculateScoreFromFactors(factors);
    const recommendations = this.generateRecommendations(factors);

    // ChatGPT-specific recommendations
    if (quotabilityMetrics.avgParagraphLength > 200) {
      recommendations.unshift({
        priority: "high",
        title: "Break up long paragraphs",
        description:
          "ChatGPT quotes content directly. Paragraphs over 200 words are rarely quoted. Aim for 50-150 word paragraphs.",
        impact: "+15-20 points",
        autoFixable: true,
        action: "split_paragraphs",
      });
    }

    if (!structure.hasKeyTakeaways) {
      recommendations.push({
        priority: "medium",
        title: "Add Key Takeaways section",
        description:
          "A 'Key Takeaways' or 'TL;DR' section at the top provides perfect quote material for ChatGPT.",
        impact: "+10-15 points",
        autoFixable: true,
        action: "add_key_takeaways",
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
        content.includes("key point") ||
        content.includes("in summary") ||
        content.includes("tl;dr") ||
        content.includes("bottom line"),
      hasFAQSection:
        content.includes("frequently asked") ||
        content.includes("faq") ||
        headings.some((h) => h.text.toLowerCase().includes("question")),
      hasHowToSection:
        content.includes("how to") || content.includes("step by step"),
      hasStepByStep: /step\s*[1-9]|first,.*second,/.test(content),
      hasExpertAttribution:
        content.includes("according to") ||
        content.includes("expert") ||
        content.includes("study shows") ||
        content.includes("research"),
      hasStatistics: /\d+%|\d+\s*(million|billion|thousand)|\$\d+/.test(content),
      hasDefinitions:
        content.includes("is defined as") ||
        content.includes("refers to") ||
        content.includes("means"),
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
    if (headings.length >= 4) return "good";
    if (headings.length >= 2) return "fair";
    return "poor";
  }

  private evaluateParagraphStructure(content: string): "good" | "fair" | "poor" {
    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0);
    if (paragraphs.length === 0) return "poor";

    const avgLength =
      paragraphs.reduce((sum, p) => sum + p.split(/\s+/).length, 0) /
      paragraphs.length;

    // ChatGPT prefers shorter, quotable paragraphs
    if (avgLength >= 40 && avgLength <= 120) return "good";
    if (avgLength >= 30 && avgLength <= 180) return "fair";
    return "poor";
  }

  private extractEntities(content: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const seen = new Set<string>();

    // Capitalized phrases
    const capitalizedPhrases = content.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
    for (const phrase of capitalizedPhrases) {
      const normalized = phrase.toLowerCase();
      if (!seen.has(normalized) && phrase.length > 3) {
        seen.add(normalized);
        entities.push({
          name: phrase,
          type: "other",
          mentions: 1,
          contextQuality: 50,
        });
      }
    }

    // Numbers with context (statistics)
    const statistics = content.match(/\d+(?:\.\d+)?%|\$[\d,]+|\d+(?:\.\d+)?\s*(?:million|billion)/gi) || [];
    for (const stat of statistics) {
      if (!seen.has(stat.toLowerCase())) {
        seen.add(stat.toLowerCase());
        entities.push({
          name: stat,
          type: "concept",
          mentions: 1,
          contextQuality: 70, // Statistics have good context
        });
      }
    }

    return entities.slice(0, 50);
  }

  private analyzeQuotability(content: string): {
    avgParagraphLength: number;
    quotableSnippets: number;
    shortParagraphRatio: number;
  } {
    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0);
    
    if (paragraphs.length === 0) {
      return { avgParagraphLength: 0, quotableSnippets: 0, shortParagraphRatio: 0 };
    }

    const wordCounts = paragraphs.map((p) => p.split(/\s+/).length);
    const avgLength = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;

    // Count paragraphs that are ideal for quoting (50-150 words)
    const quotableSnippets = wordCounts.filter((w) => w >= 50 && w <= 150).length;
    const shortParagraphRatio = wordCounts.filter((w) => w <= 150).length / wordCounts.length;

    return {
      avgParagraphLength: avgLength,
      quotableSnippets,
      shortParagraphRatio,
    };
  }

  private calculateFactualDensityFactor(
    input: AIOAnalysisInput,
    structure: ContentStructure
  ): ScoreFactor {
    let score = 0;

    // Statistics present
    if (structure.hasStatistics) {
      score += 30;
    }

    // Expert citations
    if (structure.hasExpertAttribution) {
      score += 25;
    }

    // Definitions
    if (structure.hasDefinitions) {
      score += 20;
    }

    // Specific claims (dates, numbers)
    const specificClaims = (input.content.match(/\b(19|20)\d{2}\b|\b\d+\s*(years?|months?|days?)\b/g) || []).length;
    score += Math.min(25, specificClaims * 5);

    return {
      name: "Factual Density",
      score: Math.min(100, score),
      weight: 0.20,
      description: "Statistics, citations, and verifiable claims that ChatGPT can reference",
    };
  }

  private calculateExtractabilityFactor(
    input: AIOAnalysisInput,
    structure: ContentStructure
  ): ScoreFactor {
    let score = 0;

    // Clear heading structure
    if (structure.headingHierarchy === "good") {
      score += 25;
    } else if (structure.headingHierarchy === "fair") {
      score += 15;
    }

    // Short paragraphs
    if (structure.paragraphStructure === "good") {
      score += 25;
    } else if (structure.paragraphStructure === "fair") {
      score += 15;
    }

    // Bullet points or numbered lists
    const hasList = input.content.includes("•") || 
                    input.content.includes("- ") || 
                    /^\d+\./m.test(input.content);
    if (hasList) {
      score += 20;
    }

    // Has key takeaways
    if (structure.hasKeyTakeaways) {
      score += 20;
    }

    // FAQ section
    if (structure.hasFAQSection) {
      score += 10;
    }

    return {
      name: "LLM Extractability",
      score: Math.min(100, score),
      weight: 0.10,
      description: "How easily ChatGPT can extract and quote information",
    };
  }
}

export const chatgptAnalyzer = new ChatGPTAnalyzer();

