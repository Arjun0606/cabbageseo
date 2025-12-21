/**
 * AIO Audit Engine
 * 
 * Analyzes content for AI search optimization issues.
 * Extends the existing technical audit system with AIO-specific checks.
 */

import type { 
  AIOAnalysisResult, 
  ContentStructure, 
  ExtractedEntity,
  AIOPlatform,
  Recommendation,
} from "./types";
import { PLATFORM_LABELS } from "./types";

// ============================================
// TYPES
// ============================================

export type AIOIssueSeverity = "critical" | "high" | "medium" | "low";
export type AIOIssueCategory = 
  | "entity"
  | "structure" 
  | "quotability"
  | "schema"
  | "freshness"
  | "authority"
  | "platform_specific";

export interface AIOIssue {
  id: string;
  type: AIOIssueType;
  category: AIOIssueCategory;
  severity: AIOIssueSeverity;
  title: string;
  description: string;
  recommendation: string;
  affectedPlatforms: AIOPlatform[];
  impact: string; // Expected score improvement
  autoFixable: boolean;
  autoFixAction?: string;
  details?: Record<string, unknown>;
}

export type AIOIssueType = 
  | "low_entity_density"
  | "poor_answer_structure"
  | "missing_faq"
  | "missing_howto"
  | "weak_quotability"
  | "missing_definitions"
  | "no_expert_attribution"
  | "ambiguous_context"
  | "stale_content"
  | "missing_key_takeaways"
  | "long_paragraphs"
  | "missing_statistics"
  | "poor_heading_hierarchy"
  | "missing_schema"
  | "no_direct_answer";

export interface AIOAuditResult {
  score: number; // 0-100 overall AIO health score
  issues: AIOIssue[];
  summary: AIOAuditSummary;
  platformIssues: Record<AIOPlatform, AIOIssue[]>;
  auditedAt: Date;
}

export interface AIOAuditSummary {
  totalIssues: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  autoFixableCount: number;
  categoryBreakdown: Record<AIOIssueCategory, number>;
}

// ============================================
// AIO AUDIT THRESHOLDS
// ============================================

const AIO_THRESHOLDS = {
  entityDensity: {
    min: 5, // entities per 1000 words
    optimal: 10,
  },
  quotability: {
    minScore: 60,
    optimalParagraphLength: { min: 50, max: 150 },
  },
  answerStructure: {
    minScore: 50,
  },
  freshness: {
    staleDays: 365, // 1 year
    warningDays: 180, // 6 months
  },
  statistics: {
    minCount: 1, // At least one statistic
  },
};

// ============================================
// AIO AUDIT ENGINE
// ============================================

export class AIOAuditEngine {
  /**
   * Run AIO audit on analysis result
   */
  audit(analysisResult: AIOAnalysisResult): AIOAuditResult {
    const issues: AIOIssue[] = [];
    
    // Check entity density
    issues.push(...this.checkEntityDensity(analysisResult));
    
    // Check content structure
    issues.push(...this.checkContentStructure(analysisResult.contentStructure));
    
    // Check quotability
    issues.push(...this.checkQuotability(analysisResult));
    
    // Check schema presence
    issues.push(...this.checkSchema(analysisResult));
    
    // Check authority signals
    issues.push(...this.checkAuthority(analysisResult.contentStructure));
    
    // Check answer structure
    issues.push(...this.checkAnswerStructure(analysisResult));
    
    // Sort by severity
    issues.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
    
    // Calculate score (100 minus penalties for issues)
    const score = this.calculateScore(issues);
    
    // Group issues by platform
    const platformIssues = this.groupByPlatform(issues);
    
    // Generate summary
    const summary = this.generateSummary(issues);
    
    return {
      score,
      issues,
      summary,
      platformIssues,
      auditedAt: new Date(),
    };
  }

  /**
   * Convert analysis recommendations to audit issues
   */
  fromRecommendations(recommendations: Recommendation[]): AIOIssue[] {
    return recommendations.map((rec, index) => ({
      id: `rec-${index}`,
      type: this.mapRecommendationToType(rec.title),
      category: this.inferCategory(rec.title),
      severity: rec.priority as AIOIssueSeverity,
      title: rec.title,
      description: rec.description,
      recommendation: rec.description,
      affectedPlatforms: ["google_aio", "chatgpt", "perplexity", "bing_copilot"],
      impact: rec.impact,
      autoFixable: rec.autoFixable,
      autoFixAction: rec.action,
    }));
  }

  // ============================================
  // CHECK METHODS
  // ============================================

