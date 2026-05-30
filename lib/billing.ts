import { supabaseAdmin } from './supabase';
import { Plan, PLANS, planMeetsRequirement, minPlanFromList, TOPUP } from './plans';

export interface ToolAction {
  action_id: string;
  cost: number;
  label: string;
}
export interface ToolRow {
  product_id: string;
  company: string;
  display_name: string;
  available_on: Plan[];
  actions: ToolAction[];
  integrated: boolean;
  is_active: boolean;
  available_phase: string | null;
}

/**
 * Lookup a tool. When tenantId is provided, scope to that tenant — used by
 * API-key callers (agencies). Otherwise scope to the workspace's tenant.
 */
export async function getTool(productId: string, tenantId?: string): Promise<ToolRow | null> {
  const db = supabaseAdmin();
  let q = db.from('tool_registry').select('*').eq('product_id', productId);
  if (tenantId) q = q.eq('tenant_id', tenantId);
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return data as ToolRow | null;
}

export async function getAllTools(tenantId?: string): Promise<ToolRow[]> {
  const db = supabaseAdmin();
  let q = db.from('tool_registry').select('*').order('product_id');
  if (tenantId) q = q.eq('tenant_id', tenantId);
  const { data, error } = await q;
  if (error) throw error;
  return (data as ToolRow[]) || [];
}

export async function getWorkspace(workspaceId: string) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from('workspaces')
    .select('id, name, plan, status, current_period_end, stripe_customer_id, owner_user_id')
    .eq('id', workspaceId)
    .single();
  if (error) throw error;
  return data;
}

export async function getWallet(workspaceId: string) {
  const db = supabaseAdmin();
  const { data, error } = await db.from('wallets').select('workspace_id, balance, updated_at').eq('workspace_id', workspaceId).maybeSingle();
  if (error) throw error;
  return data;
}

export type AuthorizeAllow = { allowed: true; creditsRemaining: number; planLimit: number };
export type AuthorizeDeny =
  | {
      allowed: false;
      reason: 'PLAN_INSUFFICIENT';
      agentName: string;
      currentPlan: Plan;
      requiredPlan: Plan;
      upgradeUrl: string;
      upgradeCost: string;
      featuresCTA: string[];
    }
  | {
      allowed: false;
      reason: 'INSUFFICIENT_CREDITS';
      creditsRemaining: number;
      actionCost: number;
      shortfall: number;
      topUpOptions: Array<{ pack: string; credits: number; price: string; url: string }>;
      upgradeUrl: string;
      currentPlan: Plan;
    }
  | { allowed: false; reason: 'UNKNOWN_TOOL' | 'TOOL_INACTIVE' | 'TOOL_NOT_INTEGRATED'; message: string };

export type AuthorizeResult = AuthorizeAllow | AuthorizeDeny;

