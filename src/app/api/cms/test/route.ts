/**
 * CMS Connection Test API
 * POST /api/cms/test - Test CMS credentials before saving
 */

import { NextRequest, NextResponse } from "next/server";
import { createWordPressClient } from "@/lib/integrations/wordpress/client";
import { createWebflowClient } from "@/lib/integrations/webflow/client";
import { createShopifyClient } from "@/lib/integrations/shopify/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cmsType, credentials } = body as {
      cmsType: "wordpress" | "webflow" | "shopify";
      credentials: Record<string, string>;
    };

    if (!cmsType || !credentials) {
      return NextResponse.json(
        { error: "Missing cmsType or credentials" },
        { status: 400 }
      );
    }

    let result: { success: boolean; name?: string; error?: string };

    switch (cmsType) {
      case "wordpress": {
        if (!credentials.siteUrl || !credentials.username || !credentials.appPassword) {
          return NextResponse.json(
            { error: "Missing WordPress credentials: siteUrl, username, appPassword" },
            { status: 400 }
          );
        }

        const wpClient = createWordPressClient({
          siteUrl: credentials.siteUrl,
          username: credentials.username,
          applicationPassword: credentials.appPassword,
        });

        const testResult = await wpClient.testConnection();
        result = {
          success: testResult.success,
          name: testResult.siteName,
          error: testResult.error,
        };
        break;
      }

      case "webflow": {
        if (!credentials.accessToken) {
          return NextResponse.json(
            { error: "Missing Webflow credentials: accessToken" },
            { status: 400 }
          );
        }

        const wfClient = createWebflowClient({
          accessToken: credentials.accessToken,
        });

        const testResult = await wfClient.testConnection();
        
        // Also fetch sites to show available sites
        let sites: Array<{ id: string; name: string }> = [];
        if (testResult.success) {
          const siteList = await wfClient.listSites();
          sites = siteList.map(s => ({ id: s.id, name: s.displayName }));
        }

        result = {
          success: testResult.success,
          error: testResult.error,
        };

        if (result.success) {
          return NextResponse.json({
            success: true,
            message: "Webflow connected successfully",
            sites,  // Return available sites for selection
          });
        }
        break;
      }

      case "shopify": {
        if (!credentials.shopDomain || !credentials.accessToken) {
          return NextResponse.json(
            { error: "Missing Shopify credentials: shopDomain, accessToken" },
            { status: 400 }
          );
        }

        const shopifyClient = createShopifyClient({
          shopDomain: credentials.shopDomain,
          accessToken: credentials.accessToken,
        });

        const testResult = await shopifyClient.testConnection();
        
        // Also fetch blogs to show available blogs
        let blogs: Array<{ id: number; title: string }> = [];
        if (testResult.success) {
          const blogList = await shopifyClient.listBlogs();
          blogs = blogList.map(b => ({ id: b.id, title: b.title }));
        }

        result = {
          success: testResult.success,
          name: testResult.shopName,
          error: testResult.error,
        };

        if (result.success) {
          return NextResponse.json({
            success: true,
            message: `Connected to ${testResult.shopName}`,
            name: testResult.shopName,
            blogs,  // Return available blogs for selection
          });
        }
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unsupported CMS type: ${cmsType}` },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || "Connection test failed" 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${cmsType} connected successfully`,
      name: result.name,
    });

  } catch (error) {
    console.error("CMS test error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Connection test failed" 
      },
      { status: 500 }
    );
  }
}

