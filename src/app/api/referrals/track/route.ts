/**
 * /api/referrals/track - Track Referral Signup
 *
 * POST: Records a referral when a new user signs up with a referral code
 *   - Validates referral code exists in an org
 *   - Prevents self-referral
 *   - Creates referral record in referrals table
 *   - Sets referred_by on the new org
 *   - Extends trial to 14 days
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/api/get-user";
import type { SupabaseClient } from "@supabase/supabase-js";

function getDbClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth check — prevent unauthenticated referral abuse
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { referralCode, email, organizationId } = body as {
      referralCode: string;
      email?: string;
      organizationId: string;
    };

    if (!referralCode || !organizationId) {
      return NextResponse.json(
        { error: "referralCode and organizationId are required" },
        { status: 400 }
      );
    }

    // Verify the organizationId matches the authenticated user's org
    if (organizationId !== currentUser.organizationId) {
      return NextResponse.json(
        { error: "Cannot track referral for another organization" },
        { status: 403 }
      );
    }

    const db = getDbClient();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // Find the organization that owns this referral code
    const { data: referrerOrg } = await db
      .from("organizations")
      .select("id, referral_code")
      .eq("referral_code", referralCode)
      .maybeSingle();

    const referrerOrgData = referrerOrg as {
      id: string;
      referral_code: string;
    } | null;

    if (!referrerOrgData) {
      return NextResponse.json(
        { error: "Invalid referral code" },
        { status: 404 }
      );
    }

    // Prevent self-referral
    if (referrerOrgData.id === organizationId) {
      return NextResponse.json(
        { error: "Cannot refer yourself" },
        { status: 400 }
      );
    }

    // Create referral record
    await (db.from("referrals") as any).insert({
      referrer_organization_id: referrerOrgData.id,
      referral_code: referralCode,
      referred_email: email || null,
      referred_organization_id: organizationId,
      status: "signed_up",
    });

    // Set referred_by on the new organization
    await (db.from("organizations") as any)
      .update({ referred_by: referralCode })
      .eq("id", organizationId);

    // Extend trial to 14 days for the referred user
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    await (db.from("organizations") as any)
      .update({ trial_ends_at: trialEnd.toISOString() })
      .eq("id", organizationId);

    return NextResponse.json({
      success: true,
      message: "Referral tracked successfully",
      trialExtended: true,
      trialEndsAt: trialEnd.toISOString(),
    });
  } catch (error) {
    console.error("[Referral Track] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
