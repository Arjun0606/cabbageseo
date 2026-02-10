/**
 * Account Settings API
 * 
 * Get and update user account settings
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  role: string;
  organization_id: string;
  email_verified: boolean;
  created_at: string;
}

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  settings: Record<string, unknown> | null;
}

// GET - Get account settings
export async function GET() {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service client for database operations (bypasses RLS)
  let serviceClient;
  try {
    serviceClient = createServiceClient();
  } catch (e) {
    console.error("[Account API GET] Failed to create service client:", e);
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    // Get user profile
    let { data: userData, error: userError } = await serviceClient
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    // If user doesn't exist, create them
    if (userError || !userData) {
      console.log("[Account API] Creating missing user profile for:", user.email);
      
      // First, check if they have an org or create one
      let orgId: string | null = null;
      
      // Check if user already has an org via users table (owner_id doesn't exist on orgs)
      const { data: existingUserOrg } = await serviceClient
        .from("users")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();

      const userOrgData = existingUserOrg as { organization_id?: string } | null;
      if (userOrgData?.organization_id) {
        orgId = userOrgData.organization_id;
      } else {
        // Create org with free plan
        const { data: newOrg, error: orgError } = await serviceClient
          .from("organizations")
          .insert({
            name: `${user.email?.split("@")[0] || "My"}'s Organization`,
            slug: `org-${user.id.slice(0, 8)}-${Date.now()}`,
            plan: "free",
            subscription_status: "inactive",
          } as never)
          .select("id")
          .single();
        
        if (!orgError && newOrg) {
          orgId = (newOrg as { id: string }).id;
        }
      }
      
      if (orgId) {
        // Create user (use serviceClient to bypass RLS, consistent with org creation above)
        const { data: newUser, error: createError } = await serviceClient
          .from("users")
          .upsert({
            id: user.id,
            organization_id: orgId,
            email: user.email!,
            name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            role: "owner",
            email_verified: true,
          } as never)
          .select()
          .single();
        
        if (!createError && newUser) {
          userData = newUser;
        }
      }
    }

    const profile = userData as UserRow | null;
    if (!profile) {
      return NextResponse.json({ error: "Failed to load or create user profile" }, { status: 500 });
    }

    // Get organization
    const { data: orgData } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", profile.organization_id)
      .single();

    const org = orgData as OrgRow | null;
    const orgSettings = (org?.settings || {}) as Record<string, unknown>;

    return NextResponse.json({
      success: true,
      data: {
        id: profile.id,
        name: profile.name || "",
        email: profile.email,
        avatarUrl: profile.avatar_url,
        role: profile.role,
        emailVerified: profile.email_verified,
        createdAt: profile.created_at,
        organization: org ? {
          id: org.id,
          name: org.name,
          slug: org.slug,
          plan: org.plan || "free",
          website: orgSettings.website || "",
          timezone: orgSettings.timezone || "UTC",
        } : null,
      },
    });

  } catch (error) {
    console.error("[Account API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch account" },
      { status: 500 }
    );
  }
}

// PUT - Update account settings
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service client for database operations (bypasses RLS)
  let serviceClient;
  try {
    serviceClient = createServiceClient();
  } catch (e) {
    console.error("[Account API PATCH] Failed to create service client:", e);
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { name, timezone, website, organizationName } = body;

    // Get user's organization
    const { data: userData } = await serviceClient
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = (userData as { organization_id?: string } | null)?.organization_id;

    // Update user profile if name changed
    if (name !== undefined) {
      await supabase
        .from("users")
        .update({ name, updated_at: new Date().toISOString() } as never)
        .eq("id", user.id);
    }

    // Update organization if needed
    if (orgId && (timezone !== undefined || website !== undefined || organizationName !== undefined)) {
      // Get current org settings
      const { data: orgData } = await supabase
        .from("organizations")
        .select("settings")
        .eq("id", orgId)
        .single();

      const currentSettings = ((orgData as { settings?: Record<string, unknown> } | null)?.settings || {}) as Record<string, unknown>;
      
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (organizationName !== undefined) {
        updates.name = organizationName;
      }

      if (timezone !== undefined || website !== undefined) {
        updates.settings = {
          ...currentSettings,
          ...(timezone !== undefined && { timezone }),
          ...(website !== undefined && { website }),
        };
      }

      await supabase
        .from("organizations")
        .update(updates as never)
        .eq("id", orgId);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Account API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update account" },
      { status: 500 }
    );
  }
}

// DELETE - Delete account
export async function DELETE() {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service client for database operations (bypasses RLS)
  let serviceClient;
  try {
    serviceClient = createServiceClient();
  } catch (e) {
    console.error("[Account API DELETE] Failed to create service client:", e);
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    // Get user's organization and role
    const { data: userData } = await serviceClient
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    const profile = userData as { organization_id?: string; role?: string } | null;
    const orgId = profile?.organization_id;
    const isOwner = profile?.role === "owner";

    // If user is org owner, delete the entire organization and all its data
    if (isOwner && orgId) {
      // First, get all site IDs for this organization
      const { data: sitesData } = await supabase
        .from("sites")
        .select("id")
        .eq("organization_id", orgId);
      
      const siteIds = (sitesData as { id: string }[] | null)?.map(s => s.id) || [];

      if (siteIds.length > 0) {
        // Delete all site-related data (child tables first)
        await serviceClient.from("sprint_actions").delete().in("site_id", siteIds);
        await serviceClient.from("competitors").delete().in("site_id", siteIds);
        await serviceClient.from("source_listings").delete().in("site_id", siteIds);
        await serviceClient.from("market_share_snapshots").delete().in("site_id", siteIds);
        await serviceClient.from("geo_analyses").delete().in("site_id", siteIds);
        await serviceClient.from("generated_pages").delete().in("site_id", siteIds);
        await serviceClient.from("content_ideas").delete().in("site_id", siteIds);
        await serviceClient.from("keyword_clusters").delete().in("site_id", siteIds);
        await serviceClient.from("rankings").delete().in("site_id", siteIds);
        await serviceClient.from("aio_analyses").delete().in("site_id", siteIds);
        await serviceClient.from("entities").delete().in("site_id", siteIds);
        await serviceClient.from("citations").delete().in("site_id", siteIds);
        await serviceClient.from("content").delete().in("site_id", siteIds);
        await serviceClient.from("keywords").delete().in("site_id", siteIds);
        await serviceClient.from("issues").delete().in("site_id", siteIds);
        await serviceClient.from("pages").delete().in("site_id", siteIds);
        await serviceClient.from("audits").delete().in("site_id", siteIds);
        await serviceClient.from("sites").delete().eq("organization_id", orgId);
      }

      // Delete organization-level data
      // notifications table uses user_id — delete for all users in this org
      const { data: orgUsers } = await serviceClient.from("users").select("id").eq("organization_id", orgId);
      if (orgUsers?.length) {
        await serviceClient.from("notifications").delete().in("user_id", (orgUsers as { id: string }[]).map(u => u.id));
      }
      await serviceClient.from("monthly_checkpoints").delete().eq("organization_id", orgId);
      await serviceClient.from("referrals").delete().eq("referrer_organization_id", orgId);
      await serviceClient.from("integrations").delete().eq("organization_id", orgId);
      await serviceClient.from("tasks").delete().eq("organization_id", orgId);
      await serviceClient.from("usage").delete().eq("organization_id", orgId);
      await serviceClient.from("credit_balance").delete().eq("organization_id", orgId);
      await serviceClient.from("users").delete().eq("organization_id", orgId);
      await serviceClient.from("organizations").delete().eq("id", orgId);
    } else if (orgId) {
      // Just delete the user record (not the owner)
      await serviceClient.from("users").delete().eq("id", user.id);
    }

    // Sign out the user
    await supabase.auth.signOut();

    return NextResponse.json({ 
      success: true, 
      message: "Account deleted successfully" 
    });

  } catch (error) {
    console.error("[Account API] Delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete account" },
      { status: 500 }
    );
  }
}
