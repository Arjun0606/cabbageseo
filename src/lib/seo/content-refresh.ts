/**
 * Content Refresh Engine for CabbageSEO
 * 
 * Automatically detect and refresh stale content:
 * - Identify outdated articles
 * - Analyze performance decline
 * - Generate refresh suggestions
 * - Auto-update content
 * - A/B test titles
 */

import { claude } from "@/lib/ai/openai-client";
import { ContentPipeline } from "@/lib/ai/content-pipeline";

// ============================================
// TYPES
// ============================================

export interface ContentForRefresh {
  url: string;
  title: string;
  content: string;
  publishedAt: Date;
  lastUpdated: Date;
  targetKeyword: string;
  
  // Performance metrics
  currentPosition?: number;
  previousPosition?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
}

export interface RefreshCandidate {
  url: string;
  title: string;
  reason: RefreshReason;
  priority: "high" | "medium" | "low";
  potentialImpact: string;
  suggestedActions: string[];
  score: number;
}

export type RefreshReason = 
  | "position_drop"       // Lost rankings
  | "outdated_content"    // More than 12 months old
  | "low_ctr"             // High impressions, low clicks
  | "thin_content"        // Word count too low
  | "competitor_updated"  // Competitors refreshed their content
  | "topic_trending"      // Topic is trending, capitalize
  | "low_engagement";     // High bounce, low time on page

export interface RefreshPlan {
  url: string;
  originalTitle: string;
  newTitle: string;
  sectionsToAdd: Array<{ heading: string; content: string }>;
  sectionsToUpdate: Array<{ original: string; updated: string }>;
  sectionsToRemove: string[];
  newKeywordsToTarget: string[];
  internalLinksToAdd: Array<{ anchor: string; url: string }>;
  schemaUpdates: Record<string, unknown>;
  metaUpdates: {
    title?: string;
    description?: string;
  };
}

export interface TitleVariant {
  title: string;
  rationale: string;
  predictedCTR: number;
}

// ============================================
// CONTENT REFRESH ENGINE
// ============================================

export class ContentRefreshEngine {
  private pipeline: ContentPipeline;

  constructor() {
    this.pipeline = new ContentPipeline();
  }

