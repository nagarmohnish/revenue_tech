'use client';

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react';
import { Check } from 'lucide-react';

const FIELD_BASE = "w-full px-3.5 py-2.5 border border-saf-500/24 bg-white/[0.015] text-[14.5px] text-ink-50 placeholder:text-ink-50/35 transition focus:border-saf-500 focus:outline-none focus:ring-1 focus:ring-saf-500/30 disabled:bg-white/[0.005] disabled:text-ink-50/40 font-['Archivo',sans-serif]";

interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, hint, error, required, htmlFor, children, className = '' }: FieldProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="block font-mono text-[11.5px] uppercase tracking-[.12em] text-ink-50/70 mb-2">
          {label} {required && <span className="text-saf-500">*</span>}
        </label>
      )}
      {hint && <p className="text-[12px] text-ink-50/45 -mt-1 mb-2">{hint}</p>}
      {children}
      {error && <p className="mt-1.5 text-[12.5px] text-saf-500 font-mono">{error}</p>}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = '', invalid, ...rest }, ref,
) {
  return <input ref={ref} className={`${FIELD_BASE} ${invalid ? 'border-saf-500 ring-1 ring-saf-500/40' : ''} ${className}`} {...rest} />;
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className = '', invalid, ...rest }, ref,
) {
  return <textarea ref={ref} className={`${FIELD_BASE} !leading-relaxed ${invalid ? 'border-saf-500' : ''} ${className}`} {...rest} />;
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className = '', children, ...rest }, ref,
) {
  return (
    <select
      ref={ref}
      className={`${FIELD_BASE} appearance-none bg-no-repeat bg-[length:14px] bg-[position:right_12px_center] bg-[url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%2714%27 height=%2714%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23FF7A1A%27 stroke-width=%272.4%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27><polyline points=%276 9 12 15 18 9%27/></svg>")] pr-9 ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
});

interface InputAddonProps {
  prefix?: ReactNode;
  suffix?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function InputGroup({ prefix, suffix, children, className = '' }: InputAddonProps) {
  return (
    <div className={`flex items-stretch ${className}`}>
      {prefix && <span className="inline-flex items-center px-3 border border-r-0 border-saf-500/24 bg-white/[0.01] text-ink-50/55 text-[13px] font-mono">{prefix}</span>}
      <div className={`flex-1 ${prefix ? '[&>input]:!border-l-0' : ''}`}>
        {children}
      </div>
      {suffix && <span className="inline-flex items-center px-3 border border-l-0 border-saf-500/24 bg-white/[0.01] text-ink-50/55 text-[13px] font-mono">{suffix}</span>}
    </div>
  );
}

interface RadioCardOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
  icon?: ReactNode;
  badge?: string;
}

interface RadioCardGridProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: RadioCardOption<T>[];
  cols?: 2 | 3 | 4;
  name?: string;
}

export function RadioCardGrid<T extends string>({ value, onChange, options, cols = 2 }: RadioCardGridProps<T>) {
  const grid =
    cols === 2 ? 'sm:grid-cols-2' :
    cols === 3 ? 'sm:grid-cols-2 md:grid-cols-3' :
                 'sm:grid-cols-2 md:grid-cols-4';
  return (
    <div className={`grid gap-2 ${grid}`}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`text-left px-3.5 py-3 border transition flex items-start gap-2.5 ${
              active ? 'border-saf-500 bg-saf-500/8 text-ink-50' : 'border-saf-500/20 bg-white/[0.015] hover:border-saf-500/50 text-ink-50/80'
            }`}
          >
            {o.icon ? (
              <span className={`mt-0.5 flex-shrink-0 ${active ? 'text-saf-500' : 'text-ink-50/40'}`}>{o.icon}</span>
            ) : (
              <span className={`mt-0.5 w-4 h-4 border-2 flex-shrink-0 flex items-center justify-center ${
                active ? 'border-saf-500 bg-saf-500' : 'border-ink-50/30'
              }`}>
                {active && <Check size={9} strokeWidth={4} className="text-ink-950" />}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className={`font-mono text-[12.5px] leading-tight ${active ? 'text-saf-500' : 'text-ink-50/90'}`}>
                {o.label}
                {o.badge && <span className="ml-1.5 text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-saf-500/15 text-saf-500 border border-saf-500/30">{o.badge}</span>}
              </div>
              {o.hint && (
                <div className={`text-[11.5px] mt-1 ${active ? 'text-ink-50/70' : 'text-ink-50/45'}`}>{o.hint}</div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, hint, disabled }: ToggleProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <button
        type="button" role="switch" aria-checked={checked} disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 transition focus:outline-none focus:ring-1 focus:ring-saf-500/60 border ${
          checked ? 'bg-saf-500 border-saf-500' : 'bg-ink-800 border-saf-500/30'
        } ${disabled ? 'opacity-50' : ''}`}
      >
        <span className={`inline-block h-4 w-4 transform bg-ink-50 shadow transition mt-0.5 ${checked ? 'translate-x-4 ml-0' : 'translate-x-0.5'}`} />
      </button>
      {(label || hint) && (
        <div className="text-left">
          {label && <div className="text-[13px] font-bold text-ink-50">{label}</div>}
          {hint && <div className="text-[12px] text-ink-50/55 mt-0.5">{hint}</div>}
        </div>
      )}
    </label>
  );
}
