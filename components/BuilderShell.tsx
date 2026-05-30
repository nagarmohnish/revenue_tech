'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Boxes,
  CreditCard,
  Gauge,
  KeyRound,
  LayoutDashboard,
  LogOut,
  PlugZap,
  Sliders,
  TerminalSquare,
} from 'lucide-react';

const nav = [
  { href: '/build',             label: 'Overview',    icon: LayoutDashboard },
  { href: '/build/agents',      label: 'Agents',      icon: Boxes },
  { href: '/build/plans',       label: 'Plans',       icon: Sliders },
  { href: '/build/api-keys',    label: 'API keys',    icon: KeyRound },
  { href: '/build/integration', label: 'Integration', icon: TerminalSquare },
  { href: '/build/stripe',      label: 'Payments',    icon: CreditCard },
  { href: '/build/revenue',     label: 'Revenue',     icon: Gauge },
];

export function BuilderShell({
  children,
  accountName,
  accountSlug,
}: {
  children: React.ReactNode;
  accountName?: string;
  accountSlug?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch('/api/build/sign-out', { method: 'POST' });
    router.push('/build/signup');
  }

  return (
    <div className="min-h-screen bg-white flex">
      <aside className="hidden md:flex flex-col w-64 border-r border-ink-100 bg-ink-50/40 px-4 py-5">
        <Link href="/build" className="flex items-center gap-2.5 font-extrabold text-ink-950 px-2 mb-7">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden>
            <rect x="2" y="2" width="24" height="24" rx="7" fill="#10a868" />
            <circle cx="14" cy="14" r="6" stroke="#fff" strokeWidth="1.9" fill="none" />
            <path d="M14 10.2v7.6M11.6 12.6h4.8M11.6 15.4h4.8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span>Agent<span className="text-brand-500">Mint</span></span>
        </Link>

        {accountName && (
          <div className="mb-5 px-3 py-2.5 rounded-lg bg-white border border-ink-100">
            <div className="text-[10px] uppercase tracking-[0.14em] text-ink-400 font-semibold">Account</div>
            <div className="mt-0.5 font-semibold text-ink-950 truncate">{accountName}</div>
            {accountSlug && <div className="text-[11px] font-mono text-ink-500">{accountSlug}</div>}
          </div>
        )}

        <nav className="space-y-0.5">
          {nav.map((n) => {
            const active = pathname === n.href || (n.href !== '/build' && pathname?.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] ${
                  active ? 'bg-ink-950 text-white' : 'text-ink-700 hover:bg-ink-100/60'
                }`}
              >
                <n.icon size={15} />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-ink-100 space-y-0.5">
          <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-ink-500 hover:bg-ink-100/60">
            <PlugZap size={14} /> Customer demo
          </Link>
          <button onClick={signOut} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-ink-500 hover:bg-ink-100/60">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 px-6 md:px-10 py-8 max-w-5xl w-full mx-auto">{children}</main>
    </div>
  );
}
