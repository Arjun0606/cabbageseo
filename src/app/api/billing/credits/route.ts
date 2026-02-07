/**
 * Credits API - DISABLED
 * 
 * Prepaid credits are not part of the pricing model.
 * 
 * Pricing model:
 * - FREE: URL analyzer (SEO + AIO scores)
 * - PAID: Subscriptions at $49/$149/$349 (Scout/Command/Dominate)
 */

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { 
      error: "Prepaid credits are not available. Please use a subscription plan.",
      pricing_url: "/pricing"
    }, 
    { status: 400 }
  );
}

export async function GET() {
  return NextResponse.json(
    { 
      error: "Prepaid credits are not available. Please use a subscription plan.",
      pricing_url: "/pricing"
    }, 
    { status: 400 }
  );
}
