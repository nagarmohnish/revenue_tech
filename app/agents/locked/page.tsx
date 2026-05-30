'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { UpgradeCTA, AuthDeny } from '@/components/UpgradeCTA';
import { Boxes, Lock } from 'lucide-react';

function LockedInner() {
  const search = useSearchParams();
  const product = search.get('p') || 'postflwo';
  const [deny, setDeny] = useState<AuthDeny | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/agents/${product}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok || data?.allowed === false) setDeny(data as AuthDeny);
    })();
  }, [product]);

  return (
    <AppShell>
      <div>
        <div className="text-xs text-ink-400 uppercase tracking-wider">Locked agent</div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900 flex items-center gap-2">
          <Lock size={22} /> {product}
        </h1>
        <p className="text-sm text-ink-500 mt-1">
          This agent is registered in the tool registry but not yet available on your plan or not yet integrated.
        </p>
      </div>

      <div className="mt-6">
        {deny ? <UpgradeCTA deny={deny} /> : <div className="shimmer h-32 rounded-xl" />}
      </div>

      <div className="mt-8 card p-5">
        <div className="flex items-center gap-2 text-sm text-ink-500">
          <Boxes size={16} />
          The 402 response above is the <span className="font-mono text-ink-900">authorize()</span> contract returning the full decision package - the same payload that powers every upgrade CTA in the product.
        </div>
      </div>
    </AppShell>
  );
}

export default function LockedPage() {
  return (
    <Suspense>
      <LockedInner />
    </Suspense>
  );
}
