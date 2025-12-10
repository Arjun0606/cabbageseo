/**
 * Signup API Route
 * Creates a new user account with Supabase Auth
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: "Authentication service not configured" },
        { status: 503 }
      );
    }

    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Create user profile in our users table
    // Note: Using type assertion since table might not exist yet
    try {
      const { error: profileError } = await (supabase as any)
        .from("users")
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          full_name: fullName || null,
        });

      if (profileError) {
        console.error("Error creating user profile:", profileError);
        // Don't fail the signup, profile can be created later
      }

      // Create a default organization for the user
      const orgSlug = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");
      const { error: orgError } = await (supabase as any)
        .from("organizations")
        .insert({
          name: `${fullName || email.split("@")[0]}'s Organization`,
          slug: `${orgSlug}-${Date.now()}`,
          owner_id: authData.user.id,
          plan: "starter",
        });

      if (orgError) {
        console.error("Error creating organization:", orgError);
      }
    } catch (dbError) {
      console.error("Database not yet set up:", dbError);
      // Continue without database - tables may not exist yet
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      message: authData.user.email_confirmed_at 
        ? "Account created successfully" 
        : "Please check your email to confirm your account",
    });

  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

