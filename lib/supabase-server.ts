import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client.
 *
 * ⚠️  NEVER import this file from a "use client" component.
 *     It uses the service_role key which bypasses all RLS policies.
 *
 * Throws immediately if required environment variables are missing,
 * rather than silently failing with undefined credentials.
 */

let cachedClient: SupabaseClient | null = null;

export function createServerSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      '[supabase-server] NEXT_PUBLIC_SUPABASE_URL is not set. ' +
      'Add it to your .env.local or Vercel environment variables.'
    );
  }

  if (!key) {
    throw new Error(
      '[supabase-server] SUPABASE_SERVICE_ROLE_KEY is not set. ' +
      'Add it to your .env.local or Vercel environment variables. ' +
      'Do NOT use the anon key here — server operations require the service role.'
    );
  }

  cachedClient = createClient(url, key);
  return cachedClient;
}

/**
 * Returns the API-Sports key.
 * Throws if missing rather than silently returning undefined.
 */
export function getApiSportsKey(): string {
  const key = process.env.API_SPORTS_KEY;
  if (!key) {
    throw new Error(
      '[supabase-server] API_SPORTS_KEY is not set. ' +
      'Add it to your .env.local or Vercel environment variables.'
    );
  }
  return key;
}
