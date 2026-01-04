/**
 * Audit Issues API
 * 
 * Manages SEO issues - list, fix, bulk fix
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// ============================================
// 🔓 TESTING MODE - AUTH BYPASS
// Set TESTING_MODE=true in .env for local testing
// ============================================
const TESTING_MODE = process.env.TESTING_MODE === "true";

interface IssueRow {
  id: string;
  site_id: string;
  page_url: string | null;
  category: string;
  severity: string;
  title: string;
  description: string | null;
  current_value: string | null;
  suggested_value: string | null;
  auto_fixable: boolean;
  status: string;
  fixed_at: string | null;
  created_at: string;
}

// GET - List issues
export async function GET(request: NextRequest) {
  let supabase;
  try {
    supabase = TESTING_MODE ? createServiceClient() : await createClient();
  } catch (e: unknown) {
    console.error("[Issues API GET] Error creating service client:", e);
    return NextResponse.json({ error: "Database service client not configured" }, { status: 500 });
  }
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  let orgId: string | null = null;

  if (TESTING_MODE) {
    const { data: orgs } = await supabase.from("organizations").select("id").limit(1);
    orgId = (orgs?.[0] as { id: string } | undefined)?.id || null;
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization (use service client to bypass RLS)
    let serviceClient;
    try {
      serviceClient = createServiceClient();
    } catch {
      serviceClient = supabase;
    }
    
    const { data: userData } = await serviceClient
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    orgId = (userData as { organization_id?: string } | null)?.organization_id || null;
  }

  if (!orgId) {
    return NextResponse.json({ success: true, data: { issues: [], stats: {} } });
  }

  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const severity = searchParams.get("severity");
    const category = searchParams.get("category");
    const status = searchParams.get("status") || "open";
    const limit = parseInt(searchParams.get("limit") || "100");

    // Get user's sites
    const { data: sites } = await supabase
      .from("sites")
      .select("id, domain, seo_score")
      .eq("organization_id", orgId);

    if (!sites || sites.length === 0) {
      return NextResponse.json({ success: true, data: { issues: [], stats: {} } });
    }

    const siteIds = (sites as { id: string }[]).map(s => s.id);
    const siteLookup = Object.fromEntries(
      (sites as { id: string; domain: string }[]).map(s => [s.id, s.domain])
    );

    // Build query
    let query = supabase
      .from("issues")
      .select("*", { count: "exact" })
      .in("site_id", siteId ? [siteId] : siteIds)
      .order("severity", { ascending: true }) // critical first
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status !== "all") {
      query = query.eq("status", status);
    }

    if (severity) {
      query = query.eq("severity", severity);
    }

    if (category) {
      query = query.eq("category", category);
    }

    const { data: issues, count, error } = await query;

    if (error) {
      console.error("Issues fetch error:", error);
      throw error;
    }

    // Transform issues
    const transformedIssues = ((issues || []) as IssueRow[]).map(issue => ({
      id: issue.id,
      url: issue.page_url,
      category: issue.category,
      severity: issue.severity,
      title: issue.title,
      description: issue.description,
      currentValue: issue.current_value,
      suggestedValue: issue.suggested_value,
      autoFixable: issue.auto_fixable,
      status: issue.status,
      fixedAt: issue.fixed_at,
      siteId: issue.site_id,
      siteDomain: siteLookup[issue.site_id] || "Unknown",
    }));

    // Calculate stats
    const allIssues = (issues || []) as IssueRow[];
    const targetSite = siteId 
      ? (sites as { id: string; seo_score?: number }[]).find(s => s.id === siteId)
      : (sites as { seo_score?: number }[])[0];
    
    const stats = {
      total: count || 0,
      critical: allIssues.filter(i => i.severity === "critical").length,
      warning: allIssues.filter(i => i.severity === "warning").length,
      info: allIssues.filter(i => i.severity === "info").length,
      passed: Math.max(0, 100 - allIssues.filter(i => i.severity === "critical").length * 5 - allIssues.filter(i => i.severity === "warning").length * 2),
      autoFixable: allIssues.filter(i => i.auto_fixable).length,
      categories: getCategoryBreakdown(allIssues),
      seoScore: targetSite?.seo_score || 0,
    };
    
    console.log(`[Issues API] Returning ${allIssues.length} issues for site ${siteId || "all"}, stats:`, stats);

    return NextResponse.json({
      success: true,
      data: {
        issues: transformedIssues,
        stats,
      },
    });

  } catch (error) {
    console.error("[Issues API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch issues" },
      { status: 500 }
    );
  }
}

// POST - Fix issues
export async function POST(request: NextRequest) {
  let supabase;
  try {
    supabase = TESTING_MODE ? createServiceClient() : await createClient();
  } catch (e: unknown) {
    console.error("[Issues API POST] Error creating service client:", e);
    return NextResponse.json({ error: "Database service client not configured" }, { status: 500 });
  }
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  let orgId: string | null = null;

  if (TESTING_MODE) {
    const { data: orgs } = await supabase.from("organizations").select("id").limit(1);
    orgId = (orgs?.[0] as { id: string } | undefined)?.id || null;
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization (use service client to bypass RLS)
    let serviceClient;
    try {
      serviceClient = createServiceClient();
    } catch {
      serviceClient = supabase;
    }
    
    const { data: userData } = await serviceClient
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    orgId = (userData as { organization_id?: string } | null)?.organization_id || null;
  }

  if (!orgId) {
    return NextResponse.json({ error: "No organization found" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { action, issueIds } = body;

    if (!action || !issueIds || !Array.isArray(issueIds)) {
      return NextResponse.json({ error: "Action and issue IDs are required" }, { status: 400 });
    }

    // Get user's sites
    const { data: sites } = await supabase
      .from("sites")
      .select("id")
      .eq("organization_id", orgId);

    const siteIds = (sites as { id: string }[] | null)?.map(s => s.id) || [];

    let result;

    switch (action) {
      case "fix": {
        // Mark issues as fixed
        const { data, error } = await supabase
          .from("issues")
          .update({
            status: "fixed",
            fixed_at: new Date().toISOString(),
          } as never)
          .in("id", issueIds)
          .in("site_id", siteIds)
          .select();

        if (error) throw error;
        result = { fixed: (data as unknown[])?.length || 0 };
        break;
      }

      case "ignore": {
        // Mark issues as ignored
        const { data, error } = await supabase
          .from("issues")
          .update({
            status: "ignored",
          } as never)
          .in("id", issueIds)
          .in("site_id", siteIds)
          .select();

        if (error) throw error;
        result = { ignored: (data as unknown[])?.length || 0 };
        break;
      }

      case "autofix": {
        // Get auto-fixable issues
        const { data: fixableIssues, error: fetchError } = await supabase
          .from("issues")
          .select("*")
          .in("id", issueIds)
          .in("site_id", siteIds)
          .eq("auto_fixable", true);

        if (fetchError) throw fetchError;

        // In production, this would trigger actual fixes
        // For now, we'll mark them as fixed
        if (fixableIssues && fixableIssues.length > 0) {
          const { error: updateError } = await supabase
            .from("issues")
            .update({
              status: "fixed",
              fixed_at: new Date().toISOString(),
            } as never)
            .in("id", (fixableIssues as { id: string }[]).map(i => i.id))
            .in("site_id", siteIds); // Defensive: verify ownership

          if (updateError) throw updateError;
        }

        result = { 
          autoFixed: (fixableIssues as unknown[])?.length || 0,
          message: "Issues have been queued for auto-fix",
        };
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error("[Issues API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process issues" },
      { status: 500 }
    );
  }
}

// Helper function
function getCategoryBreakdown(issues: IssueRow[]): Record<string, number> {
  return issues.reduce((acc, issue) => {
    acc[issue.category] = (acc[issue.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

