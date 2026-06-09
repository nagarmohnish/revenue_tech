'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowRight, Wallet, FileText, BarChart3, Sparkles, ShieldCheck, Loader2, Check, Globe,
} from 'lucide-react';

const LOADER_STEPS = [
  'Resolving the domain…',
  'Looking for the pricing page…',
  'Reading the page rendered HTML…',
  'Extracting prices, tiers and signals…',
  'Comparing against the benchmark set…',
  'Writing the competitive findings…',
  'Generating recommendations…',
  'Wrapping up the report…',
];

export default function AuditLanding() {
  const router = useRouter();
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [loaderIdx, setLoaderIdx] = useState(0);

  useEffect(() => {
    if (!loading) { setLoaderIdx(0); return; }
    const id = window.setInterval(() => setLoaderIdx((i) => Math.min(i + 1, LOADER_STEPS.length - 1)), 1500);
    return () => window.clearInterval(id);
  }, [loading]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Could not audit that domain');
      router.push(`/audit/r/${data.id}`);
    } catch (err: any) {
      setError(err?.message || 'Could not audit that domain');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-ink-950 font-sans antialiased">

      <header className="border-b border-ink-100 bg-white/95 backdrop-blur sticky top-0 z-20">
        <div className="wrap h-[64px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold text-ink-950">
            <span className="relative w-7 h-7 rounded-lg bg-ink-950 flex items-center justify-center">
              <Wallet size={14} className="text-brand-400" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-white" />
            </span>
            <span className="text-[1.05rem] tracking-tight">Agent<span className="text-brand-500">Mint</span></span>
          </Link>
          <Link href="/" className="text-[13px] font-medium text-ink-600 hover:text-ink-950">Back</Link>
        </div>
      </header>

      <main className="wrap py-14 md:py-20 max-w-3xl">

        {loading && (
          <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center">
              <Loader2 size={36} className="text-brand-500 animate-spin mx-auto" strokeWidth={2.2} />
              <h2 className="mt-6 font-extrabold text-[1.7rem] tracking-tight text-ink-950 leading-tight">
                Auditing <span className="text-brand-500">{domain.replace(/^https?:\/\//, '')}</span>.
              </h2>
              <p className="mt-3 text-[14px] text-ink-600 leading-relaxed">
                We're fetching the pricing page, extracting signals, and writing a competitive read. ~15 seconds.
              </p>
              <div className="mt-8 text-left bg-white border border-ink-100 rounded-xl p-4 space-y-1.5">
                {LOADER_STEPS.map((step, i) => (
                  <div key={i} className={`flex items-center gap-2.5 text-[13px] transition ${i < loaderIdx ? 'text-ink-700' : i === loaderIdx ? 'text-ink-950 font-bold' : 'text-ink-400'}`}>
                    {i < loaderIdx ? (
                      <Check size={13} className="text-brand-600 flex-shrink-0" strokeWidth={3} />
                    ) : i === loaderIdx ? (
                      <Loader2 size={13} className="text-brand-500 animate-spin flex-shrink-0" />
                    ) : (
                      <span className="w-[13px] h-[13px] rounded-full border border-ink-300 flex-shrink-0" />
                    )}
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <section>
          <div className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[.14em] font-bold text-brand-700">
            <Sparkles size={12} /> Free pricing audit
          </div>
          <h1 className="mt-4 font-extrabold tracking-[-0.03em] leading-[1.02] text-[2.6rem] md:text-[3.6rem]">
            Pricing audit, <span className="text-brand-500">for free.</span>
          </h1>
          <p className="mt-5 text-[1.08rem] text-ink-600 leading-relaxed max-w-2xl">
            Paste your domain. We study your pricing surface, classify your business model, compare you to three competitors with real names, and hand you a branded report (web + PDF) in about fifteen seconds.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-600">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-brand-600" /> No signup</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-brand-600" /> No follow-up email</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-brand-600" /> Shareable URL</span>
          </div>
        </section>

        <form onSubmit={submit} className="mt-10 rounded-2xl border border-ink-100 bg-white p-5 md:p-6">
          <label className="block text-[13px] font-bold text-ink-800 mb-2">Your domain</label>
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-[240px] flex items-center gap-2 px-3.5 py-3 rounded-lg border border-ink-200 focus-within:border-ink-400 transition">
              <Globe size={15} className="text-ink-400 flex-shrink-0" />
              <input
                type="text" required value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="stripe.com"
                className="flex-1 bg-transparent outline-none text-[15px]"
              />
            </div>
            <button
              type="submit" disabled={loading || !domain}
              className="inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-white bg-ink-950 hover:bg-ink-800 disabled:bg-ink-400 rounded-lg px-5 py-3 transition"
            >
              Audit it <ArrowRight size={14} />
            </button>
          </div>
          {error && <div className="mt-3 text-[13px] text-coral-600 bg-coral-400/10 border border-coral-400/30 rounded-md px-3 py-2">{error}</div>}

          <div className="mt-5 flex flex-wrap items-center gap-2 text-[12px] text-ink-500">
            <span>Try:</span>
            {['notion.so', 'figma.com', 'linear.app', 'shopify.com'].map((d) => (
              <button
                key={d} type="button"
                onClick={() => setDomain(d)}
                className="mono px-2.5 py-1 rounded-md border border-ink-200 hover:border-ink-400 transition text-ink-700"
              >
                {d}
              </button>
            ))}
          </div>
        </form>

        <section className="mt-16">
          <div className="text-[12px] uppercase tracking-[.14em] font-bold text-brand-700">What you get</div>
          <h2 className="mt-3 font-extrabold text-[1.7rem] md:text-[2rem] tracking-tight">A real competitive read, not a generic scoring tool.</h2>

          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            <Feature icon={FileText}  title="Business-model classification" body="Freemium / trial / paid-only / usage-based / hybrid / enterprise-only — with a reasoning paragraph defending the call." />
            <Feature icon={BarChart3} title="Score breakdown across four areas" body="Positioning · Pricing · Conversion · Trust, each scored 0–25 with the signals that landed each point." />
            <Feature icon={Sparkles}  title="Three named competitors" body="Real public companies in your category, with their pattern and what to take away from each." />
            <Feature icon={ShieldCheck} title="Findings + prioritized recommendations" body="What you're doing well, what to fix, what to test — ordered by leverage. Each fix with an exemplar." />
          </div>
        </section>

      </main>

      <footer className="border-t border-ink-100">
        <div className="wrap py-8 text-[12px] text-ink-500 flex items-center justify-between">
          <span>Pricing Audit · by <Link href="/" className="font-bold text-ink-700 hover:text-ink-950">AgentMint</Link></span>
          <Link href="/roadmap" className="hover:text-ink-950">Need deeper analysis? See the Roadmap tool →</Link>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-ink-100 p-5 bg-white">
      <span className="w-9 h-9 rounded-lg bg-brand-500/10 text-brand-700 flex items-center justify-center"><Icon size={16} /></span>
      <h3 className="mt-3 font-bold text-ink-950 tracking-tight">{title}</h3>
      <p className="mt-1 text-[13.5px] text-ink-600 leading-relaxed">{body}</p>
    </div>
  );
}
