/**
 * Google Gemini Analyzer
 * 
 * Optimizes for Google Gemini responses.
 * 
 * Key factors:
 * - Similar to Google AI Overviews
 * - Multimodal signals (images, videos)
 * - Freshness
 * - Google ecosystem signals (YouTube, etc.)
 */

import { BasePlatformAnalyzer } from "./base-analyzer";
import type {
  AIOAnalysisInput,
  PlatformScore,
  ScoreFactor,
  ContentStructure,
  ExtractedEntity,
} from "../types";

export class GeminiAnalyzer extends BasePlatformAnalyzer {
  readonly platform = "gemini" as const;
  readonly platformName = "Google Gemini";

  async analyze(input: AIOAnalysisInput): Promise<PlatformScore> {
    const factors: ScoreFactor[] = [];

    const structure = this.analyzeStructure(input);
    const entities = this.extractEntities(input.content);
    const wordCount = input.wordCount || input.content.split(/\s+/).length;
    const multimodalMetrics = this.analyzeMultimodal(input);

    // 1. Entity Density (15%)
    factors.push(this.calculateEntityDensityFactor(entities, wordCount));

    // 2. Answer Structure (20%)
    const answerFactor = this.calculateAnswerStructureFactor(structure);
    answerFactor.weight = 0.20;
    factors.push(answerFactor);

    // 3. Schema Markup (15%)
    const schemaFactor = this.calculateSchemaFactor(
      this.hasSchema(input.htmlContent || "", "faq"),
      this.hasSchema(input.htmlContent || "", "howto"),
      this.hasSchema(input.htmlContent || "", "article"),
      this.hasSchema(input.htmlContent || "", "other")
    );
    schemaFactor.weight = 0.15;
    factors.push(schemaFactor);

    // 4. Multimodal Signals (20%) - Gemini is multimodal
    factors.push(this.calculateMultimodalFactor(multimodalMetrics));

    // 5. Content Freshness (15%) - Gemini values fresh content
    const freshnessFactor = this.calculateFreshnessFactor(
      input.publishedAt,
      input.lastModified
    );
    freshnessFactor.weight = 0.15;
    factors.push(freshnessFactor);

    // 6. Google Ecosystem (15%)
    factors.push(this.calculateGoogleEcosystemFactor(input));

    const score = this.calculateScoreFromFactors(factors);
    const recommendations = this.generateRecommendations(factors);

    // Gemini-specific recommendations
    if (!multimodalMetrics.hasImages) {
      recommendations.push({
        priority: "medium",
        title: "Add quality images",
        description:
          "Gemini is multimodal and considers images. Add relevant images with descriptive alt text.",
        impact: "+10-15 points",
        autoFixable: false,
      });
    }

    if (!multimodalMetrics.hasVideo) {
      recommendations.push({
        priority: "low",
        title: "Consider adding video content",
        description:
          "Gemini values multimodal content. Embedding YouTube videos can improve visibility.",
        impact: "+5-10 points",
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
        content.includes("tl;dr"),
      hasFAQSection:
        content.includes("faq") ||
        content.includes("frequently asked") ||
        headings.some((h) => h.text.toLowerCase().includes("question")),
      hasHowToSection: content.includes("how to") || content.includes("step by step"),
      hasStepByStep: /step\s*[1-9]/.test(content),
      hasExpertAttribution:
        content.includes("according to") ||
        content.includes("expert") ||
        content.includes("dr."),
      hasStatistics: /\d+%|\d+\s*(million|billion)|\$\d+/.test(content),
      hasDefinitions:
        content.includes("is defined as") || content.includes("refers to"),
      headingHierarchy: headings.length >= 4 ? "good" : headings.length >= 2 ? "fair" : "poor",
      paragraphStructure: "fair", // Simplified for Gemini
    };
  }

  private hasDirectAnswer(content: string): boolean {
    const firstParagraph = content.split(/\n\n/)[0] || "";
    return firstParagraph.length >= 80;
  }

  private extractEntities(content: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const seen = new Set<string>();

    const phrases = content.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
    for (const phrase of phrases) {
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

    return entities.slice(0, 50);
  }

  private hasSchema(html: string, type: string): boolean {
    const lower = html.toLowerCase();
    const typePatterns: Record<string, string[]> = {
      faq: ['"@type":"faqpage"', '"@type": "faqpage"'],
      howto: ['"@type":"howto"', '"@type": "howto"'],
      article: [
        '"@type":"article"',
        '"@type":"newsarticle"',
        '"@type":"blogposting"',
      ],
      other: ['"@type":"organization"', '"@type":"person"', '"@type":"product"'],
    };

    const patterns = typePatterns[type] || [];
    return patterns.some((p) => lower.includes(p));
  }

  private analyzeMultimodal(input: AIOAnalysisInput): {
    hasImages: boolean;
    imageCount: number;
    hasVideo: boolean;
    hasYouTube: boolean;
    hasAltText: boolean;
    hasDescriptiveAlts: boolean;
  } {
    const html = input.htmlContent || "";
    const lower = html.toLowerCase();

    // Count images
    const imgTags = (html.match(/<img\s/gi) || []).length;

    // Check for alt text
    const hasAltText = lower.includes('alt="') || lower.includes("alt='");

    // Check for descriptive alt text (more than 10 chars)
    const altTexts = html.match(/alt="([^"]+)"/gi) || [];
    const hasDescriptiveAlts = altTexts.some((alt) => alt.length > 15);

    // Check for video
    const hasVideo =
      lower.includes("<video") ||
      lower.includes("youtube.com") ||
      lower.includes("vimeo.com") ||
      lower.includes("wistia.com");

    const hasYouTube =
      lower.includes("youtube.com/embed") || lower.includes("youtu.be");

    return {
      hasImages: imgTags > 0,
      imageCount: imgTags,
      hasVideo,
      hasYouTube,
      hasAltText,
      hasDescriptiveAlts,
    };
  }

  private calculateMultimodalFactor(metrics: {
    hasImages: boolean;
    imageCount: number;
    hasVideo: boolean;
    hasYouTube: boolean;
    hasAltText: boolean;
    hasDescriptiveAlts: boolean;
  }): ScoreFactor {
    let score = 0;

    // Has images
    if (metrics.hasImages) {
      score += 25;
      // Multiple relevant images
      score += Math.min(15, metrics.imageCount * 5);
    }

    // Alt text quality
    if (metrics.hasAltText) {
      score += 10;
      if (metrics.hasDescriptiveAlts) {
        score += 10;
      }
    }

    // Video content
    if (metrics.hasVideo) {
      score += 20;
    }

    // YouTube (Google ecosystem)
    if (metrics.hasYouTube) {
      score += 20;
    }

    return {
      name: "Multimodal Content",
      score: Math.min(100, score),
      weight: 0.20,
      description: "Images, videos, and multimedia that Gemini can understand",
    };
  }

  private calculateGoogleEcosystemFactor(input: AIOAnalysisInput): ScoreFactor {
    let score = 50; // Base score
    const html = input.htmlContent || "";
    const lower = html.toLowerCase();

    // YouTube embeds
    if (lower.includes("youtube.com")) {
      score += 20;
    }

    // Google Maps
    if (lower.includes("google.com/maps") || lower.includes("maps.google")) {
      score += 10;
    }

    // Google Drive/Docs links
    if (lower.includes("docs.google.com") || lower.includes("drive.google.com")) {
      score += 5;
    }

    // Schema.org (Google-recommended structured data)
    if (lower.includes("schema.org")) {
      score += 15;
    }

    return {
      name: "Google Ecosystem",
      score: Math.min(100, score),
      weight: 0.15,
      description: "Integration with Google products and structured data standards",
    };
  }
}

export const geminiAnalyzer = new GeminiAnalyzer();

