import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Boxes, CheckCircle2, CircleDashed, CreditCard, KeyRound, TerminalSquare, ArrowRight, Activity } from 'lucide-react';
import { BuilderShell } from '@/components/BuilderShell';
import { getBuilderSession } from '@/lib/builderAuth';
import { supabaseConfigured } from '@/lib/supabase';
import { tenantOnboardingState } from '@/lib/builder';

export default async function BuilderOverview() {
  if (!supabaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-12 text-center">
        <div>
          <h1 className="font-sans font-extrabold text-2xl text-ink-950">Supabase not configured</h1>
          <p className="mt-2 text-ink-500">Set your env vars and apply <code className="font-mono text-ink-800">supabase/migrations/0001_init.sql</code> and <code className="font-mono text-ink-800">0002_agency_multi_tenant.sql</code>.</p>
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
      cta: s.hasStripe ? 'Connected' : 'Connect (coming soon)',
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

  const completed = steps.filter((s) => s.done).length;

  return (
    <BuilderShell accountName={s.tenant.name} accountSlug={s.tenant.slug}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[.72rem] uppercase tracking-[.14em] text-brand-600 font-bold">Overview</div>
          <h1 className="font-sans font-extrabold text-[2rem] tracking-tight text-ink-950 mt-1">
            One wallet, <span className="text-brand-500">every agent.</span>
          </h1>
          <p className="text-ink-500 text-[15px] mt-1.5">
            Your account is live. Walk through the four steps below to wire up your suite. Stripe Connect (USD) ships first, INR/UPI/GST is next on the build queue.
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-7 card p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[12px] text-ink-500 font-medium">Onboarding</div>
            <div className="font-bold text-ink-950 mt-0.5">{completed} of {steps.length} complete</div>
          </div>
          <div className="text-sm text-ink-500">Account ID <span className="font-mono text-ink-800">{s.tenant.id.slice(0, 8)}…</span></div>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-ink-100 overflow-hidden">
          <div className="h-full bg-brand-500 transition-all duration-700" style={{ width: `${(completed / steps.length) * 100}%` }} />
        </div>
      </div>

      {/* Steps grid */}
      <section className="mt-6 grid sm:grid-cols-2 gap-4">
        {steps.map((step, i) => (
          <Link
            key={i}
            href={step.href}
            className={`card p-5 flex flex-col gap-3 transition ${
              step.done ? 'border-brand-200 bg-brand-50/30' : 'hover:border-ink-300'
            } ${step.disabled ? 'opacity-70' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                step.done ? 'bg-brand-500 text-white' : 'bg-ink-50 text-ink-700'
              }`}>
                <step.icon size={18} />
              </div>
              {step.done ? (
                <CheckCircle2 size={18} className="text-brand-500" />
              ) : (
                <CircleDashed size={18} className="text-ink-300" />
              )}
            </div>
            <div>
              <div className="font-bold text-ink-950">{step.title}</div>
              <div className="mt-0.5 text-[13.5px] text-ink-500 leading-relaxed">{step.desc}</div>
            </div>
            <div className="mt-auto flex items-center gap-1.5 text-[13px] font-semibold text-brand-600">
              {step.cta} <ArrowRight size={14} />
            </div>
          </Link>
        ))}
      </section>

      {/* Quick stats */}
      <section className="mt-8">
        <h2 className="text-[.72rem] uppercase tracking-[.14em] text-ink-400 font-bold">Activity</h2>
        <div className="mt-3 card p-5 flex items-center gap-3">
          <Activity size={18} className="text-ink-400" />
          {s.hasFirstCall ? (
            <p className="text-sm text-ink-600">
              <span className="font-mono text-ink-900">{s.firstCallCount}</span> agent calls billed so far on this account.{' '}
              <Link href="/build/revenue" className="text-brand-600 font-semibold hover:underline">View revenue →</Link>
            </p>
          ) : (
            <p className="text-sm text-ink-500">
              No agent calls yet. Once you register an agent, generate a key, and call <span className="font-mono text-ink-800">authorize()</span> + <span className="font-mono text-ink-800">debit()</span>, you will see live events here.
            </p>
          )}
        </div>
      </section>
    </BuilderShell>
  );
}
