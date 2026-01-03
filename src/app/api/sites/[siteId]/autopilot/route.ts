import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * PATCH /api/sites/[siteId]/autopilot
 * Toggle autopilot mode for a site
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const { enabled, frequency } = await req.json();

    const supabase = await createClient();
    const serviceClient = await createServiceClient();
    
    if (!supabase || !serviceClient) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: userData } = await serviceClient
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const userOrgId = (userData as { organization_id: string } | null)?.organization_id;
    
    if (!userOrgId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Verify site belongs to user's org
    const { data: site, error: siteError } = await serviceClient
      .from("sites")
      .select("id, organization_id")
      .eq("id", siteId)
      .single();

    const siteData = site as { id: string; organization_id: string } | null;

    if (siteError || !siteData) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    if (siteData.organization_id !== userOrgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if user's plan supports autopilot
    const { data: org } = await serviceClient
      .from("organizations")
      .select("plan")
      .eq("id", userOrgId)
      .single();

    const plan = (org as { plan: string } | null)?.plan || "starter";
    
    // All paid plans can use autopilot (starter, pro, pro_plus)
    // Only block if no valid subscription
    const validPlans = ["starter", "pro", "pro_plus"];
    if (!validPlans.includes(plan) && enabled) {
      return NextResponse.json(
        { 
          error: "Autopilot requires an active subscription",
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    // Update autopilot settings
    const updateData = {
      autopilot_enabled: enabled as boolean,
      updated_at: new Date().toISOString(),
      ...(frequency && { autopilot_frequency: frequency as string }),
    };

    const { error: updateError } = await (serviceClient as any)
      .from("sites")
      .update(updateData)
      .eq("id", siteId);

    if (updateError) {
      console.error("Error updating autopilot:", updateError);
      return NextResponse.json(
        { error: "Failed to update autopilot settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      autopilotEnabled: enabled,
      autopilotFrequency: frequency || "weekly",
    });
  } catch (error) {
    console.error("Autopilot API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sites/[siteId]/autopilot
 * Get autopilot status and settings
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;

    const supabase = await createClient();
    const serviceClient = await createServiceClient();
    
    if (!supabase || !serviceClient) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get site autopilot settings
    const { data: site, error } = await serviceClient
      .from("sites")
      .select("autopilot_enabled, autopilot_frequency, main_topics")
      .eq("id", siteId)
      .single();

    const siteSettings = site as { 
      autopilot_enabled: boolean; 
      autopilot_frequency: string; 
      main_topics: string[] 
    } | null;

    if (error || !siteSettings) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Get recent autopilot activity (generated content)
    const { data: recentContent } = await serviceClient
      .from("content")
      .select("id, title, status, created_at")
      .eq("site_id", siteId)
      .order("created_at", { ascending: false })
      .limit(5);

    // Get user's plan to check eligibility
    const { data: userData } = await serviceClient
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const userOrgId = (userData as { organization_id: string } | null)?.organization_id;

    let planEligible = false;
    if (userOrgId) {
      const { data: org } = await serviceClient
        .from("organizations")
        .select("plan, subscription_status")
        .eq("id", userOrgId)
        .single();
      
      const orgData = org as { plan: string; subscription_status: string } | null;
      // All paid plans with active subscription can use autopilot
      const validPlans = ["starter", "pro", "pro_plus"];
      const validStatuses = ["active", "trialing"];
      planEligible = validPlans.includes(orgData?.plan || "") && 
                     validStatuses.includes(orgData?.subscription_status || "");
    }

    return NextResponse.json({
      success: true,
      autopilot: {
        enabled: siteSettings.autopilot_enabled || false,
        frequency: siteSettings.autopilot_frequency || "weekly",
        topics: siteSettings.main_topics || [],
        planEligible,
      },
      recentContent: recentContent || [],
    });
  } catch (error) {
    console.error("Autopilot GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

