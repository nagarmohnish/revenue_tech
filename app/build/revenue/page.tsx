import { redirect } from 'next/navigation';
import { BuilderShell } from '@/components/BuilderShell';
import { getBuilderSession } from '@/lib/builderAuth';
import { getTenant } from '@/lib/builder';
import { supabaseAdmin, supabaseConfigured } from '@/lib/supabase';
import { Activity, Gauge } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function RevenuePage() {
  if (!supabaseConfigured()) return <div className="p-12">Supabase not configured.</div>;
  const session = await getBuilderSession();
  if (!session) redirect('/build/signup');
  const tenant = await getTenant(session.tenantId);
  const db = supabaseAdmin();

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: recent }, { count: totalCalls }] = await Promise.all([
    db.from('usage_events').select('product, action, credits_charged, created_at, workspace_id').eq('tenant_id', session.tenantId).gte('created_at', since).order('created_at', { ascending: false }).limit(25),
    db.from('usage_events').select('id', { count: 'exact', head: true }).eq('tenant_id', session.tenantId),
  ]);

  const totalCredits = (recent || []).reduce((a, r) => a + (r.credits_charged || 0), 0);

  return (
    <BuilderShell accountName={tenant.name} accountSlug={tenant.slug}>
      <div>
        <div className="text-[.72rem] uppercase tracking-[.14em] text-brand-600 font-bold">Revenue intelligence</div>
        <h1 className="font-sans font-extrabold text-[2rem] tracking-tight text-ink-950 mt-1">Revenue</h1>
        <p className="text-ink-500 text-[15px] mt-1.5">Live numbers from your tenant. Full MRR/NRR/funnel breakdowns coming next session.</p>
      </div>

      <div className="mt-6 grid sm:grid-cols-3 gap-4">
        <Stat label="Lifetime calls"  value={(totalCalls || 0).toLocaleString()} />
        <Stat label="Credits, last 7d" value={totalCredits.toLocaleString()} />
        <Stat label="Active workspaces" value="—" sub="lands with branded workspaces" />
      </div>

      <section className="mt-8">
        <h2 className="text-[.72rem] uppercase tracking-[.14em] text-ink-400 font-bold flex items-center gap-2"><Activity size={13} /> Recent agent calls</h2>
        {(recent || []).length === 0 ? (
          <div className="mt-3 card p-8 text-center text-ink-500 text-sm">
            <Gauge size={20} className="mx-auto text-ink-300" />
            <div className="mt-2">No calls in the last 7 days.</div>
          </div>
        ) : (
          <div className="mt-3 card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-ink-50/60 text-ink-500 text-[11px] uppercase tracking-[0.12em]">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">When</th>
                  <th className="text-left px-4 py-3 font-semibold">Product</th>
                  <th className="text-left px-4 py-3 font-semibold">Action</th>
                  <th className="text-left px-4 py-3 font-semibold">Workspace</th>
                  <th className="text-right px-4 py-3 font-semibold">Credits</th>
                </tr>
              </thead>
              <tbody>
                {(recent || []).map((r: any) => (
                  <tr key={`${r.workspace_id}-${r.created_at}`} className="border-t border-ink-100">
                    <td className="px-4 py-2.5 text-ink-500">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-mono text-[12.5px] text-ink-700">{r.product}</td>
                    <td className="px-4 py-2.5 font-mono text-[12.5px] text-ink-500">{r.action}</td>
                    <td className="px-4 py-2.5 font-mono text-[11.5px] text-ink-400">{(r.workspace_id || '').slice(0, 8)}…</td>
                    <td className="px-4 py-2.5 text-right font-mono tnum text-brand-700 font-bold">−{r.credits_charged}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </BuilderShell>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-5">
      <div className="text-[11px] uppercase tracking-[0.12em] text-ink-400 font-semibold">{label}</div>
      <div className="mt-1.5 font-extrabold text-[1.8rem] text-ink-950 tnum leading-none">{value}</div>
      {sub && <div className="mt-2 text-[12px] text-ink-400">{sub}</div>}
    </div>
  );
}
