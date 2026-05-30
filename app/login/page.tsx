'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { ArrowRight, Mail } from 'lucide-react';

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
    <div className="min-h-screen bg-ink-50 flex flex-col">
      <header className="px-6 h-14 flex items-center border-b border-ink-100 bg-white">
        <Logo />
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md card p-7">
          <h1 className="text-xl font-semibold text-ink-900 tracking-tight">Sign in to AgentMint</h1>
          <p className="mt-1.5 text-sm text-ink-500">
            New here? We'll create your workspace and drop 100 trial credits in your wallet.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3">
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1">Name <span className="text-ink-400">(optional)</span></label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mohnish"
                className="field"
              />
            </div>
            {err && <div className="text-sm text-bad bg-red-50 border border-red-100 rounded-md px-3 py-2">{err}</div>}
            <button disabled={loading} className="btn-primary w-full justify-center">
              {loading ? 'Signing in…' : (<><Mail size={16} /> Continue with email <ArrowRight size={14} /></>)}
            </button>
          </form>

          <div className="mt-6 text-xs text-ink-400 leading-relaxed">
            By signing in you agree to our terms. This MVP uses a magic-cookie session - Google OAuth via Better Auth
            is wired in <span className="font-mono">lib/auth.ts</span> and ready to swap in once
            <span className="font-mono"> GOOGLE_CLIENT_ID</span> is set.
          </div>

          <div className="mt-6 pt-5 border-t border-ink-100 text-sm">
            <Link href="/" className="text-ink-500 hover:text-ink-900">← Back to home</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
