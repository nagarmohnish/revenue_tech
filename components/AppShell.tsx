'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Logo } from './Logo';
import { CreditBalance } from './CreditBalance';
import {
  Boxes,
  CreditCard,
  Gauge,
  LayoutDashboard,
  LogOut,
  Search,
  Shield,
  Sparkles,
  Wand2,
} from 'lucide-react';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/agents/scanner', label: 'Scanner', icon: Search },
  { href: '/agents/blog-writer', label: 'Blog Writer', icon: Wand2 },
  { href: '/agents/content-studio', label: 'Content Studio', icon: Sparkles },
  { href: '/agents/locked', label: 'More agents', icon: Boxes },
  { href: '/billing', label: 'Billing', icon: CreditCard },
];

export function AppShell({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch('/api/auth/sign-out', { method: 'POST' });
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-ink-50 flex">
      <aside className="hidden md:flex flex-col w-60 border-r border-ink-100 bg-white px-4 py-5">
        <div className="px-2 mb-6">
          <Logo size="sm" />
        </div>
        <nav className="space-y-1">
          {nav.map((n) => {
            const active = pathname === n.href || (n.href !== '/dashboard' && pathname?.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  active ? 'bg-ink-900 text-white' : 'text-ink-700 hover:bg-ink-50'
                }`}
              >
                <n.icon size={16} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-4 border-t border-ink-100 space-y-1">
          {admin && (
            <Link href="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ink-700 hover:bg-ink-50">
              <Shield size={16} /> Admin
            </Link>
          )}
          <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ink-500 hover:bg-ink-50">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-ink-100 bg-white px-6 flex items-center justify-between">
          <div className="md:hidden"><Logo size="sm" /></div>
          <div className="hidden md:flex text-sm text-ink-500 items-center gap-1.5">
            <Gauge size={14} />
            <span className="font-medium text-ink-700">Workspace</span>
          </div>
          <CreditBalance />
        </header>
        <main className="flex-1 px-6 py-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
