import { NextRequest, NextResponse } from 'next/server';
import { requireBuilderSession } from '@/lib/builderAuth';
import { supabaseAdmin, supabaseConfigured } from '@/lib/supabase';

export async function DELETE(_req: NextRequest, { params }: { params: { productId: string } }) {
  if (!supabaseConfigured()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  try {
    const s = await requireBuilderSession();
    const db = supabaseAdmin();
    const { error } = await db
      .from('tool_registry')
      .delete()
      .eq('tenant_id', s.tenantId)
      .eq('product_id', params.productId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'failed' }, { status: e.message === 'UNAUTHENTICATED' ? 401 : 500 });
  }
}
