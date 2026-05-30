'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export default function BuilderSignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function autoSlug(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9-\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch('/api/build/sign-up', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, name, accountName, slug: slug || autoSlug(accountName) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Signup failed');
      router.push('/build');
    } catch (e: any) {
      setErr(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-6 h-16 flex items-center border-b border-ink-100">
        <Link href="/" className="flex items-center gap-2.5 font-extrabold text-ink-950">
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <rect x="2" y="2" width="24" height="24" rx="7" fill="#10a868" />
            <circle cx="14" cy="14" r="6" stroke="#fff" strokeWidth="1.9" fill="none" />
            <path d="M14 10.2v7.6M11.6 12.6h4.8M11.6 15.4h4.8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span className="text-[1.05rem]">Agent<span className="text-brand-500">Mint</span></span>
        </Link>
      </header>

      <main className="flex-1 grid lg:grid-cols-2">
        <section className="px-8 md:px-14 py-16 flex flex-col justify-center max-w-xl mx-auto w-full">
          <div className="text-[.72rem] uppercase tracking-[.14em] text-brand-600 font-bold">Start building</div>
          <h1 className="font-sans font-extrabold text-[2.4rem] md:text-[2.8rem] leading-[1.05] tracking-tight mt-3 text-ink-950">
            One wallet for your <span className="text-brand-500">whole agent suite.</span>
          </h1>
          <p className="mt-4 text-ink-600 text-[16px] leading-relaxed">
            Solo dev, startup or small studio — spin up your account in 30 seconds, register an agent in 2 minutes, drop in two HTTP calls, and start billing. Your customers buy credits once and spend them across every agent you ship. USD via Stripe Connect today; INR via Razorpay/UPI is next.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-ink-700 mb-1.5">Your email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourdomain.com" className="field" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-ink-700 mb-1.5">Your name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Mohnish" className="field" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-ink-700 mb-1.5">Account name</label>
                <input
                  required
                  value={accountName}
                  onChange={(e) => {
                    setAccountName(e.target.value);
                    if (!slug || slug === autoSlug(accountName)) setSlug(autoSlug(e.target.value));
                  }}
                  placeholder="Acme Studio · Stately AI · Mohnish Labs"
                  className="field"
                />
                <p className="mt-1 text-[11.5px] text-ink-500">Your company, your product, or just you. Whatever fits.</p>
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-ink-700 mb-1.5">Handle</label>
              <div className="flex items-stretch">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-ink-200 bg-ink-50 text-ink-500 text-sm font-mono">agentmint.com/</span>
                <input
                  required
                  value={slug}
                  onChange={(e) => setSlug(autoSlug(e.target.value))}
                  placeholder="acme-studio"
                  className="field !rounded-l-none flex-1 font-mono text-sm"
                />
              </div>
              <p className="mt-1.5 text-[12px] text-ink-500">Lowercase, hyphens, 3-40 chars. Shows up in your customer-facing URLs.</p>
            </div>

            {err && <div className="text-sm text-bad bg-red-50 border border-red-100 rounded-md px-3 py-2">{err}</div>}

            <button disabled={loading || !email || !accountName || !slug} className="btn btn-green w-full justify-center mt-2">
              {loading ? 'Creating your account…' : <>Create my account <ArrowRight size={15} /></>}
            </button>
          </form>

          <p className="mt-6 text-[13px] text-ink-500">
            Already have an account? <Link href="/build/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </section>

        <aside className="hidden lg:block bg-ink-50 border-l border-ink-100 px-14 py-16">
          <div className="sticky top-16">
            <div className="text-[.72rem] uppercase tracking-[.14em] text-ink-400 font-semibold">What you get in 30 seconds</div>
            <ul className="mt-6 space-y-4 text-[15px] text-ink-700">
              {[
                ['One credit wallet across every agent you ship.', 'Customers buy credits once, spend them anywhere in your suite. Per-agent attribution underneath.'],
                ['Two HTTP calls per agent. No SDK package needed.', 'authorize() + debit() over plain HTTPS. ~30 minutes to instrument.'],
                ['A registry where you add agents in seconds.', 'Actions, credit costs, plan availability - update without a deploy.'],
                ['First cohort is free.', 'Pilot builders pay $0 while we harden the contract together.'],
              ].map(([t, sub]) => (
                <li key={t} className="flex gap-3 items-start">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                  <div>
                    <div className="font-semibold text-ink-900">{t}</div>
                    <div className="text-[13.5px] text-ink-500 mt-0.5">{sub}</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-10 pt-6 border-t border-ink-200 text-[12.5px] text-ink-500 leading-relaxed">
              <div className="text-[.65rem] uppercase tracking-[.14em] text-brand-600 font-bold mb-1.5">Top priorities shipping next</div>
              1. Stripe Connect for USD payouts to your bank.<br />
              2. <strong className="text-ink-900">INR settlement via Razorpay/Cashfree, UPI autopay, GST invoicing.</strong><br />
              3. Branded customer UX at <span className="font-mono">[handle].agentmint.com</span>.
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
