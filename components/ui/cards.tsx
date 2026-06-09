import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { LinkButton, Button } from './buttons';

type CardVariant = 'default' | 'muted' | 'dark' | 'accent' | 'highlighted';

const CARD_VARIANT: Record<CardVariant, string> = {
  default:     'bg-white border border-ink-100',
  muted:       'bg-ink-50/60 border border-ink-100',
  dark:        'bg-ink-950 text-white border border-ink-800',
  accent:      'bg-brand-50/50 border border-brand-100',
  highlighted: 'bg-white border-2 border-ink-950 shadow-lg',
};

const CARD_PADDING = {
  none: '',
  sm:   'p-4',
  md:   'p-5 md:p-6',
  lg:   'p-6 md:p-8',
} as const;

interface CardProps {
  variant?: CardVariant;
  padding?: keyof typeof CARD_PADDING;
  className?: string;
  children: ReactNode;
}

export function Card({ variant = 'default', padding = 'md', className = '', children }: CardProps) {
  return (
    <div className={`rounded-2xl ${CARD_VARIANT[variant]} ${CARD_PADDING[padding]} ${className}`}>
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
          <div className="text-[11px] uppercase tracking-[.12em] font-bold text-ink-500">{label}</div>
          <div className="mt-2 font-extrabold tracking-tight text-ink-950 text-[1.85rem] tnum leading-none">{value}</div>
          {hint && <div className="mt-1.5 text-[12px] text-ink-500">{hint}</div>}
        </div>
        {icon && <span className="text-ink-400 flex-shrink-0">{icon}</span>}
      </div>
      {trend && (
        <div className={`mt-3 text-[12px] font-semibold ${trend.positive ? 'text-brand-700' : 'text-coral-600'}`}>
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
      <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
        {icon}
      </div>
      <h2 className="mt-5 font-extrabold tracking-tight text-ink-950 text-[1.25rem]">{title}</h2>
      {body && <p className="mt-2 text-ink-500 text-[14px] max-w-md mx-auto leading-relaxed">{body}</p>}
      {(action || secondary) && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
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
  const tones = {
    info:    'bg-brand-50/60 border-brand-100 text-brand-700',
    warn:    'bg-amber-50 border-amber-200 text-amber-700',
    error:   'bg-coral-400/10 border-coral-400/30 text-coral-700',
    success: 'bg-brand-50 border-brand-200 text-brand-700',
  };
  return (
    <div className={`rounded-xl border px-4 py-3 ${tones[tone]} flex items-start gap-3`}>
      {icon && <span className="mt-0.5 flex-shrink-0">{icon}</span>}
      <div className="flex-1 text-[13.5px] leading-relaxed">
        {title && <div className="font-bold mb-0.5">{title}</div>}
        {children}
      </div>
      {action && action.href && (
        <Link href={action.href} className="text-[13px] font-bold underline-offset-2 hover:underline whitespace-nowrap">{action.label}</Link>
      )}
      {action && !action.href && (
        <button onClick={action.onClick} className="text-[13px] font-bold underline-offset-2 hover:underline whitespace-nowrap">{action.label}</button>
      )}
    </div>
  );
}
