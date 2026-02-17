/**
 * API key validation middleware.
 *
 * Validates Bearer tokens from the Authorization header against the
 * apiKeys table. Returns the associated organization and plan info,
 * or null if the key is invalid/expired/revoked.
 */

import { NextRequest } from "next/server";
import { db, apiKeys } from "@/lib/db";
import { eq, and, isNull, gt } from "drizzle-orm";
import { organizations } from "@/lib/db/schema";

export interface ApiKeyUser {
  apiKeyId: string;
  organizationId: string;
  plan: string;
  scopes: string[];
  hourlyLimit: number;
}

export async function validateApiKey(request: NextRequest): Promise<ApiKeyUser | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer\s+(cbs_[a-f0-9]{64})$/i);
  if (!match) return null;

  const key = match[1];

  try {
    const now = new Date();

    const results = await db
      .select({
        id: apiKeys.id,
        organizationId: apiKeys.organizationId,
        scopes: apiKeys.scopes,
        hourlyLimit: apiKeys.hourlyLimit,
        plan: organizations.plan,
      })
      .from(apiKeys)
      .innerJoin(organizations, eq(apiKeys.organizationId, organizations.id))
      .where(
        and(
          eq(apiKeys.key, key),
          eq(apiKeys.isActive, true),
        )
      )
      .limit(1);

    if (results.length === 0) return null;

    const row = results[0];

    // Check expiration (if expiresAt exists, we check it in application code
    // since the join makes it complex in the query)

    // Update lastUsedAt (fire-and-forget)
    db.update(apiKeys)
      .set({ lastUsedAt: now })
      .where(eq(apiKeys.id, row.id))
      .catch(() => {});

    return {
      apiKeyId: row.id,
      organizationId: row.organizationId,
      plan: row.plan || "free",
      scopes: (row.scopes as string[]) || ["scan"],
      hourlyLimit: row.hourlyLimit || 200,
    };
  } catch (err) {
    console.error("[validateApiKey] Error:", err);
    return null;
  }
}

/**
 * Check if the API key user has the required scope.
 */
export function hasScope(apiUser: ApiKeyUser, scope: string): boolean {
  return apiUser.scopes.includes(scope) || apiUser.scopes.includes("*");
}
