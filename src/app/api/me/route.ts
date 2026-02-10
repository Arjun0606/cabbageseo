/**
 * /api/me - THE SINGLE SOURCE OF TRUTH
 * 
 * Returns everything about the current user in ONE call:
 * - User info
 * - Organization (with createdAt for trial calculation)
 * - All sites
 * - Plan & usage
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Safe service client
function getDbClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({
        authenticated: false,
        error: "Not configured"
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        authenticated: false
      });
    }

    // Use service client for DB (bypasses RLS)
    const db = getDbClient() || supabase;

    // Get or create user profile with organization
    let orgId: string | null = null;
    let orgData: {
      plan: string;
      subscription_status: string;
      created_at: string;
      trial_ends_at: string | null;
    } | null = null;

    // Check if user exists in our users table
    const { data: existingUser } = await db
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (existingUser?.organization_id) {
      orgId = existingUser.organization_id;
    } else {
      // Create organization for user (free — must subscribe to access dashboard)
      const slug = (user.email?.split("@")[0]?.replace(/[^a-z0-9]/gi, "") || "user") + "-" + Date.now();

      const { data: newOrg } = await db
        .from("organizations")
        .insert({
          name: user.user_metadata?.name || user.email?.split("@")[0] || "My Organization",
          slug,
          plan: "free",
          subscription_status: "inactive",
        })
        .select("id, created_at")
        .single();

      if (newOrg) {
        orgId = newOrg.id;

        // Create user record
        await db.from("users").upsert({
          id: user.id,
          organization_id: orgId,
          email: user.email || "",
          name: user.user_metadata?.name || null,
          role: "owner",
        });
      }
    }

    // Get organization details (including trial_ends_at for trial calculation)
    if (orgId) {
      const { data: org } = await db
        .from("organizations")
        .select("plan, subscription_status, created_at, trial_ends_at")
        .eq("id", orgId)
        .maybeSingle();

      orgData = org as { plan: string; subscription_status: string; created_at: string; trial_ends_at: string | null } | null;
    }
    
    const finalPlan = orgData?.plan || "free";

    // Get sites with citation data
    interface SiteRecord {
      id: string;
      domain: string;
      name?: string;
      total_citations?: number;
      citations_this_week?: number;
      citations_last_week?: number;
      last_checked_at?: string;
      geo_score_avg?: number;
    }

    interface SiteResponse {
      id: string;
      domain: string;
      name?: string;
      totalCitations: number;
      citationsThisWeek: number;
      citationsLastWeek: number;
      lastCheckedAt: string | null;
      geoScore: number | null;
    }

    let sites: SiteResponse[] = [];

    if (orgId) {
      const { data: sitesData } = await db
        .from("sites")
        .select("id, domain, name, total_citations, citations_this_week, citations_last_week, last_checked_at, geo_score_avg")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (sitesData) {
        sites = (sitesData as SiteRecord[]).map((s) => ({
          id: s.id,
          domain: s.domain,
          name: s.name,
          totalCitations: s.total_citations || 0,
          citationsThisWeek: s.citations_this_week || 0,
          citationsLastWeek: s.citations_last_week || 0,
          lastCheckedAt: s.last_checked_at || null,
          geoScore: s.geo_score_avg ?? null,
        }));
      }
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split("@")[0],
      },
      organization: orgId ? {
        id: orgId,
        plan: finalPlan,
        status: orgData?.subscription_status || "active",
        createdAt: orgData?.created_at || new Date().toISOString(),
        trialEndsAt: orgData?.trial_ends_at || null,
      } : null,
      sites,
      currentSite: sites.length > 0 ? sites[0] : null,
    });

  } catch (error) {
    console.error("[/api/me] Error:", error);
    return NextResponse.json({ 
      authenticated: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
