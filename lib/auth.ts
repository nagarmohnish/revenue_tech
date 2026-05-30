import { cookies } from 'next/headers';
import { supabaseAdmin, supabaseConfigured } from './supabase';
import { env } from './env';
import crypto from 'node:crypto';

const SESSION_COOKIE = 'agentmint_session';
const SESSION_DAYS = 30;

function sign(payload: string) {
  const secret = env.authSecret || 'dev-secret-change-me-change-me-change-me';
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function encodeSession(data: { userId: string; workspaceId: string; email: string }) {
  const body = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = sign(body);
  return `${body}.${sig}`;
}

function decodeSession(token: string): { userId: string; workspaceId: string; email: string } | null {
  try {
    const [body, sig] = token.split('.');
    if (!body || !sig) return null;
    if (sign(body) !== sig) return null;
    return JSON.parse(Buffer.from(body, 'base64url').toString());
  } catch {
    return null;
  }
}

export async function setSessionCookie(data: { userId: string; workspaceId: string; email: string }) {
  const token = encodeSession(data);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
  });
}

export async function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}

export async function getSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decodeSession(token);
}

export async function requireSession() {
  const s = await getSession();
  if (!s) throw new Error('UNAUTHENTICATED');
  return s;
}

/**
 * Ensures a user + workspace + wallet exist for a given email.
 * Returns the canonical session payload.
 */
export async function ensureWorkspaceForEmail(email: string, name?: string, avatarUrl?: string) {
  if (!supabaseConfigured()) {
    throw new Error('Supabase not configured');
  }
  const db = supabaseAdmin();

  // 1. Upsert user
  const { data: existingUser } = await db.from('users').select('id, name, avatar_url').eq('email', email).maybeSingle();

  let userId = existingUser?.id;
  if (!userId) {
    const { data: newUser, error } = await db
      .from('users')
      .insert({ email, name: name || null, avatar_url: avatarUrl || null })
      .select('id')
      .single();
    if (error) throw error;
    userId = newUser.id;
  } else if ((!existingUser.name && name) || (!existingUser.avatar_url && avatarUrl)) {
    await db.from('users').update({ name: name || existingUser.name, avatar_url: avatarUrl || existingUser.avatar_url }).eq('id', userId);
  }

  // 2. Find or create workspace for user
  const { data: existingWs } = await db
    .from('workspaces')
    .select('id, plan')
    .eq('owner_user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  let workspaceId = existingWs?.id;
  if (!workspaceId) {
    const wsName = (name?.split(' ')[0] || email.split('@')[0]) + "'s workspace";
    const { data: newWs, error } = await db
      .from('workspaces')
      .insert({ owner_user_id: userId, name: wsName, plan: 'trial', status: 'trialing' })
      .select('id')
      .single();
    if (error) throw error;
    workspaceId = newWs.id;

    // Trial credit grant: 100 credits
    await db.rpc('grant_credits', {
      p_workspace_id: workspaceId,
      p_amount: 100,
      p_type: 'GRANT',
      p_stripe_ref: null,
      p_note: 'Trial - auto-granted on signup',
    });

    // Funnel event
    await db.from('funnel_events').insert({
      workspace_id: workspaceId,
      event_name: 'trial_started',
      meta: { source: 'signup', plan: 'trial' },
    });
  }

  return { userId, workspaceId, email };
}
