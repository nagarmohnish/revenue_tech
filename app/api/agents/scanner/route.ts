import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runAgentCall } from '@/lib/agentRunner';
import { callScanner } from '@/lib/sparrwo';

const Body = z.object({ domain: z.string().min(3) });

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Domain required' }, { status: 400 });

  const out = await runAgentCall({
    product: 'scanner',
    action: 'scan_domain',
    cost: 50,
    run: async () => {
      const r = await callScanner(parsed.data.domain);
      return { ...r, domain: parsed.data.domain, _meta: { model: 'sparrwo-scanner-v1' } };
    },
  });
  return NextResponse.json(out.body, { status: out.ok ? 200 : out.status });
}
