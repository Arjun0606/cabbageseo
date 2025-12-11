/**
 * Google AI Overviews Analyzer
 * 
 * Optimizes for Google's AI-generated summaries that appear at the top of search results.
 * 
 * Key factors:
 * - E-E-A-T signals (Experience, Expertise, Authority, Trust)
 * - Direct answer formatting
 * - FAQ and HowTo schema
 * - Entity presence and context
 * - Traditional SEO signals still matter
 */

import { BasePlatformAnalyzer } from "./base-analyzer";
import type {
  AIOAnalysisInput,
  PlatformScore,
  ScoreFactor,
  ContentStructure,
  ExtractedEntity,
} from "../types";

export class GoogleAIOAnalyzer extends BasePlatformAnalyzer {
  readonly platform = "google_aio" as const;
  readonly platformName = "Google AI Overviews";

  async analyze(input: AIOAnalysisInput): Promise<PlatformScore> {
    const factors: ScoreFactor[] = [];

    // Parse content structure
    const structure = this.analyzeStructure(input);
    const entities = this.extractBasicEntities(input.content);
    const wordCount = input.wordCount || input.content.split(/\s+/).length;
    
    // Check schema presence
    const hasSchema = this.detectSchema(input.htmlContent || "");

    // 1. Entity Density (15%)
    factors.push(this.calculateEntityDensityFactor(entities, wordCount));

    // 2. Answer Structure (25%) - Higher weight for Google
    const answerFactor = this.calculateAnswerStructureFactor(structure);
    answerFactor.weight = 0.25;
    factors.push(answerFactor);

    // 3. Schema Markup (20%) - Critical for AI Overviews
    const schemaFactor = this.calculateSchemaFactor(
      hasSchema.faq,
      hasSchema.howTo,
      hasSchema.article,
      hasSchema.other
    );
    schemaFactor.weight = 0.20;
    factors.push(schemaFactor);

    // 4. E-E-A-T Signals (20%)
    factors.push(this.calculateEEATFactor(input, structure));

    // 5. Content Freshness (10%)
    factors.push(this.calculateFreshnessFactor(input.publishedAt, input.lastModified));

    // 6. Featured Snippet Optimization (10%)
    factors.push(this.calculateFeaturedSnippetFactor(input, structure));

    const score = this.calculateScoreFromFactors(factors);
    const recommendations = this.generateRecommendations(factors);

    // Add Google-specific recommendations
    if (!hasSchema.faq && structure.hasFAQSection) {
      recommendations.unshift({
        priority: "high",
        title: "Add FAQ Schema markup",
        description:
          "You have FAQ content but no FAQ schema. Adding schema significantly increases AI Overview visibility.",
        impact: "+15-20 points",
        autoFixable: true,
        action: "add_faq_schema",
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
        content.includes("tl;dr"),
      hasFAQSection:
        content.includes("frequently asked") ||
        content.includes("faq") ||
        headings.some((h) => h.text.toLowerCase().includes("question")),
      hasHowToSection:
        content.includes("how to") ||
        content.includes("step by step") ||
        content.includes("step 1"),
      hasStepByStep:
        /step\s*[1-9]|first,.*second,|1\.|2\.|3\./.test(content),
      hasExpertAttribution:
        content.includes("according to") ||
        content.includes("expert") ||
        content.includes("dr.") ||
        content.includes("phd"),
      hasStatistics:
        /\d+%|\d+\s*(million|billion|thousand)|\$\d+/.test(content),
      hasDefinitions:
        content.includes("is defined as") ||
        content.includes("refers to") ||
        content.includes("means that"),
      headingHierarchy: this.evaluateHeadingHierarchy(headings),
      paragraphStructure: this.evaluateParagraphStructure(input.content),
    };
  }

  private hasDirectAnswer(content: string): boolean {
    // Check if first paragraph provides a direct answer
    const firstParagraph = content.split(/\n\n/)[0] || "";
    const sentences = firstParagraph.split(/[.!?]+/).filter(Boolean);
    
    // Direct answer typically in first 1-2 sentences
    if (sentences.length >= 1 && sentences[0].length > 50) {
      return true;
    }
    return false;
  }

  private evaluateHeadingHierarchy(
    headings: { level: number; text: string }[]
  ): "good" | "fair" | "poor" {
    if (headings.length === 0) return "poor";

    const h1Count = headings.filter((h) => h.level === 1).length;
    const hasH2 = headings.some((h) => h.level === 2);

    if (h1Count === 1 && hasH2) return "good";
    if (h1Count === 1 || hasH2) return "fair";
    return "poor";
  }

  private evaluateParagraphStructure(content: string): "good" | "fair" | "poor" {
    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0);
    if (paragraphs.length === 0) return "poor";

    const avgLength =
      paragraphs.reduce((sum, p) => sum + p.split(/\s+/).length, 0) /
      paragraphs.length;

    if (avgLength >= 50 && avgLength <= 150) return "good";
    if (avgLength >= 30 && avgLength <= 200) return "fair";
    return "poor";
  }

  private extractBasicEntities(content: string): ExtractedEntity[] {
    // Simple entity extraction - will be enhanced with Claude later
    const entities: ExtractedEntity[] = [];
    
    // Extract capitalized phrases (simple NER approximation)
    const capitalizedPhrases = content.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
    const seen = new Set<string>();
    
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

    return entities.slice(0, 50); // Limit to top 50
  }

  private detectSchema(html: string): {
    faq: boolean;
    howTo: boolean;
    article: boolean;
    other: boolean;
  } {
    const lower = html.toLowerCase();
    return {
      faq: lower.includes('"@type":"faqpage"') || lower.includes('"@type": "faqpage"'),
      howTo: lower.includes('"@type":"howto"') || lower.includes('"@type": "howto"'),
      article:
        lower.includes('"@type":"article"') ||
        lower.includes('"@type":"newsarticle"') ||
        lower.includes('"@type":"blogposting"'),
      other:
        lower.includes('"@type":"organization"') ||
        lower.includes('"@type":"person"') ||
        lower.includes('"@type":"product"'),
    };
  }

  private calculateEEATFactor(
    input: AIOAnalysisInput,
    structure: ContentStructure
  ): ScoreFactor {
    let score = 0;

    // Experience - First-hand experience indicators
    if (
      input.content.toLowerCase().includes("in my experience") ||
      input.content.toLowerCase().includes("i've tested") ||
      input.content.toLowerCase().includes("we found")
    ) {
      score += 20;
    }

    // Expertise - Expert attribution
    if (structure.hasExpertAttribution) {
      score += 25;
    }

    // Authority - Source citations
    if (structure.hasStatistics) {
      score += 20;
    }

    // Trust - Specific claims with evidence
    if (structure.hasDefinitions) {
      score += 15;
    }

    // Detailed content
    const wordCount = input.wordCount || input.content.split(/\s+/).length;
    if (wordCount >= 1500) {
      score += 20;
    } else if (wordCount >= 800) {
      score += 10;
    }

    return {
      name: "E-E-A-T Signals",
      score: Math.min(100, score),
      weight: 0.20,
      description: "Experience, Expertise, Authority, Trust indicators",
    };
  }

  private calculateFeaturedSnippetFactor(
    input: AIOAnalysisInput,
    structure: ContentStructure
  ): ScoreFactor {
    let score = 0;

    // Direct answer format
    if (structure.hasDirectAnswer) {
      score += 30;
    }

    // List format (numbered or bulleted)
    if (
      input.content.includes("1.") ||
      input.content.includes("•") ||
      input.content.includes("-")
    ) {
      score += 20;
    }

    // Table format (simplified check)
    if (input.htmlContent?.includes("<table")) {
      score += 15;
    }

    // Definition format
    if (structure.hasDefinitions) {
      score += 20;
    }

    // Proper H2 sections
    const h2Count = (input.headings || []).filter((h) => h.level === 2).length;
    if (h2Count >= 3) {
      score += 15;
    }

    return {
      name: "Featured Snippet Ready",
      score: Math.min(100, score),
      weight: 0.10,
      description: "Content formatted for Google Featured Snippets and AI Overviews",
    };
  }
}

export const googleAIOAnalyzer = new GoogleAIOAnalyzer();