  private checkEntityDensity(result: AIOAnalysisResult): AIOIssue[] {
    const issues: AIOIssue[] = [];
    
    if (result.entityDensity < AIO_THRESHOLDS.entityDensity.min) {
      issues.push({
        id: "entity-density-low",
        type: "low_entity_density",
        category: "entity",
        severity: result.entityDensity < 2 ? "critical" : "high",
        title: "Low entity density",
        description: `Your content has ${result.entityDensity.toFixed(1)} entities per 1000 words. AI platforms prefer at least ${AIO_THRESHOLDS.entityDensity.min}.`,
        recommendation: "Add more named entities: specific people, products, organizations, and concepts. Use proper nouns instead of generic terms.",
        affectedPlatforms: ["google_aio", "chatgpt", "perplexity", "bing_copilot"],
        impact: "+10-15 points",
        autoFixable: true,
        autoFixAction: "inject_entities",
        details: {
          currentDensity: result.entityDensity,
          entityCount: result.entities.length,
          targetDensity: AIO_THRESHOLDS.entityDensity.optimal,
        },
      });
    }
    
    // Check if entities are well-explained
    const poorlyExplainedEntities = result.entities.filter(e => e.contextQuality < 50);
    if (poorlyExplainedEntities.length > result.entities.length * 0.5) {
      issues.push({
        id: "entities-not-explained",
        type: "ambiguous_context",
        category: "entity",
        severity: "medium",
        title: "Entities lack context",
        description: `${poorlyExplainedEntities.length} entities are mentioned without proper explanation.`,
        recommendation: "Define key terms and entities when first mentioned. Provide context for proper nouns.",
        affectedPlatforms: ["perplexity", "bing_copilot"],
        impact: "+5-10 points",
        autoFixable: true,
        autoFixAction: "add_entity_definitions",
        details: {
          poorlyExplained: poorlyExplainedEntities.slice(0, 5).map(e => e.name),
        },
      });
    }
    
    return issues;
  }

  private checkContentStructure(structure: ContentStructure): AIOIssue[] {
    const issues: AIOIssue[] = [];
    
    if (!structure.hasDirectAnswer) {
      issues.push({
        id: "no-direct-answer",
        type: "no_direct_answer",
        category: "structure",
        severity: "critical",
        title: "No direct answer in introduction",
        description: "The first paragraph doesn't provide a direct answer to the main query.",
        recommendation: "Lead with a clear, concise answer (100-150 words) before explaining details.",
        affectedPlatforms: ["google_aio", "chatgpt", "perplexity"],
        impact: "+15-20 points",
        autoFixable: true,
        autoFixAction: "add_direct_answer",
      });
    }
    
    if (!structure.hasKeyTakeaways) {
      issues.push({
        id: "no-key-takeaways",
        type: "missing_key_takeaways",
        category: "structure",
        severity: "high",
        title: "Missing Key Takeaways section",
        description: "Content lacks a summary or key points section that AI can easily quote.",
        recommendation: "Add a 'Key Takeaways' or 'TL;DR' section near the top with 3-5 bullet points.",
        affectedPlatforms: ["chatgpt", "perplexity"],
        impact: "+10-15 points",
        autoFixable: true,
        autoFixAction: "add_key_takeaways",
      });
    }
    
    if (!structure.hasFAQSection) {
      issues.push({
        id: "no-faq",
        type: "missing_faq",
        category: "structure",
        severity: "high",
        title: "No FAQ section",
        description: "FAQ sections are highly cited by AI platforms and improve featured snippet chances.",
        recommendation: "Add 3-5 frequently asked questions with concise answers at the end of the article.",
        affectedPlatforms: ["google_aio", "chatgpt"],
        impact: "+15-20 points",
        autoFixable: true,
        autoFixAction: "generate_faq",
      });
    }
    
    if (!structure.hasStepByStep && structure.hasHowToSection) {
      issues.push({
        id: "howto-no-steps",
        type: "missing_howto",
        category: "structure",
        severity: "medium",
        title: "How-to content lacks numbered steps",
        description: "How-to content should use clear numbered steps for better AI extraction.",
        recommendation: "Format instructions as 'Step 1:', 'Step 2:' or numbered lists.",
        affectedPlatforms: ["google_aio", "bing_copilot"],
        impact: "+5-10 points",
        autoFixable: true,
        autoFixAction: "format_steps",
      });
    }
    
    if (structure.headingHierarchy === "poor") {
      issues.push({
        id: "poor-headings",
        type: "poor_heading_hierarchy",
        category: "structure",
        severity: "medium",
        title: "Poor heading structure",
        description: "Content lacks proper H1-H6 heading hierarchy for AI to understand structure.",
        recommendation: "Use one H1 tag, then H2s for main sections, H3s for subsections.",
        affectedPlatforms: ["google_aio", "chatgpt", "bing_copilot"],
        impact: "+5-10 points",
        autoFixable: false,
      });
    }
    
    if (!structure.hasDefinitions) {
      issues.push({
        id: "no-definitions",
        type: "missing_definitions",
        category: "structure",
        severity: "low",
        title: "No definitions provided",
        description: "Content doesn't define key terms, making it harder for AI to understand.",
        recommendation: "Add clear definitions using phrases like 'X is defined as...' or 'X refers to...'",
        affectedPlatforms: ["perplexity", "bing_copilot"],
        impact: "+5 points",
        autoFixable: true,
        autoFixAction: "add_definitions",
      });
    }
    
    return issues;
  }

