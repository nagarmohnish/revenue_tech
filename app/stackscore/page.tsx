'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const LOADER_MESSAGES = [
  'Spinning up a real browser…',
  'Visiting your landing page…',
  'Finding the buy CTA…',
  'Stepping forward through the funnel…',
  'Capturing screenshots…',
  'Looking for friction points…',
  'Comparing to leader funnels…',
  'Writing your suggestions…',
];

export default function StackScoreLanding() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [maxSteps, setMaxSteps] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaderIdx, setLoaderIdx] = useState(0);

  useEffect(() => {
    if (!loading) return;
    setLoaderIdx(0);
    const id = window.setInterval(() => setLoaderIdx((i) => (i + 1) % LOADER_MESSAGES.length), 4000);
    return () => window.clearInterval(id);
  }, [loading]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/stackscore/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url, maxSteps }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Analysis failed');
      router.push(`/stackscore/r/${data.id}`);
    } catch (err: any) {
      setError(err?.message || 'Analysis failed');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-ink-950 antialiased">

      <header className="border-b border-ink-100 bg-white/95 backdrop-blur sticky top-0 z-20">
        <div className="wrap h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold text-ink-950">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="24" height="24" rx="7" fill="#10a868"/>
              <circle cx="14" cy="14" r="6" stroke="#fff" strokeWidth="1.9" fill="none"/>
              <path d="M14 10.2v7.6M11.6 12.6h4.8M11.6 15.4h4.8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <span>Agent<span className="text-brand-500">Mint</span></span>
          </Link>
          <div className="flex items-center gap-4 text-[.88rem] text-ink-600">
            <Link href="/" className="hover:text-ink-950">Back to AgentMint</Link>
            <Link href="/build/signup" className="inline-flex items-center gap-1.5 text-[.86rem] font-semibold text-white bg-ink-950 hover:bg-ink-800 rounded-lg px-3.5 py-2 transition">
              Start building
            </Link>
          </div>
        </div>
      </header>

      <main className="wrap py-16 md:py-20">

        <section className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[.14em] font-bold text-brand-700">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            Free tool · by AgentMint
          </div>
          <h1 className="h1 balance mt-4">
            Test your <span className="text-brand-500">whole payment flow.</span>
          </h1>
          <p className="lead mt-5 max-w-2xl">
            We walk a real browser through your funnel — landing → CTA → pricing → checkout — capture every step, and tell you exactly where your visitors drop off. No code on your side.
          </p>
        </section>

        <section className="mt-10 card p-6 md:p-8 max-w-3xl">
          {!loading ? (
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="block text-[12px] font-bold text-ink-700 mb-1.5">Start URL (landing page, homepage, or any entry point)</label>
                <input
                  type="text"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-product.com"
                  className="w-full px-3.5 py-3 rounded-lg border border-ink-200 focus:border-ink-400 focus:outline-none text-[.95rem] mono"
                />
                <p className="mt-2 text-[12px] text-ink-500">A real headless browser opens this URL and clicks the most purchase-intent CTA on each page.</p>
              </div>

              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[12px] font-bold text-ink-700 mb-1.5">Max steps to walk</label>
                  <select
                    value={maxSteps}
                    onChange={(e) => setMaxSteps(parseInt(e.target.value, 10))}
                    className="px-3.5 py-2.5 rounded-lg border border-ink-200 text-[.95rem]"
                  >
                    <option value={4}>4 steps</option>
                    <option value={5}>5 steps</option>
                    <option value={6}>6 steps (recommended)</option>
                    <option value={7}>7 steps</option>
                    <option value={8}>8 steps</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={!url}
                  className="inline-flex items-center gap-1.5 text-[.95rem] font-semibold text-white bg-ink-950 hover:bg-ink-800 disabled:bg-ink-400 rounded-lg px-5 py-3 transition"
                >
                  Walk the funnel
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>
              </div>

              {error && (
                <div className="text-[.86rem] text-coral-600 bg-coral-400/10 border border-coral-400/30 rounded-md px-3 py-2">{error}</div>
              )}
            </form>
          ) : (
            <div className="py-6">
              <div className="flex items-center gap-3">
                <Spinner />
                <div>
                  <div className="font-extrabold text-ink-950 text-[1.05rem] tracking-tight">{LOADER_MESSAGES[loaderIdx]}</div>
                  <div className="text-[12px] text-ink-500 mt-0.5">Cold-start of the worker can add a few seconds. Total walk usually takes 30-60s.</div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`h-1 rounded-full ${loaderIdx > i * 2 ? 'bg-brand-500' : 'bg-ink-100'}`} />
                ))}
              </div>
            </div>
          )}
        </section>

        {!loading && (
          <>
            <section className="mt-8 max-w-3xl">
              <div className="text-[12px] uppercase tracking-[.14em] font-bold text-ink-400">Try one</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {['linear.app', 'notion.so', 'vercel.com', 'spotify.com'].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUrl('https://' + u)}
                    className="text-[12.5px] mono px-3 py-1.5 rounded-lg border border-ink-200 hover:border-ink-400 hover:bg-ink-50 transition"
                  >
                    {u}
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-16 max-w-4xl">
              <div className="text-[12px] uppercase tracking-[.14em] font-bold text-brand-700">How it works</div>
              <h2 className="h2 balance mt-3">A headless browser. Step by step. No code on your side.</h2>

              <div className="mt-8 grid md:grid-cols-2 gap-4">
                {[
                  { n: '01', label: 'Visit', body: 'A real Chromium opens your URL with a 1280×800 viewport and an honest user-agent. We never log in.' },
                  { n: '02', label: 'Find', body: 'We rank every visible button and link by purchase intent — "Subscribe", "Get started", "Choose plan" — and pick the most prominent one.' },
                  { n: '03', label: 'Click', body: 'One click, one screenshot, one extracted set of signals (forms, prices, payment methods, security badges, iframes).' },
                  { n: '04', label: 'Stop', body: 'We stop at the first payment form, external payment provider, auth wall, success page, or after 6 steps. We never submit cards.' },
                ].map((s) => (
                  <div key={s.n} className="card p-5 flex gap-4">
                    <div className="mono text-[11px] text-brand-700 font-bold pt-0.5">{s.n}</div>
                    <div>
                      <h3 className="font-extrabold text-ink-950 tracking-tight">{s.label}</h3>
                      <p className="mt-1.5 text-[.88rem] text-ink-600 leading-relaxed">{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-16 max-w-4xl">
              <div className="text-[12px] uppercase tracking-[.14em] font-bold text-brand-700">Scored across four dimensions</div>
              <h2 className="h2 balance mt-3">Each worth 25 points.</h2>

              <div className="mt-8 grid md:grid-cols-2 gap-4">
                {[
                  { label: 'Brevity',         body: 'How many steps does a visitor walk? Three to four is the working range — every extra step costs conversion.' },
                  { label: 'Clarity',         body: 'On each step, is there ONE obvious next action? Or does the visitor have to choose between six?' },
                  { label: 'Cost transparency', body: 'Is the price shown before forms? Does it change between steps? Are recurring charges named, or surprises?' },
                  { label: 'Trust',           body: 'Payment methods named? Security signal at the form step? Cancel-anytime before the card? Trial before commitment?' },
                ].map((d) => (
                  <div key={d.label} className="card p-5">
                    <div className="text-[12px] uppercase tracking-[.12em] font-bold text-brand-700">{d.label}</div>
                    <div className="mt-2 font-extrabold text-ink-950 text-[1.6rem] tracking-tight tnum">/ 25</div>
                    <p className="mt-2 text-[.88rem] text-ink-600 leading-relaxed">{d.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-16 max-w-2xl">
              <div className="text-[12px] uppercase tracking-[.14em] font-bold text-ink-400">What you'll get</div>
              <ul className="mt-4 space-y-3 text-[.95rem] text-ink-700">
                {[
                  ['Step-by-step screenshots', 'Every page we landed on, in order, with the CTA we clicked next.'],
                  ['Per-step signals', 'CTA count, form fields, prices, payment methods, security badges, iframe detection.'],
                  ['Flow score (0-100)', 'Brevity + Clarity + Transparency + Trust, each scored independently.'],
                  ['Comparison to leader funnels', 'Where you sit against Netflix, Notion, Linear, Stripe, Spotify, Shopify, Vercel, ChatGPT.'],
                  ['Concrete suggestions', 'Per-step and per-flow fixes — rule-derived, plus 1-3 contextual ones from Claude.'],
                  ['Shareable URL', 'Send the report to a teammate. No login required.'],
                ].map(([t, sub]) => (
                  <li key={t} className="flex gap-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10a868" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <div>
                      <div className="font-bold text-ink-950">{t}</div>
                      <div className="text-[.85rem] text-ink-500 mt-0.5">{sub}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-16 max-w-2xl rounded-2xl bg-ink-50 border border-ink-100 p-6">
              <div className="text-[12px] uppercase tracking-[.14em] font-bold text-ink-500">A note on what we don't do</div>
              <p className="mt-2 text-[.88rem] text-ink-600 leading-relaxed">
                We never fill forms. We never enter card numbers. We never log in. The walk stops at any auth wall or payment form — and we tell you that's where it stopped. Use this on your own product, or on a public competitor — not on anything behind a paywall.
              </p>
            </section>
          </>
        )}

      </main>

      <footer className="border-t border-ink-100">
        <div className="wrap py-8 text-[12px] text-ink-500 flex items-center justify-between">
          <span>StackScore · free tool · by <Link href="/" className="font-bold text-ink-700 hover:text-ink-950">AgentMint</Link></span>
          <a href="https://github.com/nagarmohnish/revenue_tech" className="hover:text-ink-950">Source on GitHub →</a>
        </div>
      </footer>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-7 h-7 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
