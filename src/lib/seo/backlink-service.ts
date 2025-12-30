/**
 * Unified Backlink Service for CabbageSEO
 * 
 * REPLACES AHREFS by combining:
 * 1. DataForSEO Backlinks API (cheap, pay-per-use)
 * 2. GSC (free backlink data for user's own site)
 * 3. Claude + SERP (infer authority without backlink data)
 * 
 * This gives Ahrefs-level insights at a fraction of the cost.
 */

import { dataForSEO } from "@/lib/integrations/dataforseo/client";
import { serpapi } from "@/lib/integrations/serpapi/client";
import { claude } from "@/lib/ai/openai-client";

// Note: GSC integration for backlinks would require per-user OAuth tokens
// For now, we use DataForSEO which is pay-per-use and works for any domain

// ============================================
// TYPES
// ============================================

export interface BacklinkProfile {
  domain: string;
  totalBacklinks: number;
  referringDomains: number;
  domainRating: number; // 0-100 score
  dofollowLinks: number;
  nofollowLinks: number;
  newLast30Days: number;
  lostLast30Days: number;
  topAnchors: Array<{ anchor: string; count: number }>;
  topReferrers: Array<{ domain: string; rank: number; backlinks: number }>;
  dataSource: "dataforseo" | "gsc" | "estimated";
}

export interface CompetitorAnalysis {
  domain: string;
  estimatedAuthority: number; // 0-100
  topRankingKeywords: string[];
  contentCharacteristics: string[];
  estimatedBacklinkNeeds: string;
  strengthsWeaknesses: {
    strengths: string[];
    weaknesses: string[];
  };
}

export interface LinkGapOpportunity {
  domain: string;
  linksToCompetitors: number;
  competitorsLinked: string[];
  domainRank: number;
  outreachPriority: "high" | "medium" | "low";
  suggestedApproach: string;
}

// ============================================
// BACKLINK SERVICE
// ============================================

export class BacklinkService {
  /**
   * Get backlink profile for any domain
   * Uses DataForSEO (pay-per-use, cheap)
   */
  async getBacklinkProfile(domain: string): Promise<BacklinkProfile> {
    return this.getProfileFromDataForSEO(domain);
  }

  /**
   * Get backlink profile from DataForSEO
   */
  private async getProfileFromDataForSEO(domain: string): Promise<BacklinkProfile> {
    const [summary, anchors, referrers, changes] = await Promise.all([
      dataForSEO.getBacklinkSummary(domain),
      dataForSEO.getAnchorTexts(domain, { limit: 10 }),
      dataForSEO.getReferringDomains(domain, { limit: 10 }),
      this.getRecentChanges(domain),
    ]);

    return {
      domain,
      totalBacklinks: summary?.backlinks || 0,
      referringDomains: summary?.referringDomains || 0,
      domainRating: summary?.domainRank || 0,
      dofollowLinks: summary?.referringDomainsDofollow || 0,
      nofollowLinks: summary?.referringDomainsNofollow || 0,
      newLast30Days: changes.new,
      lostLast30Days: changes.lost,
      topAnchors: anchors.map(a => ({ anchor: a.anchor, count: a.backlinks })),
      topReferrers: referrers.map(r => ({
        domain: r.domain,
        rank: r.rank,
        backlinks: r.backlinks,
      })),
      dataSource: "dataforseo",
    };
  }

  /**
   * Get recent backlink changes
   */
  private async getRecentChanges(domain: string): Promise<{ new: number; lost: number }> {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const changes = await dataForSEO.getBacklinkChanges(
      domain,
      thirtyDaysAgo.toISOString().split("T")[0],
      today.toISOString().split("T")[0]
    );

    return {
      new: changes.newBacklinks,
      lost: changes.lostBacklinks,
    };
  }

  /**
   * Analyze competitor authority using SERP + Claude
   * This is the "smart" alternative to Ahrefs - infer authority without heavy backlink data
   */
  async analyzeCompetitorAuthority(
    keyword: string,
    competitorUrl: string
  ): Promise<CompetitorAnalysis> {
    // Get SERP data for context
    const serpResults = await serpapi.searchGoogle({ q: keyword, num: 10 });
    const competitorPosition = serpResults.organic_results?.findIndex(
      (r: { link: string }) => r.link.includes(new URL(competitorUrl).hostname)
    );

    // Get the competitor's page content/snippet from SERP
    const competitorResult = serpResults.organic_results?.find(
      (r: { link: string }) => r.link.includes(new URL(competitorUrl).hostname)
    );

    // Use Claude to analyze
    const prompt = `Analyze this competitor's SEO authority and characteristics.

Keyword: "${keyword}"
Competitor URL: ${competitorUrl}
SERP Position: ${competitorPosition !== undefined && competitorPosition >= 0 ? competitorPosition + 1 : "Not in top 10"}
Title: ${competitorResult?.title || "Unknown"}
Snippet: ${competitorResult?.snippet || "Unknown"}

Top 5 ranking pages for this keyword:
${serpResults.organic_results?.slice(0, 5).map((r: { title: string; link: string; snippet: string }, i: number) => 
  `${i + 1}. ${r.title} - ${r.link}`
).join("\n") || "No data"}

Based on this SERP data, analyze the competitor:

Return JSON:
{
  "estimatedAuthority": 75,
  "topRankingKeywords": ["keyword1", "keyword2"],
  "contentCharacteristics": ["Long-form content", "Heavy use of visuals", "Expert quotes"],
  "estimatedBacklinkNeeds": "Likely has 50-100 referring domains based on SERP position",
  "strengths": ["Strong content", "Good domain age"],
  "weaknesses": ["Limited social proof", "No schema markup"]
}

Use SERP position as a proxy for authority:
- Position 1-3: 80-100 authority
- Position 4-7: 60-80 authority
- Position 8-10: 40-60 authority
- Not ranking: 20-40 authority

Be specific and actionable.`;

    try {
      const response = await claude.chat(
        [{ role: "user", content: prompt }],
        undefined,
        { model: "haiku", maxTokens: 800 }
      );

      const analysis = JSON.parse(response.content);
      const domain = new URL(competitorUrl).hostname;

      return {
        domain,
        estimatedAuthority: analysis.estimatedAuthority || 50,
        topRankingKeywords: analysis.topRankingKeywords || [],
        contentCharacteristics: analysis.contentCharacteristics || [],
        estimatedBacklinkNeeds: analysis.estimatedBacklinkNeeds || "",
        strengthsWeaknesses: {
          strengths: analysis.strengths || [],
          weaknesses: analysis.weaknesses || [],
        },
      };
    } catch {
      const domain = new URL(competitorUrl).hostname;
      return {
        domain,
        estimatedAuthority: 50,
        topRankingKeywords: [keyword],
        contentCharacteristics: [],
        estimatedBacklinkNeeds: "Unable to estimate",
        strengthsWeaknesses: { strengths: [], weaknesses: [] },
      };
    }
  }

