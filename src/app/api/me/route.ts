/**
 * /api/me - THE SINGLE SOURCE OF TRUTH
 * 
 * Returns everything about the current user in ONE call:
 * - User info
 * - Organization
 * - All sites
 * - Plan & usage
 * 
 * This is the ONLY endpoint the dashboard needs.
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
    // Get auth client
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ 
        authenticated: false,
        error: "Not configured" 
      });
    }

    // Get user
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
    let orgData: { plan: string; subscription_status: string } | null = null;

    // Check if user exists in our users table
    const { data: existingUser } = await db
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (existingUser?.organization_id) {
      orgId = existingUser.organization_id;
    } else {
      // Create organization for user
      const slug = (user.email?.split("@")[0]?.replace(/[^a-z0-9]/gi, "") || "user") + "-" + Date.now();
      
      const { data: newOrg } = await db
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
        orgId = newOrg.id;

        // Create or update user record
        if (!existingUser) {
          await db.from("users").insert({
            id: user.id,
            organization_id: orgId,
            email: user.email || "",
            name: user.user_metadata?.name || null,
            role: "owner",
          });
        } else {
          await db.from("users").update({ organization_id: orgId }).eq("id", user.id);
        }
      }
    }

    // Get organization details
    if (orgId) {
      const { data: org } = await db
        .from("organizations")
        .select("plan, subscription_status")
        .eq("id", orgId)
        .maybeSingle();
      
      orgData = org as { plan: string; subscription_status: string } | null;
    }

    // Get sites with citation data
    let sites: Array<{
      id: string;
      domain: string;
      totalCitations: number;
      citationsThisWeek: number;
      lastCheckedAt: string | null;
    }> = [];

    if (orgId) {
      const { data: sitesData } = await db
        .from("sites")
        .select("id, domain, name, total_citations, citations_this_week, last_checked_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (sitesData) {
        sites = sitesData.map((s: { id: string; domain: string; total_citations?: number; citations_this_week?: number; last_checked_at?: string }) => ({
          id: s.id,
          domain: s.domain,
          totalCitations: s.total_citations || 0,
          citationsThisWeek: s.citations_this_week || 0,
          lastCheckedAt: s.last_checked_at || null,
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
        plan: orgData?.plan || "starter",
        status: orgData?.subscription_status || "active",
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

