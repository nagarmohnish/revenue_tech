import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadReport } from '@/lib/stackscore/store';
import type { DimensionKey, FlowStep, StepClass, StepFinding, Suggestion, TerminalReason } from '@/lib/stackscore/types';

export const dynamic = 'force-dynamic';

const DIM_LABEL: Record<DimensionKey, string> = {
  brevity:      'Brevity',
  clarity:      'Clarity',
  transparency: 'Cost transparency',
  trust:        'Trust',
};

const STEP_CLASS_LABEL: Record<StepClass, string> = {
  landing:     'Landing',
  pricing:     'Pricing',
  plan_detail: 'Plan',
  signup:      'Signup',
  checkout:    'Checkout',
  payment:     'Payment',
  success:     'Success',
  auth_wall:   'Auth wall',
  error:       'Error',
  unknown:     'Step',
};

const STEP_CLASS_COLOR: Record<StepClass, string> = {
  landing:     'bg-ink-100 text-ink-700',
  pricing:     'bg-brand-500/15 text-brand-700',
  plan_detail: 'bg-brand-500/15 text-brand-700',
  signup:      'bg-amber-100 text-amber-700',
  checkout:    'bg-amber-100 text-amber-700',
  payment:     'bg-coral-400/15 text-coral-600',
  success:     'bg-brand-500 text-white',
  auth_wall:   'bg-coral-400/15 text-coral-600',
  error:       'bg-coral-400/15 text-coral-600',
  unknown:     'bg-ink-100 text-ink-700',
};

const TERMINAL_LABEL: Record<TerminalReason, string> = {
  completed:          'Walk completed normally',
  auth_wall:          'Stopped at an auth wall',
  payment_reached:    'Reached a payment form',
  external_redirect:  'Redirected to an external payment provider',
  success_page:       'Reached a success/confirmation page',
  max_steps:          'Hit the max-step limit (funnel may continue)',
  loop:               'Flow looped back on itself',
  no_progress:        'No further purchase-intent CTA found',
  navigation_error:   'Navigation error',
};

function gradeBand(score: number): string {
  if (score >= 85) return 'Best in class';
  if (score >= 70) return 'Solid';
  if (score >= 55) return 'Mid-pack';
  return 'Below average';
}

