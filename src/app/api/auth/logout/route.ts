/**
 * Logout Route
 * Signs out the user and redirects to home
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  
  if (supabase) {
    await supabase.auth.signOut();
  }

  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/`, { status: 302 });
}

export async function GET(request: Request) {
  // Also support GET for simple logout links
  return POST(request);
}
