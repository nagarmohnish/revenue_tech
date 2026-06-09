'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

// ──────────────────────────────────────────────────────────────────────────────
// AgentMint marketing landing — concept-9 design.
//
// Visual system:
//   • Background: #101014 (near-black)
//   • Accent:     #FF7A1A (safety orange)
//   • Body text:  #F2F2F0 (off-white)
//   • Type:       Archivo Black (display), Archivo (body), Martian Mono (mono)
//   • Surfaces:   square corners, thin orange-tinted borders, glow shadows
//   • Hero:       Three.js scene — orange rails converging on a glowing junction,
//                 reflected on a virtual floor, with bloom post-processing
//   • Scroll:     Lenis smooth scroll, scroll velocity drives camera glide
// ──────────────────────────────────────────────────────────────────────────────

const STATS = [
  { k: '~30 min',  v: 'to instrument an agent' },
  { k: '2 modes',  v: 'prepaid · usage-based' },
  { k: '5 rails',  v: 'Stripe · PayPal · UPI · …' },
  { k: '1 console', v: 'every agent in one place' },
];

const PREPAID_PTS = [
  'One balance across every agent in the suite',
  'Auto-reload at a threshold, or stop-at-zero',
  'Structured 402 with upgrade offer + price built in',
  'Per-agent attribution underneath',
];

const USAGE_PTS = [
  'Postpaid metered usage per workspace',
  'Auto-generated invoice on a fixed cycle',
  'Card-on-file via Stripe / Razorpay',
  'Per-agent line items on the invoice',
];

const DEBITS = [
  { agent: 'writer',    action: 'generate_doc', amt: '−25' },
  { agent: 'analyzer',  action: 'score_page',   amt: '−30' },
  { agent: 'scheduler', action: 'queue_task',   amt: '−12' },
];

const LINE_ITEMS = [
  { agent: 'writer',    action: 'generate_doc', qty: '4,012', calc: '4,012 × $0.030', total: '$120.36' },
  { agent: 'analyzer',  action: 'score_page',   qty: '3,450', calc: '3,450 × $0.030', total: '$103.50' },
  { agent: 'scheduler', action: 'queue_task',   qty: '1,462', calc: '1,462 × $0.041', total: '$60.30' },
];

const REVENUE = [
  { agent: 'writer',    amt: '$5,084', w: '100%' },
  { agent: 'analyzer',  amt: '$3,392', w: '67%' },
  { agent: 'scheduler', amt: '$1,696', w: '33%' },
];

const WHY_CARDS = [
  { n: 1, title: 'Monetize what you build', body: 'You ship the agent. We ship the credits, plans, invoices and money rail underneath. Two HTTP calls per agent.' },
  { n: 2, title: 'One dashboard, every agent', body: 'Wallets, plans, invoices, customers and per-agent revenue — for one agent or fifty — in a single console.' },
  { n: 3, title: 'Built for solos and studios', body: 'Same contract whether you ship one indie agent or run a studio with twenty agents across multiple clients.' },
];

const PLANS = [
  { name: 'Pilot',   price: '$0',   per: 'first cohort', popular: false, cta: 'Apply',
    desc: 'For the first six builders we onboard while Connect hardens.',
    pts: ['Unlimited agents', 'Up to 3 paying workspaces', 'Both billing modes', 'Direct line to the team'] },
  { name: 'Starter', price: '$49',  per: '/ month',      popular: true,  cta: 'Start free',
    desc: 'For solo devs and small startups shipping their first paying agents.',
    pts: ['Up to 25 workspaces', 'Stripe + PayPal + Apple Pay (USD)', 'Both billing modes', 'Email + Slack support'] },
  { name: 'Growth',  price: '$199', per: '/ month',      popular: false, cta: 'Start free',
    desc: 'For studios and agencies running multiple agents across clients.',
    pts: ['Unlimited workspaces', 'Razorpay + UPI + GST (in build)', 'Both billing modes', 'Priority pilot status'] },
];

const FAQS = [
  { q: 'Can I use prepaid and usage-based at the same time?', a: 'Yes. You can run a credit wallet for one workspace and usage-based invoicing for another — sometimes the same customer wants both. The dashboard treats them as two billing modes on the same wallet primitive.' },
  { q: 'Do I have to use an SDK?', a: 'No. SDKs (TypeScript, Python, Go) are convenience wrappers — under them it is still two raw HTTPS POST calls. Pick whichever fits your stack.' },
  { q: 'Which payment rails are live?', a: 'Stripe Connect (USD, ACH, Apple Pay) ships first. Razorpay + UPI autopay (INR) and PayPal land next on the priority queue.' },
  { q: 'How does payout work?', a: "Through your own merchant account on each rail. AgentMint never holds the money — payouts go straight to your bank on the rail's schedule." },
  { q: 'Is this the same as x402?', a: 'No. x402 lets agents pay autonomously. AgentMint lets humans pay for the agents you ship.' },
];

