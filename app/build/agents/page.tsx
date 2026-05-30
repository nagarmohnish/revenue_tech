'use client';

import useSWR, { mutate } from 'swr';
import { useState } from 'react';
import Link from 'next/link';
import { BuilderShell } from '@/components/BuilderShell';
import { ArrowRight, Boxes, Plus, Trash2, X } from 'lucide-react';

const fetcher = (u: string) => fetch(u).then((r) => r.json());

interface ActionDef { action_id: string; cost: number; label: string }
interface Agent {
  product_id: string;
  display_name: string;
  actions: ActionDef[];
  available_on: string[];
  integrated: boolean;
}

const PLAN_OPTIONS = ['trial', 'starter', 'growth', 'scale'];

export default function AgencyAgentsPage() {
  const { data, error, isLoading } = useSWR<{ agents: Agent[] }>('/api/build/agents', fetcher);
  const [showNew, setShowNew] = useState(false);

  return (
    <BuilderShell>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[.72rem] uppercase tracking-[.14em] text-brand-600 font-bold">Tool registry</div>
          <h1 className="font-sans font-extrabold text-[2rem] tracking-tight text-ink-950 mt-1">Your agents</h1>
          <p className="text-ink-500 text-[15px] mt-1.5">Each agent has actions with credit costs. Update without redeploying.</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn btn-green">
          <Plus size={16} /> Register agent
        </button>
      </div>

      {error && <div className="mt-6 text-sm text-bad bg-red-50 border border-red-100 rounded-md px-3 py-2">{error.message}</div>}

      <section className="mt-6">
        {isLoading ? (
          <div className="card p-8 text-ink-500 text-sm">Loading…</div>
        ) : (data?.agents || []).length === 0 ? (
          <EmptyState onAdd={() => setShowNew(true)} />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {data!.agents.map((a) => (
              <AgentCard key={a.product_id} a={a} />
            ))}
          </div>
        )}
      </section>

      {showNew && <NewAgentModal onClose={() => setShowNew(false)} />}
    </BuilderShell>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="card p-12 text-center">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
        <Boxes size={22} />
      </div>
      <h2 className="mt-4 font-sans font-extrabold text-[1.4rem] tracking-tight text-ink-950">No agents yet</h2>
      <p className="mt-1 text-ink-500 text-sm max-w-md mx-auto">
        Register your first agent. Define a stable <span className="font-mono text-ink-800">product_id</span> and one or more actions with credit costs.
      </p>
      <button onClick={onAdd} className="btn btn-green mt-5">
        <Plus size={16} /> Register your first agent <ArrowRight size={14} />
      </button>
    </div>
  );
}

