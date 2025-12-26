/**
 * Sites API
 * 
 * Manage sites for the organization
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface SiteRow {
  id: string;
  organization_id: string;
  domain: string;
  name: string;
  is_active: boolean;
  autopilot_enabled: boolean;
  settings: Record<string, unknown> | null;
  seo_score: number | null;
  aio_score_avg: number | null;
  gsc_connected: boolean;
  cms_connected: boolean;
  cms_type: string | null;
  last_crawl_at: string | null;
  last_crawl_pages_count: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// 🔓 TESTING MODE - AUTH BYPASS
// Set TESTING_MODE=true in .env for local testing
// ============================================
const TESTING_MODE = process.env.TESTING_MODE === "true";

async function getOrgId(supabase: ReturnType<typeof createServiceClient>) {
  if (TESTING_MODE) {
    const { data: orgs } = await supabase
      .from("organizations")
      .select("id")
      .limit(1) as { data: { id: string }[] | null; error: unknown };
    
    if (orgs && orgs.length > 0) {
      return orgs[0].id;
    }
    
    // Create test org if none exists
    const { data: newOrg } = await supabase
      .from("organizations")
      .insert({ name: "Test Organization", slug: "test-org-" + Date.now(), plan: "starter" } as never)
      .select("id")
      .single() as { data: { id: string } | null; error: unknown };
    
    return newOrg?.id || null;
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  return (userData as { organization_id?: string } | null)?.organization_id || null;
}

// GET - List sites OR get single site by ID
export async function GET(request: NextRequest) {
  let supabase;
  try {
    supabase = TESTING_MODE ? createServiceClient() : await createClient();
  } catch (e) {
    console.error("[Sites API GET] Failed to create client:", e);
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const orgId = await getOrgId(supabase);
  if (!orgId) {
    return NextResponse.json({ success: true, data: { sites: [], stats: { total: 0 } } });
  }

  // Check if requesting a single site
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("id");

  try {
    if (siteId) {
      // Get single site with full details
      const { data: site, error } = await supabase
        .from("sites")
        .select("*")
        .eq("id", siteId)
        .eq("organization_id", orgId)
        .single() as { data: SiteRow | null; error: { message: string } | null };

      if (error || !site) {
        return NextResponse.json({ error: "Site not found" }, { status: 404 });
      }

      // Get related stats
      const [keywordResult, contentResult, issueResult, auditResult] = await Promise.all([
        supabase.from("keywords").select("id, keyword, position, previous_position", { count: "exact" }).eq("site_id", siteId).limit(10),
        supabase.from("content").select("id, title, status, created_at", { count: "exact" }).eq("site_id", siteId).order("created_at", { ascending: false }).limit(5),
        supabase.from("issues").select("id, severity", { count: "exact" }).eq("site_id", siteId).eq("is_resolved", false),
        supabase.from("audits").select("score, created_at").eq("site_id", siteId).order("created_at", { ascending: false }).limit(1).single(),
      ]);

      const keywords = (keywordResult.data || []) as { keyword: string; position: number; previous_position: number }[];
      const content = (contentResult.data || []) as { id: string; title: string; status: string; created_at: string }[];
      const issues = (issueResult.data || []) as { severity: string }[];
      
      const criticalIssues = issues.filter((i) => i.severity === "critical").length;
      const warningIssues = issues.filter((i) => i.severity === "warning").length;

      return NextResponse.json({
        success: true,
        data: {
          id: site.id,
          domain: site.domain,
          name: site.name,
          url: `https://${site.domain}`,
          seoScore: site.seo_score || 0,
          aioScore: site.aio_score_avg || 0,
          pagesCount: site.last_crawl_pages_count || 0,
          keywordsTracked: keywordResult.count || 0,
          lastCrawlAt: site.last_crawl_at,
          status: site.is_active ? "active" : "inactive",
          gscConnected: site.gsc_connected,
          cmsConnected: site.cms_connected,
          cmsType: site.cms_type,
          autopilotEnabled: site.autopilot_enabled,
          issues: {
            critical: criticalIssues,
            warnings: warningIssues,
            passed: Math.max(0, 50 - criticalIssues - warningIssues), // Estimated passed checks
          },
          topKeywords: keywords.slice(0, 5).map(k => ({
            keyword: k.keyword,
            position: k.position || 0,
            change: k.previous_position ? k.previous_position - k.position : 0,
          })),
          recentContent: content.map(c => ({
            id: c.id,
            title: c.title,
            status: c.status,
            createdAt: c.created_at,
          })),
        },
      });
    }

    // List all sites
    const { data: sites, error } = await supabase
      .from("sites")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const siteRows = (sites || []) as SiteRow[];

    // Get stats for each site
    const sitesWithStats = await Promise.all(
      siteRows.map(async (site) => {
        const { count: keywordCount } = await supabase
          .from("keywords")
          .select("id", { count: "exact" })
          .eq("site_id", site.id);

        const { count: contentCount } = await supabase
          .from("content")
          .select("id", { count: "exact" })
          .eq("site_id", site.id);

        const { count: issueCount } = await supabase
          .from("issues")
          .select("id", { count: "exact" })
          .eq("site_id", site.id)
          .eq("is_resolved", false);

        return {
          id: site.id,
          domain: site.domain,
          name: site.name,
          url: `https://${site.domain}`,
          status: site.is_active ? "active" : "inactive",
          seoScore: site.seo_score || 0,
          keywords: keywordCount || 0,
          content: contentCount || 0,
          issues: issueCount || 0,
          gscConnected: site.gsc_connected || false,
          cmsConnected: site.cms_connected || false,
          cmsType: site.cms_type || null,
          autopilotEnabled: site.autopilot_enabled || false,
          createdAt: site.created_at,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        sites: sitesWithStats,
        stats: {
          total: sitesWithStats.length,
          withGSC: sitesWithStats.filter(s => s.gscConnected).length,
          withCMS: sitesWithStats.filter(s => s.cmsConnected).length,
        },
      },
    });

  } catch (error) {
    console.error("[Sites API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch sites" },
      { status: 500 }
    );
  }
}

// POST - Create site (with duplicate check)
export async function POST(request: NextRequest) {
  let supabase;
  try {
    supabase = TESTING_MODE ? createServiceClient() : await createClient();
  } catch (e) {
    console.error("[Sites API POST] Failed to create client:", e);
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const orgId = await getOrgId(supabase);
  if (!orgId) {
    return NextResponse.json({ error: "No organization found" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { domain, name } = body;

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    // Clean domain
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "").replace(/^www\./, "");

    // Check for duplicate domain in org
    const { data: existing } = await supabase
      .from("sites")
      .select("id")
      .eq("organization_id", orgId)
      .eq("domain", cleanDomain)
      .limit(1) as { data: { id: string }[] | null };

    if (existing && existing.length > 0) {
      return NextResponse.json({ 
        error: "This site already exists in your account",
        existingSiteId: existing[0].id 
      }, { status: 409 });
    }

    // Create site
    const { data: newSite, error } = await supabase
      .from("sites")
      .insert({
        organization_id: orgId,
        domain: cleanDomain,
        name: name || cleanDomain,
        is_active: true,
      } as never)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: newSite });

  } catch (error) {
    console.error("[Sites API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create site" },
      { status: 500 }
    );
  }
}

// DELETE - Delete site
export async function DELETE(request: NextRequest) {
  let supabase;
  try {
    supabase = TESTING_MODE ? createServiceClient() : await createClient();
  } catch (e) {
    console.error("[Sites API DELETE] Failed to create client:", e);
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const orgId = await getOrgId(supabase);
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("id");

    if (!siteId) {
      return NextResponse.json({ error: "Site ID is required" }, { status: 400 });
    }

    // Delete site (cascade will handle related data)
    const { error } = await supabase
      .from("sites")
      .delete()
      .eq("id", siteId)
      .eq("organization_id", orgId);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Sites API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete site" },
      { status: 500 }
    );
  }
}
