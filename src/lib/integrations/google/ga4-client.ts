/**
 * Google Analytics 4 Data API Client
 * 
 * Fetches real analytics data from GA4
 */

import { googleOAuth } from "./oauth";

const GA4_API_BASE = "https://analyticsdata.googleapis.com/v1beta";
const GA4_ADMIN_API = "https://analyticsadmin.googleapis.com/v1beta";

export interface GA4Property {
  name: string;           // "properties/123456789"
  displayName: string;
  propertyType: string;
  createTime: string;
}

export interface GA4Metric {
  name: string;
  value: string;
}

export interface GA4Dimension {
  name: string;
  value: string;
}

export interface GA4Row {
  dimensionValues: Array<{ value: string }>;
  metricValues: Array<{ value: string }>;
}

export interface GA4ReportResponse {
  dimensionHeaders: Array<{ name: string }>;
  metricHeaders: Array<{ name: string; type: string }>;
  rows: GA4Row[];
  rowCount: number;
  metadata?: {
    currencyCode: string;
    timeZone: string;
  };
}

export interface DateRange {
  startDate: string;  // YYYY-MM-DD or "7daysAgo", "30daysAgo", etc.
  endDate: string;    // YYYY-MM-DD or "today", "yesterday"
}

export class GA4Client {
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
      throw new Error("Google Analytics not connected. Please connect your account.");
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
      console.error("GA4 API error:", error);
      
      if (response.status === 401) {
        throw new Error("Google authentication expired. Please reconnect.");
      }
      if (response.status === 403) {
        throw new Error("Access denied to Google Analytics. Check permissions.");
      }
      
