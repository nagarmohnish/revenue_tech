import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { stripe, stripeConfigured, stripePriceForPlan } from '@/lib/stripe';
import { supabaseAdmin, supabaseConfigured } from '@/lib/supabase';
import { env } from '@/lib/env';
import { track } from '@/lib/posthog';

const Body = z.object({ plan: z.enum(['starter', 'growth']) });

export async function POST(req: NextRequest) {
  if (!supabaseConfigured()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  if (!stripeConfigured()) return NextResponse.json({ error: 'Stripe not configured. Set STRIPE_SECRET_KEY and price IDs.' }, { status: 503 });

  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const priceId = stripePriceForPlan(parsed.data.plan);
  if (!priceId) return NextResponse.json({ error: `No price configured for plan ${parsed.data.plan}` }, { status: 503 });

  const db = supabaseAdmin();
  const { data: ws } = await db
    .from('workspaces')
    .select('id, name, stripe_customer_id, owner_user_id')
    .eq('id', s.workspaceId)
    .single();

  const { data: user } = await db.from('users').select('email, name').eq('id', ws!.owner_user_id).single();

  // Ensure Stripe customer
  let customerId = ws!.stripe_customer_id;
  if (!customerId) {
    const cust = await stripe().customers.create({
      email: user!.email,
      name: user!.name || ws!.name,
      metadata: { workspaceId: s.workspaceId },
    });
    customerId = cust.id;
    await db.from('workspaces').update({ stripe_customer_id: customerId }).eq('id', s.workspaceId);
  }

  const session = await stripe().checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.authUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.authUrl}/billing/upgrade?canceled=1`,
    metadata: { workspaceId: s.workspaceId, type: 'subscribe', plan: parsed.data.plan },
    subscription_data: { metadata: { workspaceId: s.workspaceId, plan: parsed.data.plan } },
  });

  track(s.workspaceId, 'checkout_started', { plan: parsed.data.plan, price_id: priceId }).catch(() => {});

  return NextResponse.json({ checkoutUrl: session.url });
}
