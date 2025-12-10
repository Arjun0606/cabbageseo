/**
 * Ahrefs API Client
 * https://ahrefs.com/api
 * 
 * Used for:
 * - Backlink analysis
 * - Domain authority
 * - Competitor research
 * - Keyword difficulty (alternative to DataForSEO)
 */

interface AhrefsConfig {
  apiKey?: string;
}

interface BacklinkData {
  url: string;
  domainRating: number;
  urlRating: number;
  backlinks: number;
  referringDomains: number;
  dofollow: number;
  nofollow: number;
}

interface KeywordData {
  keyword: string;
  volume: number;
  difficulty: number;
  cpc: number;
  clicks: number;
  clicksPerSearch: number;
  returnRate: number;
}

interface CompetitorData {
  domain: string;
  domainRating: number;
  traffic: number;
  keywords: number;
  backlinks: number;
}

export class AhrefsClient {
  private apiKey: string;
  private baseUrl: string = "https://api.ahrefs.com/v3";

  constructor(config?: AhrefsConfig) {
    this.apiKey = config?.apiKey || process.env.AHREFS_API_KEY || "";
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    if (!this.apiKey) {
      throw new Error("AHREFS_API_KEY is not configured");
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString(), {
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Ahrefs API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get domain overview metrics
   */
  async getDomainOverview(domain: string): Promise<BacklinkData> {
    const response = await this.request<{
      domain_rating: number;
      url_rating: number;
      backlinks: number;
      refdomains: number;
      dofollow: number;
      nofollow: number;
    }>("/site-explorer/overview", {
      target: domain,
      mode: "domain",
    });

    return {
      url: domain,
      domainRating: response.domain_rating,
      urlRating: response.url_rating,
      backlinks: response.backlinks,
      referringDomains: response.refdomains,
      dofollow: response.dofollow,
      nofollow: response.nofollow,
    };
  }

  /**
   * Get keyword metrics
   */
  async getKeywordMetrics(
    keywords: string[],
    country: string = "us"
  ): Promise<KeywordData[]> {
    const response = await this.request<{
      keywords: Array<{
        keyword: string;
        volume: number;
        difficulty: number;
        cpc: number;
        clicks: number;
        clicks_per_search: number;
        return_rate: number;
      }>;
    }>("/keywords-explorer/metrics", {
      keywords: keywords.join(","),
      country,
    });

    return response.keywords.map((kw) => ({
      keyword: kw.keyword,
      volume: kw.volume,
      difficulty: kw.difficulty,
      cpc: kw.cpc,
      clicks: kw.clicks,
      clicksPerSearch: kw.clicks_per_search,
      returnRate: kw.return_rate,
    }));
  }

  /**
   * Get organic competitors
   */
  async getOrganicCompetitors(domain: string, limit: number = 10): Promise<CompetitorData[]> {
    const response = await this.request<{
      competitors: Array<{
        domain: string;
        domain_rating: number;
        organic_traffic: number;
        organic_keywords: number;
        backlinks: number;
      }>;
    }>("/site-explorer/competitors", {
      target: domain,
      mode: "domain",
      limit: limit.toString(),
    });

    return response.competitors.map((comp) => ({
      domain: comp.domain,
      domainRating: comp.domain_rating,
      traffic: comp.organic_traffic,
      keywords: comp.organic_keywords,
      backlinks: comp.backlinks,
    }));
  }

  /**
   * Get content gap (keywords competitors rank for but you don't)
   */
  async getContentGap(
    yourDomain: string,
    competitors: string[]
  ): Promise<KeywordData[]> {
    const response = await this.request<{
      keywords: Array<{
        keyword: string;
        volume: number;
        difficulty: number;
        cpc: number;
        clicks: number;
        clicks_per_search: number;
        return_rate: number;
      }>;
    }>("/keywords-explorer/content-gap", {
      target: yourDomain,
      competitors: competitors.join(","),
    });

    return response.keywords.map((kw) => ({
      keyword: kw.keyword,
      volume: kw.volume,
      difficulty: kw.difficulty,
      cpc: kw.cpc,
      clicks: kw.clicks,
      clicksPerSearch: kw.clicks_per_search,
      returnRate: kw.return_rate,
    }));
  }

  /**
   * Get backlink opportunities
   */
  async getBacklinkOpportunities(domain: string): Promise<Array<{
    url: string;
    domainRating: number;
    traffic: number;
    linkType: string;
  }>> {
    const response = await this.request<{
      backlinks: Array<{
        url_from: string;
        domain_rating: number;
        traffic: number;
        link_type: string;
      }>;
    }>("/site-explorer/backlinks", {
      target: domain,
      mode: "domain",
      limit: "100",
    });

    return response.backlinks.map((bl) => ({
      url: bl.url_from,
      domainRating: bl.domain_rating,
      traffic: bl.traffic,
      linkType: bl.link_type,
    }));
  }
}

// Singleton instance
let ahrefsInstance: AhrefsClient | null = null;

export function getAhrefs(): AhrefsClient {
  if (!ahrefsInstance) {
    ahrefsInstance = new AhrefsClient();
  }
  return ahrefsInstance;
}

export const ahrefs = { getClient: getAhrefs };

