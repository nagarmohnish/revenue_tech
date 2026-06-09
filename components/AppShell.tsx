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
  { href: '/agents/scanner',       label: 'Scanner',   icon: Search,   match: '/agents/scanner' },
  { href: '/agents/blog-writer',   label: 'Writer',    icon: Wand2,    match: '/agents/blog-writer' },
  { href: '/agents/content-studio', label: 'Studio',   icon: Sparkles, match: '/agents/content-studio' },
  { href: '/agents/locked',        label: 'More',      icon: Boxes,    match: '/agents/locked' },
  { href: '/billing',              label: 'Billing',   icon: Receipt,  match: '/billing' },
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
            <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-ink-50">
              <span className="w-3 h-3 bg-saf-500 shadow-[0_0_14px_#FF7A1A]" />
              <span className="text-[15px] tracking-tight">AgentMint</span>
            </Link>
          </div>

          <div className="flex items-center gap-1.5">
            {typeof balance === 'number' && (
              <Link
                href="/billing/topup"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 border border-saf-500/30 text-saf-500 hover:bg-saf-500/8 transition font-mono text-[12px]"
              >
                <Wallet size={12} />
                {balance.toLocaleString()} cr
                <span className="text-ink-50/40">·</span>
                <span>Top up</span>
              </Link>
            )}

            <div className="relative">
              <button
                onClick={() => setMenu((m) => !m)}
                className="inline-flex items-center gap-2 px-2 py-1.5 hover:bg-saf-500/8 transition"
              >
                <span className="w-7 h-7 bg-saf-500 text-ink-950 font-bold text-[12px] flex items-center justify-center font-mono">
                  {(workspaceName || email || 'U').slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden sm:inline text-[13px] font-mono text-ink-50 max-w-[160px] truncate">{workspaceName || 'Workspace'}</span>
                <ChevronDown size={12} className="text-ink-50/50" />
              </button>
              {menu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                  <div className="absolute right-0 mt-1.5 w-64 bg-ink-800 border border-saf-500/24 shadow-[0_0_50px_rgba(255,122,26,0.08)] z-20 p-1.5">
                    <div className="px-3 py-2 border-b border-saf-500/14 mb-1">
                      <div className="font-mono text-[10px] uppercase tracking-[.14em] text-ink-50/45">Workspace</div>
                      <div className="text-[13px] font-mono text-ink-50 truncate">{workspaceName ?? '—'}</div>
                      {email && <div className="text-[11px] text-ink-50/55 truncate">{email}</div>}
                    </div>
                    <Link href="/billing" className="flex items-center gap-2 px-3 py-2 text-[13px] font-mono text-ink-50/70 hover:bg-saf-500/8 hover:text-saf-500">
                      <Receipt size={12} /> Billing portal
                    </Link>
                    {admin && (
                      <Link href="/admin" className="flex items-center gap-2 px-3 py-2 text-[13px] font-mono text-ink-50/70 hover:bg-saf-500/8 hover:text-saf-500">
                        <Shield size={12} /> Admin
                      </Link>
                    )}
                    <Link href="/" className="flex items-center gap-2 px-3 py-2 text-[13px] font-mono text-ink-50/70 hover:bg-saf-500/8 hover:text-saf-500">
                      <ExternalLink size={12} /> Marketing site
                    </Link>
                    <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-mono text-saf-500 hover:bg-saf-500/8">
                      <LogOut size={12} /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <nav className="hidden md:flex px-5 md:px-6 border-t border-saf-500/8 gap-1 overflow-x-auto">
          {PRIMARY_NAV.map((n) => {
            const active = pathname === n.href || (n.match && pathname?.startsWith(n.match));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`relative inline-flex items-center gap-1.5 px-3 py-2.5 font-mono text-[12.5px] transition whitespace-nowrap ${
                  active ? 'text-saf-500' : 'text-ink-50/45 hover:text-ink-50'
                }`}
              >
                <n.icon size={12} />
                {n.label}
                {active && <span className="absolute left-3 right-3 -bottom-px h-px bg-saf-500" />}
              </Link>
            );
          })}
        </nav>

        {open && (
          <nav className="md:hidden border-t border-saf-500/8 p-2 bg-ink-950">
            {PRIMARY_NAV.map((n) => {
              const active = pathname === n.href || (n.match && pathname?.startsWith(n.match));
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 font-mono text-[13px] ${
                    active ? 'bg-saf-500/12 text-saf-500 border-l-2 border-saf-500' : 'text-ink-50/60 hover:bg-saf-500/6 hover:text-ink-50'
                  }`}
                >
                  <n.icon size={14} />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      <main className="px-5 md:px-8 lg:px-10 py-8 md:py-10 max-w-6xl w-full mx-auto">{children}</main>
    </div>
  );
}
