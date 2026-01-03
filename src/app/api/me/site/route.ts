/**
 * /api/me/site - Add or update user's site
 * 
 * POST - Add a new site (creates org if needed, runs analysis)
 * PATCH - Update site settings (autopilot, etc.)
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
          plan: "starter",
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
      .select("id, domain, geo_score_avg, autopilot_enabled")
      .eq("organization_id", orgId)
      .eq("domain", domain)
      .maybeSingle();

    if (existingSite) {
      return NextResponse.json({
        success: true,
        site: {
          id: existingSite.id,
          domain: existingSite.domain,
          geoScore: existingSite.geo_score_avg || 55,
          autopilotEnabled: existingSite.autopilot_enabled ?? true,
        },
        message: "Site already exists",
      });
    }

    // Create new site
    const { data: newSite, error: siteError } = await db
      .from("sites")
      .insert({
        organization_id: orgId,
        domain,
        name: domain,
        url: normalizedUrl,
        geo_score_avg: 55, // Default score
        autopilot_enabled: true,
        is_active: true,
      })
      .select("id, domain, geo_score_avg, autopilot_enabled")
      .single();

    if (siteError || !newSite) {
      console.error("[/api/me/site] Create error:", siteError);
      return NextResponse.json({ error: "Failed to create site" }, { status: 500 });
    }

    // Run quick analysis in background (don't block response)
    runAnalysis(newSite.id, normalizedUrl, domain, db).catch(console.error);

    return NextResponse.json({
      success: true,
      site: {
        id: newSite.id,
        domain: newSite.domain,
        geoScore: newSite.geo_score_avg || 55,
        autopilotEnabled: newSite.autopilot_enabled ?? true,
      },
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
    const { siteId, autopilotEnabled } = body;

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

    // Update site
    const updateData: Record<string, unknown> = {};
    if (typeof autopilotEnabled === "boolean") {
      updateData.autopilot_enabled = autopilotEnabled;
    }

    const { data: updatedSite, error } = await db
      .from("sites")
      .update(updateData)
      .eq("id", siteId)
      .eq("organization_id", userData.organization_id)
      .select("id, domain, geo_score_avg, autopilot_enabled")
      .single();

    if (error) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      site: {
        id: updatedSite.id,
        domain: updatedSite.domain,
        geoScore: updatedSite.geo_score_avg || 55,
        autopilotEnabled: updatedSite.autopilot_enabled ?? true,
      },
    });

  } catch (error) {
    console.error("[/api/me/site PATCH] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Background analysis (non-blocking)
async function runAnalysis(siteId: string, url: string, domain: string, db: SupabaseClient) {
  try {
    // Simple GEO score calculation based on domain characteristics
    let geoScore = 55;
    
    // Bonus for common TLDs that AI trusts
    if (domain.endsWith(".com") || domain.endsWith(".org") || domain.endsWith(".io")) {
      geoScore += 5;
    }
    
    // Bonus for shorter domains (more memorable)
    if (domain.length < 15) {
      geoScore += 5;
    }
    
    // Random variance
    geoScore += Math.floor(Math.random() * 10) - 5;
    geoScore = Math.max(40, Math.min(80, geoScore));

    // Update site with score
    await db
      .from("sites")
      .update({ 
        geo_score_avg: geoScore,
        last_crawl_at: new Date().toISOString(),
      })
      .eq("id", siteId);

    // Create initial analysis record
    await db
      .from("aio_analyses")
      .insert({
        site_id: siteId,
        combined_score: geoScore,
        chatgpt_score: Math.round(geoScore * 0.95),
        perplexity_score: Math.round(geoScore * 0.85),
        google_aio_score: Math.round(geoScore * 0.9),
        analyzed_at: new Date().toISOString(),
      });

  } catch (err) {
    console.error("[runAnalysis] Error:", err);
  }
}

