'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverse';
type Size    = 'sm' | 'md' | 'lg';

const VARIANT: Record<Variant, string> = {
  primary:   'bg-ink-950 text-white hover:bg-ink-800 disabled:bg-ink-400',
  secondary: 'bg-white text-ink-800 border border-ink-200 hover:border-ink-400 disabled:text-ink-400',
  ghost:     'bg-transparent text-ink-700 hover:bg-ink-50 hover:text-ink-950 disabled:text-ink-300',
  danger:    'bg-coral-500 text-white hover:bg-coral-600 disabled:bg-coral-400/60',
  inverse:   'bg-white text-ink-950 hover:bg-ink-100',
};

const SIZE: Record<Size, string> = {
  sm: 'text-[13px] px-3 py-1.5 gap-1.5 rounded-md',
  md: 'text-[14px] px-4 py-2.5 gap-1.5 rounded-lg',
  lg: 'text-[15px] px-5 py-3 gap-2 rounded-lg',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  children?: ReactNode;
}

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, iconLeft, iconRight, fullWidth, className = '', children, disabled, ...rest },
  ref,
) {
  const base = 'inline-flex items-center justify-center font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30';
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${base} ${VARIANT[variant]} ${SIZE[size]} ${fullWidth ? 'w-full' : ''} ${className} disabled:cursor-not-allowed`}
      {...rest}
    >
      {loading ? <Loader2 size={size === 'sm' ? 13 : size === 'md' ? 14 : 15} className="animate-spin" /> : iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  );
});

interface LinkButtonProps extends CommonProps {
  href: string;
  target?: string;
  rel?: string;
}

export function LinkButton({
  href, target, rel, variant = 'primary', size = 'md', iconLeft, iconRight, fullWidth, className = '', children,
}: LinkButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30';
  const isExternal = /^https?:\/\//.test(href);
  const cls = `${base} ${VARIANT[variant]} ${SIZE[size]} ${fullWidth ? 'w-full' : ''} ${className}`;
  if (isExternal) {
    return (
      <a href={href} target={target ?? '_blank'} rel={rel ?? 'noreferrer'} className={cls}>
        {iconLeft}
        {children}
        {iconRight}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {iconLeft}
      {children}
      {iconRight}
    </Link>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;       // aria-label, required for accessibility
  variant?: 'default' | 'subtle' | 'ghost';
  size?: 'sm' | 'md';
}

export function IconButton({ label, variant = 'default', size = 'md', className = '', children, ...rest }: IconButtonProps) {
  const v =
    variant === 'subtle' ? 'bg-ink-50 text-ink-700 hover:bg-ink-100 hover:text-ink-950' :
    variant === 'ghost'  ? 'bg-transparent text-ink-500 hover:text-ink-950 hover:bg-ink-50' :
                            'bg-white border border-ink-200 text-ink-700 hover:border-ink-400 hover:text-ink-950';
  const s = size === 'sm' ? 'w-7 h-7 rounded-md' : 'w-9 h-9 rounded-lg';
  return (
    <button aria-label={label} className={`${v} ${s} inline-flex items-center justify-center transition ${className}`} {...rest}>
      {children}
    </button>
  );
}
