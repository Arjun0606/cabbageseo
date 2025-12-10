/**
 * Google OAuth - Start Authorization
 * 
 * Initiates the OAuth flow with CSRF protection
 */

import { NextRequest, NextResponse } from "next/server";
import { googleOAuth } from "@/lib/integrations/google/oauth";
import { protectAPI } from "@/lib/security/api-protection";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  // Protect endpoint
  const blocked = await protectAPI(request, { 
    rateLimit: "auth",
    allowedMethods: ["GET"],
  });
  if (blocked) return blocked;

  // Check if Google OAuth is configured
  if (!googleOAuth.isConfigured()) {
    return NextResponse.json(
      { error: "Google OAuth not configured" },
      { status: 500 }
    );
  }

  // Generate CSRF state token
  const state = googleOAuth.generateStateToken();
  
  // Store state in cookie for verification
  const cookieStore = await cookies();
  cookieStore.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60, // 10 minutes
    path: "/",
  });

  // Get authorization URL
  const authUrl = googleOAuth.getAuthorizationUrl(state);

  return NextResponse.json({ url: authUrl });
}
