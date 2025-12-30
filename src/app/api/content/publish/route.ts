/**
 * Content Publishing API
 * POST /api/content/publish
 * 
 * Publishes content to the site's connected CMS
 * Uses site-specific integrations from the database
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSubscription } from "@/lib/api/require-subscription";
import { createWordPressClient } from "@/lib/integrations/wordpress/client";
import { createWebflowClient } from "@/lib/integrations/webflow/client";
import { createShopifyClient } from "@/lib/integrations/shopify/client";
import { createGhostClient } from "@/lib/integrations/ghost/client";
import { createNotionClient } from "@/lib/integrations/notion/client";
import { createHubSpotClient } from "@/lib/integrations/hubspot/client";
import { createFramerClient } from "@/lib/integrations/framer/client";
import { createWebhookClient } from "@/lib/integrations/webhooks/client";
import { decryptCredentials } from "@/lib/security/encryption";

interface IntegrationRow {
  id: string;
  type: string;
  credentials: string | null;
  settings: Record<string, unknown> | null;
  site_id: string | null;
}

interface ContentRow {
  id: string;
  site_id: string;
  title: string;
  body: string;
  meta_title: string | null;
  meta_description: string | null;
  slug: string | null;
  status: string;
}

interface SiteRow {
  id: string;
  domain: string;
  organization_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const subscription = await requireSubscription(supabase);
    if (!subscription.authorized || !subscription.organizationId) {
      return subscription.error!;
    }

    const body = await request.json();
    const {
      contentId,
      siteId,
      cmsType, // 'wordpress' | 'webflow' | 'shopify'
      status = "draft",
      // Optional overrides
      title,
      content,
      metaTitle,
      metaDescription,
      slug,
      categories,
      tags,
    } = body;

    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    // Verify site ownership
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("id, domain, organization_id")
      .eq("id", siteId)
      .eq("organization_id", subscription.organizationId)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const siteData = site as SiteRow;

    // Get content if contentId provided
    let contentData: ContentRow | null = null;
    if (contentId) {
      const { data, error } = await supabase
        .from("content")
        .select("id, site_id, title, body, meta_title, meta_description, slug, status")
        .eq("id", contentId)
        .eq("site_id", siteId)
        .single();
      
      if (error || !data) {
        return NextResponse.json({ error: "Content not found" }, { status: 404 });
      }
      contentData = data as ContentRow;
    }

    // Get the site's CMS integration
    const targetCmsType = cmsType || "wordpress"; // Default to WordPress
    
    // First try site-specific integration, then fall back to org-wide
    let integration: IntegrationRow | null = null;
    
    // Try site-specific
    const { data: siteIntegration } = await supabase
      .from("integrations")
      .select("id, type, credentials, settings, site_id")
      .eq("organization_id", subscription.organizationId)
      .eq("site_id", siteId)
      .eq("type", targetCmsType)
      .eq("status", "connected")
      .single();
    
    if (siteIntegration) {
      integration = siteIntegration as IntegrationRow;
    } else {
      // Fall back to org-wide integration
      const { data: orgIntegration } = await supabase
        .from("integrations")
        .select("id, type, credentials, settings, site_id")
        .eq("organization_id", subscription.organizationId)
        .is("site_id", null)
        .eq("type", targetCmsType)
        .eq("status", "connected")
        .single();
      
      if (orgIntegration) {
        integration = orgIntegration as IntegrationRow;
      }
    }

    if (!integration || !integration.credentials) {
      return NextResponse.json({ 
        error: `No ${targetCmsType} integration found for this site. Please connect ${targetCmsType} in Settings → Integrations.`,
        needsIntegration: true,
        cmsType: targetCmsType,
      }, { status: 400 });
    }

    // Decrypt credentials
    let credentials: Record<string, string>;
    try {
      credentials = decryptCredentials(integration.credentials);
    } catch (e) {
      console.error("Failed to decrypt credentials:", e);
      return NextResponse.json({ error: "Invalid integration credentials" }, { status: 500 });
    }

    // Prepare content for publishing
    const publishTitle = title || contentData?.title || "Untitled";
    const publishContent = content || contentData?.body || "";
    const publishSlug = slug || contentData?.slug || publishTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const publishMetaTitle = metaTitle || contentData?.meta_title || publishTitle;
    const publishMetaDescription = metaDescription || contentData?.meta_description || "";

    let result: { success: boolean; postId?: string | number; url?: string; error?: string };

    // Publish based on CMS type
    switch (targetCmsType) {
      case "wordpress": {
        const wp = createWordPressClient({
          siteUrl: credentials.siteUrl,
          username: credentials.username,
          applicationPassword: credentials.applicationPassword,
        });

        const connected = await wp.testConnection();
        if (!connected) {
          return NextResponse.json({ 
            error: "Failed to connect to WordPress. Please check your credentials.",
          }, { status: 401 });
        }

        result = await wp.publishWithSEO({
          title: publishTitle,
          content: publishContent,
          slug: publishSlug,
          categoryNames: categories || [],
          tagNames: tags || [],
          status: status as "publish" | "draft",
          seoMeta: {
            title: publishMetaTitle,
            description: publishMetaDescription,
          },
        });
        break;
      }

      case "webflow": {
        const webflow = createWebflowClient({
          accessToken: credentials.accessToken,
        });

        const connected = await webflow.testConnection();
        if (!connected) {
          return NextResponse.json({ 
            error: "Failed to connect to Webflow. Please check your credentials.",
          }, { status: 401 });
        }

        // Get the collection ID from settings
        const collectionId = (integration.settings?.collectionId || credentials.collectionId) as string;

        if (!collectionId) {
          return NextResponse.json({ 
            error: "Webflow collection not configured. Please update your integration settings.",
          }, { status: 400 });
        }

        const webflowResult = await webflow.createItem(collectionId, {
          fieldData: {
            name: publishTitle,
            slug: publishSlug,
            "post-body": publishContent,
            "seo-title": publishMetaTitle,
            "meta-description": publishMetaDescription,
          },
          isDraft: status !== "publish",
        }, status === "publish");
        
        result = {
          success: webflowResult.success,
          postId: webflowResult.itemId,
          url: webflowResult.url,
          error: webflowResult.error,
        };
        break;
      }

      case "shopify": {
        const shopify = createShopifyClient({
          shopDomain: credentials.shopDomain,
          accessToken: credentials.accessToken,
        });

        const connected = await shopify.testConnection();
        if (!connected) {
          return NextResponse.json({ 
            error: "Failed to connect to Shopify. Please check your credentials.",
          }, { status: 401 });
        }

        // Get blog ID from settings or find main blog
        let blogId = (integration.settings?.blogId || credentials.blogId) as number;
        if (!blogId) {
          const mainBlog = await shopify.findMainBlog();
          if (!mainBlog) {
            return NextResponse.json({ 
              error: "No Shopify blog found. Please create a blog first.",
            }, { status: 400 });
          }
          blogId = mainBlog.id;
        }

        const shopifyResult = await shopify.createArticle(blogId, {
          title: publishTitle,
          body_html: publishContent,
          author: "CabbageSEO",
          handle: publishSlug,
          published_at: status === "publish" ? new Date().toISOString() : null,
          summary_html: publishMetaDescription,
        });
        
        result = {
          success: shopifyResult.success,
          postId: shopifyResult.articleId,
          url: shopifyResult.url,
          error: shopifyResult.error,
        };
        break;
      }

      case "ghost": {
        const ghost = createGhostClient({
          apiUrl: credentials.apiUrl,
          adminApiKey: credentials.adminApiKey,
        });

        const connected = await ghost.testConnection();
        if (!connected) {
          return NextResponse.json({ 
            error: "Failed to connect to Ghost. Please check your credentials.",
          }, { status: 401 });
        }

        const ghostResult = await ghost.publishWithSEO({
          title: publishTitle,
          content: publishContent,
          slug: publishSlug,
          excerpt: publishMetaDescription,
          status: status === "publish" ? "published" : "draft",
          tags: tags || [],
          seoMeta: {
            title: publishMetaTitle,
            description: publishMetaDescription,
          },
        });
        
        result = {
          success: ghostResult.success,
          postId: ghostResult.postId,
          url: ghostResult.url,
          error: ghostResult.error,
        };
        break;
      }

      case "notion": {
        const notion = createNotionClient({
          integrationToken: credentials.integrationToken,
          databaseId: credentials.databaseId,
        });

        const connected = await notion.testConnection();
        if (!connected) {
          return NextResponse.json({ 
            error: "Failed to connect to Notion. Please check your credentials.",
          }, { status: 401 });
        }

        const notionResult = await notion.publishWithSEO({
          title: publishTitle,
          content: publishContent,
          slug: publishSlug,
          excerpt: publishMetaDescription,
          status: status === "publish" ? "published" : "draft",
          tags: tags || [],
          seoMeta: {
            title: publishMetaTitle,
            description: publishMetaDescription,
          },
        });
        
        result = {
          success: notionResult.success,
          postId: notionResult.pageId,
          url: notionResult.url,
          error: notionResult.error,
        };
        break;
      }

      case "hubspot": {
        const hubspot = createHubSpotClient({
          accessToken: credentials.accessToken,
        });

        const connected = await hubspot.testConnection();
        if (!connected) {
          return NextResponse.json({ 
            error: "Failed to connect to HubSpot. Please check your credentials.",
          }, { status: 401 });
        }

        const hubspotResult = await hubspot.publishWithSEO({
          title: publishTitle,
          content: publishContent,
          slug: publishSlug,
          excerpt: publishMetaDescription,
          status: status === "publish" ? "published" : "draft",
          seoMeta: {
            title: publishMetaTitle,
            description: publishMetaDescription,
          },
        });
        
        result = {
          success: hubspotResult.success,
          postId: hubspotResult.postId,
          url: hubspotResult.url,
          error: hubspotResult.error,
        };
        break;
      }

      case "framer": {
        const framer = createFramerClient({
          projectId: credentials.projectId,
          accessToken: credentials.accessToken,
        });

        const connected = await framer.testConnection();
        if (!connected) {
          return NextResponse.json({ 
            error: "Failed to connect to Framer. Please check your credentials.",
          }, { status: 401 });
        }

        const framerResult = await framer.publishWithSEO({
          title: publishTitle,
          content: publishContent,
          slug: publishSlug,
          excerpt: publishMetaDescription,
          status: status === "publish" ? "published" : "draft",
          seoMeta: {
            title: publishMetaTitle,
            description: publishMetaDescription,
          },
        });
        
        result = {
          success: framerResult.success,
          postId: framerResult.itemId,
          url: framerResult.url,
          error: framerResult.error,
        };
        break;
      }

      case "webhook": {
        const webhook = createWebhookClient({
          webhookUrl: credentials.webhookUrl,
          secretKey: credentials.secretKey,
        });

        const connected = await webhook.testConnection();
        if (!connected) {
          return NextResponse.json({ 
            error: "Failed to connect to webhook endpoint. Please check your URL.",
          }, { status: 401 });
        }

        const webhookResult = await webhook.publishContent({
          title: publishTitle,
          content: publishContent,
          slug: publishSlug,
          excerpt: publishMetaDescription,
          status: status === "publish" ? "published" : "draft",
          tags: tags || [],
          seoMeta: {
            title: publishMetaTitle,
            description: publishMetaDescription,
          },
        });
        
        result = {
          success: webhookResult.success,
          error: webhookResult.error,
        };
        break;
      }

      default:
        return NextResponse.json({ 
          error: `Unsupported CMS type: ${targetCmsType}`,
        }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || "Failed to publish content",
      }, { status: 500 });
    }

    // Update content status in database
    if (contentId) {
      await supabase
        .from("content")
        .update({
          status: status === "publish" ? "published" : "draft",
          published_at: status === "publish" ? new Date().toISOString() : null,
          publisher: targetCmsType,
          published_url: result.url || null,
          external_id: result.postId?.toString() || null,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", contentId);
    }

    return NextResponse.json({
      success: true,
      postId: result.postId,
      url: result.url,
      cmsType: targetCmsType,
      siteDomain: siteData.domain,
      message: status === "publish" 
        ? `Content published to ${targetCmsType}` 
        : `Content saved as draft in ${targetCmsType}`,
    });

  } catch (error) {
    console.error("[Content Publish] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to publish content" },
      { status: 500 }
    );
  }
}
