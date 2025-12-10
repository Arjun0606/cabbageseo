/**
 * Admin Wallet Status API
 * GET /api/admin/wallet - Get wallet status
 * POST /api/admin/wallet - Set wallet balance
 * 
 * This is admin-only! Add auth check in production.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getWalletStatus,
  setWalletBalance,
  formatWalletStatus,
  calculateTopUpAmount,
  shouldSendAlert,
  sendWalletAlert,
} from "@/lib/billing/wallet-monitor";

// GET: Check wallet status
export async function GET(request: NextRequest) {
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

// POST: Update wallet balance
export async function POST(request: NextRequest) {
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

