/**
 * AIO Analysis API Endpoint
 * 
 * Analyzes a page or content for AI visibility across all platforms.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAIOAnalyzer } from "@/lib/aio";
import type { AIOAnalysisInput } from "@/lib/aio/types";
import { requireSubscription } from "@/lib/api/require-subscription";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check subscription - AIO analysis is a paid feature
    const subscription = await requireSubscription(supabase);
    
    if (!subscription.authorized) {
      return subscription.error!;
    }

    const organizationId = subscription.organizationId!;

    const body = await request.json();
    const { 
      pageId,
      contentId,
      url,
      content,
      htmlContent,
      title,
      metaDescription,
      headings,
      publishedAt,
      lastModified,
      saveToDB = true,
    } = body;

    // Validate input
    if (!content && !pageId && !contentId) {
      return NextResponse.json(
        { error: "Either content, pageId, or contentId is required" },
        { status: 400 }
      );
    }

    let analysisInput: AIOAnalysisInput;

    // If pageId provided, fetch page data
    if (pageId) {
      const { data: pageData } = await supabase
        .from("pages")
        .select(`
          *,
          sites!inner(organization_id)
        `)
        .eq("id", pageId)
        .eq("sites.organization_id", organizationId)
        .single();

      const page = pageData as {
        url: string;
        title?: string;
        meta_description?: string;
        headings?: { level: number; text: string }[];
        word_count?: number;
      } | null;

      if (!page) {
        return NextResponse.json({ error: "Page not found" }, { status: 404 });
      }

      // We need to fetch the actual content - for now use what we have
      analysisInput = {
        url: page.url,
        title: page.title || "",
        content: content || "", // Would need to re-fetch or have cached
        htmlContent: htmlContent,
        metaDescription: page.meta_description || undefined,
        headings: page.headings || undefined,
        wordCount: page.word_count || undefined,
      };
    } 
    // If contentId provided, fetch content data
    else if (contentId) {
      const { data: contentDataRaw } = await supabase
        .from("content")
        .select(`
          *,
          sites!inner(organization_id)
        `)
        .eq("id", contentId)
        .eq("sites.organization_id", organizationId)
        .single();

      const contentItem = contentDataRaw as {
        published_url?: string;
        title: string;
        body?: string;
        meta_description?: string;
        word_count?: number;
        published_at?: string;
      } | null;

      if (!contentItem) {
        return NextResponse.json({ error: "Content not found" }, { status: 404 });
      }

      analysisInput = {
        url: contentItem.published_url || "",
        title: contentItem.title,
        content: contentItem.body || "",
        metaDescription: contentItem.meta_description || undefined,
        wordCount: contentItem.word_count || undefined,
        publishedAt: contentItem.published_at ? new Date(contentItem.published_at) : undefined,
      };
    }
    // Direct content analysis
    else {
      analysisInput = {
        url: url || "",
        title: title || "",
        content,
        htmlContent,
        metaDescription,
        headings,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        lastModified: lastModified ? new Date(lastModified) : undefined,
      };
    }

    // Run AIO analysis
    const analyzer = createAIOAnalyzer();
    const result = await analyzer.analyze(analysisInput);

    // Save to database if requested and we have a pageId
    if (saveToDB && pageId) {
      // Update page with AIO scores
      await supabase
        .from("pages")
        .update({
          aio_score: result.scores.combined,
          aio_google_score: result.scores.platforms.google_aio,
          aio_chatgpt_score: result.scores.platforms.chatgpt,
          aio_perplexity_score: result.scores.platforms.perplexity,
          aio_bing_score: result.scores.platforms.bing_copilot,
          aio_last_analyzed: new Date().toISOString(),
          entity_count: result.entities.length,
          quotability_score: result.quotabilityScore,
          answer_structure_score: result.answerStructureScore,
        } as never)
        .eq("id", pageId);

      // Get site_id from page
      const { data: pageDataForSite } = await supabase
        .from("pages")
        .select("site_id")
        .eq("id", pageId)
        .single();

      const pageForAnalysis = pageDataForSite as { site_id: string } | null;
      if (pageForAnalysis) {
        // Save detailed analysis
        await supabase
          .from("aio_analyses")
          .insert({
            site_id: pageForAnalysis.site_id,
            page_id: pageId,
            google_aio_score: result.scores.platforms.google_aio,
            chatgpt_score: result.scores.platforms.chatgpt,
            perplexity_score: result.scores.platforms.perplexity,
            bing_copilot_score: result.scores.platforms.bing_copilot,
            combined_score: result.scores.combined,
            entity_density_score: result.scores.breakdown.entityDensity,
            quotability_score: result.scores.breakdown.quotability,
            answer_structure_score: result.scores.breakdown.answerStructure,
            schema_presence_score: result.scores.breakdown.schemaPresence,
            freshness_score: result.scores.breakdown.freshness,
            authority_score: result.scores.breakdown.authority,
            entities_found: result.entities,
            quotable_snippets: result.quotableSnippets,
            missing_elements: result.missingElements,
            improvement_suggestions: result.recommendations,
            google_recommendations: result.platformScores.find(p => p.platform === "google_aio")?.recommendations || [],
            chatgpt_recommendations: result.platformScores.find(p => p.platform === "chatgpt")?.recommendations || [],
            perplexity_recommendations: result.platformScores.find(p => p.platform === "perplexity")?.recommendations || [],
            model_used: result.modelUsed,
            analysis_duration_ms: result.analysisDurationMs,
          } as never);

        // Save entities
        if (result.entities.length > 0) {
          const entityRecords = result.entities.slice(0, 20).map(entity => ({
            site_id: pageForAnalysis.site_id,
            page_id: pageId,
            name: entity.name,
            type: entity.type,
            mentions: entity.mentions,
            context_quality: entity.contextQuality,
            wikidata_id: entity.wikidataId || null,
            wikipedia_url: entity.wikipediaUrl || null,
          }));

          // Upsert entities (update if exists, insert if not)
          for (const entity of entityRecords) {
            await supabase
              .from("entities")
              .upsert(entity as never, {
                onConflict: "site_id,page_id,name",
                ignoreDuplicates: false,
              });
          }
        }
      }
    }

    // Save to content table if contentId provided
    if (saveToDB && contentId) {
      await supabase
        .from("content")
        .update({
          aio_score: result.scores.combined,
          entity_count: result.entities.length,
          quotability_score: result.quotabilityScore,
          answer_structure_score: result.answerStructureScore,
          aio_optimized: true,
        } as never)
        .eq("id", contentId);
    }

    return NextResponse.json({
      success: true,
      data: {
        scores: result.scores,
        platformScores: result.platformScores.map(p => ({
          platform: p.platform,
          score: p.score,
          factors: p.factors,
          recommendationCount: p.recommendations.length,
        })),
        entities: result.entities.slice(0, 10),
        entityDensity: result.entityDensity,
        quotabilityScore: result.quotabilityScore,
        answerStructureScore: result.answerStructureScore,
        contentStructure: result.contentStructure,
        missingElements: result.missingElements,
        recommendations: result.recommendations.slice(0, 10),
        analyzedAt: result.analyzedAt,
        analysisDurationMs: result.analysisDurationMs,
      },
    });
  } catch (error) {
    console.error("AIO analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze content" },
      { status: 500 }
    );
  }
}

/**
 * GET - Fetch existing AIO analysis for a page
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: userDataGet } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = (userDataGet as { organization_id?: string } | null)?.organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get("pageId");
    const siteId = searchParams.get("siteId");

    if (pageId) {
      // Get specific page analysis
      const { data: analysis } = await supabase
        .from("aio_analyses")
        .select("*")
        .eq("page_id", pageId)
        .order("analyzed_at", { ascending: false })
        .limit(1)
        .single();

      if (!analysis) {
        return NextResponse.json({ error: "No analysis found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: analysis,
      });
    }

    if (siteId) {
      // Get site-wide AIO stats
      // Note: Database may have legacy claude/gemini columns, but we only use supported platforms now
      const { data: pagesRaw } = await supabase
        .from("pages")
        .select("aio_score, aio_google_score, aio_chatgpt_score, aio_perplexity_score")
        .eq("site_id", siteId)
        .not("aio_score", "is", null);

      type AIOPageScore = {
        aio_score: number | null;
        aio_google_score: number | null;
        aio_chatgpt_score: number | null;
        aio_perplexity_score: number | null;
      };
      const pages = (pagesRaw || []) as AIOPageScore[];

      if (pages.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            averageScore: null,
            pagesAnalyzed: 0,
            platformAverages: {},
          },
        });
      }

      const averages = {
        combined: Math.round(pages.reduce((s, p) => s + (p.aio_score || 0), 0) / pages.length),
        google_aio: Math.round(pages.reduce((s, p) => s + (p.aio_google_score || 0), 0) / pages.length),
        chatgpt: Math.round(pages.reduce((s, p) => s + (p.aio_chatgpt_score || 0), 0) / pages.length),
        perplexity: Math.round(pages.reduce((s, p) => s + (p.aio_perplexity_score || 0), 0) / pages.length),
        bing_copilot: 0, // Will be populated when we add bing_copilot column to DB
      };

      return NextResponse.json({
        success: true,
        data: {
          averageScore: averages.combined,
          pagesAnalyzed: pages.length,
          platformAverages: averages,
        },
      });
    }

    return NextResponse.json(
      { error: "Either pageId or siteId is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("AIO fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch AIO data" },
      { status: 500 }
    );
  }
}

