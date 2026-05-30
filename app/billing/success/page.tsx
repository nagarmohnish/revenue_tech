'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { AppShell } from '@/components/AppShell';
import { CheckCircle2, Loader2 } from 'lucide-react';

const fetcher = (u: string) => fetch(u).then((r) => r.json());

function SuccessInner() {
  const { data, mutate } = useSWR('/api/v1/wallet', fetcher, { refreshInterval: 3000 });
  const [waitedSecs, setWaitedSecs] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setWaitedSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <AppShell>
      <div className="card p-10 text-center max-w-xl mx-auto">
        <div className="w-12 h-12 mx-auto rounded-full bg-ok/10 flex items-center justify-center text-ok">
          <CheckCircle2 size={28} />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink-900">Payment received</h1>
        <p className="mt-2 text-ink-500">
          Stripe is delivering the webhook now. Credits land in your wallet typically within 30 seconds.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 text-sm text-ink-500">
          {data?.balance != null ? (
            <span>Current wallet: <strong className="font-mono text-ink-900">{data.balance.toLocaleString()}</strong> credits</span>
          ) : (
            <><Loader2 size={14} className="animate-spin" /> Refreshing wallet…</>
          )}
        </div>
        <div className="mt-1 text-xs text-ink-400">Waited {waitedSecs}s · auto-refresh every 3s</div>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/dashboard" className="btn-primary">Open dashboard</Link>
          <button onClick={() => mutate()} className="btn-secondary">Refresh now</button>
        </div>
      </div>
    </AppShell>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessInner />
    </Suspense>
  );
}
