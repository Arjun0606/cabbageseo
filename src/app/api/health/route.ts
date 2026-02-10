/**
 * GET /api/health
 *
 * Lightweight health check for uptime monitoring.
 * Returns 200 with timestamp — no auth, no DB.
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
