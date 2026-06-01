// POST /api/stackscore/analyze
//
// Body: { url: string, maxSteps?: number }
// Response: { id, score, hostname, steps }
//
// Flow: validate URL → call Fly.io worker → score the walk → save → return id.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { normalizeAndValidateUrl } from '@/lib/stackscore/url';
import { callWorker } from '@/lib/stackscore/walker';
import { scoreWalk } from '@/lib/stackscore/flowScorer';
import { augmentFlowWithAi } from '@/lib/stackscore/suggestions';
import { saveReport } from '@/lib/stackscore/store';

const Body = z.object({
  url: z.string().min(3).max(2048),
  maxSteps: z.number().int().min(1).max(8).optional(),
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;  // worker can take up to 90s; allow for overhead

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'BAD_REQUEST', message: 'Provide { url }.' }, { status: 400 });
  }

  try {
    // Pre-validate before calling the worker — saves a round trip for bad URLs.
    normalizeAndValidateUrl(parsed.url);

    const walk = await callWorker(parsed.url, parsed.maxSteps ?? 6);
    let report = scoreWalk(walk);

    const aiSuggestions = await augmentFlowWithAi(report);
    if (aiSuggestions.length) report = { ...report, suggestions: [...report.suggestions, ...aiSuggestions] };

    const { id } = await saveReport(report);
    return NextResponse.json({
      id,
      score: report.score,
      hostname: report.hostname,
      stepCount: report.steps.length,
    });
  } catch (err: any) {
    return NextResponse.json({
      error: 'ANALYZE_FAILED',
      message: err?.message || 'Analysis failed',
    }, { status: 400 });
  }
}
