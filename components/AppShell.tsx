'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Wallet, Sparkles, Receipt, LogOut, Menu, X,
  ChevronDown, ExternalLink, Shield, Search, Wand2, Boxes,
} from 'lucide-react';

const PRIMARY_NAV = [
  { href: '/dashboard',            label: 'Dashboard', icon: LayoutDashboard },
  { href: '/agents/scanner',       label: 'Scanner',   icon: Search,  match: '/agents/scanner' },
  { href: '/agents/blog-writer',   label: 'Writer',    icon: Wand2,   match: '/agents/blog-writer' },
  { href: '/agents/content-studio', label: 'Studio',   icon: Sparkles, match: '/agents/content-studio' },
  { href: '/agents/locked',        label: 'More',      icon: Boxes,   match: '/agents/locked' },
  { href: '/billing',              label: 'Billing',   icon: Receipt, match: '/billing' },
];

interface AppShellProps {
  children: ReactNode;
  workspaceName?: string;
  email?: string;
  balance?: number;
  admin?: boolean;
}

export function AppShell({ children, workspaceName, email, balance, admin }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  async function signOut() {
    await fetch('/api/auth/sign-out', { method: 'POST' });
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-white">
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
            <Link href="/dashboard" className="flex items-center gap-2.5 font-extrabold text-ink-950">
              <span className="relative w-7 h-7 rounded-lg bg-ink-950 flex items-center justify-center">
                <Wallet size={14} className="text-brand-400" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-white" />
              </span>
              <span className="text-[1.02rem] tracking-tight">Agent<span className="text-brand-500">Mint</span></span>
            </Link>
          </div>

          <div className="flex items-center gap-1.5">
            {typeof balance === 'number' && (
              <Link
                href="/billing/topup"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 transition text-[12.5px] font-bold"
              >
                <Wallet size={13} />
                {balance.toLocaleString()} cr
                <span className="text-brand-600/70">·</span>
                <span className="text-[11px]">Top up</span>
              </Link>
            )}

            <div className="relative">
              <button
                onClick={() => setMenu((m) => !m)}
                className="inline-flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-ink-50 transition"
              >
                <span className="w-7 h-7 rounded-full bg-ink-950 text-brand-400 font-extrabold text-[12px] flex items-center justify-center">
                  {(workspaceName || email || 'U').slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden sm:inline text-[13px] font-bold text-ink-950 max-w-[160px] truncate">{workspaceName || 'Workspace'}</span>
                <ChevronDown size={12} className="text-ink-500" />
              </button>
              {menu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                  <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-white border border-ink-100 shadow-lg z-20 p-1.5">
                    <div className="px-3 py-2 border-b border-ink-100 mb-1">
                      <div className="text-[10.5px] uppercase tracking-[.14em] text-ink-400 font-bold">Workspace</div>
                      <div className="text-[13px] font-bold text-ink-950 truncate">{workspaceName ?? '—'}</div>
                      {email && <div className="text-[11px] text-ink-500 truncate">{email}</div>}
                    </div>
                    <Link href="/billing" className="flex items-center gap-2 px-3 py-2 rounded-md text-[13px] text-ink-700 hover:bg-ink-50 hover:text-ink-950">
                      <Receipt size={13} /> Billing portal
                    </Link>
                    {admin && (
                      <Link href="/admin" className="flex items-center gap-2 px-3 py-2 rounded-md text-[13px] text-ink-700 hover:bg-ink-50 hover:text-ink-950">
                        <Shield size={13} /> Admin
                      </Link>
                    )}
                    <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-md text-[13px] text-ink-700 hover:bg-ink-50 hover:text-ink-950">
                      <ExternalLink size={13} /> Marketing site
                    </Link>
                    <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-[13px] text-coral-600 hover:bg-coral-400/10">
                      <LogOut size={13} /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <nav className="hidden md:flex px-5 md:px-6 border-t border-ink-100 gap-1 overflow-x-auto">
          {PRIMARY_NAV.map((n) => {
            const active = pathname === n.href || (n.match && pathname?.startsWith(n.match));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`relative inline-flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium transition whitespace-nowrap ${
                  active ? 'text-ink-950' : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                <n.icon size={13} className={active ? 'text-brand-600' : ''} />
                {n.label}
                {active && <span className="absolute left-3 right-3 -bottom-px h-0.5 rounded-full bg-ink-950" />}
              </Link>
            );
          })}
        </nav>

        {open && (
          <nav className="md:hidden border-t border-ink-100 p-2 bg-white">
            {PRIMARY_NAV.map((n) => {
              const active = pathname === n.href || (n.match && pathname?.startsWith(n.match));
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] font-medium ${
                    active ? 'bg-ink-950 text-white' : 'text-ink-700 hover:bg-ink-50'
                  }`}
                >
                  <n.icon size={15} className={active ? 'text-brand-400' : ''} />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      <main className="px-5 md:px-8 lg:px-10 py-7 md:py-9 max-w-6xl w-full mx-auto">{children}</main>
    </div>
  );
}
