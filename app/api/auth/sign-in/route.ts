import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ensureWorkspaceForEmail, setSessionCookie } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/resend';
import { track } from '@/lib/posthog';
import { supabaseConfigured } from '@/lib/supabase';

const Body = z.object({ email: z.string().email(), name: z.string().optional() });

export async function POST(req: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.json(
      { error: 'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then run supabase/migrations/0001_init.sql.' },
      { status: 503 },
    );
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });

  try {
    const session = await ensureWorkspaceForEmail(parsed.data.email, parsed.data.name);
    await setSessionCookie(session);

    // Best-effort welcome email + funnel event
    sendWelcomeEmail(parsed.data.email, parsed.data.name).catch(() => {});
    track(session.workspaceId, 'trial_started', { plan: 'trial', source: 'email_signup' }).catch(() => {});

    return NextResponse.json({ ok: true, workspaceId: session.workspaceId });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || 'Sign-in failed' }, { status: 500 });
  }
}
