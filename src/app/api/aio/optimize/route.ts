/**
 * AIO Content Optimization API
 * 
 * Optimizes content for AI search visibility.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { contentPipeline } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      content,
      keyword,
      mode = "balanced",
      action = "optimize",
    } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (!contentPipeline.isReady()) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 503 }
      );
    }

    let result;

    switch (action) {
      case "optimize":
        // Full AIO optimization
        result = await contentPipeline.optimizeForAIO(
          content,
          keyword || "general",
          mode as "seo" | "aio" | "balanced"
        );
        return NextResponse.json({
          success: true,
          data: {
            optimizedContent: result.optimizedContent,
            usage: result.usage,
          },
        });

      case "analyze":
        // Analyze AIO readiness
        result = await contentPipeline.analyzeAIOReadiness(
          content,
          keyword || "general"
        );
        return NextResponse.json({
          success: true,
          data: {
            analysis: result.analysis,
            usage: result.usage,
          },
        });

      case "takeaways":
        // Generate key takeaways
        result = await contentPipeline.generateKeyTakeaways(
          content,
          keyword || "general"
        );
        return NextResponse.json({
          success: true,
          data: {
            takeaways: result.takeaways,
            usage: result.usage,
          },
        });

      case "quotability":
        // Improve quotability
        result = await contentPipeline.improveQuotability(content);
        return NextResponse.json({
          success: true,
          data: {
            improvedContent: result.improvedContent,
            usage: result.usage,
          },
        });

      case "entities":
        // Inject entities
        const { entities = [] } = body;
        if (!entities.length) {
          return NextResponse.json(
            { error: "Entities array is required for entity injection" },
            { status: 400 }
          );
        }
        result = await contentPipeline.injectEntities(content, entities);
        return NextResponse.json({
          success: true,
          data: {
            enhancedContent: result.enhancedContent,
            usage: result.usage,
          },
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("AIO optimization error:", error);
    return NextResponse.json(
      { error: "Failed to optimize content" },
      { status: 500 }
    );
  }
}

