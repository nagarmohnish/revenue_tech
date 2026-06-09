import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import {
  Card, EmptyState, Stat, PageHeader, Eyebrow, SectionHeader, Badge,
  LinkButton, InfoBanner,
} from '@/components/ui';
import { getSession } from '@/lib/auth';
import { walletSummary, getAllTools, recentUsage } from '@/lib/billing';
import { supabaseConfigured } from '@/lib/supabase';
import { PLANS, planMeetsRequirement, Plan } from '@/lib/plans';
import {
  ArrowRight, Lock, Search, Sparkles, Wand2, Wallet, TrendingDown, Calendar,
  Activity, Zap,
} from 'lucide-react';

const AGENT_ICON: Record<string, any> = {
  scanner: Search, blog_writer: Wand2, content_studio: Sparkles,
  postflwo: Wand2, bekbone: Sparkles, aeo_optimizer: Search,
};
const AGENT_HREF: Record<string, string> = {
  scanner: '/agents/scanner', blog_writer: '/agents/blog-writer', content_studio: '/agents/content-studio',
  postflwo: '/agents/locked?p=postflwo', bekbone: '/agents/locked?p=bekbone', aeo_optimizer: '/agents/locked?p=aeo_optimizer',
};

export default async function DashboardPage() {
  if (!supabaseConfigured()) return <SetupPrompt />;
  const session = await getSession();
  if (!session) redirect('/login');

  const [wallet, tools, recent] = await Promise.all([
    walletSummary(session.workspaceId),
    getAllTools(),
    recentUsage(session.workspaceId, 10),
  ]);
  const plan = wallet.plan as Plan;
  const planLimit = PLANS[plan].credits;
  const pct = planLimit > 0 ? Math.min(100, (wallet.balance / planLimit) * 100) : 0;
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <AppShell workspaceName={wallet.workspaceName} email={session.email} balance={wallet.balance}>

      <PageHeader
        eyebrow={<Eyebrow icon={<Wallet size={11} />}>Workspace</Eyebrow>}
        title={wallet.workspaceName}
        description={<>You're on the <strong className="text-ink-950">{planLabel}</strong> plan · {planLimit.toLocaleString()} credits per period.</>}
        actions={
          <>
            <LinkButton href="/billing/topup" variant="primary" iconLeft={<Zap size={13} />}>Top up +500 · $9</LinkButton>
            {plan !== 'growth' && plan !== 'scale' && (
              <LinkButton href="/billing/upgrade" variant="secondary">Upgrade</LinkButton>
            )}
          </>
        }
      />

      {/* Wallet — hero card */}
      <Card padding="lg" className="mt-8 relative overflow-hidden">
        <div aria-hidden className="absolute inset-y-0 right-0 w-1/2 pointer-events-none" style={{ background: 'radial-gradient(60% 80% at 80% 50%, rgba(16,168,104,.07), transparent 70%)' }} />
        <div className="relative grid md:grid-cols-[1.4fr_1fr] gap-6 items-center">
          <div>
            <div className="text-[11px] uppercase tracking-[.14em] font-bold text-brand-700">Wallet balance</div>
            <div className="mt-2 flex items-baseline gap-2.5 flex-wrap">
              <span className="text-[3.6rem] leading-none font-extrabold tracking-tight tnum text-ink-950">{wallet.balance.toLocaleString()}</span>
              <span className="text-ink-500 font-medium">credits</span>
            </div>
            <div className="mt-5 h-2.5 rounded-full bg-ink-100 overflow-hidden max-w-md">
              <div className="h-full bg-brand-500 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between max-w-md text-[11.5px] mono text-ink-400">
              <span>0</span>
              <span>{Math.round(pct)}% remaining</span>
              <span>{planLimit.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-ink-100 p-3">
              <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[.12em] font-bold text-ink-500">
                <TrendingDown size={11} /> 7-day burn
              </div>
              <div className="mt-1.5 font-extrabold tnum text-ink-950 text-[1.4rem]">{Math.round(wallet.burnRate7d)}<span className="text-[12px] text-ink-400 font-normal"> / day</span></div>
            </div>
            <div className="rounded-xl border border-ink-100 p-3">
              <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[.12em] font-bold text-ink-500">
                <Calendar size={11} /> Days left
              </div>
              <div className="mt-1.5 font-extrabold tnum text-ink-950 text-[1.4rem]">~{wallet.projectedDays}</div>
            </div>
            <div className="rounded-xl border border-ink-100 p-3 col-span-2">
              <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[.12em] font-bold text-ink-500">Plan</div>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="font-extrabold text-ink-950">{planLabel}</span>
                <Badge tone="brand">{planLimit.toLocaleString()} / period</Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Agents */}
      <section className="mt-10">
        <SectionHeader
          eyebrow={<Eyebrow icon={<Sparkles size={11} />}>Agents</Eyebrow>}
          title="Your suite"
          description="All available agents · one balance"
        />
        <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tools.map((t) => {
            const Icon = AGENT_ICON[t.product_id] || Sparkles;
            const planOk = planMeetsRequirement(plan, t.available_on);
            const locked = !planOk || !t.integrated;
            const href = AGENT_HREF[t.product_id] || '/agents/locked';
            return (
              <Link key={t.product_id} href={href} className={`group rounded-2xl border bg-white p-5 transition flex flex-col ${locked ? 'border-ink-100 opacity-90 hover:opacity-100' : 'border-ink-100 hover:border-ink-300'}`}>
                <div className="flex items-start justify-between">
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${locked ? 'bg-ink-50 text-ink-500' : 'bg-brand-500/10 text-brand-700'}`}>
                    <Icon size={18} />
                  </span>
                  {locked ? (
                    <Badge tone="amber" icon={<Lock size={10} />}>{!planOk ? 'Upgrade' : 'Coming'}</Badge>
                  ) : (
                    <Badge tone="brand">Live</Badge>
                  )}
                </div>
                <div className="mt-4">
                  <div className="font-bold text-ink-950 tracking-tight">{t.display_name}</div>
                  <div className="text-[11.5px] text-ink-400 capitalize">{t.company.replace('_', ' ')}</div>
                </div>
                <ul className="mt-3 pt-3 border-t border-ink-100 space-y-1.5">
                  {t.actions.map((a) => (
                    <li key={a.action_id} className="flex justify-between text-[12px]">
                      <span className="text-ink-600">{a.label}</span>
                      <span className="font-mono tnum text-ink-950 font-bold">{a.cost} cr</span>
                    </li>
                  ))}
                </ul>
                {!locked && (
                  <div className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-brand-700">
                    Run <ArrowRight size={11} className="group-hover:translate-x-0.5 transition" />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent activity */}
      <section className="mt-12">
        <SectionHeader
          eyebrow={<Eyebrow icon={<Activity size={11} />}>Recent activity</Eyebrow>}
          title="Last 10 calls"
          actions={recent.length > 0 ? (
            <LinkButton href="/billing" variant="ghost" size="sm" iconRight={<ArrowRight size={12} />}>View ledger</LinkButton>
          ) : undefined}
        />
        {recent.length === 0 ? (
          <EmptyState
            icon={<Activity size={24} />}
            title="No calls yet"
            body={<>Run a scan with <strong className="text-ink-700">Scanner</strong> or generate an article with <strong className="text-ink-700">Blog Writer</strong> to start consuming credits.</>}
            action={{ label: 'Open Scanner', href: '/agents/scanner', icon: <Search size={13} /> }}
          />
        ) : (
          <Card padding="none" className="mt-5 overflow-hidden">
            <table className="w-full text-[13.5px]">
              <thead className="bg-ink-50">
                <tr className="text-[10.5px] uppercase tracking-[.12em] text-ink-500 font-bold">
                  <th className="text-left px-4 py-2.5">When</th>
                  <th className="text-left px-4 py-2.5">Agent</th>
                  <th className="text-left px-4 py-2.5">Action</th>
                  <th className="text-right px-4 py-2.5">Credits</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-t border-ink-100 hover:bg-ink-50/40">
                    <td className="px-4 py-2.5 text-ink-500">{relativeTime(r.created_at as string)}</td>
                    <td className="px-4 py-2.5 text-ink-950 font-bold">{r.product}</td>
                    <td className="px-4 py-2.5 text-ink-500 font-mono text-[12px]">{r.action}</td>
                    <td className="px-4 py-2.5 text-right font-mono tnum text-coral-600 font-bold">−{r.credits_charged}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </AppShell>
  );
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function SetupPrompt() {
  return (
    <AppShell>
      <PageHeader
        eyebrow={<Eyebrow>Setup</Eyebrow>}
        title="Finish setup"
        description="Supabase isn't configured yet. Set the env vars below and apply the initial migration."
      />
      <Card padding="lg" className="mt-6">
        <p className="text-[14px] text-ink-600">Add the following to <code className="mono text-ink-900 bg-ink-50 px-1.5 py-0.5 rounded">.env.local</code> and restart Next.js:</p>
        <ul className="mt-3 font-mono text-[13px] text-ink-800 space-y-1 bg-ink-50 rounded-lg p-4">
          <li>NEXT_PUBLIC_SUPABASE_URL</li>
          <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
          <li>SUPABASE_SERVICE_ROLE_KEY</li>
        </ul>
        <p className="mt-4 text-[14px] text-ink-600">
          Then apply <code className="mono text-ink-900 bg-ink-50 px-1.5 py-0.5 rounded">supabase/migrations/0001_init.sql</code> from the Supabase SQL editor.
        </p>
      </Card>
    </AppShell>
  );
}
