/**
 * /api/me/site - Add or update user's site
 * 
 * POST - Add a new site (creates org if needed)
 * PATCH - Update site settings
 * 
 * NO FAKE DATA. Real site creation only.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

function getDbClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

// POST - Add a new site
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Not configured" }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Parse domain
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http")) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    let domain: string;
    try {
      domain = new URL(normalizedUrl).hostname.replace(/^www\./, "");
    } catch {
      domain = normalizedUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    }

    const db = getDbClient() || supabase;

    // Get or create organization
    let orgId: string | null = null;

    const { data: existingUser } = await db
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (existingUser?.organization_id) {
      orgId = existingUser.organization_id;
    } else {
      // Create org
      const slug = (user.email?.split("@")[0]?.replace(/[^a-z0-9]/gi, "") || "user") + "-" + Date.now();
      
      const { data: newOrg } = await db
        .from("organizations")
        .insert({
          name: user.user_metadata?.name || user.email?.split("@")[0] || "My Organization",
          slug,
          plan: "scout",
          subscription_status: "active",
        })
        .select("id")
        .single();

      if (newOrg) {
        orgId = newOrg.id;

        if (!existingUser) {
          await db.from("users").insert({
            id: user.id,
            organization_id: orgId,
            email: user.email || "",
            name: user.user_metadata?.name || null,
            role: "owner",
          });
        } else {
          await db.from("users").update({ organization_id: orgId }).eq("id", user.id);
        }
      }
    }

    if (!orgId) {
      return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
    }

    // Check if site already exists
    const { data: existingSite } = await db
      .from("sites")
      .select("id, domain, geo_score_avg, total_citations, citations_this_week")
      .eq("organization_id", orgId)
      .eq("domain", domain)
      .maybeSingle();

    if (existingSite) {
      return NextResponse.json({
        success: true,
        site: {
          id: existingSite.id,
          domain: existingSite.domain,
          geoScore: existingSite.geo_score_avg || null,
          totalCitations: existingSite.total_citations || 0,
          citationsThisWeek: existingSite.citations_this_week || 0,
        },
        message: "Site already exists",
      });
    }

    // Create new site - NO FAKE DATA, just empty values
    const { data: newSite, error: siteError } = await db
      .from("sites")
      .insert({
        organization_id: orgId,
        domain,
        name: domain,
        status: "active",
        total_citations: 0,
        citations_this_week: 0,
        citations_last_week: 0,
        geo_score_avg: null, // Will be set when user runs GEO analysis
      })
      .select("id, domain, geo_score_avg, total_citations, citations_this_week")
      .single();

    if (siteError || !newSite) {
      console.error("[/api/me/site] Create error:", siteError);
      return NextResponse.json({ error: "Failed to create site" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      site: {
        id: newSite.id,
        domain: newSite.domain,
        geoScore: newSite.geo_score_avg || null,
        totalCitations: newSite.total_citations || 0,
        citationsThisWeek: newSite.citations_this_week || 0,
      },
      message: "Site created. Run a citation check to start tracking.",
    });

  } catch (error) {
    console.error("[/api/me/site POST] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH - Update site
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Not configured" }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { siteId, topics, name } = body;

    if (!siteId) {
      return NextResponse.json({ error: "siteId required" }, { status: 400 });
    }

    const db = getDbClient() || supabase;

    // Get user's org
    const { data: userData } = await db
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (Array.isArray(topics)) {
      updateData.topics = topics;
    }
    if (typeof name === "string" && name.trim()) {
      updateData.name = name.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const { data: updatedSite, error } = await db
      .from("sites")
      .update(updateData)
      .eq("id", siteId)
      .eq("organization_id", userData.organization_id)
      .select("id, domain, name, topics, geo_score_avg, total_citations")
      .single();

    if (error) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      site: {
        id: updatedSite.id,
        domain: updatedSite.domain,
        name: updatedSite.name,
        topics: updatedSite.topics,
        geoScore: updatedSite.geo_score_avg || null,
        totalCitations: updatedSite.total_citations || 0,
      },
    });

  } catch (error) {
    console.error("[/api/me/site PATCH] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
