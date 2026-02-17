/**
 * Webhook Delivery
 *
 * Fire-and-forget webhook delivery with HMAC-SHA256 signing.
 * Auto-disables webhooks after 10 consecutive failures.
 */

import { db, webhooks } from "@/lib/db";
import { eq, and } from "drizzle-orm";

type WebhookEvent = "scan_complete" | "score_drop" | "score_improve";

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Sign a payload using HMAC-SHA256
 */
async function signPayload(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Deliver a webhook event to all matching webhooks for an org.
 * Fire-and-forget — does not block the caller.
 */
export async function deliverWebhooks(
  organizationId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
) {
  try {
    const orgWebhooks = await db
      .select()
      .from(webhooks)
      .where(
        and(
          eq(webhooks.organizationId, organizationId),
          eq(webhooks.isActive, true)
        )
      );

    const matching = orgWebhooks.filter((wh) => {
      const events = (wh.events as string[]) || [];
      return events.includes(event);
    });

    if (matching.length === 0) return;

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };
    const body = JSON.stringify(payload);

    await Promise.allSettled(
      matching.map((wh) => deliverSingle(wh, body))
    );
  } catch (error) {
    console.error("[Webhooks] Delivery error:", error);
  }
}

async function deliverSingle(
  wh: { id: string; url: string; secret: string; failureCount: number | null },
  body: string
) {
  try {
    const signature = await signPayload(body, wh.secret);

    const response = await fetch(wh.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CabbageSEO-Signature": signature,
        "X-CabbageSEO-Event": JSON.parse(body).event,
      },
      body,
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (response.ok) {
      // Success — reset failure count
      await db
        .update(webhooks)
        .set({
          lastDeliveredAt: new Date(),
          lastStatus: response.status,
          failureCount: 0,
        })
        .where(eq(webhooks.id, wh.id));
    } else {
      await handleFailure(wh, response.status);
    }
  } catch {
    await handleFailure(wh, 0);
  }
}

async function handleFailure(
  wh: { id: string; failureCount: number | null },
  status: number
) {
  const newCount = (wh.failureCount || 0) + 1;
  const shouldDisable = newCount >= 10;

  await db
    .update(webhooks)
    .set({
      lastStatus: status,
      failureCount: newCount,
      ...(shouldDisable ? { isActive: false } : {}),
    })
    .where(eq(webhooks.id, wh.id));

  if (shouldDisable) {
    console.warn(`[Webhooks] Auto-disabled webhook ${wh.id} after 10 consecutive failures`);
  }
}
