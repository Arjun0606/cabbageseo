/**
 * Content API
 * 
 * CRUD operations for content items
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// ============================================
// 🔓 TESTING MODE - AUTH BYPASS
// Set TESTING_MODE=true in .env for local testing
// ============================================
const TESTING_MODE = process.env.TESTING_MODE === "true";

interface ContentItem {
  id: string;
  site_id: string;
  title: string;
  slug: string;
  status: string;
  target_keyword: string;
  seo_score: number | null;
  aio_score: number | null;
  aio_optimized: boolean;
  entity_count: number | null;
  quotability_score: number | null;
  word_count: number;
  body: string;
  meta_title: string;
  meta_description: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  published_url: string | null;
}

// GET - List content for user's sites
export async function GET(request: NextRequest) {
  let supabase;
  try {
    supabase = TESTING_MODE ? createServiceClient() : await createClient();
  } catch (e: unknown) {
    console.error("[Content API GET] Error creating service client:", e);
    return NextResponse.json({ error: "Database service client not configured" }, { status: 500 });
  }
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  let orgId: string | null = null;

  if (TESTING_MODE) {
    // Get first org for testing
    const { data: orgs } = await supabase.from("organizations").select("id").limit(1);
    orgId = (orgs?.[0] as { id: string } | undefined)?.id || null;
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    orgId = (userData as { organization_id?: string } | null)?.organization_id || null;
  }

  if (!orgId) {
    return NextResponse.json({ success: true, data: { content: [], total: 0 } });
  }

  try {
    // Get search params
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get user's sites
    const { data: sites } = await supabase
      .from("sites")
      .select("id, domain")
      .eq("organization_id", orgId);

    if (!sites || sites.length === 0) {
      return NextResponse.json({ success: true, data: { content: [], total: 0 } });
    }

    const siteIds = (sites as { id: string }[]).map(s => s.id);
    const siteLookup = Object.fromEntries(
      (sites as { id: string; domain: string }[]).map(s => [s.id, s.domain])
    );

    // Build query
    let query = supabase
      .from("content")
      .select("*", { count: "exact" })
      .in("site_id", siteId ? [siteId] : siteIds)
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: content, count, error } = await query;

    if (error) {
      console.error("Content fetch error:", error);
      throw error;
    }

    // Add site domain to each content item and transform field names
    const contentWithSite = ((content || []) as ContentItem[]).map(item => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      status: item.status || "draft",
      keyword: item.target_keyword || "",
      seoScore: item.seo_score || 0,
      aioScore: item.aio_score || 0,
      wordCount: item.word_count || 0,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      publishedAt: item.published_at,
      publishedUrl: item.published_url,
      author: "You",
      siteDomain: siteLookup[item.site_id] || "Unknown",
    }));

    // Calculate stats
    const stats = {
      total: count || 0,
      published: contentWithSite.filter(c => c.status === "published").length,
      drafts: contentWithSite.filter(c => ["draft", "writing", "review"].includes(c.status)).length,
      ideas: contentWithSite.filter(c => c.status === "idea").length,
    };

    return NextResponse.json({
      success: true,
      data: {
        content: contentWithSite,
        stats,
      },
    });

  } catch (error) {
    console.error("[Content API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch content" },
      { status: 500 }
    );
  }
}

// POST - Create new content
export async function POST(request: NextRequest) {
  let supabase;
  try {
    supabase = TESTING_MODE ? createServiceClient() : await createClient();
  } catch (e: unknown) {
    console.error("[Content API POST] Error creating service client:", e);
    return NextResponse.json({ error: "Database service client not configured" }, { status: 500 });
  }
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  let orgId: string | null = null;

  if (TESTING_MODE) {
    const { data: orgs } = await supabase.from("organizations").select("id").limit(1);
    orgId = (orgs?.[0] as { id: string } | undefined)?.id || null;
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    orgId = (userData as { organization_id?: string } | null)?.organization_id || null;
  }

  if (!orgId) {
    return NextResponse.json({ error: "No organization found" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { siteId, title, targetKeyword, content, metaTitle, metaDescription } = body;

    if (!siteId || !title) {
      return NextResponse.json({ error: "Site ID and title are required" }, { status: 400 });
    }

    const { data: site } = await supabase
      .from("sites")
      .select("id")
      .eq("id", siteId)
      .eq("organization_id", orgId)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Generate slug
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100);

    // Calculate word count
    const wordCount = (content || "").split(/\s+/).filter(Boolean).length;

    // Create content
    const { data: newContent, error } = await supabase
      .from("content")
      .insert({
        site_id: siteId,
        title,
        slug,
        status: "draft",
        body: content || "",
        meta_title: metaTitle || title,
        meta_description: metaDescription || "",
        word_count: wordCount,
      } as never)
      .select()
      .single();

    if (error) {
      console.error("Content create error:", error);
      throw error;
    }

    return NextResponse.json({ success: true, data: newContent });

  } catch (error) {
    console.error("[Content API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create content" },
      { status: 500 }
    );
  }
}

// PATCH - Update content
export async function PATCH(request: NextRequest) {
  let supabase;
  try {
    supabase = TESTING_MODE ? createServiceClient() : await createClient();
  } catch (e: unknown) {
    console.error("[Content API PATCH] Error creating service client:", e);
    return NextResponse.json({ error: "Database service client not configured" }, { status: 500 });
  }
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  let orgId: string | null = null;

  if (TESTING_MODE) {
    const { data: orgs } = await supabase.from("organizations").select("id").limit(1);
    orgId = (orgs?.[0] as { id: string } | undefined)?.id || null;
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    orgId = (userData as { organization_id?: string } | null)?.organization_id || null;
  }

  if (!orgId) {
    return NextResponse.json({ error: "No organization found" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Content ID is required" }, { status: 400 });
    }

    // Get content with site info
    const { data: existingContent } = await supabase
      .from("content")
      .select("id, site_id")
      .eq("id", id)
      .single();

    if (!existingContent) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Verify site belongs to user's org
    const { data: site } = await supabase
      .from("sites")
      .select("id")
      .eq("id", (existingContent as { site_id: string }).site_id)
      .eq("organization_id", orgId)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Calculate word count if body changed
    if (updates.body) {
      updates.word_count = updates.body.split(/\s+/).filter(Boolean).length;
    }

    // Update content
    const { data: updatedContent, error } = await supabase
      .from("content")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Content update error:", error);
      throw error;
    }

    return NextResponse.json({ success: true, data: updatedContent });

  } catch (error) {
    console.error("[Content API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update content" },
      { status: 500 }
    );
  }
}

// DELETE - Delete content
export async function DELETE(request: NextRequest) {
  let supabase;
  try {
    supabase = TESTING_MODE ? createServiceClient() : await createClient();
  } catch (e: unknown) {
    console.error("[Content API DELETE] Error creating service client:", e);
    return NextResponse.json({ error: "Database service client not configured" }, { status: 500 });
  }
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  let orgId: string | null = null;

  if (TESTING_MODE) {
    const { data: orgs } = await supabase.from("organizations").select("id").limit(1);
    orgId = (orgs?.[0] as { id: string } | undefined)?.id || null;
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    orgId = (userData as { organization_id?: string } | null)?.organization_id || null;
  }

  if (!orgId) {
    return NextResponse.json({ error: "No organization found" }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Content ID is required" }, { status: 400 });
    }

    const { data: existingContent } = await supabase
      .from("content")
      .select("id, site_id")
      .eq("id", id)
      .single();

    if (!existingContent) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const { data: site } = await supabase
      .from("sites")
      .select("id")
      .eq("id", (existingContent as { site_id: string }).site_id)
      .eq("organization_id", orgId)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete content
    const { error } = await supabase
      .from("content")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Content delete error:", error);
      throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Content API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete content" },
      { status: 500 }
    );
  }
}

