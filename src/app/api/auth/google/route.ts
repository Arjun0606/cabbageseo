/**
 * Google OAuth Flow
 * Handles authentication for Google Search Console and Google Analytics
 */

import { NextRequest, NextResponse } from "next/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  : "http://localhost:3000/api/auth/google/callback";

// Scopes for different integrations
const INTEGRATION_SCOPES: Record<string, string[]> = {
  gsc: [
    "https://www.googleapis.com/auth/webmasters.readonly",
    "https://www.googleapis.com/auth/webmasters",
  ],
  ga4: [
    "https://www.googleapis.com/auth/analytics.readonly",
  ],
  both: [
    "https://www.googleapis.com/auth/webmasters.readonly",
    "https://www.googleapis.com/auth/webmasters",
    "https://www.googleapis.com/auth/analytics.readonly",
  ],
};

// GET - Initiate OAuth flow
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const integration = searchParams.get("integration") || "both";
  const siteId = searchParams.get("site_id"); // Optional: associate with specific site
  
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { error: "Google OAuth not configured. Set GOOGLE_CLIENT_ID in environment." },
      { status: 500 }
    );
  }
  
  // Get scopes for the requested integration
  const scopes = INTEGRATION_SCOPES[integration] || INTEGRATION_SCOPES.both;
  
  // Build state parameter (contains context for callback)
  const state = Buffer.from(JSON.stringify({
    integration,
    siteId,
    timestamp: Date.now(),
  })).toString("base64");
  
  // Build OAuth URL
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: scopes.join(" "),
    access_type: "offline", // Get refresh token
    prompt: "consent", // Always show consent screen to get refresh token
    state,
  });
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  
  return NextResponse.redirect(authUrl);
}

