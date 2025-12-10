/**
 * SerpAPI Client
 * Alternative to DataForSEO for SERP data
 * 
 * Supports: Google, Bing, YouTube, Amazon, etc.
 * API Reference: https://serpapi.com/search-api
 */

interface SerpAPIConfig {
  apiKey?: string;
}

interface SerpAPISearchParams {
  q: string;              // Search query
  location?: string;      // e.g., "Austin, Texas, United States"
  hl?: string;            // Language, e.g., "en"
  gl?: string;            // Country, e.g., "us"
  google_domain?: string; // e.g., "google.com"
  num?: number;           // Number of results (max 100)
  start?: number;         // Pagination offset
  safe?: "active" | "off";
  device?: "desktop" | "tablet" | "mobile";
}

interface OrganicResult {
  position: number;
  title: string;
  link: string;
  displayed_link: string;
  snippet: string;
  snippet_highlighted_words?: string[];
  date?: string;
  rich_snippet?: {
    top?: { detected_extensions?: Record<string, unknown> };
    bottom?: { detected_extensions?: Record<string, unknown> };
  };
  about_this_result?: {
    source?: { description?: string };
    keywords?: string[];
    languages?: string[];
    regions?: string[];
  };
}

interface PeopleAlsoAsk {
  question: string;
  snippet?: string;
  title?: string;
  link?: string;
}

interface RelatedSearch {
  query: string;
  link: string;
}

interface LocalResult {
  position: number;
  title: string;
  place_id?: string;
  address?: string;
  phone?: string;
  rating?: number;
  reviews?: number;
  type?: string;
  thumbnail?: string;
  gps_coordinates?: { latitude: number; longitude: number };
}

interface KnowledgeGraph {
  title?: string;
  type?: string;
  description?: string;
  source?: { name: string; link: string };
  image?: string;
}

interface SerpAPIResponse {
  search_metadata: {
    id: string;
    status: string;
    json_endpoint: string;
    created_at: string;
    processed_at: string;
    total_time_taken: number;
  };
  search_parameters: Record<string, string>;
  search_information: {
    organic_results_state: string;
    query_displayed: string;
    total_results?: number;
    time_taken_displayed?: number;
    menu_items?: Array<{ title: string; link: string }>;
  };
  organic_results?: OrganicResult[];
  people_also_ask?: PeopleAlsoAsk[];
  related_searches?: RelatedSearch[];
  local_results?: { places: LocalResult[] };
  knowledge_graph?: KnowledgeGraph;
  ads?: Array<{
    position: number;
    title: string;
    link: string;
    displayed_link: string;
    description: string;
  }>;
}

interface AutocompleteResult {
  value: string;
  type?: string;
  relevance?: number;
}

interface RelatedKeywordsResult {
  keyword: string;
  volume?: number;
  cpc?: number;
  competition?: number;
}

export class SerpAPIClient {
  private apiKey: string;
  private baseUrl = "https://serpapi.com";

