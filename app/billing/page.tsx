import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getSession } from '@/lib/auth';
import { walletSummary, recentUsage } from '@/lib/billing';
import { supabaseAdmin, supabaseConfigured } from '@/lib/supabase';
import { PLANS, Plan } from '@/lib/plans';
import { ArrowUpRight, CreditCard, Receipt } from 'lucide-react';

export default async function BillingPage() {
  if (!supabaseConfigured()) {
    return (
      <AppShell>
        <div className="card p-8 text-ink-500">Configure Supabase to use billing.</div>
      </AppShell>
    );
  }
  const session = await getSession();
  if (!session) redirect('/login');

  const wallet = await walletSummary(session.workspaceId);
  const recent = await recentUsage(session.workspaceId, 50);

  // Pull transactions (grants + topups + debits) for invoice-style display
  const db = supabaseAdmin();
  const { data: txs } = await db
    .from('wallet_transactions')
    .select('id, type, amount, balance_after, product, action, stripe_ref, admin_note, created_at')
    .eq('workspace_id', session.workspaceId)
    .order('created_at', { ascending: false })
    .limit(50);

  const plan = wallet.plan as Plan;

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-ink-400 uppercase tracking-wider">Workspace</div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Billing</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/billing/topup" className="btn-secondary">Top up</Link>
          <Link href="/billing/upgrade" className="btn-primary">Upgrade plan</Link>
        </div>
      </div>

      {/* Plan + wallet summary */}
      <section className="mt-6 grid md:grid-cols-2 gap-4">
        <div className="card p-6">
          <div className="text-xs text-ink-400 uppercase tracking-wider">Current plan</div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-3xl font-semibold tracking-tight text-ink-900 capitalize">{plan}</div>
            <div className="text-ink-500">{PLANS[plan].price_usd != null && PLANS[plan].price_usd! > 0 ? `$${PLANS[plan].price_usd}/mo` : 'Free'}</div>
          </div>
          <div className="mt-1 text-sm text-ink-500">{PLANS[plan].credits.toLocaleString()} credits / period · {PLANS[plan].description}</div>
          {wallet.periodEnd && (
            <div className="mt-3 text-sm text-ink-500">
              Renews <span className="text-ink-900 font-medium">{new Date(wallet.periodEnd).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        <div className="card p-6">
          <div className="text-xs text-ink-400 uppercase tracking-wider">Wallet</div>
          <div className="mt-2 text-3xl font-semibold tabular-nums text-ink-900">{wallet.balance.toLocaleString()} <span className="text-base font-normal text-ink-500">credits</span></div>
          <div className="mt-1 text-sm text-ink-500">7-day burn: {Math.round(wallet.burnRate7d)} cr/day · ~{wallet.projectedDays}d remaining</div>
        </div>
      </section>

      {/* Transactions */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-ink-900 mb-3 flex items-center gap-2"><Receipt size={18} /> Transactions</h2>
        {!txs || txs.length === 0 ? (
          <div className="card p-6 text-ink-500 text-sm">No transactions yet.</div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-ink-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">When</th>
                  <th className="text-left px-4 py-2.5 font-medium">Type</th>
                  <th className="text-left px-4 py-2.5 font-medium">Detail</th>
                  <th className="text-right px-4 py-2.5 font-medium">Amount</th>
                  <th className="text-right px-4 py-2.5 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((t) => (
                  <tr key={t.id} className="border-t border-ink-100">
                    <td className="px-4 py-2.5 text-ink-500">{new Date(t.created_at as string).toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      <span className={`tag ${t.type === 'DEBIT' ? 'tag-muted' : t.type === 'TOPUP' ? 'tag-warn' : 'tag-ok'}`}>{t.type}</span>
                    </td>
                    <td className="px-4 py-2.5 text-ink-700">{t.product ? `${t.product} · ${t.action}` : t.admin_note || '-'}</td>
                    <td className={`px-4 py-2.5 text-right font-mono ${t.amount < 0 ? 'text-ink-900' : 'text-ok'}`}>
                      {t.amount > 0 ? '+' : ''}{t.amount}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-ink-500">{t.balance_after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8 card p-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CreditCard size={18} className="text-ink-500" />
          <div>
            <div className="text-sm text-ink-700 font-medium">Manage payment methods + download invoices</div>
            <div className="text-xs text-ink-500">Opens the Stripe Customer Portal in a new tab.</div>
          </div>
        </div>
        <a href="https://billing.stripe.com" target="_blank" rel="noopener" className="btn-secondary">
          Stripe portal <ArrowUpRight size={14} />
        </a>
      </section>
    </AppShell>
  );
}
