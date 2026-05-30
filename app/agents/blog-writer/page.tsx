'use client';

import { useState } from 'react';
import { mutate } from 'swr';
import { AppShell } from '@/components/AppShell';
import { UpgradeCTA, AuthDeny } from '@/components/UpgradeCTA';
import { Wand2, Loader2, ArrowRight, Copy, Check } from 'lucide-react';

export default function BlogWriterPage() {
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [keywords, setKeywords] = useState('');
  const [length, setLength] = useState<'500' | '1500'>('1500');
  const [loading, setLoading] = useState(false);
  const [article, setArticle] = useState<{ title: string; markdown: string } | null>(null);
  const [deny, setDeny] = useState<AuthDeny | null>(null);
  const [copied, setCopied] = useState(false);

  const cost = length === '1500' ? 20 : 8;

  async function run() {
    setLoading(true);
    setDeny(null);
    setArticle(null);
    try {
      const res = await fetch('/api/agents/blog-writer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ topic, audience, keywords, length }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setDeny(data as AuthDeny);
      } else if (!res.ok) {
        setDeny({ reason: 'UNKNOWN_TOOL', message: data?.error || 'Generation failed' });
      } else {
        setArticle(data.result);
        mutate('/api/v1/wallet');
      }
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!article) return;
    await navigator.clipboard.writeText(article.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <AppShell>
      <div>
        <div className="text-xs text-ink-400 uppercase tracking-wider">AgentMint registry</div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900 flex items-center gap-2">
          <Wand2 size={22} /> Blog Writer
        </h1>
        <p className="text-sm text-ink-500 mt-1">SEO + AEO optimized long-form articles. 20 credits (1,500w) · 8 credits (500w).</p>
      </div>

      <section className="mt-6 card p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-ink-500 mb-1.5">Topic</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="How to price AI agents using usage-based credits"
            className="field"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Audience <span className="text-ink-400">(optional)</span></label>
            <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="B2B SaaS founders" className="field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Keywords <span className="text-ink-400">(optional)</span></label>
            <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="usage-based pricing, AI billing" className="field" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-500 mb-1.5">Length</label>
          <div className="flex gap-2">
            {(['500', '1500'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLength(l)}
                className={`px-3 py-1.5 rounded-md text-sm border ${length === l ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-700 border-ink-200 hover:border-ink-300'}`}
              >
                {l === '1500' ? '~1,500 words · 20 cr' : '~500 words · 8 cr'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-ink-100">
          <div className="text-sm text-ink-500">Will charge <span className="font-mono text-ink-900">{cost}</span> credits on success.</div>
          <button onClick={run} disabled={!topic || loading} className="btn-primary">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <>Generate article <ArrowRight size={14} /></>}
          </button>
        </div>
      </section>

      {deny && (
        <section className="mt-6">
          <UpgradeCTA deny={deny} />
        </section>
      )}

      {article && (
        <section className="mt-8 card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-ink-400 uppercase tracking-wider">Generated · {length} words</div>
            <button onClick={copy} className="btn-secondary text-sm">
              {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy markdown</>}
            </button>
          </div>
          <article className="prose prose-sm max-w-none whitespace-pre-wrap font-sans text-ink-800 leading-relaxed">
            {article.markdown}
          </article>
        </section>
      )}
    </AppShell>
  );
}