  /**
   * Find link gap opportunities
   */
  async findLinkGapOpportunities(
    yourDomain: string,
    competitorDomains: string[]
  ): Promise<LinkGapOpportunity[]> {
    const gap = await dataForSEO.getBacklinkGap(yourDomain, competitorDomains);

    // Enhance with AI-suggested outreach approaches
    const opportunities: LinkGapOpportunity[] = [];

    for (const item of gap.slice(0, 20)) {
      const priority = item.rank > 50 ? "high" : item.rank > 20 ? "medium" : "low";
      
      opportunities.push({
        domain: item.domain,
        linksToCompetitors: item.linksToCompetitors,
        competitorsLinked: competitorDomains.filter((_, i) => i < item.linksToCompetitors),
        domainRank: item.rank,
        outreachPriority: priority,
        suggestedApproach: this.getSuggestedApproach(item.domain, item.rank),
      });
    }

    return opportunities;
  }

  /**
   * Get SERP authority analysis for multiple competitors
   * Uses Claude to extract insights without needing Ahrefs
   */
  async getSerpAuthorityAnalysis(keyword: string): Promise<{
    avgAuthority: number;
    contentGuidelines: string[];
    backlinkEstimate: string;
    topCompetitors: Array<{
      url: string;
      title: string;
      estimatedAuthority: number;
    }>;
  }> {
    const serpResults = await serpapi.searchGoogle({ q: keyword, num: 10 });

    const prompt = `Analyze the SEO competition for this keyword based on SERP data.

Keyword: "${keyword}"

Top 10 results:
${serpResults.organic_results?.map((r: { title: string; link: string; snippet: string }, i: number) => 
  `${i + 1}. ${r.title}\n   URL: ${r.link}\n   Snippet: ${r.snippet?.slice(0, 100)}...`
).join("\n\n") || "No data"}

Analyze:
1. What's the average domain authority of ranking pages? (estimate based on brand recognition, content quality indicators)
2. What content characteristics do top results share?
3. How many backlinks would a new page need to compete?

Return JSON:
{
  "avgAuthority": 65,
  "contentGuidelines": [
    "Long-form content (2000+ words)",
    "Include statistics and data",
    "Use expert quotes"
  ],
  "backlinkEstimate": "New content would need 20-50 quality backlinks to compete",
  "topCompetitors": [
    { "url": "...", "title": "...", "estimatedAuthority": 80 }
  ]
}`;

    try {
      const response = await claude.chat(
        [{ role: "user", content: prompt }],
        undefined,
        { model: "haiku", maxTokens: 1000 }
      );

      return JSON.parse(response.content);
    } catch {
      return {
        avgAuthority: 50,
        contentGuidelines: [],
        backlinkEstimate: "Unable to estimate",
        topCompetitors: [],
      };
    }
  }

  /**
   * Quick domain check - get basic metrics fast
   */
  async quickDomainCheck(domain: string): Promise<{
    domainRating: number;
    referringDomains: number;
    totalBacklinks: number;
    healthStatus: "healthy" | "growing" | "declining" | "unknown";
  }> {
    const summary = await dataForSEO.getBacklinkSummary(domain);

    if (!summary) {
      return {
        domainRating: 0,
        referringDomains: 0,
        totalBacklinks: 0,
        healthStatus: "unknown",
      };
    }

    // Determine health based on metrics
    let healthStatus: "healthy" | "growing" | "declining" | "unknown" = "healthy";
    
    if (summary.brokenBacklinks > summary.backlinks * 0.1) {
      healthStatus = "declining";
    } else if (summary.referringDomains > 100) {
      healthStatus = "growing";
    }

    return {
      domainRating: summary.domainRank,
      referringDomains: summary.referringDomains,
      totalBacklinks: summary.backlinks,
      healthStatus,
    };
  }

  // ============================================
  // HELPERS
  // ============================================

  private getSuggestedApproach(domain: string, rank: number): string {
    if (rank > 70) {
      return "High-authority site - use personalized, value-first outreach";
    } else if (rank > 40) {
      return "Medium authority - guest post or resource page outreach";
    } else {
      return "Lower authority - link exchange or collaboration opportunity";
    }
  }
}

// ============================================
// SINGLETON
// ============================================

export const backlinks = new BacklinkService();

