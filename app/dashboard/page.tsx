import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getSession } from '@/lib/auth';
import { walletSummary, getAllTools, recentUsage } from '@/lib/billing';
import { supabaseConfigured } from '@/lib/supabase';
import { PLANS, planMeetsRequirement, Plan } from '@/lib/plans';
import { ArrowRight, Lock, Search, Sparkles, Wand2 } from 'lucide-react';

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

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-ink-400 uppercase tracking-wider">Workspace</div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{wallet.workspaceName}</h1>
        </div>
        <Link href="/billing" className="btn-secondary text-sm">Manage billing</Link>
      </div>

      {/* Wallet card */}
      <section className="mt-6 card p-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-ink-400 uppercase tracking-wider">Wallet balance</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-5xl font-semibold tabular-nums text-ink-900">{wallet.balance.toLocaleString()}</span>
              <span className="text-ink-500 pb-1">credits</span>
            </div>
            <div className="mt-1 text-sm text-ink-500">
              {wallet.plan.charAt(0).toUpperCase() + wallet.plan.slice(1)} plan · {planLimit.toLocaleString()} credits / period
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-ink-400 uppercase tracking-wider">7-day burn</div>
            <div className="text-2xl font-semibold tabular-nums text-ink-900">{Math.round(wallet.burnRate7d)} <span className="text-sm font-normal text-ink-500">/ day</span></div>
            <div className="text-sm text-ink-500">~ {wallet.projectedDays} days left at this pace</div>
          </div>
        </div>
        <div className="mt-5 h-2 rounded-full bg-ink-100 overflow-hidden">
          <div className={`h-full ${pct > 50 ? 'bg-ok' : pct > 20 ? 'bg-warn' : 'bg-bad'}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/billing/topup" className="btn-primary">Top up +500 - $9</Link>
          {plan !== 'growth' && plan !== 'scale' && (
            <Link href="/billing/upgrade" className="btn-secondary">Upgrade plan →</Link>
          )}
        </div>
      </section>

      {/* Agents */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-ink-900 mb-3">Agents</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((t) => {
            const Icon = AGENT_ICON[t.product_id] || Sparkles;
            const planOk = planMeetsRequirement(plan, t.available_on);
            const locked = !planOk || !t.integrated;
            const href = AGENT_HREF[t.product_id] || '/agents/locked';
            return (
              <Link
                key={t.product_id}
                href={href}
                className={`card p-5 flex flex-col gap-2 transition hover:shadow-hover ${locked ? 'opacity-90' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-lg bg-ink-50 flex items-center justify-center text-ink-700">
                    <Icon size={18} />
                  </div>
                  {locked ? (
                    <span className="tag tag-muted flex items-center gap-1"><Lock size={11} /> {!planOk ? 'Upgrade' : 'Phase 1'}</span>
                  ) : (
                    <span className="tag tag-ok">Live</span>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-ink-900">{t.display_name}</div>
                  <div className="text-xs text-ink-400 capitalize">{t.company.replace('_', ' ')}</div>
                </div>
                <ul className="mt-2 text-sm text-ink-700 space-y-1">
                  {t.actions.map((a) => (
                    <li key={a.action_id} className="flex justify-between font-mono text-xs">
                      <span className="text-ink-500">{a.label}</span>
                      <span className="text-ink-900">{a.cost} cr</span>
                    </li>
                  ))}
                </ul>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent usage */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-ink-900">Recent activity</h2>
          {recent.length > 0 && <Link href="/billing" className="text-sm text-ink-500 hover:text-ink-900 flex items-center gap-1">View all <ArrowRight size={14} /></Link>}
        </div>
        {recent.length === 0 ? (
          <div className="card p-8 text-center text-ink-500">
            No agent calls yet. Run a domain scan or generate a blog article to start consuming credits.
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-ink-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">When</th>
                  <th className="text-left px-4 py-2.5 font-medium">Agent</th>
                  <th className="text-left px-4 py-2.5 font-medium">Action</th>
                  <th className="text-right px-4 py-2.5 font-medium">Credits</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-t border-ink-100">
                    <td className="px-4 py-2.5 text-ink-500">{relativeTime(r.created_at as string)}</td>
                    <td className="px-4 py-2.5 text-ink-900 font-medium">{r.product}</td>
                    <td className="px-4 py-2.5 text-ink-500 font-mono text-xs">{r.action}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-ink-900">−{r.credits_charged}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
      <div className="card p-8">
        <h1 className="text-2xl font-semibold text-ink-900">Finish setup</h1>
        <p className="mt-2 text-ink-500">
          Supabase isn't configured yet. Set the following in <code className="font-mono text-ink-700">.env.local</code> and restart:
        </p>
        <ul className="mt-4 font-mono text-sm text-ink-700 space-y-1">
          <li>NEXT_PUBLIC_SUPABASE_URL</li>
          <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
          <li>SUPABASE_SERVICE_ROLE_KEY</li>
        </ul>
        <p className="mt-4 text-ink-500">
          Then apply <code className="font-mono text-ink-700">supabase/migrations/0001_init.sql</code> from the Supabase SQL editor.
        </p>
      </div>
    </AppShell>
  );
}
