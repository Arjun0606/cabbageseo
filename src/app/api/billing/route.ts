/**
 * Billing API Routes
 * 
 * Handles:
 * - Checkout session creation
 * - Subscription management
 * - On-demand credit purchases
 * - Usage stats
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { dodo } from "@/lib/billing/dodo-client";
import { usageTracker } from "@/lib/billing/usage-tracker";
import { PLANS, ON_DEMAND_PACKAGES, getPlan, getOnDemandPackage } from "@/lib/billing/plans";
import { protectAPI, validateRequestBody, addSecurityHeaders } from "@/lib/security/api-protection";

export async function POST(request: NextRequest) {
  // Protect endpoint
  const blocked = await protectAPI(request, { 
    rateLimit: "api",
    allowedMethods: ["POST"],
  });
  if (blocked) return blocked;

  try {
    // Authenticate user
    const supabase = createServiceClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get organization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: orgMember } = await (supabase as any)
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single();

    if (!orgMember) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // Parse request
    const body = await request.json();
    const { valid, data, errors } = validateRequestBody(body, {
      action: { type: "string", required: true },
      planId: { type: "string", required: false },
      packageId: { type: "string", required: false },
    });

    if (!valid) {
      return NextResponse.json({ error: "Invalid request", details: errors }, { status: 400 });
    }

    const action = data.action as string;
    const organizationId = orgMember.organization_id;
    let result: unknown;

    switch (action) {
      // ============================================
      // GET PLANS
      // ============================================
      case "getPlans": {
        result = PLANS.map(plan => ({
          ...plan,
          priceFormatted: plan.price > 0 ? `$${(plan.price / 100).toFixed(0)}/mo` : "Contact us",
        }));
        break;
      }

      // ============================================
      // CREATE CHECKOUT SESSION
      // ============================================
      case "createCheckout": {
        const planId = data.planId as string;
        if (!planId) {
          return NextResponse.json({ error: "Plan ID required" }, { status: 400 });
        }

        const plan = getPlan(planId);
        if (!plan || plan.isEnterprise) {
          return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
        }

        // Get or create Dodo customer
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: org } = await (supabase as any)
          .from("organizations")
          .select("dodo_customer_id, name")
          .eq("id", organizationId)
          .single();

        let customerId = org?.dodo_customer_id;

        if (!customerId) {
          const customer = await dodo.createCustomer({
            email: user.email!,
            name: org?.name || user.email,
            metadata: { organization_id: organizationId },
          });
          customerId = customer.id;

          // Store customer ID
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from("organizations")
            .update({ dodo_customer_id: customerId })
            .eq("id", organizationId);
        }

        // Create checkout session
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const session = await dodo.createCheckoutSession({
          customer_id: customerId,
          product_id: `prod_${planId}`,
          success_url: `${baseUrl}/settings/billing?success=true`,
          cancel_url: `${baseUrl}/settings/billing?canceled=true`,
          metadata: { organization_id: organizationId },
        });

        result = { url: session.url };
        break;
      }

      // ============================================
      // GET SUBSCRIPTION
      // ============================================
      case "getSubscription": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: org } = await (supabase as any)
          .from("organizations")
          .select(`
            plan_id,
            subscription_id,
            subscription_status,
            billing_period_start,
            billing_period_end,
            on_demand_balance,
            on_demand_enabled
          `)
          .eq("id", organizationId)
          .single();

        const plan = getPlan(org?.plan_id || "starter");

        result = {
          plan: plan ? {
            id: plan.id,
            name: plan.name,
            price: plan.price,
            features: plan.features,
            limits: plan.limits,
          } : null,
          subscription: {
            status: org?.subscription_status || "active",
            periodStart: org?.billing_period_start,
            periodEnd: org?.billing_period_end,
          },
          onDemand: {
            enabled: org?.on_demand_enabled || false,
            balance: org?.on_demand_balance || 0,
          },
        };
        break;
      }

      // ============================================
      // GET USAGE STATS
      // ============================================
      case "getUsage": {
        const stats = await usageTracker.getAllUsageStats(organizationId);
        const balance = await usageTracker.getOnDemandBalance(organizationId);

        result = {
          stats,
          onDemand: balance,
        };
        break;
      }

      // ============================================
      // PURCHASE ON-DEMAND CREDITS
      // ============================================
      case "purchaseCredits": {
        const packageId = data.packageId as string;
        if (!packageId) {
          return NextResponse.json({ error: "Package ID required" }, { status: 400 });
        }

        const pkg = getOnDemandPackage(packageId);
        if (!pkg) {
          return NextResponse.json({ error: "Invalid package" }, { status: 400 });
        }

        // Get customer ID
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: org } = await (supabase as any)
          .from("organizations")
          .select("dodo_customer_id")
          .eq("id", organizationId)
          .single();

        if (!org?.dodo_customer_id) {
          return NextResponse.json({ error: "Please subscribe to a plan first" }, { status: 400 });
        }

        // Create payment intent
        const paymentIntent = await dodo.createPaymentIntent({
          amount: pkg.price,
          customer_id: org.dodo_customer_id,
          description: `${pkg.name} - On-demand credits`,
          metadata: {
            organization_id: organizationId,
            type: "on_demand_credits",
            package_id: packageId,
          },
        });

        result = {
          clientSecret: paymentIntent.client_secret,
          amount: pkg.price,
          credits: pkg.credits,
        };
        break;
      }

      // ============================================
      // ENABLE/DISABLE ON-DEMAND
      // ============================================
      case "setOnDemandEnabled": {
        const enabled = body.enabled === true;
        await usageTracker.setOnDemandEnabled(organizationId, enabled);
        result = { enabled };
        break;
      }

      // ============================================
      // CANCEL SUBSCRIPTION
      // ============================================
      case "cancelSubscription": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: org } = await (supabase as any)
          .from("organizations")
          .select("subscription_id")
          .eq("id", organizationId)
          .single();

        if (!org?.subscription_id) {
          return NextResponse.json({ error: "No active subscription" }, { status: 400 });
        }

        await dodo.cancelSubscription(org.subscription_id, false);
        result = { canceled: true };
        break;
      }

      // ============================================
      // CHANGE PLAN
      // ============================================
      case "changePlan": {
        const planId = data.planId as string;
        if (!planId) {
          return NextResponse.json({ error: "Plan ID required" }, { status: 400 });
        }

        const plan = getPlan(planId);
        if (!plan || plan.isEnterprise) {
          return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: org } = await (supabase as any)
          .from("organizations")
          .select("subscription_id")
          .eq("id", organizationId)
          .single();

        if (!org?.subscription_id) {
          return NextResponse.json({ error: "No active subscription" }, { status: 400 });
        }

        await dodo.updateSubscription(org.subscription_id, {
          product_id: `prod_${planId}`,
        });

        result = { updated: true, planId };
        break;
      }

      // ============================================
      // GET INVOICES
      // ============================================
      case "getInvoices": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: org } = await (supabase as any)
          .from("organizations")
          .select("dodo_customer_id")
          .eq("id", organizationId)
          .single();

        if (!org?.dodo_customer_id) {
          result = [];
          break;
        }

        const invoices = await dodo.listInvoices(org.dodo_customer_id);
        result = invoices;
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const response = NextResponse.json({ success: true, data: result });
    return addSecurityHeaders(response);

  } catch (error) {
    console.error("[Billing API] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

