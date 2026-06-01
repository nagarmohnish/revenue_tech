// POST /api/stackscore/analyze
//
// Body — one of:
//   { "url": "https://example.com/pricing" }
//   { "screenshot": "<base64>", "mediaType": "image/png" | "image/jpeg" | "image/webp" }
//
// Response:
//   { id: string, score: number, hostname: string | null }
//
// The full Scorecard is stored in Supabase under the returned id.
// Client redirects to /stackscore/r/{id} for the report.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchAndExtract } from '@/lib/stackscore/extract';
import { extractSignalsFromImage } from '@/lib/stackscore/visionExtract';
import { scoreSignals } from '@/lib/stackscore/scorer';
import { augmentWithAiSuggestions } from '@/lib/stackscore/suggestions';
import { saveReport } from '@/lib/stackscore/store';

const Body = z.union([
  z.object({ url: z.string().min(3).max(2048) }),
  z.object({
    screenshot: z.string().min(64),
    mediaType: z.enum(['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  }),
]);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: Request) {
  let parsed;
  try {
    const json = await req.json();
    parsed = Body.parse(json);
  } catch {
    return NextResponse.json({ error: 'BAD_REQUEST', message: 'Provide either {url} or {screenshot, mediaType}.' }, { status: 400 });
  }

  try {
    const { signals, inputKind } = 'url' in parsed
      ? { signals: await fetchAndExtract(parsed.url),                            inputKind: 'url' as const }
      : { signals: await extractSignalsFromImage(parsed.screenshot, parsed.mediaType), inputKind: 'screenshot' as const };

    let card = scoreSignals(signals, inputKind);
    const aiSuggestions = await augmentWithAiSuggestions(card);
    if (aiSuggestions.length) card = { ...card, suggestions: [...card.suggestions, ...aiSuggestions] };

    const { id } = await saveReport(card);
    return NextResponse.json({ id, score: card.score, hostname: card.hostname });
  } catch (err: any) {
    const message = err?.message || 'Analysis failed';
    return NextResponse.json({ error: 'ANALYZE_FAILED', message }, { status: 400 });
  }
}
