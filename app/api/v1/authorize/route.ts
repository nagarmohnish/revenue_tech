import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authorize } from '@/lib/billing';
import { getSession } from '@/lib/auth';
import { resolveBearer, requireScope } from '@/lib/apiKeyAuth';
import { supabaseAdmin } from '@/lib/supabase';

const Body = z.object({
  workspaceId: z.string().uuid().optional(),
  product: z.string(),
  action: z.string(),
  cost: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  // 1) Try API key auth first (agency SDK calls)
  let workspaceId = parsed.data.workspaceId;
  let tenantId: string | undefined;
  try {
    const apiCtx = await resolveBearer(req);
    if (apiCtx) {
      requireScope(apiCtx, 'authorize');
      tenantId = apiCtx.tenantId;
      if (!workspaceId) {
        return NextResponse.json({ error: 'workspaceId required when calling with an API key' }, { status: 400 });
      }
      // Ensure the workspace belongs to this tenant.
      const db = supabaseAdmin();
      const { data: ws } = await db.from('workspaces').select('tenant_id').eq('id', workspaceId).maybeSingle();
      if (!ws || ws.tenant_id !== tenantId) {
        return NextResponse.json({ error: 'workspace not in this tenant' }, { status: 403 });
      }
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'auth failed' }, { status: 401 });
  }

  // 2) Fall back to session auth (end-customer in hosted workspace UI)
  if (!tenantId) {
    if (!workspaceId) {
      const session = await getSession();
      if (!session) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
      workspaceId = session.workspaceId;
    }
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    const db = supabaseAdmin();
    const { data: ws } = await db.from('workspaces').select('tenant_id').eq('id', workspaceId).maybeSingle();
    tenantId = ws?.tenant_id || undefined;
  }

  try {
    const result = await authorize({
      workspaceId: workspaceId!,
      tenantId,
      product: parsed.data.product,
      action: parsed.data.action,
      cost: parsed.data.cost,
    });
    return NextResponse.json(result, { status: result.allowed ? 200 : 402 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || 'authorize failed' }, { status: 500 });
  }
}
