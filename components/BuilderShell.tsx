'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Boxes, CreditCard, Gauge, KeyRound, LayoutDashboard, LogOut, PlugZap,
  Sliders, TerminalSquare, Menu, X, ChevronDown, ExternalLink, BookOpen,
  HelpCircle,
} from 'lucide-react';

const NAV = [
  { href: '/build',             label: 'Overview',    icon: LayoutDashboard },
  { href: '/build/agents',      label: 'Agents',      icon: Boxes },
  { href: '/build/plans',       label: 'Plans',       icon: Sliders },
  { href: '/build/api-keys',    label: 'API keys',    icon: KeyRound },
  { href: '/build/integration', label: 'Integration', icon: TerminalSquare },
  { href: '/build/stripe',      label: 'Payments',    icon: CreditCard },
  { href: '/build/revenue',     label: 'Revenue',     icon: Gauge },
];

interface BuilderShellProps {
  children: ReactNode;
  accountName?: string;
  accountSlug?: string;
}

export function BuilderShell({ children, accountName, accountSlug }: BuilderShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  async function signOut() {
    await fetch('/api/build/sign-out', { method: 'POST' });
    router.push('/build/signup');
  }

  return (
    <div className="min-h-screen bg-ink-950 text-ink-50">

      <header className="sticky top-0 z-30 bg-ink-950/85 backdrop-blur border-b border-saf-500/12">
        <div className="px-5 md:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden w-9 h-9 inline-flex items-center justify-center text-ink-50/70 hover:bg-saf-500/8 hover:text-saf-500"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
            <Link href="/build" className="flex items-center gap-2.5 font-bold text-ink-50">
              <span className="w-3 h-3 bg-saf-500 shadow-[0_0_14px_#FF7A1A]" />
              <span className="text-[15px] tracking-tight">AgentMint</span>
            </Link>
            <span className="hidden md:inline font-mono text-[10px] uppercase tracking-[.14em] px-2 py-0.5 border border-saf-500/30 text-saf-500">Builder console</span>
          </div>

          <div className="flex items-center gap-1">
            <Link href="/dashboard" className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[11.5px] text-ink-50/55 hover:text-saf-500 px-3 py-1.5">
              <PlugZap size={12} /> Customer demo
            </Link>
            <Link href="/build/integration" className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[11.5px] text-ink-50/55 hover:text-saf-500 px-3 py-1.5">
              <BookOpen size={12} /> Docs
            </Link>

            <div className="relative">
              <button
                onClick={() => setUserMenu((m) => !m)}
                className="inline-flex items-center gap-2 px-2 py-1.5 hover:bg-saf-500/8 transition"
              >
                <span className="w-7 h-7 bg-saf-500 text-ink-950 font-bold text-[12px] flex items-center justify-center font-mono">
                  {(accountName || 'A').slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden sm:inline text-[13px] font-mono text-ink-50 max-w-[160px] truncate">{accountName || 'Account'}</span>
                <ChevronDown size={12} className="text-ink-50/50" />
              </button>
              {userMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenu(false)} />
                  <div className="absolute right-0 mt-1.5 w-64 bg-ink-800 border border-saf-500/24 shadow-[0_0_50px_rgba(255,122,26,0.08)] z-20 p-1.5">
                    <div className="px-3 py-2 border-b border-saf-500/14 mb-1">
                      <div className="font-mono text-[10px] uppercase tracking-[.14em] text-ink-50/45">Account</div>
                      <div className="text-[13px] font-mono text-ink-50 truncate">{accountName ?? '—'}</div>
                      {accountSlug && <div className="text-[11px] font-mono text-saf-500 truncate">{accountSlug}</div>}
                    </div>
                    <a href="https://github.com/nagarmohnish/revenue_tech" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 text-[13px] font-mono text-ink-50/70 hover:bg-saf-500/8 hover:text-saf-500">
                      <HelpCircle size={12} /> Help & docs
                    </a>
                    <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-mono text-saf-500 hover:bg-saf-500/8">
                      <LogOut size={12} /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className={`${open ? 'flex' : 'hidden'} md:flex flex-col w-60 border-r border-saf-500/12 bg-ink-950 px-3 py-4 fixed md:sticky top-14 h-[calc(100vh-3.5rem)] z-20`}>
          <nav className="space-y-0.5 flex-1 overflow-auto">
            {NAV.map((n) => {
              const active = pathname === n.href || (n.href !== '/build' && pathname?.startsWith(n.href));
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 text-[13px] font-mono transition ${
                    active ? 'bg-saf-500/12 text-saf-500 border-l-2 border-saf-500' : 'text-ink-50/55 hover:bg-saf-500/6 hover:text-ink-50'
                  }`}
                >
                  <n.icon size={14} className={active ? '' : ''} />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-saf-500/12">
            <Link href="/" className="flex items-center gap-2 px-3 py-2 text-[11px] font-mono text-ink-50/45 hover:text-saf-500">
              <ExternalLink size={11} /> Back to AgentMint
            </Link>
          </div>
        </aside>

        <main className="flex-1 min-w-0 px-5 md:px-8 lg:px-10 py-8 md:py-10 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
