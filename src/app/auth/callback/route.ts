/**
 * Auth Callback Route
 * Handles email confirmation and OAuth callbacks
 * 
 * This route MUST:
 * 1. Exchange code for session
 * 2. Create user profile if not exists
 * 3. Create organization if not exists
 * 4. Redirect to appropriate page
 */

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.redirect(`${origin}/login?error=auth_not_configured`);
    }
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      
      // Get the redirect base
      const redirectBase = isLocalEnv 
        ? origin 
        : forwardedHost 
          ? `https://${forwardedHost}` 
          : origin;

      // === CREATE USER AND ORG IF NEEDED ===
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Use service client for database writes (bypasses RLS)
        const serviceClient = createServiceClient();
        
        if (user) {
          // Check if user has a profile
          const { data: profile, error: profileError } = await serviceClient
            .from("users")
            .select("organization_id")
            .eq("id", user.id)
            .single();
          
          // If no profile exists, create one with a new organization
          if (profileError || !profile) {
            console.log("[Auth Callback] Creating new user and org for:", user.email);
            
            // Create organization first
            const orgSlug = `org-${user.id.slice(0, 8)}-${Date.now()}`;
            
            const { data: newOrg, error: orgError } = await serviceClient
              .from("organizations")
              .insert({
                name: user.user_metadata?.full_name 
                  ? `${user.user_metadata.full_name}'s Organization`
                  : `${user.email?.split("@")[0] || "My"}'s Organization`,
                slug: orgSlug,
                owner_id: user.id,
                plan: "free",  // Start on free
                subscription_status: "trialing",
              } as never)
              .select("id")
              .single();

            if (orgError) {
              console.error("[Auth Callback] Org creation error:", orgError);
              // Try to find existing org by owner_id
              const { data: existingOrg } = await serviceClient
                .from("organizations")
                .select("id")
                .eq("owner_id", user.id)
                .single();
              
              if (existingOrg) {
                const orgId = (existingOrg as { id: string }).id;
                
                // Create user profile linked to existing org
                await serviceClient
                  .from("users")
                  .upsert({
                    id: user.id,
                    organization_id: orgId,
                    email: user.email!,
                    full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
                    avatar_url: user.user_metadata?.avatar_url || null,
                    role: "owner",
                    email_verified: true,
                  } as never);
                
                // Redirect to onboarding
                return NextResponse.redirect(`${redirectBase}/onboarding`);
              }
            } else if (newOrg) {
              const orgId = (newOrg as { id: string }).id;
              
              // Create user profile
              const { error: userError } = await serviceClient
                .from("users")
                .insert({
                  id: user.id,
                  organization_id: orgId,
                  email: user.email!,
                  full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
                  avatar_url: user.user_metadata?.avatar_url || null,
                  role: "owner",
                  email_verified: true,
                } as never);
              
              if (userError) {
                console.error("[Auth Callback] User creation error:", userError);
              }
              
              // Redirect to onboarding for new users
              return NextResponse.redirect(`${redirectBase}/onboarding`);
            }
          } else {
            // User exists, check if they have any sites (for onboarding check)
            const orgId = (profile as { organization_id: string }).organization_id;
            
            if (orgId) {
              const { data: sites } = await serviceClient
                .from("sites")
                .select("id")
                .eq("organization_id", orgId)
                .limit(1);
              
              // If no sites, redirect to onboarding
              if (!sites || sites.length === 0) {
                return NextResponse.redirect(`${redirectBase}/onboarding`);
              }
            }
          }
        }
      } catch (err) {
        console.error("[Auth Callback] User/org setup error:", err);
        // Continue to dashboard anyway, onboarding can handle it
      }

      return NextResponse.redirect(`${redirectBase}${next}`);
    } else {
      console.error("[Auth Callback] Session exchange error:", error);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
