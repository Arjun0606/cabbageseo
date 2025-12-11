/**
 * Content Detail API
 * 
 * Get, update, or delete a specific content item
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ContentRow {
  id: string;
  site_id: string;
  title: string;
  slug: string | null;
  meta_title: string | null;
  meta_description: string | null;
  body: string | null;
  body_format: string | null;
  excerpt: string | null;
  outline: unknown;
  word_count: number | null;
  reading_time: number | null;
  seo_score: number | null;
  readability_score: number | null;
  keyword_density: number | null;
  status: string;
  published_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  internal_links: unknown[];
  suggested_internal_links: unknown[];
  schema_markup: unknown;
}

interface KeywordRow {
  keyword: string;
  search_volume: number | null;
}

// GET - Get content by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    // Get content with site verification
    const { data: content, error } = await supabase
      .from("content")
      .select(`
        *,
        sites!inner(organization_id),
        keywords(keyword, search_volume)
      `)
      .eq("id", id)
      .single();

    if (error || !content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const contentData = content as ContentRow & { sites: { organization_id: string }; keywords: KeywordRow[] };

    // Verify organization access
    if (contentData.sites.organization_id !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Build response
    const targetKeyword = contentData.keywords?.[0]?.keyword || "";
    const secondaryKeywords = contentData.keywords?.slice(1).map(k => k.keyword) || [];

    return NextResponse.json({
      success: true,
      data: {
        id: contentData.id,
        siteId: contentData.site_id,
        title: contentData.title,
        slug: contentData.slug,
        metaTitle: contentData.meta_title,
        metaDescription: contentData.meta_description,
        content: contentData.body,
        contentFormat: contentData.body_format || "markdown",
        excerpt: contentData.excerpt,
        outline: contentData.outline,
        targetKeyword,
        secondaryKeywords,
        wordCount: contentData.word_count || 0,
        readingTime: contentData.reading_time || 0,
        seoScore: contentData.seo_score || 0,
        readabilityScore: contentData.readability_score || 0,
        keywordDensity: contentData.keyword_density,
        status: contentData.status,
        publishedUrl: contentData.published_url,
        publishedAt: contentData.published_at,
        createdAt: contentData.created_at,
        updatedAt: contentData.updated_at,
        internalLinks: contentData.internal_links || [],
        suggestedInternalLinks: contentData.suggested_internal_links || [],
        schemaMarkup: contentData.schema_markup,
      },
    });

  } catch (error) {
    console.error("[Content Detail API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch content" },
      { status: 500 }
    );
  }
}

// PUT - Update content
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    const { title, content, metaTitle, metaDescription, slug, status, excerpt } = body;

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

    // Verify content ownership
    const { data: existing } = await supabase
      .from("content")
      .select("id, sites!inner(organization_id)")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const existingData = existing as { id: string; sites: { organization_id: string } };
    if (existingData.sites.organization_id !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updates.title = title;
    if (content !== undefined) {
      updates.body = content;
      updates.word_count = content.split(/\s+/).filter(Boolean).length;
      updates.reading_time = Math.ceil(updates.word_count as number / 200);
    }
    if (metaTitle !== undefined) updates.meta_title = metaTitle;
    if (metaDescription !== undefined) updates.meta_description = metaDescription;
    if (slug !== undefined) updates.slug = slug;
    if (status !== undefined) updates.status = status;
    if (excerpt !== undefined) updates.excerpt = excerpt;

    const { data: updatedContent, error } = await supabase
      .from("content")
      .update(updates as never)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: updatedContent });

  } catch (error) {
    console.error("[Content Detail API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update content" },
      { status: 500 }
    );
  }
}

// DELETE - Delete content
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    // Verify ownership and delete
    const { data: existing } = await supabase
      .from("content")
      .select("id, sites!inner(organization_id)")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const existingData = existing as { id: string; sites: { organization_id: string } };
    if (existingData.sites.organization_id !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { error } = await supabase
      .from("content")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Content Detail API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete content" },
      { status: 500 }
    );
  }
}

