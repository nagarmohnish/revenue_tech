import { redirect } from 'next/navigation';
import { BuilderShell } from '@/components/BuilderShell';
import { getBuilderSession } from '@/lib/builderAuth';
import { listPlansForTenant, getTenant } from '@/lib/builder';
import { supabaseConfigured } from '@/lib/supabase';
import { Sliders } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PlansPage() {
  if (!supabaseConfigured()) return <div className="p-12">Supabase not configured.</div>;
  const session = await getBuilderSession();
  if (!session) redirect('/build/signup');
  const [plans, tenant] = await Promise.all([listPlansForTenant(session.tenantId), getTenant(session.tenantId)]);

  return (
    <BuilderShell accountName={tenant.name} accountSlug={tenant.slug}>
      <div>
        <div className="text-[.72rem] uppercase tracking-[.14em] text-brand-600 font-bold">Plan templates</div>
        <h1 className="font-sans font-extrabold text-[2rem] tracking-tight text-ink-950 mt-1">Plans your customers see</h1>
        <p className="text-ink-500 text-[15px] mt-1.5">Reference tiers. Editing UX lands with Stripe Connect.</p>
      </div>

      <div className="mt-6 grid sm:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.id} className="card p-5">
            <div className="text-[12px] uppercase tracking-[0.12em] text-ink-400 font-semibold">{p.plan_id}</div>
            <div className="mt-1 font-bold text-ink-950">{p.display_name}</div>
            <div className="mt-3 font-extrabold text-[1.8rem] tnum">
              {p.price_usd === 0 ? 'Free' : `$${p.price_usd}`}
              {p.price_usd! > 0 && <span className="text-ink-400 text-sm font-medium"> / mo</span>}
            </div>
            <div className="text-sm text-ink-500">{p.credits.toLocaleString()} credits {p.plan_id === 'trial' ? '(one-time)' : '/ month'}</div>
            {p.stripe_price_id ? (
              <div className="mt-3 text-[11px] font-mono text-brand-600">{p.stripe_price_id}</div>
            ) : (
              <div className="mt-3 text-[11.5px] text-ink-400">No Stripe price linked. Connect Stripe to enable checkout.</div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 card p-6 flex items-start gap-3">
        <Sliders size={18} className="text-ink-400 mt-0.5" />
        <div>
          <div className="font-bold text-ink-950">Editing lands next session</div>
          <p className="text-sm text-ink-500 mt-1">
            Plan name / price / credits / rollover / top-up packs will be editable here once Stripe Connect is wired up. For the pilot, ping us to adjust seeded plans.
          </p>
        </div>
      </div>
    </BuilderShell>
  );
}