function AgentCard({ a }: { a: Agent }) {
  const [busy, setBusy] = useState(false);
  async function destroy() {
    if (!confirm(`Delete "${a.display_name}" (${a.product_id})? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/build/agents/${a.product_id}`, { method: 'DELETE' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'delete failed');
      mutate('/api/build/agents');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="card p-5 h-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-bold text-ink-950 text-[1.05rem]">{a.display_name}</div>
          <div className="font-mono text-[12px] text-ink-500 mt-0.5">{a.product_id}</div>
        </div>
        <button onClick={destroy} disabled={busy} className="text-ink-400 hover:text-bad transition-colors p-1 rounded">
          <Trash2 size={15} />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {a.available_on.map((p) => (
          <span key={p} className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-ink-50 text-ink-600 border border-ink-100">{p}</span>
        ))}
      </div>
      <ul className="mt-4 space-y-1.5 text-sm">
        {a.actions.map((act) => (
          <li key={act.action_id} className="flex items-center justify-between py-1.5 border-t border-ink-100 first:border-t-0 first:pt-0">
            <div>
              <div className="font-mono text-[12.5px] text-ink-700">{act.action_id}</div>
              <div className="text-[12px] text-ink-500">{act.label}</div>
            </div>
            <span className="font-mono tnum text-brand-600 font-bold">{act.cost} cr</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NewAgentModal({ onClose }: { onClose: () => void }) {
  const [productId, setProductId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [availableOn, setAvailableOn] = useState<string[]>(['starter', 'growth']);
  const [actions, setActions] = useState<ActionDef[]>([{ action_id: 'do_thing', cost: 25, label: 'Do the thing' }]);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function togglePlan(p: string) {
    setAvailableOn((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  }
  function addAction() {
    setActions((cur) => [...cur, { action_id: '', cost: 10, label: '' }]);
  }
  function removeAction(i: number) {
    setActions((cur) => cur.filter((_, idx) => idx !== i));
  }
  function setAction(i: number, patch: Partial<ActionDef>) {
    setActions((cur) => cur.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/build/agents', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          display_name: displayName,
          available_on: availableOn,
          actions,
          integrated: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Create failed');
      mutate('/api/build/agents');
      onClose();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-ink-100 max-w-xl w-full max-h-[90vh] overflow-auto p-6 md:p-7" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-sans font-extrabold text-[1.4rem] tracking-tight text-ink-950">Register agent</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-900 p-1"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-ink-700 mb-1.5">Product ID</label>
              <input
                required
                value={productId}
                onChange={(e) => setProductId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="content_writer"
                className="field font-mono"
              />
              <p className="mt-1 text-[11.5px] text-ink-500">Lowercase, digits, underscores. Stable identifier the SDK uses.</p>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-ink-700 mb-1.5">Display name</label>
              <input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Content Writer" className="field" />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-ink-700 mb-1.5">Available on plans</label>
            <div className="flex flex-wrap gap-2">
              {PLAN_OPTIONS.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => togglePlan(p)}
                  className={`px-3 py-1.5 rounded-md text-[13px] border capitalize ${
                    availableOn.includes(p) ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-ink-700 border-ink-200 hover:border-ink-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12px] font-semibold text-ink-700">Actions</label>
              <button type="button" onClick={addAction} className="text-[12px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                <Plus size={13} /> Add action
              </button>
            </div>
            <div className="space-y-2.5">
              {actions.map((act, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                  <input
                    required
                    value={act.action_id}
                    onChange={(e) => setAction(i, { action_id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    placeholder="generate_doc"
                    className="field font-mono col-span-4 !text-sm"
                  />
                  <input
                    required
                    value={act.label}
                    onChange={(e) => setAction(i, { label: e.target.value })}
                    placeholder="Generate a document"
                    className="field col-span-5 !text-sm"
                  />
                  <input
                    type="number"
                    required
                    min={0}
                    value={act.cost}
                    onChange={(e) => setAction(i, { cost: parseInt(e.target.value || '0', 10) })}
                    className="field tnum text-right col-span-2 !text-sm"
                  />
                  <button type="button" onClick={() => removeAction(i)} disabled={actions.length === 1} className="text-ink-400 hover:text-bad p-1.5 col-span-1 disabled:opacity-30">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <div className="grid grid-cols-12 gap-2 text-[10px] uppercase tracking-wider font-semibold text-ink-400 px-0.5">
                <span className="col-span-4">action_id</span>
                <span className="col-span-5">label</span>
                <span className="col-span-2 text-right">credits</span>
                <span className="col-span-1" />
              </div>
            </div>
          </div>

          {err && <div className="text-sm text-bad bg-red-50 border border-red-100 rounded-md px-3 py-2">{err}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn btn-line">Cancel</button>
            <button disabled={submitting} className="btn btn-green">{submitting ? 'Saving…' : 'Register agent'}</button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-ink-100 text-[12px] text-ink-500">
          Tip: once registered, copy the <span className="font-mono text-ink-800">product_id</span> and <span className="font-mono text-ink-800">action_id</span> into your SDK calls. <Link href="/build/integration" className="text-brand-600 font-semibold hover:underline">See the integration docs →</Link>
        </div>
      </div>
    </div>
  );
}
