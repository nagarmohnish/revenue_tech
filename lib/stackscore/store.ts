import { supabaseAdmin, supabaseConfigured } from '../supabase';
import { Scorecard } from './types';

export async function saveReport(card: Scorecard): Promise<{ id: string }> {
  if (!supabaseConfigured()) {
    throw new Error('Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('stackscore_reports')
    .insert({
      url: card.url,
      hostname: card.hostname,
      input_kind: card.inputKind,
      score: card.score,
      payload: card,
    })
    .select('id')
    .single();
  if (error) throw new Error('Failed to save report: ' + error.message);
  return { id: data.id };
}

export async function loadReport(id: string): Promise<Scorecard | null> {
  if (!supabaseConfigured()) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('stackscore_reports')
    .select('payload')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return data.payload as Scorecard;
}
