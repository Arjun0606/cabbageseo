/**
 * Autopilot Tasks API
 * 
 * Manages autopilot task queue and execution
 * 
 * REQUIRES: Paid subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSubscription } from "@/lib/api/require-subscription";

interface TaskRow {
  id: string;
  site_id: string;
  type: string;
  name: string;
  description: string | null;
  status: string;
  priority: number;
  scheduled_for: string | null;
  started_at: string | null;
  completed_at: string | null;
  result: unknown;
  error: string | null;
  is_autopilot: boolean;
  created_at: string;
}

// GET - List autopilot tasks
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Autopilot requires paid subscription
  const authCheck = await requireSubscription(supabase);
  if (!authCheck.authorized) {
    return authCheck.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", authCheck.userId)
      .single();

    const orgId = (userData as { organization_id?: string } | null)?.organization_id;
    if (!orgId) {
      return NextResponse.json({ success: true, data: { tasks: [], stats: {} } });
    }

    // Get user's sites
    const { data: sites } = await supabase
      .from("sites")
      .select("id, domain")
      .eq("organization_id", orgId);

    if (!sites || sites.length === 0) {
      return NextResponse.json({ success: true, data: { tasks: [], stats: {} } });
    }

    const siteIds = (sites as { id: string }[]).map(s => s.id);
    const siteLookup = Object.fromEntries(
      (sites as { id: string; domain: string }[]).map(s => [s.id, s.domain])
    );

    // Build query
    let query = supabase
      .from("tasks")
      .select("*")
      .in("site_id", siteId ? [siteId] : siteIds)
      .eq("is_autopilot", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error("Tasks fetch error:", error);
      throw error;
    }

    // Transform tasks
    const transformedTasks = ((tasks || []) as TaskRow[]).map(task => ({
      id: task.id,
      type: mapTaskType(task.type),
      title: task.name,
      description: task.description || "",
      status: mapTaskStatus(task.status),
      progress: calculateProgress(task.status),
      startedAt: task.started_at ? formatTimeAgo(task.started_at) : undefined,
      completedAt: task.completed_at ? formatTimeAgo(task.completed_at) : undefined,
      result: task.result ? formatResult(task.result) : undefined,
      error: task.error,
      siteId: task.site_id,
      siteDomain: siteLookup[task.site_id] || "Unknown",
    }));

    // Calculate stats
    const allTasks = (tasks || []) as TaskRow[];
    const stats = {
      queued: allTasks.filter(t => t.status === "pending").length,
      running: allTasks.filter(t => t.status === "running").length,
      completed: allTasks.filter(t => t.status === "completed").length,
      failed: allTasks.filter(t => t.status === "failed").length,
    };

    return NextResponse.json({
      success: true,
      data: {
        tasks: transformedTasks,
        stats,
      },
    });

  } catch (error) {
    console.error("[Autopilot API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST - Create/queue a new task
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
    const { siteId, type, name, description, priority = 50 } = body;

    if (!siteId || !type || !name) {
      return NextResponse.json({ error: "Site ID, type, and name are required" }, { status: 400 });
    }

    // Verify user owns this site
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = (userData as { organization_id?: string } | null)?.organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const { data: site } = await supabase
      .from("sites")
      .select("id")
      .eq("id", siteId)
      .eq("organization_id", orgId)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Create task
    const { data: newTask, error } = await supabase
      .from("tasks")
      .insert({
        site_id: siteId,
        organization_id: orgId,
        type,
        name,
        description,
        priority,
        status: "pending",
        is_autopilot: true,
        triggered_by: "user",
        triggered_by_user_id: user.id,
      } as never)
      .select()
      .single();

    if (error) {
      console.error("Task create error:", error);
      throw error;
    }

    return NextResponse.json({ success: true, data: newTask });

  } catch (error) {
    console.error("[Autopilot API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create task" },
      { status: 500 }
    );
  }
}

// PATCH - Update task (pause, resume, cancel)
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
    const { taskId, action } = body;

    if (!taskId || !action) {
      return NextResponse.json({ error: "Task ID and action are required" }, { status: 400 });
    }

    // Verify ownership
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = (userData as { organization_id?: string } | null)?.organization_id;
    if (!orgId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // Get task
    const { data: task } = await supabase
      .from("tasks")
      .select("id, organization_id, status")
      .eq("id", taskId)
      .single();

    if (!task || (task as { organization_id: string }).organization_id !== orgId) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    let newStatus: string;
    switch (action) {
      case "pause":
        newStatus = "paused";
        break;
      case "resume":
        newStatus = "pending";
        break;
      case "cancel":
        newStatus = "cancelled";
        break;
      case "retry":
        newStatus = "pending";
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { data: updatedTask, error } = await supabase
      .from("tasks")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", taskId)
      .select()
      .single();

    if (error) {
      console.error("Task update error:", error);
      throw error;
    }

    return NextResponse.json({ success: true, data: updatedTask });

  } catch (error) {
    console.error("[Autopilot API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update task" },
      { status: 500 }
    );
  }
}

// Helper functions
function mapTaskType(type: string): string {
  const mapping: Record<string, string> = {
    generate_content: "content",
    optimize_content: "optimize",
    research: "keyword",
    audit: "audit",
    fix: "audit",
    publish: "publish",
    discovery: "analyze",
    crawl: "analyze",
    track_rankings: "analyze",
    plan_content: "content",
    internal_linking: "optimize",
  };
  return mapping[type] || "analyze";
}

function mapTaskStatus(status: string): string {
  const mapping: Record<string, string> = {
    pending: "queued",
    running: "running",
    completed: "completed",
    failed: "failed",
    cancelled: "failed",
    paused: "paused",
  };
  return mapping[status] || "queued";
}

function calculateProgress(status: string): number {
  if (status === "completed") return 100;
  if (status === "running") return 50; // Would need actual progress tracking
  return 0;
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

function formatResult(result: unknown): string {
  if (typeof result === "string") return result;
  if (typeof result === "object" && result !== null) {
    const r = result as Record<string, unknown>;
    if (r.message) return String(r.message);
    if (r.summary) return String(r.summary);
    return JSON.stringify(result).slice(0, 100);
  }
  return String(result);
}

