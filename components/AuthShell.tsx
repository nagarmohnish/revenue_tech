import Link from 'next/link';
import type { ReactNode } from 'react';

interface AuthShellProps {
  children: ReactNode;
  rightPanel?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
}

/**
 * Two-column auth layout. Concept-9: dark + safety orange.
 */
export function AuthShell({ children, rightPanel, title, description }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-ink-950 text-ink-50 flex flex-col">
      <header className="px-6 h-14 flex items-center border-b border-saf-500/12">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-ink-50">
          <span className="w-3 h-3 bg-saf-500 shadow-[0_0_14px_#FF7A1A]" />
          <span className="text-[15px] tracking-tight">AgentMint</span>
        </Link>
      </header>

      <main className="flex-1 grid lg:grid-cols-2">
        <section className="px-6 md:px-12 lg:px-16 py-14 flex flex-col justify-center max-w-xl mx-auto w-full">
          {title && (
            <div className="mb-9">
              <h1 className="font-display uppercase text-[clamp(2rem,5vw,2.8rem)] leading-[1.05] text-ink-50">{title}</h1>
              {description && <p className="mt-4 text-[15px] text-ink-50/65 leading-relaxed">{description}</p>}
            </div>
          )}
          {children}
        </section>

        {rightPanel && (
          <aside className="hidden lg:block bg-white/[0.015] border-l border-saf-500/12 px-14 py-14 relative tilegrid">
            <div className="sticky top-16 relative z-10">{rightPanel}</div>
          </aside>
        )}
      </main>
    </div>
  );
}
