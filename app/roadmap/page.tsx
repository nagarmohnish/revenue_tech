'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Wallet, User, Bot, Building2, Receipt, Banknote, Code2, Boxes, KeyRound,
  Calendar, ArrowRight, ArrowLeft, Check, Loader2, Sparkles, ShieldCheck,
  Globe, FileText,
} from 'lucide-react';
import type {
  RoadmapInput, ClientCount, ChargingMethod, PayoutMethod, Timeline,
} from '@/lib/roadmap/types';
import {
  CLIENT_COUNT_LABELS, CHARGING_LABELS, PAYOUT_LABELS, TIMELINE_LABELS,
} from '@/lib/roadmap/types';

const DEFAULTS: RoadmapInput = {
  name: '', email: '', company: '', role: '',
  website: '', agentsSummary: '', agentCount: 3, clientCount: '5_25',
  pricingNow: '',
  chargingMethod: 'manual_invoice',
  chargingOther: '',
  payoutMethod: 'stripe',
  payoutOther: '',
  stack: '', aiTools: '', integrations: '', docLinks: '',
  shareableCreds: '',
  timeline: 'month',
  notes: '',
};

export default function RoadmapPage() {
  const router = useRouter();
  const [form, setForm]   = useState<RoadmapInput>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [field, setField] = useState<string | null>(null);

  function set<K extends keyof RoadmapInput>(k: K, v: RoadmapInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setField(null); setLoading(true);
    try {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setField(data?.field || null); throw new Error(data?.message || 'Could not submit'); }
      router.push(`/roadmap/thanks/${data.id}`);
    } catch (err: any) {
      setError(err?.message || 'Could not submit');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-ink-950 font-sans antialiased">

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

      <main className="wrap py-12 md:py-16 max-w-4xl">

        <section>
          <div className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[.14em] font-bold text-brand-700">
            <Sparkles size={12} /> Deep monetization roadmap
          </div>
          <h1 className="mt-4 font-extrabold tracking-[-0.03em] leading-[1.02] text-[2.4rem] md:text-[3.2rem] balance">
            For companies with <span className="text-brand-500">multiple agents</span> and existing clients.
          </h1>
          <p className="mt-5 text-[1.05rem] text-ink-600 leading-relaxed max-w-3xl">
            You're shipping AI agents to your clients. Charging them is the hard part. Tell us what you have today — website, agents, current pricing, payment rails, the tech surface — and we'll produce a comprehensive roadmap: integration plan per agent, sequencing, exact SDKs/APIs/credentials required, plus a separate onboarding checklist.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-600">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-brand-600" /> Never asks for actual credentials</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-brand-600" /> Roadmap + checklist as docs</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-brand-600" /> Reply within one business day</span>
          </div>
        </section>

        <form onSubmit={submit} className="mt-10 space-y-6">

          {/* SECTION 1 — Contact */}
          <Section icon={User} index="01" title="Contact">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Your name" required error={fieldErr(field, error, 'name')}>
                <input type="text" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Mohnish Nagar" className="field" />
              </Field>
              <Field label="Work email" required error={fieldErr(field, error, 'email')}>
                <input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@company.com" className="field" />
              </Field>
              <Field label="Company name" required error={fieldErr(field, error, 'company')}>
                <input type="text" required value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="Acme Studio" className="field" />
              </Field>
              <Field label="Your role">
                <input type="text" value={form.role || ''} onChange={(e) => set('role', e.target.value)} placeholder="Founder · Head of Product · CTO" className="field" />
              </Field>
            </div>
          </Section>

          {/* SECTION 2 — Company surface */}
          <Section icon={Building2} index="02" title="The company surface">
            <Field label="Company website" required error={fieldErr(field, error, 'website')}>
              <div className="flex items-center gap-2 px-3.5 py-3 rounded-lg border border-ink-200 focus-within:border-ink-400 transition">
                <Globe size={14} className="text-ink-400" />
                <input type="text" required value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="acmestudio.com" className="flex-1 bg-transparent outline-none text-[14.5px]" />
              </div>
            </Field>
            <Field label="What do your agents do?" hint="A short paragraph covering the main agents, what they do, who they serve." required error={fieldErr(field, error, 'agentsSummary')}>
              <textarea required value={form.agentsSummary} onChange={(e) => set('agentsSummary', e.target.value)} rows={5}
                placeholder="We build verticalized AI agents for legal teams — contract analyzer, deposition prep, redaction. Sold to mid-market law firms. Three live agents, two more in development."
                className="field !leading-relaxed" />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="How many agents in your suite?" required>
                <input type="number" required min={1} max={999} value={form.agentCount} onChange={(e) => set('agentCount', parseInt(e.target.value || '1', 10))} className="field" />
              </Field>
              <Field label="How many paying clients today?" required>
                <select value={form.clientCount} onChange={(e) => set('clientCount', e.target.value as ClientCount)} className="field">
                  {(Object.keys(CLIENT_COUNT_LABELS) as ClientCount[]).map((k) => <option key={k} value={k}>{CLIENT_COUNT_LABELS[k]}</option>)}
                </select>
              </Field>
            </div>
          </Section>

          {/* SECTION 3 — Billing now */}
          <Section icon={Receipt} index="03" title="How you charge today">
            <Field label="What is your current pricing?" hint="Even rough is fine. Tier prices, per-call costs, monthly retainer — whatever you actually charge." required error={fieldErr(field, error, 'pricingNow')}>
              <textarea required value={form.pricingNow} onChange={(e) => set('pricingNow', e.target.value)} rows={4}
                placeholder="Tier 1 (basic agent): $499/mo + $0.10/call. Tier 2 (full suite): $1,999/mo + $0.06/call. Enterprise is custom."
                className="field !leading-relaxed" />
            </Field>
            <Field label="How are clients charged?" required>
              <RadioCardGrid
                value={form.chargingMethod}
                onChange={(v) => set('chargingMethod', v as ChargingMethod)}
                options={Object.entries(CHARGING_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                cols={2}
              />
              {form.chargingMethod === 'other' && (
                <input type="text" value={form.chargingOther || ''} onChange={(e) => set('chargingOther', e.target.value)} placeholder="Tell us how" className="field mt-3" />
              )}
            </Field>
            <Field label="Where does the money currently land?" required hint="The payout rail. Used to scope what we plug AgentMint into.">
              <RadioCardGrid
                value={form.payoutMethod}
                onChange={(v) => set('payoutMethod', v as PayoutMethod)}
                options={Object.entries(PAYOUT_LABELS).map(([v, l]) => ({ value: v, label: l, icon: Banknote }))}
                cols={2}
              />
              {form.payoutMethod === 'other' && (
                <input type="text" value={form.payoutOther || ''} onChange={(e) => set('payoutOther', e.target.value)} placeholder="Specify" className="field mt-3" />
              )}
            </Field>
          </Section>

          {/* SECTION 4 — Tech surface */}
          <Section icon={Code2} index="04" title="Tech surface">
            <Field label="Your stack" hint="Backend / frontend / hosting. Comma-separated is fine." required error={fieldErr(field, error, 'stack')}>
              <input type="text" required value={form.stack} onChange={(e) => set('stack', e.target.value)} placeholder="Next.js + Supabase, FastAPI, Vercel + Cloud Run" className="field" />
            </Field>
            <Field label="AI tools + integrations powering your agents" required error={fieldErr(field, error, 'aiTools')}>
              <textarea required value={form.aiTools} onChange={(e) => set('aiTools', e.target.value)} rows={3}
                placeholder="OpenAI (GPT-4o), Anthropic (Sonnet), Pinecone, Voyage embeddings, Langfuse for tracing."
                className="field !leading-relaxed" />
            </Field>
            <Field label="Other notable integrations" hint="CRM, billing tools, analytics, anything sharing data with your agents.">
              <textarea value={form.integrations || ''} onChange={(e) => set('integrations', e.target.value)} rows={2}
                placeholder="HubSpot for CRM, Segment for events, Datadog for monitoring."
                className="field !leading-relaxed" />
            </Field>
            <Field label="Any extra docs we should read?" hint="Paste links or notes — architecture diagrams, API docs, internal write-ups. We'll read whatever you point us at.">
              <textarea value={form.docLinks || ''} onChange={(e) => set('docLinks', e.target.value)} rows={3}
                placeholder={`https://acme.notion.site/architecture\nhttps://github.com/acme/agents (private)\nInternal pricing memo on file — happy to share`}
                className="field !leading-relaxed mono !text-[13px]" />
            </Field>
          </Section>

          {/* SECTION 5 — Concierge */}
          <Section icon={KeyRound} index="05" title="What you can share access to">
            <Field label="Which credentials/accounts can you grant access to?" hint="LABELS ONLY. Never enter actual secrets here. We'll set up secure handoff if/when we engage.">
              <textarea value={form.shareableCreds || ''} onChange={(e) => set('shareableCreds', e.target.value)} rows={3}
                placeholder="Stripe (sandbox + prod), staging Supabase project, dev OpenAI org. Not yet: prod DB, bank account."
                className="field !leading-relaxed" />
            </Field>
            <Field label="When do you want this live?" required>
              <RadioCardGrid
                value={form.timeline}
                onChange={(v) => set('timeline', v as Timeline)}
                options={Object.entries(TIMELINE_LABELS).map(([v, l]) => ({ value: v, label: l, icon: Calendar }))}
                cols={4}
              />
            </Field>
            <Field label="Anything else?">
              <textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={3}
                placeholder="Specific concerns, deal blockers, things you've tried before."
                className="field !leading-relaxed" />
            </Field>
          </Section>

          {/* Submit */}
          <div className="pt-2">
            {error && !field && (
              <div className="mb-4 text-[14px] text-coral-600 bg-coral-400/10 border border-coral-400/30 rounded-md px-3 py-2">{error}</div>
            )}
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 text-[15px] font-semibold text-white bg-ink-950 hover:bg-ink-800 disabled:bg-ink-400 rounded-lg px-6 py-3.5 transition">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : <>Submit roadmap intake <ArrowRight size={15} /></>}
            </button>
            <p className="mt-3 text-[12.5px] text-ink-500">No commitments. We'll reply within one business day with a deep-dive proposal.</p>
          </div>
        </form>
      </main>

      <style jsx global>{`
        .field { width: 100%; padding: .7rem .85rem; border-radius: .55rem;
                 border: 1px solid #e2ebe6; background: #fff;
                 font-size: 14.5px; color: #06221a; transition: border-color .15s; }
        .field:focus { outline: none; border-color: #06221a; }
        .field::placeholder { color: #93aaa0; }
      `}</style>
    </div>
  );
}

function fieldErr(field: string | null, error: string | null, k: string): string | null {
  return field === k ? error : null;
}

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
  options: Array<{ value: string; label: string; icon?: any }>;
  cols: 2 | 4;
}) {
  return (
    <div className={`grid gap-2 ${cols === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 md:grid-cols-4'}`}>
      {options.map((o) => {
        const active = value === o.value;
        const Icon = o.icon;
        return (
          <button type="button" key={o.value} onClick={() => onChange(o.value)}
            className={`text-left px-3.5 py-3 rounded-xl border transition flex items-start gap-2.5 ${
              active ? 'border-ink-950 bg-ink-950 text-white shadow-sm' : 'border-ink-200 bg-white hover:border-ink-400 text-ink-800'
            }`}>
            {Icon ? (
              <span className={`mt-0.5 flex-shrink-0 ${active ? 'text-brand-400' : 'text-ink-500'}`}><Icon size={15} /></span>
            ) : (
              <span className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 ${active ? 'border-brand-400 bg-brand-500' : 'border-ink-300'}`}>
                {active && <Check size={9} strokeWidth={4} className="text-white m-0.5" />}
              </span>
            )}
            <div className={`font-bold text-[13.5px] leading-tight ${active ? 'text-white' : 'text-ink-950'}`}>{o.label}</div>
          </button>
        );
      })}
    </div>
  );
}
