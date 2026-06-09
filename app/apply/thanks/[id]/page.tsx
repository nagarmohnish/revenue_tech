import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Wallet, Receipt, Layers, ArrowRight, Check, Sparkles, Code2, Clock,
  TrendingUp, Users, DollarSign, Lightbulb, Copy as CopyIcon,
} from 'lucide-react';
import { loadApplication, savePlan } from '@/lib/applications/store';
import { generatePlan } from '@/lib/applications/generatePlan';
import { buildTemplatePlan } from '@/lib/applications/templatePlan';
import type {
  MonetizationPlan, PricingTier, RevenueScenario, IntegrationStep, NextAction,
  RecommendedMode,
} from '@/lib/applications/planTypes';
import { BILLING_LABELS, LIFECYCLE_LABELS } from '@/lib/applications/types';

export const dynamic = 'force-dynamic';

const MODE_ICON: Record<RecommendedMode, any> = {
  prepaid: Wallet,
  usage:   Receipt,
  hybrid:  Layers,
};

const MODE_LABEL: Record<RecommendedMode, string> = {
  prepaid: 'Prepaid credit wallet',
  usage:   'Usage-based invoicing',
  hybrid:  'Hybrid · prepaid + usage tier',
};

function money(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return `$${n.toLocaleString('en-US')}`;
}

