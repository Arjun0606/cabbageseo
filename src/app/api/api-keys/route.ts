/**
 * API Key Management
 *
 * GET  /api/api-keys — List all API keys for the org (key preview only)
 * POST /api/api-keys — Create a new API key (Command+ plan required)
 */

import { NextResponse } from "next/server";
import { db, apiKeys } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/api/get-user";
import { generateApiKey } from "@/lib/api/generate-api-key";

const PLAN_LIMITS: Record<string, { allowed: boolean; hourlyLimit: number; scopes: string[] }> = {
  free: { allowed: false, hourlyLimit: 0, scopes: [] },
  scout: { allowed: false, hourlyLimit: 0, scopes: [] },
  command: { allowed: true, hourlyLimit: 200, scopes: ["scan", "compare", "badge", "history", "gaps", "webhooks"] },
  dominate: { allowed: true, hourlyLimit: 500, scopes: ["scan", "compare", "badge", "history", "gaps", "webhooks", "bulk_scan"] },
};

export async function GET() {
  try {
    const user = await getUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        key: apiKeys.key,
        scopes: apiKeys.scopes,
        hourlyLimit: apiKeys.hourlyLimit,
        isActive: apiKeys.isActive,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
        expiresAt: apiKeys.expiresAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.organizationId, user.organizationId));

    // Mask keys — only show last 8 chars
    const maskedKeys = keys.map(k => ({
      ...k,
      key: `cbs_${"*".repeat(56)}${k.key.slice(-8)}`,
    }));

    return NextResponse.json({ keys: maskedKeys });
  } catch (error) {
    console.error("[API Keys] GET error:", error);
    return NextResponse.json({ error: "Failed to list API keys" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const planConfig = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free;
    if (!planConfig.allowed) {
      return NextResponse.json(
        { error: "API keys require a Command or Dominate plan. Upgrade at /settings/billing" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const name = (body.name || "API Key").slice(0, 100);

    // Limit to 10 active keys per org
    const existingKeys = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(eq(apiKeys.organizationId, user.organizationId));

    if (existingKeys.length >= 10) {
      return NextResponse.json(
        { error: "Maximum 10 API keys per organization. Revoke unused keys first." },
        { status: 400 }
      );
    }

    const key = generateApiKey();

    const [created] = await db.insert(apiKeys).values({
      organizationId: user.organizationId,
      key,
      name,
      scopes: planConfig.scopes,
      hourlyLimit: planConfig.hourlyLimit,
    }).returning({
      id: apiKeys.id,
      name: apiKeys.name,
      createdAt: apiKeys.createdAt,
    });

    // Return the FULL key only on creation — subsequent GETs will mask it
    return NextResponse.json({
      key,
      id: created.id,
      name: created.name,
      createdAt: created.createdAt,
      scopes: planConfig.scopes,
      hourlyLimit: planConfig.hourlyLimit,
      warning: "Save this key now — you won't be able to see it again.",
    }, { status: 201 });
  } catch (error) {
    console.error("[API Keys] POST error:", error);
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
  }
}
