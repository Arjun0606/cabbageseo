/**
 * Supabase exports
 */

export { createClient, getSupabaseClient } from "./client";
export { createClient as createServerClient, createServiceClient } from "./server";
export type { Database, Tables, Insertable, Updatable } from "./types";

