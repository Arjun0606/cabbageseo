/**
 * Supabase Browser Client
 * For use in client components
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function createClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase not configured. Auth features will be disabled.");
    return null;
  }
  
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton for client-side usage
let browserClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (browserClient === null && isSupabaseConfigured()) {
    browserClient = createClient();
  }
  return browserClient;
}

