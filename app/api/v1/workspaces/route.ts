import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveBearer, requireScope } from '@/lib/apiKeyAuth';
import { supabaseAdmin, supabaseConfigured } from '@/lib/supabase';

const Body = z.object({
  // Optional external identifier the agency tracks on their side.
  // We treat it as the workspace name and use it to dedupe on retries.
  externalId: z.string().min(1).max(120).optional(),
  name: z.string().min(1).max(120),
  // Optional: owner email (we'll upsert a user). If omitted, the workspace is
  // an "agency-managed" workspace with no end-user attached.
  ownerEmail: z.string().email().optional(),
  ownerName: z.string().min(1).max(80).optional(),
  // Trial credits to grant on creation. Defaults to 100. Set to 0 to skip.
  trialCredits: z.number().int().min(0).max(100_000).default(100),
  // Initial plan, defaults to 'trial'.
  plan: z.string().min(2).max(20).default('trial'),
});

/**
 * POST /api/v1/workspaces
 * Auth: Bearer am_live_... (API key with 'admin' or workspace-write scope).
 *
 * Creates an end-customer workspace under the calling tenant. Returns the
 * workspace_id you'll pass to /authorize and /debit. Idempotent on
 * (tenant_id, externalId) when externalId is provided.
 */
export async function POST(req: NextRequest) {
  if (!supabaseConfigured()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });

  let ctx;
  try {
    ctx = await resolveBearer(req);
    if (!ctx) return NextResponse.json({ error: 'Bearer API key required' }, { status: 401 });
    // For now any active key may create workspaces. Tighten later with a dedicated scope.
    if (!ctx.scopes.includes('admin') && !ctx.scopes.includes('debit') && !ctx.scopes.includes('authorize')) {
      requireScope(ctx, 'authorize');
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'auth failed' }, { status: 401 });
  }

  const db = supabaseAdmin();

  // Idempotency: if externalId is set, check for an existing workspace with that name + tenant.
  if (parsed.data.externalId) {
    const { data: existing } = await db
      .from('workspaces')
      .select('id, name, plan')
      .eq('tenant_id', ctx.tenantId)
      .eq('name', parsed.data.externalId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ workspaceId: existing.id, idempotent: true });
    }
  }

  // 1) Upsert owner user when email is provided
  let ownerUserId: string | null = null;
  if (parsed.data.ownerEmail) {
    const { data: existingUser } = await db.from('users').select('id').eq('email', parsed.data.ownerEmail).maybeSingle();
    if (existingUser) {
      ownerUserId = existingUser.id;
    } else {
      const { data: newUser, error } = await db
        .from('users')
        .insert({ email: parsed.data.ownerEmail, name: parsed.data.ownerName || null })
        .select('id')
        .single();
      if (error) return NextResponse.json({ error: 'Failed to create user', detail: error.message }, { status: 500 });
      ownerUserId = newUser.id;
    }
  }

  // 2) Create the workspace, tenant-scoped
  const wsName = parsed.data.externalId || parsed.data.name;
  const { data: ws, error: wsErr } = await db
    .from('workspaces')
    .insert({
      tenant_id: ctx.tenantId,
      name: wsName,
      plan: parsed.data.plan,
      status: parsed.data.plan === 'trial' ? 'trialing' : 'active',
      owner_user_id: ownerUserId,
    })
    .select('id')
    .single();
  if (wsErr) return NextResponse.json({ error: 'Failed to create workspace', detail: wsErr.message }, { status: 500 });

  // 3) Grant trial credits if requested. Wallet row + ledger entry via grant_credits RPC.
  if (parsed.data.trialCredits > 0) {
    const { error: grantErr } = await db.rpc('grant_credits', {
      p_workspace_id: ws.id,
      p_amount: parsed.data.trialCredits,
      p_type: 'GRANT',
      p_stripe_ref: null,
      p_note: 'Initial grant via /api/v1/workspaces',
    });
    if (grantErr) {
      // Workspace exists but grant failed; caller can retry the grant manually.
      return NextResponse.json({
        workspaceId: ws.id,
        warning: 'workspace created but trial grant failed',
        detail: grantErr.message,
      }, { status: 207 });
    }
  } else {
    // Still create the wallet row so later debits/grants don't have to upsert.
    await db.from('wallets').upsert({ workspace_id: ws.id, balance: 0 }, { onConflict: 'workspace_id' });
  }

  // 4) Funnel event
  await db.from('funnel_events').insert({
    workspace_id: ws.id,
    tenant_id: ctx.tenantId,
    event_name: 'trial_started',
    meta: { source: 'agency_api', plan: parsed.data.plan, trial_credits: parsed.data.trialCredits },
  });

  return NextResponse.json({
    workspaceId: ws.id,
    tenantId: ctx.tenantId,
    plan: parsed.data.plan,
    trialCredits: parsed.data.trialCredits,
  });
}

/**
 * GET /api/v1/workspaces
 * Auth: Bearer am_live_...
 * Lists workspaces in the calling tenant with balance + status. Useful for
 * the agency to inspect their pilot workspaces from a script.
 */
export async function GET(req: NextRequest) {
  if (!supabaseConfigured()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  let ctx;
  try {
    ctx = await resolveBearer(req);
    if (!ctx) return NextResponse.json({ error: 'Bearer API key required' }, { status: 401 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'auth failed' }, { status: 401 });
  }

  const db = supabaseAdmin();
  const { data: workspaces } = await db
    .from('workspaces')
    .select('id, name, plan, status, created_at')
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false })
    .limit(100);

  const ids = (workspaces || []).map((w) => w.id);
  const { data: wallets } = await db.from('wallets').select('workspace_id, balance').in('workspace_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
  const balByWs = new Map((wallets || []).map((w) => [w.workspace_id, w.balance]));

  return NextResponse.json({
    workspaces: (workspaces || []).map((w) => ({ ...w, balance: balByWs.get(w.id) ?? 0 })),
  });
}
