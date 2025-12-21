/**
 * Credits API - DISABLED
 * 
 * Prepaid credits are not part of the pricing model.
 * 
 * Pricing model:
 * - FREE: URL analyzer (SEO + AIO scores)
 * - PAID: Subscriptions at $29/$79/$199 with pay-as-you-go overages
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
