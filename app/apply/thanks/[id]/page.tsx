import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadApplication } from '@/lib/applications/store';
import {
  BILLING_LABELS, GEOGRAPHY_LABELS, LIFECYCLE_LABELS, TIMELINE_LABELS, VOLUME_LABELS,
} from '@/lib/applications/types';

export const dynamic = 'force-dynamic';

export default async function ThanksPage({ params }: { params: { id: string } }) {
  const app = await loadApplication(params.id);
  if (!app) notFound();

  const firstName = app.name.split(' ')[0];

  return (
    <div className="min-h-screen bg-white text-ink-950 font-sans antialiased">

      <header className="border-b border-ink-100 bg-white/95 backdrop-blur sticky top-0 z-20">
        <div className="wrap h-[64px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold text-ink-950">
            <span className="relative w-7 h-7 rounded-lg bg-ink-950 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-400">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
              </svg>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-white" />
            </span>
            <span className="text-[1.05rem] tracking-tight">Agent<span className="text-brand-500">Mint</span></span>
          </Link>
          <Link href="/" className="text-[13px] font-medium text-ink-600 hover:text-ink-950">Back to home</Link>
        </div>
      </header>

      <main className="wrap py-16 md:py-20 max-w-3xl">

        <section className="text-center">
          <div className="inline-flex w-16 h-16 rounded-full bg-brand-500/10 items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10a868" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="mt-6 font-extrabold tracking-[-0.028em] leading-[1.04] text-[2.4rem] md:text-[3rem] balance">
            Thanks, {firstName}. <span className="text-brand-500">We've got it.</span>
          </h1>
          <p className="mt-5 text-[1.05rem] text-ink-600 leading-relaxed max-w-xl mx-auto">
            We read every application personally. Someone on our team will reply to <strong className="text-ink-950">{app.email}</strong> within one business day.
          </p>
        </section>

        {/* What happens next */}
        <section className="mt-12">
          <div className="text-[12px] uppercase tracking-[.14em] font-bold text-brand-700">What happens next</div>
          <ol className="mt-4 space-y-3">
            <Step n="01" title="A few clarifying questions"  body="Pricing in mind, volume bands, any constraints we should know. Usually three or four questions." />
            <Step n="02" title="We scope it"                  body={`We design the monetization layer for ${app.agentName} — ${BILLING_LABELS[app.billingPref].toLowerCase()}, ${GEOGRAPHY_LABELS[app.geography].toLowerCase()} payment rail — and share it back.`} />
            <Step n="03" title="We build it"                  body="Two HTTP calls in your agent route, one tenant row in our registry. You review, you ship." />
            <Step n="04" title="You collect revenue"          body="Money lands in your own merchant account. We never hold it. AgentMint takes a small platform fee." />
          </ol>
        </section>

        {/* Your application */}
        <section className="mt-12 rounded-2xl border border-ink-100 bg-ink-50/40 p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="text-[12px] uppercase tracking-[.14em] font-bold text-brand-700">Your application</div>
            <span className="mono text-[11.5px] text-ink-500">Reference: <span className="text-ink-800">{app.id.slice(0, 8)}…</span></span>
          </div>
          <h2 className="mt-3 font-extrabold text-ink-950 text-[1.4rem] tracking-tight">{app.agentName}</h2>
          <p className="mt-1 text-[14.5px] text-ink-600 leading-relaxed">{app.agentDesc}</p>

          <dl className="mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-3 text-[13.5px]">
            <Row label="Lifecycle"       value={LIFECYCLE_LABELS[app.lifecycle]} />
            <Row label="Volume estimate" value={VOLUME_LABELS[app.volumeEstimate]} />
            <Row label="Billing model"   value={BILLING_LABELS[app.billingPref]} />
            <Row label="Geography"       value={`${GEOGRAPHY_LABELS[app.geography]}${app.geographyOther ? ` (${app.geographyOther})` : ''}`} />
            <Row label="Stack"           value={app.stack} mono />
            <Row label="Timeline"        value={TIMELINE_LABELS[app.timeline]} />
          </dl>

          {app.notes && (
            <>
              <div className="mt-5 pt-5 border-t border-ink-200">
                <div className="text-[11px] uppercase tracking-[.14em] font-bold text-ink-500 mb-1.5">Notes you gave us</div>
                <p className="text-[13.5px] text-ink-700 leading-relaxed whitespace-pre-line">{app.notes}</p>
              </div>
            </>
          )}
        </section>

        {/* Want to start now */}
        <section className="mt-12 rounded-2xl bg-ink-950 text-white p-7 md:p-9 relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute rounded-full" style={{ width: '20rem', height: '20rem', background: '#10a868', top: '-8rem', right: '-6rem', filter: 'blur(70px)', opacity: 0.3 }} />
          <div className="relative">
            <div className="text-[12px] uppercase tracking-[.14em] font-bold text-brand-400">Don't want to wait?</div>
            <h3 className="mt-2 font-extrabold text-[1.6rem] md:text-[1.85rem] tracking-tight leading-tight">Spin up a self-serve account.</h3>
            <p className="mt-2 text-[14.5px] text-ink-300 leading-relaxed">
              If you'd rather wire authorize() + debit() yourself in 30 minutes, our self-serve builder console is live. We'll still help if you want us to.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link href="/build/signup" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink-950 bg-white hover:bg-ink-100 rounded-lg px-4 py-2.5 transition">
                Open builder console
              </Link>
              <Link href="/" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-white border border-white/30 hover:border-white/70 rounded-lg px-4 py-2.5 transition">
                Back to home
              </Link>
            </div>
          </div>
        </section>

        <p className="mt-10 text-[12px] text-ink-400 text-center mono">
          Submitted {new Date(app.createdAt).toLocaleString()} · keep this URL — it's your reference link
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

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[.12em] text-ink-500 font-bold">{label}</dt>
      <dd className={`mt-0.5 text-ink-950 ${mono ? 'mono text-[13px]' : 'font-bold'}`}>{value}</dd>
    </div>
  );
}
