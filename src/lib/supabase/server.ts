/**
 * Supabase Client - Server Side
 *
 * This client is used for server-side operations (API routes).
 * Uses the service role key for admin operations.
 *
 * Supabase is REQUIRED for session persistence across devices.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Create a server-side Supabase client with service role
 * Throws error if Supabase is not configured
 */
export function createServiceClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.'
    );
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
export function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}
