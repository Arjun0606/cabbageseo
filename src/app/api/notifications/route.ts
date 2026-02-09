/**
 * /api/notifications - Notification Settings
 *
 * GET: Get notification preferences
 * PATCH: Update notification preferences
 *
 * Uses the `notifications` table which has email preference booleans:
 * email_new_citation, email_lost_citation, email_weekly_digest, email_competitor_cited
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

// Default settings (matches notifications table defaults)
const defaultSettings = {
  citationAlerts: true,
  weeklyReport: true,
  competitorAlerts: false,
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

    // Read from notifications table (correct schema)
    const { data: notifData } = await db
      .from("notifications")
      .select("email_new_citation, email_lost_citation, email_weekly_digest, email_competitor_cited")
      .eq("user_id", user.id)
      .maybeSingle();

    const row = notifData as {
      email_new_citation?: boolean;
      email_lost_citation?: boolean;
      email_weekly_digest?: boolean;
      email_competitor_cited?: boolean;
    } | null;

    // Map DB columns to frontend-friendly names
    const settings = row ? {
      citationAlerts: row.email_new_citation ?? true,
      weeklyReport: row.email_weekly_digest ?? true,
      competitorAlerts: row.email_competitor_cited ?? false,
      productUpdates: false,
    } : defaultSettings;

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

  // Upsert into notifications table (correct schema)
  const { data: existing } = await db
    .from("notifications")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const dbValues = {
    email_new_citation: updates.email_new_citation ?? updates.citationAlerts ?? true,
    email_lost_citation: updates.email_lost_citation ?? true,
    email_weekly_digest: updates.email_weekly_digest ?? updates.weeklyReport ?? true,
    email_competitor_cited: updates.email_competitor_cited ?? updates.competitorAlerts ?? false,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    await db
      .from("notifications")
      .update(dbValues)
      .eq("user_id", user.id);
  } else {
    await db
      .from("notifications")
      .insert({
        user_id: user.id,
        ...dbValues,
      });
  }

  // Return frontend-friendly format
  const newSettings = {
    citationAlerts: dbValues.email_new_citation,
    weeklyReport: dbValues.email_weekly_digest,
    competitorAlerts: dbValues.email_competitor_cited,
    productUpdates: updates.productUpdates ?? false,
  };

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