export async function authorize(params: {
  workspaceId: string;
  product: string;
  action: string;
  cost?: number;
  tenantId?: string;
}): Promise<AuthorizeResult> {
  const [ws, wallet, tool] = await Promise.all([
    getWorkspace(params.workspaceId),
    getWallet(params.workspaceId),
    getTool(params.product, params.tenantId),
  ]);

  if (!tool || !tool.is_active) {
    return { allowed: false, reason: 'UNKNOWN_TOOL', message: 'Tool not found or inactive.' };
  }
  const actionDef = tool.actions.find((a) => a.action_id === params.action);
  if (!actionDef) {
    return { allowed: false, reason: 'UNKNOWN_TOOL', message: `Action ${params.action} not defined for ${tool.product_id}.` };
  }
  const cost = params.cost ?? actionDef.cost;

  // Plan gate
  if (!planMeetsRequirement(ws.plan as Plan, tool.available_on)) {
    const requiredPlan = minPlanFromList(tool.available_on);
    return {
      allowed: false,
      reason: 'PLAN_INSUFFICIENT',
      agentName: tool.display_name,
      currentPlan: ws.plan as Plan,
      requiredPlan,
      upgradeUrl: `/billing/upgrade?plan=${requiredPlan}&highlight=${tool.product_id}`,
      upgradeCost: PLANS[requiredPlan].price_usd != null ? `$${PLANS[requiredPlan].price_usd}/mo` : 'Custom',
      featuresCTA: [
        'Unlimited PostFlwo articles',
        'Bekbone LinkedIn distribution',
        'AEO/GEO Optimizer',
        '5 team seats',
      ],
    };
  }

  // Integration gate (registered but not callable yet)
  if (!tool.integrated) {
    return {
      allowed: false,
      reason: 'TOOL_NOT_INTEGRATED',
      message: `${tool.display_name} is coming in ${tool.available_phase ?? 'Phase 1'}.`,
    };
  }

  // Balance gate
  const balance = wallet?.balance ?? 0;
  if (balance < cost) {
    return {
      allowed: false,
      reason: 'INSUFFICIENT_CREDITS',
      creditsRemaining: balance,
      actionCost: cost,
      shortfall: cost - balance,
      topUpOptions: [
        { pack: 'standard', credits: TOPUP.standard.credits, price: `$${TOPUP.standard.price_usd}`, url: '/billing/topup' },
      ],
      upgradeUrl: '/billing/upgrade',
      currentPlan: ws.plan as Plan,
    };
  }

  return { allowed: true, creditsRemaining: balance, planLimit: PLANS[ws.plan as Plan].credits };
}

export async function debit(params: {
  workspaceId: string;
  product: string;
  action: string;
  cost: number;
  resourceId: string;
  userId?: string;
  meta?: { model?: string; tokens?: number; latencyMs?: number };
}) {
  const db = supabaseAdmin();

  // Idempotency: did we already debit this resource?
  const { data: existing } = await db
    .from('wallet_transactions')
    .select('id, balance_after')
    .eq('workspace_id', params.workspaceId)
    .eq('resource_id', params.resourceId)
    .eq('type', 'DEBIT')
    .maybeSingle();

  if (existing) {
    return { success: true as const, balance: existing.balance_after, idempotent: true };
  }

  const { data, error } = await db.rpc('atomic_debit', {
    p_workspace_id: params.workspaceId,
    p_cost: params.cost,
    p_product: params.product,
    p_action: params.action,
    p_resource_id: params.resourceId,
    p_model: params.meta?.model || null,
    p_tokens: params.meta?.tokens || null,
    p_latency_ms: params.meta?.latencyMs || null,
    p_user_id: params.userId || null,
  });

  if (error) throw error;
  // RPC returns an array of rows (empty if balance < cost)
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || row.balance_after == null) {
    return { success: false as const, error: 'INSUFFICIENT_CREDITS' as const };
  }
  return { success: true as const, balance: row.balance_after as number, idempotent: false };
}

export async function recentUsage(workspaceId: string, limit = 20) {
  const db = supabaseAdmin();
  const { data } = await db
    .from('usage_events')
    .select('id, product, action, credits_charged, resource_id, model, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}

export async function burnRate7d(workspaceId: string) {
  const db = supabaseAdmin();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await db
    .from('usage_events')
    .select('credits_charged')
    .eq('workspace_id', workspaceId)
    .gte('created_at', since);
  const sum = (data || []).reduce((a, r) => a + (r.credits_charged || 0), 0);
  return sum / 7; // credits/day
}

export async function walletSummary(workspaceId: string) {
  const [ws, wallet] = await Promise.all([getWorkspace(workspaceId), getWallet(workspaceId)]);
  const burn = await burnRate7d(workspaceId);
  const balance = wallet?.balance ?? 0;
  const planLimit = PLANS[ws.plan as Plan].credits;
  const projectedDays = burn > 0 ? Math.floor(balance / burn) : balance > 0 ? 999 : 0;
  return {
    workspaceId,
    workspaceName: ws.name,
    balance,
    plan: ws.plan as Plan,
    planLimit,
    burnRate7d: Math.round(burn * 10) / 10,
    projectedDays,
    periodEnd: ws.current_period_end,
    status: ws.status,
  };
}
