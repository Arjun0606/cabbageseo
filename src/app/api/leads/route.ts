/**
 * Leads API - Capture emails from free tool users
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, url, source = "free_analyzer" } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Try to save the lead
    const { error } = await supabase
      .from("leads")
      .upsert(
        {
          email: email.toLowerCase().trim(),
          analyzed_url: url || null,
          source,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );

    if (error) {
      console.error("[Leads API] Error saving lead:", error);
      // Don't expose DB errors to user, but log them
      // Still return success to not block UX
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Leads API] Error:", error);
    // Return success anyway to not block UX
    return NextResponse.json({ success: true });
  }
}

export async function GET(request: NextRequest) {
  // Admin endpoint to get leads count (protected)
  try {
    const supabase = createServiceClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if admin (you can implement proper admin check)
    const { count, error } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      count: count || 0 
    });
  } catch (error) {
    console.error("[Leads API] Error:", error);
    return NextResponse.json(
      { error: "Failed to get leads" },
      { status: 500 }
    );
  }
}

