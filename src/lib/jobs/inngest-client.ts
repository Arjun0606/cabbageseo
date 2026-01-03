/**
 * Inngest Client Configuration
 * 
 * Background job processing for CabbageSEO's automation features:
 * - Site crawling
 * - Content generation
 * - Technical audits
 * - Keyword research
 * - Analytics sync
 * - Autopilot tasks
 */

import { Inngest } from "inngest";

// Create Inngest client
export const inngest = new Inngest({
  id: "cabbageseo",
  name: "CabbageSEO",
});

// ============================================
// EVENT TYPES
// ============================================

export interface CrawlSiteEvent {
  name: "crawl/site.requested";
  data: {
    organizationId: string;
    siteId: string;
    url: string;
    options?: {
      maxPages?: number;
      maxDepth?: number;
    };
  };
}

export interface AuditSiteEvent {
  name: "audit/site.requested";
  data: {
    organizationId: string;
    siteId: string;
    crawlResultId?: string;
  };
}

export interface GenerateContentEvent {
  name: "content/generate.requested";
  data: {
    organizationId: string;
    siteId: string;
    contentId: string;
    type: "article" | "meta" | "schema" | "internal-links";
    topic?: string;
    keywords?: string[];
    outline?: string;
  };
}

export interface KeywordResearchEvent {
  name: "keywords/research.requested";
  data: {
    organizationId: string;
    siteId: string;
    seedKeywords: string[];
    options?: {
      location?: string;
      language?: string;
      limit?: number;
    };
  };
}

export interface AnalyticsSyncEvent {
  name: "analytics/sync.requested";
  data: {
    organizationId: string;
    siteId: string;
    sources: ("gsc" | "ga4")[];
    dateRange?: {
      startDate: string;
      endDate: string;
    };
  };
}

export interface AutopilotRunEvent {
  name: "autopilot/run.requested";
  data: {
    organizationId: string;
    siteId: string;
    tasks: AutopilotTask[];
  };
}

export interface AutopilotTask {
  type: 
    | "crawl"
    | "audit"
    | "generate-content"
    | "optimize-meta"
    | "fix-issues"
    | "internal-links"
    | "refresh-content"
    | "publish";
  priority: "high" | "medium" | "low";
  config?: Record<string, unknown>;
}

export interface ScheduledJobEvent {
  name: "scheduled/job.triggered";
  data: {
    organizationId: string;
    jobType: string;
    config?: Record<string, unknown>;
  };
}

export interface GEOSiteAddedEvent {
  name: "geo/site.added";
  data: {
    siteId: string;
    organizationId: string;
    domain: string;
  };
}

// Union type for all events
export type CabbageSEOEvents = 
  | CrawlSiteEvent
  | AuditSiteEvent
  | GenerateContentEvent
  | KeywordResearchEvent
  | AnalyticsSyncEvent
  | AutopilotRunEvent
  | ScheduledJobEvent
  | GEOSiteAddedEvent;