  /**
   * Analyze content and find candidates for refresh
   */
  async findRefreshCandidates(
    content: ContentForRefresh[],
    options: {
      maxAge?: number;        // Days before content is "stale"
      minPositionDrop?: number;
      minCTRThreshold?: number;
    } = {}
  ): Promise<RefreshCandidate[]> {
    const {
      maxAge = 365,
      minPositionDrop = 5,
      minCTRThreshold = 2.0,
    } = options;

    const candidates: RefreshCandidate[] = [];
    const now = new Date();

    for (const item of content) {
      const reasons: Array<{ reason: RefreshReason; score: number; impact: string }> = [];

      // Check for position drop
      if (item.currentPosition && item.previousPosition) {
        const drop = item.currentPosition - item.previousPosition;
        if (drop >= minPositionDrop) {
          reasons.push({
            reason: "position_drop",
            score: Math.min(drop / 10, 1) * 100,
            impact: `Lost ${drop} positions (was #${item.previousPosition}, now #${item.currentPosition})`,
          });
        }
      }

      // Check for outdated content
      const ageInDays = Math.floor((now.getTime() - item.lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
      if (ageInDays > maxAge) {
        reasons.push({
          reason: "outdated_content",
          score: Math.min(ageInDays / 730, 1) * 80, // Max at 2 years
          impact: `Content is ${ageInDays} days old (last updated ${item.lastUpdated.toLocaleDateString()})`,
        });
      }

      // Check for low CTR
      if (item.impressions && item.impressions > 100 && item.ctr && item.ctr < minCTRThreshold) {
        reasons.push({
          reason: "low_ctr",
          score: (1 - item.ctr / minCTRThreshold) * 70,
          impact: `CTR of ${item.ctr.toFixed(2)}% is below ${minCTRThreshold}% threshold`,
        });
      }

      // Check for thin content
      const wordCount = item.content.split(/\s+/).length;
      if (wordCount < 1000) {
        reasons.push({
          reason: "thin_content",
          score: (1 - wordCount / 1000) * 60,
          impact: `Only ${wordCount} words (recommended: 1500+)`,
        });
      }

      if (reasons.length > 0) {
        // Pick the highest priority reason
        const topReason = reasons.sort((a, b) => b.score - a.score)[0];
        const totalScore = reasons.reduce((sum, r) => sum + r.score, 0);

        candidates.push({
          url: item.url,
          title: item.title,
          reason: topReason.reason,
          priority: totalScore > 150 ? "high" : totalScore > 80 ? "medium" : "low",
          potentialImpact: topReason.impact,
          suggestedActions: this.getSuggestedActions(reasons.map(r => r.reason)),
          score: totalScore,
        });
      }
    }

    return candidates.sort((a, b) => b.score - a.score);
  }

  /**
   * Generate a comprehensive refresh plan for a piece of content
   */
  async generateRefreshPlan(
    content: ContentForRefresh,
    serpData?: Array<{ title: string; snippet: string; url: string }>
  ): Promise<RefreshPlan> {
    const prompt = `You are an SEO content strategist. Analyze this content and create a refresh plan.

CURRENT CONTENT:
Title: ${content.title}
Target Keyword: ${content.targetKeyword}
Published: ${content.publishedAt.toLocaleDateString()}
Last Updated: ${content.lastUpdated.toLocaleDateString()}
Current Position: ${content.currentPosition || "Not ranking"}

Content (first 3000 chars):
${content.content.slice(0, 3000)}

${serpData ? `
TOP COMPETITORS:
${serpData.slice(0, 5).map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}`).join("\n\n")}
` : ""}

Create a refresh plan to improve this content's rankings. Return JSON:

{
  "newTitle": "Improved title (or same if good)",
  "sectionsToAdd": [
    { "heading": "H2 heading", "content": "Brief description of what to add" }
  ],
  "sectionsToUpdate": [
    { "original": "Current section topic", "updated": "How to improve it" }
  ],
  "sectionsToRemove": ["Topics that are no longer relevant"],
  "newKeywordsToTarget": ["Additional keywords to incorporate"],
  "internalLinksToAdd": [
    { "anchor": "phrase to link", "url": "/suggested-page" }
  ],
  "metaUpdates": {
    "title": "New meta title (60 chars max)",
    "description": "New meta description (155 chars max)"
  }
}

Focus on:
1. Adding fresh statistics/data (use "[2024 data needed]" placeholders)
2. Covering gaps vs competitors
3. Improving structure for featured snippets
4. Adding FAQ schema opportunities
5. Strengthening the introduction`;

    try {
      const response = await claude.chat(
        [{ role: "user", content: prompt }],
        undefined,
        { model: "sonnet", maxTokens: 2000 }
      );

      const plan = JSON.parse(response.content);

      return {
        url: content.url,
        originalTitle: content.title,
        newTitle: plan.newTitle || content.title,
        sectionsToAdd: plan.sectionsToAdd || [],
        sectionsToUpdate: plan.sectionsToUpdate || [],
        sectionsToRemove: plan.sectionsToRemove || [],
        newKeywordsToTarget: plan.newKeywordsToTarget || [],
        internalLinksToAdd: plan.internalLinksToAdd || [],
        schemaUpdates: {},
        metaUpdates: plan.metaUpdates || {},
      };
    } catch (error) {
      // Return minimal plan on error
      return {
        url: content.url,
        originalTitle: content.title,
        newTitle: content.title,
        sectionsToAdd: [],
        sectionsToUpdate: [],
        sectionsToRemove: [],
        newKeywordsToTarget: [],
        internalLinksToAdd: [],
        schemaUpdates: {},
        metaUpdates: {},
      };
    }
  }

  /**
   * Generate A/B test title variants
   */
  async generateTitleVariants(
    content: ContentForRefresh,
    count: number = 3
  ): Promise<TitleVariant[]> {
    const prompt = `Generate ${count} alternative title variations for A/B testing.

Current Title: ${content.title}
Target Keyword: ${content.targetKeyword}
Current CTR: ${content.ctr ? `${content.ctr.toFixed(2)}%` : "Unknown"}

Create titles that:
1. Include the target keyword naturally
2. Use power words (Ultimate, Complete, Best, etc.)
3. Include numbers where appropriate
4. Create curiosity or urgency
5. Stay under 60 characters

Return JSON array:
[
  {
    "title": "The new title",
    "rationale": "Why this might perform better",
    "predictedCTR": 3.5
  }
]`;

    try {
      const response = await claude.chat(
        [{ role: "user", content: prompt }],
        undefined,
        { model: "haiku", maxTokens: 800 }
      );

      return JSON.parse(response.content);
    } catch {
      return [];
    }
  }

  /**
   * Auto-refresh content with AI
   */
  async autoRefresh(
    content: ContentForRefresh,
    plan: RefreshPlan
  ): Promise<string> {
    let refreshedContent = content.content;

    // Update sections
    for (const update of plan.sectionsToUpdate) {
      const prompt = `Rewrite this section to be more comprehensive and up-to-date:

Original section topic: ${update.original}
Improvement needed: ${update.updated}

Target keyword: ${content.targetKeyword}

Write 2-3 paragraphs that improve upon the original.`;

      try {
        const response = await claude.chat(
          [{ role: "user", content: prompt }],
          undefined,
          { model: "sonnet", maxTokens: 500 }
        );

        // Simple replacement (in production, would use smarter matching)
        refreshedContent += `\n\n## Updated: ${update.original}\n\n${response.content}`;
      } catch {
        // Skip this update on error
      }
    }

