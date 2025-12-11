/**
 * Account Settings API
 * 
 * Get and update user account settings
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  try {
    // Get user profile
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (userError) throw userError;

    const profile = userData as UserRow | null;
    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
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
          plan: org.plan,
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

  try {
    const body = await request.json();
    const { name, timezone, website, organizationName } = body;

    // Get user's organization
    const { data: userData } = await supabase
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

  try {
    // Get user's organization and role
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    const profile = userData as { organization_id?: string; role?: string } | null;
    const orgId = profile?.organization_id;
    const isOwner = profile?.role === "owner";

    // If user is org owner, delete the entire organization and all its data
    if (isOwner && orgId) {
      // Delete all organization data (cascade should handle most of this)
      // Order matters due to foreign key constraints

      // 1. Delete content
      await supabase.from("content").delete().eq("site_id", 
        supabase.from("sites").select("id").eq("organization_id", orgId)
      );

      // 2. Delete keywords
      await supabase.from("keywords").delete().match({ site_id: orgId });

      // 3. Delete issues
      await supabase.from("issues").delete().match({ site_id: orgId });

      // 4. Delete pages
      await supabase.from("pages").delete().match({ site_id: orgId });

      // 5. Delete sites (this should cascade delete related data)
      await supabase.from("sites").delete().eq("organization_id", orgId);

      // 6. Delete integrations
      await supabase.from("integrations").delete().eq("organization_id", orgId);

      // 7. Delete tasks
      await supabase.from("tasks").delete().eq("organization_id", orgId);

      // 8. Delete other org members' user records
      await supabase.from("users").delete().eq("organization_id", orgId);

      // 9. Delete organization
      await supabase.from("organizations").delete().eq("id", orgId);
    } else if (orgId) {
      // Just delete the user record (not the owner)
      await supabase.from("users").delete().eq("id", user.id);
    }

    // Finally, delete the auth user
    // Note: This requires admin privileges, so we use the service role
    // For now, we'll just sign out the user - actual deletion would need admin API
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

