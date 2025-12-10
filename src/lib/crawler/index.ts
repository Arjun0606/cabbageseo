/**
 * Crawler Module - Centralized Exports
 */

export { SiteCrawler, SitemapParser, createCrawler } from "./site-crawler";
export { TechnicalAuditEngine, createAuditEngine } from "./technical-audit";
export { AutoFixEngine, createAutoFixEngine } from "./auto-fix";

export type {
  CrawlOptions,
  PageData,
  ImageData,
  LinkData,
  CrawlResult,
  CrawlError,
  RobotsTxt,
} from "./site-crawler";

export type {
  IssueSeverity,
  IssueCategory,
  AuditIssue,
  AuditFix,
  AuditResult,
  AuditSummary,
  PageScore,
} from "./technical-audit";

export type {
  FixSuggestion,
  BulkFix,
  InternalLinkSuggestion,
  ContentSuggestion,
} from "./auto-fix";

