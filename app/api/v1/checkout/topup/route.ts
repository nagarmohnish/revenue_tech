import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { stripe, stripeConfigured, stripeTopupPrice } from '@/lib/stripe';
import { supabaseAdmin, supabaseConfigured } from '@/lib/supabase';
import { env } from '@/lib/env';
import { track } from '@/lib/posthog';

export async function POST() {
  if (!supabaseConfigured()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  if (!stripeConfigured()) return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  const priceId = stripeTopupPrice();
  if (!priceId) return NextResponse.json({ error: 'STRIPE_TOPUP_STANDARD_PRICE_ID not set' }, { status: 503 });

  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

  const db = supabaseAdmin();
  const { data: ws } = await db
    .from('workspaces')
    .select('id, name, stripe_customer_id, owner_user_id')
    .eq('id', s.workspaceId)
    .single();
  const { data: user } = await db.from('users').select('email, name').eq('id', ws!.owner_user_id).single();

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
    mode: 'payment',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.authUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.authUrl}/billing?canceled=1`,
    metadata: { workspaceId: s.workspaceId, type: 'topup', credits: '500' },
    payment_intent_data: { metadata: { workspaceId: s.workspaceId, type: 'topup' } },
  });

  track(s.workspaceId, 'checkout_started', { type: 'topup', credits: 500 }).catch(() => {});

  return NextResponse.json({ checkoutUrl: session.url });
}
