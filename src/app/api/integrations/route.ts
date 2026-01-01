/**
 * Integrations API
 * 
 * Manages integration connections for CMS, analytics, SEO tools
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encryptCredentials, decryptCredentials } from "@/lib/security/encryption";

interface IntegrationRow {
  id: string;
  organization_id: string;
  site_id: string | null;
  type: string;
  name: string;
  status: string;
  credentials: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  last_sync_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// GET - List integrations
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const type = searchParams.get("type");

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = (userData as { organization_id?: string } | null)?.organization_id;
    if (!orgId) {
      return NextResponse.json({ success: true, data: { integrations: [] } });
    }

    // Build query
    let query = supabase
      .from("integrations")
      .select("*")
      .eq("organization_id", orgId)
      .order("name");

    if (siteId) {
      query = query.or(`site_id.eq.${siteId},site_id.is.null`);
    }

    if (type) {
      query = query.eq("type", type);
    }

    const { data: integrations, error } = await query;

    if (error) {
      console.error("Integrations fetch error:", error);
      throw error;
    }

    // Transform integrations (hide sensitive credentials)
    const transformedIntegrations = ((integrations || []) as IntegrationRow[]).map(int => ({
      id: int.id,
      type: int.type,
      name: int.name,
      category: getCategoryFromType(int.type),
      status: int.status,
      hasCredentials: !!int.credentials,
      lastSync: int.last_sync_at,
      error: int.error_message,
      siteId: int.site_id,
    }));

    // Get available integrations (those not yet connected)
    const connectedTypes = new Set(transformedIntegrations.map(i => i.type));
    const availableIntegrations = AVAILABLE_INTEGRATIONS.filter(
      i => !connectedTypes.has(i.type)
    );

    return NextResponse.json({
      success: true,
      data: {
        integrations: transformedIntegrations,
        available: availableIntegrations,
      },
    });

  } catch (error) {
    console.error("[Integrations API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch integrations" },
      { status: 500 }
    );
  }
}

// POST - Create/connect integration
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, name, credentials, siteId, settings } = body;

    if (!type) {
      return NextResponse.json({ error: "Integration type is required" }, { status: 400 });
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = (userData as { organization_id?: string } | null)?.organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // Verify site if provided
    if (siteId) {
      const { data: site } = await supabase
        .from("sites")
        .select("id")
        .eq("id", siteId)
        .eq("organization_id", orgId)
        .single();

      if (!site) {
        return NextResponse.json({ error: "Site not found" }, { status: 404 });
      }
    }

    // Encrypt credentials before storage
    const encryptedCredentials = credentials 
      ? encryptCredentials(credentials) 
      : null;

    // Create integration
    const { data: newIntegration, error } = await supabase
      .from("integrations")
      .upsert({
        organization_id: orgId,
        site_id: siteId || null,
        type,
        name: name || getDefaultName(type),
        status: credentials ? "connected" : "pending",
        credentials: encryptedCredentials,
        settings: settings || null,
      } as never, { onConflict: "organization_id,type,site_id" })
      .select()
      .single();

    if (error) {
      console.error("Integration create error:", error);
      throw error;
    }

    return NextResponse.json({ success: true, data: newIntegration });

  } catch (error) {
    console.error("[Integrations API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create integration" },
      { status: 500 }
    );
  }
}

// PATCH - Update integration
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, credentials, settings, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Integration ID is required" }, { status: 400 });
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = (userData as { organization_id?: string } | null)?.organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from("integrations")
      .select("id, organization_id")
      .eq("id", id)
      .single();

    if (!existing || (existing as { organization_id: string }).organization_id !== orgId) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (credentials !== undefined) {
      // Encrypt credentials before storage
      updates.credentials = credentials 
        ? encryptCredentials(credentials) 
        : null;
      updates.status = credentials ? "connected" : "disconnected";
    }
    if (settings !== undefined) updates.settings = settings;
    if (status !== undefined) updates.status = status;

    const { data: updatedIntegration, error } = await supabase
      .from("integrations")
      .update(updates as never)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Integration update error:", error);
      throw error;
    }

    return NextResponse.json({ success: true, data: updatedIntegration });

  } catch (error) {
    console.error("[Integrations API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update integration" },
      { status: 500 }
    );
  }
}

// DELETE - Disconnect integration
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Integration ID is required" }, { status: 400 });
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = (userData as { organization_id?: string } | null)?.organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // Delete integration (verify ownership)
    const { error } = await supabase
      .from("integrations")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgId);

    if (error) {
      console.error("Integration delete error:", error);
      throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Integrations API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete integration" },
      { status: 500 }
    );
  }
}

// Helper functions
function getCategoryFromType(type: string): string {
  const categories: Record<string, string> = {
    wordpress: "cms",
    webflow: "cms",
    shopify: "cms",
    gsc: "analytics",
    ga4: "analytics",
    openai: "ai",
  };
  return categories[type] || "other";
}

function getDefaultName(type: string): string {
  const names: Record<string, string> = {
    wordpress: "WordPress",
    webflow: "Webflow",
    shopify: "Shopify",
    gsc: "Google Search Console",
    ga4: "Google Analytics 4",
    openai: "OpenAI (GPT-5)",
  };
  return names[type] || type;
}

// CabbageSEO is 100% AI-powered - no third-party SEO tools needed
const AVAILABLE_INTEGRATIONS = [
  { type: "wordpress", name: "WordPress", category: "cms", description: "Publish content to WordPress" },
  { type: "webflow", name: "Webflow", category: "cms", description: "Publish to Webflow CMS" },
  { type: "shopify", name: "Shopify", category: "cms", description: "Manage Shopify blog" },
  { type: "gsc", name: "Google Search Console", category: "analytics", description: "Track rankings and clicks" },
  { type: "ga4", name: "Google Analytics 4", category: "analytics", description: "Track traffic" },
  { type: "openai", name: "OpenAI", category: "ai", description: "AI-powered keyword intelligence & content (required)" },
];
