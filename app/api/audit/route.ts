// POST /api/audit  → scrape a domain, run analysis, save, return id.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { scrapeDomainPricing } from '@/lib/audit/scrape';
import { buildAuditReport } from '@/lib/audit/analyze';
import { saveAudit } from '@/lib/audit/store';

const Body = z.object({ domain: z.string().min(3).max(500) });

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  let parsed;
  try { parsed = Body.parse(await req.json()); }
  catch { return NextResponse.json({ error: 'BAD_REQUEST', message: 'Provide { domain }.' }, { status: 400 }); }

  try {
    const scraped = await scrapeDomainPricing(parsed.domain);
    const report  = await buildAuditReport(scraped);
    const { id }  = await saveAudit(report);
    return NextResponse.json({ id, score: report.score, domain: report.domain });
  } catch (err: any) {
    return NextResponse.json({ error: 'AUDIT_FAILED', message: err?.message || 'Could not audit that domain' }, { status: 400 });
  }
}
