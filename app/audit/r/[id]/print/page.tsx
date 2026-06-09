// Print-only layout consumed by /api/audit/[id]/pdf. Deliberately minimal —
// no nav, no sticky chrome, no JS state — so the worker can render it cleanly.

import { notFound } from 'next/navigation';
import { loadAudit } from '@/lib/audit/store';
import { Check, TriangleAlert, X as XIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';

const MODEL_LABEL: Record<string, string> = {
  freemium: 'Freemium', trial: 'Free trial', paid_only: 'Paid only',
  usage_based: 'Usage-based', hybrid: 'Hybrid', enterprise_only: 'Enterprise only',
  unknown: 'Unclassified',
};

const PRIORITY_LABEL = { high: 'High leverage', medium: 'Medium priority', low: 'Polish' };

export default async function PrintAudit({ params }: { params: { id: string } }) {
  const r = await loadAudit(params.id);
  if (!r) notFound();
  const brand = r.brandColor || '#10a868';

  return (
    <div className="bg-white text-ink-950 font-sans" style={{ ['--brand' as any]: brand }}>
      <style>{`
        @page { size: A4; margin: 14mm 14mm 16mm; }
        body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .brand { color: ${brand}; }
        .bbg   { background: ${brand}; color: #fff; }
        .bbg-soft { background: ${brand}1a; color: ${brand}; }
        .border-brand { border-color: ${brand}; }
        .page-break { page-break-after: always; }
        .avoid-break { page-break-inside: avoid; }
        h1, h2, h3 { letter-spacing: -0.02em; }
      `}</style>

      <div className="px-10 py-8">

        {/* PAGE 1 — cover */}
        <header className="flex items-center justify-between border-b border-ink-100 pb-5">
          <div className="flex items-center gap-2 font-extrabold text-ink-950 text-[15px]">
            <span className="w-6 h-6 rounded-md bbg flex items-center justify-center text-white text-[10px] font-extrabold">A</span>
            <span>Agent<span className="brand">Mint</span></span>
          </div>
          <div className="text-[10.5px] font-mono uppercase tracking-[.18em] text-ink-500">Pricing Audit</div>
        </header>

        <section className="mt-10 avoid-break">
          <div className="text-[11px] uppercase tracking-[.16em] font-extrabold brand">For</div>
          <h1 className="mt-2 font-extrabold text-[2.4rem] leading-[1.05] tracking-tight">{r.domain}</h1>
          <div className="mt-1 text-[12px] font-mono text-ink-500">{r.url}</div>

          <div className="mt-8 grid grid-cols-[1fr_180px] gap-8 items-start">
            <div>
              <div className="text-[11px] uppercase tracking-[.14em] font-bold brand">Executive read</div>
              <p className="mt-3 text-[15px] leading-[1.55] text-ink-800 font-medium">{r.headline}</p>
              <p className="mt-3 text-[13px] leading-[1.6] text-ink-700">{r.summary}</p>

              <div className="mt-6">
                <div className="text-[11px] uppercase tracking-[.14em] font-bold brand">Business model</div>
                <h2 className="mt-2 font-extrabold text-[1.4rem] tracking-tight">{MODEL_LABEL[r.businessModel] ?? 'Unclassified'}</h2>
                <p className="mt-2 text-[12.5px] leading-[1.55] text-ink-700">{r.modelReasoning}</p>
              </div>
            </div>

            <div className="rounded-xl border border-ink-200 p-5 text-center avoid-break">
              <div className="text-[10px] uppercase tracking-[.18em] font-bold text-ink-500">Overall score</div>
              <div className="mt-3 font-extrabold text-[3.6rem] leading-none tracking-tight tnum">
                <span style={{ color: brand }}>{r.score}</span>
                <span className="text-ink-400 text-[1.6rem]"> / 100</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-left">
                {r.dimensions.map((d) => (
                  <div key={d.key} className="bg-ink-50 rounded-md px-2 py-1.5">
                    <div className="text-[8.5px] uppercase tracking-wider font-bold text-ink-500">{d.label}</div>
                    <div className="text-[14px] font-extrabold tnum">{d.points}<span className="text-ink-400 text-[10px]">/{d.max}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="page-break" />

        {/* PAGE 2 — findings + competitors */}
        <section className="mt-2 avoid-break">
          <div className="text-[11px] uppercase tracking-[.14em] font-bold brand">Findings</div>
          <h2 className="mt-2 font-extrabold text-[1.8rem] tracking-tight">What we saw.</h2>

          <div className="mt-5 space-y-3">
            {r.findings.map((f, i) => {
              const Icon = f.severity === 'good' ? Check : f.severity === 'warn' ? TriangleAlert : XIcon;
              const tint =
                f.severity === 'good' ? 'bbg-soft' :
                f.severity === 'warn' ? 'bg-amber-50 text-amber-700' :
                                        'bg-rose-50 text-rose-600';
              return (
                <div key={i} className="rounded-lg border border-ink-100 p-4 flex gap-3 avoid-break">
                  <span className={`w-7 h-7 rounded-md ${tint} flex items-center justify-center flex-shrink-0`}><Icon size={14} strokeWidth={2.4} /></span>
                  <div>
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[.12em] text-ink-500 font-bold">
                      <span>{f.area}</span><span>·</span><span>{f.severity}</span>
                    </div>
                    <h3 className="mt-0.5 font-extrabold text-[14px] tracking-tight">{f.title}</h3>
                    <p className="mt-1 text-[12px] leading-[1.55] text-ink-700">{f.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-10 avoid-break">
          <div className="text-[11px] uppercase tracking-[.14em] font-bold brand">Competitive comparison</div>
          <h2 className="mt-2 font-extrabold text-[1.8rem] tracking-tight">Who else plays this way.</h2>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {r.competitors.map((c, i) => (
              <div key={i} className="rounded-lg border border-ink-100 p-4 avoid-break">
                <div className="text-[9.5px] uppercase tracking-[.12em] font-bold brand">{c.category}</div>
                <h3 className="mt-1 font-extrabold text-[15px] tracking-tight">{c.name}</h3>
                <p className="mt-2 text-[11.5px] leading-[1.5] text-ink-700">{c.pattern}</p>
                <div className="mt-3 pt-2.5 border-t border-ink-100 text-[10.5px]">
                  <span className="font-bold brand uppercase tracking-wider text-[9.5px]">Takeaway · </span>
                  <span className="text-ink-700">{c.takeaway}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="page-break" />

        {/* PAGE 3 — recommendations */}
        <section className="mt-2">
          <div className="text-[11px] uppercase tracking-[.14em] font-bold brand">Recommendations</div>
          <h2 className="mt-2 font-extrabold text-[1.8rem] tracking-tight">Fix list — by leverage.</h2>

          <div className="mt-5 space-y-3">
            {r.recommendations.map((rec, i) => (
              <div key={i} className={`rounded-lg p-4 avoid-break ${rec.priority === 'high' ? 'border-2 border-brand' : 'border border-ink-100'}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-[9.5px] uppercase tracking-[.14em] font-bold px-2 py-0.5 rounded-md ${
                    rec.priority === 'high' ? 'bbg' :
                    rec.priority === 'medium' ? 'bbg-soft' :
                                                'bg-ink-100 text-ink-700'
                  }`}>{PRIORITY_LABEL[rec.priority]}</span>
                </div>
                <h3 className="mt-2 font-extrabold text-[15px] tracking-tight">{rec.title}</h3>
                <p className="mt-1.5 text-[12px] leading-[1.55] text-ink-700">{rec.body}</p>
                {rec.exemplar && (
                  <div className="mt-2.5 pt-2 border-t border-ink-100 text-[11px]">
                    <span className="font-bold text-ink-800">{rec.exemplar.company}: </span>
                    <span className="text-ink-600">{rec.exemplar.note}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-12 pt-6 border-t border-ink-100 flex items-center justify-between text-[10px] text-ink-500">
          <span>Generated {new Date(r.generatedAt).toLocaleString()} · {r.generatedBy === 'claude' ? 'Powered by Claude' : 'Deterministic engine'}</span>
          <span>agentmint.com</span>
        </footer>
      </div>
    </div>
  );
}
