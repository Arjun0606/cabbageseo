/**
 * CMS Content API
 * GET /api/cms/content - List content from connected CMS
 * PUT /api/cms/content - Update content in connected CMS
 * DELETE /api/cms/content - Delete content from connected CMS
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPublisherFromIntegration, type CMSType } from "@/lib/cms/publisher";

/**
 * List content from CMS
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single() as { data: { organization_id: string } | null };

    const orgId = profile?.organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const cmsType = searchParams.get("cmsType") as CMSType | null;
    const siteId = searchParams.get("siteId");
    const limit = searchParams.get("limit");
    const status = searchParams.get("status") as "draft" | "published" | "all" | null;

    if (!cmsType) {
      return NextResponse.json({ error: "cmsType is required" }, { status: 400 });
    }

    // Get credentials
    const { data: integration } = await supabase
      .from("integrations")
      .select("credentials")
      .eq("organization_id", orgId)
      .eq("type", cmsType)
      .eq("status", "active")
      .single() as { data: { credentials: Record<string, unknown> } | null };

    if (!integration) {
      return NextResponse.json(
        { error: `${cmsType} not connected` },
        { status: 400 }
      );
    }

    const credentials = integration.credentials as Record<string, string>;
    if (siteId) credentials.siteId = siteId;

    const publisher = await createPublisherFromIntegration(cmsType, credentials);
    if (!publisher) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    const content = await publisher.listContent({
      limit: limit ? parseInt(limit) : 50,
      status: status || "all",
    });

    return NextResponse.json({
      success: true,
      content,
      count: content.length,
    });

  } catch (error) {
    console.error("CMS content list error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Update content in CMS
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single() as { data: { organization_id: string } | null };

    const orgId = profile?.organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    const body = await request.json();
    const { cmsType, postId, content, siteId } = body;

    if (!cmsType || !postId || !content) {
      return NextResponse.json(
        { error: "Missing required fields: cmsType, postId, content" },
        { status: 400 }
      );
    }

    // Get credentials
    const { data: integration } = await supabase
      .from("integrations")
      .select("credentials")
      .eq("organization_id", orgId)
      .eq("type", cmsType)
      .eq("status", "active")
      .single() as { data: { credentials: Record<string, unknown> } | null };

    if (!integration) {
      return NextResponse.json(
        { error: `${cmsType} not connected` },
        { status: 400 }
      );
    }

    const credentials = integration.credentials as Record<string, string>;
    if (siteId) credentials.siteId = siteId;

    const publisher = await createPublisherFromIntegration(cmsType, credentials);
    if (!publisher) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    const result = await publisher.update(postId, content);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Update failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cms: result.cms,
      postId: result.postId,
      url: result.url,
    });

  } catch (error) {
    console.error("CMS content update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Delete content from CMS
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single() as { data: { organization_id: string } | null };

    const orgId = profile?.organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const cmsType = searchParams.get("cmsType") as CMSType | null;
    const postId = searchParams.get("postId");
    const siteId = searchParams.get("siteId");

    if (!cmsType || !postId) {
      return NextResponse.json(
        { error: "cmsType and postId are required" },
        { status: 400 }
      );
    }

    // Get credentials
    const { data: integration } = await supabase
      .from("integrations")
      .select("credentials")
      .eq("organization_id", orgId)
      .eq("type", cmsType)
      .eq("status", "active")
      .single() as { data: { credentials: Record<string, unknown> } | null };

    if (!integration) {
      return NextResponse.json(
        { error: `${cmsType} not connected` },
        { status: 400 }
      );
    }

    const credentials = integration.credentials as Record<string, string>;
    if (siteId) credentials.siteId = siteId;

    const publisher = await createPublisherFromIntegration(cmsType, credentials);
    if (!publisher) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    const success = await publisher.delete(postId);

    if (!success) {
      return NextResponse.json(
        { error: "Delete failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: postId,
    });

  } catch (error) {
    console.error("CMS content delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
