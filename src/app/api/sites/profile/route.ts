/**
 * Site Public Profile API
 * 
 * Manage public profile settings for a site.
 * Privacy-first: profiles are OFF by default.
 * 
 * POST /api/sites/profile - Update public profile settings
 * GET /api/sites/profile?siteId=xxx - Get current settings
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const siteId = request.nextUrl.searchParams.get("siteId");
    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    // Verify ownership
    const { data: profileData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const profile = profileData as { organization_id: string } | null;
    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const { data: siteData } = await supabase
      .from("sites")
      .select("id, domain, public_profile_enabled, public_profile_bio")
      .eq("id", siteId)
      .eq("organization_id", profile.organization_id)
      .single();

    const site = siteData as {
      id: string;
      domain: string;
      public_profile_enabled: boolean | null;
      public_profile_bio: string | null;
    } | null;

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        siteId: site.id,
        domain: site.domain,
        publicProfileEnabled: site.public_profile_enabled || false,
        publicProfileBio: site.public_profile_bio || "",
        publicUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://cabbageseo.com"}/ai-profile/${encodeURIComponent(site.domain)}`,
      },
    });
  } catch (error) {
    console.error("[Sites Profile GET] Error:", error);
    return NextResponse.json({ error: "Failed to get profile settings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { siteId, enabled, bio } = body;

    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    // Verify ownership
    const { data: profileData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const profile = profileData as { organization_id: string } | null;
    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    // Update the site
    const updateData: Record<string, unknown> = {};
    if (typeof enabled === "boolean") {
      updateData.public_profile_enabled = enabled;
    }
    if (typeof bio === "string") {
      updateData.public_profile_bio = bio;
    }

    const { error: updateError } = await supabase
      .from("sites")
      .update(updateData as never)
      .eq("id", siteId)
      .eq("organization_id", profile.organization_id);

    if (updateError) {
      console.error("[Sites Profile POST] Update error:", updateError);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    // Get updated site
    const { data: siteData } = await supabase
      .from("sites")
      .select("id, domain, public_profile_enabled, public_profile_bio")
      .eq("id", siteId)
      .single();

    const site = siteData as {
      id: string;
      domain: string;
      public_profile_enabled: boolean | null;
      public_profile_bio: string | null;
    } | null;

    return NextResponse.json({
      success: true,
      data: {
        siteId: site?.id,
        domain: site?.domain,
        publicProfileEnabled: site?.public_profile_enabled || false,
        publicProfileBio: site?.public_profile_bio || "",
        publicUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://cabbageseo.com"}/ai-profile/${encodeURIComponent(site?.domain || "")}`,
      },
    });
  } catch (error) {
    console.error("[Sites Profile POST] Error:", error);
    return NextResponse.json({ error: "Failed to update profile settings" }, { status: 500 });
  }
}

