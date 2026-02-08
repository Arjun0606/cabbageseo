/**
 * Slack Integration API
 *
 * GET  — Return current webhook config status (masked URL)
 * POST — Save webhook URL or test connection
 * DELETE — Remove webhook URL
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/api/get-user";
import { sendSlackNotification } from "@/lib/notifications/slack";
import type { SupabaseClient } from "@supabase/supabase-js";

function getDbClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

async function getOrgId(
  db: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data } = await db
    .from("users")
    .select("organization_id")
    .eq("id", userId)
    .maybeSingle();
  return (data as { organization_id: string } | null)?.organization_id || null;
}

async function getOrgSettings(
  db: SupabaseClient,
  orgId: string,
): Promise<Record<string, unknown>> {
  const { data } = await db
    .from("organizations")
    .select("settings")
    .eq("id", orgId)
    .single();
  return ((data as { settings: Record<string, unknown> } | null)?.settings ||
    {}) as Record<string, unknown>;
}

export async function GET() {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDbClient();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 },
      );
    }

    const orgId = await getOrgId(db, currentUser.id);
    if (!orgId) {
      return NextResponse.json(
        { error: "No organization" },
        { status: 400 },
      );
    }

    const settings = await getOrgSettings(db, orgId);
    const webhookUrl = settings.slackWebhookUrl as string | undefined;

    return NextResponse.json({
      configured: !!webhookUrl,
      webhookUrl: webhookUrl
        ? `${webhookUrl.substring(0, 35)}...`
        : null,
    });
  } catch (error) {
    console.error("[/api/notifications/slack GET]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { webhookUrl, test } = body;

    if (
      webhookUrl &&
      typeof webhookUrl === "string" &&
      !webhookUrl.startsWith("https://hooks.slack.com/")
    ) {
      return NextResponse.json(
        { error: "Invalid Slack webhook URL" },
        { status: 400 },
      );
    }

    const db = getDbClient();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 },
      );
    }

    const orgId = await getOrgId(db, currentUser.id);
    if (!orgId) {
      return NextResponse.json(
        { error: "No organization" },
        { status: 400 },
      );
    }

    // Test connection only
    if (test && webhookUrl) {
      const success = await sendSlackNotification(webhookUrl, {
        text: "CabbageSEO connected successfully! You'll receive AI visibility alerts here.",
      });
      return NextResponse.json({ success, tested: true });
    }

    // Save webhook URL (merge with existing settings)
    const currentSettings = await getOrgSettings(db, orgId);
    const newSettings = {
      ...currentSettings,
      slackWebhookUrl: webhookUrl || null,
    };

    await db
      .from("organizations")
      .update({ settings: newSettings } as never)
      .eq("id", orgId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/notifications/slack POST]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDbClient();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 },
      );
    }

    const orgId = await getOrgId(db, currentUser.id);
    if (!orgId) {
      return NextResponse.json(
        { error: "No organization" },
        { status: 400 },
      );
    }

    const currentSettings = await getOrgSettings(db, orgId);
    const newSettings = { ...currentSettings, slackWebhookUrl: null };

    await db
      .from("organizations")
      .update({ settings: newSettings } as never)
      .eq("id", orgId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/notifications/slack DELETE]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
