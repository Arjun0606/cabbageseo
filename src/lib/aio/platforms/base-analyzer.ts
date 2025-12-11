/**
 * Base Platform Analyzer
 * Abstract class for AI platform-specific analysis
 */

import type {
  AIOPlatform,
  AIOAnalysisInput,
  PlatformScore,
  ScoreFactor,
  Recommendation,
  ExtractedEntity,
  ContentStructure,
} from "../types";

export abstract class BasePlatformAnalyzer {
  abstract readonly platform: AIOPlatform;
  abstract readonly platformName: string;

  /**
   * Analyze content for this specific platform
   */
  abstract analyze(input: AIOAnalysisInput): Promise<PlatformScore>;

  /**
   * Common scoring factors used by all platforms
   */
  protected calculateEntityDensityFactor(
    entities: ExtractedEntity[],
    wordCount: number
  ): ScoreFactor {
    const density = (entities.length / Math.max(wordCount, 1)) * 1000;
    
    // Optimal: 5-15 entities per 1000 words
    let score = 0;
    if (density >= 5 && density <= 15) {
      score = 100;
    } else if (density >= 3 && density < 5) {
      score = 70 + (density - 3) * 15; // 70-100
    } else if (density > 15 && density <= 20) {
      score = 100 - (density - 15) * 10; // 100-50
    } else if (density < 3) {
      score = density * 23.33; // 0-70
    } else {
      score = 50 - (density - 20) * 5; // Below 50, diminishing
    }

    return {
      name: "Entity Density",
      score: Math.max(0, Math.min(100, Math.round(score))),
      weight: 0.15,
      description: `${entities.length} named entities in ${wordCount} words (${density.toFixed(1)}/1k words)`,
    };
  }

  protected calculateQuotabilityFactor(
    avgParagraphLength: number,
    hasKeyTakeaways: boolean,
    quotableSnippetCount: number
  ): ScoreFactor {
    let score = 0;

    // Paragraph length (ideal: 50-150 words per paragraph)
    if (avgParagraphLength >= 50 && avgParagraphLength <= 150) {
      score += 40;
    } else if (avgParagraphLength > 150 && avgParagraphLength <= 200) {
      score += 25;
    } else if (avgParagraphLength < 50 && avgParagraphLength >= 30) {
      score += 30;
    } else {
      score += 15;
    }

    // Key takeaways section
    if (hasKeyTakeaways) score += 20;

    // Quotable snippets
    score += Math.min(40, quotableSnippetCount * 8);

    return {
      name: "Quotability",
      score: Math.min(100, score),
      weight: 0.20,
      description: `Content structured for easy AI extraction and quoting`,
    };
  }

  protected calculateAnswerStructureFactor(
    structure: ContentStructure
  ): ScoreFactor {
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

    return {
      name: "Answer Structure",
      score: Math.min(100, score),
      weight: 0.20,
      description: `Content organized to directly answer user queries`,
    };
  }

  protected calculateSchemaFactor(
    hasFAQSchema: boolean,
    hasHowToSchema: boolean,
    hasArticleSchema: boolean,
    hasOtherSchema: boolean
  ): ScoreFactor {
    let score = 0;

    if (hasArticleSchema) score += 25;
    if (hasFAQSchema) score += 35;
    if (hasHowToSchema) score += 25;
    if (hasOtherSchema) score += 15;

    return {
      name: "Schema Markup",
      score: Math.min(100, score),
      weight: 0.15,
      description: `Structured data helps AI understand and cite content`,
    };
  }

