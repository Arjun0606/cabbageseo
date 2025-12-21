/**
 * Bing Copilot Analyzer
 * 
 * Optimizes for Microsoft Bing Copilot AI search.
 * 
 * Key factors:
 * - Structured data and schema markup (Microsoft prioritizes structured data)
 * - Entity clarity and disambiguation
 * - Factual accuracy with sources
 * - Content freshness
 * - Clear answer structure
 * - Bing webmaster tools signals
 */

import { BasePlatformAnalyzer } from "./base-analyzer";
import type {
  AIOAnalysisInput,
  PlatformScore,
  ScoreFactor,
  ContentStructure,
  ExtractedEntity,
} from "../types";

export class BingCopilotAnalyzer extends BasePlatformAnalyzer {
  readonly platform = "bing_copilot" as const;
  readonly platformName = "Bing Copilot";

  async analyze(input: AIOAnalysisInput): Promise<PlatformScore> {
    const factors: ScoreFactor[] = [];

    const structure = this.analyzeStructure(input);
    const entities = this.extractEntities(input.content);
    const wordCount = input.wordCount || input.content.split(/\s+/).length;
    const schemaScore = this.analyzeSchema(input);

    // 1. Schema & Structured Data (25%) - Bing heavily weights this
    factors.push(this.buildSchemaFactor(schemaScore));

    // 2. Entity Clarity (20%)
    factors.push(this.calculateEntityClarityFactor(entities, wordCount));

    // 3. Answer Structure (20%)
    factors.push(this.buildAnswerStructureFactor(structure));

    // 4. Content Quality (15%)
    factors.push(this.calculateContentQualityFactor(input, structure, wordCount));

    // 5. Freshness (10%)
    factors.push(this.calculateFreshnessFactor(input.publishedAt, input.lastModified));

    // 6. Authority Signals (10%)
    factors.push(
      this.calculateAuthorityFactor(
        structure.hasExpertAttribution,
        this.hasCredentials(input.content),
        this.hasSourceLinks(input),
        this.countExternalLinks(input)
      )
    );

    const score = this.calculateScoreFromFactors(factors);
    const recommendations = this.generateRecommendations(factors);

    // Bing Copilot-specific recommendations
    if (schemaScore < 50) {
      recommendations.push({
        priority: "high",
        title: "Add structured data markup",
        description:
          "Bing Copilot strongly favors pages with Schema.org markup. Add Article, FAQ, HowTo, or Product schema.",
        impact: "+15-25 points",
        autoFixable: true,
        action: "add_schema",
      });
    }

    if (!structure.hasDirectAnswer) {
      recommendations.push({
        priority: "high",
        title: "Add a direct answer at the start",
        description:
          "Begin your content with a clear, concise answer to the main question. Bing Copilot often quotes the first paragraph.",
        impact: "+10-15 points",
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
    // Bing prefers concise first paragraphs that directly answer the query
    return firstParagraph.length >= 80 && firstParagraph.length <= 300;
  }

  private evaluateParagraphStructure(content: string): "good" | "fair" | "poor" {
    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0);
    // Bing prefers well-organized content with clear paragraph breaks
    if (paragraphs.length >= 8) return "good";
    if (paragraphs.length >= 4) return "fair";
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

  private analyzeSchema(input: AIOAnalysisInput): number {
    const html = input.htmlContent || "";
    let score = 0;

    // Check for JSON-LD schema
    if (html.includes("application/ld+json")) {
      score += 30;
    }

    // Check for common schema types
    const schemaTypes = [
      "Article",
      "NewsArticle",
      "BlogPosting",
      "FAQPage",
      "HowTo",
      "Product",
      "Organization",
      "Person",
      "BreadcrumbList",
    ];

    for (const type of schemaTypes) {
      if (html.includes(`"@type":"${type}"`) || html.includes(`"@type": "${type}"`)) {
        score += 10;
      }
    }

    // Check for Open Graph
    if (html.includes('property="og:')) {
      score += 10;
    }

    // Check for Twitter cards
    if (html.includes('name="twitter:')) {
      score += 5;
    }

    return Math.min(100, score);
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

  private hasSourceLinks(input: AIOAnalysisInput): boolean {
    const html = input.htmlContent || "";
    const externalLinks = (html.match(/href="https?:\/\//g) || []).length;
    return externalLinks > 0;
  }

  private countExternalLinks(input: AIOAnalysisInput): number {
    const html = input.htmlContent || "";
    return (html.match(/href="https?:\/\//g) || []).length;
  }

  private buildSchemaFactor(schemaScore: number): ScoreFactor {
    return {
      name: "Schema & Structured Data",
      score: schemaScore,
      weight: 0.25,
      description: "Schema.org markup and structured data that Bing Copilot can parse",
    };
  }

  private calculateEntityClarityFactor(entities: ExtractedEntity[], wordCount: number): ScoreFactor {
    const entityDensity = (entities.length / wordCount) * 1000;
    let score = 50;

    if (entityDensity >= 15) {
      score = 100;
    } else if (entityDensity >= 10) {
      score = 85;
    } else if (entityDensity >= 5) {
      score = 70;
    } else if (entityDensity >= 2) {
      score = 55;
    }

    return {
      name: "Entity Clarity",
      score,
      weight: 0.20,
      description: "Clear, well-defined entities that Bing can identify and link",
    };
  }

  private buildAnswerStructureFactor(structure: ContentStructure): ScoreFactor {
    let score = 0;

    if (structure.hasDirectAnswer) score += 30;
    if (structure.hasFAQSection) score += 20;
    if (structure.hasHowToSection) score += 15;
    if (structure.hasDefinitions) score += 10;
    if (structure.headingHierarchy === "good") score += 15;
    else if (structure.headingHierarchy === "fair") score += 10;
    if (structure.paragraphStructure === "good") score += 10;
    else if (structure.paragraphStructure === "fair") score += 5;

    return {
      name: "Answer Structure",
      score: Math.min(100, score),
      weight: 0.20,
      description: "Clear, structured content that answers questions directly",
    };
  }

  private calculateContentQualityFactor(
    input: AIOAnalysisInput,
    structure: ContentStructure,
    wordCount: number
  ): ScoreFactor {
    let score = 0;

    // Word count (Bing prefers comprehensive content)
    if (wordCount >= 2000) {
      score += 25;
    } else if (wordCount >= 1000) {
      score += 20;
    } else if (wordCount >= 500) {
      score += 10;
    }

    // Statistics and data
    if (structure.hasStatistics) score += 20;

    // Expert attribution
    if (structure.hasExpertAttribution) score += 15;

    // Key takeaways
    if (structure.hasKeyTakeaways) score += 15;

    // Step by step content
    if (structure.hasStepByStep) score += 15;

    // Definitions
    if (structure.hasDefinitions) score += 10;

    return {
      name: "Content Quality",
      score: Math.min(100, score),
      weight: 0.15,
      description: "High-quality, factual content with supporting evidence",
    };
  }
}

export const bingCopilotAnalyzer = new BingCopilotAnalyzer();