export default async function ReportPage({ params }: { params: { id: string } }) {
  const report = await loadReport(params.id);
  if (!report) notFound();

  const youRow = { name: report.hostname || 'You', steps: report.steps.length, score: report.score, you: true };
  const ranked = [
    ...report.benchmarks.map((b) => ({ name: b.name, steps: b.steps, score: b.score, you: false, signature: b.signature, highlight: b.highlight })),
    youRow,
  ].sort((a, b) => b.score - a.score);

  const ruleSuggestions = report.suggestions.filter((s) => s.source === 'rule');
  const aiSuggestions   = report.suggestions.filter((s) => s.source === 'ai');

  return (
    <div className="min-h-screen bg-white text-ink-950">
      <header className="border-b border-ink-100 bg-white/95 backdrop-blur sticky top-0 z-20">
        <div className="wrap h-16 flex items-center justify-between">
          <Link href="/stackscore" className="flex items-center gap-2.5 font-extrabold text-ink-950">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="24" height="24" rx="7" fill="#10a868"/>
              <circle cx="14" cy="14" r="6" stroke="#fff" strokeWidth="1.9" fill="none"/>
              <path d="M14 10.2v7.6M11.6 12.6h4.8M11.6 15.4h4.8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            StackScore
          </Link>
          <div className="flex items-center gap-4 text-[.86rem]">
            <Link href="/stackscore" className="text-ink-600 hover:text-ink-950">Walk another</Link>
            <Link href="/build/signup" className="inline-flex items-center gap-1.5 font-semibold text-white bg-ink-950 hover:bg-ink-800 rounded-lg px-3.5 py-2 transition">
              Build billing with AgentMint
            </Link>
          </div>
        </div>
      </header>

      <main className="wrap py-12 md:py-16">

        {/* ─── HERO ─── */}
        <section className="grid md:grid-cols-[1fr_220px] gap-8 items-start">
          <div>
            <div className="text-[12px] uppercase tracking-[.14em] font-bold text-brand-700">Funnel report</div>
            <h1 className="font-extrabold text-[2.2rem] md:text-[2.6rem] leading-[1.05] tracking-tight mt-3 balance">
              {report.hostname ? (
                <>Score for <span className="text-brand-500">{report.hostname}</span></>
              ) : (
                <>Walk report</>
              )}
            </h1>
            <a href={report.startUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[.86rem] mono text-ink-500 hover:text-ink-800">
              {report.startUrl} ↗
            </a>
            <p className="mt-4 text-[1.02rem] text-ink-600 leading-relaxed max-w-2xl">
              We walked <strong className="text-ink-950">{report.steps.length} step{report.steps.length === 1 ? '' : 's'}</strong> in <strong className="text-ink-950">{Math.round(report.durationMs / 100) / 10}s</strong>.{' '}
              {TERMINAL_LABEL[report.terminatedReason]}. You sit at <strong className="text-ink-950">#{report.rank.position}</strong> of {report.rank.total}, closest to <strong className="text-ink-950">{report.rank.closestTo}</strong>.
            </p>
          </div>

          <div className="flex justify-center md:justify-end">
            <div className="relative w-44 h-44 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="44" fill="none" stroke="#eef4f1" strokeWidth="10" />
                <circle cx="50" cy="50" r="44" fill="none" stroke="#10a868" strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={`${(report.score / 100) * 276.46} 276.46`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[2.8rem] font-extrabold tracking-tight tnum text-ink-950">{report.score}</div>
                <div className="text-[10.5px] uppercase tracking-[.14em] text-brand-700 font-bold mt-0.5">{gradeBand(report.score)}</div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── DIMENSIONS ─── */}
        <section className="mt-12 grid md:grid-cols-4 gap-4">
          {report.dimensions.map((d) => {
            const pct = Math.round((d.points / d.max) * 100);
            return (
              <div key={d.key} className="rounded-2xl p-5 border border-brand-100 bg-brand-50/40">
                <div className="text-[11px] uppercase tracking-[.14em] font-bold text-brand-700">{d.label}</div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-[2rem] font-extrabold tnum text-ink-950">{d.points}</span>
                  <span className="text-[.85rem] text-ink-500">/ {d.max}</span>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-white/70 overflow-hidden">
                  <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-3 text-[.78rem] text-ink-500 leading-relaxed">{d.detail}</p>
              </div>
            );
          })}
        </section>

        {/* ─── FLOW TIMELINE ─── */}
        <section className="mt-14">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
            <h2 className="font-extrabold text-[1.4rem] tracking-tight">The walk · step by step</h2>
            <span className={`chip !text-[11px] ${report.terminatedReason === 'payment_reached' || report.terminatedReason === 'success_page' || report.terminatedReason === 'completed' ? '!bg-brand-50 !text-brand-700 !border-brand-200' : '!bg-coral-400/10 !text-coral-600 !border-coral-400/30'}`}>
              {TERMINAL_LABEL[report.terminatedReason]}
            </span>
          </div>
          <p className="text-[.92rem] text-ink-500 mb-5">Every page we landed on. Click a screenshot to view it full-size.</p>

          {/* Horizontal flow chip row */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {report.steps.map((s, i) => (
              <FlowChip key={i} step={s} isLast={i === report.steps.length - 1} />
            ))}
          </div>

          {/* Step cards */}
          <div className="space-y-5">
            {report.steps.map((step) => (
              <StepCard key={step.index} step={step} findings={report.findings.filter((f) => f.stepIndex === step.index)} />
            ))}
          </div>
        </section>

        {/* ─── BENCHMARKS ─── */}
        <section className="mt-14">
          <h2 className="font-extrabold text-[1.4rem] tracking-tight">Where you sit</h2>
          <p className="text-[.92rem] text-ink-500 mt-1">Calibrated reference funnels. Step count is part of the story — not the whole of it.</p>
          <div className="mt-5 card divide-y divide-ink-100">
            {ranked.map((row, idx) => (
              <div key={row.name + idx} className={`grid grid-cols-[28px_1fr_60px_140px_50px] items-center gap-4 px-5 py-3.5 ${row.you ? 'bg-brand-50/50' : ''}`}>
                <div className="text-[.85rem] mono text-ink-400 tnum">#{idx + 1}</div>
                <div className="min-w-0">
                  <div className={`font-bold text-[.95rem] truncate ${row.you ? 'text-brand-700' : 'text-ink-950'}`}>
                    {row.you ? `${row.name} (you)` : row.name}
                  </div>
                  {!row.you && (row as any).signature && (
                    <div className="text-[.74rem] mono text-ink-500 mt-0.5 truncate">{(row as any).signature}</div>
                  )}
                </div>
                <div className="text-[.78rem] mono text-ink-500 tnum">{row.steps} steps</div>
                <div className="hidden sm:block">
                  <div className="h-1.5 rounded-full bg-ink-100 overflow-hidden">
                    <div className={`h-full ${row.you ? 'bg-brand-500' : 'bg-ink-400'}`} style={{ width: `${row.score}%` }} />
                  </div>
                </div>
                <div className="text-right font-extrabold tnum text-ink-950">{row.score}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── AI SUGGESTIONS ─── */}
        {aiSuggestions.length > 0 && (
          <section className="mt-14">
            <div className="flex items-center gap-3">
              <h2 className="font-extrabold text-[1.4rem] tracking-tight">Contextual suggestions</h2>
              <span className="chip !text-[10.5px] !bg-brand-50 !text-brand-700 !border-brand-200">via Claude</span>
            </div>
            <p className="text-[.92rem] text-ink-500 mt-1">Things the rules can't see, based on the interaction between steps.</p>
            <div className="mt-5 grid md:grid-cols-3 gap-4">
              {aiSuggestions.map((s, i) => <SuggestionCard key={'ai' + i} s={s} steps={report.steps} />)}
            </div>
          </section>
        )}

        {/* ─── RULE SUGGESTIONS ─── */}
        {ruleSuggestions.length > 0 && (
          <section className="mt-14">
            <h2 className="font-extrabold text-[1.4rem] tracking-tight">Fixes, in order of leverage</h2>
            <p className="text-[.92rem] text-ink-500 mt-1">Each pattern we detected turns into a concrete action.</p>
            <div className="mt-5 grid md:grid-cols-2 gap-4">
              {ruleSuggestions.map((s, i) => <SuggestionCard key={'r' + i} s={s} steps={report.steps} />)}
            </div>
          </section>
        )}

        {/* ─── CTA back to AgentMint ─── */}
        <section className="mt-20 mb-10 rounded-2xl bg-ink-950 text-white p-8 md:p-12 relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute rounded-full" style={{ width: '24rem', height: '24rem', background: '#10a868', top: '-10rem', right: '-6rem', filter: 'blur(80px)', opacity: 0.32 }} />
          <div className="relative max-w-2xl">
            <div className="text-[12px] uppercase tracking-[.14em] font-bold text-brand-400">When you ship AI agents next</div>
            <h2 className="font-extrabold text-[1.75rem] md:text-[2rem] tracking-tight mt-2 leading-tight balance">
              Skip building the billing funnel. AgentMint hands you one.
            </h2>
            <p className="mt-3 text-[.96rem] text-ink-300 leading-relaxed">
              One credit wallet for every agent you ship. Three SDKs. Five payment rails — Stripe, PayPal, Razorpay, Apple Pay, UPI. Pilot is $0.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/build/signup" className="inline-flex items-center gap-1.5 text-[.92rem] font-semibold text-ink-950 bg-white hover:bg-ink-100 rounded-lg px-5 py-3 transition">
                Start building
              </Link>
              <Link href="/stackscore" className="inline-flex items-center gap-1.5 text-[.92rem] font-semibold text-white border border-white/30 hover:border-white/70 rounded-lg px-5 py-3 transition">
                Walk another funnel
              </Link>
            </div>
          </div>
        </section>

        <div className="text-[12px] text-ink-400 mono">
          Generated {new Date(report.generatedAt).toLocaleString()} · share this URL — no login required
        </div>
      </main>
    </div>
  );
}

function FlowChip({ step, isLast }: { step: FlowStep; isLast: boolean }) {
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <div className="flex flex-col items-center gap-1.5">
        <div className="mono text-[10.5px] text-ink-400">step {step.index + 1}</div>
        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-[.06em] whitespace-nowrap ${STEP_CLASS_COLOR[step.classification]}`}>
          {STEP_CLASS_LABEL[step.classification]}
        </span>
        {step.clickedCtaText && !isLast && (
          <div className="text-[10.5px] mono text-ink-500 max-w-[140px] truncate" title={step.clickedCtaText}>→ "{step.clickedCtaText}"</div>
        )}
      </div>
      {!isLast && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c2d2cb" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 self-center"><polyline points="9 18 15 12 9 6"/></svg>}
    </div>
  );
}

function StepCard({ step, findings }: { step: FlowStep; findings: StepFinding[] }) {
  const sig = step.signals;
  return (
    <div className="card overflow-hidden">
      <div className="grid md:grid-cols-[280px_1fr]">
        {/* Screenshot */}
        <a href={`data:image/jpeg;base64,${step.screenshotBase64}`} target="_blank" rel="noreferrer" className="block bg-ink-100 hover:opacity-90 transition">
          <img
            src={`data:image/jpeg;base64,${step.screenshotBase64}`}
            alt={`Step ${step.index + 1}`}
            className="w-full h-full object-cover object-top"
            loading="lazy"
          />
        </a>

        {/* Detail */}
        <div className="p-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="mono text-[10.5px] text-ink-400 tnum">STEP {step.index + 1}</span>
            <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wider ${STEP_CLASS_COLOR[step.classification]}`}>
              {STEP_CLASS_LABEL[step.classification]}
            </span>
            {step.terminalReason && (
              <span className="px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wider bg-ink-100 text-ink-700">
                Terminal · {step.terminalReason.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          <h3 className="mt-2 font-extrabold text-ink-950 tracking-tight text-[1.05rem] truncate">{step.title || 'Untitled'}</h3>
          <a href={step.url} target="_blank" rel="noreferrer" className="mono text-[.78rem] text-ink-500 hover:text-ink-800 truncate block">{step.url}</a>

          {/* Signals grid */}
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[.82rem]">
            <SignalRow label="Primary CTA" value={sig.primaryCtaText || '—'} mono />
            <SignalRow label="CTA count" value={String(sig.ctaCount)} />
            <SignalRow label="Form fields" value={`${sig.formFieldCount}${sig.requiredFieldCount ? ` · ${sig.requiredFieldCount} required` : ''}`} />
            <SignalRow label="Load time" value={`${Math.round(sig.loadTimeMs / 100) / 10}s`} />
            <SignalRow label="Prices seen" value={sig.pricePoints.length ? sig.pricePoints.slice(0, 4).map((p) => `${sig.currencySymbols[0] || '$'}${p}`).join(' · ') : '—'} mono />
            <SignalRow label="Payment methods" value={sig.paymentMethods.length ? sig.paymentMethods.join(' · ') : '—'} />
            <SignalRow label="Card field" value={sig.hasCardField ? 'yes' : 'no'} highlight={sig.hasCardField ? 'coral' : undefined} />
            <SignalRow label="Auth fields" value={sig.hasPasswordField ? 'email + password' : sig.hasEmailField ? 'email' : 'none'} />
            <SignalRow label="Security signal" value={sig.hasSecurityBadges ? 'yes' : 'no'} highlight={sig.hasSecurityBadges ? 'good' : undefined} />
            <SignalRow label="Cancel anytime" value={sig.hasGuarantee ? 'yes' : 'no'} highlight={sig.hasGuarantee ? 'good' : undefined} />
          </dl>

          {step.clickedCtaText && (
            <div className="mt-4 pt-4 border-t border-ink-100 flex items-center gap-2 text-[.82rem]">
              <span className="text-ink-500">Next step opened by clicking</span>
              <span className="mono font-bold text-ink-950">"{step.clickedCtaText}"</span>
            </div>
          )}

          {findings.length > 0 && (
            <div className="mt-4 pt-4 border-t border-ink-100 space-y-2">
              {findings.map((f, i) => (
                <div key={i} className={`text-[.82rem] flex items-start gap-2 ${f.severity === 'bad' ? 'text-coral-600' : f.severity === 'warn' ? 'text-amber-700' : 'text-brand-700'}`}>
                  <span className="font-bold">{f.severity === 'bad' ? '✕' : f.severity === 'warn' ? '!' : '✓'}</span>
                  <div>
                    <span className="font-bold">{f.title}.</span>{' '}
                    <span className="text-ink-600">{f.body}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SignalRow({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: 'good' | 'coral' }) {
  return (
    <>
      <dt className="text-ink-500">{label}</dt>
      <dd className={`text-ink-950 ${mono ? 'mono text-[.78rem] truncate' : 'font-bold'} ${highlight === 'good' ? '!text-brand-700' : ''} ${highlight === 'coral' ? '!text-coral-600' : ''}`}>{value}</dd>
    </>
  );
}

function SuggestionCard({ s, steps }: { s: Suggestion; steps: FlowStep[] }) {
  const stepLabel = typeof s.stepIndex === 'number' && steps[s.stepIndex]
    ? `Step ${s.stepIndex + 1} · ${STEP_CLASS_LABEL[steps[s.stepIndex].classification]}`
    : 'Whole flow';
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <div className="text-[10.5px] uppercase tracking-[.14em] font-bold text-brand-700">{DIM_LABEL[s.dimension]}</div>
        {s.source === 'ai' && <span className="text-[10px] mono text-brand-600">claude</span>}
        <span className="ml-auto text-[10.5px] mono text-ink-400">{stepLabel}</span>
      </div>
      <div className="mt-2 font-extrabold text-ink-950 text-[1.02rem] tracking-tight">{s.title}</div>
      <p className="mt-2 text-[.86rem] text-ink-600 leading-relaxed">{s.body}</p>
      {s.exemplar && (
        <div className="mt-3 pt-3 border-t border-ink-100 text-[.78rem]">
          <span className="font-bold text-ink-800">{s.exemplar.company}:</span>
          <span className="text-ink-500 ml-1.5">{s.exemplar.note}</span>
        </div>
      )}
    </div>
  );
}
