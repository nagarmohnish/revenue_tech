import { supabaseAdmin, supabaseConfigured } from '../supabase';
import type { AuditReport } from './types';

export async function saveAudit(report: AuditReport): Promise<{ id: string }> {
  if (!supabaseConfigured()) throw new Error('Supabase not configured.');
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('pricing_audits')
    .insert({
      domain:        report.domain,
      url:           report.url,
      score:         report.score,
      payload:       report,
      generated_by:  report.generatedBy,
    })
    .select('id')
    .single();
  if (error) throw new Error('Could not save audit: ' + error.message);
  return { id: data.id };
}

export async function loadAudit(id: string): Promise<AuditReport | null> {
  if (!supabaseConfigured()) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('pricing_audits').select('payload').eq('id', id).single();
  if (error || !data) return null;
  return data.payload as AuditReport;
}

export async function recentAudits(limit = 8): Promise<Array<{ id: string; domain: string; score: number; createdAt: string }>> {
  if (!supabaseConfigured()) return [];
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('pricing_audits')
    .select('id, domain, score, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((r: any) => ({ id: r.id, domain: r.domain, score: r.score, createdAt: r.created_at }));
}
