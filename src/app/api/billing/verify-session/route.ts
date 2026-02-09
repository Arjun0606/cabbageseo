/**
 * Verify Checkout Session API
 * 
 * Checks the status of a Dodo checkout session to determine if payment succeeded
 * 
 * GET /api/billing/verify-session?session_id=xxx
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DodoPayments } from "dodopayments";

// Initialize Dodo client
function getDodoClient() {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) {
    throw new Error("DODO_PAYMENTS_API_KEY is not configured");
  }
  
  const isProduction = process.env.NODE_ENV === "production";
  
  return new DodoPayments({
    bearerToken: apiKey,
    environment: isProduction ? "live_mode" : "test_mode",
  });
}

export async function GET(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ success: false, error: "Missing session_id" }, { status: 400 });
  }

  // Check if Dodo is configured
  if (!process.env.DODO_PAYMENTS_API_KEY) {
    console.error("[Verify Session] DODO_PAYMENTS_API_KEY is not configured");
    return NextResponse.json({ success: false, error: "Payments not configured" }, { status: 503 });
  }

  try {
    const dodo = getDodoClient();
    
    // Retrieve the checkout session status
    const session = await dodo.checkoutSessions.retrieve(sessionId);
    
    // Map Dodo payment status to simple status
    let status: "succeeded" | "failed" | "cancelled" | "pending" = "pending";
    
    if (session.payment_status === "succeeded") {
      status = "succeeded";
    } else if (session.payment_status === "failed" || session.payment_status === "cancelled") {
      status = session.payment_status;
    } else if (!session.payment_id) {
      // No payment_id means user didn't complete checkout
      status = "cancelled";
    }
    
    console.log(`[Verify Session] Session ${sessionId}: status=${status}, payment_status=${session.payment_status}`);
    
    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        status,
        paymentId: session.payment_id,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_email,
      },
    });
  } catch (error) {
    console.error("[Verify Session] Error:", error);
    
    // If session not found, assume cancelled
    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        status: "cancelled",
      },
    });
  }
}

