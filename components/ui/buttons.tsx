'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverse';
type Size    = 'sm' | 'md' | 'lg';

const VARIANT: Record<Variant, string> = {
  primary:   "bg-saf-500 text-ink-950 hover:bg-saf-400 disabled:bg-saf-500/40 disabled:text-ink-950/60 shadow-[0_0_26px_rgba(255,122,26,0.4)] hover:shadow-[0_0_36px_rgba(255,122,26,0.55)] font-semibold",
  secondary: "bg-transparent text-ink-50 border border-saf-500/30 hover:border-saf-500 hover:text-saf-500 font-['Martian_Mono',monospace] font-medium",
  ghost:     'bg-transparent text-ink-50/70 hover:text-ink-50 hover:bg-saf-500/8',
  danger:    'bg-saf-500/15 text-saf-500 border border-saf-500/40 hover:bg-saf-500/25',
  inverse:   'bg-ink-50 text-ink-950 hover:bg-white',
};

const SIZE: Record<Size, string> = {
  sm: 'text-[12px] px-3 py-1.5 gap-1.5',
  md: 'text-[14px] px-4 py-2.5 gap-1.5',
  lg: 'text-[15px] px-6 py-3.5 gap-2',
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
  const base = 'inline-flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-saf-500/60';
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${base} ${VARIANT[variant]} ${SIZE[size]} ${fullWidth ? 'w-full' : ''} ${className} disabled:cursor-not-allowed`}
      {...rest}
    >
      {loading ? <Loader2 size={size === 'sm' ? 12 : 14} className="animate-spin" /> : iconLeft}
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
  const base = 'inline-flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-saf-500/60';
  const isExternal = /^https?:\/\//.test(href);
  const cls = `${base} ${VARIANT[variant]} ${SIZE[size]} ${fullWidth ? 'w-full' : ''} ${className}`;
  if (isExternal) {
    return (
      <a href={href} target={target ?? '_blank'} rel={rel ?? 'noreferrer'} className={cls}>
        {iconLeft}{children}{iconRight}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {iconLeft}{children}{iconRight}
    </Link>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'default' | 'subtle' | 'ghost';
  size?: 'sm' | 'md';
}

export function IconButton({ label, variant = 'default', size = 'md', className = '', children, ...rest }: IconButtonProps) {
  const v =
    variant === 'subtle' ? 'bg-saf-500/8 text-ink-50/80 hover:bg-saf-500/16 hover:text-saf-500' :
    variant === 'ghost'  ? 'bg-transparent text-ink-50/50 hover:text-saf-500 hover:bg-saf-500/8' :
                            'bg-transparent border border-saf-500/24 text-ink-50/70 hover:border-saf-500 hover:text-saf-500';
  const s = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';
  return (
    <button aria-label={label} className={`${v} ${s} inline-flex items-center justify-center transition ${className}`} {...rest}>
      {children}
    </button>
  );
}
