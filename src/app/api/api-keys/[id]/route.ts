/**
 * API Key Management — Single Key Operations
 *
 * DELETE /api/api-keys/[id] — Revoke (soft delete) an API key
 */

import { NextRequest, NextResponse } from "next/server";
import { db, apiKeys } from "@/lib/db";
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
      .update(apiKeys)
      .set({ isActive: false })
      .where(
        and(
          eq(apiKeys.id, id),
          eq(apiKeys.organizationId, user.organizationId),
        )
      )
      .returning({ id: apiKeys.id });

    if (result.length === 0) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error("[API Keys] DELETE error:", error);
    return NextResponse.json({ error: "Failed to revoke API key" }, { status: 500 });
  }
}
