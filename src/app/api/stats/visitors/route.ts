/**
 * /api/stats/visitors — Visitor counter
 *
 * POST: Increment and return visitor count (called once per unique session)
 * GET:  Return current count without incrementing
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

function getDb(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({ count: 0 });
    }

    const { data } = await db
      .from("counters")
      .select("value")
      .eq("name", "visitors")
      .maybeSingle();

    return NextResponse.json({ count: data?.value ?? 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}

export async function POST() {
  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({ count: 0 });
    }

    const { data, error } = await db.rpc("increment_counter", {
      counter_name: "visitors",
    });

    if (error) {
      // Fallback: just read current value
      const { data: row } = await db
        .from("counters")
        .select("value")
        .eq("name", "visitors")
        .maybeSingle();
      return NextResponse.json({ count: row?.value ?? 0 });
    }

    return NextResponse.json({ count: data ?? 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
