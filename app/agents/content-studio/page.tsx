'use client';

import { useState } from 'react';
import { mutate } from 'swr';
import { AppShell } from '@/components/AppShell';
import { UpgradeCTA, AuthDeny } from '@/components/UpgradeCTA';
import { Sparkles, Loader2, ArrowRight, Copy, Check } from 'lucide-react';

export default function ContentStudioPage() {
  const [prompt, setPrompt] = useState('');
  const [channel, setChannel] = useState<'linkedin' | 'twitter' | 'instagram'>('linkedin');
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<string[] | null>(null);
  const [deny, setDeny] = useState<AuthDeny | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const cost = 2 * count;

  async function run() {
    setLoading(true);
    setDeny(null);
    setPosts(null);
    try {
      const res = await fetch('/api/agents/content-studio', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt, channel, count }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setDeny(data as AuthDeny);
      } else if (!res.ok) {
        setDeny({ reason: 'UNKNOWN_TOOL', message: data?.error || 'Generation failed' });
      } else {
        setPosts(data.result.posts);
        mutate('/api/v1/wallet');
      }
    } finally {
      setLoading(false);
    }
  }

  async function copy(i: number, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  return (
    <AppShell>
      <div>
        <div className="text-xs text-ink-400 uppercase tracking-wider">AgentMint registry</div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900 flex items-center gap-2">
          <Sparkles size={22} /> Content Studio
        </h1>
        <p className="text-sm text-ink-500 mt-1">Short-form social posts. 2 credits per post.</p>
      </div>

      <section className="mt-6 card p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-ink-500 mb-1.5">Prompt</label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Why agent companies are switching from per-agent subs to credit wallets"
            className="field"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Channel</label>
            <div className="flex gap-2">
              {(['linkedin', 'twitter', 'instagram'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setChannel(c)}
                  className={`px-3 py-1.5 rounded-md text-sm border capitalize ${channel === c ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-700 border-ink-200 hover:border-ink-300'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Number of posts</label>
            <input
              type="number"
              min={1}
              max={5}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(5, +e.target.value || 1)))}
              className="field max-w-[120px]"
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-ink-100">
          <div className="text-sm text-ink-500">Will charge <span className="font-mono text-ink-900">{cost}</span> credits on success.</div>
          <button onClick={run} disabled={!prompt || loading} className="btn-primary">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <>Generate {count} {count === 1 ? 'post' : 'posts'} <ArrowRight size={14} /></>}
          </button>
        </div>
      </section>

      {deny && (
        <section className="mt-6">
          <UpgradeCTA deny={deny} />
        </section>
      )}

      {posts && (
        <section className="mt-8 grid sm:grid-cols-2 gap-4">
          {posts.map((p, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-ink-400 uppercase tracking-wider">{channel} · {i + 1}</div>
                <button onClick={() => copy(i, p)} className="text-xs text-ink-500 hover:text-ink-900 flex items-center gap-1">
                  {copiedIdx === i ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm text-ink-800 leading-relaxed">{p}</p>
            </div>
          ))}
        </section>
      )}
    </AppShell>
  );
}
