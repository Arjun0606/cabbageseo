/**
 * /api/notifications - Notification Settings
 * 
 * GET: Get notification preferences
 * PATCH: Update notification preferences
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

function getDbClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

// Default settings
const defaultSettings = {
  citationAlerts: true,
  weeklyReport: true,
  competitorAlerts: true,
  productUpdates: false,
};

// GET - Get settings
export async function GET() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDbClient() || supabase;

    // Get user's notification settings
    const { data: userData } = await db
      .from("users")
      .select("notification_settings")
      .eq("id", user.id)
      .maybeSingle();

    const settings = userData?.notification_settings || defaultSettings;

    return NextResponse.json({ settings });

  } catch (error) {
    console.error("[/api/notifications GET] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH - Update settings
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates = await request.json();

    const db = getDbClient() || supabase;

    // Get current settings
    const { data: userData } = await db
      .from("users")
      .select("notification_settings")
      .eq("id", user.id)
      .maybeSingle();

    const currentSettings = userData?.notification_settings || defaultSettings;
    const newSettings = { ...currentSettings, ...updates };

    // Update settings
    await db
      .from("users")
      .update({ notification_settings: newSettings })
      .eq("id", user.id);

    return NextResponse.json({ settings: newSettings });

  } catch (error) {
    console.error("[/api/notifications PATCH] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
