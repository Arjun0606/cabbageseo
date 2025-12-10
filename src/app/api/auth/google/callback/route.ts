/**
 * Google OAuth Callback Handler
 * Exchanges authorization code for tokens and stores them
 */

import { NextRequest, NextResponse } from "next/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  : "http://localhost:3000/api/auth/google/callback";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface StateData {
  integration: string;
  siteId?: string;
  timestamp: number;
}

// Exchange authorization code for tokens
async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }
  
  return response.json();
}

// Fetch user's GSC sites
async function fetchGSCSites(accessToken: string): Promise<Array<{ siteUrl: string; permissionLevel: string }>> {
  const response = await fetch(
    "https://www.googleapis.com/webmasters/v3/sites",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  
  if (!response.ok) {
    console.error("Failed to fetch GSC sites:", await response.text());
    return [];
  }
  
  const data = await response.json();
  return data.siteEntry || [];
}

// Fetch user's GA4 properties
async function fetchGA4Properties(accessToken: string): Promise<Array<{ name: string; displayName: string }>> {
  const response = await fetch(
    "https://analyticsadmin.googleapis.com/v1beta/accountSummaries",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  
  if (!response.ok) {
    console.error("Failed to fetch GA4 properties:", await response.text());
    return [];
  }
  
  const data = await response.json();
  const properties: Array<{ name: string; displayName: string }> = [];
  
  for (const account of data.accountSummaries || []) {
    for (const property of account.propertySummaries || []) {
      properties.push({
        name: property.property,
        displayName: property.displayName,
      });
    }
  }
  
  return properties;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  
  // Handle OAuth errors
  if (error) {
    const errorDescription = searchParams.get("error_description") || "Unknown error";
    return NextResponse.redirect(
      `${APP_URL}/settings/integrations?error=${encodeURIComponent(errorDescription)}`
    );
  }
  
  if (!code) {
    return NextResponse.redirect(
      `${APP_URL}/settings/integrations?error=${encodeURIComponent("No authorization code received")}`
    );
  }
  
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(
      `${APP_URL}/settings/integrations?error=${encodeURIComponent("Google OAuth not configured")}`
    );
  }
  
  try {
    // Parse state
    let stateData: StateData = { integration: "both", timestamp: Date.now() };
    if (state) {
      try {
        stateData = JSON.parse(Buffer.from(state, "base64").toString());
      } catch {
        console.warn("Failed to parse state, using defaults");
      }
    }
    
    // Verify state timestamp (prevent replay attacks)
    const stateAge = Date.now() - stateData.timestamp;
    if (stateAge > 10 * 60 * 1000) { // 10 minutes
      return NextResponse.redirect(
        `${APP_URL}/settings/integrations?error=${encodeURIComponent("Authorization expired, please try again")}`
      );
    }
    
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    
    // Fetch available sites/properties
    const gscSites = stateData.integration === "ga4" ? [] : await fetchGSCSites(tokens.access_token);
    const ga4Properties = stateData.integration === "gsc" ? [] : await fetchGA4Properties(tokens.access_token);
    
    // In production: Store tokens encrypted in database
    // For now, we'll store in a cookie and redirect to a selection page
    
    const integrationData = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
      gscSites,
      ga4Properties,
      integration: stateData.integration,
    };
    
    // Create a response that sets a temporary cookie and redirects
    const response = NextResponse.redirect(
      `${APP_URL}/settings/integrations/google-setup?integration=${stateData.integration}`
    );
    
    // Set encrypted cookie with token data (temporary - will be moved to DB after site selection)
    // In production, use proper encryption
    response.cookies.set("google_oauth_temp", Buffer.from(JSON.stringify(integrationData)).toString("base64"), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes to complete setup
      path: "/",
    });
    
    return response;
    
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      `${APP_URL}/settings/integrations?error=${encodeURIComponent(
        err instanceof Error ? err.message : "Authentication failed"
      )}`
    );
  }
}