  private checkQuotability(result: AIOAnalysisResult): AIOIssue[] {
    const issues: AIOIssue[] = [];
    
    if (result.quotabilityScore < AIO_THRESHOLDS.quotability.minScore) {
      issues.push({
        id: "low-quotability",
        type: "weak_quotability",
        category: "quotability",
        severity: result.quotabilityScore < 40 ? "high" : "medium",
        title: "Content is hard to quote",
        description: `Quotability score: ${result.quotabilityScore}/100. AI platforms prefer easily quotable content.`,
        recommendation: "Break long paragraphs into 50-150 word chunks. Add clear, self-contained statements.",
        affectedPlatforms: ["chatgpt", "perplexity", "bing_copilot"],
        impact: "+10-15 points",
        autoFixable: true,
        autoFixAction: "improve_quotability",
        details: {
          currentScore: result.quotabilityScore,
          quotableSnippets: result.quotableSnippets.length,
        },
      });
    }
    
    // Check paragraph length
    if (result.contentStructure.paragraphStructure === "poor") {
      issues.push({
        id: "long-paragraphs",
        type: "long_paragraphs",
        category: "quotability",
        severity: "medium",
        title: "Paragraphs are too long",
        description: "Long paragraphs (200+ words) are rarely quoted by AI platforms.",
        recommendation: "Split paragraphs to 50-150 words. Each paragraph should contain one main idea.",
        affectedPlatforms: ["chatgpt", "perplexity"],
        impact: "+10 points",
        autoFixable: true,
        autoFixAction: "split_paragraphs",
      });
    }
    
    return issues;
  }

  private checkSchema(result: AIOAnalysisResult): AIOIssue[] {
    const issues: AIOIssue[] = [];
    
    if (result.scores.breakdown.schemaPresence < 30) {
      issues.push({
        id: "no-schema",
        type: "missing_schema",
        category: "schema",
        severity: "high",
        title: "Missing structured data",
        description: "No Schema.org markup detected. This significantly reduces AI Overview visibility.",
        recommendation: "Add Article, FAQ, or HowTo schema markup depending on content type.",
        affectedPlatforms: ["google_aio", "bing_copilot"],
        impact: "+15-20 points",
        autoFixable: true,
        autoFixAction: "add_schema",
      });
    }
    
    if (result.contentStructure.hasFAQSection && result.scores.breakdown.schemaPresence < 60) {
      issues.push({
        id: "faq-no-schema",
        type: "missing_faq",
        category: "schema",
        severity: "medium",
        title: "FAQ content without FAQ schema",
        description: "You have FAQ content but no FAQPage schema markup.",
        recommendation: "Add FAQPage schema to your FAQ section for maximum AI Overview visibility.",
        affectedPlatforms: ["google_aio"],
        impact: "+10-15 points",
        autoFixable: true,
        autoFixAction: "add_faq_schema",
      });
    }
    
    return issues;
  }

  private checkAuthority(structure: ContentStructure): AIOIssue[] {
    const issues: AIOIssue[] = [];
    
    if (!structure.hasExpertAttribution) {
      issues.push({
        id: "no-expert",
        type: "no_expert_attribution",
        category: "authority",
        severity: "high",
        title: "No expert attribution",
        description: "Content lacks author credentials or expert quotes.",
        recommendation: "Add author bio with credentials. Include quotes from experts or cite authoritative sources.",
        affectedPlatforms: ["google_aio", "perplexity", "bing_copilot"],
        impact: "+10-15 points",
        autoFixable: true,
        autoFixAction: "add_expert_attribution",
      });
    }
    
    if (!structure.hasStatistics) {
      issues.push({
        id: "no-stats",
        type: "missing_statistics",
        category: "authority",
        severity: "medium",
        title: "No statistics or data",
        description: "Content lacks specific numbers, percentages, or data points.",
        recommendation: "Add relevant statistics with sources. Use specific numbers instead of vague claims.",
        affectedPlatforms: ["chatgpt", "perplexity"],
        impact: "+5-10 points",
        autoFixable: false,
      });
    }
    
    return issues;
  }

