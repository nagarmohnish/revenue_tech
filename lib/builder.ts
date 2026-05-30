import { supabaseAdmin } from './supabase';

export interface AgentAction {
  action_id: string;
  cost: number;
  label: string;
}

export interface TenantAgent {
  product_id: string;
  company: string;
  display_name: string;
  available_on: string[];
  actions: AgentAction[];
  is_active: boolean;
  integrated: boolean;
  available_phase: string | null;
  tenant_id: string;
}

export interface TenantApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export async function getTenant(tenantId: string) {
  const db = supabaseAdmin();
  const { data, error } = await db.from('tenants').select('*').eq('id', tenantId).single();
  if (error) throw error;
  return data;
}

export async function listAgentsForTenant(tenantId: string): Promise<TenantAgent[]> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from('tool_registry')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('product_id');
  if (error) throw error;
  return (data as TenantAgent[]) || [];
}

export async function listApiKeysForTenant(tenantId: string): Promise<TenantApiKeyRow[]> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from('tenant_api_keys')
    .select('id, name, prefix, scopes, last_used_at, revoked_at, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as TenantApiKeyRow[];
}

export async function listPlansForTenant(tenantId: string) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from('tenant_plan_configs')
    .select('id, plan_id, display_name, price_usd, credits, is_active, sort_order, stripe_price_id')
    .eq('tenant_id', tenantId)
    .order('sort_order');
  if (error) throw error;
  return data || [];
}

export async function tenantOnboardingState(tenantId: string) {
  const [agents, keys, tenant] = await Promise.all([
    listAgentsForTenant(tenantId),
    listApiKeysForTenant(tenantId),
    getTenant(tenantId),
  ]);
  const activeKeys = keys.filter((k) => !k.revoked_at);

  // Has any usage event for this tenant?
  const db = supabaseAdmin();
  const { count: usageCount } = await db
    .from('usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  return {
    tenant,
    hasAgent: agents.length > 0,
    agentCount: agents.length,
    hasApiKey: activeKeys.length > 0,
    keyCount: activeKeys.length,
    hasStripe: !!tenant.stripe_account_id && tenant.stripe_account_status === 'active',
    stripeStatus: tenant.stripe_account_status || null,
    hasFirstCall: (usageCount || 0) > 0,
    firstCallCount: usageCount || 0,
  };
}
