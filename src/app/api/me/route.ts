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
import { getTestSession } from "@/lib/testing/test-session";
import { cookies } from "next/headers";

// Safe service client
function getDbClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

const TESTING_MODE = process.env.TESTING_MODE === "true";

// Check for test bypass session (only active in TESTING_MODE)
async function getBypassSession() {
  if (!TESTING_MODE) return null;

  try {
    const cookieStore = await cookies();
    const bypassCookie = cookieStore.get("test_bypass_session");
    if (bypassCookie) {
      const session = JSON.parse(bypassCookie.value);
      if (session.bypassMode) {
        return session;
      }
    }
  } catch {
    // Ignore cookie parse errors
  }
  return null;
}

export async function GET() {
  try {
    // Check for test bypass session FIRST (highest priority for testing)
    const bypassSession = await getBypassSession();
    if (bypassSession) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: `bypass-${bypassSession.plan}`,
          email: bypassSession.email,
          name: bypassSession.name,
        },
        organization: {
          id: bypassSession.organizationId,
          plan: bypassSession.plan,
          status: "active",
          createdAt: bypassSession.createdAt,
        },
        sites: [],
        currentSite: null,
        bypassMode: true,
      });
    }

    // Check Supabase auth (real auth takes priority over test session cookie)
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ 
        authenticated: false,
        error: "Not configured" 
      });
    }

    // Get user from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // If no Supabase user, fall back to test session cookie (only in TESTING_MODE)
    if (authError || !user) {
      const testSession = TESTING_MODE ? await getTestSession() : null;
      if (testSession) {
        // Return test session data - no Supabase needed
        return NextResponse.json({
          authenticated: true,
          user: {
            id: `test-${testSession.email}`,
            email: testSession.email,
            name: testSession.name,
          },
          organization: {
            id: `test-org-${testSession.email}`,
            plan: testSession.plan,
            status: "active",
            createdAt: new Date().toISOString(),
          },
          sites: [],
          currentSite: null,
        });
      }
      
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
      // Create organization for user (free trial)
      const slug = (user.email?.split("@")[0]?.replace(/[^a-z0-9]/gi, "") || "user") + "-" + Date.now();
      
      const { data: newOrg } = await db
        .from("organizations")
        .insert({
          name: user.user_metadata?.name || user.email?.split("@")[0] || "My Organization",
          slug,
          plan: "free",
          subscription_status: "active",
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

    // Get organization details (including created_at for trial calculation)
    if (orgId) {
      const { data: org } = await db
        .from("organizations")
        .select("plan, subscription_status, created_at")
        .eq("id", orgId)
        .maybeSingle();
      
      orgData = org as { plan: string; subscription_status: string; created_at: string } | null;
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
