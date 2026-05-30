import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { supabaseAdmin, supabaseConfigured } from './supabase';
import { env } from './env';

const SESSION_COOKIE = 'agentmint_builder_session';
const SESSION_DAYS = 30;

function sign(payload: string) {
  const secret = env.authSecret || 'dev-secret-change-me-change-me-change-me';
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function encodeSession(data: { userId: string; tenantId: string; email: string; role: string }) {
  const body = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = sign(body);
  return `${body}.${sig}`;
}

function decodeSession(token: string): { userId: string; tenantId: string; email: string; role: string } | null {
  try {
    const [body, sig] = token.split('.');
    if (!body || !sig) return null;
    if (sign(body) !== sig) return null;
    return JSON.parse(Buffer.from(body, 'base64url').toString());
  } catch {
    return null;
  }
}

export async function setBuilderSessionCookie(data: { userId: string; tenantId: string; email: string; role: string }) {
  const token = encodeSession(data);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
  });
}

export async function clearBuilderSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}

export async function getBuilderSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decodeSession(token);
}

export async function requireBuilderSession() {
  const s = await getBuilderSession();
  if (!s) throw new Error('UNAUTHENTICATED');
  return s;
}

/** ----- Slug validation ------------------------------------ */

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
const RESERVED_SLUGS = new Set([
  'admin', 'agency', 'agent', 'agents', 'api', 'app', 'auth', 'billing',
  'build', 'builder', 'console', 'dashboard', 'docs', 'help', 'login',
  'logout', 'public', 'signin', 'signup', 'static', 'system', 'www',
  'agentmint',
]);

export function validateSlug(slug: string): { ok: true } | { ok: false; reason: string } {
  if (!SLUG_RE.test(slug)) return { ok: false, reason: 'Handle must be 3-40 chars, lowercase letters, digits, and hyphens.' };
  if (RESERVED_SLUGS.has(slug)) return { ok: false, reason: 'That handle is reserved.' };
  return { ok: true };
}

/** ----- Account + owner provisioning ----------------------- */

export async function createAccountWithOwner(params: {
  email: string;
  name: string;
  /** Display name. For a company this is the company name; for an indie it's their personal/product handle. */
  accountName: string;
  slug: string;
}) {
  if (!supabaseConfigured()) throw new Error('Supabase not configured');
  const db = supabaseAdmin();

  // 1. Upsert user
  let userId: string;
  const { data: existingUser } = await db.from('users').select('id, name').eq('email', params.email).maybeSingle();
  if (existingUser) {
    userId = existingUser.id;
    if (!existingUser.name && params.name) {
      await db.from('users').update({ name: params.name }).eq('id', userId);
    }
  } else {
    const { data: newUser, error } = await db.from('users').insert({ email: params.email, name: params.name }).select('id').single();
    if (error) throw error;
    userId = newUser.id;
  }

  // 2. Create the account (stored as a tenant row — the DB term stays internal)
  const { data: tenant, error: tErr } = await db
    .from('tenants')
    .insert({ slug: params.slug, name: params.accountName, mode: 'hosted' })
    .select('id')
    .single();
  if (tErr) throw tErr;

  // 3. Link user as owner
  const { error: muErr } = await db.from('tenant_users').insert({ tenant_id: tenant.id, user_id: userId, role: 'owner' });
  if (muErr) throw muErr;

  // 4. Seed default plan configs (editable later)
  await db.from('tenant_plan_configs').insert([
    { tenant_id: tenant.id, plan_id: 'trial',   display_name: 'Trial',   price_usd: 0,    credits: 100,  sort_order: 10 },
    { tenant_id: tenant.id, plan_id: 'starter', display_name: 'Starter', price_usd: 49,   credits: 500,  sort_order: 20 },
    { tenant_id: tenant.id, plan_id: 'growth',  display_name: 'Growth',  price_usd: 199,  credits: 2500, sort_order: 30 },
  ]);

  return { tenantId: tenant.id, userId, role: 'owner' as const };
}

/** ----- API key generation --------------------------------- */

export function generateApiKey(): { full: string; prefix: string; hash: string } {
  // Format: am_live_<32 url-safe chars>
  const random = crypto.randomBytes(24).toString('base64url').slice(0, 32);
  const full = `am_live_${random}`;
  const prefix = full.slice(0, 14); // "am_live_xxxxxx"
  const hash = crypto.createHash('sha256').update(full).digest('hex');
  return { full, prefix, hash };
}

export function hashApiKey(full: string): string {
  return crypto.createHash('sha256').update(full).digest('hex');
}
