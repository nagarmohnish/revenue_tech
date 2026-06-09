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
    <div className={`inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[.14em] text-saf-500 ${className}`}>
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
        {eyebrow && <div className="mb-3">{eyebrow}</div>}
        <h1 className="font-display text-[clamp(1.7rem,4vw,2.4rem)] leading-[1.05] text-ink-50">{title}</h1>
        {description && <p className="mt-3 text-[14.5px] text-ink-50/60 leading-relaxed max-w-2xl">{description}</p>}
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
        {eyebrow && <div className="mb-2">{eyebrow}</div>}
        <h2 className="font-display text-[clamp(1.25rem,2.5vw,1.6rem)] text-ink-50">{title}</h2>
        {description && <p className="mt-2 text-[13.5px] text-ink-50/55 leading-relaxed max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

type BadgeTone = 'neutral' | 'brand' | 'amber' | 'coral' | 'dark' | 'mono';
const BADGE_TONE: Record<BadgeTone, string> = {
  neutral: 'bg-white/5 text-ink-50/70 border border-saf-500/14',
  brand:   'bg-saf-500/10 text-saf-500 border border-saf-500/40',
  amber:   'bg-saf-500/8 text-saf-500/85 border border-saf-500/30',
  coral:   'bg-saf-500/8 text-saf-500/85 border border-saf-500/30',
  dark:    'bg-ink-950 text-saf-500 border border-saf-500/40',
  mono:    'bg-white/5 text-ink-50/60 border border-saf-500/14 font-mono',
};

interface BadgeProps {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', icon, children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[.08em] ${BADGE_TONE[tone]} ${className}`}>
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
      <div className={`flex gap-1 border-b border-saf-500/16 ${className}`}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              className={`px-3 py-2.5 text-[13px] font-mono border-b-2 -mb-px flex items-center gap-1.5 ${
                active ? 'border-saf-500 text-saf-500' : 'border-transparent text-ink-50/55 hover:text-ink-50'
              }`}
            >
              {o.icon}
              {o.label}
              {typeof o.count === 'number' && (
                <span className={`text-[10.5px] px-1.5 py-0.5 font-mono ${active ? 'bg-saf-500 text-ink-950' : 'bg-white/5 text-ink-50/55 border border-saf-500/14'}`}>{o.count}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }
  // Pill variant — concept-9 segmented control: zero radius, orange border, active = solid orange
  return (
    <div className={`inline-flex border border-saf-500/20 ${className}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`px-5 py-2.5 text-[13px] font-mono font-semibold transition flex items-center gap-1.5 ${
              active ? 'bg-saf-500 text-ink-950' : 'bg-transparent text-ink-50/60 hover:text-ink-50'
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
    <div className={`border border-saf-500/20 bg-ink-800 text-ink-50 ${className}`}>
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-saf-500/14">
        <span className="w-2.5 h-2.5 bg-saf-500 shadow-[0_0_8px_#FF7A1A]" />
        <span className="w-2.5 h-2.5 bg-saf-500/40" />
        <span className="w-2.5 h-2.5 bg-saf-500/20" />
        {filename && <span className="ml-3 font-mono text-[11.5px] text-ink-50/55">{filename}</span>}
        {language && !filename && <span className="ml-3 font-mono text-[11.5px] text-ink-50/55">{language}</span>}
        {copy && (
          <button
            onClick={doCopy}
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-mono text-ink-50/55 hover:text-saf-500 transition"
            aria-label="Copy code"
          >
            {copied ? <CheckIcon size={12} className="text-saf-500" /> : <Copy size={12} />} {copied ? 'copied' : 'copy'}
          </button>
        )}
      </div>
      <pre className="font-mono text-[12.5px] leading-[1.7] px-5 py-5 overflow-auto"><code>{code}</code></pre>
    </div>
  );
}

export function Spinner({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={`animate-spin text-saf-500 ${className}`} viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

interface KbdProps { children: ReactNode }
export function Kbd({ children }: KbdProps) {
  return <kbd className="inline-flex items-center px-1.5 py-0.5 border border-saf-500/20 bg-ink-800 text-[10.5px] font-mono text-ink-50/80">{children}</kbd>;
}
