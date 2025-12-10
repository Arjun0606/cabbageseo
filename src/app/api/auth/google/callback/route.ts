/**
 * Google OAuth Callback
 * 
 * Handles the OAuth callback with security validation:
 * - CSRF state verification
 * - Code exchange
 * - Token storage
 */

import { NextRequest, NextResponse } from "next/server";
import { googleOAuth } from "@/lib/integrations/google/oauth";
import { protectAPI, getClientIP } from "@/lib/security/api-protection";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  // Protect endpoint
  const blocked = await protectAPI(request, { 
    rateLimit: "auth",
    allowedMethods: ["GET"],
  });
  if (blocked) return blocked;

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle OAuth errors
  if (error) {
    console.error("[Google OAuth] Error:", error);
    return NextResponse.redirect(
      new URL(`/settings/integrations?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  // Validate required params
  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/settings/integrations?error=missing_params", request.url)
    );
  }

  // Verify CSRF state
  const cookieStore = await cookies();
  const storedState = cookieStore.get("google_oauth_state")?.value;
  
  if (!storedState || storedState !== state) {
    console.error("[Google OAuth] State mismatch - possible CSRF attack");
    console.error(`IP: ${getClientIP(request)}`);
    return NextResponse.redirect(
      new URL("/settings/integrations?error=invalid_state", request.url)
    );
  }

  // Clear state cookie
  cookieStore.delete("google_oauth_state");

  try {
    // Exchange code for tokens
    const tokens = await googleOAuth.exchangeCodeForTokens(code);
    
    // Get user info
    const userInfo = await googleOAuth.getUserInfo(tokens.access_token);
    
    // Get authenticated user
    const supabase = createServiceClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.redirect(
        new URL("/login?error=not_authenticated", request.url)
      );
    }

    // Get user's organization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: orgMember } = await (supabase as any)
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (!orgMember) {
      return NextResponse.redirect(
        new URL("/settings/integrations?error=no_organization", request.url)
      );
    }

    // Store tokens securely
    await googleOAuth.storeTokens(
      user.id,
      orgMember.organization_id,
      tokens,
      userInfo.email
    );

    // Store temporary data for setup page
    cookieStore.set("google_setup_data", JSON.stringify({
      email: userInfo.email,
      timestamp: Date.now(),
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60, // 10 minutes
      path: "/",
    });

    // Redirect to setup page to select GSC sites and GA4 properties
    return NextResponse.redirect(
      new URL("/settings/integrations/google-setup?success=true", request.url)
    );

  } catch (err) {
    console.error("[Google OAuth] Token exchange failed:", err);
    return NextResponse.redirect(
      new URL("/settings/integrations?error=token_exchange_failed", request.url)
    );
  }
}
