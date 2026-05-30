'use client';

import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { TOPUP } from '@/lib/plans';
import { Loader2, Zap } from 'lucide-react';

export default function TopUpPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/checkout/topup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Checkout failed');
      window.location.href = data.checkoutUrl;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div>
        <div className="text-xs text-ink-400 uppercase tracking-wider">Billing</div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Top up credits</h1>
        <p className="text-sm text-ink-500 mt-1">One-time credit purchase. Lands in your wallet within seconds of payment.</p>
      </div>

      {error && <div className="mt-4 text-sm text-bad bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</div>}

      <div className="mt-6 card p-6 max-w-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warn/10 flex items-center justify-center text-warn">
            <Zap size={18} />
          </div>
          <div>
            <div className="font-semibold text-ink-900">{TOPUP.standard.label}</div>
            <div className="text-sm text-ink-500">+{TOPUP.standard.credits} credits · never expires</div>
          </div>
          <div className="ml-auto text-2xl font-semibold tabular-nums">${TOPUP.standard.price_usd}</div>
        </div>
        <button disabled={loading} onClick={buy} className="mt-6 btn-primary w-full justify-center">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Redirecting…</> : `Pay $${TOPUP.standard.price_usd} → +${TOPUP.standard.credits} credits`}
        </button>
        <div className="mt-3 text-xs text-ink-400">Powered by Stripe. Your invoice is downloadable from the billing page.</div>
      </div>
    </AppShell>
  );
}
