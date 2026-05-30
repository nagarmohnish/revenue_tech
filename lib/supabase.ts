import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

let _admin: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!env.supabaseUrl || !env.supabaseService) {
    throw new Error('Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  if (!_admin) {
    _admin = createClient(env.supabaseUrl, env.supabaseService, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}

export function supabaseConfigured() {
  return !!(env.supabaseUrl && env.supabaseService);
}
