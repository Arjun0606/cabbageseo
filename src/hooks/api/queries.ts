/**
 * React Query hooks for all dashboard data fetching.
 *
 * These replace the manual fetch + useState + useEffect patterns
 * throughout the dashboard with proper caching, background refetching,
 * request deduplication, and automatic retry.
 */

import { useQuery } from "@tanstack/react-query";

// ============================================
// TYPES
// ============================================

export interface MomentumData {
  score: number;
  change: number;
  trend: "gaining" | "losing" | "stable";
  citationsWon: number;
  citationsLost: number;
  queriesWon: number;
  queriesTotal: number;
  sourceCoverage: number;
  breakdown?: {
    baseScore: number;
    sourceBonus: number;
    momentumBonus: number;
    explanation: string;
    tip: string | null;
  };
}

export interface NextActionData {
  id: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  estimatedMinutes: number;
  actionUrl?: string;
  category: "source" | "content" | "technical" | "monitoring";
}

export interface Snapshot {
  date: string;
  queriesWon: number;
  queriesLost: number;
  totalQueries: number;
}

export interface CheckSnapshot {
  date: string;
  queriesWon: number;
  queriesLost: number;
  totalQueries: number;
}

export interface ImprovementData {
  firstCheck: CheckSnapshot | null;
  latestCheck: CheckSnapshot | null;
  checksCount: number;
}

export interface SprintData {
  progress: {
    totalActions: number;
    completedActions: number;
    percentComplete: number;
    currentDay: number;
    currentWeek: number;
    daysRemaining: number;
    isComplete: boolean;
  };
  actions: SprintAction[];
}

export interface SprintAction {
  id: string;
  actionType: string;
  title: string;
  description: string;
  actionUrl?: string | null;
  priority: number;
  estimatedMinutes: number;
  week: number;
  status: string;
  completedAt: string | null;
  proofUrl?: string | null;
  notes?: string | null;
}

export interface AuditData {
  hasAudit: boolean;
  score?: number;
  grade?: string;
  breakdown?: {
    contentClarity: number;
    authoritySignals: number;
    structuredData: number;
    citability: number;
    freshness: number;
    topicalDepth: number;
  };
  tipsCount?: number;
  createdAt?: string;
}

export interface ContentEngineData {
  open: number;
  pagesGenerated: number;
  pagesPublished: number;
  topOpportunity: { query: string } | null;
}

export interface Opportunity {
  id: string;
  query: string;
  platform: string;
  snippet: string;
  impact: "high" | "medium" | "low";
  hasPage: boolean;
  pageId: string | null;
  pageStatus: string | null;
}

export interface OpportunitySummary {
  total: number;
  open: number;
  addressed: number;
  pagesGenerated: number;
  pagesPublished: number;
}

export interface PageSummary {
  id: string;
  siteId: string;
  query: string;
  title: string;
  metaDescription: string | null;
  wordCount: number | null;
  aiModel: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastRefreshedAt: string | null;
  refreshCount: number;
}

export interface LostQuery {
  query: string;
  platform: string;
  snippet?: string;
}

// ============================================
// QUERY HOOKS
// ============================================

export function useMomentum(siteId: string | undefined) {
  return useQuery({
    queryKey: ["momentum", siteId],
    queryFn: async (): Promise<MomentumData | null> => {
      const res = await fetch(`/api/geo/momentum?siteId=${siteId}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || json;
    },
    enabled: !!siteId,
  });
}

export function useNextAction(siteId: string | undefined) {
  return useQuery({
    queryKey: ["next-action", siteId],
    queryFn: async (): Promise<NextActionData | null> => {
      const res = await fetch(`/api/geo/next-action?siteId=${siteId}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || json;
    },
    enabled: !!siteId,
  });
}

export function useListings(siteId: string | undefined) {
  return useQuery({
    queryKey: ["listings", siteId],
    queryFn: async (): Promise<{ listedCount: number }> => {
      const res = await fetch(`/api/sites/listings?siteId=${siteId}`);
      if (!res.ok) return { listedCount: 0 };
      const json = await res.json();
      return { listedCount: json.listedCount || 0 };
    },
    enabled: !!siteId,
  });
}

export function useHistory(siteId: string | undefined) {
  return useQuery({
    queryKey: ["history", siteId],
    queryFn: async (): Promise<Snapshot[]> => {
      const res = await fetch(`/api/geo/history?siteId=${siteId}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data?.snapshots || [];
    },
    enabled: !!siteId,
  });
}

export function useGeneratedPages(siteId: string | undefined) {
  return useQuery({
    queryKey: ["pages", siteId],
    queryFn: async (): Promise<PageSummary[]> => {
      const res = await fetch(`/api/geo/pages?siteId=${siteId}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data?.pages || [];
    },
    enabled: !!siteId,
  });
}

export function useImprovement(siteId: string | undefined) {
  return useQuery({
    queryKey: ["improvement", siteId],
    queryFn: async (): Promise<ImprovementData | null> => {
      const res = await fetch(`/api/geo/improvement?siteId=${siteId}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    },
    enabled: !!siteId,
  });
}

export function useOpportunities(siteId: string | undefined) {
  return useQuery({
    queryKey: ["opportunities", siteId],
    queryFn: async (): Promise<{
      opportunities: Opportunity[];
      summary: OpportunitySummary | null;
      analyzedAt: string | null;
    }> => {
      const res = await fetch(`/api/geo/opportunities?siteId=${siteId}`);
      if (!res.ok)
        return { opportunities: [], summary: null, analyzedAt: null };
      const json = await res.json();
      return {
        opportunities: json.data?.opportunities || [],
        summary: json.data?.summary || null,
        analyzedAt: json.data?.analyzedAt || null,
      };
    },
    enabled: !!siteId,
  });
}

export function useAudit(siteId: string | undefined) {
  return useQuery({
    queryKey: ["audit", siteId],
    queryFn: async (): Promise<AuditData | null> => {
      const res = await fetch(`/api/geo/audit?siteId=${siteId}`);
      if (!res.ok) return null;
      const json = await res.json();
      if (json.data?.hasAudit) {
        const audit = json.data.audit;
        return {
          hasAudit: true,
          score: audit.score?.overall,
          grade: audit.score?.grade,
          breakdown: audit.score?.breakdown,
          tipsCount: Array.isArray(audit.tips) ? audit.tips.length : 0,
          createdAt: audit.createdAt,
        };
      }
      return { hasAudit: false };
    },
    enabled: !!siteId,
  });
}

export function useSprint(siteId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["sprint", siteId],
    queryFn: async (): Promise<SprintData | null> => {
      const res = await fetch(`/api/geo/sprint?siteId=${siteId}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    },
    enabled: !!siteId && enabled,
  });
}

export function useLostQueries(siteId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["lost-queries", siteId],
    queryFn: async (): Promise<LostQuery[]> => {
      const res = await fetch(`/api/geo/lost-queries?siteId=${siteId}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data?.lostQueries || [];
    },
    enabled: !!siteId && enabled,
  });
}
