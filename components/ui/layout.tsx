'use client';

import { useState, type ReactNode } from 'react';
import { Copy, Check as CheckIcon } from 'lucide-react';

interface EyebrowProps {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function Eyebrow({ children, icon, className = '' }: EyebrowProps) {
  return (
    <div className={`inline-flex items-center gap-2 text-[11px] uppercase tracking-[.14em] font-bold text-brand-700 ${className}`}>
      {icon}
      {children}
    </div>
  );
}

interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, actions, className = '' }: PageHeaderProps) {
  return (
    <header className={`flex items-start justify-between flex-wrap gap-4 ${className}`}>
      <div className="min-w-0 flex-1">
        {eyebrow && <div className="mb-1">{eyebrow}</div>}
        <h1 className="font-extrabold tracking-[-0.025em] text-ink-950 text-[1.75rem] md:text-[2.05rem] leading-[1.1]">{title}</h1>
        {description && <p className="mt-2 text-[14.5px] text-ink-500 leading-relaxed max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </header>
  );
}

interface SectionHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function SectionHeader({ eyebrow, title, description, actions, className = '' }: SectionHeaderProps) {
  return (
    <div className={`flex items-end justify-between flex-wrap gap-4 ${className}`}>
      <div className="min-w-0">
        {eyebrow && <div className="mb-1">{eyebrow}</div>}
        <h2 className="font-extrabold tracking-tight text-ink-950 text-[1.25rem] md:text-[1.4rem]">{title}</h2>
        {description && <p className="mt-1.5 text-[13.5px] text-ink-500 leading-relaxed max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

type BadgeTone = 'neutral' | 'brand' | 'amber' | 'coral' | 'dark' | 'mono';
const BADGE_TONE: Record<BadgeTone, string> = {
  neutral: 'bg-ink-100 text-ink-700',
  brand:   'bg-brand-50 text-brand-700',
  amber:   'bg-amber-100 text-amber-700',
  coral:   'bg-coral-400/15 text-coral-600',
  dark:    'bg-ink-950 text-white',
  mono:    'bg-ink-50 text-ink-700 font-mono',
};

interface BadgeProps {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', icon, children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] uppercase tracking-[.06em] font-bold ${BADGE_TONE[tone]} ${className}`}>
      {icon}
      {children}
    </span>
  );
}

interface TabsProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: ReactNode; icon?: ReactNode; count?: number }>;
  variant?: 'pill' | 'underline';
  className?: string;
}

export function Tabs<T extends string>({ value, onChange, options, variant = 'pill', className = '' }: TabsProps<T>) {
  if (variant === 'underline') {
    return (
      <div className={`flex gap-1 border-b border-ink-100 ${className}`}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              className={`px-3 py-2.5 text-[13.5px] font-medium border-b-2 -mb-px flex items-center gap-1.5 ${
                active ? 'border-ink-950 text-ink-950' : 'border-transparent text-ink-500 hover:text-ink-900'
              }`}
            >
              {o.icon}
              {o.label}
              {typeof o.count === 'number' && (
                <span className={`text-[10.5px] px-1.5 py-0.5 rounded-md font-mono ${active ? 'bg-ink-950 text-white' : 'bg-ink-100 text-ink-500'}`}>{o.count}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <div className={`inline-flex p-1 bg-ink-50 rounded-xl border border-ink-100 ${className}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`px-4 py-1.5 text-[13px] font-semibold rounded-md transition flex items-center gap-1.5 ${
              active ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  copy?: boolean;
  className?: string;
}

export function CodeBlock({ code, language, filename, copy = true, className = '' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  function doCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  }
  return (
    <div className={`rounded-2xl overflow-hidden border border-ink-800 bg-ink-950 text-ink-50 ${className}`}>
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-ink-800">
        <span className="w-2.5 h-2.5 rounded-full bg-ink-700" />
        <span className="w-2.5 h-2.5 rounded-full bg-ink-700" />
        <span className="w-2.5 h-2.5 rounded-full bg-ink-700" />
        {filename && <span className="ml-3 mono text-[11.5px] text-ink-400">{filename}</span>}
        {language && !filename && <span className="ml-3 mono text-[11.5px] text-ink-400">{language}</span>}
        {copy && (
          <button
            onClick={doCopy}
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-mono text-ink-400 hover:text-ink-100 transition"
            aria-label="Copy code"
          >
            {copied ? <CheckIcon size={12} className="text-brand-400" /> : <Copy size={12} />} {copied ? 'copied' : 'copy'}
          </button>
        )}
      </div>
      <pre className="mono text-[12.5px] leading-[1.7] px-5 py-5 overflow-auto"><code>{code}</code></pre>
    </div>
  );
}

export function Spinner({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={`animate-spin text-brand-500 ${className}`} viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

interface KbdProps { children: ReactNode }
export function Kbd({ children }: KbdProps) {
  return <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-ink-200 bg-ink-50 text-[10.5px] mono text-ink-700 shadow-sm">{children}</kbd>;
}
