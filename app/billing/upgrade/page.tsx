'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { PLANS } from '@/lib/plans';
import { Check, Loader2 } from 'lucide-react';

function UpgradeInner() {
  const search = useSearchParams();
  const highlight = search.get('highlight') || '';
  const preselected = (search.get('plan') as 'starter' | 'growth') || 'starter';
  const [loading, setLoading] = useState<'starter' | 'growth' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(plan: 'starter' | 'growth') {
    setLoading(plan);
    setError(null);
    try {
      const res = await fetch('/api/v1/checkout/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Checkout failed');
      window.location.href = data.checkoutUrl;
    } catch (e: any) {
      setError(e.message);
      setLoading(null);
    }
  }

  return (
    <AppShell>
      <div>
        <div className="text-xs text-ink-400 uppercase tracking-wider">Billing</div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Upgrade your plan</h1>
        {highlight && (
          <p className="text-sm text-ink-500 mt-1">
            Triggered from <span className="font-mono text-ink-900">{highlight}</span> - Growth includes this agent.
          </p>
        )}
      </div>

      {error && <div className="mt-4 text-sm text-bad bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</div>}

      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {(['starter', 'growth'] as const).map((p) => {
          const plan = PLANS[p];
          const featured = p === preselected;
          return (
            <div key={p} className={`card p-6 relative ${featured ? 'ring-2 ring-accent-500' : ''}`}>
              {featured && <div className="absolute -top-2.5 left-6 tag bg-accent-500 text-white">Recommended</div>}
              <div className="text-sm text-ink-500 capitalize">{plan.name}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <div className="text-4xl font-semibold tracking-tight text-ink-900 tabular-nums">${plan.price_usd}</div>
                <div className="text-ink-400 text-sm">/ mo</div>
              </div>
              <div className="mt-1 text-sm text-ink-500">{plan.credits.toLocaleString()} credits / month</div>
              <ul className="mt-5 space-y-2 text-sm text-ink-700">
                {p === 'starter' && (
                  <>
                    <li className="flex gap-2"><Check size={16} className="text-ok mt-0.5" /> Scanner, Blog Writer, Content Studio</li>
                    <li className="flex gap-2"><Check size={16} className="text-ok mt-0.5" /> +500 credit top-ups ($9 each)</li>
                    <li className="flex gap-2"><Check size={16} className="text-ok mt-0.5" /> Stripe invoices</li>
                  </>
                )}
                {p === 'growth' && (
                  <>
                    <li className="flex gap-2"><Check size={16} className="text-ok mt-0.5" /> Everything in Starter</li>
                    <li className="flex gap-2"><Check size={16} className="text-ok mt-0.5" /> PostFlwo · Bekbone · AEO Optimizer</li>
                    <li className="flex gap-2"><Check size={16} className="text-ok mt-0.5" /> 500 credit rollover/month</li>
                    <li className="flex gap-2"><Check size={16} className="text-ok mt-0.5" /> 5 team seats (Phase 2)</li>
                  </>
                )}
              </ul>
              <button
                disabled={!!loading}
                onClick={() => choose(p)}
                className={`mt-6 w-full justify-center ${featured ? 'btn-accent' : 'btn-primary'}`}
              >
                {loading === p ? <><Loader2 size={16} className="animate-spin" /> Redirecting…</> : `Choose ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-xs text-ink-500">
        Payment opens in Stripe Checkout. Credits land in your wallet within 30 seconds of payment.
      </div>
    </AppShell>
  );
}

export default function UpgradePage() {
  return (
    <Suspense>
      <UpgradeInner />
    </Suspense>
  );
}
