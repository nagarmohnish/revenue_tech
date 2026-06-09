import Link from 'next/link';
import type { ReactNode } from 'react';
import { Wallet } from 'lucide-react';

interface AuthShellProps {
  children: ReactNode;
  rightPanel?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
}

/**
 * Two-column auth layout. Left = the form; right = an optional explainer panel
 * (sales copy, illustration, etc).
 */
export function AuthShell({ children, rightPanel, title, description }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-6 h-16 flex items-center border-b border-ink-100">
        <Link href="/" className="flex items-center gap-2.5 font-extrabold text-ink-950">
          <span className="relative w-7 h-7 rounded-lg bg-ink-950 flex items-center justify-center">
            <Wallet size={14} className="text-brand-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-white" />
          </span>
          <span className="text-[1.02rem] tracking-tight">Agent<span className="text-brand-500">Mint</span></span>
        </Link>
      </header>

      <main className="flex-1 grid lg:grid-cols-2">
        <section className="px-6 md:px-12 lg:px-16 py-14 flex flex-col justify-center max-w-xl mx-auto w-full">
          {title && (
            <div className="mb-8">
              <h1 className="font-extrabold tracking-[-0.025em] leading-[1.05] text-[2rem] md:text-[2.4rem] text-ink-950">{title}</h1>
              {description && <p className="mt-3 text-[15px] text-ink-600 leading-relaxed">{description}</p>}
            </div>
          )}
          {children}
        </section>

        {rightPanel && (
          <aside className="hidden lg:block bg-ink-50/60 border-l border-ink-100 px-14 py-14">
            <div className="sticky top-16">{rightPanel}</div>
          </aside>
        )}
      </main>
    </div>
  );
}
