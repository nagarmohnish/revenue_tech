import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Boxes, CheckCircle2, CircleDashed, CreditCard, KeyRound, TerminalSquare,
  ArrowRight, Activity, Sparkles,
} from 'lucide-react';
import { BuilderShell } from '@/components/BuilderShell';
import { Card, EmptyState, InfoBanner, Stat, PageHeader, Eyebrow, SectionHeader, Badge, LinkButton } from '@/components/ui';
import { getBuilderSession } from '@/lib/builderAuth';
import { supabaseConfigured } from '@/lib/supabase';
import { tenantOnboardingState } from '@/lib/builder';

export default async function BuilderOverview() {
  if (!supabaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-12 text-center">
        <div>
          <h1 className="font-extrabold text-2xl text-ink-950">Supabase not configured</h1>
          <p className="mt-2 text-ink-500">Set your env vars and apply <code className="font-mono text-ink-800">0001_init.sql</code> and <code className="font-mono text-ink-800">0002_agency_multi_tenant.sql</code>.</p>
        </div>
      </div>
    );
  }
  const session = await getBuilderSession();
  if (!session) redirect('/build/signup');

  const s = await tenantOnboardingState(session.tenantId);

  const steps = [
    {
      done: s.hasAgent,
      icon: Boxes,
      title: 'Register your first agent',
      desc: 'Add your agents and their actions to the registry.',
      href: '/build/agents',
      cta: s.hasAgent ? `${s.agentCount} registered` : 'Add agent',
    },
    {
      done: s.hasApiKey,
      icon: KeyRound,
      title: 'Generate an API key',
      desc: 'Used by your SDK calls to authorize() and debit().',
      href: '/build/api-keys',
      cta: s.hasApiKey ? `${s.keyCount} active` : 'Generate key',
    },
    {
      done: s.hasStripe,
      icon: CreditCard,
      title: 'Connect Stripe',
      desc: 'Your customers pay through your Stripe account via Stripe Connect.',
      href: '/build/stripe',
      cta: s.hasStripe ? 'Connected' : 'Coming soon',
      disabled: !s.hasStripe,
    },
    {
      done: s.hasFirstCall,
      icon: TerminalSquare,
      title: 'Ship your first call',
      desc: 'Wrap an agent route with authorize() + debit(). The first event lands here.',
      href: '/build/integration',
      cta: s.hasFirstCall ? `${s.firstCallCount} calls` : 'Open docs',
    },
  ];

  const completed = steps.filter((step) => step.done).length;
  const pct = Math.round((completed / steps.length) * 100);

  return (
    <BuilderShell accountName={s.tenant.name} accountSlug={s.tenant.slug}>

      <PageHeader
        eyebrow={<Eyebrow icon={<Sparkles size={11} />}>Overview</Eyebrow>}
        title={<>One wallet, <span className="text-brand-500">every agent.</span></>}
        description="Your account is live. Walk the four steps below to wire your suite. USD via Stripe Connect ships first; INR / UPI / GST settlement lands next."
      />

      {/* Quick stats */}
      <section className="mt-8 grid sm:grid-cols-3 gap-3">
        <Stat label="Agents" value={s.agentCount} />
        <Stat label="API keys" value={s.keyCount} />
        <Stat label="Calls billed" value={s.firstCallCount.toLocaleString()} />
      </section>

      {/* Onboarding progress */}
      <Card padding="md" className="mt-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[.14em] text-ink-500 font-bold">Onboarding</div>
            <div className="mt-0.5 font-extrabold text-ink-950 text-[1.05rem]">{completed} of {steps.length} complete <span className="text-ink-400 text-[14px] font-normal">· {pct}%</span></div>
          </div>
          <Badge tone="mono">Account · {s.tenant.id.slice(0, 8)}</Badge>
        </div>
        <div className="mt-4 h-2 rounded-full bg-ink-100 overflow-hidden">
          <div className="h-full bg-brand-500 transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
      </Card>

      {/* Onboarding steps */}
      <section className="mt-6 grid sm:grid-cols-2 gap-3">
        {steps.map((step, i) => (
          <Link
            key={i}
            href={step.href}
            className={`group rounded-2xl border transition p-5 flex flex-col gap-3 ${
              step.done ? 'border-brand-200 bg-brand-50/30' : 'border-ink-100 bg-white hover:border-ink-300'
            } ${step.disabled ? 'opacity-70' : ''}`}
          >
            <div className="flex items-start justify-between">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                step.done ? 'bg-brand-500 text-white' : 'bg-ink-50 text-ink-700'
              }`}>
                <step.icon size={18} />
              </span>
              {step.done ? <CheckCircle2 size={18} className="text-brand-500" /> : <CircleDashed size={18} className="text-ink-300" />}
            </div>
            <div>
              <div className="font-bold text-ink-950 tracking-tight">{step.title}</div>
              <div className="mt-1 text-[13.5px] text-ink-500 leading-relaxed">{step.desc}</div>
            </div>
            <div className="mt-auto inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-700">
              {step.cta} <ArrowRight size={13} className="group-hover:translate-x-0.5 transition" />
            </div>
          </Link>
        ))}
      </section>

      {/* Activity */}
      <section className="mt-10">
        <SectionHeader
          eyebrow={<Eyebrow icon={<Activity size={11} />}>Activity</Eyebrow>}
          title={s.hasFirstCall ? 'Recent activity' : 'No activity yet'}
        />
        <Card padding="md" className="mt-4">
          {s.hasFirstCall ? (
            <p className="text-[14px] text-ink-700">
              <span className="font-mono text-ink-950 font-bold">{s.firstCallCount.toLocaleString()}</span> agent calls billed so far on this account.{' '}
              <Link href="/build/revenue" className="text-brand-700 font-semibold hover:underline">View revenue →</Link>
            </p>
          ) : (
            <p className="text-[14px] text-ink-500">
              No agent calls yet. Once you register an agent, generate a key, and call <code className="mono text-ink-800">authorize()</code> + <code className="mono text-ink-800">debit()</code>, you'll see live events here.
            </p>
          )}
        </Card>
      </section>

      {/* Helper */}
      {!s.hasFirstCall && (
        <div className="mt-6">
          <InfoBanner
            tone="info"
            icon={<Sparkles size={14} />}
            title="Need help wiring it up?"
            action={{ label: 'Open intake', href: '/apply' }}
          >
            We have a free concierge intake that produces a personalized Monetization Plan in 10 seconds.
          </InfoBanner>
        </div>
      )}
    </BuilderShell>
  );
}
