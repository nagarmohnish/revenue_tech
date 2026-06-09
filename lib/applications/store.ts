import { supabaseAdmin, supabaseConfigured } from '../supabase';
import type { ApplicationInput, ApplicationRecord } from './types';
import type { MonetizationPlan } from './planTypes';

export type PlanStatus = 'pending' | 'ready' | 'failed' | 'template';

export interface ApplicationWithPlan extends ApplicationRecord {
  plan?: MonetizationPlan;
  planStatus: PlanStatus;
  planAt?: string | null;
}

interface SaveMeta {
  userAgent?: string;
  referrer?: string;
}

export async function saveApplication(input: ApplicationInput, meta: SaveMeta = {}): Promise<{ id: string }> {
  if (!supabaseConfigured()) {
    throw new Error('Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('applications')
    .insert({
      name:            input.name,
      email:           input.email.toLowerCase(),
      company:         input.company || null,
      agent_name:      input.agentName,
      agent_desc:      input.agentDesc,
      lifecycle:       input.lifecycle,
      volume_estimate: input.volumeEstimate,
      billing_pref:    input.billingPref,
      geography:       input.geography,
      geography_other: input.geographyOther || null,
      stack:           input.stack,
      timeline:        input.timeline,
      notes:           input.notes || null,
      user_agent:      meta.userAgent || null,
      referrer:        meta.referrer || null,
    })
    .select('id')
    .single();
  if (error) throw new Error('Could not save application: ' + error.message);
  return { id: data.id };
}

export async function loadApplication(id: string): Promise<ApplicationWithPlan | null> {
  if (!supabaseConfigured()) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('applications')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return rowToRecordWithPlan(data);
}

export async function savePlan(
  id: string,
  plan: MonetizationPlan,
  status: PlanStatus = 'ready',
): Promise<void> {
  if (!supabaseConfigured()) return;
  const sb = supabaseAdmin();
  await sb.from('applications').update({
    plan,
    plan_status: plan.generatedBy === 'template' ? 'template' : status,
    plan_at: new Date().toISOString(),
  }).eq('id', id);
}

export async function listApplications(limit = 100): Promise<ApplicationRecord[]> {
  if (!supabaseConfigured()) return [];
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map(rowToRecord);
}

function rowToRecord(row: any): ApplicationRecord {
  return {
    id:             row.id,
    name:           row.name,
    email:          row.email,
    company:        row.company ?? undefined,
    agentName:      row.agent_name,
    agentDesc:      row.agent_desc,
    lifecycle:      row.lifecycle,
    volumeEstimate: row.volume_estimate,
    billingPref:    row.billing_pref,
    geography:      row.geography,
    geographyOther: row.geography_other ?? undefined,
    stack:          row.stack,
    timeline:       row.timeline,
    notes:          row.notes ?? undefined,
    status:         row.status,
    internalNotes:  row.internal_notes ?? undefined,
    userAgent:      row.user_agent ?? undefined,
    referrer:       row.referrer ?? undefined,
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
    contactedAt:    row.contacted_at,
  };
}

function rowToRecordWithPlan(row: any): ApplicationWithPlan {
  return {
    ...rowToRecord(row),
    plan:       row.plan ?? undefined,
    planStatus: row.plan_status ?? 'pending',
    planAt:     row.plan_at ?? null,
  };
}
