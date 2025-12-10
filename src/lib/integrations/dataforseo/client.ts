/**
 * DataForSEO API Client
 * Handles all SEO data fetching - keywords, SERP, competitors
 */

interface DataForSEOConfig {
  login: string;
  password: string;
  baseUrl?: string;
}

interface KeywordData {
  keyword: string;
  volume: number;
  difficulty: number;
  cpc: number;
  competition: number;
  intent: string;
  serpFeatures: string[];
}

interface SerpResult {
  position: number;
  url: string;
  title: string;
  description: string;
  domain: string;
}

interface SerpAnalysis {
  keyword: string;
  results: SerpResult[];
  totalResults: number;
  serpFeatures: string[];
  avgWordCount: number;
  avgHeadings: number;
}

export class DataForSEOClient {
  private login: string;
  private password: string;
  private baseUrl: string;

  constructor(config?: DataForSEOConfig) {
    this.login = config?.login || process.env.DATAFORSEO_LOGIN || "";
    this.password = config?.password || process.env.DATAFORSEO_PASSWORD || "";
    this.baseUrl = config?.baseUrl || "https://api.dataforseo.com";
  }

  private get authHeader(): string {
    return `Basic ${Buffer.from(`${this.login}:${this.password}`).toString("base64")}`;
  }

  private async request<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Authorization": this.authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const json = await response.json();

    if (!response.ok) {
      console.error("DataForSEO error response:", JSON.stringify(json, null, 2).slice(0, 500));
      throw new Error(`DataForSEO API error: ${response.status} - ${json?.status_message || "Unknown error"}`);
    }

    // Check for task-level errors
    if (json.tasks?.[0]?.status_code !== 20000) {
      console.error("DataForSEO task error:", json.tasks?.[0]?.status_message);
    }

