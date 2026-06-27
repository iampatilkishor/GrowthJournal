/**
 * Server-side Supabase client using the service role key.
 * Only import this in API routes — never in client components.
 * The service role key bypasses RLS so treat it as a secret.
 */

import { createClient } from '@supabase/supabase-js';

let _admin = null;

export function getAdminClient() {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
  _admin = createClient(url, key, { auth: { persistSession: false } });
  return _admin;
}

/**
 * Extracts the authenticated user's ID from the request.
 * Reads the Authorization: Bearer <access_token> header.
 * Returns null if no valid session is found.
 */
export async function getUserId(request) {
  try {
    const auth = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return null;
    const token = auth.slice(7);
    // Verify token using anon client (doesn't need service role)
    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { persistSession: false } }
    );
    const { data: { user }, error } = await anon.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
  } catch {
    return null;
  }
}

/** Returns IST date string YYYY-MM-DD */
export function todayIST() {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}
