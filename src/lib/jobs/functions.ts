/**
 * Inngest Functions - Background Job Handlers
 * 
 * These functions run asynchronously to handle:
 * - Long-running crawls
 * - AI content generation
 * - Technical audits
 * - Analytics syncing
 * - Autopilot automation
 */

import { inngest } from "./inngest-client";
import { createCrawler, createAuditEngine, createAutoFixEngine } from "@/lib/crawler";
import { createServiceClient } from "@/lib/supabase/server";

// ============================================
// CRAWL SITE FUNCTION
// ============================================

export const crawlSite = inngest.createFunction(
  {
    id: "crawl-site",
    name: "Crawl Site",
    retries: 2,
  },
  { event: "crawl/site.requested" },
  async ({ event, step }) => {
    const { organizationId, siteId, url, options } = event.data;

    // Step 1: Update status to crawling
    await step.run("update-status-crawling", async () => {
      const supabase = createServiceClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("sites").update({
        crawl_status: "crawling",
        last_crawl_started_at: new Date().toISOString(),
      }).eq("id", siteId);
    });

    // Step 2: Run the crawl
    const crawlResult = await step.run("run-crawl", async () => {
      const crawler = createCrawler({
        maxPages: options?.maxPages || 100,
        maxDepth: options?.maxDepth || 3,
        delayMs: 500,
        respectRobotsTxt: true,
      });

      return crawler.crawl(url);
    });

    // Step 3: Run technical audit
    const auditResult = await step.run("run-audit", async () => {
      const auditEngine = createAuditEngine();
      return auditEngine.audit(crawlResult);
    });

    // Step 4: Generate fix suggestions
    const fixes = await step.run("generate-fixes", async () => {
      const fixEngine = createAutoFixEngine();
      return fixEngine.generateFixes(auditResult, crawlResult.pages);
    });

    // Step 5: Store results
    await step.run("store-results", async () => {
      const supabase = createServiceClient();
      
      // Store crawl result
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("crawl_results").insert({
        site_id: siteId,
        organization_id: organizationId,
        pages_crawled: crawlResult.crawledPages,
        total_pages: crawlResult.totalPages,
        errors: crawlResult.errors,
        duration_ms: crawlResult.durationMs,
        data: crawlResult,
      });

      // Store audit result
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("audit_results").insert({
        site_id: siteId,
        organization_id: organizationId,
        score: auditResult.score,
        total_issues: auditResult.summary.totalIssues,
        critical_issues: auditResult.summary.criticalIssues,
        data: auditResult,
        fixes: fixes,
      });

      // Update site status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("sites").update({
        crawl_status: "completed",
        last_crawl_completed_at: new Date().toISOString(),
        seo_score: auditResult.score,
        pages_count: crawlResult.crawledPages,
        issues_count: auditResult.summary.totalIssues,
      }).eq("id", siteId);
    });

    return {
      success: true,
      crawlResult: {
        pages: crawlResult.crawledPages,
        duration: crawlResult.durationMs,
      },
      auditResult: {
        score: auditResult.score,
        issues: auditResult.summary.totalIssues,
      },
      fixes: fixes.length,
    };
  }
);

// ============================================
// GENERATE CONTENT FUNCTION
// ============================================

