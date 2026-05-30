import crypto from 'node:crypto';
import { getSession } from './auth';
import { authorize, debit } from './billing';
import { track } from './posthog';
import { supabaseAdmin } from './supabase';

interface RunOpts<T> {
  product: string;
  action: string;
  cost: number;
  run: () => Promise<T & { _meta?: { model?: string; tokens?: number; latencyMs?: number } }>;
}

/**
 * Standard authorize → run → debit envelope, used by every agent route.
 * Returns either { ok: true, result, balance } or { ok: false, status, body }.
 */
export async function runAgentCall<T extends object>(opts: RunOpts<T>) {
  const session = await getSession();
  if (!session) return { ok: false as const, status: 401, body: { error: 'UNAUTHENTICATED' } };

  // Authorize
  const auth = await authorize({
    workspaceId: session.workspaceId,
    product: opts.product,
    action: opts.action,
    cost: opts.cost,
  });
  if (!auth.allowed) {
    return { ok: false as const, status: 402, body: auth };
  }

  const t0 = Date.now();
  let result;
  try {
    result = await opts.run();
  } catch (e: any) {
    return { ok: false as const, status: 500, body: { error: e?.message || 'agent execution failed' } };
  }
  const latencyMs = Date.now() - t0;

  const resourceId = crypto.randomUUID();
  const meta = result._meta || {};
  const debitResult = await debit({
    workspaceId: session.workspaceId,
    product: opts.product,
    action: opts.action,
    cost: opts.cost,
    resourceId,
    userId: session.userId,
    meta: { model: meta.model, tokens: meta.tokens, latencyMs: meta.latencyMs ?? latencyMs },
  });

  // Funnel: first agent use
  try {
    const db = supabaseAdmin();
    const { count } = await db
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', session.workspaceId);
    if (count === 1) {
      await db.from('funnel_events').insert({
        workspace_id: session.workspaceId,
        event_name: 'first_agent_used',
        product: opts.product,
        meta: { action: opts.action, credits_charged: opts.cost },
      });
      track(session.workspaceId, 'first_agent_used', { product: opts.product, action: opts.action, credits_charged: opts.cost }).catch(() => {});
    }
  } catch {}

  // Strip internal _meta before returning
  const { _meta: _drop, ...clean } = result as any;
  return {
    ok: true as const,
    body: {
      result: clean,
      resourceId,
      creditsRemaining: debitResult.success ? debitResult.balance : auth.creditsRemaining - opts.cost,
    },
  };
}