const SDK_CODE: Record<'ts' | 'py' | 'go', string> = {
  ts: `import { AgentMint } from '@agentmint/sdk';

const am = new AgentMint({ apiKey: process.env.AGENTMINT_KEY! });

// before the agent runs — works for both prepaid and postpaid
const decision = await am.authorize({
  workspaceId, product: 'writer', action: 'generate_doc', cost: 25,
});
if (!decision.allow) throw new Error(decision.reason);

// on success
await am.debit({
  workspaceId, product: 'writer', action: 'generate_doc', cost: 25, resourceId,
});`,
  py: `from agentmint import AgentMint

am = AgentMint(api_key="am_live_…")

# before the agent runs
d = am.authorize(workspace_id=ws, product="writer", action="generate_doc", cost=25)
if not d.allow: raise RuntimeError(d.reason)

# on success
am.debit(workspace_id=ws, product="writer", action="generate_doc",
         cost=25, resource_id=doc_id)`,
  go: `import am "github.com/nagarmohnish/agentmint-go"

c, _ := am.New("am_live_…")

// before the agent runs
d, err := c.Authorize(ctx, am.AuthorizeArgs{
  WorkspaceID: ws, Product: "writer", Action: "generate_doc", Cost: 25,
})
if !d.Allow { log.Fatal(d.Reason) }

// on success
c.Debit(ctx, am.DebitArgs{
  AuthorizeArgs: ..., ResourceID: docID,
})`,
};

const INSTALL: Record<'ts' | 'py' | 'go', string> = {
  ts: 'npm install @agentmint/sdk',
  py: 'pip install agentmint',
  go: 'go get github.com/nagarmohnish/agentmint-go',
};

const SOLO_WHO = [
  { tag: 'One indie agent', title: 'shipping next week', pts: [
    'Wrap your agent route with authorize() + debit() — done in an afternoon',
    'Pick prepaid OR usage-based for your customers',
    'Connect your own Stripe account once, payouts land in your bank',
    'No SDK lock-in — raw HTTPS works too',
  ]},
  { tag: 'AI startup', title: 'multiple agents in one suite', pts: [
    'One credit wallet across every agent your customer uses',
    'Per-agent revenue attribution in one dashboard',
    'Switch billing mode per-workspace as you grow',
    'Trial credits + 402 upgrade flow built in',
  ]},
];

const STUDIO_WHO = [
  { tag: 'Studio', title: 'agents built for multiple clients', pts: [
    'Each client is a tenant; their workspaces are isolated by API key',
    'Bill clients prepaid OR postpaid — pick per client',
    'Per-client revenue dashboard + invoice exports',
    'White-label customer console at [client].agentmint.com (in build)',
  ]},
  { tag: 'Agency', title: 'resell agents at scale', pts: [
    'Spin up a new client workspace via POST /v1/workspaces',
    'Plan gating + structured 402 on every agent route',
    'Your platform fee + their plan price, settled separately',
    'GST-compliant invoicing for India clients (in build)',
  ]},
];

