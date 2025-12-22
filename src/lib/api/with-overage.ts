/**
 * Overage-Aware API Wrapper
 * 
 * Wraps API operations that may incur overages.
 * Checks limits, records usage, and returns clear errors if blocked.
 */

import { NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { 
  checkOverage, 
  recordOverage, 
  OverageResource 
} from "@/lib/billing/overage-manager";
import { getPlanLimits } from "@/lib/billing/plans";

// ============================================
// TYPES
// ============================================

export type ResourceType = "articles" | "keywords" | "audits" | "aioAnalyses" | "aiCredits" | "serpAnalysis" | "backlinks";

export interface OverageCheckResult {
  allowed: boolean;
  organizationId: string;
  currentUsage: number;
  limit: number;
  isOverage: boolean;
  overageCostCents?: number;
  error?: NextResponse;
}

// Mapping from resource type to database field
const RESOURCE_TO_DB_FIELD: Record<ResourceType, string> = {
  articles: "articles_generated",
  keywords: "keywords_analyzed",
  audits: "audits_run",
  aioAnalyses: "aio_analyses",
  aiCredits: "ai_credits_used",
  serpAnalysis: "serp_calls",
  backlinks: "backlink_checks",
};

const RESOURCE_TO_PLAN_LIMIT: Record<ResourceType, string> = {
  articles: "articlesPerMonth",
  keywords: "keywordsTracked",
  audits: "auditsPerMonth",
  aioAnalyses: "aioAnalysesPerMonth",
  aiCredits: "aiCreditsPerMonth",
  serpAnalysis: "auditsPerMonth", // Shares limit
  backlinks: "auditsPerMonth", // Shares limit
};

// ============================================
// CHECK IF OPERATION IS ALLOWED
// ============================================

/**
 * Check if an operation is allowed (within limits or has overage enabled)
 * Call this BEFORE performing the operation
 */
export async function canPerformOperation(
  supabase: SupabaseClient,
  userId: string,
  resourceType: ResourceType,
  amount: number = 1
): Promise<OverageCheckResult> {
  // Get user's organization
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", userId)
    .single();

  const orgId = (userData as { organization_id?: string } | null)?.organization_id;
  
  if (!orgId) {
    return {
      allowed: false,
      organizationId: "",
      currentUsage: 0,
      limit: 0,
      isOverage: false,
      error: NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      ),
    };
  }

  // Get organization plan
  const { data: orgData } = await supabase
    .from("organizations")
    .select("plan")
    .eq("id", orgId)
    .single();

  const plan = (orgData as { plan?: string } | null)?.plan || "starter";
  const limits = getPlanLimits(plan);

  // Get current usage
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { data: usageData } = await supabase
    .from("usage")
    .select("*")
    .eq("organization_id", orgId)
    .eq("period", period)
    .single();

  const usage = usageData as Record<string, number> | null;
  const dbField = RESOURCE_TO_DB_FIELD[resourceType];
  const limitField = RESOURCE_TO_PLAN_LIMIT[resourceType] as keyof typeof limits;
  
  const currentUsage = (usage?.[dbField] as number) || 0;
  const limit = limits[limitField] as number;

  // Check if within plan limits
  if (currentUsage + amount <= limit) {
    return {
      allowed: true,
      organizationId: orgId,
      currentUsage,
      limit,
      isOverage: false,
    };
  }

  // Over limit - check overage settings
  const overageResource: OverageResource = {
    type: resourceType,
    amount,
  };

  const overageCheck = await checkOverage(orgId, overageResource);

  if (overageCheck.allowed) {
    return {
      allowed: true,
      organizationId: orgId,
      currentUsage,
      limit,
      isOverage: true,
      overageCostCents: overageCheck.costCents,
    };
  }

  // Not allowed - return appropriate error
  let message = overageCheck.reason || "Usage limit reached";
  
  if (overageCheck.action === "set_cap") {
    message = `You've reached your ${resourceType} limit. Enable pay-as-you-go overages in Settings → Billing to continue.`;
  } else if (overageCheck.action === "increase_cap") {
    message = `You've reached your spending cap. Increase your cap in Settings → Billing to continue.`;
  }

  return {
    allowed: false,
    organizationId: orgId,
    currentUsage,
    limit,
    isOverage: false,
    error: NextResponse.json(
      { 
        error: message,
        code: "USAGE_LIMIT_REACHED",
        action: overageCheck.action,
        currentUsage,
        limit,
      },
      { status: 429 }
    ),
  };
}

// ============================================
// RECORD USAGE AFTER OPERATION
// ============================================

/**
 * Record usage after a successful operation
 * Call this AFTER the operation completes successfully
 */
export async function recordUsage(
  supabase: SupabaseClient,
  organizationId: string,
  resourceType: ResourceType,
  amount: number = 1,
  description?: string
): Promise<void> {
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const dbField = RESOURCE_TO_DB_FIELD[resourceType];

  // Get current usage
  const { data: existingUsage } = await supabase
    .from("usage")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("period", period)
    .single();

  if (existingUsage) {
    // Update existing record
    const currentValue = (existingUsage as Record<string, number>)[dbField] || 0;
    await supabase
      .from("usage")
      .update({
        [dbField]: currentValue + amount,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("organization_id", organizationId)
      .eq("period", period);
  } else {
    // Create new usage record
    await supabase
      .from("usage")
      .insert({
        organization_id: organizationId,
        period,
        [dbField]: amount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never);
  }

  // If this was an overage, record it
  const overageResource: OverageResource = {
    type: resourceType,
    amount,
    description,
  };
  
  await recordOverage(organizationId, overageResource);
}

// ============================================
// CONVENIENCE WRAPPER
// ============================================

/**
 * Wrapper that checks limits, performs operation, and records usage
 */
export async function withOverageTracking<T>(
  supabase: SupabaseClient,
  userId: string,
  resourceType: ResourceType,
  amount: number,
  operation: () => Promise<T>,
  description?: string
): Promise<{ success: true; data: T } | { success: false; error: NextResponse }> {
  // Check if allowed
  const check = await canPerformOperation(supabase, userId, resourceType, amount);
  
  if (!check.allowed) {
    return { success: false, error: check.error! };
  }

  try {
    // Perform the operation
    const result = await operation();

    // Record usage
    await recordUsage(supabase, check.organizationId, resourceType, amount, description);

    return { success: true, data: result };
  } catch (error) {
    // Operation failed - don't record usage
    throw error;
  }
}

