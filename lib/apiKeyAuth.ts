import { NextRequest } from 'next/server';
import { hashApiKey } from './builderAuth';
import { supabaseAdmin } from './supabase';

export interface ApiKeyCallerContext {
  tenantId: string;
  keyId: string;
  scopes: string[];
}

/**
 * Extract a bearer token from the Authorization header and resolve it to a tenant.
 * Returns null if no bearer is present (caller should fall back to session auth).
 * Throws when a key is present but invalid/revoked, so the route can return 401.
 */
export async function resolveBearer(req: NextRequest): Promise<ApiKeyCallerContext | null> {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth || !auth.toLowerCase().startsWith('bearer ')) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  if (!token.startsWith('am_')) {
    throw new Error('Invalid API key format');
  }

  const hash = hashApiKey(token);
  const db = supabaseAdmin();
  const { data, error } = await db.rpc('resolve_api_key', { p_key_hash: hash });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || !row.tenant_id) {
    throw new Error('API key invalid or revoked');
  }
  return { tenantId: row.tenant_id, keyId: row.key_id, scopes: row.scopes || [] };
}

export function requireScope(ctx: ApiKeyCallerContext, scope: string) {
  if (ctx.scopes.includes('admin')) return;
  if (!ctx.scopes.includes(scope)) {
    throw new Error(`API key missing scope: ${scope}`);
  }
}