  protected calculateFreshnessFactor(
    publishedAt?: Date,
    lastModified?: Date
  ): ScoreFactor {
    const now = new Date();
    const referenceDate = lastModified || publishedAt;

    if (!referenceDate) {
      return {
        name: "Content Freshness",
        score: 50, // Unknown, assume average
        weight: 0.10,
        description: `No publish/update date detected`,
      };
    }

    const daysSinceUpdate = Math.floor(
      (now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    let score = 100;
    if (daysSinceUpdate <= 30) {
      score = 100;
    } else if (daysSinceUpdate <= 90) {
      score = 90;
    } else if (daysSinceUpdate <= 180) {
      score = 75;
    } else if (daysSinceUpdate <= 365) {
      score = 60;
    } else if (daysSinceUpdate <= 730) {
      score = 40;
    } else {
      score = 25;
    }

    return {
      name: "Content Freshness",
      score,
      weight: 0.10,
      description: `Last updated ${daysSinceUpdate} days ago`,
    };
  }

  protected calculateAuthorityFactor(
    hasExpertAttribution: boolean,
    hasCredentials: boolean,
    hasSourceLinks: boolean,
    externalLinksCount: number
  ): ScoreFactor {
    let score = 0;

    if (hasExpertAttribution) score += 35;
    if (hasCredentials) score += 25;
    if (hasSourceLinks) score += 20;
    score += Math.min(20, externalLinksCount * 4);

    return {
      name: "Authority Signals",
      score: Math.min(100, score),
      weight: 0.10,
      description: `Expert attribution, credentials, and source citations`,
    };
  }

  /**
   * Calculate final score from factors
   */
  protected calculateScoreFromFactors(factors: ScoreFactor[]): number {
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const weightedSum = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
    return Math.round(weightedSum / totalWeight);
  }

  /**
   * Generate recommendations based on low-scoring factors
   */
  protected generateRecommendations(factors: ScoreFactor[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const factor of factors) {
      if (factor.score < 40) {
        recommendations.push(this.getRecommendationForFactor(factor, "critical"));
      } else if (factor.score < 60) {
        recommendations.push(this.getRecommendationForFactor(factor, "high"));
      } else if (factor.score < 75) {
        recommendations.push(this.getRecommendationForFactor(factor, "medium"));
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private getRecommendationForFactor(
    factor: ScoreFactor,
    priority: Recommendation["priority"]
  ): Recommendation {
    const recommendationMap: Record<string, Omit<Recommendation, "priority">> = {
      "Entity Density": {
        title: "Add more named entities",
        description:
          "Include specific names of people, organizations, products, and concepts. AI models prefer content with clear entity references.",
        impact: "+10-15 points",
        autoFixable: true,
        action: "inject_entities",
      },
      "Quotability": {
        title: "Improve content quotability",
        description:
          "Break long paragraphs into shorter, quotable chunks (50-150 words). Add a 'Key Takeaways' section at the top.",
        impact: "+10-20 points",
        autoFixable: true,
        action: "optimize_quotability",
      },
      "Answer Structure": {
        title: "Add direct answer structure",
        description:
          "Lead with a direct answer to the main query. Add FAQ sections, step-by-step instructions, and clear definitions.",
        impact: "+15-25 points",
        autoFixable: true,
        action: "add_answer_structure",
      },
      "Schema Markup": {
        title: "Add structured data",
        description:
          "Implement FAQ schema, HowTo schema, or Article schema to help AI understand your content structure.",
        impact: "+10-15 points",
        autoFixable: true,
        action: "add_schema",
      },
      "Content Freshness": {
        title: "Update stale content",
        description:
          "AI platforms prefer recent content. Update with new information, statistics, or examples.",
        impact: "+5-15 points",
        autoFixable: false,
      },
      "Authority Signals": {
        title: "Add expert attribution",
        description:
          "Include author name with credentials, cite authoritative sources, and add expert quotes.",
        impact: "+10-15 points",
        autoFixable: true,
        action: "add_attribution",
      },
    };

    const rec = recommendationMap[factor.name] || {
      title: `Improve ${factor.name.toLowerCase()}`,
      description: factor.description,
      impact: "+5-10 points",
      autoFixable: false,
    };

    return { ...rec, priority };
  }
}