export default async function PlanPage({ params }: { params: { id: string } }) {
  const app = await loadApplication(params.id);
  if (!app) notFound();

  // Plan may be missing on older applications, or if API generation failed.
  // Regenerate on-demand using the template (no Claude call here — keep page fast).
  let plan: MonetizationPlan;
  if (app.plan && (app.plan as any).headline) {
    plan = app.plan as MonetizationPlan;
  } else {
    plan = buildTemplatePlan({
      name: app.name, email: app.email, company: app.company,
      agentName: app.agentName, agentDesc: app.agentDesc,
      lifecycle: app.lifecycle, volumeEstimate: app.volumeEstimate,
      billingPref: app.billingPref, geography: app.geography, geographyOther: app.geographyOther,
      stack: app.stack, timeline: app.timeline, notes: app.notes,
    });
    // Best-effort: write the template back so refreshes are stable.
    try { await savePlan(app.id, plan, 'template'); } catch { /* ignore */ }
  }

  const ModeIcon = MODE_ICON[plan.recommendedMode];
  const firstName = app.name.split(' ')[0];

  return (
    <div className="min-h-screen bg-white text-ink-950 font-sans antialiased">

      {/* ─── HEADER ─── */}
      <header className="border-b border-ink-100 bg-white/95 backdrop-blur sticky top-0 z-20">
        <div className="wrap h-[64px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold text-ink-950">
            <span className="relative w-7 h-7 rounded-lg bg-ink-950 flex items-center justify-center">
              <Wallet size={14} className="text-brand-400" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-white" />
            </span>
            <span className="text-[1.05rem] tracking-tight">Agent<span className="text-brand-500">Mint</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-[12.5px] mono text-ink-500">Ref · {app.id.slice(0, 8)}</span>
            <Link href="/build/signup" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white bg-ink-950 hover:bg-ink-800 rounded-lg px-3.5 py-2 transition">
              Start building <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      <main className="wrap py-10 md:py-14 max-w-5xl">

        {/* ─── HERO ─── */}
        <section>
          <div className="flex items-center gap-2 text-[12px] uppercase tracking-[.14em] font-bold text-brand-700">
            <Sparkles size={12} /> Monetization plan · for {app.agentName}
          </div>
          <h1 className="mt-4 font-extrabold tracking-[-0.03em] leading-[1.02] text-[2.6rem] md:text-[3.4rem] balance">
            Hi {firstName} — <span className="text-brand-500">here's the plan.</span>
          </h1>
          <p className="mt-5 text-[1.08rem] text-ink-600 leading-[1.55] max-w-3xl">
            {plan.headline}
          </p>
          <p className="mt-4 text-[15px] text-ink-500 leading-relaxed max-w-3xl">
            {plan.reasoning}
          </p>

          {plan.generatedBy === 'template' && (
            <div className="mt-5 inline-flex items-center gap-2 text-[12px] px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
              <Lightbulb size={12} /> Plan generated from your inputs · we'll tune it personally before scoping
            </div>
          )}
        </section>

        {/* ─── RECOMMENDED MODE ─── */}
        <section className="mt-12">
          <div className="rounded-2xl border border-ink-950 bg-ink-950 text-white p-7 md:p-9 relative overflow-hidden">
            <div aria-hidden className="pointer-events-none absolute rounded-full" style={{ width: '24rem', height: '24rem', background: '#10a868', top: '-10rem', right: '-6rem', filter: 'blur(80px)', opacity: 0.35 }} />
            <div className="relative grid md:grid-cols-[auto_1fr] gap-7 md:gap-9 items-start">
              <span className="w-16 h-16 rounded-2xl bg-brand-500 text-ink-950 flex items-center justify-center flex-shrink-0">
                <ModeIcon size={28} strokeWidth={2.4} />
              </span>
              <div>
                <div className="text-[11px] uppercase tracking-[.16em] font-bold text-brand-400">Recommended billing mode</div>
                <h2 className="mt-2 font-extrabold text-[1.7rem] md:text-[2rem] tracking-tight leading-tight">
                  {MODE_LABEL[plan.recommendedMode]}
                </h2>
                <p className="mt-3 text-[15px] text-ink-300 leading-relaxed max-w-2xl">
                  {plan.modeJustification}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── PRICING TIERS ─── */}
        <section className="mt-14">
          <SectionHeader
            eyebrow="Suggested pricing"
            title={<>Three tiers, tuned for <span className="text-brand-500">{app.agentName}</span>.</>}
            description={`Mapped to ${BILLING_LABELS[app.billingPref].toLowerCase()} and ${LIFECYCLE_LABELS[app.lifecycle].toLowerCase()}. Move numbers around — these are starting points, not edicts.`}
          />

          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {plan.tiers.map((tier) => <TierCard key={tier.name} tier={tier} />)}
          </div>
        </section>

        {/* ─── PROJECTIONS ─── */}
        <section className="mt-14">
          <SectionHeader
            eyebrow="Revenue projections"
            title={<>If you ship this, here's the math.</>}
            description={plan.projections.note}
          />

          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <ScenarioCard scenario={plan.projections.pessimistic} tone="muted" />
            <ScenarioCard scenario={plan.projections.expected}    tone="accent" />
            <ScenarioCard scenario={plan.projections.optimistic}  tone="muted" />
          </div>

          <div className="mt-5 flex items-center gap-2 text-[12.5px] text-ink-500">
            <DollarSign size={13} className="text-brand-600" />
            ARPU <strong className="text-ink-800">${plan.projections.expected.arpu.toFixed(2)}</strong> blended across the three tiers. Real performance depends on your top-of-funnel and your conversion curve — these are anchors, not guarantees.
          </div>
        </section>

        {/* ─── INTEGRATION ─── */}
        <section className="mt-14">
          <SectionHeader
            eyebrow="Integration plan"
            title={<>~{plan.integration.estimatedHours}h of work. <span className="text-brand-500">Five steps.</span></>}
            description={`We targeted ${plan.integration.language === 'typescript' ? 'TypeScript' : plan.integration.language === 'python' ? 'Python' : 'Go'} based on your stack (${app.stack}). The code is ready to paste; swap in your real workspace ID and you're billing.`}
          />

          <div className="mt-8 grid lg:grid-cols-2 gap-6 items-start">
            <ol className="space-y-3">
              {plan.integration.steps.map((s, i) => <IntegrationStepCard key={i} idx={i + 1} step={s} />)}
            </ol>

            <div className="rounded-2xl overflow-hidden border border-ink-800 bg-ink-950 text-ink-50">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-ink-800">
                <span className="w-2.5 h-2.5 rounded-full bg-ink-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-ink-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-ink-700" />
                <span className="ml-3 mono text-[11.5px] text-ink-400">
                  {plan.integration.language === 'typescript' ? 'agent.ts' : plan.integration.language === 'python' ? 'agent.py' : 'agent.go'}
                </span>
                <span className="ml-auto text-[10.5px] mono text-brand-300 bg-ink-900 px-2 py-0.5 rounded">
                  {plan.integration.language === 'typescript' ? 'npm install @agentmint/sdk' : plan.integration.language === 'python' ? 'pip install agentmint' : 'go get …/agentmint-go'}
                </span>
              </div>
              <pre className="mono text-[12px] leading-[1.65] px-5 py-5 overflow-auto whitespace-pre"><code>{plan.integration.codeSnippet}</code></pre>
            </div>
          </div>
        </section>

        {/* ─── WHAT YOU TOLD US ─── */}
        <section className="mt-14 rounded-2xl border border-ink-100 bg-ink-50/50 p-6 md:p-7">
          <div className="text-[12px] uppercase tracking-[.14em] font-bold text-ink-500">What you told us</div>
          <div className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2.5 text-[13.5px]">
            <Detail label="Agent name"     value={app.agentName} />
            <Detail label="Lifecycle"      value={LIFECYCLE_LABELS[app.lifecycle]} />
            <Detail label="Stack"          value={app.stack} mono />
            <Detail label="Preferred mode" value={BILLING_LABELS[app.billingPref]} />
            <Detail label="Geography"      value={app.geography === 'other' && app.geographyOther ? app.geographyOther : app.geography.toUpperCase()} />
            <Detail label="Timeline"       value={app.timeline} />
          </div>
          <div className="mt-4 pt-4 border-t border-ink-200">
            <div className="text-[11px] uppercase tracking-[.14em] font-bold text-ink-500">What it does</div>
            <p className="mt-1 text-[14px] text-ink-700 leading-relaxed">{app.agentDesc}</p>
          </div>
        </section>

        {/* ─── NEXT ACTIONS ─── */}
        <section className="mt-14">
          <SectionHeader
            eyebrow="Next"
            title={<>Pick one of three.</>}
            description="No commitment to any of them. Pilot cohort is $0 while we harden Connect together — that's the only number that matters."
          />
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {plan.nextActions.slice(0, 3).map((a, i) => <NextActionCard key={i} action={a} highlighted={i === 0} />)}
          </div>
        </section>

        <p className="mt-14 text-[12px] text-ink-400 text-center mono">
          Generated {new Date(plan.generatedAt).toLocaleString()} · plan reference {app.id.slice(0, 8)} · share this URL freely
        </p>
      </main>
    </div>
  );
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: React.ReactNode; description?: string }) {
  return (
    <div className="max-w-2xl">
      <div className="text-[12px] uppercase tracking-[.14em] font-bold text-brand-700">{eyebrow}</div>
      <h2 className="mt-3 font-extrabold text-[1.8rem] md:text-[2.2rem] tracking-[-0.025em] leading-[1.1] balance">{title}</h2>
      {description && <p className="mt-3 text-[15px] text-ink-600 leading-relaxed">{description}</p>}
    </div>
  );
}

