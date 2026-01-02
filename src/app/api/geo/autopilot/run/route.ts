/**
 * GEO Autopilot Run API
 * 
 * POST /api/geo/autopilot/run?siteId=xxx
 * 
 * Manually trigger autopilot content generation for a site.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSubscription } from "@/lib/api/require-subscription";
import { geoAutopilot } from "@/lib/geo/autopilot";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Auth check
    const subscription = await requireSubscription(supabase);
    if (!subscription.authorized) {
      return subscription.error!;
    }

    const siteId = req.nextUrl.searchParams.get("siteId");
    if (!siteId) {
      return NextResponse.json(
        { error: "siteId is required" },
        { status: 400 }
      );
    }

    // Verify site ownership
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("current_organization_id")
      .eq("id", user.id)
      .single();

    const profile = profileData as { current_organization_id: string } | null;
    if (!profile?.current_organization_id) {
      return NextResponse.json(
        { error: "No organization" },
        { status: 400 }
      );
    }

    const { data: site } = await (supabase as any)
      .from("sites")
      .select("id")
      .eq("id", siteId)
      .eq("organization_id", profile.current_organization_id)
      .single();

    if (!site) {
      return NextResponse.json(
        { error: "Site not found" },
        { status: 404 }
      );
    }

    // Run autopilot
    const result = await geoAutopilot.runForSite(siteId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Autopilot run error:", error);
    return NextResponse.json(
      { error: "Failed to run autopilot", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

