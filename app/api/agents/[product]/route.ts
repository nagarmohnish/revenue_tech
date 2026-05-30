import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/billing';
import { getSession } from '@/lib/auth';

// Catch-all for registered-but-not-integrated agents (postflwo, bekbone, aeo_optimizer).
// Always returns 402 with full plan/upgrade context - that's the contract being tested.
const SUPPORTED = new Set(['postflwo', 'bekbone', 'aeo_optimizer']);

export async function POST(req: NextRequest, { params }: { params: { product: string } }) {
  if (!SUPPORTED.has(params.product)) {
    return NextResponse.json({ error: 'Unknown agent' }, { status: 404 });
  }
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const action: string = body?.action || (params.product === 'postflwo' ? 'write_article' : params.product === 'bekbone' ? 'draft_post' : 'score_page');

  const result = await authorize({ workspaceId: s.workspaceId, product: params.product, action });
  return NextResponse.json(result, { status: result.allowed ? 200 : 402 });
}
