/**
 * /api/referrals - Referral Program API
 *
 * GET: Get referral code, URL, and stats for the authenticated user's org
 * POST: Generate a unique referral code for the org if it doesn't have one
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

function getDbClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

// GET - Get referral info and stats
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDbClient() || supabase;

    // Get user's organization
    const { data: userDataRaw } = await db
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    const userData = userDataRaw as { organization_id: string } | null;
    if (!userData?.organization_id) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const orgId = userData.organization_id;

    // Get org's referral code
    const { data: org } = await db
      .from("organizations")
      .select("referral_code")
      .eq("id", orgId)
      .maybeSingle();

    const orgData = org as { referral_code: string | null } | null;
    const referralCode = orgData?.referral_code || null;

    // Get referral stats
    const { data: referralsData } = await db
      .from("referrals")
      .select("id, status, reward_applied, referred_email, created_at")
      .eq("referrer_organization_id", orgId)
      .order("created_at", { ascending: false });

    const referralsList = (referralsData || []) as {
      id: string;
      status: string;
      reward_applied: boolean;
      referred_email: string | null;
      created_at: string;
    }[];

    const totalReferred = referralsList.length;
    const signedUp = referralsList.filter(
      (r) => r.status === "signed_up" || r.status === "converted"
    ).length;
    const converted = referralsList.filter(
      (r) => r.status === "converted"
    ).length;
    const rewardsEarned = referralsList.filter(
      (r) => r.reward_applied === true
    ).length;

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    return NextResponse.json({
      referralCode,
      referralUrl: referralCode ? `${baseUrl}/?ref=${referralCode}` : null,
      stats: {
        totalReferred,
        signedUp,
        converted,
        rewardsEarned,
      },
      referrals: referralsList.slice(0, 20),
    });
  } catch (error) {
    console.error("[Referrals GET] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Generate referral code
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDbClient() || supabase;

    // Get user's organization
    const { data: userDataRaw2 } = await db
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    const userData2 = userDataRaw2 as { organization_id: string } | null;
    if (!userData2?.organization_id) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const orgId = userData2.organization_id;

    // Check if org already has a referral code
    const { data: org } = await db
      .from("organizations")
      .select("referral_code")
      .eq("id", orgId)
      .maybeSingle();

    const orgData = org as { referral_code: string | null } | null;

    if (orgData?.referral_code) {
      return NextResponse.json({
        referralCode: orgData.referral_code,
        message: "Referral code already exists",
      });
    }

    // Generate unique referral code
    const referralCode = `ref_${crypto.randomBytes(6).toString("hex")}`;

    // Update organization with referral code
    await (db.from("organizations") as any).update({
      referral_code: referralCode,
    }).eq("id", orgId);

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    return NextResponse.json({
      referralCode,
      referralUrl: `${baseUrl}/?ref=${referralCode}`,
      message: "Referral code generated",
    });
  } catch (error) {
    console.error("[Referrals POST] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
