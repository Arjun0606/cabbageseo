import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSubscription } from "@/lib/api/require-subscription";
import { createWordPressClient } from "@/lib/integrations/wordpress/client";

export async function POST(request: NextRequest) {
  try {
    // Authentication and subscription check
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const subscription = await requireSubscription(supabase);
    if (!subscription.authorized) {
      return subscription.error!;
    }

    const body = await request.json();
    const {
      // siteId, // TODO: Use for tracking
      // contentId, // TODO: Use for tracking
      title,
      content,
      metaTitle,
      metaDescription,
      slug,
      excerpt,
      categories,
      tags,
      featuredImageUrl,
      status = "draft",
      cmsCredentials,
    } = body;

    if (!cmsCredentials?.siteUrl || !cmsCredentials?.username || !cmsCredentials?.applicationPassword) {
      return NextResponse.json(
        { error: "WordPress credentials are required" },
        { status: 400 }
      );
    }

    // Create WordPress client
    const wp = createWordPressClient({
      siteUrl: cmsCredentials.siteUrl,
      username: cmsCredentials.username,
      applicationPassword: cmsCredentials.applicationPassword,
    });

    // Test connection
    const connected = await wp.testConnection();
    if (!connected) {
      return NextResponse.json(
        { error: "Failed to connect to WordPress. Check your credentials." },
        { status: 401 }
      );
    }

    // Publish content using the correct method
    const result = await wp.publishWithSEO({
      title,
      content,
      slug,
      excerpt,
      categoryNames: categories,
      tagNames: tags,
      featuredImageUrl,
      status: status as "publish" | "draft",
      seoMeta: {
        title: metaTitle,
        description: metaDescription,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to publish" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      postId: result.postId,
      url: result.url,
      message: status === "publish" 
        ? "Content published successfully" 
        : "Content saved as draft",
    });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { error: "Failed to publish content" },
      { status: 500 }
    );
  }
}