  private checkAnswerStructure(result: AIOAnalysisResult): AIOIssue[] {
    const issues: AIOIssue[] = [];
    
    if (result.answerStructureScore < AIO_THRESHOLDS.answerStructure.minScore) {
      issues.push({
        id: "poor-answer-structure",
        type: "poor_answer_structure",
        category: "structure",
        severity: "high",
        title: "Poor answer structure",
        description: `Answer structure score: ${result.answerStructureScore}/100. Content isn't formatted for AI extraction.`,
        recommendation: "Restructure content: lead with answers, use lists, add FAQs, include step-by-step sections.",
        affectedPlatforms: ["google_aio", "chatgpt", "perplexity", "bing_copilot"],
        impact: "+15-20 points",
        autoFixable: true,
        autoFixAction: "improve_answer_structure",
        details: {
          currentScore: result.answerStructureScore,
        },
      });
    }
    
    return issues;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private calculateScore(issues: AIOIssue[]): number {
    let score = 100;
    
    for (const issue of issues) {
      switch (issue.severity) {
        case "critical":
          score -= 15;
          break;
        case "high":
          score -= 10;
          break;
        case "medium":
          score -= 5;
          break;
        case "low":
          score -= 2;
          break;
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private groupByPlatform(issues: AIOIssue[]): Record<AIOPlatform, AIOIssue[]> {
    const result: Record<AIOPlatform, AIOIssue[]> = {
      google_aio: [],
      chatgpt: [],
      perplexity: [],
      bing_copilot: [],
    };
    
    for (const issue of issues) {
      for (const platform of issue.affectedPlatforms) {
        result[platform].push(issue);
      }
    }
    
    return result;
  }

  private generateSummary(issues: AIOIssue[]): AIOAuditSummary {
    const categoryBreakdown: Record<AIOIssueCategory, number> = {
      entity: 0,
      structure: 0,
      quotability: 0,
      schema: 0,
      freshness: 0,
      authority: 0,
      platform_specific: 0,
    };
    
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let autoFixableCount = 0;
    
    for (const issue of issues) {
      categoryBreakdown[issue.category]++;
      
      if (issue.autoFixable) autoFixableCount++;
      
      switch (issue.severity) {
        case "critical":
          criticalCount++;
          break;
        case "high":
          highCount++;
          break;
        case "medium":
          mediumCount++;
          break;
        case "low":
          lowCount++;
          break;
      }
    }
    
    return {
      totalIssues: issues.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      autoFixableCount,
      categoryBreakdown,
    };
  }

  private mapRecommendationToType(title: string): AIOIssueType {
    const lower = title.toLowerCase();
    if (lower.includes("entity")) return "low_entity_density";
    if (lower.includes("faq")) return "missing_faq";
    if (lower.includes("quotab")) return "weak_quotability";
    if (lower.includes("schema")) return "missing_schema";
    if (lower.includes("expert") || lower.includes("attribution")) return "no_expert_attribution";
    if (lower.includes("takeaway")) return "missing_key_takeaways";
    if (lower.includes("paragraph")) return "long_paragraphs";
    if (lower.includes("answer")) return "poor_answer_structure";
    if (lower.includes("heading")) return "poor_heading_hierarchy";
    if (lower.includes("definition")) return "missing_definitions";
    if (lower.includes("statistic")) return "missing_statistics";
    if (lower.includes("stale") || lower.includes("fresh")) return "stale_content";
    return "poor_answer_structure"; // Default
  }

  private inferCategory(title: string): AIOIssueCategory {
    const lower = title.toLowerCase();
    if (lower.includes("entity")) return "entity";
    if (lower.includes("schema")) return "schema";
    if (lower.includes("quotab") || lower.includes("paragraph")) return "quotability";
    if (lower.includes("expert") || lower.includes("statistic")) return "authority";
    if (lower.includes("fresh") || lower.includes("stale")) return "freshness";
    return "structure"; // Default
  }
}

// ============================================
// EXPORTS
// ============================================

export function createAIOAuditEngine(): AIOAuditEngine {
  return new AIOAuditEngine();
}

