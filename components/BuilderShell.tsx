'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Boxes, CreditCard, Gauge, KeyRound, LayoutDashboard, LogOut, PlugZap,
  Sliders, TerminalSquare, Menu, X, ChevronDown, ExternalLink, BookOpen,
  HelpCircle, Wallet,
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
    <div className="min-h-screen bg-white">

      {/* Top bar — visible on every page */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-ink-100">
        <div className="px-5 md:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden w-9 h-9 inline-flex items-center justify-center rounded-md text-ink-600 hover:bg-ink-50"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
            <Link href="/build" className="flex items-center gap-2.5 font-extrabold text-ink-950">
              <span className="relative w-7 h-7 rounded-lg bg-ink-950 flex items-center justify-center">
                <Wallet size={14} className="text-brand-400" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-white" />
              </span>
              <span className="text-[1.02rem] tracking-tight">Agent<span className="text-brand-500">Mint</span></span>
            </Link>
            <Badge>Builder console</Badge>
          </div>

          <div className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-600 hover:text-ink-950 px-3 py-1.5 rounded-md hover:bg-ink-50"
              title="See what your customers see"
            >
              <PlugZap size={13} /> Customer demo
            </Link>
            <Link
              href="/build/integration"
              className="hidden sm:inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-600 hover:text-ink-950 px-3 py-1.5 rounded-md hover:bg-ink-50"
            >
              <BookOpen size={13} /> Docs
            </Link>

            {/* Account dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenu((m) => !m)}
                className="inline-flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-ink-50 transition"
              >
                <span className="w-7 h-7 rounded-full bg-ink-950 text-brand-400 font-extrabold text-[12px] flex items-center justify-center">
                  {(accountName || 'A').slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden sm:inline text-[13px] font-bold text-ink-950 max-w-[160px] truncate">{accountName || 'Account'}</span>
                <ChevronDown size={12} className="text-ink-500" />
              </button>
              {userMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenu(false)} />
                  <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-white border border-ink-100 shadow-lg z-20 p-1.5">
                    <div className="px-3 py-2 border-b border-ink-100 mb-1">
                      <div className="text-[10.5px] uppercase tracking-[.14em] text-ink-400 font-bold">Account</div>
                      <div className="text-[13px] font-bold text-ink-950 truncate">{accountName ?? '—'}</div>
                      {accountSlug && <div className="text-[11px] mono text-ink-500 truncate">{accountSlug}</div>}
                    </div>
                    <MenuItem icon={HelpCircle} href="https://github.com/nagarmohnish/revenue_tech" external>Help &amp; docs</MenuItem>
                    <button
                      onClick={signOut}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-[13px] text-coral-600 hover:bg-coral-400/10"
                    >
                      <LogOut size={13} /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${open ? 'flex' : 'hidden'} md:flex flex-col w-60 border-r border-ink-100 bg-white px-3 py-4 fixed md:sticky top-14 h-[calc(100vh-3.5rem)] z-20`}>
          <nav className="space-y-0.5 flex-1 overflow-auto">
            {NAV.map((n) => {
              const active = pathname === n.href || (n.href !== '/build' && pathname?.startsWith(n.href));
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium transition ${
                    active ? 'bg-ink-950 text-white' : 'text-ink-700 hover:bg-ink-50'
                  }`}
                >
                  <n.icon size={15} className={active ? 'text-brand-400' : ''} />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-ink-100">
            <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-ink-500 hover:text-ink-950 hover:bg-ink-50">
              <ExternalLink size={12} /> Back to AgentMint
            </Link>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 px-5 md:px-8 lg:px-10 py-7 md:py-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 text-[10px] font-bold uppercase tracking-[.06em]">{children}</span>
  );
}

function MenuItem({ icon: Icon, href, external, children }: { icon: any; href?: string; external?: boolean; children: ReactNode }) {
  const cls = 'flex items-center gap-2 px-3 py-2 rounded-md text-[13px] text-ink-700 hover:bg-ink-50 hover:text-ink-950';
  if (external && href) {
    return <a href={href} target="_blank" rel="noreferrer" className={cls}><Icon size={13} /> {children}</a>;
  }
  if (href) return <Link href={href} className={cls}><Icon size={13} /> {children}</Link>;
  return <div className={cls}><Icon size={13} /> {children}</div>;
}
