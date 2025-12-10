/**
 * Get Google OAuth data from temporary cookie
 * Used during the setup flow to display available properties
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const oauthCookie = cookieStore.get("google_oauth_temp");
    
    if (!oauthCookie) {
      return NextResponse.json(
        { error: "No OAuth data found. Please reconnect." },
        { status: 404 }
      );
    }
    
    const data = JSON.parse(Buffer.from(oauthCookie.value, "base64").toString());
    
    // Don't expose the actual tokens to the client
    return NextResponse.json({
      gscSites: data.gscSites || [],
      ga4Properties: data.ga4Properties || [],
      integration: data.integration,
      expiresAt: data.expiresAt,
    });
    
  } catch (error) {
    console.error("Error reading OAuth data:", error);
    return NextResponse.json(
      { error: "Failed to read OAuth data" },
      { status: 500 }
    );
  }
}

