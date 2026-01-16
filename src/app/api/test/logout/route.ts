/**
 * TEST LOGOUT - Clears test session
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("test_account");
  
  return NextResponse.json({ success: true });
}

