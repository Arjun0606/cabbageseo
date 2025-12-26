/**
 * API Subscription Requirement Helper
 * 
 * Use this in API routes to require a paid subscription
 */

import { NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { getSubscriptionInfo, type PlanId } from "@/lib/billing";

// ============================================
// 🔓 TESTING MODE - SUBSCRIPTION CHECKS DISABLED
// Set TESTING_MODE=true in .env for local testing
// ============================================
const TESTING_MODE = process.env.TESTING_MODE === "true";

export interface SubscriptionCheckResult {
  authorized: boolean;
  organizationId?: string;
  userId?: string;
  plan?: PlanId;
  error?: NextResponse;
}

/**
 * Check if user has an active paid subscription
 * Returns organization ID if authorized, or an error response
 */
export async function requireSubscription(
  supabase: SupabaseClient,
  options?: {
    allowTrial?: boolean;  // Allow trialing users (default: true)
    minPlan?: PlanId;      // Minimum plan required (default: "starter")
  }
): Promise<SubscriptionCheckResult> {
  const { allowTrial = true, minPlan = "starter" } = options || {};

  // In testing mode, get user info but always authorize
  if (TESTING_MODE) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        authorized: false,
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }
    
    // Get org ID for context
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    
    const organizationId = (userData as { organization_id?: string } | null)?.organization_id;
    
    return {
      authorized: true,
      organizationId: organizationId || undefined,
      userId: user.id,
      plan: "pro", // Pretend they're on pro in testing
    };
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return {
      authorized: false,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // Get user's organization
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const organizationId = (userData as { organization_id?: string } | null)?.organization_id;

  if (!organizationId) {
    return {
      authorized: false,
      userId: user.id,
      error: NextResponse.json(
        { error: "No organization found. Please complete onboarding." },
        { status: 403 }
      ),
    };
  }

  // Get organization subscription info
  const { data: org } = await supabase
    .from("organizations")
    .select("plan, subscription_status, current_period_end")
    .eq("id", organizationId)
    .single();

  const subscriptionInfo = getSubscriptionInfo(org);

  // Check if user can access paid features
  if (!subscriptionInfo.canAccessPaidFeatures) {
    // Allow trial users if option is set
    if (subscriptionInfo.isTrial && !allowTrial) {
      return {
        authorized: false,
        organizationId,
        userId: user.id,
        plan: subscriptionInfo.plan,
        error: NextResponse.json(
          { 
            error: "Trial expired. Please upgrade to continue.",
            code: "TRIAL_EXPIRED",
            upgradeUrl: "/pricing",
          },
          { status: 402 }
        ),
      };
    }

    // Free users can't access paid features
    if (!subscriptionInfo.isPaid && !subscriptionInfo.isTrial) {
      return {
        authorized: false,
        organizationId,
        userId: user.id,
        plan: subscriptionInfo.plan,
        error: NextResponse.json(
          { 
            error: "This feature requires a paid subscription.",
            code: "SUBSCRIPTION_REQUIRED",
            upgradeUrl: "/pricing",
          },
          { status: 402 }
        ),
      };
    }
  }

  // Check minimum plan requirement
  const planOrder: PlanId[] = ["starter", "pro", "pro_plus"];
  const currentPlanIndex = planOrder.indexOf(subscriptionInfo.plan);
  const minPlanIndex = planOrder.indexOf(minPlan);

  if (currentPlanIndex < minPlanIndex && currentPlanIndex !== -1) {
    return {
      authorized: false,
      organizationId,
      userId: user.id,
      plan: subscriptionInfo.plan,
      error: NextResponse.json(
        { 
          error: `This feature requires the ${minPlan.replace("_", " ")} plan or higher.`,
          code: "PLAN_UPGRADE_REQUIRED",
          currentPlan: subscriptionInfo.plan,
          requiredPlan: minPlan,
          upgradeUrl: "/pricing",
        },
        { status: 402 }
      ),
    };
  }

  return {
    authorized: true,
    organizationId,
    userId: user.id,
    plan: subscriptionInfo.plan,
  };
}

/**
 * Check if user is authenticated (but not necessarily subscribed)
 * For features available to all logged-in users
 */
export async function requireAuth(
  supabase: SupabaseClient
): Promise<SubscriptionCheckResult> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return {
      authorized: false,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // Get user's organization
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const organizationId = (userData as { organization_id?: string } | null)?.organization_id;

  // Get plan info if org exists
  let plan: PlanId = "starter";
  if (organizationId) {
    const { data: org } = await supabase
      .from("organizations")
      .select("plan")
      .eq("id", organizationId)
      .single();
    plan = ((org as { plan?: string } | null)?.plan as PlanId) || "starter";
  }

  return {
    authorized: true,
    organizationId: organizationId || undefined,
    userId: user.id,
    plan,
  };
}

