// GET /api/audit/[id]/pdf
//
// Asks the Playwright worker to render /audit/r/[id]/print as a PDF and
// streams the bytes back. The worker must be reachable at STACKSCORE_WORKER_URL
// (we reuse the same secret + URL — one Playwright service, two tools).

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const workerUrl = (process.env.STACKSCORE_WORKER_URL || '').replace(/\/+$/, '');
  const workerSecret = process.env.STACKSCORE_WORKER_SECRET || '';
  if (!workerUrl) {
    return NextResponse.json({ error: 'NO_WORKER', message: 'PDF requires the Playwright worker. Set STACKSCORE_WORKER_URL.' }, { status: 503 });
  }

  // Compose the print URL on this app. In dev that's localhost:3000.
  // We use the request's own origin so this works whether we're on localhost
  // or a deployed host.
  const reqUrl = new URL(req.url);
  const printUrl = `${reqUrl.origin}/audit/r/${params.id}/print`;

  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (workerSecret) headers['x-stackscore-secret'] = workerSecret;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);
  let res: Response;
  try {
    res = await fetch(workerUrl + '/pdf', {
      method: 'POST',
      headers,
      body: JSON.stringify({ url: printUrl }),
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeout);
    return NextResponse.json({ error: 'WORKER_UNREACHABLE', message: err?.message || 'Worker request failed' }, { status: 502 });
  }
  clearTimeout(timeout);

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    return NextResponse.json({ error: 'PDF_FAILED', message: `Worker returned ${res.status}: ${detail.slice(0, 200)}` }, { status: 502 });
  }

  const buf = await res.arrayBuffer();
  return new NextResponse(buf, {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="agentmint-pricing-audit-${params.id.slice(0, 8)}.pdf"`,
      'cache-control': 'private, max-age=0, no-store',
    },
  });
}
