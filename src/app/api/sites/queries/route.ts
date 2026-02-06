/**
 * /api/sites/queries - Manage Custom Queries
 * 
 * GET: Get custom queries for a site
 * POST: Add/update custom queries (Starter+)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getCitationPlanLimits, getCitationPlanFeatures } from "@/lib/billing/citation-plans";
import { getUser } from "@/lib/api/get-user";
import type { SupabaseClient } from "@supabase/supabase-js";

function getDbClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

// GET - Get custom queries for a site
export async function GET(request: NextRequest) {
  try {
    // Check for bypass user first
    const bypassUser = await getUser();
    if (bypassUser?.isTestAccount && bypassUser.id.startsWith("bypass-")) {
      return NextResponse.json({
        customQueries: [],
        category: null,
        bypassMode: true,
      });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json({ error: "siteId required" }, { status: 400 });
    }

    const db = getDbClient() || supabase;

    // Verify site ownership
    const { data: userData } = await db
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const { data: site } = await db
      .from("sites")
      .select("id, custom_queries, category, organization_id")
      .eq("id", siteId)
      .maybeSingle();

    if (!site || site.organization_id !== userData.organization_id) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    return NextResponse.json({
      customQueries: site.custom_queries || [],
      category: site.category,
    });

  } catch (error) {
    console.error("[/api/sites/queries GET] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - Update custom queries
export async function POST(request: NextRequest) {
  try {
    // Check for bypass user first
    const bypassUser = await getUser();
    if (bypassUser?.isTestAccount && bypassUser.id.startsWith("bypass-")) {
      const body = await request.json();
      const { customQueries } = body;
      return NextResponse.json({
        success: true,
        customQueries: customQueries || [],
        limit: 10,
        bypassMode: true,
      });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { siteId, customQueries, category } = body;

    if (!siteId) {
      return NextResponse.json({ error: "siteId required" }, { status: 400 });
    }

    const db = getDbClient() || supabase;

    // Get user's organization and plan
    const { data: userData } = await db
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    // Get plan to check custom query limits
    const { data: org } = await db
      .from("organizations")
      .select("plan")
      .eq("id", userData.organization_id)
      .single();

    const plan = org?.plan || "free";
    const features = getCitationPlanFeatures(plan);
    const limits = getCitationPlanLimits(plan);

    // Check if custom queries are allowed
    if (!features.customQueries && customQueries?.length > 0) {
      return NextResponse.json({ 
        error: "Custom queries require Starter plan or higher",
        upgrade: true 
      }, { status: 403 });
    }

    // Verify site ownership
    const { data: site } = await db
      .from("sites")
      .select("id, organization_id")
      .eq("id", siteId)
      .maybeSingle();

    if (!site || site.organization_id !== userData.organization_id) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Enforce custom query limit
    let queriesToSave = Array.isArray(customQueries) ? customQueries : [];
    if (limits.customQueriesPerSite !== -1 && queriesToSave.length > limits.customQueriesPerSite) {
      queriesToSave = queriesToSave.slice(0, limits.customQueriesPerSite);
    }

    // Filter out empty queries
    queriesToSave = queriesToSave.filter((q: string) => q?.trim());

    // Update site
    const updateData: Record<string, unknown> = {
      custom_queries: queriesToSave,
    };
    
    if (category !== undefined) {
      updateData.category = category || null;
    }

    const { error } = await db
      .from("sites")
      .update(updateData)
      .eq("id", siteId);

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      customQueries: queriesToSave,
      limit: limits.customQueriesPerSite,
    });

  } catch (error) {
    console.error("[/api/sites/queries POST] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

