/**
 * Google Search Console API Client
 * 
 * Used for:
 * - Real ranking data
 * - Click/impression data
 * - Index coverage
 * - URL inspection
 */

interface GSCConfig {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
}

interface SearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface SearchAnalyticsResponse {
  rows: SearchAnalyticsRow[];
  responseAggregationType: string;
}

interface IndexStatus {
  url: string;
  coverageState: "Submitted and indexed" | "Crawled - currently not indexed" | "Discovered - currently not indexed" | "URL is unknown to Google";
  lastCrawlTime?: string;
  pageFetchState?: string;
  robotsTxtState?: string;
  indexingState?: string;
}

export class GSCClient {
  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config?: GSCConfig) {
    this.clientId = config?.clientId || process.env.GOOGLE_CLIENT_ID || "";
    this.clientSecret = config?.clientSecret || process.env.GOOGLE_CLIENT_SECRET || "";
    this.refreshToken = config?.refreshToken || "";
  }

  /**
   * Set credentials for a specific site
   */
  setCredentials(refreshToken: string) {
    this.refreshToken = refreshToken;
    this.accessToken = null;
  }

  /**
   * Get a valid access token
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.refreshToken) {
      throw new Error("GSC refresh token not configured");
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh GSC token: ${response.status}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

    return this.accessToken!;
  }

  /**
   * Make authenticated request to GSC API
   */
  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" = "GET",
    body?: unknown
  ): Promise<T> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3${endpoint}`,
      {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GSC API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get list of sites the user has access to
   */
  async getSites(): Promise<Array<{ siteUrl: string; permissionLevel: string }>> {
    const response = await this.request<{
      siteEntry: Array<{ siteUrl: string; permissionLevel: string }>;
    }>("/sites");

    return response.siteEntry || [];
  }

  /**
   * Get search analytics data
   */
  async getSearchAnalytics(params: {
    siteUrl: string;
    startDate: string; // YYYY-MM-DD
    endDate: string;
    dimensions?: ("query" | "page" | "country" | "device" | "date")[];
    rowLimit?: number;
    startRow?: number;
    dimensionFilterGroups?: Array<{
      filters: Array<{
        dimension: string;
        operator: "equals" | "contains" | "notContains";
        expression: string;
      }>;
    }>;
  }): Promise<SearchAnalyticsRow[]> {
    const response = await this.request<SearchAnalyticsResponse>(
      `/sites/${encodeURIComponent(params.siteUrl)}/searchAnalytics/query`,
      "POST",
      {
        startDate: params.startDate,
        endDate: params.endDate,
        dimensions: params.dimensions || ["query"],
        rowLimit: params.rowLimit || 1000,
        startRow: params.startRow || 0,
        dimensionFilterGroups: params.dimensionFilterGroups,
      }
    );

    return response.rows || [];
  }

  /**
   * Get top performing keywords
   */
  async getTopKeywords(
    siteUrl: string,
    days: number = 28,
    limit: number = 100
  ): Promise<Array<{
    keyword: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const rows = await this.getSearchAnalytics({
      siteUrl,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      dimensions: ["query"],
      rowLimit: limit,
    });

    return rows.map((row) => ({
      keyword: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));
  }

  /**
   * Get top performing pages
   */
  async getTopPages(
    siteUrl: string,
    days: number = 28,
    limit: number = 100
  ): Promise<Array<{
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const rows = await this.getSearchAnalytics({
      siteUrl,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      dimensions: ["page"],
      rowLimit: limit,
    });

    return rows.map((row) => ({
      page: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));
  }

  /**
   * Get keyword rankings over time
   */
  async getKeywordHistory(
    siteUrl: string,
    keyword: string,
    days: number = 90
  ): Promise<Array<{
    date: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const rows = await this.getSearchAnalytics({
      siteUrl,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      dimensions: ["date"],
      dimensionFilterGroups: [
        {
          filters: [
            {
              dimension: "query",
              operator: "equals",
              expression: keyword,
            },
          ],
        },
      ],
    });

    return rows.map((row) => ({
      date: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));
  }

  /**
   * Get declining keywords (content decay detection)
   */
  async getDecliningKeywords(
    siteUrl: string,
    comparisonDays: number = 28
  ): Promise<Array<{
    keyword: string;
    currentPosition: number;
    previousPosition: number;
    positionChange: number;
    impressionChange: number;
  }>> {
    const now = new Date();
    
    // Current period
    const currentEnd = now.toISOString().split("T")[0];
    const currentStart = new Date(now.getTime() - comparisonDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    
    // Previous period
    const previousEnd = currentStart;
    const previousStart = new Date(now.getTime() - comparisonDays * 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const [currentData, previousData] = await Promise.all([
      this.getSearchAnalytics({
        siteUrl,
        startDate: currentStart,
        endDate: currentEnd,
        dimensions: ["query"],
        rowLimit: 500,
      }),
      this.getSearchAnalytics({
        siteUrl,
        startDate: previousStart,
        endDate: previousEnd,
        dimensions: ["query"],
        rowLimit: 500,
      }),
    ]);

    // Create maps for comparison
    const currentMap = new Map(currentData.map((r) => [r.keys[0], r]));
    const previousMap = new Map(previousData.map((r) => [r.keys[0], r]));

    // Find declining keywords
    const declining: Array<{
      keyword: string;
      currentPosition: number;
      previousPosition: number;
      positionChange: number;
      impressionChange: number;
    }> = [];

    for (const [keyword, current] of currentMap) {
      const previous = previousMap.get(keyword);
      if (previous) {
        const positionChange = current.position - previous.position;
        const impressionChange = 
          ((current.impressions - previous.impressions) / previous.impressions) * 100;

        // Position increased (worse) or impressions dropped significantly
        if (positionChange > 3 || impressionChange < -20) {
          declining.push({
            keyword,
            currentPosition: current.position,
            previousPosition: previous.position,
            positionChange,
            impressionChange,
          });
        }
      }
    }

    // Sort by position change (worst first)
    return declining.sort((a, b) => b.positionChange - a.positionChange);
  }

  /**
   * Inspect URL (check index status)
   */
  async inspectUrl(siteUrl: string, url: string): Promise<IndexStatus> {
    const token = await this.getAccessToken();

    const response = await fetch(
      "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inspectionUrl: url,
          siteUrl,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`URL inspection failed: ${response.status}`);
    }

    const data = await response.json();
    const result = data.inspectionResult?.indexStatusResult;

    return {
      url,
      coverageState: result?.coverageState || "URL is unknown to Google",
      lastCrawlTime: result?.lastCrawlTime,
      pageFetchState: result?.pageFetchState,
      robotsTxtState: result?.robotsTxtState,
      indexingState: result?.indexingState,
    };
  }
}

// Singleton instance
let gscInstance: GSCClient | null = null;

export function getGSC(): GSCClient {
  if (!gscInstance) {
    gscInstance = new GSCClient();
  }
  return gscInstance;
}

export const gsc = { getClient: getGSC };

