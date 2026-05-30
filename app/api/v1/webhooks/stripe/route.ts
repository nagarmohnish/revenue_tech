import { NextRequest, NextResponse } from 'next/server';
import { stripe, stripeConfigured } from '@/lib/stripe';
import { supabaseAdmin, supabaseConfigured } from '@/lib/supabase';
import { env } from '@/lib/env';
import { track } from '@/lib/posthog';
import { PLANS, Plan } from '@/lib/plans';

export const runtime = 'nodejs';

function planFromPriceId(priceId?: string | null): Plan | null {
  if (!priceId) return null;
  if (priceId === env.stripeStarterPrice) return 'starter';
  if (priceId === env.stripeGrowthPrice) return 'growth';
  return null;
}

async function getWorkspaceByCustomer(customerId: string): Promise<string | null> {
  const db = supabaseAdmin();
  const { data } = await db.from('workspaces').select('id').eq('stripe_customer_id', customerId).maybeSingle();
  return data?.id || null;
}

async function grant(workspaceId: string, amount: number, type: 'GRANT' | 'TOPUP', stripeRef: string, note?: string) {
  const db = supabaseAdmin();
  return db.rpc('grant_credits', {
    p_workspace_id: workspaceId,
    p_amount: amount,
    p_type: type,
    p_stripe_ref: stripeRef,
    p_note: note || null,
  });
}

export async function POST(req: NextRequest) {
  if (!stripeConfigured() || !supabaseConfigured()) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 });
  const body = await req.text();

  let event;
  try {
    event = stripe().webhooks.constructEvent(body, sig, env.stripeWebhookSecret);
  } catch (e: any) {
    console.error('[stripe] bad signature', e.message);
    return NextResponse.json({ error: 'bad signature' }, { status: 400 });
  }

  const db = supabaseAdmin();

  // Idempotency
  const { data: existing } = await db
    .from('stripe_events')
    .select('stripe_event_id')
    .eq('stripe_event_id', event.id)
    .maybeSingle();
  if (existing) return NextResponse.json({ received: true, dedup: true });

  let workspaceId: string | null = null;

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub: any = event.data.object;
        const plan = planFromPriceId(sub.items?.data?.[0]?.price?.id);
        workspaceId = (sub.metadata?.workspaceId as string) || (await getWorkspaceByCustomer(sub.customer as string));
        if (!workspaceId) break;
        await db.from('subscriptions').upsert({
          workspace_id: workspaceId,
          stripe_subscription_id: sub.id,
          plan: plan || 'starter',
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        });
        await db
          .from('workspaces')
          .update({
            plan: plan || 'starter',
            status: sub.status,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq('id', workspaceId);
        break;
      }
      case 'invoice.payment_succeeded': {
        const inv: any = event.data.object;
        workspaceId = await getWorkspaceByCustomer(inv.customer as string);
        if (!workspaceId) break;
        const priceId = inv.lines?.data?.[0]?.price?.id;
        const plan = planFromPriceId(priceId);
        if (plan) {
          await grant(workspaceId, PLANS[plan].credits, 'GRANT', inv.id, `Plan grant: ${plan}`);
          track(workspaceId, 'payment_completed', { plan, mrr: PLANS[plan].price_usd }).catch(() => {});
        }
        break;
      }
      case 'checkout.session.completed': {
        const cs: any = event.data.object;
        workspaceId = (cs.metadata?.workspaceId as string) || null;
        if (workspaceId && cs.metadata?.type === 'topup') {
          await grant(workspaceId, parseInt(cs.metadata?.credits || '500', 10), 'TOPUP', cs.payment_intent as string, 'Top-up purchase');
          track(workspaceId, 'topup_completed', { credits: 500 }).catch(() => {});
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub: any = event.data.object;
        workspaceId = (sub.metadata?.workspaceId as string) || (await getWorkspaceByCustomer(sub.customer as string));
        if (workspaceId) {
          await db.from('workspaces').update({ plan: 'trial', status: 'canceled' }).eq('id', workspaceId);
          await db.from('subscriptions').update({ cancelled_at: new Date().toISOString(), status: 'canceled' }).eq('workspace_id', workspaceId);
          track(workspaceId, 'subscription_cancelled', {}).catch(() => {});
        }
        break;
      }
    }

    await db.from('stripe_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
      workspace_id: workspaceId,
      processed: true,
      processed_at: new Date().toISOString(),
    });
    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error('[stripe] processing error', e);
    return NextResponse.json({ error: e.message || 'processing failed' }, { status: 500 });
  }
}
