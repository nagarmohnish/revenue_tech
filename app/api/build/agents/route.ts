import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireBuilderSession } from '@/lib/builderAuth';
import { supabaseAdmin, supabaseConfigured } from '@/lib/supabase';
import { listAgentsForTenant } from '@/lib/builder';

const ActionSchema = z.object({
  action_id: z.string().regex(/^[a-z][a-z0-9_]*$/, 'lowercase, digits, underscore'),
  cost: z.number().int().min(0).max(10000),
  label: z.string().min(1).max(80),
});

const CreateBody = z.object({
  product_id:   z.string().regex(/^[a-z][a-z0-9_]*$/, 'lowercase, digits, underscore').max(40),
  display_name: z.string().min(1).max(80),
  available_on: z.array(z.string().min(2).max(20)).min(1),
  actions:      z.array(ActionSchema).min(1).max(20),
  integrated:   z.boolean().default(true),
});

export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  try {
    const s = await requireBuilderSession();
    const agents = await listAgentsForTenant(s.tenantId);
    return NextResponse.json({ agents });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'failed' }, { status: e.message === 'UNAUTHENTICATED' ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!supabaseConfigured()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  try {
    const s = await requireBuilderSession();
    const parsed = CreateBody.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid agent payload', details: parsed.error.flatten() }, { status: 400 });

    const db = supabaseAdmin();
    const tenantSlug = (await db.from('tenants').select('slug').eq('id', s.tenantId).single()).data?.slug || 'tenant';

    const { error } = await db.from('tool_registry').insert({
      product_id:   parsed.data.product_id,
      company:      tenantSlug,
      display_name: parsed.data.display_name,
      available_on: parsed.data.available_on,
      actions:      parsed.data.actions,
      integrated:   parsed.data.integrated,
      tenant_id:    s.tenantId,
      is_active:    true,
    });

    if (error) {
      if ((error as any).code === '23505') {
        return NextResponse.json({ error: `An agent with product_id "${parsed.data.product_id}" already exists in your account.` }, { status: 409 });
      }
      throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'failed' }, { status: e.message === 'UNAUTHENTICATED' ? 401 : 500 });
  }
}
