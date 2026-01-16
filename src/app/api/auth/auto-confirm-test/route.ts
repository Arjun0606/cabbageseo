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

    // List users and find by email (getUserByEmail doesn't exist in Supabase admin API)
    const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers();

    if (listError) {
      return NextResponse.json(
        { error: listError.message },
        { status: 500 }
      );
    }

    const user = usersData.users.find(u => u.email === email.toLowerCase());

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
    }

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

