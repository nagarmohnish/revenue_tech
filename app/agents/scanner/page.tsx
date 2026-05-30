'use client';

import { useState } from 'react';
import { mutate } from 'swr';
import { AppShell } from '@/components/AppShell';
import { UpgradeCTA, AuthDeny } from '@/components/UpgradeCTA';
import { Search, Loader2, ArrowRight } from 'lucide-react';

interface ScanResult {
  citationScore: number;
  perEngine: Array<{ engine: string; score: number; notes?: string }>;
  topQueries: Array<{ query: string; visibility: number }>;
  recommendations: string[];
  domain: string;
}

export default function ScannerPage() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [deny, setDeny] = useState<AuthDeny | null>(null);

  async function run() {
    setLoading(true);
    setDeny(null);
    setResult(null);
    try {
      const res = await fetch('/api/agents/scanner', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setDeny(data as AuthDeny);
      } else if (!res.ok) {
        setDeny({ reason: 'UNKNOWN_TOOL', message: data?.error || 'Scan failed' });
      } else {
        setResult(data.result as ScanResult);
        mutate('/api/v1/wallet');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-ink-400 uppercase tracking-wider">AgentMint registry</div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900 flex items-center gap-2">
            <Search size={22} /> AI Visibility Scanner
          </h1>
          <p className="text-sm text-ink-500 mt-1">Citation score across ChatGPT, Perplexity, Gemini and Claude. 50 credits per domain scan.</p>
        </div>
      </div>

      <section className="mt-6 card p-5">
        <label className="block text-xs font-medium text-ink-500 mb-1.5">Domain</label>
        <div className="flex gap-2">
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="acme.com"
            className="field"
            onKeyDown={(e) => e.key === 'Enter' && domain && run()}
          />
          <button onClick={run} disabled={!domain || loading} className="btn-primary">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Scanning…</> : <>Scan domain <ArrowRight size={14} /></>}
          </button>
        </div>
        <p className="mt-2 text-xs text-ink-400">Charges 50 credits on success. authorize() runs first - if you can't afford it, no scan is performed.</p>
      </section>

      {deny && (
        <section className="mt-6">
          <UpgradeCTA deny={deny} />
        </section>
      )}

      {result && (
        <section className="mt-8 space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-ink-400 uppercase tracking-wider">Domain</div>
                <div className="text-xl font-semibold text-ink-900">{result.domain}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-ink-400 uppercase tracking-wider">Citation score</div>
                <div className="text-5xl font-semibold tabular-nums text-ink-900">{result.citationScore}<span className="text-base text-ink-500">/100</span></div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {result.perEngine.map((e) => (
                <div key={e.engine} className="rounded-lg border border-ink-100 p-3">
                  <div className="text-xs text-ink-400">{e.engine}</div>
                  <div className="text-xl font-semibold tabular-nums">{e.score}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-ink-900">Top queries</h3>
            <ul className="mt-3 divide-y divide-ink-100">
              {result.topQueries.map((q) => (
                <li key={q.query} className="py-2.5 flex items-center justify-between text-sm">
                  <span className="text-ink-700">{q.query}</span>
                  <span className="font-mono text-ink-500">{q.visibility}%</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-ink-900">Recommendations</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink-700 list-disc list-inside">
              {result.recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </AppShell>
  );
}
