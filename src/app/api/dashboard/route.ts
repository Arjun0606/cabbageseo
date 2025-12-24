/**
 * Dashboard API
 * 
 * Returns aggregated dashboard data for the current user:
 * - Sites overview with SEO scores
 * - Stats (keywords, content, rankings, issues)
 * - Recent activity
 * - Recommended next actions
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface DashboardData {
  sites: Array<{
    id: string;
    domain: string;
    name: string;
    seoScore: number;
    status: string;
    pagesCount: number;
    issuesCount: number;
    lastCrawled: string | null;
  }>;
  stats: {
    totalKeywords: number;
    trackedKeywords: number;
    totalContent: number;
    publishedContent: number;
    avgPosition: number | null;
    totalIssues: number;
    criticalIssues: number;
  };
  recentActivity: Array<{
    id: string;
    type: "content" | "keyword" | "audit" | "publish" | "crawl";
    title: string;
    description: string;
    timestamp: string;
    siteId: string;
    siteDomain: string;
  }>;
  nextActions: Array<{
    id: string;
    type: "write" | "optimize" | "fix" | "research" | "publish";
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    siteId: string;
    siteDomain: string;
  }>;
}

// ============================================
// 🔓 TESTING MODE - AUTH BYPASS
// Set to false before production launch
// ============================================
const TESTING_MODE = true;

export async function GET() {
  // Use service client in testing mode to bypass RLS
  const supabase = TESTING_MODE ? createServiceClient() : await createClient();
  
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  let userId: string | null = null;
  let orgId: string | null = null;

  // Check auth - skip in testing mode
  if (TESTING_MODE) {
    // In testing mode, get or create a test organization (service client bypasses RLS)
    const { data: testOrg, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .limit(1)
      .single();
    
    if (orgError && orgError.code === 'PGRST116') {
      // No org exists, create one
      const { data: newOrg } = await supabase
        .from("organizations")
        .insert({ name: "Test Organization", plan: "starter" })
        .select("id")
        .single();
      orgId = (newOrg as { id: string } | null)?.id || null;
    } else if (testOrg) {
      orgId = (testOrg as { id: string }).id;
    }
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.id;

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    orgId = (userData as { organization_id?: string } | null)?.organization_id || null;
  }

  try {
    if (!orgId) {
      // No org = empty dashboard
      const emptyData: DashboardData = {
        sites: [],
        stats: {
          totalKeywords: 0,
          trackedKeywords: 0,
          totalContent: 0,
          publishedContent: 0,
          avgPosition: null,
          totalIssues: 0,
          criticalIssues: 0,
        },
        recentActivity: [],
        nextActions: [],
      };
      return NextResponse.json({ success: true, data: emptyData });
    }

    // ========================================
    // Fetch sites
    // ========================================
    const { data: sitesData } = await supabase
      .from("sites")
      .select("id, domain, name, seo_score, is_active, last_crawl_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    const sites = ((sitesData as Array<{
      id: string;
      domain: string;
      name: string;
      seo_score: number | null;
      is_active: boolean | null;
      last_crawl_at: string | null;
    }>) || []).map(site => ({
      id: site.id,
      domain: site.domain,
      name: site.name || site.domain,
      seoScore: site.seo_score || 0,
      status: site.is_active !== false ? "active" : "inactive",
      pagesCount: 0, // Will be filled below
      issuesCount: 0, // Will be filled below
      lastCrawled: site.last_crawl_at,
    }));

    // Get page counts for each site
    if (sites.length > 0) {
      const siteIds = sites.map(s => s.id);
      const { data: pagesData } = await supabase
        .from("pages")
        .select("site_id")
        .in("site_id", siteIds);

      if (pagesData) {
        const pagesBySite = (pagesData as Array<{ site_id: string }>).reduce((acc, page) => {
          acc[page.site_id] = (acc[page.site_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        sites.forEach(site => {
          site.pagesCount = pagesBySite[site.id] || 0;
        });
      }
    }

    // Get issue counts for each site
    if (sites.length > 0) {
      const siteIds = sites.map(s => s.id);
      const { data: issuesData } = await supabase
        .from("issues")
        .select("site_id, severity")
        .in("site_id", siteIds)
        .eq("is_resolved", false);

      if (issuesData) {
        const issuesBySite = (issuesData as Array<{ site_id: string; severity: string }>).reduce((acc, issue) => {
          acc[issue.site_id] = (acc[issue.site_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        sites.forEach(site => {
          site.issuesCount = issuesBySite[site.id] || 0;
        });
      }
    }

    // ========================================
    // Aggregate stats
    // ========================================
    let stats: DashboardData["stats"] = {
      totalKeywords: 0,
      trackedKeywords: 0,
      totalContent: 0,
      publishedContent: 0,
      avgPosition: null,
      totalIssues: 0,
      criticalIssues: 0,
    };

    if (sites.length > 0) {
      const siteIds = sites.map(s => s.id);

      // Keywords count
      const { count: keywordsCount } = await supabase
        .from("keywords")
        .select("id", { count: "exact", head: true })
        .in("site_id", siteIds);
      stats.totalKeywords = keywordsCount || 0;

      // Tracked keywords (those with rankings)
      const { count: trackedCount } = await supabase
        .from("keywords")
        .select("id", { count: "exact", head: true })
        .in("site_id", siteIds)
        .not("current_position", "is", null);
      stats.trackedKeywords = trackedCount || 0;

      // Content count
      const { count: contentCount } = await supabase
        .from("content")
        .select("id", { count: "exact", head: true })
        .in("site_id", siteIds);
      stats.totalContent = contentCount || 0;

      // Published content
      const { count: publishedCount } = await supabase
        .from("content")
        .select("id", { count: "exact", head: true })
        .in("site_id", siteIds)
        .eq("status", "published");
      stats.publishedContent = publishedCount || 0;

      // Average position
      const { data: positionData } = await supabase
        .from("keywords")
        .select("current_position")
        .in("site_id", siteIds)
        .not("current_position", "is", null)
        .limit(100);

      if (positionData && positionData.length > 0) {
        const positions = (positionData as Array<{ current_position: number }>)
          .map(k => k.current_position)
          .filter(p => p > 0);
        if (positions.length > 0) {
          stats.avgPosition = Math.round(positions.reduce((a, b) => a + b, 0) / positions.length * 10) / 10;
        }
      }

      // Issues
      const { data: allIssues } = await supabase
        .from("issues")
        .select("severity")
        .in("site_id", siteIds)
        .eq("is_resolved", false);

      if (allIssues) {
        stats.totalIssues = allIssues.length;
        stats.criticalIssues = (allIssues as Array<{ severity: string }>)
          .filter(i => i.severity === "critical").length;
      }
    }

    // ========================================
    // Recent activity (from tasks)
    // ========================================
    let recentActivity: DashboardData["recentActivity"] = [];
    
    if (sites.length > 0) {
      const siteIds = sites.map(s => s.id);
      const siteLookup = Object.fromEntries(sites.map(s => [s.id, s.domain]));

      const { data: tasksData } = await supabase
        .from("tasks")
        .select("id, type, name, description, status, completed_at, site_id")
        .in("site_id", siteIds)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(10);

      if (tasksData) {
        recentActivity = (tasksData as Array<{
          id: string;
          type: string;
          name: string;
          description: string | null;
          status: string;
          completed_at: string | null;
          site_id: string;
        }>).map(task => ({
          id: task.id,
          type: mapTaskType(task.type),
          title: task.name,
          description: task.description || "",
          timestamp: task.completed_at || new Date().toISOString(),
          siteId: task.site_id,
          siteDomain: siteLookup[task.site_id] || "Unknown",
        }));
      }
    }

    // ========================================
    // Next actions (from pending tasks or generated)
    // ========================================
    let nextActions: DashboardData["nextActions"] = [];

    if (sites.length > 0) {
      const siteIds = sites.map(s => s.id);
      const siteLookup = Object.fromEntries(sites.map(s => [s.id, s.domain]));

      // Get pending tasks
      const { data: pendingTasks } = await supabase
        .from("tasks")
        .select("id, type, name, description, priority, site_id")
        .in("site_id", siteIds)
        .eq("status", "pending")
        .order("priority", { ascending: false })
        .limit(5);

      if (pendingTasks && pendingTasks.length > 0) {
        nextActions = (pendingTasks as Array<{
          id: string;
          type: string;
          name: string;
          description: string | null;
          priority: number;
          site_id: string;
        }>).map(task => ({
          id: task.id,
          type: mapActionType(task.type),
          title: task.name,
          description: task.description || "",
          priority: mapPriority(task.priority),
          siteId: task.site_id,
          siteDomain: siteLookup[task.site_id] || "Unknown",
        }));
      } else {
        // Generate suggested actions based on data
        for (const site of sites.slice(0, 3)) {
          if (site.issuesCount > 0) {
            nextActions.push({
              id: `fix-${site.id}`,
              type: "fix",
              title: `Fix ${site.issuesCount} SEO issues`,
              description: `Address technical issues on ${site.domain}`,
              priority: site.issuesCount > 5 ? "high" : "medium",
              siteId: site.id,
              siteDomain: site.domain,
            });
          }

          if (site.seoScore < 70) {
            nextActions.push({
              id: `optimize-${site.id}`,
              type: "optimize",
              title: `Improve SEO score`,
              description: `Current score: ${site.seoScore}/100`,
              priority: site.seoScore < 50 ? "high" : "medium",
              siteId: site.id,
              siteDomain: site.domain,
            });
          }
        }

        // Add content suggestion if no content
        if (stats.totalContent === 0 && sites.length > 0) {
          nextActions.push({
            id: "write-first",
            type: "write",
            title: "Create your first content",
            description: "Use AI to generate SEO-optimized articles",
            priority: "high",
            siteId: sites[0].id,
            siteDomain: sites[0].domain,
          });
        }

        // Add keyword research suggestion
        if (stats.totalKeywords === 0 && sites.length > 0) {
          nextActions.push({
            id: "research-keywords",
            type: "research",
            title: "Start keyword research",
            description: "Find keywords to target for organic traffic",
            priority: "high",
            siteId: sites[0].id,
            siteDomain: sites[0].domain,
          });
        }
      }
    }

    const data: DashboardData = {
      sites,
      stats,
      recentActivity,
      nextActions: nextActions.slice(0, 5),
    };

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error("[Dashboard API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load dashboard" },
      { status: 500 }
    );
  }
}

// Helper functions
function mapTaskType(type: string): "content" | "keyword" | "audit" | "publish" | "crawl" {
  const mapping: Record<string, "content" | "keyword" | "audit" | "publish" | "crawl"> = {
    generate_content: "content",
    optimize_content: "content",
    research: "keyword",
    audit: "audit",
    fix: "audit",
    publish: "publish",
    discovery: "crawl",
    crawl: "crawl",
  };
  return mapping[type] || "audit";
}

function mapActionType(type: string): "write" | "optimize" | "fix" | "research" | "publish" {
  const mapping: Record<string, "write" | "optimize" | "fix" | "research" | "publish"> = {
    generate_content: "write",
    optimize_content: "optimize",
    fix: "fix",
    research: "research",
    publish: "publish",
    audit: "fix",
  };
  return mapping[type] || "fix";
}

function mapPriority(priority: number): "high" | "medium" | "low" {
  if (priority >= 70) return "high";
  if (priority >= 40) return "medium";
  return "low";
}

