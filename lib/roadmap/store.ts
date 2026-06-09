import { supabaseAdmin, supabaseConfigured } from '../supabase';
import type { RoadmapInput } from './types';

export async function saveRoadmap(input: RoadmapInput, meta: { userAgent?: string; referrer?: string } = {}): Promise<{ id: string }> {
  if (!supabaseConfigured()) throw new Error('Supabase not configured.');
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('monetization_roadmaps')
    .insert({
      name:    input.name,
      email:   input.email.toLowerCase(),
      company: input.company,
      role:    input.role || null,

      website:        input.website,
      agents_summary: input.agentsSummary,
      agent_count:    input.agentCount,
      client_count:   input.clientCount,

      pricing_now:     input.pricingNow,
      charging_method: input.chargingMethod,
      charging_other:  input.chargingOther || null,
      payout_method:   input.payoutMethod,
      payout_other:    input.payoutOther || null,

      stack:        input.stack,
      ai_tools:     input.aiTools,
      integrations: input.integrations || null,
      doc_links:    input.docLinks || null,

      shareable_creds: input.shareableCreds || null,
      timeline:        input.timeline,
      notes:           input.notes || null,

      user_agent: meta.userAgent || null,
      referrer:   meta.referrer  || null,
    })
    .select('id')
    .single();
  if (error) throw new Error('Could not save roadmap intake: ' + error.message);
  return { id: data.id };
}

export async function loadRoadmap(id: string) {
  if (!supabaseConfigured()) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('monetization_roadmaps').select('*').eq('id', id).single();
  if (error || !data) return null;
  return data;
}
