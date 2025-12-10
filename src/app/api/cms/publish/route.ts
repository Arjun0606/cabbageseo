/**
 * CMS Publishing API
 * POST /api/cms/publish - Publish content to connected CMS
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPublisherFromIntegration, type CMSType, type PublishContent } from "@/lib/cms/publisher";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single() as { data: { organization_id: string } | null };

    const orgId = profile?.organization_id;
    if (!orgId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { 
      cmsType, 
      content,
      siteId,  // For Webflow
    } = body as {
      cmsType: CMSType;
      content: PublishContent;
      siteId?: string;
    };

    if (!cmsType || !content) {
      return NextResponse.json(
        { error: "Missing required fields: cmsType, content" },
        { status: 400 }
      );
    }

    // Get CMS credentials from integrations
    const { data: integration, error: integrationError } = await supabase
      .from("integrations")
      .select("credentials")
      .eq("organization_id", orgId)
      .eq("type", cmsType)
      .eq("status", "active")
      .single() as { data: { credentials: Record<string, unknown> } | null; error: unknown };

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: `${cmsType} not connected. Please add your ${cmsType} credentials in Settings → Integrations.` },
        { status: 400 }
      );
    }

    // Decrypt credentials if needed (credentials are stored encrypted)
    const credentials = integration.credentials as Record<string, string>;
    
    // Add siteId for Webflow if provided
    if (cmsType === "webflow" && siteId) {
      credentials.siteId = siteId;
    }

    // Create publisher
    const publisher = await createPublisherFromIntegration(cmsType, credentials);
    if (!publisher) {
      return NextResponse.json(
        { error: `Invalid ${cmsType} credentials` },
        { status: 400 }
      );
    }

    // Publish content
    const result = await publisher.publish(content);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Publish failed" },
        { status: 500 }
      );
    }

    // Log the publish in content table (if we have one)
    // This would track all published content for the organization

    return NextResponse.json({
      success: true,
      cms: result.cms,
      postId: result.postId,
      url: result.url,
    });

  } catch (error) {
    console.error("CMS publish error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
