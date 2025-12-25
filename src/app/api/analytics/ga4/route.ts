/**
 * Google Analytics 4 API Route
 * 
 * Secure endpoint for fetching GA4 data
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createGA4Client } from "@/lib/integrations/google/ga4-client";
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
      propertyId: { type: "string", required: false, maxLength: 50 },
      startDate: { type: "string", required: false, maxLength: 20 },
      endDate: { type: "string", required: false, maxLength: 20 },
      limit: { type: "number", required: false, min: 1, max: 1000 },
    });

    if (!valid) {
      return NextResponse.json({ error: "Invalid request", details: errors }, { status: 400 });
    }

    // Create GA4 client
    const ga4 = createGA4Client(orgMember.organization_id);

    // Handle different actions
    const action = data.action as string;
    let result: unknown;

    switch (action) {
      case "listProperties":
        result = await ga4.listProperties();
        break;

      case "overview":
        if (!data.propertyId || !data.startDate || !data.endDate) {
          return NextResponse.json({ error: "propertyId, startDate, endDate required" }, { status: 400 });
        }
        result = await ga4.getTrafficOverview(
          data.propertyId as string,
          { startDate: data.startDate as string, endDate: data.endDate as string }
        );
        break;

      case "trafficOverTime":
        if (!data.propertyId || !data.startDate || !data.endDate) {
          return NextResponse.json({ error: "propertyId, startDate, endDate required" }, { status: 400 });
        }
        result = await ga4.getTrafficOverTime(
          data.propertyId as string,
          { startDate: data.startDate as string, endDate: data.endDate as string }
        );
        break;

      case "topPages":
        if (!data.propertyId || !data.startDate || !data.endDate) {
          return NextResponse.json({ error: "propertyId, startDate, endDate required" }, { status: 400 });
        }
        result = await ga4.getTopPages(
          data.propertyId as string,
          { startDate: data.startDate as string, endDate: data.endDate as string },
          (data.limit as number) || 20
        );
        break;

      case "trafficSources":
        if (!data.propertyId || !data.startDate || !data.endDate) {
          return NextResponse.json({ error: "propertyId, startDate, endDate required" }, { status: 400 });
        }
        result = await ga4.getTrafficSources(
          data.propertyId as string,
          { startDate: data.startDate as string, endDate: data.endDate as string },
          (data.limit as number) || 10
        );
        break;

      case "organicTraffic":
        if (!data.propertyId || !data.startDate || !data.endDate) {
          return NextResponse.json({ error: "propertyId, startDate, endDate required" }, { status: 400 });
        }
        result = await ga4.getOrganicTraffic(
          data.propertyId as string,
          { startDate: data.startDate as string, endDate: data.endDate as string }
        );
        break;

      case "devices":
        if (!data.propertyId || !data.startDate || !data.endDate) {
          return NextResponse.json({ error: "propertyId, startDate, endDate required" }, { status: 400 });
        }
        result = await ga4.getDeviceBreakdown(
          data.propertyId as string,
          { startDate: data.startDate as string, endDate: data.endDate as string }
        );
        break;

      case "countries":
        if (!data.propertyId || !data.startDate || !data.endDate) {
          return NextResponse.json({ error: "propertyId, startDate, endDate required" }, { status: 400 });
        }
        result = await ga4.getCountryBreakdown(
          data.propertyId as string,
          { startDate: data.startDate as string, endDate: data.endDate as string },
          (data.limit as number) || 10
        );
        break;

      case "landingPages":
        if (!data.propertyId || !data.startDate || !data.endDate) {
          return NextResponse.json({ error: "propertyId, startDate, endDate required" }, { status: 400 });
        }
        result = await ga4.getLandingPages(
          data.propertyId as string,
          { startDate: data.startDate as string, endDate: data.endDate as string },
          (data.limit as number) || 20
        );
        break;

      case "conversions":
        if (!data.propertyId || !data.startDate || !data.endDate) {
          return NextResponse.json({ error: "propertyId, startDate, endDate required" }, { status: 400 });
        }
        result = await ga4.getConversions(
          data.propertyId as string,
          { startDate: data.startDate as string, endDate: data.endDate as string }
        );
        break;

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const response = NextResponse.json({ success: true, data: result });
    return addSecurityHeaders(response);

  } catch (error) {
    console.error("[GA4 API] Error:", error);
    
    const message = error instanceof Error ? error.message : "Internal server error";
    
    // Check for auth errors
    if (message.includes("not connected") || message.includes("expired")) {
      return NextResponse.json({ error: message, code: "AUTH_REQUIRED" }, { status: 401 });
    }
    
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

