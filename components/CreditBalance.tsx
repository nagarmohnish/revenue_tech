'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { Zap } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function CreditBalance() {
  const { data } = useSWR('/api/v1/wallet', fetcher, { refreshInterval: 5000 });
  if (!data || data.error) return <div className="shimmer h-7 w-44 rounded-md" />;
  const pct = data.planLimit > 0 ? Math.min(100, (data.balance / data.planLimit) * 100) : 0;
  const tone = pct > 50 ? 'text-ok' : pct > 20 ? 'text-warn' : 'text-bad';

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex flex-col items-end">
        <div className="text-[11px] uppercase tracking-wider text-ink-400">
          Wallet · {data.plan}
        </div>
        <div className="text-xs text-ink-500">
          {data.balance.toLocaleString()} / {data.planLimit.toLocaleString()} · ~{data.projectedDays}d left
        </div>
      </div>
      <div className={`flex items-center gap-1.5 font-mono ${tone}`}>
        <Zap size={14} />
        <span className="font-semibold tabular-nums">{data.balance.toLocaleString()}</span>
      </div>
      {pct < 25 && (
        <Link href="/billing/topup" className="text-xs px-2 py-1 rounded-md bg-warn/10 text-warn font-medium hover:bg-warn/20">
          Top up
        </Link>
      )}
    </div>
  );
}