// ──────────────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [billing, setBilling] = useState<'prepaid' | 'usage'>('prepaid');
  const [who, setWho]         = useState<'solo' | 'studio'>('solo');
  const [sdk, setSdk]         = useState<'ts' | 'py' | 'go'>('ts');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneCleanup = useRef<(() => void) | null>(null);

  // Init the Three.js scene once the libs are present on window.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;
    let waits = 0;

    const tryInit = () => {
      if (cancelled) return;
      const THREE = (window as any).THREE;
      const ready = THREE && THREE.EffectComposer && THREE.UnrealBloomPass;
      if (!ready) {
        waits += 1;
        if (waits > 60) return; // give up gracefully — the canvas just sits dark
        setTimeout(tryInit, 110);
        return;
      }
      sceneCleanup.current = initScene(canvasRef.current, (window as any).Lenis);
    };
    tryInit();
    return () => {
      cancelled = true;
      sceneCleanup.current?.();
    };
  }, []);

  return (
    <div className="relative bg-ink-950 text-ink-50 overflow-hidden font-sans">

      {/* Three.js + Lenis loaded from CDN */}
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" strategy="afterInteractive" />
      <Script
        id="three-postprocessing"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
(function(){
  var base='https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/';
  var files=['shaders/CopyShader.js','shaders/LuminosityHighPassShader.js','postprocessing/EffectComposer.js','postprocessing/RenderPass.js','postprocessing/ShaderPass.js','postprocessing/UnrealBloomPass.js'];
  function load(i){ if(i>=files.length) return; var s=document.createElement('script'); s.src=base+files[i]; s.async=false; s.onload=function(){load(i+1);}; s.onerror=function(){load(i+1);}; document.head.appendChild(s); }
  (function start(){ if(window.THREE){ load(0); } else { setTimeout(start,80); } })();
})();`,
        }}
      />
      <Script src="https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/dist/lenis.min.js" strategy="afterInteractive" />

      {/* WebGL canvas + gradient overlay */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none', display: 'block' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', background: 'linear-gradient(95deg,rgba(16,16,20,0.82) 0%,rgba(16,16,20,0.45) 42%,rgba(16,16,20,0.08) 70%),linear-gradient(0deg,rgba(16,16,20,0.6) 0%,transparent 35%)' }} />

      <div className="relative z-[2]">

        {/* ─── NAV ─── */}
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 md:px-8 py-4 bg-ink-950/55 backdrop-blur-md border-b border-saf-500/12">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-3 h-3 bg-saf-500 shadow-[0_0_14px_#FF7A1A]" />
            <span className="font-bold text-[16px] tracking-tight">AgentMint</span>
          </Link>
          <div className="hidden md:flex items-center gap-7 font-mono text-[12.5px] text-ink-50/60">
            <a href="#modes" className="hover:text-saf-500 transition">Platform</a>
            <a href="#who" className="hover:text-saf-500 transition">Solutions</a>
            <a href="#features" className="hover:text-saf-500 transition">Resources</a>
            <a href="#pricing" className="hover:text-saf-500 transition">Pricing</a>
          </div>
          <div className="flex items-center gap-4 font-mono text-[12.5px]">
            <Link href="/login" className="text-ink-50/60 hover:text-ink-50">Sign in</Link>
            <Link href="/build/signup" className="bg-saf-500 text-ink-950 px-4 py-2 font-semibold shadow-[0_0_18px_rgba(255,122,26,0.35)] hover:shadow-[0_0_28px_rgba(255,122,26,0.55)] transition">
              Start free
            </Link>
          </div>
        </nav>

        {/* ─── HERO ─── */}
        <header className="min-h-screen flex flex-col justify-center px-6 md:px-8 pt-36 pb-20 max-w-[1180px] mx-auto">
          <div className="inline-flex items-center gap-2.5 font-mono text-[12px] uppercase tracking-[.14em] text-saf-500 mb-7">
            <span className="w-[7px] h-[7px] bg-saf-500 rounded-full animate-[lgblink_1.8s_ease-in-out_infinite]" />
            Monetization infrastructure for AI agents
          </div>
          <h1 className="font-display uppercase text-[clamp(42px,7.6vw,104px)] leading-[0.9] tracking-[-0.015em] mb-7">
            People build.<br />
            <span className="text-saf-500">We monetize.</span>
          </h1>
          <p className="text-[clamp(17px,2vw,21px)] max-w-[640px] text-ink-50/65 leading-[1.55] mb-10">
            Prepaid credits or usage-based invoicing. One dashboard for both. Drop two HTTP calls into any agent — solo dev, startup, or studio shipping to multiple clients — and start collecting revenue.
          </p>
          <div className="flex gap-3.5 flex-wrap mb-16">
            <Link href="/build/signup" className="bg-saf-500 text-ink-950 px-7 py-4 font-semibold text-[15px] shadow-[0_0_26px_rgba(255,122,26,0.4)] hover:shadow-[0_0_36px_rgba(255,122,26,0.55)] transition">Start free</Link>
            <a href="#modes" className="border border-saf-500/30 px-7 py-4 font-mono text-[14px] text-ink-50 hover:border-saf-500 hover:text-saf-500 transition">See how billing works</a>
          </div>
          <StatTiles />
        </header>

        {/* ─── MODES ─── */}
        <section id="modes" className="max-w-[1180px] mx-auto px-6 md:px-8 py-24 relative">
          <Eyebrow>Two billing modes</Eyebrow>
          <h2 className="font-display uppercase text-[clamp(28px,4vw,48px)] leading-[1.02] mt-5 mb-5 max-w-[760px]">Charge how your customers want to pay.</h2>
          <p className="text-[18px] text-ink-50/60 max-w-[620px] mb-9">Switch per-workspace. Same SDK contract. Same dashboard. The wallet primitive carries both models.</p>

          <SegTabs value={billing} onChange={(v) => setBilling(v as any)} options={[{ value: 'prepaid', label: 'Prepaid credits' }, { value: 'usage', label: 'Usage-based' }]} className="mb-9" />

          {billing === 'prepaid' ? (
            <ModePanel
              tag="MODE 01 · PREPAID"
              title="Top-up. Use. Stop at zero."
              body={<>Your customer adds credits up front. Every <code className="font-mono text-saf-500">authorize()</code> / <code className="font-mono text-saf-500">debit()</code> draws from the same wallet across every agent they use. When the balance hits zero, the next <code className="font-mono text-saf-500">authorize()</code> returns a structured 402 — no overage, no surprise bills.</>}
              points={PREPAID_PTS}
              mock={<WalletMock />}
            />
          ) : (
            <ModePanel
              tag="MODE 02 · USAGE-BASED"
              title="Use first. Invoice at month end."
              body={<>Same <code className="font-mono text-saf-500">authorize()</code> / <code className="font-mono text-saf-500">debit()</code> — but instead of decrementing a balance, calls accumulate on the meter. On the 1st of each month, an invoice is generated, posted to your customer's Stripe / Razorpay account, and reconciled automatically.</>}
              points={USAGE_PTS}
              mock={<InvoiceMock />}
            />
          )}
        </section>

        {/* ─── WHY ─── */}
        <section id="features" className="max-w-[1180px] mx-auto px-6 md:px-8 py-24">
          <Eyebrow>Why AgentMint</Eyebrow>
          <h2 className="font-display uppercase text-[clamp(28px,4vw,48px)] leading-[1.02] mt-5 mb-12 max-w-[680px]">You build the agent. We do the rest.</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-saf-500/14 border border-saf-500/14">
            {WHY_CARDS.map((c) => (
              <div key={c.n} className="bg-ink-950 p-8">
                <div className="font-mono text-[13px] text-saf-500 mb-4">0{c.n}</div>
                <h3 className="text-[21px] font-semibold tracking-tight mb-3">{c.title}</h3>
                <p className="text-ink-50/60 text-[15px] leading-[1.6]">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── WHO ─── */}
        <section id="who" className="max-w-[1180px] mx-auto px-6 md:px-8 py-24">
          <Eyebrow>Who it's for</Eyebrow>
          <h2 className="font-display uppercase text-[clamp(28px,4vw,48px)] leading-[1.02] mt-5 mb-7 max-w-[680px]">One agent or fifty. Same contract.</h2>
          <SegTabs value={who} onChange={(v) => setWho(v as any)} options={[{ value: 'solo', label: 'Solo / startup' }, { value: 'studio', label: 'Studio / agency' }]} className="mb-9" />
          <div className="grid md:grid-cols-2 gap-6">
            {(who === 'solo' ? SOLO_WHO : STUDIO_WHO).map((c, i) => (
              <div key={i} className="border border-saf-500/16 p-8 bg-white/[0.015]">
                <h3 className="text-[19px] font-semibold mb-5 tracking-tight"><span className="text-saf-500">{c.tag}</span> · {c.title}</h3>
                <ul className="space-y-3">
                  {c.pts.map((p) => (
                    <li key={p} className="flex gap-3 items-start text-[14.5px] text-ink-50/78 leading-[1.5]">
                      <span className="text-saf-500 font-mono flex-shrink-0">›</span>{p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CONSOLE ─── */}
        <section className="max-w-[1180px] mx-auto px-6 md:px-8 py-24">
          <Eyebrow>The console</Eyebrow>
          <h2 className="font-display uppercase text-[clamp(28px,4vw,48px)] leading-[1.02] mt-5 mb-5 max-w-[680px]">Every agent. Every customer. One screen.</h2>
          <p className="text-[18px] text-ink-50/60 max-w-[640px] mb-9">Wallets, invoices, plans, customers and per-agent revenue — across both billing modes — in a single console.</p>
          <ConsoleMock />
        </section>

        {/* ─── INTEGRATION ─── */}
        <section className="max-w-[1180px] mx-auto px-6 md:px-8 py-24">
          <Eyebrow>Integration</Eyebrow>
          <h2 className="font-display uppercase text-[clamp(28px,4vw,48px)] leading-[1.02] mt-5 mb-7 max-w-[760px]">Two HTTP calls. Three SDKs. Pick your stack.</h2>
          <div className="flex items-center gap-5 flex-wrap mb-5">
            <SegTabs value={sdk} onChange={(v) => setSdk(v as any)} options={[{ value: 'ts', label: 'TypeScript' }, { value: 'py', label: 'Python' }, { value: 'go', label: 'Go' }]} />
            <span className="font-mono text-[13px] text-ink-50/55">Install <span className="text-saf-500">{INSTALL[sdk]}</span></span>
          </div>
          <div className="border border-saf-500/20 bg-ink-800/80">
            <pre className="font-mono text-[13px] leading-[1.65] p-6 overflow-auto whitespace-pre"><code>{renderCode(SDK_CODE[sdk])}</code></pre>
          </div>
          <div className="flex gap-6 flex-wrap mt-5 font-mono text-[12.5px] text-ink-50/55">
            <span><span className="text-saf-500">✓</span> Any HTTPS stack works without an SDK</span>
            <span><span className="text-saf-500">✓</span> Webhooks on every billing event</span>
            <span><span className="text-saf-500">✓</span> Idempotent debit by resource_id</span>
          </div>
        </section>

        {/* ─── PRICING ─── */}
        <section id="pricing" className="max-w-[1180px] mx-auto px-6 md:px-8 py-24">
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="font-display uppercase text-[clamp(28px,4vw,48px)] leading-[1.02] mt-5 mb-12 max-w-[680px]">Start free. Pay when you earn.</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((p) => (
              <div key={p.name} className={`relative p-8 ${p.popular ? 'bg-saf-500/4 border border-saf-500/55 shadow-[0_0_50px_rgba(255,122,26,0.12)]' : 'bg-white/[0.015] border border-saf-500/16'}`}>
                {p.popular && <div className="absolute -top-px -right-px bg-saf-500 text-ink-950 font-mono text-[11px] font-bold py-1.5 px-3 tracking-[.08em]">MOST POPULAR</div>}
                <div className="font-mono text-[14px] tracking-[.1em] text-ink-50/60 mb-4">{p.name}</div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="font-mono text-[46px] font-medium text-saf-500 tracking-[-0.02em]">{p.price}</span>
                  <span className="text-[14px] text-ink-50/50">{p.per}</span>
                </div>
                <p className="text-[13.5px] text-ink-50/55 leading-[1.55] mb-6 min-h-[42px]">{p.desc}</p>
                <ul className="space-y-3 mb-7">
                  {p.pts.map((f) => (
                    <li key={f} className="flex gap-2.5 items-start text-[14px] text-ink-50/80">
                      <span className="text-saf-500 flex-shrink-0">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link href="/build/signup" className={`block text-center font-mono py-3.5 text-[14px] font-semibold transition ${p.popular ? 'bg-saf-500 text-ink-950 hover:bg-saf-400' : 'border border-saf-500/30 text-ink-50 hover:border-saf-500 hover:text-saf-500'}`}>{p.cta}</Link>
              </div>
            ))}
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="max-w-[900px] mx-auto px-6 md:px-8 py-24">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="font-display uppercase text-[clamp(28px,4vw,48px)] leading-[1.02] mt-5 mb-10">Quick answers.</h2>
          <div className="border-t border-saf-500/16">
            {FAQS.map((f, i) => (
              <div key={i} className="py-7 border-b border-saf-500/16">
                <h3 className="text-[19px] font-semibold mb-3 flex gap-4">
                  <span className="text-saf-500 font-mono text-[14px] pt-[3px]">Q</span>
                  <span>{f.q}</span>
                </h3>
                <p className="text-ink-50/65 text-[15px] leading-[1.6] pl-7">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="max-w-[1180px] mx-auto px-6 md:px-8 py-32 text-center">
          <h2 className="font-display uppercase text-[clamp(38px,6.6vw,86px)] leading-[0.98] tracking-[-0.015em] mb-6">You build. <span className="text-saf-500">We monetize.</span></h2>
          <p className="text-[19px] text-ink-50/65 mb-10 max-w-[520px] mx-auto">The pilot cohort is open. $0 while we harden Connect together.</p>
          <div className="flex gap-3.5 justify-center flex-wrap">
            <Link href="/apply" className="bg-saf-500 text-ink-950 px-8 py-4 font-semibold text-[15px] shadow-[0_0_30px_rgba(255,122,26,0.45)] hover:shadow-[0_0_42px_rgba(255,122,26,0.6)] transition">Apply to pilot</Link>
            <a href="#modes" className="border border-saf-500/30 px-8 py-4 font-mono text-[14px] hover:border-saf-500 hover:text-saf-500 transition">See billing modes</a>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="border-t border-saf-500/12 py-10 px-8 max-w-[1180px] mx-auto flex items-center justify-between flex-wrap gap-5">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-saf-500 shadow-[0_0_12px_#FF7A1A]" />
            <span className="font-bold">AgentMint</span>
          </div>
          <div className="flex gap-7 font-mono text-[13px] text-ink-50/55">
            <a href="#modes" className="hover:text-saf-500 transition">Modes</a>
            <a href="#features" className="hover:text-saf-500 transition">Features</a>
            <a href="#pricing" className="hover:text-saf-500 transition">Pricing</a>
            <a href="https://github.com/nagarmohnish/revenue_tech" target="_blank" rel="noreferrer" className="text-saf-500">GitHub ↗</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="font-mono text-[12px] uppercase tracking-[.14em] text-saf-500">{children}</div>;
}

function StatTiles() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-saf-500/14 border border-saf-500/14">
      {STATS.map((s, i) => (
        <div key={i} className="bg-ink-950 px-5 py-5">
          <div className="font-mono text-[28px] font-medium text-saf-500 tracking-[-0.02em]">{s.k}</div>
          <div className="text-[13px] text-ink-50/55 mt-1.5">{s.v}</div>
        </div>
      ))}
    </div>
  );
}

function SegTabs({ value, onChange, options, className = '' }: { value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }>; className?: string }) {
  return (
    <div className={`inline-flex border border-saf-500/20 ${className}`}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)} className={`px-6 py-2.5 font-mono text-[13.5px] font-semibold transition ${active ? 'bg-saf-500 text-ink-950' : 'bg-transparent text-ink-50/60 hover:text-ink-50'}`}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function ModePanel({ tag, title, body, points, mock }: { tag: string; title: string; body: React.ReactNode; points: string[]; mock: React.ReactNode }) {
  return (
    <div className="grid lg:grid-cols-2 gap-10 items-start border border-saf-500/14 p-10 bg-white/[0.015]">
      <div>
        <div className="font-mono text-[12px] tracking-[.12em] text-saf-500 mb-4">{tag}</div>
        <h3 className="font-display uppercase text-[26px] leading-[1.05] mb-4">{title}</h3>
        <p className="text-ink-50/65 mb-6 leading-[1.6]">{body}</p>
        <ul className="space-y-3">
          {points.map((p) => (
            <li key={p} className="flex gap-3 items-start text-[15px] text-ink-50/80">
              <span className="text-saf-500 font-mono flex-shrink-0">›</span>{p}
            </li>
          ))}
        </ul>
      </div>
      {mock}
    </div>
  );
}

function WalletMock() {
  return (
    <div className="border border-saf-500/28 bg-ink-800 shadow-[0_0_50px_rgba(255,122,26,0.08)]">
      <div className="flex justify-between items-center px-5 py-4 border-b border-saf-500/14">
        <span className="text-[13px] text-ink-50/60">Wallet balance</span>
        <span className="font-mono text-[12px] text-saf-500">workspace_ac82</span>
      </div>
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-[40px] font-medium text-saf-500 tracking-[-0.02em]">2,184</span>
          <span className="text-[14px] text-ink-50/55">credits</span>
          <span className="ml-auto font-mono text-[12px] text-ink-50/50">~23 days</span>
        </div>
        <div className="h-1 bg-saf-500/14 mt-3.5"><div className="w-[72%] h-full bg-saf-500 shadow-[0_0_12px_#FF7A1A]" /></div>
      </div>
      <div className="px-5 pb-5">
        <div className="font-mono text-[11px] tracking-[.1em] text-ink-50/45 mb-2.5">RECENT DEBITS</div>
        {DEBITS.map((d, i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 text-[13px]">
            <span className="text-ink-50/78"><span className="text-saf-500">{d.agent}</span> · {d.action}</span>
            <span className="font-mono text-ink-50/60">{d.amt}</span>
          </div>
        ))}
        <div className="flex justify-between items-center mt-4">
          <span className="font-mono text-[12px] text-ink-50/50">Auto-reload at 200 cr</span>
          <span className="bg-saf-500 text-ink-950 px-4 py-1.5 font-semibold text-[13px]">Top up</span>
        </div>
      </div>
    </div>
  );
}

function InvoiceMock() {
  return (
    <div className="border border-saf-500/28 bg-ink-800 shadow-[0_0_50px_rgba(255,122,26,0.08)]">
      <div className="flex justify-between items-center px-5 py-4 border-b border-saf-500/14">
        <span className="text-[13px] text-ink-50/60">June invoice · <span className="text-saf-500">draft</span></span>
        <span className="font-mono text-[12px] text-ink-50/50">cycle: monthly</span>
      </div>
      <div className="px-5 pt-5 pb-3.5">
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-[40px] font-medium text-saf-500 tracking-[-0.02em]">$284.16</span>
          <span className="text-[13px] text-ink-50/55">accrued</span>
          <span className="ml-auto font-mono text-[12px] text-ink-50/50">8,924 events</span>
        </div>
        <div className="flex justify-between text-[11px] font-mono text-ink-50/45 mt-3.5"><span>Jun 1</span><span>today</span></div>
        <div className="h-1 bg-saf-500/14 mt-1.5"><div className="w-[30%] h-full bg-saf-500 shadow-[0_0_12px_#FF7A1A]" /></div>
      </div>
      <div className="px-5 pb-5">
        <div className="font-mono text-[11px] tracking-[.1em] text-ink-50/45 mb-2.5">LINE ITEMS</div>
        {LINE_ITEMS.map((l, i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 text-[13px]">
            <span>
              <span className="text-saf-500">{l.agent}</span> · {l.action}<br/>
              <span className="font-mono text-[11px] text-ink-50/45">{l.calc}</span>
            </span>
            <span className="font-mono text-ink-50/85">{l.total}</span>
          </div>
        ))}
        <div className="flex justify-between items-center mt-4">
          <span className="font-mono text-[12px] text-ink-50/50">Auto-charge Jul 1 · Visa •• 4242</span>
          <span className="font-mono text-[12px] text-saf-500 border border-saf-500/40 px-3 py-1.5">Net 0</span>
        </div>
      </div>
    </div>
  );
}

function ConsoleMock() {
  return (
    <div className="border border-saf-500/24 bg-[#15151A] shadow-[0_0_70px_rgba(255,122,26,0.07)]">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-saf-500/14">
        <span className="w-2.5 h-2.5 bg-saf-500 shadow-[0_0_8px_#FF7A1A]" />
        <span className="w-2.5 h-2.5 bg-saf-500/40" />
        <span className="w-2.5 h-2.5 bg-saf-500/20" />
        <span className="ml-2 font-mono text-[12px] text-ink-50/55">console · workspace_ac82</span>
        <span className="ml-auto font-mono text-[12px] text-saf-500">Active <b className="font-bold">128</b> <span className="text-ink-50/45">workspaces this month</span></span>
      </div>
      <div className="grid md:grid-cols-3 gap-px bg-saf-500/10">
        {/* Wallet tile */}
        <div className="bg-[#15151A] p-6">
          <div className="flex justify-between text-[12px] text-ink-50/55 mb-4"><span>Prepaid wallet</span><span className="font-mono text-saf-500">workspace_ac82</span></div>
          <div className="font-mono text-[34px] text-saf-500 tracking-[-0.02em]">2,184<span className="text-[13px] text-ink-50/50 ml-2">credits</span></div>
          <div className="font-mono text-[11px] text-ink-50/40 mt-2.5 mb-1">816 / 3,000 used</div>
          <div className="h-1 bg-saf-500/14"><div className="w-[27%] h-full bg-saf-500" /></div>
          <div className="flex gap-5 mt-4.5">
            <div><div className="font-mono text-[18px]">45 cr</div><div className="text-[11px] text-ink-50/45">Burn / day</div></div>
            <div><div className="font-mono text-[18px]">~23</div><div className="text-[11px] text-ink-50/45">Days left</div></div>
            <span className="ml-auto self-center text-[12px] bg-saf-500 text-ink-950 px-3.5 py-1.5 font-semibold">Top up +500</span>
          </div>
        </div>
        {/* Invoice tile */}
        <div className="bg-[#15151A] p-6">
          <div className="flex justify-between text-[12px] text-ink-50/55 mb-4"><span>Usage invoice · June</span><span className="font-mono text-saf-500">draft</span></div>
          <div className="font-mono text-[28px] text-saf-500 tracking-[-0.02em]">$284.16</div>
          <div className="font-mono text-[11px] text-ink-50/40 mt-1.5 mb-3.5">accrued · 8,924 events</div>
          {LINE_ITEMS.map((l, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 text-[12.5px]">
              <span className="text-ink-50/75"><span className="text-saf-500">{l.agent}</span> · {l.action}<span className="font-mono text-ink-50/40 ml-2">{l.qty}</span></span>
              <span className="font-mono">{l.total}</span>
            </div>
          ))}
        </div>
        {/* Revenue tile */}
        <div className="bg-[#15151A] p-6">
          <div className="text-[12px] text-ink-50/55 mb-4.5">Per-agent revenue</div>
          {REVENUE.map((r, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between text-[13px] mb-1.5"><span className="text-ink-50/80">{r.agent}</span><span className="font-mono text-saf-500">{r.amt}</span></div>
              <div className="h-1.5 bg-saf-500/12"><div className="h-full bg-saf-500 shadow-[0_0_10px_rgba(255,122,26,0.5)]" style={{ width: r.w }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Render code with light syntax tint for comments (orange).
function renderCode(src: string) {
  return src.split('\n').map((line, i) => {
    const tr = line.trim();
    const isComment = tr.startsWith('//') || tr.startsWith('#');
    return (
      <div key={i} style={{ color: isComment ? 'rgba(255,122,26,0.7)' : 'rgba(242,242,240,0.9)' }}>
        {line || ' '}
      </div>
    );
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Three.js scene — rails converging to a glowing junction (the AgentMint hub).
// Direct port of concept-9's scene; runs in plain JS off the THREE global.
// Returns a cleanup function.
// ──────────────────────────────────────────────────────────────────────────────

function initScene(canvas: HTMLCanvasElement | null, Lenis: any): (() => void) | null {
  if (!canvas) return null;
  const THREE = (window as any).THREE;
  if (!THREE) return null;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile  = window.innerWidth < 760;

  let renderer: any;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !mobile, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.3 : 1.6));
  renderer.setClearColor(0x101014, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;

  const W = () => window.innerWidth, H = () => window.innerHeight;
  renderer.setSize(W(), H());

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x101014, 0.009);
  const camera = new THREE.PerspectiveCamera(55, W() / H(), 0.1, 400);
  camera.position.set(0, 3.4, 24);

  const SAF = new THREE.Color(0xFF7A1A);
  const UPI = 3;
  const junction = new THREE.Vector3(0, 0, 2);

  const mkTubeMat = (reflect: boolean) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uTime: { value: 0 }, uBoost: { value: 0 }, uColor: { value: SAF }, uReflect: { value: reflect ? 0.42 : 1.0 }, uRate: { value: 1.0 } },
    vertexShader: `varying vec2 vUv; varying float vDepth;
      void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `precision highp float; varying vec2 vUv; varying float vDepth;
      uniform float uTime, uBoost, uReflect, uRate; uniform vec3 uColor;
      void main(){
        float base = 0.14;
        float flow = vUv.x * 6.0 - uTime * (1.1 + uBoost) * uRate;
        float pulse = pow(0.5 + 0.5*sin(flow*6.2831853), 9.0) * 1.6;
        float grad = smoothstep(0.0, 1.0, vUv.x) * 0.32;
        float around = smoothstep(0.0, 0.5, vUv.y) * smoothstep(1.0, 0.5, vUv.y);
        float i = (base + pulse + grad);
        i *= smoothstep(0.0, 0.04, vUv.x);
        float fog = clamp((vDepth - 6.0) / 46.0, 0.0, 1.0);
        i *= (1.0 - fog * 0.82);
        i *= uReflect * (0.55 + around * 0.9);
        gl_FragColor = vec4(uColor * i, clamp(i, 0.0, 1.0));
      }`,
  });

  const railGroup = new THREE.Group();
  const reflGroup = new THREE.Group();
  reflGroup.scale.y = -1; reflGroup.position.y = -6.0;
  scene.add(railGroup); scene.add(reflGroup);

  const angles = [-1.18, -0.6, 0.0, 0.6, 1.18];
  const tubeMats: any[] = [];
  angles.forEach((a, idx) => {
    const start = new THREE.Vector3(Math.sin(a) * 30, (idx % 2 ? 1.4 : -0.6), -Math.cos(a) * 30 - 4);
    const ctrl  = new THREE.Vector3(Math.sin(a) * 11, Math.sin(a) * 2.2, -9);
    const curve = new THREE.QuadraticBezierCurve3(start, ctrl, junction.clone());
    const geo = new THREE.TubeGeometry(curve, 70, mobile ? 0.05 : 0.06, 7, false);
    const mat = mkTubeMat(false); mat.uniforms.uRate.value = (idx === UPI) ? 1.7 : 1.0;
    tubeMats.push(mat);
    railGroup.add(new THREE.Mesh(geo, mat));
    const rmat = mkTubeMat(true); rmat.uniforms.uRate.value = mat.uniforms.uRate.value;
    tubeMats.push(rmat);
    reflGroup.add(new THREE.Mesh(geo, rmat));
  });

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 24), new THREE.MeshBasicMaterial({ color: SAF }));
  core.position.copy(junction); scene.add(core);

  const floorMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: SAF } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `precision highp float; varying vec2 vUv; uniform vec3 uColor;
      void main(){ float d = length(vUv - 0.5); float sheen = exp(-d * 7.0) * 0.5; gl_FragColor = vec4(uColor * sheen, sheen * 0.7); }`,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -3, 2); scene.add(floor);

  const dN = mobile ? 200 : 600;
  const dgeo = new THREE.BufferGeometry();
  const dp = new Float32Array(dN * 3);
  for (let i = 0; i < dN; i++) {
    dp[i * 3]     = (Math.random() - 0.5) * 60;
    dp[i * 3 + 1] = (Math.random() - 0.5) * 22;
    dp[i * 3 + 2] = -Math.random() * 60 + 10;
  }
  dgeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  scene.add(new THREE.Points(dgeo, new THREE.PointsMaterial({ color: SAF, size: 0.07, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending })));

  let composer: any = null, bloom: any = null;
  if (THREE.EffectComposer && THREE.RenderPass && THREE.UnrealBloomPass) {
    try {
      composer = new THREE.EffectComposer(renderer);
      composer.addPass(new THREE.RenderPass(scene, camera));
      bloom = new THREE.UnrealBloomPass(new THREE.Vector2(W(), H()), mobile ? 0.7 : 0.98, 0.7, 0.22);
      composer.addPass(bloom);
      composer.setSize(W(), H());
    } catch { composer = null; }
  }

  let scrollVel = 0;
  let progress = 0, boost = 0;
  const docH = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

  let lenis: any = null;
  let lraf = 0;
  if (Lenis && !reduced) {
    try {
      lenis = new Lenis({ duration: 1.2, smoothWheel: true });
      lenis.on('scroll', (e: any) => { scrollVel = Math.min(Math.abs(e.velocity || 0) / 12, 2.4); });
      const tick = (t: number) => { lenis.raf(t); lraf = requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    } catch { /* Lenis is optional */ }
  }

  const onResize = () => { renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); if (composer) composer.setSize(W(), H()); if (bloom) bloom.setSize(W(), H()); };
  window.addEventListener('resize', onResize);

  const clock = new THREE.Clock();
  let raf = 0;
  const animate = () => {
    raf = requestAnimationFrame(animate);
    clock.getDelta();
    const tEl = clock.elapsedTime;
    progress = reduced ? 0.2 : Math.min(window.scrollY / docH(), 1);
    const tgB = reduced ? 0.4 : Math.min(scrollVel, 2.4);
    boost += (tgB - boost) * 0.06; scrollVel *= 0.92;
    tubeMats.forEach((m) => { m.uniforms.uTime.value = tEl; m.uniforms.uBoost.value = boost; });
    core.scale.setScalar(1 + Math.sin(tEl * 2.4) * 0.08);

    const e = progress * progress * (3 - 2 * progress);
    const sway = reduced ? 0 : Math.sin(tEl * 0.13);
    camera.position.x += ((sway * 2.2) - camera.position.x) * 0.04;
    camera.position.y += ((3.4 - e * 2.0 + (reduced ? 0 : Math.cos(tEl * 0.16) * 0.3)) - camera.position.y) * 0.05;
    camera.position.z += ((24 - e * 15) - camera.position.z) * 0.05;
    camera.lookAt(0, -0.2 + e * 0.2, junction.z);

    if (composer) composer.render(); else renderer.render(scene, camera);
    if (reduced) cancelAnimationFrame(raf);
  };
  animate();

  return () => {
    window.removeEventListener('resize', onResize);
    cancelAnimationFrame(raf);
    cancelAnimationFrame(lraf);
    try { lenis?.destroy(); } catch { /* */ }
    try { renderer.dispose(); } catch { /* */ }
  };
}
