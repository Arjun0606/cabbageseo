/**
 * Technical SEO Audit API Route
 * 
 * Handles audit requests and fix generation
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createAuditEngine, createAutoFixEngine, CrawlResult, AuditResult } from "@/lib/crawler";
import { protectAPI, validateRequestBody, addSecurityHeaders } from "@/lib/security/api-protection";
import { requireSubscription } from "@/lib/api/require-subscription";
import { requireUsageLimit, incrementUsage } from "@/lib/api/check-usage";

export async function POST(request: NextRequest) {
  // Protect endpoint
  const blocked = await protectAPI(request, { 
    rateLimit: "seo",
    allowedMethods: ["POST"],
  });
  if (blocked) return blocked;

  try {
    // Authenticate user and check subscription
    const supabase = createServiceClient();
    const subscription = await requireSubscription(supabase);
    
    if (!subscription.authorized) {
      return subscription.error!;
    }

    const organizationId = subscription.organizationId!;
    const plan = subscription.plan || "starter";

    // Check usage limits for audits
    const usageCheck = await requireUsageLimit(supabase, organizationId, plan, "audits");
    if (!usageCheck.allowed) {
      return NextResponse.json({
        error: usageCheck.error.message,
        code: usageCheck.error.code,
        usage: { current: usageCheck.error.current, limit: usageCheck.error.limit },
        upgradeUrl: "/pricing",
      }, { status: 402 });
    }

    // Parse and validate request body
    const body = await request.json();
    const { valid, data, errors } = validateRequestBody(body, {
      action: { type: "string", required: true },
      crawlResult: { type: "object", required: false },
      auditResult: { type: "object", required: false },
    });

    if (!valid) {
      return NextResponse.json({ error: "Invalid request", details: errors }, { status: 400 });
    }

    const action = data.action as string;
    let result: unknown;

    switch (action) {
      case "audit": {
        const crawlResult = data.crawlResult as CrawlResult;
        if (!crawlResult || !crawlResult.pages) {
          return NextResponse.json({ error: "Crawl result is required" }, { status: 400 });
        }

        // Run technical audit
        const auditEngine = createAuditEngine();
        result = auditEngine.audit(crawlResult);
        break;
      }

      case "generateFixes": {
        const crawlResult = data.crawlResult as CrawlResult;
        const auditResult = data.auditResult as AuditResult;
        
        if (!crawlResult || !auditResult) {
          return NextResponse.json({ 
            error: "Both crawlResult and auditResult are required" 
          }, { status: 400 });
        }

        // Generate fix suggestions
        const fixEngine = createAutoFixEngine();
        result = fixEngine.generateFixes(auditResult, crawlResult.pages);
        break;
      }

      case "generateBulkFixes": {
        const crawlResult = data.crawlResult as CrawlResult;
        const auditResult = data.auditResult as AuditResult;
        
        if (!crawlResult || !auditResult) {
          return NextResponse.json({ 
            error: "Both crawlResult and auditResult are required" 
          }, { status: 400 });
        }

        // Generate bulk fixes
        const fixEngine = createAutoFixEngine();
        result = fixEngine.generateBulkFixes(auditResult, crawlResult.pages);
        break;
      }

      case "generateInternalLinks": {
        const crawlResult = data.crawlResult as CrawlResult;
        if (!crawlResult || !crawlResult.pages) {
          return NextResponse.json({ error: "Crawl result is required" }, { status: 400 });
        }

        // Generate internal link suggestions
        const fixEngine = createAutoFixEngine();
        result = fixEngine.generateInternalLinkSuggestions(crawlResult.pages);
        break;
      }

      case "generateContentSuggestions": {
        const crawlResult = data.crawlResult as CrawlResult;
        if (!crawlResult || !crawlResult.pages) {
          return NextResponse.json({ error: "Crawl result is required" }, { status: 400 });
        }

        // Generate content suggestions
        const fixEngine = createAutoFixEngine();
        result = fixEngine.generateContentSuggestions(crawlResult.pages);
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    // Increment usage counter for audit actions
    if (action === "audit") {
      try {
        await incrementUsage(supabase, organizationId, "audits", 1);
        console.log(`[Audit API] Usage incremented for org ${organizationId}`);
      } catch (usageError) {
        console.warn("[Audit API] Failed to increment usage:", usageError);
      }
    }

    const response = NextResponse.json({ success: true, data: result });
    return addSecurityHeaders(response);

  } catch (error) {
    console.error("[Audit API] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

