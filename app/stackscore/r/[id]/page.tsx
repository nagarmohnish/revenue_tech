import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadReport } from '@/lib/stackscore/store';
import type { DimensionKey, DimensionResult, Suggestion } from '@/lib/stackscore/types';

export const dynamic = 'force-dynamic';

const DIM_META: Record<DimensionKey, { label: string; tint: string }> = {
  clarity:     { label: 'Clarity',     tint: 'bg-brand-50 border-brand-100' },
  conversion:  { label: 'Conversion',  tint: 'bg-ink-50  border-ink-100'    },
  flexibility: { label: 'Flexibility', tint: 'bg-brand-50 border-brand-100' },
  trust:       { label: 'Trust',       tint: 'bg-ink-50  border-ink-100'    },
};

function gradeBand(score: number): { label: string; band: 'great' | 'good' | 'mid' | 'low' } {
  if (score >= 85) return { label: 'Best in class',  band: 'great' };
  if (score >= 70) return { label: 'Solid',          band: 'good'  };
  if (score >= 55) return { label: 'Mid-pack',       band: 'mid'   };
  return                  { label: 'Below average', band: 'low'   };
}

export default async function ReportPage({ params }: { params: { id: string } }) {
  const card = await loadReport(params.id);
  if (!card) notFound();

  const { label: gradeLabel } = gradeBand(card.score);
  const allWithUser = [
    ...card.benchmarks.map((b) => ({ name: b.name, score: b.score, you: false, url: b.url, highlight: b.highlight })),
    { name: card.hostname || 'You', score: card.score, you: true, url: card.url || '#', highlight: '' },
  ].sort((a, b) => b.score - a.score);

  const ruleSuggestions = card.suggestions.filter((s) => s.source === 'rule');
  const aiSuggestions   = card.suggestions.filter((s) => s.source === 'ai');

  return (
    <div className="min-h-screen bg-white text-ink-950">

      <header className="border-b border-ink-100 bg-white/95 backdrop-blur sticky top-0 z-20">
        <div className="wrap h-16 flex items-center justify-between">
          <Link href="/stackscore" className="flex items-center gap-2.5 font-extrabold text-ink-950">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="24" height="24" rx="7" fill="#10a868"/>
              <circle cx="14" cy="14" r="6" stroke="#fff" strokeWidth="1.9" fill="none"/>
              <path d="M14 10.2v7.6M11.6 12.6h4.8M11.6 15.4h4.8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            StackScore
          </Link>
          <div className="flex items-center gap-4 text-[.86rem]">
            <Link href="/stackscore" className="text-ink-600 hover:text-ink-950">Run another</Link>
            <Link href="/build/signup" className="inline-flex items-center gap-1.5 font-semibold text-white bg-ink-950 hover:bg-ink-800 rounded-lg px-3.5 py-2 transition">
              Build billing with AgentMint
            </Link>
          </div>
        </div>
      </header>

      <main className="wrap py-12 md:py-16">

        {/* HERO RESULT */}
        <section className="grid md:grid-cols-[1fr_220px] gap-8 items-start">
          <div>
            <div className="text-[12px] uppercase tracking-[.14em] font-bold text-brand-700">StackScore report</div>
            <h1 className="font-extrabold text-[2.2rem] md:text-[2.6rem] leading-[1.05] tracking-tight mt-3">
              {card.hostname ? (
                <>Score for <span className="text-brand-500">{card.hostname}</span></>
              ) : (
                <>Score from <span className="text-brand-500">screenshot upload</span></>
              )}
            </h1>
            {card.url && (
              <a href={card.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[.86rem] mono text-ink-500 hover:text-ink-800">
                {card.url} ↗
              </a>
            )}
            <p className="mt-4 text-[1.02rem] text-ink-600 leading-relaxed max-w-2xl">
              You're at <strong className="text-ink-950">{card.score}/100</strong> · ranked <strong className="text-ink-950">#{card.rank.position}</strong> out of {card.rank.total} (benchmarks + you) · closest to <strong className="text-ink-950">{card.rank.closestTo}</strong>.
              The benchmark median sits at <strong className="text-ink-950">{card.rank.median}</strong>.
            </p>
          </div>

          {/* Big score ring */}
          <div className="flex justify-center md:justify-end">
            <div className="relative w-44 h-44 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="44" fill="none" stroke="#eef4f1" strokeWidth="10" />
                <circle cx="50" cy="50" r="44" fill="none" stroke="#10a868" strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={`${(card.score / 100) * 276.46} 276.46`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[2.8rem] font-extrabold tracking-tight tnum text-ink-950">{card.score}</div>
                <div className="text-[10.5px] uppercase tracking-[.14em] text-brand-700 font-bold mt-0.5">{gradeLabel}</div>
              </div>
            </div>
          </div>
        </section>

        {/* DIMENSIONS */}
        <section className="mt-12 grid md:grid-cols-4 gap-4">
          {card.dimensions.map((d) => {
            const pct = Math.round((d.points / d.max) * 100);
            return (
              <div key={d.key} className={`rounded-2xl p-5 border ${DIM_META[d.key].tint}`}>
                <div className="text-[11px] uppercase tracking-[.14em] font-bold text-brand-700">{DIM_META[d.key].label}</div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-[2rem] font-extrabold tnum text-ink-950">{d.points}</span>
                  <span className="text-[.85rem] text-ink-500">/ {d.max}</span>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-white/70 overflow-hidden">
                  <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </section>

        {/* RANKING TABLE */}
        <section className="mt-14">
          <h2 className="font-extrabold text-[1.4rem] tracking-tight">Where you sit</h2>
          <p className="text-[.92rem] text-ink-500 mt-1">Your score against ten reference pages we've calibrated.</p>
          <div className="mt-5 card divide-y divide-ink-100">
            {allWithUser.map((row, idx) => (
              <div key={row.name + idx} className={`flex items-center gap-4 px-5 py-3.5 ${row.you ? 'bg-brand-50/50' : ''}`}>
                <div className="w-7 text-[.85rem] mono text-ink-400 tnum">#{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-[.95rem] truncate ${row.you ? 'text-brand-700' : 'text-ink-950'}`}>
                    {row.you ? `${row.name} (you)` : row.name}
                  </div>
                  {!row.you && (
                    <div className="text-[.78rem] text-ink-500 mt-0.5 truncate">{row.highlight}</div>
                  )}
                </div>
                <div className="w-40 hidden sm:block">
                  <div className="h-1.5 rounded-full bg-ink-100 overflow-hidden">
                    <div className={`h-full ${row.you ? 'bg-brand-500' : 'bg-ink-400'}`} style={{ width: `${row.score}%` }} />
                  </div>
                </div>
                <div className="w-14 text-right font-extrabold tnum text-ink-950">{row.score}</div>
              </div>
            ))}
          </div>
        </section>

        {/* SIGNALS DETAIL */}
        <section className="mt-14">
          <h2 className="font-extrabold text-[1.4rem] tracking-tight">Signals</h2>
          <p className="text-[.92rem] text-ink-500 mt-1">Every check the engine ran. Pass or fail, here is what we saw.</p>
          <div className="mt-5 grid md:grid-cols-2 gap-4">
            {card.dimensions.map((d) => (
              <SignalCard key={d.key} dim={d} />
            ))}
          </div>
        </section>

        {/* AI SUGGESTIONS */}
        {aiSuggestions.length > 0 && (
          <section className="mt-14">
            <div className="flex items-center gap-3">
              <h2 className="font-extrabold text-[1.4rem] tracking-tight">Contextual suggestions</h2>
              <span className="chip !text-[10.5px] !bg-brand-50 !text-brand-700 !border-brand-200">via Claude</span>
            </div>
            <p className="text-[.92rem] text-ink-500 mt-1">Three things the rules can't see, based on the combination of signals.</p>
            <div className="mt-5 grid md:grid-cols-3 gap-4">
              {aiSuggestions.map((s, i) => <SuggestionCard key={'ai' + i} s={s} />)}
            </div>
          </section>
        )}

        {/* RULE SUGGESTIONS */}
        {ruleSuggestions.length > 0 && (
          <section className="mt-14">
            <h2 className="font-extrabold text-[1.4rem] tracking-tight">Fixes, in order of leverage</h2>
            <p className="text-[.92rem] text-ink-500 mt-1">Each failing check turns into a specific action.</p>
            <div className="mt-5 grid md:grid-cols-2 gap-4">
              {ruleSuggestions.map((s, i) => <SuggestionCard key={'r' + i} s={s} />)}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="mt-20 mb-10 rounded-2xl bg-ink-950 text-white p-8 md:p-12 relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute rounded-full" style={{ width: '24rem', height: '24rem', background: '#10a868', top: '-10rem', right: '-6rem', filter: 'blur(80px)', opacity: 0.32 }} />
          <div className="relative max-w-2xl">
            <div className="text-[12px] uppercase tracking-[.14em] font-bold text-brand-400">After you fix the pricing page</div>
            <h2 className="font-extrabold text-[1.75rem] md:text-[2rem] tracking-tight mt-2 leading-tight balance">
              Bill the agents themselves with AgentMint.
            </h2>
            <p className="mt-3 text-[.96rem] text-ink-300 leading-relaxed">
              One wallet for every agent you ship. Three SDKs or two raw HTTPS calls. Five payment rails to settle. Pilot cohort is $0.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/build/signup" className="inline-flex items-center gap-1.5 text-[.92rem] font-semibold text-ink-950 bg-white hover:bg-ink-100 rounded-lg px-5 py-3 transition">
                Start building
              </Link>
              <Link href="/stackscore" className="inline-flex items-center gap-1.5 text-[.92rem] font-semibold text-white border border-white/30 hover:border-white/70 rounded-lg px-5 py-3 transition">
                Score another page
              </Link>
            </div>
          </div>
        </section>

        <div className="text-[12px] text-ink-400 mono">
          Generated {new Date(card.generatedAt).toLocaleString()} · share this URL — no login required
        </div>
      </main>
    </div>
  );
}

function SignalCard({ dim }: { dim: DimensionResult }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-[.14em] font-bold text-brand-700">{DIM_META[dim.key].label}</div>
        <div className="text-[.88rem] tnum text-ink-500">{dim.points}/{dim.max}</div>
      </div>
      <ul className="mt-3 space-y-1.5">
        {dim.hits.map((h, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[.86rem]">
            {h.pass ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10a868" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc4f23" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                <line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" />
              </svg>
            )}
            <div className="flex-1">
              <span className={h.pass ? 'text-ink-700' : 'text-ink-500'}>{h.rule}</span>
              {h.detail && <span className="text-ink-400 ml-1.5 mono text-[.78rem]">· {h.detail}</span>}
            </div>
            <span className="text-[10.5px] mono text-ink-400 tnum">+{h.weight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SuggestionCard({ s }: { s: Suggestion }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <div className="text-[10.5px] uppercase tracking-[.14em] font-bold text-brand-700">{DIM_META[s.dimension].label}</div>
        {s.source === 'ai' && <span className="text-[10px] mono text-brand-600">claude</span>}
      </div>
      <div className="mt-2 font-extrabold text-ink-950 text-[1.02rem] tracking-tight">{s.title}</div>
      <p className="mt-2 text-[.86rem] text-ink-600 leading-relaxed">{s.body}</p>
      {s.exemplar && (
        <div className="mt-3 pt-3 border-t border-ink-100 text-[.78rem]">
          <span className="font-bold text-ink-800">{s.exemplar.company}:</span>
          <span className="text-ink-500 ml-1.5">{s.exemplar.note}</span>
        </div>
      )}
    </div>
  );
}