    return json as T;
  }

  /**
   * Get keyword data for a list of keywords
   */
  async getKeywordData(
    keywords: string[],
    location: string = "United States",
    language: string = "en"
  ): Promise<KeywordData[]> {
    const locationCode = await this.getLocationCode(location);
    const languageCode = await this.getLanguageCode(language);

    // DataForSEO expects keywords as an array in a single task object
    const response = await this.request<{
      tasks: Array<{
        result: Array<{
          keyword: string;
          search_volume: number;
          keyword_difficulty: number;
          cpc: number;
          competition: number;
          search_intent?: { main: string };
          monthly_searches?: Array<{ search_volume: number }>;
        }> | null;
      }>;
    }>("/v3/keywords_data/google_ads/search_volume/live", [{
      keywords,
      location_code: locationCode,
      language_code: languageCode,
    }]);

    const results = response.tasks?.[0]?.result;
    if (!results || !Array.isArray(results)) {
      console.log("DataForSEO response:", JSON.stringify(response, null, 2).slice(0, 500));
      return [];
    }

    return results.map((item) => ({
      keyword: item.keyword,
      volume: item.search_volume || 0,
      difficulty: item.keyword_difficulty || 0,
      cpc: item.cpc || 0,
      competition: item.competition || 0,
      intent: item.search_intent?.main || "informational",
      serpFeatures: [],
    }));
  }

  /**
   * Get related keywords/suggestions
   */
  async getKeywordSuggestions(
    seedKeyword: string,
    location: string = "United States",
    limit: number = 100
  ): Promise<KeywordData[]> {
    const locationCode = await this.getLocationCode(location);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.request<any>("/v3/keywords_data/google_ads/keywords_for_keywords/live", [
      {
        keywords: [seedKeyword],
        location_code: locationCode,
        language_code: "en",
        include_seed_keyword: true,
        limit,
      },
    ]);

    // Navigate the response structure
    const task = response?.tasks?.[0];
    if (!task || task.status_code !== 20000) {
      console.error("DataForSEO task failed:", task?.status_message);
      return [];
    }

    // The result array contains keyword data objects directly
    const results = task.result;
    if (!results || !Array.isArray(results) || results.length === 0) {
      return [];
    }

    // Each result item is a keyword data object
    return results.slice(0, limit).map((item: {
      keyword: string;
      search_volume: number;
      keyword_info?: { search_volume: number };
      cpc?: number;
      competition?: number;
      keyword_properties?: { keyword_difficulty?: number };
    }) => ({
      keyword: item.keyword,
      volume: item.search_volume || item.keyword_info?.search_volume || 0,
      difficulty: item.keyword_properties?.keyword_difficulty || 0,
      cpc: item.cpc || 0,
      competition: item.competition || 0,
      intent: "informational",
      serpFeatures: [],
    }));
  }

  /**
   * Analyze SERP for a keyword
   */
  async analyzeSERP(
    keyword: string,
    location: string = "United States"
  ): Promise<SerpAnalysis> {
    const locationCode = await this.getLocationCode(location);

    const response = await this.request<{
      tasks: Array<{
        result: Array<{
          keyword: string;
          total_count: number;
          items: Array<{
            rank_group: number;
            rank_absolute: number;
            url: string;
            title: string;
            description: string;
            domain: string;
          }>;
          item_types: string[];
        }>;
      }>;
    }>("/v3/serp/google/organic/live/regular", [
      {
        keyword,
        location_code: locationCode,
        language_code: "en",
        depth: 20,
      },
    ]);

    const result = response.tasks[0]?.result[0];
    if (!result) {
      throw new Error("No SERP results found");
    }

    const organicResults = result.items
      .filter((item) => item.rank_group <= 10)
      .map((item) => ({
        position: item.rank_group,
        url: item.url,
        title: item.title,
        description: item.description,
        domain: item.domain,
      }));

    return {
      keyword: result.keyword,
      results: organicResults,
      totalResults: result.total_count,
      serpFeatures: result.item_types || [],
      avgWordCount: 0, // Would need to fetch page content
      avgHeadings: 0,
    };
  }

  /**
   * Get competitor keywords
   */
  async getCompetitorKeywords(
    domain: string,
    limit: number = 100
  ): Promise<KeywordData[]> {
    const response = await this.request<{
      tasks: Array<{
        result: Array<{
          items: Array<{
            keyword: string;
            search_volume: number;
            keyword_difficulty: number;
            cpc: number;
            competition: number;
            position: number;
          }>;
        }>;
      }>;
    }>("/v3/dataforseo_labs/google/ranked_keywords/live", [
      {
        target: domain,
        location_code: 2840, // US
        language_code: "en",
        limit,
      },
    ]);

    return response.tasks[0]?.result[0]?.items?.map((item) => ({
      keyword: item.keyword,
      volume: item.search_volume || 0,
      difficulty: item.keyword_difficulty || 0,
      cpc: item.cpc || 0,
      competition: item.competition || 0,
      intent: "informational",
      serpFeatures: [],
    })) || [];
  }

  /**
   * Get keyword gap analysis
   */
  async getKeywordGap(
    yourDomain: string,
    competitorDomains: string[]
  ): Promise<KeywordData[]> {
    const response = await this.request<{
      tasks: Array<{
        result: Array<{
          items: Array<{
            keyword: string;
            search_volume: number;
            keyword_difficulty: number;
            first_domain_position?: number;
            second_domain_position?: number;
          }>;
        }>;
      }>;
    }>("/v3/dataforseo_labs/google/competitors_domain/live", [
      {
        target: yourDomain,
        competitors: competitorDomains,
        location_code: 2840,
        language_code: "en",
        limit: 100,
      },
    ]);

    // Return keywords where competitors rank but you don't
    return response.tasks[0]?.result[0]?.items
      ?.filter((item) => !item.first_domain_position && item.second_domain_position)
      .map((item) => ({
        keyword: item.keyword,
        volume: item.search_volume || 0,
        difficulty: item.keyword_difficulty || 0,
        cpc: 0,
        competition: 0,
        intent: "informational",
        serpFeatures: [],
      })) || [];
  }

  // ============================================
  // BACKLINKS API (Ahrefs alternative)
  // ============================================

  /**
   * Get backlink summary for a domain
   */
  async getBacklinkSummary(target: string): Promise<{
    backlinks: number;
    referringDomains: number;
    referringIps: number;
    domainRank: number;
    brokenBacklinks: number;
    referringDomainsNofollow: number;
    referringDomainsDofollow: number;
  } | null> {
    try {
      const response = await this.request<{
        tasks: Array<{
          result: Array<{
            backlinks: number;
            referring_domains: number;
            referring_ips: number;
            rank: number;
            broken_backlinks: number;
            referring_domains_nofollow: number;
          }>;
        }>;
      }>("/v3/backlinks/summary/live", [{ target }]);

      const result = response.tasks[0]?.result[0];
      if (!result) return null;

      return {
        backlinks: result.backlinks || 0,
        referringDomains: result.referring_domains || 0,
        referringIps: result.referring_ips || 0,
        domainRank: result.rank || 0,
        brokenBacklinks: result.broken_backlinks || 0,
        referringDomainsNofollow: result.referring_domains_nofollow || 0,
        referringDomainsDofollow: result.referring_domains - (result.referring_domains_nofollow || 0),
      };
    } catch (error) {
      console.error("Backlink summary error:", error);
      return null;
    }
  }

  /**
   * Get list of backlinks for a domain
   */
  async getBacklinks(
    target: string,
    options: {
      limit?: number;
      offset?: number;
      orderBy?: "rank" | "date_first_seen" | "date_lost";
      mode?: "as_is" | "one_per_domain" | "one_per_anchor";
    } = {}
  ): Promise<Array<{
    url: string;
    anchor: string;
    domainFrom: string;
    pageFrom: string;
    domainRank: number;
    isNofollow: boolean;
    isLost: boolean;
    firstSeen: string;
    lastSeen: string;
  }>> {
    try {
      const response = await this.request<{
        tasks: Array<{
          result: Array<{
            items: Array<{
              url_to: string;
              anchor: string;
              domain_from: string;
              url_from: string;
              rank: number;
              is_nofollow: boolean;
              is_lost: boolean;
              first_seen: string;
              last_seen: string;
            }>;
          }>;
        }>;
      }>("/v3/backlinks/backlinks/live", [{
        target,
        limit: options.limit || 100,
        offset: options.offset || 0,
        order_by: [`${options.orderBy || "rank"},desc`],
        mode: options.mode || "as_is",
      }]);

      return response.tasks[0]?.result[0]?.items?.map(item => ({
        url: item.url_to,
        anchor: item.anchor,
        domainFrom: item.domain_from,
        pageFrom: item.url_from,
        domainRank: item.rank || 0,
        isNofollow: item.is_nofollow,
        isLost: item.is_lost,
        firstSeen: item.first_seen,
        lastSeen: item.last_seen,
      })) || [];
    } catch (error) {
      console.error("Get backlinks error:", error);
      return [];
    }
  }

  /**
   * Get referring domains for a site
   */
  async getReferringDomains(
    target: string,
    options: { limit?: number } = {}
  ): Promise<Array<{
    domain: string;
    backlinks: number;
    rank: number;
    firstSeen: string;
  }>> {
    try {
      const response = await this.request<{
        tasks: Array<{
          result: Array<{
            items: Array<{
              domain: string;
              backlinks: number;
              rank: number;
              first_seen: string;
            }>;
          }>;
        }>;
      }>("/v3/backlinks/referring_domains/live", [{
        target,
        limit: options.limit || 100,
        order_by: ["rank,desc"],
      }]);

      return response.tasks[0]?.result[0]?.items?.map(item => ({
        domain: item.domain,
        backlinks: item.backlinks,
        rank: item.rank || 0,
        firstSeen: item.first_seen,
      })) || [];
    } catch (error) {
      console.error("Get referring domains error:", error);
      return [];
    }
  }

  /**
   * Get new and lost backlinks
   */
  async getBacklinkChanges(
    target: string,
    dateFrom: string, // YYYY-MM-DD
    dateTo: string
  ): Promise<{
    newBacklinks: number;
    lostBacklinks: number;
    newReferringDomains: number;
    lostReferringDomains: number;
  }> {
    try {
      const response = await this.request<{
        tasks: Array<{
          result: Array<{
            new_backlinks: number;
            lost_backlinks: number;
            new_referring_domains: number;
            lost_referring_domains: number;
          }>;
        }>;
      }>("/v3/backlinks/history/live", [{
        target,
        date_from: dateFrom,
        date_to: dateTo,
      }]);

      const result = response.tasks[0]?.result[0];
      return {
        newBacklinks: result?.new_backlinks || 0,
        lostBacklinks: result?.lost_backlinks || 0,
        newReferringDomains: result?.new_referring_domains || 0,
        lostReferringDomains: result?.lost_referring_domains || 0,
      };
    } catch (error) {
      console.error("Get backlink changes error:", error);
      return {
        newBacklinks: 0,
        lostBacklinks: 0,
        newReferringDomains: 0,
        lostReferringDomains: 0,
      };
    }
  }

  /**
   * Get anchor text distribution
   */
  async getAnchorTexts(
    target: string,
    options: { limit?: number } = {}
  ): Promise<Array<{
    anchor: string;
    backlinks: number;
    referringDomains: number;
  }>> {
    try {
      const response = await this.request<{
        tasks: Array<{
          result: Array<{
            items: Array<{
              anchor: string;
              backlinks: number;
              referring_domains: number;
            }>;
          }>;
        }>;
      }>("/v3/backlinks/anchors/live", [{
        target,
        limit: options.limit || 50,
        order_by: ["backlinks,desc"],
      }]);

      return response.tasks[0]?.result[0]?.items?.map(item => ({
        anchor: item.anchor,
        backlinks: item.backlinks,
        referringDomains: item.referring_domains,
      })) || [];
    } catch (error) {
      console.error("Get anchor texts error:", error);
      return [];
    }
  }

  /**
   * Compare backlink profiles (link gap analysis)
   */
  async getBacklinkGap(
    yourDomain: string,
    competitorDomains: string[]
  ): Promise<Array<{
    domain: string;
    linksToCompetitors: number;
    linksToYou: boolean;
    rank: number;
  }>> {
    try {
      // Get referring domains for each
      const [yourDomains, ...competitorRefDomains] = await Promise.all([
        this.getReferringDomains(yourDomain, { limit: 500 }),
        ...competitorDomains.map(d => this.getReferringDomains(d, { limit: 500 })),
      ]);

      const yourDomainSet = new Set(yourDomains.map(d => d.domain));
      const gapDomains = new Map<string, { count: number; rank: number }>();

      // Find domains that link to competitors but not to you
      for (const refDomains of competitorRefDomains) {
        for (const ref of refDomains) {
          if (!yourDomainSet.has(ref.domain)) {
            const existing = gapDomains.get(ref.domain);
            if (existing) {
              existing.count++;
              existing.rank = Math.max(existing.rank, ref.rank);
            } else {
              gapDomains.set(ref.domain, { count: 1, rank: ref.rank });
            }
          }
        }
      }

      return Array.from(gapDomains.entries())
        .map(([domain, data]) => ({
          domain,
          linksToCompetitors: data.count,
          linksToYou: false,
          rank: data.rank,
        }))
        .sort((a, b) => b.rank - a.rank)
        .slice(0, 100);
    } catch (error) {
      console.error("Get backlink gap error:", error);
      return [];
    }
  }

  // Helper methods
  private async getLocationCode(location: string): Promise<number> {
    // Map common locations to codes
    const locations: Record<string, number> = {
      "United States": 2840,
      "United Kingdom": 2826,
      "Canada": 2124,
      "Australia": 2036,
      "Germany": 2276,
      "France": 2250,
      "India": 2356,
    };
    return locations[location] || 2840;
  }

  private async getLanguageCode(language: string): Promise<string> {
    const languages: Record<string, string> = {
      en: "en",
      es: "es",
      fr: "fr",
      de: "de",
      it: "it",
      pt: "pt",
    };
    return languages[language] || "en";
  }
}

// Export singleton instance
export const dataForSEO = new DataForSEOClient();

