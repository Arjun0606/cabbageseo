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
import { emailService } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("[Auth Callback] URL:", request.url);
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/dashboard";
  // Prevent open redirect — only allow relative paths
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

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
                plan: "free",
                subscription_status: "inactive",
              } as never)
              .select("id")
              .single();

            if (orgError) {
              console.error("[Auth Callback] Org creation error:", orgError);
              // If org creation failed, redirect to dashboard anyway
              return NextResponse.redirect(`${redirectBase}/dashboard`);
            }
            
            if (newOrg) {
              const orgId = (newOrg as { id: string }).id;
              
              // Create user profile
              const { error: userError } = await serviceClient
                .from("users")
                .insert({
                  id: user.id,
                  organization_id: orgId,
                  email: user.email!,
                  name: user.user_metadata?.full_name || user.user_metadata?.name || null,
                  avatar_url: user.user_metadata?.avatar_url || null,
                  role: "owner",
                  email_verified: true,
                } as never);
              
              if (userError) {
                console.error("[Auth Callback] User creation error:", userError);
              }

              // Send welcome email (fire-and-forget)
              if (user.email) {
                emailService.sendWelcome(user.email, user.user_metadata?.full_name || "").catch((err) =>
                  console.error("[Auth Callback] Welcome email failed:", err)
                );
              }

              // New users must subscribe before accessing dashboard
              return NextResponse.redirect(`${redirectBase}/settings/billing`);
            }
          } else {
            // User exists — route based on plan and site status
            const orgId = (profile as { organization_id: string }).organization_id;

            if (orgId) {
              // Check their plan
              const { data: org } = await serviceClient
                .from("organizations")
                .select("plan")
                .eq("id", orgId)
                .single();

              const plan = (org as { plan: string } | null)?.plan || "free";

              // Free (unpaid) users go to billing to subscribe
              if (plan === "free") {
                return NextResponse.redirect(`${redirectBase}/settings/billing`);
              }

              // Paid users without sites go to onboarding
              const { data: sites } = await serviceClient
                .from("sites")
                .select("id")
                .eq("organization_id", orgId)
                .limit(1);

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

  // No code param — if user is already authenticated, send them to dashboard
  const supabaseCheck = await createClient();
  if (supabaseCheck) {
    const { data: { user: existingUser } } = await supabaseCheck.auth.getUser();
    if (existingUser) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
