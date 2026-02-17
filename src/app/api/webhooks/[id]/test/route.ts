/**
 * Webhook Test Delivery
 *
 * POST /api/webhooks/[id]/test — Send a test event to verify webhook config
 */

import { NextRequest, NextResponse } from "next/server";
import { db, webhooks } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/api/get-user";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [webhook] = await db
      .select()
      .from(webhooks)
      .where(
        and(
          eq(webhooks.id, id),
          eq(webhooks.organizationId, user.organizationId),
        )
      );

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    // Build test payload
    const payload = {
      event: "test",
      timestamp: new Date().toISOString(),
      data: {
        message: "This is a test webhook from CabbageSEO",
        domain: "example.com",
        score: 42,
      },
    };
    const body = JSON.stringify(payload);

    // Sign it
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(webhook.secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const signature = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Deliver
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CabbageSEO-Signature": signature,
        "X-CabbageSEO-Event": "test",
      },
      body,
      signal: AbortSignal.timeout(10000),
    });

    const status = response.status;
    const ok = response.ok;

    // Update last delivery info
    await db
      .update(webhooks)
      .set({
        lastDeliveredAt: new Date(),
        lastStatus: status,
        ...(ok ? { failureCount: 0 } : {}),
      })
      .where(eq(webhooks.id, id));

    return NextResponse.json({
      success: ok,
      status,
      message: ok
        ? "Test webhook delivered successfully"
        : `Webhook returned HTTP ${status}`,
    });
  } catch (error) {
    console.error("[Webhooks] Test error:", error);
    return NextResponse.json({ error: "Failed to deliver test webhook" }, { status: 500 });
  }
}
