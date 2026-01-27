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

// Helper function to update notification settings
async function updateNotificationSettings(request: NextRequest) {
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
  
  // Map the incoming fields to storage format
  const newSettings = {
    ...currentSettings,
    citationAlerts: updates.email_new_citation ?? currentSettings.citationAlerts,
    weeklyReport: updates.email_weekly_digest ?? currentSettings.weeklyReport,
    competitorAlerts: updates.email_competitor_cited ?? currentSettings.competitorAlerts,
    productUpdates: updates.productUpdates ?? currentSettings.productUpdates,
  };

  // Update settings in users table
  await db
    .from("users")
    .update({ notification_settings: newSettings })
    .eq("id", user.id);

  // Also upsert to notifications table if it exists
  try {
    const { data: existing } = await db
      .from("notifications")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await db
        .from("notifications")
        .update({
          email_new_citation: updates.email_new_citation ?? true,
          email_lost_citation: updates.email_lost_citation ?? true,
          email_weekly_digest: updates.email_weekly_digest ?? true,
          email_competitor_cited: updates.email_competitor_cited ?? false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    } else {
      await db
        .from("notifications")
        .insert({
          user_id: user.id,
          email_new_citation: updates.email_new_citation ?? true,
          email_lost_citation: updates.email_lost_citation ?? true,
          email_weekly_digest: updates.email_weekly_digest ?? true,
          email_competitor_cited: updates.email_competitor_cited ?? false,
        });
    }
  } catch (e) {
    // Notifications table might not exist in all environments
    console.warn("Notifications table not available:", e);
  }

  return NextResponse.json({ settings: newSettings, success: true });
}

// POST - Update settings (for frontend compatibility)
export async function POST(request: NextRequest) {
  try {
    return await updateNotificationSettings(request);
  } catch (error) {
    console.error("[/api/notifications POST] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH - Update settings (REST standard)
export async function PATCH(request: NextRequest) {
  try {
    return await updateNotificationSettings(request);
  } catch (error) {
    console.error("[/api/notifications PATCH] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
