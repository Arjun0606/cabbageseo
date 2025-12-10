/**
 * Google Search Console API Route
 * 
 * Secure endpoint for fetching GSC data
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createGSCClient } from "@/lib/integrations/google/gsc-client";
import { protectAPI, validateRequestBody, addSecurityHeaders } from "@/lib/security/api-protection";

export async function POST(request: NextRequest) {
  // Protect endpoint
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

    // Get organization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: orgMember } = await (supabase as any)
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (!orgMember) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // Parse and validate request body
    const body = await request.json();
    const { valid, data, errors } = validateRequestBody(body, {
      action: { type: "string", required: true },
      siteUrl: { type: "string", required: false, maxLength: 500 },
      startDate: { type: "string", required: false, maxLength: 10 },
      endDate: { type: "string", required: false, maxLength: 10 },
      limit: { type: "number", required: false, min: 1, max: 1000 },
    });

    if (!valid) {
      return NextResponse.json({ error: "Invalid request", details: errors }, { status: 400 });
    }

    // Create GSC client
    const gsc = createGSCClient(orgMember.organization_id);

    // Handle different actions
    const action = data.action as string;
    let result: unknown;

    switch (action) {
      case "listSites":
        result = await gsc.listSites();
        break;

      case "topQueries":
        if (!data.siteUrl || !data.startDate || !data.endDate) {
          return NextResponse.json({ error: "siteUrl, startDate, endDate required" }, { status: 400 });
        }
        result = await gsc.getTopQueries(
          data.siteUrl as string,
          { startDate: data.startDate as string, endDate: data.endDate as string },
          (data.limit as number) || 100
        );
        break;

      case "topPages":
        if (!data.siteUrl || !data.startDate || !data.endDate) {
          return NextResponse.json({ error: "siteUrl, startDate, endDate required" }, { status: 400 });
        }
        result = await gsc.getTopPages(
          data.siteUrl as string,
          { startDate: data.startDate as string, endDate: data.endDate as string },
          (data.limit as number) || 100
        );
        break;

      case "performance":
        if (!data.siteUrl || !data.startDate || !data.endDate) {
          return NextResponse.json({ error: "siteUrl, startDate, endDate required" }, { status: 400 });
        }
        result = await gsc.getPerformanceOverTime(
          data.siteUrl as string,
          { startDate: data.startDate as string, endDate: data.endDate as string }
        );
        break;

      case "quickWins":
        if (!data.siteUrl || !data.startDate || !data.endDate) {
          return NextResponse.json({ error: "siteUrl, startDate, endDate required" }, { status: 400 });
        }
        result = await gsc.getQuickWinOpportunities(
          data.siteUrl as string,
          { startDate: data.startDate as string, endDate: data.endDate as string },
          (data.limit as number) || 50
        );
        break;

      case "summary":
        if (!data.siteUrl || !data.startDate || !data.endDate) {
          return NextResponse.json({ error: "siteUrl, startDate, endDate required" }, { status: 400 });
        }
        result = await gsc.getSummaryStats(
          data.siteUrl as string,
          { startDate: data.startDate as string, endDate: data.endDate as string }
        );
        break;

      case "countries":
        if (!data.siteUrl || !data.startDate || !data.endDate) {
          return NextResponse.json({ error: "siteUrl, startDate, endDate required" }, { status: 400 });
        }
        result = await gsc.getCountryBreakdown(
          data.siteUrl as string,
          { startDate: data.startDate as string, endDate: data.endDate as string },
          (data.limit as number) || 20
        );
        break;

      case "devices":
        if (!data.siteUrl || !data.startDate || !data.endDate) {
          return NextResponse.json({ error: "siteUrl, startDate, endDate required" }, { status: 400 });
        }
        result = await gsc.getDeviceBreakdown(
          data.siteUrl as string,
          { startDate: data.startDate as string, endDate: data.endDate as string }
        );
        break;

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const response = NextResponse.json({ success: true, data: result });
    return addSecurityHeaders(response);

  } catch (error) {
    console.error("[GSC API] Error:", error);
    
    const message = error instanceof Error ? error.message : "Internal server error";
    
    // Check for auth errors
    if (message.includes("not connected") || message.includes("expired")) {
      return NextResponse.json({ error: message, code: "AUTH_REQUIRED" }, { status: 401 });
    }
    
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

