/**
 * AUTO-CONFIRM TEST ACCOUNTS
 * 
 * This endpoint auto-confirms test accounts after signup
 * Called automatically when a test account signs up
 */

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { isTestAccount } from "@/lib/testing/test-accounts";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !isTestAccount(email)) {
      return NextResponse.json(
        { error: "Not a test account" },
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

    // Get user by email
    const { data: userData, error: getUserError } = await adminClient.auth.admin.getUserByEmail(email);

    if (getUserError || !userData?.user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Auto-confirm email
    const { error: updateError } = await adminClient.auth.admin.updateUserById(userData.user.id, {
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
      message: "Test account auto-confirmed",
    });
  } catch (error: any) {
    console.error("[Auto-confirm test] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

