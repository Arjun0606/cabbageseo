/**
 * Webhook Management — Single Webhook Operations
 *
 * DELETE /api/webhooks/[id] — Delete a webhook
 */

import { NextRequest, NextResponse } from "next/server";
import { db, webhooks } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/api/get-user";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const result = await db
      .delete(webhooks)
      .where(
        and(
          eq(webhooks.id, id),
          eq(webhooks.organizationId, user.organizationId),
        )
      )
      .returning({ id: webhooks.id });

    if (result.length === 0) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error("[Webhooks] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete webhook" }, { status: 500 });
  }
}
