'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Mail, Check } from 'lucide-react';
import { AuthShell } from '@/components/AuthShell';
import { Button, Field, Input, InfoBanner } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Sign-in failed');
      router.push('/dashboard');
    } catch (e: any) {
      setErr(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={<>Sign in to <span className="text-brand-500">AgentMint</span></>}
      description="New here? We'll create your workspace and drop 100 trial credits in your wallet."
      rightPanel={<RightPanel />}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" required>
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
        </Field>
        <Field label="Name (optional)">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mohnish" />
        </Field>
        {err && <InfoBanner tone="error">{err}</InfoBanner>}
        <Button type="submit" loading={loading} fullWidth iconLeft={<Mail size={14} />} iconRight={<ArrowRight size={14} />}>
          {loading ? 'Signing in…' : 'Continue with email'}
        </Button>
      </form>

      <p className="mt-6 text-[12px] text-ink-400 leading-relaxed">
        MVP uses a signed-cookie session. Google OAuth via Better Auth is wired in <code className="mono">lib/auth.ts</code> and ready to swap once <code className="mono">GOOGLE_CLIENT_ID</code> is set.
      </p>

      <div className="mt-7 pt-5 border-t border-ink-100">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-ink-500 hover:text-ink-900">
          <ArrowLeft size={12} /> Back to home
        </Link>
      </div>
    </AuthShell>
  );
}

function RightPanel() {
  const items = [
    ['One wallet across every agent', '100 trial credits when you sign up.'],
    ['No card required', 'Top up when you find value. Cancel anytime.'],
    ['Real agents, not demos', 'Scanner / Writer / Studio all available.'],
  ];
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[.14em] font-bold text-brand-700">What you'll see</div>
      <h2 className="mt-3 font-extrabold text-[1.6rem] tracking-tight text-ink-950 leading-tight">A real wallet with real agents.</h2>
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
    </div>
  );
}
