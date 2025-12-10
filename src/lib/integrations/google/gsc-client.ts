/**
 * Google Search Console API Client
 * 
 * Fetches real search analytics data from GSC
 */

import { googleOAuth } from "./oauth";

const GSC_API_BASE = "https://www.googleapis.com/webmasters/v3";
const SEARCH_ANALYTICS_API = "https://searchconsole.googleapis.com/v1";

export interface GSCQuery {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCPage {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCSearchAnalytics {
  rows: Array<{
    keys: string[];
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  responseAggregationType: string;
}

export interface GSCSite {
  siteUrl: string;
  permissionLevel: string;
}

export interface DateRange {
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
}

export class GSCClient {
  private organizationId: string;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
  }

  /**
   * Get access token for API calls
   */
  private async getToken(): Promise<string> {
    const token = await googleOAuth.getValidAccessToken(this.organizationId);
    if (!token) {
      throw new Error("Google Search Console not connected. Please connect your account.");
    }
    return token;
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getToken();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("GSC API error:", error);
      
      if (response.status === 401) {
        throw new Error("Google authentication expired. Please reconnect.");
      }
      if (response.status === 403) {
        throw new Error("Access denied to Search Console. Check permissions.");
      }
      
      throw new Error(`GSC API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * List all sites the user has access to
   */
  async listSites(): Promise<GSCSite[]> {
    const data = await this.request<{ siteEntry: GSCSite[] }>(
      `${GSC_API_BASE}/sites`
    );
    return data.siteEntry || [];
  }

  /**
   * Get search analytics data
   */
  async getSearchAnalytics(
    siteUrl: string,
    options: {
      startDate: string;
      endDate: string;
      dimensions?: ("query" | "page" | "country" | "device" | "date")[];
      rowLimit?: number;
      startRow?: number;
      dimensionFilterGroups?: Array<{
        filters: Array<{
          dimension: string;
          expression: string;
          operator?: "equals" | "contains" | "notContains";
        }>;
      }>;
    }
  ): Promise<GSCSearchAnalytics> {
    const body = {
      startDate: options.startDate,
      endDate: options.endDate,
      dimensions: options.dimensions || ["query"],
      rowLimit: options.rowLimit || 1000,
      startRow: options.startRow || 0,
      dimensionFilterGroups: options.dimensionFilterGroups,
    };

    return this.request<GSCSearchAnalytics>(
      `${SEARCH_ANALYTICS_API}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
  }

  /**
   * Get top queries for a site
   */
  async getTopQueries(
    siteUrl: string,
    dateRange: DateRange,
    limit: number = 100
  ): Promise<GSCQuery[]> {
    const data = await this.getSearchAnalytics(siteUrl, {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      dimensions: ["query"],
      rowLimit: limit,
    });

    return (data.rows || []).map(row => ({
      keys: row.keys,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));
  }

  /**
   * Get top pages for a site
   */
  async getTopPages(
    siteUrl: string,
    dateRange: DateRange,
    limit: number = 100
  ): Promise<GSCPage[]> {
    const data = await this.getSearchAnalytics(siteUrl, {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      dimensions: ["page"],
      rowLimit: limit,
    });

    return (data.rows || []).map(row => ({
      keys: row.keys,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));
  }

  /**
   * Get queries for a specific page
   */
  async getQueriesForPage(
    siteUrl: string,
    pageUrl: string,
    dateRange: DateRange,
    limit: number = 100
  ): Promise<GSCQuery[]> {
    const data = await this.getSearchAnalytics(siteUrl, {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      dimensions: ["query"],
      rowLimit: limit,
      dimensionFilterGroups: [{
        filters: [{
          dimension: "page",
          expression: pageUrl,
          operator: "equals",
        }],
      }],
    });

    return (data.rows || []).map(row => ({
      keys: row.keys,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));
  }

  /**
   * Get performance over time
   */
  async getPerformanceOverTime(
    siteUrl: string,
    dateRange: DateRange
  ): Promise<Array<{
    date: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>> {
    const data = await this.getSearchAnalytics(siteUrl, {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      dimensions: ["date"],
      rowLimit: 1000,
    });

    return (data.rows || []).map(row => ({
      date: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get country breakdown
   */
  async getCountryBreakdown(
    siteUrl: string,
    dateRange: DateRange,
    limit: number = 20
  ): Promise<Array<{
    country: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>> {
    const data = await this.getSearchAnalytics(siteUrl, {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      dimensions: ["country"],
      rowLimit: limit,
    });

    return (data.rows || []).map(row => ({
      country: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));
  }

  /**
   * Get device breakdown
   */
  async getDeviceBreakdown(
    siteUrl: string,
    dateRange: DateRange
  ): Promise<Array<{
    device: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>> {
    const data = await this.getSearchAnalytics(siteUrl, {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      dimensions: ["device"],
      rowLimit: 10,
    });

    return (data.rows || []).map(row => ({
      device: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));
  }

  /**
   * Get "Quick Win" opportunities (high impressions, low CTR, position 5-20)
   */
  async getQuickWinOpportunities(
    siteUrl: string,
    dateRange: DateRange,
    limit: number = 50
  ): Promise<Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    opportunity: "high" | "medium" | "low";
  }>> {
    const data = await this.getSearchAnalytics(siteUrl, {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      dimensions: ["query"],
      rowLimit: 500,  // Fetch more to filter
    });

    // Filter for quick wins: position 5-20, high impressions, low CTR
    const quickWins = (data.rows || [])
      .filter(row => 
        row.position >= 5 && 
        row.position <= 20 && 
        row.impressions >= 100
      )
      .map(row => ({
        query: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
        opportunity: this.calculateOpportunity(row.impressions, row.position, row.ctr),
      }))
      .sort((a, b) => {
        // Sort by opportunity score
        const scoreA = a.impressions * (1 / a.position) * (1 - a.ctr);
        const scoreB = b.impressions * (1 / b.position) * (1 - b.ctr);
        return scoreB - scoreA;
      })
      .slice(0, limit);

    return quickWins;
  }

  private calculateOpportunity(
    impressions: number, 
    position: number, 
    ctr: number
  ): "high" | "medium" | "low" {
    const score = impressions * (1 / position) * (1 - ctr);
    if (score > 100) return "high";
    if (score > 30) return "medium";
    return "low";
  }

  /**
   * Get summary stats for a date range
   */
  async getSummaryStats(
    siteUrl: string,
    dateRange: DateRange
  ): Promise<{
    totalClicks: number;
    totalImpressions: number;
    avgCtr: number;
    avgPosition: number;
  }> {
    const data = await this.getSearchAnalytics(siteUrl, {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      dimensions: ["date"],
      rowLimit: 1000,
    });

    const rows = data.rows || [];
    
    if (rows.length === 0) {
      return {
        totalClicks: 0,
        totalImpressions: 0,
        avgCtr: 0,
        avgPosition: 0,
      };
    }

    const totalClicks = rows.reduce((sum, r) => sum + r.clicks, 0);
    const totalImpressions = rows.reduce((sum, r) => sum + r.impressions, 0);
    const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
    const avgPosition = rows.reduce((sum, r) => sum + r.position, 0) / rows.length;

    return {
      totalClicks,
      totalImpressions,
      avgCtr,
      avgPosition,
    };
  }
}

// Factory function
export function createGSCClient(organizationId: string): GSCClient {
  return new GSCClient(organizationId);
}

