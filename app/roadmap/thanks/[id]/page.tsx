import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadRoadmap } from '@/lib/roadmap/store';
import { Wallet, FileText, Boxes, ArrowRight, Check } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function RoadmapThanks({ params }: { params: { id: string } }) {
  const r = await loadRoadmap(params.id);
  if (!r) notFound();
  const firstName = (r.name as string).split(' ')[0];

  return (
    <div className="min-h-screen bg-white text-ink-950 font-sans antialiased">

      <header className="border-b border-ink-100 bg-white/95 backdrop-blur sticky top-0 z-20">
        <div className="wrap h-[64px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold text-ink-950">
            <span className="relative w-7 h-7 rounded-lg bg-ink-950 flex items-center justify-center">
              <Wallet size={14} className="text-brand-400" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-white" />
            </span>
            <span className="text-[1.05rem]">Agent<span className="text-brand-500">Mint</span></span>
          </Link>
          <Link href="/" className="text-[13px] font-medium text-ink-600 hover:text-ink-950">Back to home</Link>
        </div>
      </header>

      <main className="wrap py-14 md:py-20 max-w-3xl">

        <section className="text-center">
          <div className="inline-flex w-16 h-16 rounded-full bg-brand-500/10 items-center justify-center">
            <Check size={32} className="text-brand-600" strokeWidth={2.4} />
          </div>
          <h1 className="mt-6 font-extrabold tracking-[-0.028em] leading-[1.04] text-[2.2rem] md:text-[2.8rem] balance">
            Thanks, {firstName}. We're on it.
          </h1>
          <p className="mt-5 text-[1.05rem] text-ink-600 leading-relaxed max-w-xl mx-auto">
            Your roadmap intake for <strong className="text-ink-950">{r.company}</strong> is in our queue. Someone on our team will reply to <strong className="text-ink-950">{r.email}</strong> within one business day with a deep-dive proposal.
          </p>
        </section>

        <section className="mt-12">
          <div className="text-[12px] uppercase tracking-[.14em] font-bold text-brand-700">What happens next</div>
          <ol className="mt-4 space-y-3">
            <Step n="01" title="We read everything you sent" body={`Your inputs about ${r.agent_count} agent${r.agent_count > 1 ? 's' : ''}, your stack (${r.stack}), and the current charging method (${r.charging_method}) get a careful read. Anything in the docs you pointed at, too.`} />
            <Step n="02" title="We scope a roadmap" body="Integration plan per agent, sequencing recommendations, exact SDKs/APIs/credentials required, payment-rail decisions, and time estimates. Built specifically for what you have today." />
            <Step n="03" title="We send you two documents" body="The roadmap itself — and a separate onboarding checklist of every credential, environment variable and access grant we'd need to actually ship it. Two PDFs you can review with your team before any commitment." />
            <Step n="04" title="If you want, we build" body="Pilot cohort is $0 while we harden the connect path together. We never hold your money — payouts land in your accounts." />
          </ol>
        </section>

        {/* Their input recap (lightweight) */}
        <section className="mt-12 rounded-2xl border border-ink-100 bg-ink-50/50 p-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-[12px] uppercase tracking-[.14em] font-bold text-brand-700">Your intake</div>
            <span className="mono text-[11.5px] text-ink-500">Ref · {r.id.slice(0, 8)}</span>
          </div>
          <h2 className="mt-3 font-extrabold text-ink-950 text-[1.25rem] tracking-tight">{r.company}</h2>
          <div className="mt-1 mono text-[12.5px] text-ink-500">{r.website}</div>
          <p className="mt-4 text-[14px] text-ink-700 leading-relaxed">{r.agents_summary}</p>
          <div className="mt-4 grid sm:grid-cols-3 gap-4 text-[13px]">
            <div>
              <div className="text-[10.5px] uppercase tracking-[.12em] font-bold text-ink-500">Agents</div>
              <div className="mt-0.5 font-extrabold tnum text-ink-950">{r.agent_count}</div>
            </div>
            <div>
              <div className="text-[10.5px] uppercase tracking-[.12em] font-bold text-ink-500">Charging now</div>
              <div className="mt-0.5 font-bold text-ink-950">{r.charging_method}</div>
            </div>
            <div>
              <div className="text-[10.5px] uppercase tracking-[.12em] font-bold text-ink-500">Timeline</div>
              <div className="mt-0.5 font-bold text-ink-950">{r.timeline}</div>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-2xl bg-ink-950 text-white p-7 md:p-9 relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute rounded-full" style={{ width: '22rem', height: '22rem', background: '#10a868', top: '-9rem', right: '-5rem', filter: 'blur(80px)', opacity: 0.32 }} />
          <div className="relative">
            <div className="text-[12px] uppercase tracking-[.14em] font-bold text-brand-400">While you wait</div>
            <h3 className="mt-2 font-extrabold text-[1.5rem] md:text-[1.8rem] tracking-tight leading-tight">Try the free Pricing Audit.</h3>
            <p className="mt-2 text-[14.5px] text-ink-300 leading-relaxed">
              Paste your domain. Branded report + PDF in ~15 seconds. Different lens than the deep roadmap — same green underneath.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link href="/audit" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink-950 bg-white hover:bg-ink-100 rounded-lg px-4 py-2.5 transition">
                <FileText size={14} /> Open Pricing Audit <ArrowRight size={13} />
              </Link>
              <Link href="/build/signup" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-white border border-white/30 hover:border-white/70 rounded-lg px-4 py-2.5 transition">
                <Boxes size={14} /> Or the builder console
              </Link>
            </div>
          </div>
        </section>

        <p className="mt-10 text-[12px] text-ink-400 text-center mono">
          Submitted {new Date(r.created_at).toLocaleString()} · keep this URL as your reference
        </p>
      </main>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="flex gap-4 rounded-xl border border-ink-100 bg-white p-5">
      <span className="mono text-[12px] font-bold text-brand-700 mt-0.5">{n}</span>
      <div>
        <div className="font-bold text-ink-950 tracking-tight">{title}</div>
        <p className="mt-1 text-[14px] text-ink-600 leading-relaxed">{body}</p>
      </div>
    </li>
  );
}
