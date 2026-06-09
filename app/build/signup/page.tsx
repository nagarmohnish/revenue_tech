'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { AuthShell } from '@/components/AuthShell';
import { Button, Field, Input, InputGroup, InfoBanner } from '@/components/ui';

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
    setErr(null); setLoading(true);
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
    <AuthShell
      title={<>One wallet for your <span className="text-brand-500">whole agent suite.</span></>}
      description="30 seconds to create your account. Two minutes to register an agent. Then drop in two HTTP calls and start billing. USD via Stripe Connect today; INR via Razorpay/UPI is next."
      rightPanel={<RightPanel />}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Your email" required>
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourdomain.com" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Your name" required>
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Mohnish" />
          </Field>
          <Field label="Account name" hint="Your company, your product, or just you." required>
            <Input
              required
              value={accountName}
              onChange={(e) => {
                setAccountName(e.target.value);
                if (!slug || slug === autoSlug(accountName)) setSlug(autoSlug(e.target.value));
              }}
              placeholder="Acme Studio · Stately AI"
            />
          </Field>
        </div>
        <Field label="Handle" hint="Lowercase, hyphens, 3-40 chars. Shows up in your customer URLs." required>
          <InputGroup prefix="agentmint.com/">
            <Input
              required
              value={slug}
              onChange={(e) => setSlug(autoSlug(e.target.value))}
              placeholder="acme-studio"
              className="font-mono"
            />
          </InputGroup>
        </Field>

        {err && <InfoBanner tone="error">{err}</InfoBanner>}

        <Button type="submit" disabled={!email || !accountName || !slug} loading={loading} fullWidth iconRight={<ArrowRight size={14} />}>
          {loading ? 'Creating your account…' : 'Create my account'}
        </Button>
      </form>

      <p className="mt-6 text-[13px] text-ink-500">
        Already have an account? <Link href="/build/login" className="text-brand-700 font-semibold hover:underline">Sign in</Link>
      </p>
      <div className="mt-6 pt-5 border-t border-ink-100">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-ink-500 hover:text-ink-900">
          <ArrowLeft size={12} /> Back to home
        </Link>
      </div>
    </AuthShell>
  );
}

function RightPanel() {
  const items = [
    ['One credit wallet across every agent', 'Customers buy credits once, spend them anywhere in your suite. Per-agent attribution underneath.'],
    ['Two HTTP calls per agent. No SDK package needed.', 'authorize() + debit() over plain HTTPS. ~30 minutes to instrument.'],
    ['A registry where you add agents in seconds', 'Actions, credit costs, plan availability — update without a deploy.'],
    ['First cohort is free', 'Pilot builders pay $0 while we harden the contract together.'],
  ];
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[.14em] font-bold text-brand-700">What you get in 30 seconds</div>
      <ul className="mt-7 space-y-5">
        {items.map(([t, sub]) => (
          <li key={t} className="flex gap-3 items-start">
            <span className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-700 flex items-center justify-center flex-shrink-0">
              <Check size={14} strokeWidth={2.6} />
            </span>
            <div>
              <div className="font-bold text-ink-950">{t}</div>
              <div className="text-[13px] text-ink-500 mt-0.5">{sub}</div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-10 pt-6 border-t border-ink-100">
        <div className="text-[11px] uppercase tracking-[.14em] font-bold text-brand-700 mb-2">Next on the build queue</div>
        <ol className="text-[13px] text-ink-700 leading-relaxed list-decimal pl-4 space-y-1">
          <li>Stripe Connect for USD payouts to your bank</li>
          <li><strong className="text-ink-950">INR via Razorpay/Cashfree · UPI autopay · GST invoicing</strong></li>
          <li>Branded customer UX at <code className="mono">[handle].agentmint.com</code></li>
        </ol>
      </div>
    </div>
  );
}
