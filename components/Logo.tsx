import Link from 'next/link';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 24 : 28;
  return (
    <Link href="/" className="flex items-center gap-2.5 font-extrabold text-ink-950 tracking-tight">
      <svg width={dim} height={dim} viewBox="0 0 28 28" fill="none" aria-hidden>
        <rect x="2" y="2" width="24" height="24" rx="7" fill="#10a868" />
        <circle cx="14" cy="14" r="6" stroke="#fff" strokeWidth="1.9" fill="none" />
        <path d="M14 10.2v7.6M11.6 12.6h4.8M11.6 15.4h4.8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className={size === 'sm' ? 'text-[1rem]' : 'text-[1.1rem]'}>
        Agent<span className="text-brand-500">Mint</span>
      </span>
    </Link>
  );
}
