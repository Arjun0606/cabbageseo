/**
 * ADMIN: Confirm Email
 * 
 * Secure endpoint to confirm user emails using admin secret
 * Used for testing purposes
 */

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email, adminSecret } = await request.json();

    // Check admin secret with timing-safe comparison
    const expectedSecret = process.env.ADMIN_SECRET;
    if (!expectedSecret) {
      return NextResponse.json(
        { error: "Admin secret not configured" },
        { status: 500 }
      );
    }
    if (
      !adminSecret ||
      adminSecret.length !== expectedSecret.length ||
      !timingSafeEqual(Buffer.from(adminSecret), Buffer.from(expectedSecret))
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email required" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Create admin client
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Find user by email
    const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers();

    if (listError) {
      return NextResponse.json(
        { error: listError.message },
        { status: 500 }
      );
    }

    const user = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Auto-confirm email if not already confirmed
    if (!user.email_confirmed_at) {
      const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
        email_confirm: true,
      });

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Email confirmed successfully",
        userId: user.id,
      });
    } else {
      return NextResponse.json({
        success: true,
        message: "Email already confirmed",
        userId: user.id,
      });
    }
  } catch (error: unknown) {
    console.error("[Admin confirm email] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
