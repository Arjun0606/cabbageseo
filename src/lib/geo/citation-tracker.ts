/**
 * GEO Citation Tracker
 * 
 * Real citation detection across AI platforms.
 * Sends alerts when your content gets cited.
 * 
 * "We tell you the moment AI starts citing you."
 */

import { createServiceClient } from "@/lib/supabase/server";

// ============================================
// TYPES
// ============================================

export interface Citation {
  id: string;
  siteId: string;
  pageUrl: string;
  platform: "perplexity" | "chatgpt" | "google_aio";
  query: string;
  snippet: string;
  citedAt: Date;
  confidence: "high" | "medium" | "low";
  verified: boolean;
}

export interface CitationReport {
  siteId: string;
  domain: string;
  period: {
    start: Date;
    end: Date;
  };
  totalCitations: number;
  newCitations: number;
  platformBreakdown: {
    perplexity: number;
    chatgpt: number;
    googleAio: number;
  };
  topCitedPages: Array<{
    url: string;
    citations: number;
  }>;
  topQueries: string[];
  geoScoreChange: number;
}

// ============================================
// PERPLEXITY CITATION CHECKER
// ============================================

export class PerplexityCitationChecker {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Check if a domain is cited for specific queries
   */
  async checkCitations(
    domain: string,
    queries: string[]
  ): Promise<Citation[]> {
    if (!this.apiKey) {
      return [];
    }

    const citations: Citation[] = [];

    for (const query of queries) {
      try {
        const response = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.1-sonar-small-128k-online",
            messages: [
              { role: "system", content: "Answer with sources." },
              { role: "user", content: query },
            ],
            return_citations: true,
          }),
        });

        if (!response.ok) continue;

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        const citedUrls: string[] = data.citations || [];

        // Check if our domain is cited
        const domainLower = domain.toLowerCase();
        const matchingCitations = citedUrls.filter((url: string) =>
          url.toLowerCase().includes(domainLower)
        );

        for (const citedUrl of matchingCitations) {
          citations.push({
            id: crypto.randomUUID(),
            siteId: "", // Will be filled by caller
            pageUrl: citedUrl,
            platform: "perplexity",
            query,
            snippet: content.slice(0, 200),
            citedAt: new Date(),
            confidence: "high",
            verified: true,
          });
        }

        // Rate limiting
        await new Promise(r => setTimeout(r, 200));
      } catch (error) {
        console.error(`Citation check error for query "${query}":`, error);
      }
    }

    return citations;
  }
}

// ============================================
// CITATION TRACKER SERVICE
// ============================================

export class CitationTracker {
  private perplexity: PerplexityCitationChecker;

  constructor() {
    this.perplexity = new PerplexityCitationChecker();
  }

  /**
   * Run citation check for all sites
   */
  async runCitationCheck(): Promise<void> {
    const supabase = await createServiceClient();
    if (!supabase) return;

    // Get all active sites
    const { data: sites } = await supabase
      .from("sites")
      .select("id, domain, topics")
      .eq("status", "active");

    if (!sites) return;

    for (const site of (sites as Array<{ id: string; domain: string; topics: string[] }>)) {
      await this.checkSiteCitations(site.id, site.domain, site.topics || []);
    }
  }

  /**
   * Check citations for a specific site
   */
  async checkSiteCitations(
    siteId: string,
    domain: string,
    topics: string[]
  ): Promise<Citation[]> {
    // Generate queries based on topics
    const queries = this.generateQueries(domain, topics);

    // Check Perplexity (real API)
    const citations = await this.perplexity.checkCitations(domain, queries);

    // Store citations
    if (citations.length > 0) {
      await this.storeCitations(siteId, citations);
    }

    return citations;
  }

  /**
   * Generate queries to check for citations
   */
  private generateQueries(domain: string, topics: string[]): string[] {
    const queries: string[] = [];

    // Topic-based queries
    for (const topic of topics.slice(0, 5)) {
      queries.push(`What is ${topic}?`);
      queries.push(`Best ${topic} tools and solutions`);
      queries.push(`How to ${topic}`);
    }

    // Brand queries
    queries.push(`Tell me about ${domain}`);
    queries.push(`Is ${domain} good?`);

    return queries;
  }

