import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAccountWithOwner, setBuilderSessionCookie, validateSlug } from '@/lib/builderAuth';
import { supabaseAdmin, supabaseConfigured } from '@/lib/supabase';

const Body = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(80),
  // Display name. For a company this is the company name; for an indie,
  // their personal handle or product name. We accept either field for tolerance.
  accountName: z.string().min(2).max(80).optional(),
  companyName: z.string().min(2).max(80).optional(),
  slug: z.string().min(3).max(40),
});

export async function POST(req: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.json(
      { error: 'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then run supabase/migrations/*.sql.' },
      { status: 503 },
    );
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid signup payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const accountName = parsed.data.accountName || parsed.data.companyName;
  if (!accountName) {
    return NextResponse.json({ error: 'Account name required' }, { status: 400 });
  }

  const slug = parsed.data.slug.toLowerCase().trim();
  const slugCheck = validateSlug(slug);
  if (!slugCheck.ok) return NextResponse.json({ error: slugCheck.reason }, { status: 400 });

  // Slug uniqueness pre-check
  const db = supabaseAdmin();
  const { data: existing } = await db.from('tenants').select('id').eq('slug', slug).maybeSingle();
  if (existing) return NextResponse.json({ error: 'That handle is taken. Pick another.' }, { status: 409 });

  try {
    const { tenantId, userId, role } = await createAccountWithOwner({
      email: parsed.data.email,
      name: parsed.data.name,
      accountName,
      slug,
    });
    await setBuilderSessionCookie({ tenantId, userId, email: parsed.data.email, role });
    return NextResponse.json({ ok: true, tenantId, slug });
  } catch (e: any) {
    console.error('[builder signup] error', e);
    return NextResponse.json({ error: e?.message || 'Signup failed' }, { status: 500 });
  }
}
