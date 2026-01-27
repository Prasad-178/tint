/**
 * Supabase Client - Server Side
 * 
 * This client is used for server-side operations (API routes).
 * Uses the service role key for admin operations.
 * 
 * Supabase is OPTIONAL - returns null if not configured.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Create a server-side Supabase client with service role
 * Returns null if Supabase is not configured
 */
export function createServiceClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Check if Supabase server operations are available
 */
export function isSupabaseServerConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}
