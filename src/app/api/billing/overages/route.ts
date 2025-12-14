/**
 * Overages API
 * 
 * Manage spending caps and overage settings
 * 
 * GET - Get current overage summary
 * POST - Enable overages with spending cap
 * PATCH - Update spending cap
 * DELETE - Disable overages
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getOverageSummary,
  enableOverages,
  disableOverages,
  increaseSpendingCap,
  updateOverageSettings,
  getOverageSettings,
} from "@/lib/billing/overage-manager";

// GET - Get current overage summary
export async function GET() {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = (userData as { organization_id?: string } | null)?.organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // Get overage summary
    const summary = await getOverageSummary(orgId);
    const settings = await getOverageSettings(orgId);

    // Get recent charges
    const { data: recentCharges } = await supabase
      .from("overage_charges")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      success: true,
      data: {
        summary,
        settings,
        recentCharges: recentCharges || [],
      },
    });

  } catch (error) {
    console.error("[Overages API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get overages" },
      { status: 500 }
    );
  }
}

// POST - Enable overages with spending cap
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { spendingCapDollars, autoIncrease } = body;

    if (typeof spendingCapDollars !== "number" || spendingCapDollars < 10) {
      return NextResponse.json(
        { error: "Spending cap must be at least $10" },
        { status: 400 }
      );
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    const profile = userData as { organization_id?: string; role?: string } | null;
    const orgId = profile?.organization_id;
    
    if (!orgId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // Only owners/admins can enable overages
    if (profile?.role !== "owner" && profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Only account owners can enable overages" },
        { status: 403 }
      );
    }

    // Convert to cents
    const spendingCapCents = Math.round(spendingCapDollars * 100);

    const result = await enableOverages(orgId, spendingCapCents, autoIncrease ?? false);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Overages enabled with $${spendingCapDollars} spending cap`,
      data: {
        enabled: true,
        spendingCapDollars,
        autoIncrease: autoIncrease ?? false,
      },
    });

  } catch (error) {
    console.error("[Overages API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to enable overages" },
      { status: 500 }
    );
  }
}

// PATCH - Update spending cap or settings
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, amount, autoIncrease } = body;

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    const profile = userData as { organization_id?: string; role?: string } | null;
    const orgId = profile?.organization_id;
    
    if (!orgId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // Only owners/admins can modify overages
    if (profile?.role !== "owner" && profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Only account owners can modify overages" },
        { status: 403 }
      );
    }

    if (action === "increase_cap") {
      // Increase spending cap
      if (typeof amount !== "number" || amount < 10) {
        return NextResponse.json(
          { error: "Amount must be at least $10" },
          { status: 400 }
        );
      }

      const amountCents = Math.round(amount * 100);
      const result = await increaseSpendingCap(orgId, amountCents);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Spending cap increased by $${amount}`,
        data: {
          newCapDollars: result.newCapCents / 100,
        },
      });
    }

    if (action === "set_cap") {
      // Set specific spending cap
      if (typeof amount !== "number" || amount < 10) {
        return NextResponse.json(
          { error: "Cap must be at least $10" },
          { status: 400 }
        );
      }

      const settings = await getOverageSettings(orgId);
      const amountCents = Math.round(amount * 100);
      
      await updateOverageSettings(orgId, {
        ...settings,
        spendingCapCents: amountCents,
      });

      return NextResponse.json({
        success: true,
        message: `Spending cap set to $${amount}`,
        data: {
          spendingCapDollars: amount,
        },
      });
    }

    if (action === "toggle_auto_increase") {
      const settings = await getOverageSettings(orgId);
      
      await updateOverageSettings(orgId, {
        ...settings,
        autoIncreaseEnabled: autoIncrease ?? !settings.autoIncreaseEnabled,
      });

      return NextResponse.json({
        success: true,
        message: `Auto-increase ${autoIncrease ? "enabled" : "disabled"}`,
        data: {
          autoIncrease: autoIncrease ?? !settings.autoIncreaseEnabled,
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use: increase_cap, set_cap, or toggle_auto_increase" },
      { status: 400 }
    );

  } catch (error) {
    console.error("[Overages API] PATCH error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update overages" },
      { status: 500 }
    );
  }
}

// DELETE - Disable overages
export async function DELETE() {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    const profile = userData as { organization_id?: string; role?: string } | null;
    const orgId = profile?.organization_id;
    
    if (!orgId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // Only owners/admins can disable overages
    if (profile?.role !== "owner" && profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Only account owners can disable overages" },
        { status: 403 }
      );
    }

    const result = await disableOverages(orgId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Overages disabled. You will be blocked when plan limits are reached.",
    });

  } catch (error) {
    console.error("[Overages API] DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to disable overages" },
      { status: 500 }
    );
  }
}

