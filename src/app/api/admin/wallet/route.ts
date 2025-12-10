/**
 * Admin Wallet Status API
 * GET /api/admin/wallet - Get wallet status
 * POST /api/admin/wallet - Set wallet balance
 * 
 * ⚠️ ADMIN ONLY - Never expose to users!
 * Protected by secret admin key
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getWalletStatus,
  setWalletBalance,
  formatWalletStatus,
  calculateTopUpAmount,
  shouldSendAlert,
} from "@/lib/billing/wallet-monitor";

// Admin secret key - set this in .env.local
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || "cabbageseo-admin-secret-change-me";

/**
 * Verify admin access
 * Requires either:
 * - Header: x-admin-key: <secret>
 * - Query: ?admin_key=<secret>
 */
function verifyAdmin(request: NextRequest): boolean {
  const headerKey = request.headers.get("x-admin-key");
  const queryKey = new URL(request.url).searchParams.get("admin_key");
  
  return headerKey === ADMIN_SECRET || queryKey === ADMIN_SECRET;
}

/**
 * Return 403 for unauthorized access
 */
function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { 
      error: "Unauthorized",
      message: "Admin access required. This endpoint is not for users.",
    },
    { status: 403 }
  );
}

// GET: Check wallet status (ADMIN ONLY)
export async function GET(request: NextRequest) {
  // 🔒 Admin auth check
  if (!verifyAdmin(request)) {
    return unauthorizedResponse();
  }
  const { searchParams } = new URL(request.url);
  const monthlyRevenue = parseInt(searchParams.get("revenue") || "0");
  
  const status = getWalletStatus(monthlyRevenue);
  const alertCheck = shouldSendAlert();
  const topUp = calculateTopUpAmount(monthlyRevenue);
  
  return NextResponse.json({
    status,
    formatted: formatWalletStatus(status),
    needsAlert: alertCheck.send,
    alertLevel: alertCheck.level,
    topUpRecommendation: topUp,
    
    // Quick summary for dashboard
    summary: {
      balance: `$${(status.estimatedBalanceCents / 100).toFixed(2)}`,
      level: status.alertLevel,
      daysRemaining: status.daysUntilEmpty,
      margin: `${status.marginPercentage}%`,
      action: status.alertLevel === "GREEN" 
        ? "No action needed" 
        : status.alertLevel === "YELLOW"
        ? "Check customer payments"
        : "Add funds immediately!",
    },
  });
}

// POST: Update wallet balance (ADMIN ONLY)
export async function POST(request: NextRequest) {
  // 🔒 Admin auth check
  if (!verifyAdmin(request)) {
    return unauthorizedResponse();
  }
  
  try {
    const body = await request.json();
    const { balanceCents, balanceDollars } = body;
    
    // Accept either cents or dollars
    const balance = balanceCents || (balanceDollars ? balanceDollars * 100 : 0);
    
    if (!balance || balance < 0) {
      return NextResponse.json(
        { error: "Invalid balance. Provide balanceCents or balanceDollars." },
        { status: 400 }
      );
    }
    
    setWalletBalance(balance);
    
    const status = getWalletStatus();
    
    return NextResponse.json({
      success: true,
      message: `Wallet balance set to $${(balance / 100).toFixed(2)}`,
      status,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

