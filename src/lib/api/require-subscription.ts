/**
 * API Subscription Requirement Helper
 * 
 * Use this in API routes to require a paid subscription
 */

import { NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { getSubscriptionInfo, type PlanId } from "@/lib/billing";
import { createServiceClient } from "@/lib/supabase/server";

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

  // In testing mode, bypass auth entirely and use first organization
  if (TESTING_MODE) {
    // Try to get user if logged in
    const { data: { user } } = await supabase.auth.getUser();
    
    let organizationId: string | undefined;
    let userId: string | undefined = user?.id;
    
    if (user) {
      // Get org from user
      const { data: userData } = await supabase
        .from("users")
        .select("organization_id")
        .eq("id", user.id)
        .single();
      organizationId = (userData as { organization_id?: string } | null)?.organization_id;
    }
    
    // If no org yet, get first org in database
    if (!organizationId) {
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id")
        .limit(1);
      organizationId = (orgs?.[0] as { id: string } | undefined)?.id;
    }
    
    // Always authorize in testing mode
    return {
      authorized: true,
      organizationId,
      userId: userId || "test-user",
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

  // Get user's organization - use service client to bypass RLS
  let serviceClient;
  try {
    serviceClient = createServiceClient();
  } catch {
    serviceClient = supabase;
  }
  
  const { data: userData } = await serviceClient
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  let organizationId = (userData as { organization_id?: string } | null)?.organization_id;

  // Auto-create organization if missing (like /api/me does)
  if (!organizationId) {
    const slug = (user.email?.split("@")[0]?.replace(/[^a-z0-9]/gi, "") || "user") + "-" + Date.now();
    
    const { data: newOrg } = await serviceClient
      .from("organizations")
      .insert({
        name: user.user_metadata?.name || user.email?.split("@")[0] || "My Organization",
        slug,
        plan: "starter",
        subscription_status: "active",
      })
      .select("id")
      .single();

    if (newOrg) {
      organizationId = newOrg.id;

      // Create or update user record
      if (!userData) {
        await serviceClient.from("users").insert({
          id: user.id,
          organization_id: organizationId,
          email: user.email || "",
          name: user.user_metadata?.name || null,
          role: "owner",
        });
      } else {
        await serviceClient.from("users").update({ organization_id: organizationId }).eq("id", user.id);
      }
    }
  }

  if (!organizationId) {
    return {
      authorized: false,
      userId: user.id,
      error: NextResponse.json(
        { error: "Failed to create organization. Please try again." },
        { status: 500 }
      ),
    };
  }

  // Get organization subscription info (use serviceClient to bypass RLS)
  const { data: org } = await serviceClient
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

