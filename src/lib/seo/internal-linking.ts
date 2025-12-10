/**
 * Internal Linking Engine for CabbageSEO
 * 
 * LinkWhisper-style automation:
 * - Analyze content for linking opportunities
 * - Auto-suggest contextual anchors
 * - Build topic clusters through links
 * - Fix orphan pages
 * - Optimize link distribution
 */

import { claude } from "@/lib/ai/claude-client";

// ============================================
// TYPES
// ============================================

export interface PageForLinking {
  url: string;
  title: string;
  content: string;
  existingLinks: string[];
  targetKeywords?: string[];
}

export interface LinkSuggestion {
  fromUrl: string;
  toUrl: string;
  anchorText: string;
  contextSentence: string;
  relevanceScore: number;
  insertPosition: {
    paragraph: number;
    sentence: string;
  };
}

export interface LinkingAnalysis {
  orphanPages: string[];
  overlinkedPages: Array<{ url: string; linkCount: number }>;
  underlinkedPages: Array<{ url: string; linkCount: number }>;
  suggestions: LinkSuggestion[];
  linkDistribution: {
    min: number;
    max: number;
    average: number;
  };
}

export interface LinkOpportunity {
  sourceUrl: string;
  targetUrl: string;
  anchor: string;
  context: string;
  score: number;
}

// ============================================
// INTERNAL LINKING ENGINE
// ============================================

export class InternalLinkingEngine {
  private pages: PageForLinking[] = [];
  
  /**
   * Load pages for analysis
   */
  loadPages(pages: PageForLinking[]): void {
    this.pages = pages;
  }

  /**
   * Analyze internal link structure
   */
  analyze(): LinkingAnalysis {
    const incomingLinks = new Map<string, string[]>();
    const outgoingLinks = new Map<string, string[]>();
    
    // Build link maps
    for (const page of this.pages) {
      outgoingLinks.set(page.url, page.existingLinks);
      
      for (const link of page.existingLinks) {
        const existing = incomingLinks.get(link) || [];
        existing.push(page.url);
        incomingLinks.set(link, existing);
      }
    }
    
    // Find orphan pages (no incoming links)
    const orphanPages = this.pages
      .filter(p => {
        const incoming = incomingLinks.get(p.url) || [];
        return incoming.length === 0;
      })
      .map(p => p.url);
    
    // Find over/under linked pages
    const linkCounts = this.pages.map(p => ({
      url: p.url,
      linkCount: (incomingLinks.get(p.url) || []).length,
    }));
    
    const avgLinks = linkCounts.reduce((sum, p) => sum + p.linkCount, 0) / linkCounts.length || 1;
    
    const overlinkedPages = linkCounts.filter(p => p.linkCount > avgLinks * 2);
    const underlinkedPages = linkCounts.filter(p => p.linkCount < avgLinks * 0.5 && p.linkCount < 3);
    
    // Calculate distribution
    const counts = linkCounts.map(p => p.linkCount);
    
    return {
      orphanPages,
      overlinkedPages,
      underlinkedPages,
      suggestions: [], // Will be populated by generateSuggestions
      linkDistribution: {
        min: Math.min(...counts, 0),
        max: Math.max(...counts, 0),
        average: avgLinks,
      },
    };
  }

