/**
 * Autopilot API
 * 
 * Endpoints for the SEO Orchestrator
 */

import { NextRequest, NextResponse } from "next/server";
import { createOrchestrator, SEOOrchestrator } from "@/lib/autopilot/orchestrator";

// In-memory store for active orchestrators (in production, use Redis or DB)
const activeOrchestrators = new Map<string, SEOOrchestrator>();

/**
 * POST /api/autopilot - Start the autopilot for a site
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      siteUrl,
      siteId,
      organizationId,
      autoFix = true,
      autoPublish = false,
      articlesPerWeek = 2,
      contentTone = "professional",
      targetAudience = "general audience",
      cms,
    } = body;

    if (!siteUrl || !siteId || !organizationId) {
      return NextResponse.json(
        { error: "Missing required fields: siteUrl, siteId, organizationId" },
        { status: 400 }
      );
    }

    // Check if already running
    const key = `${organizationId}:${siteId}`;
    if (activeOrchestrators.has(key)) {
      return NextResponse.json(
        { error: "Autopilot already running for this site" },
        { status: 409 }
      );
    }

    // Create orchestrator
    const orchestrator = await createOrchestrator(
      siteUrl,
      organizationId,
      siteId,
      {
        autoFix,
        autoPublish,
        articlesPerWeek,
        contentTone,
        targetAudience,
        cms,
      }
    );

    // Store it
    activeOrchestrators.set(key, orchestrator);

    // Start it (non-blocking)
    orchestrator.start().catch(console.error);

    return NextResponse.json({
      success: true,
      message: "Autopilot started",
      siteId,
    });

  } catch (error) {
    console.error("Autopilot start error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start autopilot" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/autopilot?siteId=xxx&organizationId=xxx - Get autopilot status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const organizationId = searchParams.get("organizationId");

    if (!siteId || !organizationId) {
      return NextResponse.json(
        { error: "Missing siteId or organizationId" },
        { status: 400 }
      );
    }

    const key = `${organizationId}:${siteId}`;
    const orchestrator = activeOrchestrators.get(key);

    if (!orchestrator) {
      return NextResponse.json({
        running: false,
        state: null,
        tasks: { pending: [], running: [], completed: [] },
      });
    }

    return NextResponse.json({
      running: true,
      state: orchestrator.getState(),
      tasks: orchestrator.getTasks(),
    });

  } catch (error) {
    console.error("Autopilot status error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get status" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/autopilot - Stop the autopilot
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const organizationId = searchParams.get("organizationId");

    if (!siteId || !organizationId) {
      return NextResponse.json(
        { error: "Missing siteId or organizationId" },
        { status: 400 }
      );
    }

    const key = `${organizationId}:${siteId}`;
    const orchestrator = activeOrchestrators.get(key);

    if (!orchestrator) {
      return NextResponse.json(
        { error: "Autopilot not running for this site" },
        { status: 404 }
      );
    }

    orchestrator.stop();
    activeOrchestrators.delete(key);

    return NextResponse.json({
      success: true,
      message: "Autopilot stopped",
    });

  } catch (error) {
    console.error("Autopilot stop error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to stop autopilot" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/autopilot - Trigger a specific task
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId, organizationId, taskType, taskData } = body;

    if (!siteId || !organizationId || !taskType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const key = `${organizationId}:${siteId}`;
    const orchestrator = activeOrchestrators.get(key);

    if (!orchestrator) {
      return NextResponse.json(
        { error: "Autopilot not running for this site" },
        { status: 404 }
      );
    }

    const task = await orchestrator.triggerTask(taskType, taskData);

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        type: task.type,
        title: task.title,
        status: task.status,
      },
    });

  } catch (error) {
    console.error("Autopilot trigger error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to trigger task" },
      { status: 500 }
    );
  }
}

