import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { debit } from '@/lib/billing';
import { getSession } from '@/lib/auth';
import { resolveBearer, requireScope } from '@/lib/apiKeyAuth';
import { supabaseAdmin } from '@/lib/supabase';

const Body = z.object({
  workspaceId: z.string().uuid().optional(),
  product: z.string(),
  action: z.string(),
  cost: z.number().int().positive(),
  resourceId: z.string().uuid(),
  idempotencyKey: z.string().optional(),
  meta: z
    .object({ model: z.string().optional(), tokens: z.number().optional(), latencyMs: z.number().optional() })
    .optional(),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  let workspaceId = parsed.data.workspaceId;
  let userId: string | undefined;
  let tenantId: string | undefined;

  // API key path
  try {
    const apiCtx = await resolveBearer(req);
    if (apiCtx) {
      requireScope(apiCtx, 'debit');
      tenantId = apiCtx.tenantId;
      if (!workspaceId) {
        return NextResponse.json({ error: 'workspaceId required when calling with an API key' }, { status: 400 });
      }
      const db = supabaseAdmin();
      const { data: ws } = await db.from('workspaces').select('tenant_id').eq('id', workspaceId).maybeSingle();
      if (!ws || ws.tenant_id !== tenantId) {
        return NextResponse.json({ error: 'workspace not in this tenant' }, { status: 403 });
      }
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'auth failed' }, { status: 401 });
  }

  // Session fallback
  if (!tenantId) {
    if (!workspaceId) {
      const session = await getSession();
      if (!session) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
      workspaceId = session.workspaceId;
      userId = session.userId;
    }
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
  }

  try {
    const result = await debit({
      workspaceId: workspaceId!,
      product: parsed.data.product,
      action: parsed.data.action,
      cost: parsed.data.cost,
      resourceId: parsed.data.resourceId,
      userId,
      meta: parsed.data.meta,
    });
    if (!result.success) {
      return NextResponse.json({ success: false, error: 'INSUFFICIENT_CREDITS' }, { status: 402 });
    }
    return NextResponse.json(result);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || 'debit failed' }, { status: 500 });
  }
}
