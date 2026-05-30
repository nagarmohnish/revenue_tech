import { redirect } from 'next/navigation';
import { BuilderShell } from '@/components/BuilderShell';
import { getBuilderSession } from '@/lib/builderAuth';
import { getTenant } from '@/lib/builder';
import { supabaseConfigured } from '@/lib/supabase';
import { CreditCard, ExternalLink, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StripeConnectPage() {
  if (!supabaseConfigured()) return <div className="p-12">Supabase not configured.</div>;
  const session = await getBuilderSession();
  if (!session) redirect('/build/signup');
  const tenant = await getTenant(session.tenantId);

  const connected = !!tenant.stripe_account_id && tenant.stripe_account_status === 'active';

  return (
    <BuilderShell accountName={tenant.name} accountSlug={tenant.slug}>
      <div>
        <div className="text-[.72rem] uppercase tracking-[.14em] text-brand-600 font-bold">Payments</div>
        <h1 className="font-sans font-extrabold text-[2rem] tracking-tight text-ink-950 mt-1">Stripe Connect</h1>
        <p className="text-ink-500 text-[15px] mt-1.5">
          Your customers pay through <strong>your</strong> Stripe account. AgentMint forwards the request and takes a small platform fee. Money lands directly in your bank.
        </p>
      </div>

      <div className="mt-6 card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center"><CreditCard size={20} /></div>
          <div className="flex-1">
            {connected ? (
              <>
                <div className="font-bold text-ink-950">Connected</div>
                <p className="mt-1 text-sm text-ink-500">
                  Account: <span className="font-mono text-ink-900">{tenant.stripe_account_id}</span>
                </p>
                <a href="https://dashboard.stripe.com" target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-brand-600 font-semibold text-sm mt-3 hover:underline">
                  Open Stripe dashboard <ExternalLink size={13} />
                </a>
              </>
            ) : (
              <>
                <div className="font-bold text-ink-950">Not connected yet</div>
                <p className="mt-1 text-sm text-ink-500">
                  For the pilot, we provision your Stripe Connect link manually. Email <a href="mailto:hello@agentmint.com" className="text-brand-600 font-semibold hover:underline">hello@agentmint.com</a> and we'll send a Connect onboarding link within a few hours.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-xs bg-ink-50 border border-ink-100 rounded-md px-3 py-2 text-ink-600">
                  <Clock size={12} /> Self-serve Stripe Connect OAuth ships in the next release.
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 card p-5">
        <div className="text-[12px] uppercase tracking-[0.12em] text-ink-400 font-semibold">Platform fee</div>
        <div className="mt-1 text-ink-900 font-bold text-[1.25rem] tnum">{(tenant.platform_fee_bps / 100).toFixed(2)}%</div>
        <p className="mt-1 text-[13px] text-ink-500">Taken automatically as a Stripe application fee. Settings live on your tenant.</p>
      </div>
    </BuilderShell>
  );
}
