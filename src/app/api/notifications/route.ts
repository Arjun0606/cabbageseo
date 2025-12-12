/**
 * Notifications API
 * 
 * GET - Fetch notifications for current user
 * POST - Mark notifications as read
 * DELETE - Delete a notification
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: string;
  category: string;
  read: boolean;
  action_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// GET - Fetch notifications
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const category = searchParams.get("category");

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq("read", false);
    }

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Notifications API] Fetch error:", error);
      throw error;
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);

    const notifications = ((data || []) as NotificationRow[]).map(n => ({
      id: n.id,
      title: n.title,
      description: n.description,
      type: n.type,
      category: n.category,
      read: n.read,
      actionUrl: n.action_url,
      metadata: n.metadata,
      createdAt: n.created_at,
    }));

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount: unreadCount || 0,
    });

  } catch (error) {
    console.error("[Notifications API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// POST - Mark notifications as read
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
    const { notificationIds, markAll } = body;

    if (markAll) {
      // Mark all as read
      const { error } = await supabase
        .from("notifications")
        .update({ read: true } as never)
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) throw error;

      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ error: "notificationIds required" }, { status: 400 });
    }

    // Mark specific notifications as read
    const { error } = await supabase
      .from("notifications")
      .update({ read: true } as never)
      .in("id", notificationIds)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: `${notificationIds.length} notification(s) marked as read` 
    });

  } catch (error) {
    console.error("[Notifications API] Mark read error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to mark as read" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a notification
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Notification deleted" });

  } catch (error) {
    console.error("[Notifications API] Delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete notification" },
      { status: 500 }
    );
  }
}

