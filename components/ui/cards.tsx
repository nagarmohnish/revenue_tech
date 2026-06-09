import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { LinkButton, Button } from './buttons';

type CardVariant = 'default' | 'muted' | 'dark' | 'accent' | 'highlighted';

const CARD_VARIANT: Record<CardVariant, string> = {
  // Concept-9: zero border-radius, thin orange-tinted borders, subtle background
  default:     'bg-white/[0.015] border border-saf-500/14',
  muted:       'bg-white/[0.01] border border-saf-500/8',
  dark:        'bg-ink-800 border border-saf-500/28 shadow-[0_0_50px_rgba(255,122,26,0.08)]',
  accent:      'bg-saf-500/4 border border-saf-500/55 shadow-[0_0_50px_rgba(255,122,26,0.12)]',
  highlighted: 'bg-saf-500/4 border border-saf-500/55 shadow-[0_0_50px_rgba(255,122,26,0.12)]',
};

const CARD_PADDING = {
  none: '',
  sm:   'p-4',
  md:   'p-6 md:p-7',
  lg:   'p-8 md:p-9',
} as const;

interface CardProps {
  variant?: CardVariant;
  padding?: keyof typeof CARD_PADDING;
  className?: string;
  children: ReactNode;
}

export function Card({ variant = 'default', padding = 'md', className = '', children }: CardProps) {
  return (
    <div className={`${CARD_VARIANT[variant]} ${CARD_PADDING[padding]} ${className}`}>
      {children}
    </div>
  );
}

interface StatProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  trend?: { value: string; positive?: boolean };
}

export function Stat({ label, value, hint, icon, trend }: StatProps) {
  return (
    <Card padding="md">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[.14em] text-ink-50/55">{label}</div>
          <div className="mt-3 font-mono text-saf-500 text-[2rem] tnum leading-none tracking-[-0.02em]">{value}</div>
          {hint && <div className="mt-2 text-[12.5px] text-ink-50/45">{hint}</div>}
        </div>
        {icon && <span className="text-saf-500/70 flex-shrink-0">{icon}</span>}
      </div>
      {trend && (
        <div className={`mt-3 text-[12px] font-mono ${trend.positive ? 'text-saf-500' : 'text-ink-50/45'}`}>
          {trend.positive ? '↑' : '↓'} {trend.value}
        </div>
      )}
    </Card>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  body?: ReactNode;
  action?: { label: string; href?: string; onClick?: () => void; icon?: ReactNode };
  secondary?: { label: string; href: string };
}

export function EmptyState({ icon, title, body, action, secondary }: EmptyStateProps) {
  return (
    <Card padding="lg" className="text-center">
      <div className="w-14 h-14 mx-auto bg-saf-500/12 text-saf-500 border border-saf-500/28 flex items-center justify-center">
        {icon}
      </div>
      <h2 className="mt-6 font-display text-[1.4rem] text-ink-50">{title}</h2>
      {body && <p className="mt-3 text-ink-50/60 text-[14px] max-w-md mx-auto leading-relaxed">{body}</p>}
      {(action || secondary) && (
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {action && (action.href ? (
            <LinkButton href={action.href} iconLeft={action.icon} iconRight={<ArrowRight size={13} />}>{action.label}</LinkButton>
          ) : (
            <Button onClick={action.onClick} iconLeft={action.icon} iconRight={<ArrowRight size={13} />}>{action.label}</Button>
          ))}
          {secondary && <LinkButton href={secondary.href} variant="secondary">{secondary.label}</LinkButton>}
        </div>
      )}
    </Card>
  );
}

interface InfoBannerProps {
  tone?: 'info' | 'warn' | 'error' | 'success';
  icon?: ReactNode;
  title?: ReactNode;
  children?: ReactNode;
  action?: { label: string; href?: string; onClick?: () => void };
}

export function InfoBanner({ tone = 'info', icon, title, children, action }: InfoBannerProps) {
  // In dark-orange land, all tones are variations of the brand orange.
  const tones = {
    info:    'bg-saf-500/6 border-saf-500/24 text-ink-50',
    warn:    'bg-saf-500/8 border-saf-500/40 text-saf-500',
    error:   'bg-saf-500/10 border-saf-500/55 text-saf-500',
    success: 'bg-saf-500/6 border-saf-500/40 text-saf-500',
  };
  return (
    <div className={`border px-4 py-3 ${tones[tone]} flex items-start gap-3`}>
      {icon && <span className="mt-0.5 flex-shrink-0 text-saf-500">{icon}</span>}
      <div className="flex-1 text-[13.5px] leading-relaxed">
        {title && <div className="font-bold mb-0.5">{title}</div>}
        {children}
      </div>
      {action && action.href && (
        <Link href={action.href} className="text-[13px] font-bold font-mono underline-offset-2 hover:underline whitespace-nowrap text-saf-500">{action.label}</Link>
      )}
      {action && !action.href && (
        <button onClick={action.onClick} className="text-[13px] font-bold font-mono underline-offset-2 hover:underline whitespace-nowrap text-saf-500">{action.label}</button>
      )}
    </div>
  );
}