  /**
   * Generate link suggestions using AI
   */
  async generateSuggestions(maxSuggestions: number = 20): Promise<LinkSuggestion[]> {
    const suggestions: LinkSuggestion[] = [];
    const analysis = this.analyze();
    
    // Prioritize linking TO orphan and underlinked pages
    const priorityTargets = [
      ...analysis.orphanPages,
      ...analysis.underlinkedPages.map(p => p.url),
    ];
    
    for (const targetUrl of priorityTargets.slice(0, 10)) {
      const targetPage = this.pages.find(p => p.url === targetUrl);
      if (!targetPage) continue;
      
      // Find pages that could link TO this target
      for (const sourcePage of this.pages) {
        if (sourcePage.url === targetUrl) continue;
        if (sourcePage.existingLinks.includes(targetUrl)) continue;
        
        // Check for topical relevance
        const relevance = this.calculateRelevance(sourcePage, targetPage);
        if (relevance < 0.3) continue;
        
        // Find best anchor opportunity
        const anchor = await this.findBestAnchor(sourcePage, targetPage);
        if (!anchor) continue;
        
        suggestions.push({
          fromUrl: sourcePage.url,
          toUrl: targetUrl,
          anchorText: anchor.text,
          contextSentence: anchor.context,
          relevanceScore: relevance,
          insertPosition: {
            paragraph: anchor.paragraph,
            sentence: anchor.context,
          },
        });
        
        if (suggestions.length >= maxSuggestions) break;
      }
      
      if (suggestions.length >= maxSuggestions) break;
    }
    
    return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Auto-generate internal links for a piece of content
   */
  async autoLink(content: string, pageUrl: string): Promise<{
    linkedContent: string;
    linksAdded: Array<{ anchor: string; url: string }>;
  }> {
    const linksAdded: Array<{ anchor: string; url: string }> = [];
    let linkedContent = content;
    
    // Find potential link targets from existing pages
    const potentialTargets = this.pages
      .filter(p => p.url !== pageUrl)
      .slice(0, 20);
    
    if (potentialTargets.length === 0) {
      return { linkedContent, linksAdded };
    }
    
    // Use AI to find linking opportunities
    const prompt = `Analyze this content and find opportunities to add internal links.

Content:
${content.slice(0, 3000)}

Available pages to link to:
${potentialTargets.map(p => `- ${p.url}: ${p.title}`).join("\n")}

Find 3-5 phrases in the content that could naturally link to one of these pages.

Return JSON array:
[
  {
    "phrase": "exact phrase from content",
    "linkTo": "url to link to",
    "reason": "why this link makes sense"
  }
]

Rules:
- Only use exact phrases that appear in the content
- Links should be contextually relevant
- Don't over-link (max 5)
- Prefer informational anchors over generic ones`;

    try {
      const response = await claude.chat(
        [{ role: "user", content: prompt }],
        undefined,
        { model: "haiku", maxTokens: 1000 }
      );
      
      const suggestions = JSON.parse(response.content);
      
      for (const suggestion of suggestions) {
        if (linkedContent.includes(suggestion.phrase) && !linkedContent.includes(`href="${suggestion.linkTo}"`)) {
          const linkedPhrase = `<a href="${suggestion.linkTo}">${suggestion.phrase}</a>`;
          linkedContent = linkedContent.replace(suggestion.phrase, linkedPhrase);
          linksAdded.push({
            anchor: suggestion.phrase,
            url: suggestion.linkTo,
          });
        }
      }
    } catch {
      // AI call failed, return original content
    }
    
    return { linkedContent, linksAdded };
  }

  /**
   * Get link opportunities for a specific page
   */
  async getOpportunitiesForPage(pageUrl: string): Promise<LinkOpportunity[]> {
    const page = this.pages.find(p => p.url === pageUrl);
    if (!page) return [];
    
    const opportunities: LinkOpportunity[] = [];
    
    for (const targetPage of this.pages) {
      if (targetPage.url === pageUrl) continue;
      if (page.existingLinks.includes(targetPage.url)) continue;
      
      const relevance = this.calculateRelevance(page, targetPage);
      if (relevance < 0.2) continue;
      
      const anchor = await this.findBestAnchor(page, targetPage);
      if (!anchor) continue;
      
      opportunities.push({
        sourceUrl: pageUrl,
        targetUrl: targetPage.url,
        anchor: anchor.text,
        context: anchor.context,
        score: relevance,
      });
    }
    
    return opportunities.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  /**
   * Fix all orphan pages by adding links
   */
  async fixOrphanPages(): Promise<Array<{ orphanUrl: string; linkedFrom: string; anchor: string }>> {
    const analysis = this.analyze();
    const fixes: Array<{ orphanUrl: string; linkedFrom: string; anchor: string }> = [];
    
    for (const orphanUrl of analysis.orphanPages) {
      const orphanPage = this.pages.find(p => p.url === orphanUrl);
      if (!orphanPage) continue;
      
      // Find best page to link from
      let bestSource: { page: PageForLinking; relevance: number } | null = null;
      
      for (const sourcePage of this.pages) {
        if (sourcePage.url === orphanUrl) continue;
        
        const relevance = this.calculateRelevance(sourcePage, orphanPage);
        if (!bestSource || relevance > bestSource.relevance) {
          bestSource = { page: sourcePage, relevance };
        }
      }
      
      if (bestSource && bestSource.relevance > 0.2) {
        const anchor = await this.findBestAnchor(bestSource.page, orphanPage);
        if (anchor) {
          fixes.push({
            orphanUrl,
            linkedFrom: bestSource.page.url,
            anchor: anchor.text,
          });
        }
      }
    }
    
    return fixes;
  }

  // ============================================
  // HELPERS
  // ============================================

  private calculateRelevance(source: PageForLinking, target: PageForLinking): number {
    // Simple keyword overlap relevance
    const sourceWords = new Set(
      (source.title + " " + source.content.slice(0, 500))
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 3)
    );
    
    const targetWords = new Set(
      (target.title + " " + (target.targetKeywords?.join(" ") || ""))
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 3)
    );
    
    let overlap = 0;
    for (const word of targetWords) {
      if (sourceWords.has(word)) overlap++;
    }
    
    return Math.min(1, overlap / Math.max(targetWords.size, 1));
  }

  private async findBestAnchor(
    source: PageForLinking,
    target: PageForLinking
  ): Promise<{ text: string; context: string; paragraph: number } | null> {
    // Extract potential anchor phrases from target keywords/title
    const targetPhrases = [
      target.title.toLowerCase(),
      ...(target.targetKeywords || []).map(k => k.toLowerCase()),
    ];
    
    // Find these phrases in source content
    const paragraphs = source.content.split(/\n\n+/);
    
    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i].toLowerCase();
      
      for (const phrase of targetPhrases) {
        if (para.includes(phrase)) {
          // Extract sentence containing the phrase
          const sentences = paragraphs[i].split(/[.!?]+/);
          const matchingSentence = sentences.find(s => 
            s.toLowerCase().includes(phrase)
          );
          
          if (matchingSentence) {
            return {
              text: phrase,
              context: matchingSentence.trim(),
              paragraph: i,
            };
          }
        }
      }
    }
    
    // Fallback: use title as anchor if topically relevant
    if (this.calculateRelevance(source, target) > 0.5) {
      return {
        text: target.title,
        context: `Related: ${target.title}`,
        paragraph: paragraphs.length - 1,
      };
    }
    
    return null;
  }
}

// ============================================
// SINGLETON
// ============================================

export const internalLinking = new InternalLinkingEngine();

