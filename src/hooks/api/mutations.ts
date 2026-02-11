/**
 * React Query mutation hooks for all dashboard write operations.
 *
 * Each mutation automatically invalidates the relevant query caches
 * so the UI stays in sync without manual refetching.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

// ============================================
// SPRINT ACTIONS
// ============================================

export function useSprintAction(siteId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      actionId,
      status,
      proofUrl,
      notes,
    }: {
      actionId: string;
      status: "completed" | "skipped";
      proofUrl?: string;
      notes?: string;
    }) => {
      const res = await fetch("/api/geo/sprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId, status, proofUrl, notes }),
      });
      if (!res.ok) throw new Error("Sprint action failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprint", siteId] });
      queryClient.invalidateQueries({ queryKey: ["next-action", siteId] });
    },
  });
}

// ============================================
// PAGE GENERATION
// ============================================

export function useGeneratePage(siteId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ query }: { query: string }) => {
      const res = await fetch("/api/geo/pages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, query: query.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        const message = data.upgradeRequired
          ? "Monthly page limit reached. Upgrade for more."
          : data.error || "Failed to generate page.";
        throw new Error(message);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages", siteId] });
      queryClient.invalidateQueries({ queryKey: ["opportunities", siteId] });
    },
  });
}

// ============================================
// PAGE DELETION
// ============================================

export function useDeletePage(siteId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pageId }: { pageId: string }) => {
      const res = await fetch(`/api/geo/pages/${pageId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages", siteId] });
      queryClient.invalidateQueries({ queryKey: ["opportunities", siteId] });
    },
  });
}

// ============================================
// INVALIDATION HELPER
// ============================================

/**
 * Returns a function that invalidates all dashboard query caches for a site.
 * Useful after external operations like `runCheck` from SiteContext.
 */
export function useInvalidateDashboard(siteId: string | undefined) {
  const queryClient = useQueryClient();
  return () => {
    const keys = [
      "momentum",
      "next-action",
      "listings",
      "history",
      "pages",
      "improvement",
      "opportunities",
      "audit",
      "sprint",
      "lost-queries",
    ];
    keys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: [key, siteId] });
    });
  };
}
