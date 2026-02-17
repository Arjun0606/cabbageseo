/**
 * Webhook Management
 *
 * GET  /api/webhooks — List all webhooks for the org
 * POST /api/webhooks — Create a new webhook (Command+ plan required)
 */

import { NextResponse } from "next/server";
import { db, webhooks } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/api/get-user";
import { randomBytes } from "crypto";

const ALLOWED_PLANS = ["command", "dominate"];
const VALID_EVENTS = ["scan_complete", "score_drop", "score_improve"];

export async function GET() {
  try {
    const user = await getUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hooks = await db
      .select({
        id: webhooks.id,
        url: webhooks.url,
        events: webhooks.events,
        isActive: webhooks.isActive,
        lastDeliveredAt: webhooks.lastDeliveredAt,
        lastStatus: webhooks.lastStatus,
        failureCount: webhooks.failureCount,
        createdAt: webhooks.createdAt,
      })
      .from(webhooks)
      .where(eq(webhooks.organizationId, user.organizationId));

    return NextResponse.json({ webhooks: hooks });
  } catch (error) {
    console.error("[Webhooks] GET error:", error);
    return NextResponse.json({ error: "Failed to list webhooks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ALLOWED_PLANS.includes(user.plan)) {
      return NextResponse.json(
        { error: "Webhooks require a Command or Dominate plan. Upgrade at /settings/billing" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { url, events } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    // Validate URL
    try {
      const parsed = new URL(url);
      if (!["https:", "http:"].includes(parsed.protocol)) {
        return NextResponse.json({ error: "URL must use http or https" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Validate events
    const validatedEvents = Array.isArray(events)
      ? events.filter((e: string) => VALID_EVENTS.includes(e))
      : ["scan_complete"];

    if (validatedEvents.length === 0) {
      return NextResponse.json(
        { error: `At least one valid event required. Options: ${VALID_EVENTS.join(", ")}` },
        { status: 400 }
      );
    }

    // Limit to 5 webhooks per org
    const existing = await db
      .select({ id: webhooks.id })
      .from(webhooks)
      .where(eq(webhooks.organizationId, user.organizationId));

    if (existing.length >= 5) {
      return NextResponse.json(
        { error: "Maximum 5 webhooks per organization. Delete unused webhooks first." },
        { status: 400 }
      );
    }

    const secret = randomBytes(32).toString("hex");

    const [created] = await db.insert(webhooks).values({
      organizationId: user.organizationId,
      url,
      secret,
      events: validatedEvents,
    }).returning({
      id: webhooks.id,
      url: webhooks.url,
      events: webhooks.events,
      createdAt: webhooks.createdAt,
    });

    return NextResponse.json({
      ...created,
      secret,
      warning: "Save this secret now — you won't be able to see it again. Use it to verify webhook signatures.",
    }, { status: 201 });
  } catch (error) {
    console.error("[Webhooks] POST error:", error);
    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 });
  }
}
