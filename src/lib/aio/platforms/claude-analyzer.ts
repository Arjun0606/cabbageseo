/**
 * Claude Search Analyzer
 * 
 * Optimizes for Claude-based search tools and extractability.
 * 
 * Key factors:
 * - Semantic clarity
 * - Context completeness
 * - Logical structure
 * - Entity relationships
 * - Lack of ambiguity
 * - Define before use
 */

import { BasePlatformAnalyzer } from "./base-analyzer";
import type {
  AIOAnalysisInput,
  PlatformScore,
  ScoreFactor,
  ContentStructure,
  ExtractedEntity,
} from "../types";

export class ClaudeAnalyzer extends BasePlatformAnalyzer {
  readonly platform = "claude" as const;
  readonly platformName = "Claude";

  async analyze(input: AIOAnalysisInput): Promise<PlatformScore> {
    const factors: ScoreFactor[] = [];

    const structure = this.analyzeStructure(input);
    const entities = this.extractEntities(input.content);
    const wordCount = input.wordCount || input.content.split(/\s+/).length;
    const clarityMetrics = this.analyzeClarity(input);

    // 1. Semantic Clarity (25%)
    factors.push(this.calculateSemanticClarityFactor(clarityMetrics));

    // 2. Context Completeness (20%)
    factors.push(this.calculateContextFactor(input, structure));

    // 3. Logical Structure (20%)
    factors.push(this.calculateLogicalStructureFactor(input, structure));

    // 4. Entity Relationships (15%)
    factors.push(this.calculateEntityRelationshipFactor(entities, input.content));

    // 5. Answer Structure (10%)
    const answerFactor = this.calculateAnswerStructureFactor(structure);
    answerFactor.weight = 0.10;
    factors.push(answerFactor);

    // 6. Definition Presence (10%)
    factors.push(this.calculateDefinitionFactor(input.content, entities));

    const score = this.calculateScoreFromFactors(factors);
    const recommendations = this.generateRecommendations(factors);

    // Claude-specific recommendations
    if (clarityMetrics.ambiguousPronouns > 3) {
      recommendations.push({
        priority: "medium",
        title: "Reduce ambiguous pronouns",
        description:
          "Replace 'it', 'they', 'this' with explicit references. Claude extracts better when entities are named directly.",
        impact: "+5-10 points",
        autoFixable: true,
        action: "clarify_pronouns",
      });
    }

    if (!clarityMetrics.hasContextIntro) {
      recommendations.push({
        priority: "high",
        title: "Add context in introduction",
        description:
          "Define the topic and scope in the first paragraph. Claude needs context to accurately extract information.",
        impact: "+10-15 points",
        autoFixable: true,
        action: "add_context_intro",
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
      hasKeyTakeaways: content.includes("key takeaway") || content.includes("summary"),
      hasFAQSection: content.includes("faq") || content.includes("frequently asked"),
      hasHowToSection: content.includes("how to"),
      hasStepByStep: /step\s*[1-9]|first,.*second,|1\.\s/.test(content),
      hasExpertAttribution: content.includes("according to") || content.includes("expert"),
      hasStatistics: /\d+%|\d+\s*(million|billion)/.test(content),
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
    return firstParagraph.length >= 100 && firstParagraph.length <= 400;
  }

  private evaluateHeadingHierarchy(
    headings: { level: number; text: string }[]
  ): "good" | "fair" | "poor" {
    if (headings.length === 0) return "poor";

    // Check for logical progression (h1 -> h2 -> h3)
    let hasLogicalOrder = true;
    let lastLevel = 0;
    for (const h of headings) {
      if (h.level > lastLevel + 1) {
        hasLogicalOrder = false;
        break;
      }
      lastLevel = h.level;
    }

    if (hasLogicalOrder && headings.length >= 4) return "good";
    if (headings.length >= 2) return "fair";
    return "poor";
  }

  private evaluateParagraphStructure(content: string): "good" | "fair" | "poor" {
    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0);
    if (paragraphs.length === 0) return "poor";

    // Check for logical flow indicators
    const transitionWords = [
      "therefore",
      "however",
      "consequently",
      "furthermore",
      "additionally",
      "in contrast",
      "as a result",
      "because",
    ];
    const transitionCount = transitionWords.reduce((count, word) => {
      return count + (content.toLowerCase().match(new RegExp(word, "g")) || []).length;
    }, 0);

    if (transitionCount >= 5) return "good";
    if (transitionCount >= 2) return "fair";
    return "poor";
  }

  private extractEntities(content: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const seen = new Set<string>();

    // Extract capitalized phrases
    const phrases = content.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
    for (const phrase of phrases) {
      const normalized = phrase.toLowerCase();
      if (!seen.has(normalized) && phrase.length > 3) {
        seen.add(normalized);
        entities.push({
          name: phrase,
          type: "other",
          mentions: (content.match(new RegExp(phrase, "g")) || []).length,
          contextQuality: 50,
        });
      }
    }

    return entities.slice(0, 50);
  }

  private analyzeClarity(input: AIOAnalysisInput): {
    ambiguousPronouns: number;
    hasContextIntro: boolean;
    explicitReferences: number;
    causeEffectStatements: number;
  } {
    const content = input.content;
    const lower = content.toLowerCase();

    // Count ambiguous pronouns at sentence start
    const ambiguousPronouns = (
      content.match(/^\s*(It|They|This|That|These|Those)\s+/gm) || []
    ).length;

    // Check if first paragraph provides context
    const firstParagraph = content.split(/\n\n/)[0] || "";
    const hasContextIntro =
      firstParagraph.includes("is a") ||
      firstParagraph.includes("refers to") ||
      firstParagraph.includes("this guide") ||
      firstParagraph.includes("in this article");

    // Explicit references (using actual names instead of pronouns)
    const capitalizedReferences = (content.match(/[A-Z][a-z]+(?:'s)?/g) || []).length;

    // Cause-effect statements
    const causeEffectPatterns = [
      "because",
      "therefore",
      "as a result",
      "consequently",
      "leads to",
      "causes",
      "results in",
    ];
    const causeEffectStatements = causeEffectPatterns.reduce((count, pattern) => {
      return count + (lower.match(new RegExp(pattern, "g")) || []).length;
    }, 0);

    return {
      ambiguousPronouns,
      hasContextIntro,
      explicitReferences: capitalizedReferences,
      causeEffectStatements,
    };
  }

  private calculateSemanticClarityFactor(metrics: {
    ambiguousPronouns: number;
    hasContextIntro: boolean;
    explicitReferences: number;
    causeEffectStatements: number;
  }): ScoreFactor {
    let score = 70; // Base score

    // Penalize ambiguous pronouns
    score -= metrics.ambiguousPronouns * 5;

    // Reward context intro
    if (metrics.hasContextIntro) {
      score += 15;
    }

    // Reward explicit references
    score += Math.min(10, metrics.explicitReferences / 10);

    // Reward cause-effect clarity
    score += Math.min(10, metrics.causeEffectStatements * 2);

    return {
      name: "Semantic Clarity",
      score: Math.max(0, Math.min(100, score)),
      weight: 0.25,
      description: "Clear, unambiguous language that Claude can extract accurately",
    };
  }

  private calculateContextFactor(
    input: AIOAnalysisInput,
    structure: ContentStructure
  ): ScoreFactor {
    let score = 0;

    // Has meta description
    if (input.metaDescription && input.metaDescription.length >= 50) {
      score += 20;
    }

    // Has definitions
    if (structure.hasDefinitions) {
      score += 25;
    }

    // Has expert attribution
    if (structure.hasExpertAttribution) {
      score += 20;
    }

    // Has clear introduction
    const firstParagraph = input.content.split(/\n\n/)[0] || "";
    if (firstParagraph.length >= 100) {
      score += 20;
    }

    // Has conclusion/summary
    const lastParagraph = input.content.split(/\n\n/).pop() || "";
    if (
      lastParagraph.toLowerCase().includes("conclusion") ||
      lastParagraph.toLowerCase().includes("summary") ||
      lastParagraph.toLowerCase().includes("in conclusion")
    ) {
      score += 15;
    }

    return {
      name: "Context Completeness",
      score: Math.min(100, score),
      weight: 0.20,
      description: "Complete context for understanding without external references",
    };
  }

  private calculateLogicalStructureFactor(
    input: AIOAnalysisInput,
    structure: ContentStructure
  ): ScoreFactor {
    let score = 0;

    // Good heading hierarchy
    if (structure.headingHierarchy === "good") {
      score += 35;
    } else if (structure.headingHierarchy === "fair") {
      score += 20;
    }

    // Good paragraph structure (transitions)
    if (structure.paragraphStructure === "good") {
      score += 30;
    } else if (structure.paragraphStructure === "fair") {
      score += 15;
    }

    // Step-by-step sections
    if (structure.hasStepByStep) {
      score += 20;
    }

    // Has FAQ (Q&A structure)
    if (structure.hasFAQSection) {
      score += 15;
    }

    return {
      name: "Logical Structure",
      score: Math.min(100, score),
      weight: 0.20,
      description: "Clear logical flow with proper hierarchy and transitions",
    };
  }

  private calculateEntityRelationshipFactor(
    entities: ExtractedEntity[],
    content: string
  ): ScoreFactor {
    let score = 0;

    // Has entities
    score += Math.min(30, entities.length * 3);

    // Entities are mentioned multiple times (relationships)
    const multiMentionEntities = entities.filter((e) => e.mentions > 1).length;
    score += Math.min(30, multiMentionEntities * 6);

    // Entities are explained/defined in context
    const lower = content.toLowerCase();
    let explained = 0;
    for (const entity of entities.slice(0, 10)) {
      if (
        lower.includes(`${entity.name.toLowerCase()} is`) ||
        lower.includes(`${entity.name.toLowerCase()}, which`) ||
        lower.includes(`${entity.name.toLowerCase()} refers`)
      ) {
        explained++;
      }
    }
    score += Math.min(40, explained * 10);

    return {
      name: "Entity Relationships",
      score: Math.min(100, score),
      weight: 0.15,
      description: "Named entities with clear relationships and context",
    };
  }

  private calculateDefinitionFactor(
    content: string,
    entities: ExtractedEntity[]
  ): ScoreFactor {
    let score = 0;
    const lower = content.toLowerCase();

    // Definition patterns
    const definitionPatterns = [
      "is defined as",
      "refers to",
      "means that",
      "is a type of",
      "is known as",
      "can be described as",
    ];

    let definitionCount = 0;
    for (const pattern of definitionPatterns) {
      definitionCount += (lower.match(new RegExp(pattern, "g")) || []).length;
    }

    score += Math.min(50, definitionCount * 12);

    // Check if key entities are defined
    let entitiesDefined = 0;
    for (const entity of entities.slice(0, 5)) {
      if (lower.includes(`${entity.name.toLowerCase()} is`)) {
        entitiesDefined++;
      }
    }
    score += entitiesDefined * 10;

    return {
      name: "Definition Presence",
      score: Math.min(100, score),
      weight: 0.10,
      description: "Key terms and entities are defined before use",
    };
  }
}

export const claudeAnalyzer = new ClaudeAnalyzer();

