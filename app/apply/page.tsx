'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowLeft, ArrowRight, User, Bot, Wallet, Receipt, Layers, Code2, Calendar,
  Globe, Sparkles, ShieldCheck, Check, Loader2,
} from 'lucide-react';
import type {
  ApplicationInput, BillingPref, Geography, Lifecycle, Timeline, VolumeEstimate,
} from '@/lib/applications/types';
import {
  BILLING_LABELS, GEOGRAPHY_LABELS, LIFECYCLE_LABELS, TIMELINE_LABELS, VOLUME_LABELS,
} from '@/lib/applications/types';

const DEFAULTS: ApplicationInput = {
  name: '', email: '', company: '',
  agentName: '', agentDesc: '',
  lifecycle: 'building',
  volumeEstimate: '100_1k',
  billingPref: 'prepaid',
  geography: 'usd',
  geographyOther: '',
  stack: '',
  timeline: 'month',
  notes: '',
};

export default function ApplyPage() {
  const router = useRouter();
  const [form, setForm]       = useState<ApplicationInput>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [field, setField]     = useState<string | null>(null);

  function set<K extends keyof ApplicationInput>(k: K, v: ApplicationInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setField(null);
    setLoading(true);
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setField(data?.field || null);
        throw new Error(data?.message || 'Could not submit');
      }
      router.push(`/apply/thanks/${data.id}`);
    } catch (err: any) {
      setError(err?.message || 'Could not submit');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-ink-950 font-sans antialiased">

      {/* Header */}
      <header className="border-b border-ink-100 bg-white/95 backdrop-blur sticky top-0 z-20">
        <div className="wrap h-[64px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold text-ink-950">
            <span className="relative w-7 h-7 rounded-lg bg-ink-950 flex items-center justify-center">
              <Wallet size={14} className="text-brand-400" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-white" />
            </span>
            <span className="text-[1.05rem] tracking-tight">Agent<span className="text-brand-500">Mint</span></span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-600 hover:text-ink-950">
            <ArrowLeft size={13} /> Back
          </Link>
        </div>
      </header>

      <main className="wrap py-12 md:py-16 max-w-3xl">

        {/* Hero */}
        <section className="reveal">
          <div className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[.14em] font-bold text-brand-700">
            <Sparkles size={12} /> Concierge intake
          </div>
          <h1 className="mt-4 font-extrabold tracking-[-0.028em] leading-[1.04] text-[2.4rem] md:text-[3rem]">
            Tell us about your agent. <span className="text-brand-500">We build the billing.</span>
          </h1>
          <p className="mt-4 text-[1.05rem] text-ink-600 leading-relaxed max-w-2xl">
            Five minutes of writing. One business day until we reply. We scope the monetization layer for your agent — billing model, pricing, payment rail — and ship it for you to review.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-600">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-brand-600" /> No commitments</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-brand-600" /> $0 while we build it</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-brand-600" /> Walk away anytime</span>
          </div>
        </section>

        <form onSubmit={submit} className="mt-10 space-y-7">

          {/* SECTION 1 · You */}
          <Section icon={User} index="01" title="You">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Your name" required error={field === 'name' ? error : null}>
                <input
                  type="text" required value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Mohnish Nagar"
                  className="field"
                />
              </Field>
              <Field label="Email" required error={field === 'email' ? error : null}>
                <input
                  type="email" required value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="you@company.com"
                  className="field"
                />
              </Field>
            </div>
            <Field label="Company (optional)">
              <input
                type="text" value={form.company}
                onChange={(e) => set('company', e.target.value)}
                placeholder="Stately Labs"
                className="field"
              />
            </Field>
          </Section>

          {/* SECTION 2 · Your agent */}
          <Section icon={Bot} index="02" title="Your agent">
            <Field label="What's it called?" required error={field === 'agentName' ? error : null}>
              <input
                type="text" required value={form.agentName}
                onChange={(e) => set('agentName', e.target.value)}
                placeholder="Sparrwo Scanner"
                className="field"
              />
            </Field>
            <Field label="What does it do?" hint="Two or three sentences. Who uses it, what they get, what's special." required error={field === 'agentDesc' ? error : null}>
              <textarea
                required value={form.agentDesc}
                onChange={(e) => set('agentDesc', e.target.value)}
                placeholder="A visibility analyzer that scores a customer's pricing page and tells them what to fix. Used by SaaS founders during landing-page redesigns."
                rows={4}
                className="field !leading-relaxed"
              />
            </Field>
            <Field label="Where is it in its lifecycle?" required>
              <RadioCardGrid
                value={form.lifecycle}
                onChange={(v) => set('lifecycle', v as Lifecycle)}
                options={Object.entries(LIFECYCLE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                cols={2}
              />
            </Field>
            <Field label="Estimated agent-call volume" required>
              <select
                value={form.volumeEstimate}
                onChange={(e) => set('volumeEstimate', e.target.value as VolumeEstimate)}
                className="field"
              >
                {(Object.keys(VOLUME_LABELS) as VolumeEstimate[]).map((k) => (
                  <option key={k} value={k}>{VOLUME_LABELS[k]}</option>
                ))}
              </select>
            </Field>
          </Section>

          {/* SECTION 3 · Monetization */}
          <Section icon={Wallet} index="03" title="Monetization">
            <Field label="How do you want to bill?" required>
              <RadioCardGrid
                value={form.billingPref}
                onChange={(v) => set('billingPref', v as BillingPref)}
                options={[
                  { value: 'prepaid',  label: 'Prepaid credits',          icon: Wallet,  hint: 'Top-up, debit, stop at zero' },
                  { value: 'usage',    label: 'Usage-based invoicing',     icon: Receipt, hint: 'Meter, invoice month-end' },
                  { value: 'both',     label: 'Both — depends on customer', icon: Layers,  hint: 'Switchable per workspace' },
                  { value: 'not_sure', label: "Not sure — recommend one",   icon: Sparkles, hint: 'We pick what fits your model' },
                ]}
                cols={2}
              />
            </Field>
            <Field label="Where do your customers pay from?" required error={field === 'geographyOther' ? error : null}>
              <RadioCardGrid
                value={form.geography}
                onChange={(v) => set('geography', v as Geography)}
                options={[
                  { value: 'usd',   label: 'USD — global', icon: Globe },
                  { value: 'inr',   label: 'INR — India',  icon: Globe },
                  { value: 'both',  label: 'Both',         icon: Globe },
                  { value: 'other', label: 'Other',        icon: Globe },
                ]}
                cols={4}
              />
              {form.geography === 'other' && (
                <input
                  type="text"
                  value={form.geographyOther}
                  onChange={(e) => set('geographyOther', e.target.value)}
                  placeholder="Which countries?"
                  className="field mt-3"
                />
              )}
            </Field>
          </Section>

          {/* SECTION 4 · Stack + timing */}
          <Section icon={Code2} index="04" title="Stack + timing">
            <Field label="Your stack" hint="One word is fine. Next.js, FastAPI, Go, n8n, Cloudflare Workers, …" required error={field === 'stack' ? error : null}>
              <input
                type="text" required value={form.stack}
                onChange={(e) => set('stack', e.target.value)}
                placeholder="Next.js + Supabase"
                className="field"
              />
            </Field>
            <Field label="When do you want this live?" required>
              <RadioCardGrid
                value={form.timeline}
                onChange={(v) => set('timeline', v as Timeline)}
                options={[
                  { value: 'week',      label: 'This week',     icon: Calendar },
                  { value: 'month',     label: 'This month',    icon: Calendar },
                  { value: 'quarter',   label: 'This quarter',  icon: Calendar },
                  { value: 'exploring', label: 'Just exploring', icon: Calendar },
                ]}
                cols={4}
              />
            </Field>
            <Field label="Anything else?" hint="Pricing in mind, existing billing system, integrations you care about — whatever helps us scope.">
              <textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="We currently bill flat $99/month via Lemon Squeezy and want to move to usage-based with overage caps. Customers expect INR / GST invoices."
                rows={3}
                className="field !leading-relaxed"
              />
            </Field>
          </Section>

          {/* Submit */}
          <div className="pt-2">
            {error && !field && (
              <div className="mb-4 text-[14px] text-coral-600 bg-coral-400/10 border border-coral-400/30 rounded-md px-3 py-2">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 text-[15px] font-semibold text-white bg-ink-950 hover:bg-ink-800 disabled:bg-ink-400 rounded-lg px-6 py-3.5 transition"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : <>Submit application <ArrowRight size={15} /></>}
            </button>
            <p className="mt-3 text-[12.5px] text-ink-500">We reply within one business day. No commitment to anything.</p>
          </div>
        </form>
      </main>

      <style jsx global>{`
        .field {
          width: 100%; padding: .7rem .85rem; border-radius: .55rem;
          border: 1px solid #e2ebe6; background: #fff;
          font-size: 14.5px; color: #06221a;
          transition: border-color .15s;
        }
        .field:focus { outline: none; border-color: #06221a; }
        .field::placeholder { color: #93aaa0; }

        .reveal { opacity: 0; transform: translateY(8px); animation: fadeIn .4s ease forwards; }
        @keyframes fadeIn { to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({ icon: Icon, index, title, children }: { icon: any; index: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-6 md:p-7">
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-lg bg-ink-950 text-brand-400 flex items-center justify-center flex-shrink-0">
          <Icon size={16} />
        </span>
        <div>
          <div className="mono text-[10.5px] uppercase tracking-[.16em] font-bold text-brand-700">SECTION {index}</div>
          <h2 className="font-extrabold text-ink-950 tracking-tight text-[1.18rem] leading-tight">{title}</h2>
        </div>
      </div>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

function Field({ label, hint, required, error, children }: { label: string; hint?: string; required?: boolean; error?: string | null; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-bold text-ink-800 mb-1.5">
        {label} {required && <span className="text-brand-600">·</span>}
      </label>
      {hint && <p className="text-[12px] text-ink-500 -mt-1 mb-2">{hint}</p>}
      {children}
      {error && <p className="mt-1.5 text-[12.5px] text-coral-600">{error}</p>}
    </div>
  );
}

function RadioCardGrid({ value, onChange, options, cols }: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string; icon?: any; hint?: string }>;
  cols: 2 | 4;
}) {
  return (
    <div className={`grid gap-2 ${cols === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 md:grid-cols-4'}`}>
      {options.map((o) => {
        const active = value === o.value;
        const Icon = o.icon;
        return (
          <button
            type="button"
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`text-left px-3.5 py-3 rounded-xl border transition flex items-start gap-2.5 ${
              active
                ? 'border-ink-950 bg-ink-950 text-white shadow-sm'
                : 'border-ink-200 bg-white hover:border-ink-400 text-ink-800'
            }`}
          >
            {Icon ? (
              <span className={`mt-0.5 flex-shrink-0 ${active ? 'text-brand-400' : 'text-ink-500'}`}><Icon size={15} /></span>
            ) : (
              <span className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                active ? 'border-brand-400 bg-brand-500' : 'border-ink-300'
              }`}>
                {active && <Check size={9} strokeWidth={4} className="text-white m-0.5" />}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className={`font-bold text-[13.5px] leading-tight ${active ? 'text-white' : 'text-ink-950'}`}>{o.label}</div>
              {o.hint && (
                <div className={`text-[11.5px] mt-0.5 ${active ? 'text-ink-300' : 'text-ink-500'}`}>{o.hint}</div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