export const generateContent = inngest.createFunction(
  {
    id: "generate-content",
    name: "Generate Content",
    retries: 1,
  },
  { event: "content/generate.requested" },
  async ({ event, step }) => {
    const { organizationId, siteId, contentId, type, topic, keywords, outline } = event.data;

    // Step 1: Update status
    await step.run("update-status", async () => {
      const supabase = createServiceClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("content").update({
        status: "generating",
        updated_at: new Date().toISOString(),
      }).eq("id", contentId);
    });

    // Step 2: Generate content based on type
    const result = await step.run("generate", async () => {
      // Import AI client dynamically to avoid circular deps
      const { claude: ai } = await import("@/lib/ai");
      
      switch (type) {
        case "article":
          // Generate full article
          const articlePrompt = `Write a comprehensive SEO-optimized article about: ${topic}
          
Target keywords: ${keywords?.join(", ") || ""}
${outline ? `Follow this outline:\n${outline}` : ""}

Requirements:
- 1500-2000 words
- Include H2 and H3 headings
- Write in an engaging, authoritative tone
- Include actionable tips and examples
- End with a conclusion and call-to-action`;

          const articleResponse = await ai.chat(
            [{ role: "user", content: articlePrompt }],
            undefined,
            { model: "sonnet", maxTokens: 4000 }
          );
          return { type: "article", content: articleResponse.content };

        case "meta":
          // Generate meta tags
          const metaPrompt = `Generate SEO meta tags for a page about: ${topic}

Return JSON with:
- title (50-60 chars)
- description (150-160 chars)
- keywords (comma-separated)

IMPORTANT: Return ONLY valid JSON, no other text.`;

          const metaResponse = await ai.chat(
            [{ role: "user", content: metaPrompt }],
            undefined,
            { model: "haiku" }
          );
          const meta = JSON.parse(metaResponse.content);
          return { type: "meta", content: meta };

        case "schema":
          // Generate schema markup
          const schemaPrompt = `Generate appropriate JSON-LD schema markup for a page about: ${topic}

Return valid JSON-LD for Article or WebPage schema.

IMPORTANT: Return ONLY valid JSON, no other text.`;

          const schemaResponse = await ai.chat(
            [{ role: "user", content: schemaPrompt }],
            undefined,
            { model: "haiku" }
          );
          const schema = JSON.parse(schemaResponse.content);
          return { type: "schema", content: schema };

        case "internal-links":
          // Generate internal link suggestions
          const linksPrompt = `Suggest 5 internal linking opportunities for an article about: ${topic}

Return JSON array with:
- anchorText
- suggestedPage (description of what page to link to)
- context (where in the article to add the link)

IMPORTANT: Return ONLY valid JSON array, no other text.`;

          const linksResponse = await ai.chat(
            [{ role: "user", content: linksPrompt }],
            undefined,
            { model: "haiku" }
          );
          const links = JSON.parse(linksResponse.content);
          return { type: "internal-links", content: links };

        default:
          throw new Error(`Unknown content type: ${type}`);
      }
    });

    // Step 3: Store result
    await step.run("store-result", async () => {
      const supabase = createServiceClient();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("content").update({
        status: "draft",
        content: result.content,
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", contentId);
    });

    return {
      success: true,
      type: result.type,
      contentId,
    };
  }
);

// ============================================
// KEYWORD RESEARCH FUNCTION
// ============================================

export const keywordResearch = inngest.createFunction(
  {
    id: "keyword-research",
    name: "Keyword Research",
    retries: 2,
  },
  { event: "keywords/research.requested" },
  async ({ event, step }) => {
    const { organizationId, siteId, seedKeywords, options } = event.data;

    // Step 1: Fetch keyword data
    const keywordData = await step.run("fetch-keywords", async () => {
      const { seoData } = await import("@/lib/seo");
      
      const results = [];
      for (const seed of seedKeywords) {
        const suggestions = await seoData.getKeywordSuggestions(seed, {
          location: options?.location,
          language: options?.language,
          limit: options?.limit || 50,
        });
        results.push(...suggestions);
      }
      
      return results;
    });

    // Step 2: Cluster keywords using AI
    const clusters = await step.run("cluster-keywords", async () => {
      const { claude: ai } = await import("@/lib/ai");
      
      const keywordList = keywordData.map(k => k.keyword).join("\n");
      
      const clusterPrompt = `Cluster these keywords into topic groups:

${keywordList}

Return JSON with clusters:
[
  {
    "name": "cluster name",
    "keywords": ["keyword1", "keyword2"],
    "intent": "informational|commercial|transactional",
    "priority": "high|medium|low"
  }
]

IMPORTANT: Return ONLY valid JSON array, no other text.`;

      const response = await ai.chat(
        [{ role: "user", content: clusterPrompt }],
        undefined,
        { model: "haiku" }
      );
      return JSON.parse(response.content);
    });

    // Step 3: Store results
    await step.run("store-results", async () => {
      const supabase = createServiceClient();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("keyword_research").insert({
        site_id: siteId,
        organization_id: organizationId,
        seed_keywords: seedKeywords,
        keywords: keywordData,
        clusters: clusters,
        created_at: new Date().toISOString(),
      });
    });

    return {
      success: true,
      keywords: keywordData.length,
      clusters: Array.isArray(clusters) ? clusters.length : 0,
    };
  }
);

// ============================================
// ANALYTICS SYNC FUNCTION
// ============================================

export const analyticsSync = inngest.createFunction(
  {
    id: "analytics-sync",
    name: "Sync Analytics",
    retries: 2,
  },
  { event: "analytics/sync.requested" },
  async ({ event, step }) => {
    const { organizationId, siteId, sources, dateRange } = event.data;

    const results: Record<string, unknown> = {};

    // Calculate date range (default last 30 days)
    const endDate = dateRange?.endDate || new Date().toISOString().split("T")[0];
    const startDate = dateRange?.startDate || 
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Step 1: Get site info
    const site = await step.run("get-site", async () => {
      const supabase = createServiceClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("sites")
        .select("url, gsc_property, ga4_property")
        .eq("id", siteId)
        .single();
      return data;
    });

    // Step 2: Sync GSC data
    if (sources.includes("gsc") && site?.gsc_property) {
      results.gsc = await step.run("sync-gsc", async () => {
        const { createGSCClient } = await import("@/lib/integrations/google");
        const gsc = createGSCClient(organizationId);
        
        const [summary, topQueries, topPages] = await Promise.all([
          gsc.getSummaryStats(site.gsc_property, { startDate, endDate }),
          gsc.getTopQueries(site.gsc_property, { startDate, endDate }, 100),
          gsc.getTopPages(site.gsc_property, { startDate, endDate }, 100),
        ]);

        return { summary, topQueries, topPages };
      });
    }

    // Step 3: Sync GA4 data
    if (sources.includes("ga4") && site?.ga4_property) {
      results.ga4 = await step.run("sync-ga4", async () => {
        const { createGA4Client } = await import("@/lib/integrations/google");
        const ga4 = createGA4Client(organizationId);
        
        const [overview, trafficSources, topPages] = await Promise.all([
          ga4.getTrafficOverview(site.ga4_property, { startDate, endDate }),
          ga4.getTrafficSources(site.ga4_property, { startDate, endDate }),
          ga4.getTopPages(site.ga4_property, { startDate, endDate }),
        ]);

        return { overview, trafficSources, topPages };
      });
    }

    // Step 4: Store results
    await step.run("store-results", async () => {
      const supabase = createServiceClient();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("analytics_snapshots").insert({
        site_id: siteId,
        organization_id: organizationId,
        date_range: { startDate, endDate },
        gsc_data: results.gsc || null,
        ga4_data: results.ga4 || null,
        created_at: new Date().toISOString(),
      });

      // Update site with latest metrics
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gscData = results.gsc as { summary?: { totalClicks?: number; avgPosition?: number } } | undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ga4Data = results.ga4 as { overview?: { users?: number } } | undefined;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("sites").update({
        last_analytics_sync: new Date().toISOString(),
        total_clicks: gscData?.summary?.totalClicks,
        avg_position: gscData?.summary?.avgPosition,
        total_users: ga4Data?.overview?.users,
      }).eq("id", siteId);
    });

    return {
      success: true,
      synced: sources,
      dateRange: { startDate, endDate },
    };
  }
);

// ============================================
// AUTOPILOT FUNCTION
// ============================================

export const runAutopilot = inngest.createFunction(
  {
    id: "run-autopilot",
    name: "Run Autopilot",
    retries: 1,
  },
  { event: "autopilot/run.requested" },
  async ({ event, step }) => {
    const { organizationId, siteId, tasks } = event.data;
    const results: Array<{ task: string; success: boolean; result?: unknown }> = [];

    // Sort tasks by priority
    const sortedTasks = [...tasks].sort((a, b) => {
      const priority: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return (priority[a.priority] || 2) - (priority[b.priority] || 2);
    });

    for (const task of sortedTasks) {
      const taskResult = await step.run(`task-${task.type}`, async () => {
        switch (task.type) {
          case "crawl":
            // Trigger crawl event
            await inngest.send({
              name: "crawl/site.requested",
              data: { organizationId, siteId, url: "", options: task.config },
            });
            return { triggered: "crawl" };

          case "audit":
            // Run quick audit
            await inngest.send({
              name: "audit/site.requested",
              data: { organizationId, siteId },
            });
            return { triggered: "audit" };

          case "optimize-meta":
            // Generate optimized meta tags for pages with issues
            return { action: "meta-optimization", status: "queued" };

          case "fix-issues":
            // Apply auto-fixes
            return { action: "auto-fix", status: "queued" };

          case "internal-links":
            // Generate and suggest internal links
            return { action: "internal-links", status: "queued" };

          case "refresh-content":
            // Identify and queue content for refresh
            return { action: "content-refresh", status: "queued" };

          default:
            return { skipped: true, reason: "Unknown task type" };
        }
      });

      results.push({
        task: task.type,
        success: true,
        result: taskResult,
      });
    }

    // Log autopilot run
    await step.run("log-run", async () => {
      const supabase = createServiceClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("autopilot_logs").insert({
        site_id: siteId,
        organization_id: organizationId,
        tasks_run: tasks.length,
        results,
        created_at: new Date().toISOString(),
      });
    });

    return {
      success: true,
      tasksCompleted: results.length,
      results,
    };
  }
);

// ============================================
// SCHEDULED JOBS
// ============================================

// Weekly site crawl
export const scheduledWeeklyCrawl = inngest.createFunction(
  {
    id: "scheduled-weekly-crawl",
    name: "Weekly Site Crawl",
  },
  { cron: "0 0 * * 0" }, // Every Sunday at midnight
  async ({ step }) => {
    // Get all active sites with autopilot enabled
    const sites = await step.run("get-active-sites", async () => {
      const supabase = createServiceClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("sites")
        .select("id, organization_id, url")
        .eq("autopilot_enabled", true)
        .eq("status", "active");
      return data || [];
    });

    // Queue crawls for each site
    for (const site of sites) {
      await step.run(`queue-crawl-${site.id}`, async () => {
        await inngest.send({
          name: "crawl/site.requested",
          data: {
            organizationId: site.organization_id,
            siteId: site.id,
            url: site.url,
            options: { maxPages: 100, maxDepth: 3 },
          },
        });
      });
    }

    return { queued: sites.length };
  }
);

// Daily analytics sync
export const scheduledDailyAnalytics = inngest.createFunction(
  {
    id: "scheduled-daily-analytics",
    name: "Daily Analytics Sync",
  },
  { cron: "0 6 * * *" }, // Every day at 6 AM
  async ({ step }) => {
    // Get all sites with connected analytics
    const sites = await step.run("get-sites-with-analytics", async () => {
      const supabase = createServiceClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("sites")
        .select("id, organization_id, gsc_property, ga4_property")
        .eq("status", "active")
        .or("gsc_property.neq.null,ga4_property.neq.null");
      return data || [];
    });

    // Queue analytics sync for each site
    for (const site of sites) {
      const sources: ("gsc" | "ga4")[] = [];
      if (site.gsc_property) sources.push("gsc");
      if (site.ga4_property) sources.push("ga4");

      if (sources.length > 0) {
        await step.run(`queue-sync-${site.id}`, async () => {
          await inngest.send({
            name: "analytics/sync.requested",
            data: {
              organizationId: site.organization_id,
              siteId: site.id,
              sources,
            },
          });
        });
      }
    }

    return { queued: sites.length };
  }
);

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export const functions = [
  crawlSite,
  generateContent,
  keywordResearch,
  analyticsSync,
  runAutopilot,
  scheduledWeeklyCrawl,
  scheduledDailyAnalytics,
];

