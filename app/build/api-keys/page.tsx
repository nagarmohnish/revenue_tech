'use client';

import useSWR, { mutate } from 'swr';
import { useState } from 'react';
import { BuilderShell } from '@/components/BuilderShell';
import { AlertTriangle, Check, Copy, KeyRound, Plus, Trash2, X } from 'lucide-react';

const fetcher = (u: string) => fetch(u).then((r) => r.json());

interface Key {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export default function ApiKeysPage() {
  const { data, isLoading, error } = useSWR<{ keys: Key[] }>('/api/build/api-keys', fetcher);
  const [showNew, setShowNew] = useState(false);
  const [revealed, setRevealed] = useState<{ key: string; name: string } | null>(null);

  return (
    <BuilderShell>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[.72rem] uppercase tracking-[.14em] text-brand-600 font-bold">SDK access</div>
          <h1 className="font-sans font-extrabold text-[2rem] tracking-tight text-ink-950 mt-1">API keys</h1>
          <p className="text-ink-500 text-[15px] mt-1.5">Keys are shown <strong>once</strong> on creation, then only the prefix is stored. Revoke and rotate freely.</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn btn-green">
          <Plus size={16} /> Generate key
        </button>
      </div>

      {revealed && <RevealedKey reveal={revealed} onDismiss={() => setRevealed(null)} />}

      {error && <div className="mt-6 text-sm text-bad bg-red-50 border border-red-100 rounded-md px-3 py-2">{error.message}</div>}

      <section className="mt-6">
        {isLoading ? (
          <div className="card p-8 text-ink-500 text-sm">Loading…</div>
        ) : (data?.keys || []).length === 0 ? (
          <EmptyState onAdd={() => setShowNew(true)} />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-ink-50/60 text-ink-500 text-[11px] uppercase tracking-[0.12em]">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Prefix</th>
                  <th className="text-left px-4 py-3 font-semibold">Scopes</th>
                  <th className="text-left px-4 py-3 font-semibold">Last used</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {data!.keys.map((k) => <KeyRow key={k.id} k={k} />)}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showNew && <NewKeyModal onClose={() => setShowNew(false)} onCreated={(reveal) => { setRevealed(reveal); setShowNew(false); }} />}
    </BuilderShell>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="card p-12 text-center">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
        <KeyRound size={22} />
      </div>
      <h2 className="mt-4 font-sans font-extrabold text-[1.4rem] tracking-tight text-ink-950">No API keys yet</h2>
      <p className="mt-1 text-ink-500 text-sm max-w-md mx-auto">
        Your SDK calls (<span className="font-mono text-ink-800">authorize</span> + <span className="font-mono text-ink-800">debit</span>) need a key. Generate one and store it as <span className="font-mono text-ink-800">AGENTMINT_API_KEY</span>.
      </p>
      <button onClick={onAdd} className="btn btn-green mt-5"><Plus size={16} /> Generate your first key</button>
    </div>
  );
}

function KeyRow({ k }: { k: Key }) {
  const [busy, setBusy] = useState(false);
  async function revoke() {
    if (!confirm(`Revoke key "${k.name}" (${k.prefix})? Any SDK still using it will fail authorize().`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/build/api-keys/${k.id}`, { method: 'DELETE' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'revoke failed');
      mutate('/api/build/api-keys');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }
  const revoked = !!k.revoked_at;
  return (
    <tr className={`border-t border-ink-100 ${revoked ? 'opacity-60' : ''}`}>
      <td className="px-4 py-3 text-ink-900 font-medium">{k.name}</td>
      <td className="px-4 py-3 font-mono text-[12.5px] text-ink-700">{k.prefix}…</td>
      <td className="px-4 py-3 text-ink-500 text-xs">
        <div className="flex flex-wrap gap-1">
          {k.scopes.map((s) => (
            <span key={s} className="font-mono px-1.5 py-0.5 rounded bg-ink-50 border border-ink-100 text-ink-700">{s}</span>
          ))}
        </div>
      </td>
      <td className="px-4 py-3 text-ink-500">{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : '—'}</td>
      <td className="px-4 py-3">
        {revoked ? (
          <span className="tag tag-bad">revoked</span>
        ) : (
          <span className="pill pill-ok"><span className="dot bg-brand-500" /> active</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {!revoked && (
          <button onClick={revoke} disabled={busy} className="text-ink-400 hover:text-bad transition-colors p-1.5 rounded">
            <Trash2 size={14} />
          </button>
        )}
      </td>
    </tr>
  );
}

function NewKeyModal({ onClose, onCreated }: { onClose: () => void; onCreated: (r: { key: string; name: string }) => void }) {
  const [name, setName] = useState('production');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/build/api-keys', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'create failed');
      mutate('/api/build/api-keys');
      onCreated({ key: data.key, name });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-ink-100 max-w-md w-full p-6 md:p-7" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-sans font-extrabold text-[1.4rem] tracking-tight text-ink-950">New API key</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-900 p-1"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-ink-700 mb-1.5">Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="production" className="field" />
            <p className="mt-1 text-[11.5px] text-ink-500">Just for your reference (e.g. "production", "staging", "n8n").</p>
          </div>
          <div className="text-[12.5px] text-ink-600 bg-ink-50 border border-ink-100 rounded-lg px-3 py-2.5 flex gap-2.5">
            <AlertTriangle size={14} className="text-warn mt-0.5 shrink-0" />
            <span>Default scopes: <span className="font-mono text-ink-800">authorize</span>, <span className="font-mono text-ink-800">debit</span>. The full key is shown once. Store it in a secret manager.</span>
          </div>
          {err && <div className="text-sm text-bad bg-red-50 border border-red-100 rounded-md px-3 py-2">{err}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn btn-line">Cancel</button>
            <button disabled={submitting} className="btn btn-green">{submitting ? 'Generating…' : 'Generate'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RevealedKey({ reveal, onDismiss }: { reveal: { key: string; name: string }; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(reveal.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="mt-5 rounded-2xl border-2 border-brand-500 bg-brand-50/40 p-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center shrink-0">
          <KeyRound size={16} />
        </div>
        <div className="flex-1">
          <div className="font-bold text-ink-950">Key "{reveal.name}" created</div>
          <p className="text-[13.5px] text-ink-600 mt-0.5">Copy this now. You will not see it again.</p>
          <div className="mt-3 flex items-stretch gap-2">
            <code className="font-mono text-[12.5px] bg-white border border-ink-200 rounded-md px-3 py-2 flex-1 break-all">{reveal.key}</code>
            <button onClick={copy} className="btn btn-ink !py-2 !px-3">
              {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>
          <button onClick={onDismiss} className="mt-3 text-[12.5px] text-ink-500 hover:text-ink-900 font-medium">I've saved it, dismiss</button>
        </div>
      </div>
    </div>
  );
}
