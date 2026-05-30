import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabaseConfigured } from '@/lib/supabase';
import { env } from '@/lib/env';

export async function GET(req: NextRequest) {
  if (!supabaseConfigured()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  // Admin auth: requires ADMIN_SECRET_KEY header.
  const provided = req.headers.get('x-admin-secret') || req.nextUrl.searchParams.get('secret');
  if (!env.adminSecret || provided !== env.adminSecret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = supabaseAdmin();
  const { data: workspaces } = await db
    .from('workspaces')
    .select('id, name, plan, status, current_period_end, created_at, owner_user_id')
    .order('created_at', { ascending: false })
    .limit(200);

  const ids = (workspaces || []).map((w) => w.id);
  const { data: wallets } = await db.from('wallets').select('workspace_id, balance').in('workspace_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
  const balanceByWs = new Map((wallets || []).map((w) => [w.workspace_id, w.balance]));

  const { data: lastActive } = await db
    .from('usage_events')
    .select('workspace_id, created_at')
    .in('workspace_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
    .order('created_at', { ascending: false });
  const lastByWs = new Map<string, string>();
  for (const e of lastActive || []) {
    if (!lastByWs.has(e.workspace_id)) lastByWs.set(e.workspace_id, e.created_at);
  }

  const userIds = (workspaces || []).map((w) => w.owner_user_id).filter(Boolean);
  const { data: users } = await db
    .from('users')
    .select('id, email, name')
    .in('id', userIds.length ? (userIds as string[]) : ['00000000-0000-0000-0000-000000000000']);
  const userById = new Map((users || []).map((u) => [u.id, u]));

  return NextResponse.json({
    workspaces: (workspaces || []).map((w) => ({
      ...w,
      balance: balanceByWs.get(w.id) ?? 0,
      lastActive: lastByWs.get(w.id) ?? null,
      owner: userById.get(w.owner_user_id || '') ?? null,
    })),
  });
}