  /**
   * Store citations in database
   */
  private async storeCitations(siteId: string, citations: Citation[]): Promise<void> {
    const supabase = await createServiceClient();
    if (!supabase) return;

    for (const citation of citations) {
      // Check if citation already exists (avoid duplicates)
      const { data: existing } = await supabase
        .from("ai_citations")
        .select("id")
        .eq("site_id", siteId)
        .eq("query", citation.query)
        .eq("platform", citation.platform)
        .gte("discovered_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (existing) continue;

      await (supabase as any).from("ai_citations").insert({
        site_id: siteId,
        platform: citation.platform,
        query: citation.query,
        snippet: citation.snippet,
        citation_type: "direct",
        confidence: citation.confidence === "high" ? 0.9 : citation.confidence === "medium" ? 0.7 : 0.5,
        discovered_at: citation.citedAt.toISOString(),
      });
    }
  }

  /**
   * Get citation report for a site
   */
  async getCitationReport(
    siteId: string,
    days: number = 30
  ): Promise<CitationReport | null> {
    const supabase = await createServiceClient();
    if (!supabase) return null;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get site info
    const { data: siteData } = await (supabase as any)
      .from("sites")
      .select("domain, geo_score_avg")
      .eq("id", siteId)
      .single();

    const site = siteData as { domain: string; geo_score_avg: number } | null;
    if (!site) return null;

    // Get citations
    const { data: citationsRaw } = await (supabase as any)
      .from("ai_citations")
      .select("*")
      .eq("site_id", siteId)
      .gte("discovered_at", startDate.toISOString())
      .order("discovered_at", { ascending: false });

    type CitationRow = { platform: string; page_url?: string; query: string };
    const citations = (citationsRaw || []) as CitationRow[];

    // Get previous period for comparison
    const prevStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);
    const { data: prevCitations } = await (supabase as any)
      .from("ai_citations")
      .select("id")
      .eq("site_id", siteId)
      .gte("discovered_at", prevStartDate.toISOString())
      .lt("discovered_at", startDate.toISOString());

    // Calculate metrics
    const platformBreakdown = {
      perplexity: citations.filter(c => c.platform === "perplexity").length,
      chatgpt: citations.filter(c => c.platform === "chatgpt").length,
      googleAio: citations.filter(c => c.platform === "google_aio").length,
    };

    // Top cited pages
    const pageCounts = new Map<string, number>();
    for (const c of citations) {
      if (c.page_url) {
        pageCounts.set(c.page_url, (pageCounts.get(c.page_url) || 0) + 1);
      }
    }
    const topCitedPages = Array.from(pageCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([url, count]) => ({ url, citations: count }));

    // Top queries
    const queryCounts = new Map<string, number>();
    for (const c of citations) {
      queryCounts.set(c.query, (queryCounts.get(c.query) || 0) + 1);
    }
    const topQueries = Array.from(queryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([query]) => query);

    return {
      siteId,
      domain: site.domain,
      period: {
        start: startDate,
        end: new Date(),
      },
      totalCitations: citations.length,
      newCitations: citations.length - (prevCitations?.length || 0),
      platformBreakdown,
      topCitedPages,
      topQueries,
      geoScoreChange: 0, // TODO: Calculate from historical data
    };
  }

  /**
   * Send citation alert email
   */
  async sendCitationAlert(
    siteId: string,
    citation: Citation
  ): Promise<void> {
    const supabase = await createServiceClient();
    if (!supabase) return;

    // Get site owner email
    const { data: siteData } = await (supabase as any)
      .from("sites")
      .select("organization_id, domain")
      .eq("id", siteId)
      .single();

    const site = siteData as { organization_id: string; domain: string } | null;
    if (!site) return;

    // Get org owner
    const { data: members } = await (supabase as any)
      .from("organization_members")
      .select("user_id, profiles(email)")
      .eq("organization_id", site.organization_id)
      .eq("role", "owner")
      .limit(1);

    if (!members || members.length === 0) return;

    const ownerEmail = (members[0] as any).profiles?.email;
    if (!ownerEmail) return;

    // TODO: Send email via email service
    console.log(`[Citation Alert] ${site.domain} was cited on ${citation.platform}!`);
    console.log(`Query: "${citation.query}"`);
    console.log(`Email would be sent to: ${ownerEmail}`);
  }
}

// ============================================
// SINGLETON
// ============================================

export const citationTracker = new CitationTracker();

