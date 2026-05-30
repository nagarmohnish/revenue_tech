import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireBuilderSession, generateApiKey } from '@/lib/builderAuth';
import { supabaseAdmin, supabaseConfigured } from '@/lib/supabase';
import { listApiKeysForTenant } from '@/lib/builder';

const Body = z.object({
  name: z.string().min(1).max(80),
  scopes: z.array(z.enum(['authorize', 'debit', 'wallet:read', 'admin'])).default(['authorize', 'debit']),
});

export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  try {
    const s = await requireBuilderSession();
    const keys = await listApiKeysForTenant(s.tenantId);
    return NextResponse.json({ keys });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'failed' }, { status: e.message === 'UNAUTHENTICATED' ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!supabaseConfigured()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  try {
    const s = await requireBuilderSession();
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });

    const db = supabaseAdmin();
    const { full, prefix, hash } = generateApiKey();
    const { data, error } = await db.rpc('register_api_key', {
      p_tenant_id: s.tenantId,
      p_name: parsed.data.name,
      p_prefix: prefix,
      p_key_hash: hash,
      p_scopes: parsed.data.scopes,
      p_user_id: s.userId,
    });
    if (error) throw error;

    // Return full key ONCE. Cannot be re-fetched later.
    return NextResponse.json({ ok: true, id: data, key: full, prefix });
  } catch (e: any) {
    console.error('[api keys] create error', e);
    return NextResponse.json({ error: e.message || 'failed' }, { status: e.message === 'UNAUTHENTICATED' ? 401 : 500 });
  }
}
