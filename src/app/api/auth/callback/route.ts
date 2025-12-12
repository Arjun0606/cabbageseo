/**
 * Auth Callback Route
 * Handles OAuth redirects and email confirmation
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { emailService } from "@/lib/email";

export async function GET(request: Request) {
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
      // Check if user needs onboarding (no organization yet)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if user has a profile/organization
        const { data: profile } = await supabase
          .from("users")
          .select("organization_id")
          .eq("id", user.id)
          .single();
        
        // If no profile, create one with a new organization
        if (!profile) {
          // Create organization
          const orgSlug = user.email?.split("@")[0]?.replace(/[^a-z0-9]/gi, "") || `org-${Date.now()}`;
          
          const { data: org, error: orgError } = await supabase
            .from("organizations")
            .insert({
              name: user.user_metadata?.name || user.email?.split("@")[0] || "My Organization",
              slug: orgSlug,
              plan: "starter" as const,
            } as never)
            .select()
            .single();

          const orgData = org as { id: string } | null;
          if (!orgError && orgData) {
            // Create user profile
            await supabase
              .from("users")
              .insert({
                id: user.id,
                organization_id: orgData.id,
                email: user.email!,
                name: user.user_metadata?.name || null,
                avatar_url: user.user_metadata?.avatar_url || null,
                role: "owner",
                email_verified: true,
              } as never);
            
            // Send welcome email (async, don't block)
            emailService.sendWelcome(
              user.email!, 
              user.user_metadata?.name || undefined
            ).catch(err => console.error("Welcome email error:", err));
            
            // Redirect to onboarding for new users
            return NextResponse.redirect(`${origin}/onboarding`);
          }
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}

