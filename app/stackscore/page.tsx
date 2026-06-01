'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';

type Mode = 'url' | 'screenshot';

export default function StackScoreLanding() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>('url');
  const [url, setUrl] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileData, setFileData] = useState<{ base64: string; mediaType: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPickFile(file: File) {
    setError(null);
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
      setError('Image must be PNG, JPEG, WEBP, or GIF');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB');
      return;
    }
    setFileName(file.name);
    setFilePreview(URL.createObjectURL(file));
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    setFileData({ base64: btoa(binary), mediaType: file.type });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body = mode === 'url'
        ? { url }
        : fileData
          ? { screenshot: fileData.base64, mediaType: fileData.mediaType }
          : null;
      if (!body) throw new Error('Choose a screenshot first');

      const res = await fetch('/api/stackscore/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
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

      {/* Header */}
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
            Score any pricing page in <span className="text-brand-500">~10 seconds.</span>
          </h1>
          <p className="lead mt-5 max-w-2xl">
            Paste a URL or drop a screenshot. We grade it across Clarity, Conversion, Flexibility, and Trust — compare it to ten leading SaaS pricing pages, and tell you exactly what to fix.
          </p>
        </section>

        <section className="mt-10 card p-6 md:p-8 max-w-3xl">

          {/* Mode toggle */}
          <div className="inline-flex p-1 bg-ink-50 rounded-lg border border-ink-100">
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`px-4 py-2 text-[.86rem] font-semibold rounded-md transition ${
                mode === 'url' ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-500 hover:text-ink-800'
              }`}
            >
              Paste a URL
            </button>
            <button
              type="button"
              onClick={() => setMode('screenshot')}
              className={`px-4 py-2 text-[.86rem] font-semibold rounded-md transition ${
                mode === 'screenshot' ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-500 hover:text-ink-800'
              }`}
            >
              Drop a screenshot
            </button>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === 'url' ? (
              <div>
                <label className="block text-[12px] font-bold text-ink-700 mb-1.5">Pricing page URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://stripe.com/pricing"
                    className="flex-1 px-3.5 py-3 rounded-lg border border-ink-200 focus:border-ink-400 focus:outline-none text-[.95rem] mono"
                  />
                  <button
                    type="submit"
                    disabled={loading || !url}
                    className="inline-flex items-center gap-1.5 text-[.95rem] font-semibold text-white bg-ink-950 hover:bg-ink-800 disabled:bg-ink-400 rounded-lg px-5 py-3 transition"
                  >
                    {loading ? 'Analyzing…' : 'Score it'}
                  </button>
                </div>
                <p className="mt-2 text-[12px] text-ink-500">We fetch the rendered HTML server-side. Works on any public pricing page that doesn't require JS to render.</p>
              </div>
            ) : (
              <div>
                <label className="block text-[12px] font-bold text-ink-700 mb-1.5">Screenshot of a pricing / checkout page</label>
                {filePreview ? (
                  <div className="rounded-xl border border-ink-200 bg-ink-50 p-3 flex items-start gap-4">
                    <img src={filePreview} alt={fileName ?? ''} className="w-28 h-28 object-cover rounded-md border border-ink-200" />
                    <div className="flex-1">
                      <div className="font-bold text-ink-950 text-[.92rem]">{fileName}</div>
                      <div className="text-[12px] text-ink-500 mt-0.5">Analyzed by Claude vision · scored by the same engine</div>
                      <div className="mt-3 flex gap-2">
                        <button type="button" onClick={() => fileRef.current?.click()} className="text-[12px] font-bold text-ink-700 hover:text-ink-950 underline-offset-4 hover:underline">Replace</button>
                        <button type="button" onClick={() => { setFileName(null); setFilePreview(null); setFileData(null); }} className="text-[12px] font-bold text-coral-600 hover:underline">Remove</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-ink-200 hover:border-brand-500 rounded-xl py-10 text-center transition"
                  >
                    <div className="text-[.95rem] font-bold text-ink-950">Click to choose an image</div>
                    <div className="text-[12px] text-ink-500 mt-1">PNG, JPEG, WEBP up to 5 MB</div>
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickFile(f); }}
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || !fileData}
                    className="inline-flex items-center gap-1.5 text-[.95rem] font-semibold text-white bg-ink-950 hover:bg-ink-800 disabled:bg-ink-400 rounded-lg px-5 py-3 transition"
                  >
                    {loading ? 'Analyzing…' : 'Score it'}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="text-[.86rem] text-coral-600 bg-coral-400/10 border border-coral-400/30 rounded-md px-3 py-2">{error}</div>
            )}
          </form>
        </section>

        {/* Try these */}
        <section className="mt-10 max-w-3xl">
          <div className="text-[12px] uppercase tracking-[.14em] font-bold text-ink-400">Try one</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {['stripe.com/pricing', 'linear.app/pricing', 'notion.so/pricing', 'vercel.com/pricing'].map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => { setMode('url'); setUrl('https://' + u); }}
                className="text-[12.5px] mono px-3 py-1.5 rounded-lg border border-ink-200 hover:border-ink-400 hover:bg-ink-50 transition"
              >
                {u}
              </button>
            ))}
          </div>
        </section>

        {/* How it scores */}
        <section className="mt-16 max-w-4xl">
          <div className="text-[12px] uppercase tracking-[.14em] font-bold text-brand-700">How it scores</div>
          <h2 className="h2 balance mt-3">Four dimensions. Twenty rules.</h2>
          <p className="lead mt-3">Heuristic, deterministic, open-source. Claude adds three contextual suggestions per analysis on top of the rule-based ones.</p>

          <div className="mt-8 grid md:grid-cols-2 gap-4">
            {[
              { label: 'Clarity',     body: 'Are the prices visible? Currencies shown? Tiers distinct? FAQ present? International ready?' },
              { label: 'Conversion',  body: 'Is one tier highlighted? Free trial or freemium? Monthly/annual toggle? Discount made obvious?' },
              { label: 'Flexibility', body: 'Three or more tiers? Free entry? Enterprise/contact path? One CTA per tier? Cancel-anytime?' },
              { label: 'Trust',       body: 'Payment methods shown? Security badges? Testimonials or logos? Guarantee in writing? Action-first CTA?' },
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
              ['Overall score with dimension breakdown', 'A 0–100 number and four sub-scores. No "B+" letter grades.'],
              ['Benchmark comparison', 'Where you sit among Stripe, Notion, Figma, Linear, Vercel, Shopify, Slack, Spotify, Netflix, ChatGPT.'],
              ['Signal-by-signal results', 'Every check, pass or fail, with the heuristic that fired.'],
              ['Actionable suggestions', 'Rule-based fixes for what you missed, plus 1–3 contextual suggestions from Claude.'],
              ['Shareable URL', 'Send the report to a teammate or a buyer — no login required.'],
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