function TierCard({ tier }: { tier: PricingTier }) {
  return (
    <div className={`rounded-2xl p-6 flex flex-col relative ${tier.highlighted ? 'border-2 border-ink-950 bg-white shadow-lg' : 'border border-ink-100 bg-white'}`}>
      {tier.highlighted && (
        <span className="absolute -top-3 right-6 px-2.5 py-1 rounded-full bg-ink-950 text-white text-[10.5px] font-bold tracking-wider uppercase">
          Recommended
        </span>
      )}
      <div className="text-[12px] font-bold text-ink-500 uppercase tracking-[.12em]">{tier.name}</div>
      <div className="mt-3 flex items-baseline gap-1.5 flex-wrap">
        <span className="text-[2.2rem] font-extrabold tracking-tight tnum text-ink-950">{tier.price}</span>
        {tier.unit && <span className="text-[13.5px] text-ink-500">{tier.unit}</span>}
      </div>
      <p className="mt-2 text-[13px] text-ink-500 leading-snug">{tier.positioning}</p>
      <div className="mt-4 px-3 py-2 rounded-lg bg-ink-50 text-[12.5px] font-bold text-ink-700 inline-block self-start">
        {tier.allotment}
      </div>
      <ul className="mt-5 space-y-2 text-[13.5px] text-ink-700 flex-1">
        {tier.features.map((f, i) => (
          <li key={i} className="flex gap-2 items-start">
            <Check size={14} className="text-brand-600 mt-0.5 flex-shrink-0" strokeWidth={2.6} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScenarioCard({ scenario, tone }: { scenario: RevenueScenario; tone: 'accent' | 'muted' }) {
  const accent = tone === 'accent';
  return (
    <div className={`rounded-2xl p-6 ${accent ? 'bg-brand-50 border-2 border-brand-300' : 'bg-white border border-ink-100'}`}>
      <div className={`text-[11px] uppercase tracking-[.14em] font-bold ${accent ? 'text-brand-700' : 'text-ink-500'}`}>{scenario.label}</div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className={`text-[2.4rem] font-extrabold tracking-tight tnum ${accent ? 'text-ink-950' : 'text-ink-950'}`}>{money(scenario.mrr)}</span>
        <span className="text-[13.5px] text-ink-500">MRR</span>
      </div>
      <div className="text-[13px] text-ink-500 mt-0.5">{money(scenario.arr)} ARR</div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-[12px]">
        <div>
          <div className="flex items-center gap-1.5 uppercase tracking-wide text-ink-500 font-medium">
            <Users size={11} /> Customers
          </div>
          <div className="mt-1 font-extrabold tnum text-ink-950">{scenario.customers.toLocaleString()}</div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 uppercase tracking-wide text-ink-500 font-medium">
            <TrendingUp size={11} /> ARPU
          </div>
          <div className="mt-1 font-extrabold tnum text-ink-950">${scenario.arpu.toFixed(2)}</div>
        </div>
      </div>
      <p className="mt-4 text-[12px] text-ink-500 leading-relaxed">{scenario.assumption}</p>
    </div>
  );
}

function IntegrationStepCard({ idx, step }: { idx: number; step: IntegrationStep }) {
  return (
    <li className="flex gap-4 rounded-xl border border-ink-100 bg-white p-5">
      <span className="w-9 h-9 rounded-lg bg-ink-950 text-brand-400 font-extrabold flex items-center justify-center mono text-[13px] flex-shrink-0">
        {String(idx).padStart(2, '0')}
      </span>
      <div>
        <div className="font-bold text-ink-950 tracking-tight">{step.title}</div>
        <p className="mt-1 text-[13.5px] text-ink-600 leading-relaxed">{step.description}</p>
      </div>
    </li>
  );
}

function NextActionCard({ action, highlighted }: { action: NextAction; highlighted?: boolean }) {
  const Wrapper: any = action.href ? Link : 'div';
  const wrapperProps: any = action.href ? { href: action.href } : {};
  return (
    <Wrapper {...wrapperProps} className={`rounded-2xl p-6 flex flex-col h-full transition ${highlighted ? 'border-2 border-ink-950 bg-white' : 'border border-ink-100 bg-white hover:border-ink-300'}`}>
      <div className="text-[11px] uppercase tracking-[.14em] font-bold text-brand-700">Action</div>
      <h3 className="mt-2 font-bold text-ink-950 text-[1.05rem] tracking-tight leading-snug">{action.title}</h3>
      <p className="mt-2 text-[13.5px] text-ink-600 leading-relaxed flex-1">{action.description}</p>
      <div className={`mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold rounded-lg px-3.5 py-2 transition self-start ${
        highlighted ? 'bg-ink-950 text-white' : 'bg-white text-ink-800 border border-ink-200'
      }`}>
        {action.cta} <ArrowRight size={13} />
      </div>
    </Wrapper>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-baseline gap-3">
      <span className="text-ink-500">{label}</span>
      <span className={`text-ink-950 font-bold text-right ${mono ? 'mono text-[12.5px] font-medium' : ''}`}>{value}</span>
    </div>
  );
}
