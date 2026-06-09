import { NextResponse } from 'next/server';
import { RoadmapSchema } from '@/lib/roadmap/validate';
import { saveRoadmap } from '@/lib/roadmap/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let payload;
  try { payload = await req.json(); }
  catch { return NextResponse.json({ error: 'BAD_REQUEST', message: 'Could not read form data' }, { status: 400 }); }

  const parsed = RoadmapSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return NextResponse.json({
      error: 'VALIDATION',
      field: first?.path?.[0] ?? null,
      message: first?.message ?? 'Check the form and try again',
    }, { status: 400 });
  }

  try {
    const userAgent = req.headers.get('user-agent') ?? undefined;
    const referrer  = req.headers.get('referer') ?? undefined;
    const { id } = await saveRoadmap(parsed.data, { userAgent, referrer });
    return NextResponse.json({ id });
  } catch (err: any) {
    return NextResponse.json({ error: 'SAVE_FAILED', message: err?.message || 'Could not save' }, { status: 500 });
  }
}
