/**
 * Page Auto-Refresh - Inngest Cron Job
 *
 * Automatically refreshes published fix pages based on plan frequency:
 * - Scout: every 30 days (monthly)
 * - Command: every 14 days (bi-weekly)
 * - Dominate: every 7 days (weekly)
 *
 * Runs daily at 6 AM UTC (before the 10 AM citation check).
 * Does NOT count against pagesPerMonth limit.
 */

import { inngest } from "./inngest-client";
import { createServiceClient } from "@/lib/supabase/server";
import { getRefreshFrequencyDays } from "@/lib/billing/citation-plans";
import { generatePage } from "@/lib/geo/page-generator";

// Legacy plan name resolution
function resolvePlan(plan: string): string {
  const map: Record<string, string> = {
    starter: "scout",
    pro: "command",
    pro_plus: "dominate",
  };
  return map[plan] || plan;
}

// ============================================
// DAILY PAGE REFRESH (All Paid Users)
// Runs every day at 6 AM UTC
// ============================================
export const dailyPageRefresh = inngest.createFunction(
  {
    id: "daily-page-refresh",
    name: "Daily Page Auto-Refresh",
    retries: 2,
  },
  { cron: "0 6 * * *" },
  async ({ step }) => {
    const supabase = createServiceClient();

    // Get all active paid orgs with their plan
    const orgs = await step.run("get-paid-orgs", async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, plan")
        .neq("plan", "free")
        .eq("subscription_status", "active");

      if (error) {
        console.error("[page-refresh] Failed to fetch orgs:", error);
        return [];
      }
      return (data || []) as Array<{ id: string; plan: string }>;
    });

    let totalRefreshed = 0;
    const MAX_PER_RUN = 50;

    for (const org of orgs) {
      if (totalRefreshed >= MAX_PER_RUN) break;

      const plan = resolvePlan(org.plan);
      const refreshDays = getRefreshFrequencyDays(plan);
      if (refreshDays === 0) continue;

      // Find stale published pages for this org's sites
      const stalePages = await step.run(`find-stale-pages-${org.id}`, async () => {
        const threshold = new Date();
        threshold.setDate(threshold.getDate() - refreshDays);
        const thresholdISO = threshold.toISOString();

        // Get org's site IDs
        const { data: sitesData } = await supabase
          .from("sites")
          .select("id, domain")
          .eq("organization_id", org.id)
          .eq("status", "active");

        const sites = (sitesData || []) as Array<{ id: string; domain: string }>;
        if (!sites.length) return [];

        const siteIds = sites.map(s => s.id);
        const siteMap = Object.fromEntries(sites.map(s => [s.id, s.domain]));

        // Find published pages that need refreshing
        // Stale = (never refreshed AND updated before threshold) OR (refreshed before threshold)
        const { data: pagesData } = await supabase
          .from("generated_pages")
          .select("id, site_id, query, last_refreshed_at, updated_at, refresh_count")
          .in("site_id", siteIds)
          .eq("status", "published")
          .order("last_refreshed_at", { ascending: true, nullsFirst: true })
          .limit(30); // Fetch more than needed, filter below

        const pages = (pagesData || []) as Array<{
          id: string;
          site_id: string;
          query: string;
          last_refreshed_at: string | null;
          updated_at: string;
          refresh_count: number;
        }>;
        if (!pages.length) return [];

        // Filter to actually stale pages
        return pages
          .filter(p => {
            const lastRefresh = p.last_refreshed_at || p.updated_at;
            return lastRefresh < thresholdISO;
          })
          .slice(0, 10) // Cap at 10 per site
          .map(p => ({
            id: p.id,
            siteId: p.site_id,
            query: p.query,
            domain: siteMap[p.site_id] || "",
            refreshCount: p.refresh_count || 0,
          }));
      });

      // Refresh each stale page
      for (const page of stalePages) {
        if (totalRefreshed >= MAX_PER_RUN) break;

        await step.run(`refresh-page-${page.id}`, async () => {
          try {
            const result = await generatePage(page.siteId, page.query, org.id);

            const now = new Date().toISOString();
            await supabase
              .from("generated_pages")
              .update({
                title: result.title,
                meta_description: result.metaDescription,
                body: result.body,
                schema_markup: result.schemaMarkup,
                target_entities: result.targetEntities,
                word_count: result.wordCount,
                updated_at: now,
                last_refreshed_at: now,
                refresh_count: page.refreshCount + 1,
              } as never)
              .eq("id", page.id);

            console.log(`[page-refresh] Refreshed page ${page.id} for ${page.domain} (query: "${page.query}")`);
            return { success: true };
          } catch (err) {
            console.error(`[page-refresh] Failed to refresh page ${page.id}:`, err);
            return { success: false };
          }
        });

        totalRefreshed++;

        // Rate limit delay between pages
        if (totalRefreshed < MAX_PER_RUN && stalePages.indexOf(page) < stalePages.length - 1) {
          await step.sleep(`delay-${page.id}`, "3s");
        }
      }
    }

    return {
      refreshed: totalRefreshed,
      orgsProcessed: orgs.length,
    };
  }
);

export const pageRefreshFunctions = [dailyPageRefresh];
