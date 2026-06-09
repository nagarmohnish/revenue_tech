// POST /api/apply
//
// Public endpoint. Validates the form, saves to Supabase, fires email
// notifications best-effort, returns { id } so the client can redirect to
// /apply/thanks/[id]. Never reveals stack details on validation failures.

import { NextResponse } from 'next/server';
import { ApplicationSchema } from '@/lib/applications/validate';
import { saveApplication } from '@/lib/applications/store';
import { sendApplicantConfirmation, sendTeamNotification } from '@/lib/applications/notify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let payload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'BAD_REQUEST', message: 'Could not read form data' }, { status: 400 });
  }

  const parsed = ApplicationSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return NextResponse.json({
      error: 'VALIDATION',
      field: first?.path?.[0] ?? null,
      message: first?.message ?? 'Please check the form and try again',
    }, { status: 400 });
  }

  try {
    const userAgent = req.headers.get('user-agent') ?? undefined;
    const referrer  = req.headers.get('referer') ?? undefined;
    const { id } = await saveApplication(parsed.data, { userAgent, referrer });

    // Fire notifications in parallel; never block the response on email outcomes.
    Promise.allSettled([
      sendApplicantConfirmation(parsed.data, id),
      sendTeamNotification(parsed.data, id),
    ]).catch(() => { /* best effort */ });

    return NextResponse.json({ id });
  } catch (err: any) {
    return NextResponse.json({
      error: 'SAVE_FAILED',
      message: err?.message || 'Could not save application',
    }, { status: 500 });
  }
}