  constructor(config?: SerpAPIConfig) {
    this.apiKey = config?.apiKey || process.env.SERPAPI_KEY || "";
  }

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Make request to SerpAPI
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, string | number | undefined>
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error("SerpAPI key not configured");
    }

    const searchParams = new URLSearchParams();
    searchParams.set("api_key", this.apiKey);
    searchParams.set("output", "json");
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    }

    const response = await fetch(`${this.baseUrl}${endpoint}?${searchParams.toString()}`);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SerpAPI error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Search Google and get SERP data
   */
  async searchGoogle(params: SerpAPISearchParams): Promise<SerpAPIResponse> {
    return this.request<SerpAPIResponse>("/search", {
      engine: "google",
      ...params,
    });
  }

  /**
   * Get Google autocomplete suggestions
   */
  async getAutocompleteSuggestions(
    query: string,
    options: { hl?: string; gl?: string } = {}
  ): Promise<AutocompleteResult[]> {
    const response = await this.request<{ suggestions: AutocompleteResult[] }>(
      "/search",
      {
        engine: "google_autocomplete",
        q: query,
        ...options,
      }
    );
    return response.suggestions || [];
  }

  /**
   * Search Google Trends
   */
  async searchTrends(
    query: string,
    options: {
      date?: string;      // e.g., "today 12-m" for last 12 months
      geo?: string;       // e.g., "US"
      data_type?: "TIMESERIES" | "GEO_MAP" | "RELATED_TOPICS" | "RELATED_QUERIES";
    } = {}
  ): Promise<unknown> {
    return this.request("/search", {
      engine: "google_trends",
      q: query,
      ...options,
    });
  }

  /**
   * Search YouTube
   */
  async searchYouTube(
    query: string,
    options: {
      gl?: string;
      hl?: string;
    } = {}
  ): Promise<{
    video_results: Array<{
      position: number;
      title: string;
      link: string;
      channel: { name: string; link: string };
      published_date?: string;
      views?: number;
      length?: string;
      description?: string;
      thumbnail: { static: string };
    }>;
  }> {
    return this.request("/search", {
      engine: "youtube",
      search_query: query,
      ...options,
    });
  }

  // ===============================
  // CabbageSEO Convenience Methods
  // ===============================

  /**
   * Get comprehensive SERP analysis for a keyword
   */
  async analyzeSERP(
    keyword: string,
    options: {
      location?: string;
      language?: string;
      country?: string;
      numResults?: number;
    } = {}
  ): Promise<{
    keyword: string;
    totalResults: number;
    organicResults: Array<{
      position: number;
      url: string;
      title: string;
      description: string;
      domain: string;
    }>;
    peopleAlsoAsk: string[];
    relatedSearches: string[];
    serpFeatures: string[];
    hasLocalPack: boolean;
    hasKnowledgeGraph: boolean;
    hasAds: boolean;
  }> {
    const response = await this.searchGoogle({
      q: keyword,
      location: options.location || "United States",
      hl: options.language || "en",
      gl: options.country || "us",
      num: options.numResults || 10,
    });

    // Detect SERP features
    const serpFeatures: string[] = [];
    if (response.people_also_ask?.length) serpFeatures.push("People Also Ask");
    if (response.related_searches?.length) serpFeatures.push("Related Searches");
    if (response.local_results?.places?.length) serpFeatures.push("Local Pack");
    if (response.knowledge_graph) serpFeatures.push("Knowledge Graph");
    if (response.ads?.length) serpFeatures.push("Ads");

    return {
      keyword,
      totalResults: response.search_information.total_results || 0,
      organicResults: (response.organic_results || []).map(r => ({
        position: r.position,
        url: r.link,
        title: r.title,
        description: r.snippet,
        domain: new URL(r.link).hostname,
      })),
      peopleAlsoAsk: (response.people_also_ask || []).map(p => p.question),
      relatedSearches: (response.related_searches || []).map(r => r.query),
      serpFeatures,
      hasLocalPack: Boolean(response.local_results?.places?.length),
      hasKnowledgeGraph: Boolean(response.knowledge_graph),
      hasAds: Boolean(response.ads?.length),
    };
  }

  /**
   * Get keyword suggestions from autocomplete
   */
  async getKeywordSuggestions(
    seedKeyword: string,
    options: {
      modifiers?: string[];  // e.g., ["how to", "what is", "best"]
      language?: string;
      country?: string;
    } = {}
  ): Promise<string[]> {
    const suggestions: Set<string> = new Set();
    
    // Get base autocomplete
    const baseSuggestions = await this.getAutocompleteSuggestions(seedKeyword, {
      hl: options.language || "en",
      gl: options.country || "us",
    });
    baseSuggestions.forEach(s => suggestions.add(s.value));

    // Get suggestions with modifiers
    const modifiers = options.modifiers || ["how to", "what is", "best", "vs"];
    
    for (const modifier of modifiers) {
      try {
        const modifiedSuggestions = await this.getAutocompleteSuggestions(
          `${modifier} ${seedKeyword}`,
          { hl: options.language || "en", gl: options.country || "us" }
        );
        modifiedSuggestions.forEach(s => suggestions.add(s.value));
      } catch (error) {
        // Continue if one modifier fails
        console.warn(`Failed to get suggestions for "${modifier} ${seedKeyword}":`, error);
      }
    }

    // Get alphabet soup suggestions (a-z)
    const letters = "abcdefghijklmnopqrstuvwxyz".split("");
    for (const letter of letters.slice(0, 5)) { // Limit to first 5 to save API calls
      try {
        const letterSuggestions = await this.getAutocompleteSuggestions(
          `${seedKeyword} ${letter}`,
          { hl: options.language || "en", gl: options.country || "us" }
        );
        letterSuggestions.forEach(s => suggestions.add(s.value));
      } catch (error) {
        // Continue if one letter fails
      }
    }

    return Array.from(suggestions);
  }

  /**
   * Get competitor analysis from SERP
   */
  async analyzeCompetitors(
    keyword: string,
    options: { location?: string; numResults?: number } = {}
  ): Promise<{
    keyword: string;
    competitors: Array<{
      domain: string;
      url: string;
      title: string;
      position: number;
    }>;
    dominantDomains: Array<{ domain: string; count: number }>;
    avgTitleLength: number;
    avgDescriptionLength: number;
  }> {
    const response = await this.searchGoogle({
      q: keyword,
      location: options.location || "United States",
      num: options.numResults || 20,
    });

    const organicResults = response.organic_results || [];
    
    // Count domain occurrences
    const domainCounts = new Map<string, number>();
    organicResults.forEach(r => {
      const domain = new URL(r.link).hostname;
      domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
    });

    // Calculate averages
    const avgTitleLength = organicResults.length > 0
      ? organicResults.reduce((sum, r) => sum + r.title.length, 0) / organicResults.length
      : 0;
    const avgDescriptionLength = organicResults.length > 0
      ? organicResults.reduce((sum, r) => sum + r.snippet.length, 0) / organicResults.length
      : 0;

    return {
      keyword,
      competitors: organicResults.map(r => ({
        domain: new URL(r.link).hostname,
        url: r.link,
        title: r.title,
        position: r.position,
      })),
      dominantDomains: Array.from(domainCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([domain, count]) => ({ domain, count })),
      avgTitleLength: Math.round(avgTitleLength),
      avgDescriptionLength: Math.round(avgDescriptionLength),
    };
  }

  /**
   * Get "People Also Ask" questions for content ideas
   */
  async getQuestions(
    keyword: string,
    options: { location?: string } = {}
  ): Promise<string[]> {
    const response = await this.searchGoogle({
      q: keyword,
      location: options.location || "United States",
    });

    return (response.people_also_ask || []).map(p => p.question);
  }

  /**
   * Check current ranking for a domain
   */
  async checkRanking(
    keyword: string,
    domain: string,
    options: { location?: string; maxResults?: number } = {}
  ): Promise<{
    keyword: string;
    domain: string;
    ranking: number | null;
    url: string | null;
    title: string | null;
  }> {
    const response = await this.searchGoogle({
      q: keyword,
      location: options.location || "United States",
      num: options.maxResults || 100,
    });

    const normalizedDomain = domain.replace(/^www\./, "").toLowerCase();
    
    for (const result of response.organic_results || []) {
      const resultDomain = new URL(result.link).hostname.replace(/^www\./, "").toLowerCase();
      
      if (resultDomain === normalizedDomain || resultDomain.endsWith(`.${normalizedDomain}`)) {
        return {
          keyword,
          domain,
          ranking: result.position,
          url: result.link,
          title: result.title,
        };
      }
    }

    return {
      keyword,
      domain,
      ranking: null,
      url: null,
      title: null,
    };
  }

  /**
   * Test the connection
   */
  async testConnection(): Promise<{ success: boolean; accountInfo?: unknown; error?: string }> {
    try {
      const response = await this.request<{ account_id: string }>("/account", {});
      return { success: true, accountInfo: response };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }
}

// Export singleton instance
export const serpapi = new SerpAPIClient();

