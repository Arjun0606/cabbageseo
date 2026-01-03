/**
 * Jobs Module - Background Processing
 */

export { inngest } from "./inngest-client";
export { functions } from "./functions";

export type {
  CrawlSiteEvent,
  AuditSiteEvent,
  GenerateContentEvent,
  KeywordResearchEvent,
  AnalyticsSyncEvent,
  AutopilotRunEvent,
  AutopilotTask,
  ScheduledJobEvent,
  GEOSiteAddedEvent,
  CabbageSEOEvents,
} from "./inngest-client";

// Helper to trigger jobs from API routes
export async function triggerJob<T extends { name: string; data: unknown }>(
  event: T
): Promise<{ id: string }> {
  const { inngest } = await import("./inngest-client");
  const result = await inngest.send(event);
  return { id: result.ids[0] };
}

