/**
 * Site Crawler API Route
 * 
 * Handles crawling requests with security and rate limiting
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createCrawler, SitemapParser } from "@/lib/crawler";
import { protectAPI, validateRequestBody, addSecurityHeaders } from "@/lib/security/api-protection";

export async function POST(request: NextRequest) {
  // Protect endpoint - use SEO rate limits since crawling is resource-intensive
  const blocked = await protectAPI(request, { 
    rateLimit: "seo",
    allowedMethods: ["POST"],
  });
  if (blocked) return blocked;

  try {
    // Authenticate user
    const supabase = createServiceClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const { valid, data, errors } = validateRequestBody(body, {
      action: { type: "string", required: true },
      url: { type: "string", required: false, maxLength: 500 },
      siteId: { type: "string", required: false, maxLength: 100 },
      options: { type: "object", required: false },
    });

    if (!valid) {
      return NextResponse.json({ error: "Invalid request", details: errors }, { status: 400 });
    }

    const action = data.action as string;
    let result: unknown;

    switch (action) {
      case "crawl": {
        const url = data.url as string;
        if (!url) {
          return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        // Validate URL
        try {
          new URL(url);
        } catch {
          return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
        }

        // Create crawler with options
        const options = (data.options || {}) as Record<string, unknown>;
        const crawler = createCrawler({
          maxPages: Math.min((options.maxPages as number) || 50, 200),  // Cap at 200 pages
          maxDepth: Math.min((options.maxDepth as number) || 3, 5),     // Cap at depth 5
          delayMs: Math.max((options.delayMs as number) || 500, 300),   // Min 300ms delay
          respectRobotsTxt: true,
          followExternalLinks: false,
        });

        // Run crawl
        result = await crawler.crawl(url);
        break;
      }

      case "discoverSitemap": {
        const url = data.url as string;
        if (!url) {
          return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        result = await SitemapParser.discover(url);
        break;
      }

      case "parseSitemap": {
        const url = data.url as string;
        if (!url) {
          return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        result = await SitemapParser.parse(url);
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const response = NextResponse.json({ success: true, data: result });
    return addSecurityHeaders(response);

  } catch (error) {
    console.error("[Crawl API] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