    // Add new sections
    for (const section of plan.sectionsToAdd) {
      const prompt = `Write a new section for an article about "${content.targetKeyword}".

Section heading: ${section.heading}
Brief: ${section.content}

Write 2-4 paragraphs with useful, actionable information. Include specific examples or data points.`;

      try {
        const response = await claude.chat(
          [{ role: "user", content: prompt }],
          undefined,
          { model: "sonnet", maxTokens: 600 }
        );

        refreshedContent += `\n\n## ${section.heading}\n\n${response.content}`;
      } catch {
        // Skip this section on error
      }
    }

    return refreshedContent;
  }

  /**
   * Get content that needs urgent refresh
   */
  async getUrgentRefreshList(
    content: ContentForRefresh[]
  ): Promise<Array<{ url: string; title: string; urgency: string; action: string }>> {
    const candidates = await this.findRefreshCandidates(content);
    
    return candidates
      .filter(c => c.priority === "high")
      .slice(0, 10)
      .map(c => ({
        url: c.url,
        title: c.title,
        urgency: c.potentialImpact,
        action: c.suggestedActions[0] || "Review and refresh",
      }));
  }

  // ============================================
  // HELPERS
  // ============================================

  private getSuggestedActions(reasons: RefreshReason[]): string[] {
    const actions: string[] = [];

    for (const reason of reasons) {
      switch (reason) {
        case "position_drop":
          actions.push("Analyze competitor content for gaps");
          actions.push("Add fresh data and statistics");
          actions.push("Improve content depth");
          break;
        case "outdated_content":
          actions.push("Update dates and statistics");
          actions.push("Add new sections for recent developments");
          actions.push("Refresh examples and case studies");
          break;
        case "low_ctr":
          actions.push("A/B test new titles");
          actions.push("Improve meta description");
          actions.push("Add structured data for rich snippets");
          break;
        case "thin_content":
          actions.push("Expand with additional sections");
          actions.push("Add FAQ section");
          actions.push("Include more examples and details");
          break;
        case "competitor_updated":
          actions.push("Match competitor content depth");
          actions.push("Cover missing subtopics");
          break;
        case "topic_trending":
          actions.push("Add trending angle");
          actions.push("Update with latest information");
          break;
        case "low_engagement":
          actions.push("Improve readability");
          actions.push("Add visual elements");
          actions.push("Enhance introduction hook");
          break;
      }
    }

    return [...new Set(actions)];
  }
}

// ============================================
// SINGLETON
// ============================================

export const contentRefresh = new ContentRefreshEngine();

