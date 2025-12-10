/**
 * Save Google OAuth connection
 * Stores tokens and selected properties in the database
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

interface SaveGoogleRequest {
  gscSites: string[];
  ga4Properties: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SaveGoogleRequest;
    const { gscSites, ga4Properties } = body;
    
    // Get OAuth data from temporary cookie
    const cookieStore = await cookies();
    const oauthCookie = cookieStore.get("google_oauth_temp");
    
    if (!oauthCookie) {
      return NextResponse.json(
        { error: "OAuth session expired. Please reconnect." },
        { status: 400 }
      );
    }
    
    const oauthData = JSON.parse(Buffer.from(oauthCookie.value, "base64").toString());
    
    // Validate selections
    const validGSCSites = gscSites.filter(site => 
      oauthData.gscSites?.some((s: { siteUrl: string }) => s.siteUrl === site)
    );
    const validGA4Properties = ga4Properties.filter(prop =>
      oauthData.ga4Properties?.some((p: { name: string }) => p.name === prop)
    );
    
    if (validGSCSites.length === 0 && validGA4Properties.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one property" },
        { status: 400 }
      );
    }
    
    // In production: Store in database
    // - Encrypt tokens before storage
    // - Associate with user/organization
    // - Store selected properties
    
    // For now, we'll store in a more permanent cookie (should be DB in production)
    const connectionData = {
      accessToken: oauthData.accessToken,
      refreshToken: oauthData.refreshToken,
      expiresAt: oauthData.expiresAt,
      gscSites: validGSCSites,
      ga4Properties: validGA4Properties,
      connectedAt: new Date().toISOString(),
    };
    
    const response = NextResponse.json({
      success: true,
      connected: {
        gscSites: validGSCSites.length,
        ga4Properties: validGA4Properties.length,
      },
    });
    
    // Clear temporary cookie
    response.cookies.delete("google_oauth_temp");
    
    // Set permanent connection cookie (should be DB in production)
    response.cookies.set("google_connection", Buffer.from(JSON.stringify(connectionData)).toString("base64"), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });
    
    return response;
    
  } catch (error) {
    console.error("Error saving Google connection:", error);
    return NextResponse.json(
      { error: "Failed to save connection" },
      { status: 500 }
    );
  }
}