      throw new Error(`GA4 API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * List all GA4 properties the user has access to
   */
  async listProperties(): Promise<GA4Property[]> {
    const data = await this.request<{ properties: GA4Property[] }>(
      `${GA4_ADMIN_API}/properties`
    );
    return data.properties || [];
  }

  /**
   * Run a GA4 report
   */
  async runReport(
    propertyId: string,
    options: {
      dateRanges: DateRange[];
      dimensions?: string[];
      metrics: string[];
      limit?: number;
      offset?: number;
      orderBys?: Array<{
        dimension?: { dimensionName: string; orderType?: "ALPHANUMERIC" | "CASE_INSENSITIVE_ALPHANUMERIC" | "NUMERIC" };
        metric?: { metricName: string };
        desc?: boolean;
      }>;
      dimensionFilter?: object;
      metricFilter?: object;
    }
  ): Promise<GA4ReportResponse> {
    // Ensure property ID is in correct format
    const propertyPath = propertyId.startsWith("properties/") 
      ? propertyId 
      : `properties/${propertyId}`;

    const body = {
      dateRanges: options.dateRanges,
      dimensions: (options.dimensions || []).map(d => ({ name: d })),
      metrics: options.metrics.map(m => ({ name: m })),
      limit: options.limit || 10000,
      offset: options.offset || 0,
      orderBys: options.orderBys,
      dimensionFilter: options.dimensionFilter,
      metricFilter: options.metricFilter,
    };

    return this.request<GA4ReportResponse>(
      `${GA4_API_BASE}/${propertyPath}:runReport`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
  }

  /**
   * Get website traffic overview
   */
  async getTrafficOverview(
    propertyId: string,
    dateRange: DateRange
  ): Promise<{
    users: number;
    newUsers: number;
    sessions: number;
    pageviews: number;
    avgSessionDuration: number;
    bounceRate: number;
  }> {
    const report = await this.runReport(propertyId, {
      dateRanges: [dateRange],
      metrics: [
        "totalUsers",
        "newUsers",
        "sessions",
        "screenPageViews",
        "averageSessionDuration",
        "bounceRate",
      ],
    });

    const row = report.rows?.[0];
    if (!row) {
      return {
        users: 0,
        newUsers: 0,
        sessions: 0,
        pageviews: 0,
        avgSessionDuration: 0,
        bounceRate: 0,
      };
    }

    return {
      users: parseInt(row.metricValues[0]?.value || "0"),
      newUsers: parseInt(row.metricValues[1]?.value || "0"),
      sessions: parseInt(row.metricValues[2]?.value || "0"),
      pageviews: parseInt(row.metricValues[3]?.value || "0"),
      avgSessionDuration: parseFloat(row.metricValues[4]?.value || "0"),
      bounceRate: parseFloat(row.metricValues[5]?.value || "0"),
    };
  }

  /**
   * Get traffic over time
   */
  async getTrafficOverTime(
    propertyId: string,
    dateRange: DateRange
  ): Promise<Array<{
    date: string;
    users: number;
    sessions: number;
    pageviews: number;
  }>> {
    const report = await this.runReport(propertyId, {
      dateRanges: [dateRange],
      dimensions: ["date"],
      metrics: ["totalUsers", "sessions", "screenPageViews"],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    });

    return (report.rows || []).map(row => ({
      date: row.dimensionValues[0]?.value || "",
      users: parseInt(row.metricValues[0]?.value || "0"),
      sessions: parseInt(row.metricValues[1]?.value || "0"),
      pageviews: parseInt(row.metricValues[2]?.value || "0"),
    }));
  }

  /**
   * Get top pages
   */
  async getTopPages(
    propertyId: string,
    dateRange: DateRange,
    limit: number = 20
  ): Promise<Array<{
    page: string;
    pageTitle: string;
    pageviews: number;
    users: number;
    avgTimeOnPage: number;
  }>> {
    const report = await this.runReport(propertyId, {
      dateRanges: [dateRange],
      dimensions: ["pagePath", "pageTitle"],
      metrics: ["screenPageViews", "totalUsers", "averageSessionDuration"],
      limit,
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    });

    return (report.rows || []).map(row => ({
      page: row.dimensionValues[0]?.value || "",
      pageTitle: row.dimensionValues[1]?.value || "",
      pageviews: parseInt(row.metricValues[0]?.value || "0"),
      users: parseInt(row.metricValues[1]?.value || "0"),
      avgTimeOnPage: parseFloat(row.metricValues[2]?.value || "0"),
    }));
  }

  /**
   * Get traffic sources
   */
  async getTrafficSources(
    propertyId: string,
    dateRange: DateRange,
    limit: number = 10
  ): Promise<Array<{
    source: string;
    medium: string;
    users: number;
    sessions: number;
    bounceRate: number;
  }>> {
    const report = await this.runReport(propertyId, {
      dateRanges: [dateRange],
      dimensions: ["sessionSource", "sessionMedium"],
      metrics: ["totalUsers", "sessions", "bounceRate"],
      limit,
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    });

    return (report.rows || []).map(row => ({
      source: row.dimensionValues[0]?.value || "(direct)",
      medium: row.dimensionValues[1]?.value || "(none)",
      users: parseInt(row.metricValues[0]?.value || "0"),
      sessions: parseInt(row.metricValues[1]?.value || "0"),
      bounceRate: parseFloat(row.metricValues[2]?.value || "0"),
    }));
  }

  /**
   * Get organic search traffic
   */
  async getOrganicTraffic(
    propertyId: string,
    dateRange: DateRange
  ): Promise<{
    totalOrganicUsers: number;
    totalOrganicSessions: number;
    organicBySource: Array<{
      source: string;
      users: number;
      sessions: number;
    }>;
  }> {
    const report = await this.runReport(propertyId, {
      dateRanges: [dateRange],
      dimensions: ["sessionSource"],
      metrics: ["totalUsers", "sessions"],
      dimensionFilter: {
        filter: {
          fieldName: "sessionMedium",
          stringFilter: {
            matchType: "EXACT",
            value: "organic",
          },
        },
      },
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    });

    const rows = report.rows || [];
    
    return {
      totalOrganicUsers: rows.reduce((sum, r) => sum + parseInt(r.metricValues[0]?.value || "0"), 0),
      totalOrganicSessions: rows.reduce((sum, r) => sum + parseInt(r.metricValues[1]?.value || "0"), 0),
      organicBySource: rows.map(row => ({
        source: row.dimensionValues[0]?.value || "",
        users: parseInt(row.metricValues[0]?.value || "0"),
        sessions: parseInt(row.metricValues[1]?.value || "0"),
      })),
    };
  }

  /**
   * Get device breakdown
   */
  async getDeviceBreakdown(
    propertyId: string,
    dateRange: DateRange
  ): Promise<Array<{
    deviceCategory: string;
    users: number;
    sessions: number;
    percentage: number;
  }>> {
    const report = await this.runReport(propertyId, {
      dateRanges: [dateRange],
      dimensions: ["deviceCategory"],
      metrics: ["totalUsers", "sessions"],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    });

    const rows = report.rows || [];
    const totalSessions = rows.reduce((sum, r) => sum + parseInt(r.metricValues[1]?.value || "0"), 0);

    return rows.map(row => {
      const sessions = parseInt(row.metricValues[1]?.value || "0");
      return {
        deviceCategory: row.dimensionValues[0]?.value || "",
        users: parseInt(row.metricValues[0]?.value || "0"),
        sessions,
        percentage: totalSessions > 0 ? (sessions / totalSessions) * 100 : 0,
      };
    });
  }

  /**
   * Get country breakdown
   */
  async getCountryBreakdown(
    propertyId: string,
    dateRange: DateRange,
    limit: number = 10
  ): Promise<Array<{
    country: string;
    users: number;
    sessions: number;
  }>> {
    const report = await this.runReport(propertyId, {
      dateRanges: [dateRange],
      dimensions: ["country"],
      metrics: ["totalUsers", "sessions"],
      limit,
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    });

    return (report.rows || []).map(row => ({
      country: row.dimensionValues[0]?.value || "",
      users: parseInt(row.metricValues[0]?.value || "0"),
      sessions: parseInt(row.metricValues[1]?.value || "0"),
    }));
  }

  /**
   * Get landing pages performance (great for SEO)
   */
  async getLandingPages(
    propertyId: string,
    dateRange: DateRange,
    limit: number = 20
  ): Promise<Array<{
    landingPage: string;
    sessions: number;
    users: number;
    bounceRate: number;
    avgSessionDuration: number;
  }>> {
    const report = await this.runReport(propertyId, {
      dateRanges: [dateRange],
      dimensions: ["landingPage"],
      metrics: ["sessions", "totalUsers", "bounceRate", "averageSessionDuration"],
      limit,
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    });

    return (report.rows || []).map(row => ({
      landingPage: row.dimensionValues[0]?.value || "",
      sessions: parseInt(row.metricValues[0]?.value || "0"),
      users: parseInt(row.metricValues[1]?.value || "0"),
      bounceRate: parseFloat(row.metricValues[2]?.value || "0"),
      avgSessionDuration: parseFloat(row.metricValues[3]?.value || "0"),
    }));
  }

  /**
   * Get conversions (if goals are set up)
   */
  async getConversions(
    propertyId: string,
    dateRange: DateRange
  ): Promise<{
    totalConversions: number;
    conversionRate: number;
    conversionsByEvent: Array<{
      eventName: string;
      conversions: number;
    }>;
  }> {
    const report = await this.runReport(propertyId, {
      dateRanges: [dateRange],
      dimensions: ["eventName"],
      metrics: ["conversions", "sessions"],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          stringFilter: {
            matchType: "BEGINS_WITH",
            value: "conversion",
          },
        },
      },
    });

    const rows = report.rows || [];
    const totalConversions = rows.reduce((sum, r) => sum + parseInt(r.metricValues[0]?.value || "0"), 0);
    const totalSessions = rows.reduce((sum, r) => sum + parseInt(r.metricValues[1]?.value || "0"), 0);

    return {
      totalConversions,
      conversionRate: totalSessions > 0 ? (totalConversions / totalSessions) * 100 : 0,
      conversionsByEvent: rows.map(row => ({
        eventName: row.dimensionValues[0]?.value || "",
        conversions: parseInt(row.metricValues[0]?.value || "0"),
      })),
    };
  }
}

// Factory function
export function createGA4Client(organizationId: string): GA4Client {
  return new GA4Client(organizationId);
}

