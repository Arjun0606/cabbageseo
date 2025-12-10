/**
 * CMS Sites/Blogs API
 * GET /api/cms/sites - List available sites/blogs from connected CMS
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createWebflowClient } from "@/lib/integrations/webflow/client";
import { createShopifyClient } from "@/lib/integrations/shopify/client";
import { createWordPressClient } from "@/lib/integrations/wordpress/client";

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
    const cmsType = searchParams.get("cmsType");

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

    switch (cmsType) {
      case "wordpress": {
        const wpClient = createWordPressClient({
          siteUrl: credentials.siteUrl,
          username: credentials.username,
          applicationPassword: credentials.appPassword,
        });

        const [categories, pages] = await Promise.all([
          wpClient.listCategories(),
          wpClient.listPages({ perPage: 50 }),
        ]);

        return NextResponse.json({
          success: true,
          cms: "wordpress",
          data: {
            categories: categories.map(c => ({ id: c.id, name: c.name, slug: c.slug })),
            pages: pages.map(p => ({ 
              id: p.id, 
              title: p.title.rendered,
              slug: p.slug,
              link: p.link 
            })),
          },
        });
      }

      case "webflow": {
        const wfClient = createWebflowClient({
          accessToken: credentials.accessToken,
        });

        const sites = await wfClient.listSites();
        
        // For each site, get collections
        const sitesWithCollections = await Promise.all(
          sites.map(async (site) => {
            const collections = await wfClient.listCollections(site.id);
            const blogCollection = collections.find(
              c => 
                c.displayName.toLowerCase().includes("blog") ||
                c.displayName.toLowerCase().includes("post") ||
                c.slug.includes("blog")
            );

            return {
              id: site.id,
              name: site.displayName,
              url: site.previewUrl,
              customDomains: site.customDomains.map(d => d.url),
              collections: collections.map(c => ({
                id: c.id,
                name: c.displayName,
                slug: c.slug,
              })),
              blogCollectionId: blogCollection?.id,
            };
          })
        );

        return NextResponse.json({
          success: true,
          cms: "webflow",
          data: {
            sites: sitesWithCollections,
          },
        });
      }

      case "shopify": {
        const shopifyClient = createShopifyClient({
          shopDomain: credentials.shopDomain,
          accessToken: credentials.accessToken,
        });

        const [blogs, pages] = await Promise.all([
          shopifyClient.listBlogs(),
          shopifyClient.listPages({ limit: 50 }),
        ]);

        return NextResponse.json({
          success: true,
          cms: "shopify",
          data: {
            blogs: blogs.map(b => ({ 
              id: b.id, 
              title: b.title, 
              handle: b.handle 
            })),
            pages: pages.map(p => ({ 
              id: p.id, 
              title: p.title, 
              handle: p.handle 
            })),
          },
        });
      }

      default:
        return NextResponse.json(
          { error: `Unsupported CMS type: ${cmsType}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error("CMS sites error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
