/**
 * Supabase Middleware
 * Refreshes auth tokens and protects routes
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ============================================
// 🔓 TESTING MODE - AUTH BYPASS
// Set TESTING_MODE=true in .env for local testing
// ============================================
const TESTING_MODE = process.env.TESTING_MODE === "true";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // TESTING: Skip all auth checks for dashboard testing
  if (TESTING_MODE) {
    return supabaseResponse;
  }

  // Skip auth if Supabase not configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define public routes that don't require auth
  const publicRoutes = [
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/terms",
    "/privacy",
    "/pricing",
    "/analyze",
    "/docs",
    "/feedback",
    "/auth/callback",  // OAuth callback must be public
  ];
  
  // Define public API route prefixes (these handle their own auth)
  // ALL /api routes should handle their own auth and return JSON responses
  const publicApiPrefixes = [
    "/api/",  // All API routes handle their own auth - return JSON, not redirects
  ];
  
  const isPublicRoute = publicRoutes.some(
    (route) => request.nextUrl.pathname === route
  );
  
  const isPublicApi = publicApiPrefixes.some(
    (prefix) => request.nextUrl.pathname.startsWith(prefix)
  );

  // If no user and trying to access protected route, redirect to login
  if (!user && !isPublicRoute && !isPublicApi) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // If user is logged in and trying to access login/signup, redirect to dashboard
  if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

