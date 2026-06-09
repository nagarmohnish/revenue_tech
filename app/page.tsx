'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import {
  Wallet, Receipt, Gauge, Users, Building2, Layers, Code2, Webhook, ShieldCheck,
  ArrowRight, ArrowUpRight, Check, ChevronDown, Sparkles, BarChart3, Coins,
  TrendingUp, Boxes, CreditCard, Plug,
} from 'lucide-react';

// ─── DATA ────────────────────────────────────────────────────────────────────

const USPS = [
  {
    icon: Wallet,
    title: 'Monetize what you build',
    body: 'You ship the agent. We ship the credits, plans, invoices and money rail underneath. Two HTTP calls per agent.',
  },
  {
    icon: Layers,
    title: 'One dashboard, every agent',
    body: 'Wallets, plans, invoices, customers and per-agent revenue — for one agent or fifty — in a single console.',
  },
  {
    icon: Building2,
    title: 'Built for solos and studios',
    body: 'Same contract whether you ship one indie agent or run a studio with twenty agents across multiple clients.',
  },
];

const PLATFORM_CORE = [
  { icon: Wallet,      title: 'Prepaid credit wallet',  desc: 'Customer tops up · usage debits · stops at zero' },
  { icon: Receipt,     title: 'Usage-based invoicing',  desc: 'Meter usage · invoice automatically at month end' },
  { icon: Layers,      title: 'Plan gating',            desc: 'Authorize with structured 402 decisions' },
  { icon: BarChart3,   title: 'Per-agent revenue',      desc: 'Attribution + burn rate per agent, in one dashboard' },
  { icon: Code2,       title: 'SDKs · TS · Py · Go',    desc: 'Or two raw HTTPS calls — your choice' },
];

const PLATFORM_RAILS = [
  { icon: CreditCard, title: 'Stripe Connect', desc: 'USD · cards · ACH · payouts to your bank' },
  { icon: CreditCard, title: 'PayPal',         desc: 'Global checkout for non-card geographies' },
  { icon: CreditCard, title: 'Razorpay',       desc: 'INR cards + netbanking for India workspaces' },
  { icon: CreditCard, title: 'Apple Pay',      desc: 'One-tap mobile checkout via Stripe' },
  { icon: CreditCard, title: 'UPI · autopay',  desc: 'Recurring debit via UPI mandate (India)' },
];

const SOLUTIONS_WHO = [
  { title: 'Indie developers',  desc: 'Ship + bill in an afternoon' },
  { title: 'AI startups',       desc: 'Suite-wide credits with per-agent attribution' },
  { title: 'Studios & agencies', desc: 'Monetize agents you build for clients' },
];

const SOLUTIONS_STAGE = [
  { title: 'Pre-revenue MVP',   desc: 'Trial credits + 402 paywall in one move' },
  { title: 'Scaling pilots',    desc: 'Plan gating + Stripe Connect payouts' },
  { title: 'India-first launch', desc: 'UPI autopay + GST invoicing' },
];

const RESOURCES_MENU = [
  { title: 'Free Pricing Audit',       desc: 'Domain → competitive read + branded PDF',     href: '/audit' },
  { title: 'Deep Monetization Roadmap', desc: 'For companies with multiple agents + clients', href: '/roadmap' },
  { title: 'StackScore (funnel walker)', desc: 'Walk any checkout end-to-end',               href: '/stackscore' },
  { title: 'Concierge intake',          desc: 'Tell us about your agent · instant plan',     href: '/apply' },
  { title: 'GitHub',                    desc: 'github.com/nagarmohnish/revenue_tech',        href: 'https://github.com/nagarmohnish/revenue_tech' },
];

const SDK_TABS = [
  {
    id: 'js' as const,
    label: 'TypeScript',
    install: 'npm install @agentmint/sdk',
    code: `import { AgentMint } from '@agentmint/sdk';

const am = new AgentMint({ apiKey: process.env.AGENTMINT_KEY! });

// before the agent runs — works for both prepaid and postpaid
const decision = await am.<span class="tok">authorize</span>({
  workspaceId, product: 'writer', action: 'generate_doc', cost: 25,
});
if (!decision.allow) throw new Error(decision.reason);

// on success
await am.<span class="tok">debit</span>({
  workspaceId, product: 'writer', action: 'generate_doc', cost: 25, resourceId,
});`,
  },
  {
    id: 'python' as const,
    label: 'Python',
    install: 'pip install agentmint',
    code: `from agentmint import AgentMint

am = AgentMint(api_key="am_live_…")

# before the agent runs
d = am.<span class="tok">authorize</span>(workspace_id=ws, product="writer", action="generate_doc", cost=25)
if not d.allow: raise RuntimeError(d.reason)

# on success
am.<span class="tok">debit</span>(workspace_id=ws, product="writer", action="generate_doc",
         cost=25, resource_id=doc_id)`,
  },
  {
    id: 'go' as const,
    label: 'Go',
    install: 'go get github.com/nagarmohnish/agentmint-go',
    code: `import am "github.com/nagarmohnish/agentmint-go"

c, _ := am.New("am_live_…")

// before the agent runs
d, err := c.<span class="tok">Authorize</span>(ctx, am.AuthorizeArgs{
  WorkspaceID: ws, Product: "writer", Action: "generate_doc", Cost: 25,
})
if !d.Allow { log.Fatal(d.Reason) }

// on success
c.<span class="tok">Debit</span>(ctx, am.DebitArgs{
  AuthorizeArgs: ..., ResourceID: docID,
})`,
  },
];

const PRICING = [
  {
    name: 'Pilot',
    price: '$0',
    cadence: 'first cohort',
    desc: 'For the first six builders we onboard while Connect hardens.',
    items: ['Unlimited agents', 'Up to 3 paying workspaces', 'Both billing modes', 'Direct line to the team'],
    cta: 'Apply',
    accent: false,
  },
  {
    name: 'Starter',
    price: '$49',
    cadence: '/ month',
    desc: 'For solo devs and small startups shipping their first paying agents.',
    items: ['Up to 25 workspaces', 'Stripe + PayPal + Apple Pay (USD)', 'Both billing modes', 'Email + Slack support'],
    cta: 'Start free',
    accent: true,
  },
  {
    name: 'Growth',
    price: '$199',
    cadence: '/ month',
    desc: 'For studios and agencies running multiple agents across clients.',
    items: ['Unlimited workspaces', 'Razorpay + UPI + GST (in build)', 'Both billing modes', 'Priority pilot status'],
    cta: 'Start free',
    accent: false,
  },
];

const FAQ = [
  ['Can I use prepaid and usage-based at the same time?', 'Yes. You can run a credit wallet for one workspace and usage-based invoicing for another — sometimes the same customer wants both. The dashboard treats them as two billing modes on the same wallet primitive.'],
  ['Do I have to use an SDK?',                            'No. SDKs (TypeScript, Python, Go) are convenience wrappers — under them it is still two raw HTTPS POST calls. Pick whichever fits your stack.'],
  ['Which payment rails are live?',                       'Stripe Connect (USD, ACH, Apple Pay) ships first. Razorpay + UPI autopay (INR) and PayPal land next on the priority queue.'],
  ['How does payout work?',                               'Through your own merchant account on each rail. AgentMint never holds the money — payouts go straight to your bank on the rail\'s schedule.'],
  ['Is this the same as x402?',                           'No. x402 lets agents pay autonomously. AgentMint lets humans pay for the agents you ship.'],
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────

type Menu = 'platform' | 'solutions' | 'resources' | null;
type Mode  = 'prepaid' | 'postpaid';
type Audience = 'solo' | 'studio';

export default function LandingPage() {
  const [openMenu, setOpenMenu] = useState<Menu>(null);
  const [mode, setMode]         = useState<Mode>('prepaid');
  const [audience, setAudience] = useState<Audience>('solo');
  const [sdkTab, setSdkTab]     = useState<'js' | 'python' | 'go'>('js');

  // Live wallet preview tick — only when prepaid mode is selected (it's the wedge).
  const [balance, setBalance] = useState(2184);
  const [feed, setFeed] = useState<Array<{ id: number; name: string; cost: number; flash: boolean }>>([
    { id: 1, name: 'writer · generate_doc',  cost: 25, flash: false },
    { id: 2, name: 'analyzer · score_page',  cost: 30, flash: false },
    { id: 3, name: 'scheduler · queue_task', cost: 12, flash: false },
  ]);
  useEffect(() => {
    if (mode !== 'prepaid' || (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    const samples = [
      { name: 'writer · generate_doc',   cost: 25 },
      { name: 'analyzer · score_page',   cost: 30 },
      { name: 'scheduler · queue_task',  cost: 12 },
      { name: 'classifier · tag_intent', cost: 8  },
    ];
    let nextId = 1000, k = 0;
    const id = window.setInterval(() => {
      const s = samples[k % samples.length]; k += 1;
      const myId = ++nextId;
      setFeed((prev) => [{ id: myId, name: s.name, cost: s.cost, flash: true }, ...prev].slice(0, 3));
      setBalance((b) => Math.max(0, b - s.cost));
      window.setTimeout(() => setFeed((p) => p.map((r) => r.id === myId ? { ...r, flash: false } : r)), 700);
    }, 4200);
    return () => window.clearInterval(id);
  }, [mode]);

  // Reveal observer
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (reduce) { els.forEach((el) => el.classList.add('in')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const navItem = (key: Exclude<Menu, null>, label: string) => (
    <button
      onMouseEnter={() => setOpenMenu(key)}
      onFocus={() => setOpenMenu(key)}
      onClick={() => setOpenMenu(openMenu === key ? null : key)}
      className={`flex items-center gap-1 px-1 py-2 text-[14px] font-medium transition ${
        openMenu === key ? 'text-ink-950' : 'text-ink-700 hover:text-ink-950'
      }`}
      aria-expanded={openMenu === key}
    >
      {label}
      <ChevronDown size={13} className={`transition-transform ${openMenu === key ? 'rotate-180' : ''}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-white text-ink-950 font-sans antialiased">

      <style jsx global>{`
        .reveal { opacity: 0; transform: translateY(14px); transition: opacity .55s ease, transform .55s ease; }
        .reveal.in { opacity: 1; transform: none; }
        @keyframes feedFlash { 0% { background: rgba(16,168,104,.16); } 100% { background: transparent; } }
        .feed-flash { animation: feedFlash .7s ease-out; }
        @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .4; transform: scale(.75); } }
        .dot-pulse { animation: pulseDot 1.6s ease-in-out infinite; }
        .tok { color: #2bbd7e; font-weight: 600; }
        .grid-bg {
          background-image:
            linear-gradient(rgba(225,235,230,.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(225,235,230,.5) 1px, transparent 1px);
          background-size: 32px 32px;
          mask-image: radial-gradient(80% 80% at 50% 0%, #000 0%, transparent 90%);
        }
      `}</style>

      {/* ─── HEADER ─── */}
      <header
        className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-ink-100"
        onMouseLeave={() => setOpenMenu(null)}
      >
        <div className="wrap h-[64px] flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold text-ink-950">
            <span className="relative w-7 h-7 rounded-lg bg-ink-950 flex items-center justify-center">
              <Wallet size={14} className="text-brand-400" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-white" />
            </span>
            <span className="text-[1.05rem] tracking-tight">Agent<span className="text-brand-500">Mint</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {navItem('platform',  'Platform')}
            {navItem('solutions', 'Solutions')}
            {navItem('resources', 'Resources')}
            <Link href="#pricing" className="px-1 py-2 text-[14px] font-medium text-ink-700 hover:text-ink-950 transition">Pricing</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/build/login" className="hidden sm:inline text-[14px] font-medium text-ink-700 hover:text-ink-950 px-3 py-2">Sign in</Link>
            <Link href="/build/signup" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-white bg-ink-950 hover:bg-ink-800 rounded-lg px-4 py-2.5 transition">
              Start free <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* MEGA-MENU */}
        {openMenu && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-ink-100 shadow-[0_24px_48px_-24px_rgba(6,34,26,0.12)]">
            <div className="wrap py-10">
              {openMenu === 'platform' && (
                <div className="grid md:grid-cols-[1fr_1fr_340px] gap-x-12 gap-y-8">
                  <div>
                    <div className="text-[11px] uppercase tracking-[.14em] text-ink-400 font-bold mb-4">Core</div>
                    <div className="space-y-3">
                      {PLATFORM_CORE.map((m) => (
                        <Link href="#features" key={m.title} className="flex gap-3 group items-start">
                          <span className="w-9 h-9 rounded-lg bg-ink-50 text-ink-700 flex items-center justify-center group-hover:bg-brand-500/10 group-hover:text-brand-600 transition flex-shrink-0">
                            <m.icon size={16} />
                          </span>
                          <div>
                            <div className="font-semibold text-ink-950 text-[14px]">{m.title}</div>
                            <div className="text-[12.5px] text-ink-500 mt-0.5">{m.desc}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[.14em] text-ink-400 font-bold mb-4">Payment rails</div>
                    <div className="space-y-3">
                      {PLATFORM_RAILS.map((m) => (
                        <Link href="#rails" key={m.title} className="flex gap-3 group items-start">
                          <span className="w-9 h-9 rounded-lg bg-ink-50 text-ink-700 flex items-center justify-center group-hover:bg-brand-500/10 group-hover:text-brand-600 transition flex-shrink-0">
                            <m.icon size={16} />
                          </span>
                          <div>
                            <div className="font-semibold text-ink-950 text-[14px]">{m.title}</div>
                            <div className="text-[12.5px] text-ink-500 mt-0.5">{m.desc}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl p-5 bg-gradient-to-br from-brand-50 to-ink-50 border border-brand-100">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[.14em] text-brand-700 font-bold">
                      <Sparkles size={12} /> Two billing modes
                    </div>
                    <h4 className="mt-2.5 font-extrabold text-ink-950 text-[15px] leading-tight tracking-tight">Prepaid credits or usage-based invoicing — one dashboard for both.</h4>
                    <p className="mt-2 text-[12.5px] text-ink-600">Pick the model your customer wants. Switch per-workspace. Same SDK contract for both.</p>
                    <Link href="#modes" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-bold text-ink-950 hover:text-brand-600 transition">
                      See how it works <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>
              )}

              {openMenu === 'solutions' && (
                <div className="grid md:grid-cols-3 gap-x-12 gap-y-8">
                  <div>
                    <div className="text-[11px] uppercase tracking-[.14em] text-ink-400 font-bold mb-4">Who it's for</div>
                    <div className="space-y-3.5">
                      {SOLUTIONS_WHO.map((m) => (
                        <Link href="#who" key={m.title} className="block group">
                          <div className="font-semibold text-ink-950 text-[14px] group-hover:text-brand-600 transition">{m.title}</div>
                          <div className="text-[12.5px] text-ink-500 mt-0.5">{m.desc}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[.14em] text-ink-400 font-bold mb-4">By stage</div>
                    <div className="space-y-3.5">
                      {SOLUTIONS_STAGE.map((m) => (
                        <Link href="#features" key={m.title} className="block group">
                          <div className="font-semibold text-ink-950 text-[14px] group-hover:text-brand-600 transition">{m.title}</div>
                          <div className="text-[12.5px] text-ink-500 mt-0.5">{m.desc}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl p-5 bg-gradient-to-br from-brand-50 to-ink-50 border border-brand-100">
                    <div className="text-[11px] uppercase tracking-[.14em] text-brand-700 font-bold">India-first</div>
                    <h4 className="mt-2 font-extrabold text-ink-950 text-[15px] leading-tight tracking-tight">INR via Razorpay, UPI autopay, GST invoicing.</h4>
                    <p className="mt-2 text-[12.5px] text-ink-600">In active build. Pilot builders shipping to India get priority.</p>
                  </div>
                </div>
              )}

              {openMenu === 'resources' && (
                <div className="grid md:grid-cols-2 gap-x-12 gap-y-6 max-w-3xl">
                  {RESOURCES_MENU.map((m) => (
                    <Link href={m.href} key={m.title} className="block group">
                      <div className="font-semibold text-ink-950 text-[14.5px] group-hover:text-brand-600 transition">{m.title}</div>
                      <div className="text-[12.5px] text-ink-500 mt-0.5">{m.desc}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main>

        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 grid-bg" />
          <div className="relative wrap pt-20 pb-20 md:pt-24 md:pb-24">

            <div className="reveal inline-flex items-center gap-2 px-3 py-1 rounded-full border border-ink-200 text-[12px] font-medium text-ink-700 bg-white/80 backdrop-blur">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 dot-pulse" />
              Monetization infrastructure for AI agents
            </div>

            <h1 className="reveal mt-6 font-extrabold tracking-[-0.035em] leading-[1.02] text-[3rem] md:text-[4.4rem] balance max-w-4xl">
              People build.<br />
              <span className="text-brand-500">We monetize.</span>
            </h1>

            <p className="reveal mt-7 text-[1.18rem] text-ink-600 leading-[1.55] max-w-2xl">
              Prepaid credits or usage-based invoicing. One dashboard for both. Drop two HTTP calls into any agent — solo dev, startup, or studio shipping to multiple clients — and start collecting revenue.
            </p>

            <div className="reveal mt-9 flex flex-wrap gap-2.5">
              <Link href="/apply" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-white bg-ink-950 hover:bg-ink-800 rounded-lg px-5 py-3 transition">
                Tell us about your agent <ArrowRight size={15} />
              </Link>
              <Link href="/build/signup" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink-800 bg-white border border-ink-200 hover:border-ink-400 rounded-lg px-5 py-3 transition">
                Use the SDK myself
              </Link>
            </div>
            <p className="reveal mt-3 text-[12.5px] text-ink-500">
              Concierge intake · we scope and ship the billing for you · $0 while we build it.
            </p>

            {/* Hero metrics strip */}
            <div className="reveal mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl">
              {[
                ['~30 min',   'to instrument an agent'],
                ['2 modes',   'prepaid · usage-based'],
                ['5 rails',   'Stripe · PayPal · UPI · …'],
                ['1 console', 'every agent in one place'],
              ].map(([n, l]) => (
                <div key={l}>
                  <div className="text-[1.55rem] font-extrabold tracking-tight tnum text-ink-950">{n}</div>
                  <div className="text-[12.5px] text-ink-500 mt-1 uppercase tracking-[0.06em] font-medium">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── TWO PATHS (concierge vs DIY) ─── */}
        <section id="paths" className="border-t border-ink-100">
          <div className="wrap py-20 md:py-24">
            <div className="reveal max-w-2xl">
              <div className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[.14em] font-bold text-brand-700">
                <Sparkles size={12} /> Two ways to get started
              </div>
              <h2 className="mt-4 font-extrabold text-[2.1rem] md:text-[2.6rem] tracking-[-0.025em] leading-[1.08] balance">
                We build it for you. <span className="text-brand-500">Or you build it with us.</span>
              </h2>
              <p className="mt-4 text-[1.02rem] text-ink-600 leading-relaxed">
                Same product, two paths in. Most builders pick the concierge path first while we're in pilot — we scope the monetization layer for your specific agent, build it, and hand it over to ship.
              </p>
            </div>

            <div className="reveal mt-10 grid lg:grid-cols-2 gap-5">

              {/* CONCIERGE — accent */}
              <Link href="/apply" className="group rounded-2xl border-2 border-ink-950 bg-white p-7 md:p-8 relative overflow-hidden">
                <span className="absolute top-5 right-5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ink-950 text-white text-[10.5px] font-bold tracking-wider uppercase">
                  <Sparkles size={11} className="text-brand-400" /> Recommended
                </span>
                <span className="w-11 h-11 rounded-xl bg-ink-950 text-brand-400 flex items-center justify-center">
                  <Sparkles size={20} />
                </span>
                <div className="mt-5 text-[10.5px] mono uppercase tracking-[.18em] font-bold text-brand-700">PATH A · CONCIERGE</div>
                <h3 className="mt-2 font-extrabold text-[1.45rem] md:text-[1.65rem] tracking-tight text-ink-950 leading-tight">
                  Tell us about your agent. We build the billing.
                </h3>
                <p className="mt-3 text-[14.5px] text-ink-600 leading-relaxed">
                  Five-minute intake form. One business day to reply. We scope the monetization layer, build it, hand it over. $0 while we do it.
                </p>
                <ul className="mt-5 space-y-2">
                  {[
                    'We pick the billing mode that fits your model',
                    'We wire your Stripe / Razorpay / UPI account',
                    'We ship the dashboard + customer console',
                    'You review and go live',
                  ].map((it) => (
                    <li key={it} className="flex gap-2.5 items-start text-[13.5px] text-ink-700">
                      <Check size={14} className="text-brand-600 mt-0.5 flex-shrink-0" strokeWidth={2.6} />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-white bg-ink-950 group-hover:bg-ink-800 rounded-lg px-4 py-2.5 transition">
                  Open the intake form <ArrowRight size={14} />
                </div>
              </Link>

              {/* DIY — subdued */}
              <Link href="/build/signup" className="group rounded-2xl border border-ink-100 bg-white p-7 md:p-8 hover:border-ink-300 transition">
                <span className="w-11 h-11 rounded-xl bg-brand-500/10 text-brand-700 flex items-center justify-center">
                  <Code2 size={20} />
                </span>
                <div className="mt-5 text-[10.5px] mono uppercase tracking-[.18em] font-bold text-brand-700">PATH B · SELF-SERVE</div>
                <h3 className="mt-2 font-extrabold text-[1.45rem] md:text-[1.65rem] tracking-tight text-ink-950 leading-tight">
                  Wire it yourself in about 30 minutes.
                </h3>
                <p className="mt-3 text-[14.5px] text-ink-600 leading-relaxed">
                  Sign up, register your agent, generate an API key, drop two HTTP calls (or one SDK) into your agent route. Ship.
                </p>
                <ul className="mt-5 space-y-2">
                  {[
                    'TypeScript, Python, Go SDKs — or raw HTTPS',
                    'Pick prepaid or usage-based per workspace',
                    'Connect your Stripe; payouts to your bank',
                    'Dashboard for wallets, invoices, customers',
                  ].map((it) => (
                    <li key={it} className="flex gap-2.5 items-start text-[13.5px] text-ink-700">
                      <Check size={14} className="text-brand-600 mt-0.5 flex-shrink-0" strokeWidth={2.6} />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink-800 bg-white border border-ink-200 group-hover:border-ink-400 rounded-lg px-4 py-2.5 transition">
                  Open builder console <ArrowRight size={14} />
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* ─── BILLING MODES (THE CENTERPIECE) ─── */}
        <section id="modes" className="border-t border-ink-100 bg-ink-50/40">
          <div className="wrap py-20 md:py-24">

            <div className="reveal text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[.14em] font-bold text-brand-700">
                <Sparkles size={12} /> Two billing modes
              </div>
              <h2 className="mt-4 font-extrabold text-[2.2rem] md:text-[2.7rem] leading-[1.06] tracking-[-0.028em] balance">
                Charge how your customers <span className="text-brand-500">want to pay.</span>
              </h2>
              <p className="mt-4 text-[1.05rem] text-ink-600 leading-relaxed">
                Switch per-workspace. Same SDK contract. Same dashboard. The wallet primitive carries both models.
              </p>
            </div>

            {/* Toggle */}
            <div className="reveal mt-10 flex justify-center">
              <div className="inline-flex p-1 bg-white border border-ink-200 rounded-xl shadow-sm">
                <ToggleButton active={mode === 'prepaid'}  onClick={() => setMode('prepaid')}  icon={Wallet}  label="Prepaid credits" />
                <ToggleButton active={mode === 'postpaid'} onClick={() => setMode('postpaid')} icon={Receipt} label="Usage-based" />
              </div>
            </div>

            {/* Mode panel */}
            <div className="reveal mt-10">
              {mode === 'prepaid' ? (
                <ModePanel
                  badge="MODE 01 · PREPAID"
                  title="Top-up. Use. Stop at zero."
                  body="Your customer adds credits up front. Every authorize() / debit() draws from the same wallet across every agent they use. When the balance hits zero, the next authorize() returns a structured 402 — no overage, no surprise bills."
                  bullets={[
                    'One balance across every agent in the suite',
                    'Auto-reload at a threshold, or stop-at-zero',
                    'Structured 402 with upgrade offer + price built in',
                    'Per-agent attribution underneath',
                  ]}
                  visual={<PrepaidVisual balance={balance} feed={feed} />}
                />
              ) : (
                <ModePanel
                  badge="MODE 02 · USAGE-BASED"
                  title="Use first. Invoice at month end."
                  body="Same authorize() / debit() — but instead of decrementing a balance, calls accumulate on the meter. On the 1st of each month, an invoice is generated, posted to your customer's Stripe / Razorpay account, and reconciled automatically."
                  bullets={[
                    'Postpaid metered usage per workspace',
                    'Auto-generated invoice on a fixed cycle',
                    'Card-on-file via Stripe / Razorpay',
                    'Per-agent line items on the invoice',
                  ]}
                  visual={<PostpaidVisual />}
                />
              )}
            </div>
          </div>
        </section>

        {/* ─── THREE USPS ─── */}
        <section id="features" className="border-t border-ink-100">
          <div className="wrap py-20 md:py-24">
            <div className="reveal max-w-2xl">
              <div className="text-[12px] uppercase tracking-[.14em] font-bold text-brand-700">Why AgentMint</div>
              <h2 className="mt-4 font-extrabold text-[2.1rem] md:text-[2.6rem] tracking-[-0.025em] leading-[1.08] balance">
                You build the agent. We do the rest.
              </h2>
            </div>

            <div className="mt-12 grid md:grid-cols-3 gap-4">
              {USPS.map((u) => (
                <div key={u.title} className="reveal group p-7 rounded-2xl border border-ink-100 bg-white hover:border-ink-300 transition">
                  <span className="w-11 h-11 rounded-xl bg-brand-500/10 text-brand-700 flex items-center justify-center">
                    <u.icon size={20} />
                  </span>
                  <h3 className="mt-5 font-bold text-ink-950 text-[1.12rem] tracking-tight">{u.title}</h3>
                  <p className="mt-2 text-[14.5px] text-ink-600 leading-relaxed">{u.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── WHO IT'S FOR (audience split) ─── */}
        <section id="who" className="border-t border-ink-100 bg-gradient-to-b from-ink-50/60 to-white">
          <div className="wrap py-20 md:py-24">

            <div className="reveal max-w-2xl">
              <div className="text-[12px] uppercase tracking-[.14em] font-bold text-brand-700">Who it's for</div>
              <h2 className="mt-4 font-extrabold text-[2.1rem] md:text-[2.6rem] tracking-[-0.025em] leading-[1.08] balance">
                One agent or fifty. <span className="text-brand-500">Same contract.</span>
              </h2>
            </div>

            {/* Audience toggle */}
            <div className="reveal mt-10 flex">
              <div className="inline-flex p-1 bg-white border border-ink-200 rounded-xl shadow-sm">
                <ToggleButton active={audience === 'solo'}   onClick={() => setAudience('solo')}   icon={Code2}    label="Solo / startup" />
                <ToggleButton active={audience === 'studio'} onClick={() => setAudience('studio')} icon={Building2} label="Studio / agency" />
              </div>
            </div>

            <div className="reveal mt-8 grid md:grid-cols-2 gap-5">
              {audience === 'solo' ? (
                <>
                  <AudienceCard
                    icon={Code2}
                    title="One indie agent · shipping next week"
                    points={[
                      'Wrap your agent route with authorize() + debit() — done in an afternoon',
                      'Pick prepaid OR usage-based for your customers',
                      'Connect your own Stripe account once, payouts land in your bank',
                      'No SDK lock-in — raw HTTPS works too',
                    ]}
                  />
                  <AudienceCard
                    icon={Boxes}
                    title="AI startup · multiple agents in one suite"
                    points={[
                      'One credit wallet across every agent your customer uses',
                      'Per-agent revenue attribution in one dashboard',
                      'Switch billing mode per-workspace as you grow',
                      'Trial credits + 402 upgrade flow built in',
                    ]}
                  />
                </>
              ) : (
                <>
                  <AudienceCard
                    icon={Building2}
                    title="Studio · agents built for multiple clients"
                    points={[
                      'Each client is a tenant; their workspaces are isolated by API key',
                      'Bill clients prepaid OR postpaid — pick per client',
                      'Per-client revenue dashboard + invoice exports',
                      'White-label customer console at [client].agentmint.com (in build)',
                    ]}
                  />
                  <AudienceCard
                    icon={Users}
                    title="Agency · resell agents at scale"
                    points={[
                      'Spin up a new client workspace via POST /v1/workspaces',
                      'Plan gating + structured 402 on every agent route',
                      'Your platform fee + their plan price, settled separately',
                      'GST-compliant invoicing for India clients (in build)',
                    ]}
                  />
                </>
              )}
            </div>
          </div>
        </section>

        {/* ─── DASHBOARD BENTO PREVIEW ─── */}
        <section className="border-t border-ink-100">
          <div className="wrap py-20 md:py-24">

            <div className="reveal max-w-2xl">
              <div className="text-[12px] uppercase tracking-[.14em] font-bold text-brand-700">The console</div>
              <h2 className="mt-4 font-extrabold text-[2.1rem] md:text-[2.6rem] tracking-[-0.025em] leading-[1.08] balance">
                Every agent. Every customer. <span className="text-brand-500">One screen.</span>
              </h2>
              <p className="mt-4 text-[1.02rem] text-ink-600 leading-relaxed">
                Wallets, invoices, plans, customers and per-agent revenue — across both billing modes — in a single console.
              </p>
            </div>

            {/* Bento grid */}
            <div className="reveal mt-10 grid grid-cols-1 md:grid-cols-6 grid-rows-[repeat(2,minmax(0,1fr))] gap-4 auto-rows-[200px]">
              {/* Wallet — large left */}
              <div className="md:col-span-3 md:row-span-2 rounded-2xl border border-ink-100 bg-white p-6 flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[12px] uppercase tracking-[.12em] font-bold text-brand-700">
                    <Wallet size={14} /> Prepaid wallet
                  </div>
                  <span className="text-[10.5px] mono text-ink-400">workspace_ac82</span>
                </div>
                <div className="mt-6 flex items-end gap-2">
                  <span className="text-[3.4rem] leading-none font-extrabold tracking-tight tnum text-ink-950">2,184</span>
                  <span className="text-ink-500 pb-2 font-medium">credits</span>
                </div>
                <div className="mt-4 h-2 rounded-full bg-ink-100 overflow-hidden">
                  <div className="h-full bg-brand-500 transition-all duration-500" style={{ width: '73%' }} />
                </div>
                <div className="mt-2 flex justify-between text-[11.5px] mono text-ink-400">
                  <span>0</span><span>used 816 / 3,000</span><span>3,000</span>
                </div>
                <div className="mt-auto pt-6 grid grid-cols-3 gap-3 text-[12px]">
                  <DashStat icon={TrendingUp} label="Burn / day" value="45 cr" />
                  <DashStat icon={Gauge}      label="Days left" value="~23" />
                  <DashStat icon={Coins}      label="Top up"    value="+500" accent />
                </div>
              </div>

              {/* Invoice — top right */}
              <div className="md:col-span-3 rounded-2xl border border-ink-100 bg-white p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[.12em] font-bold text-brand-700">
                    <Receipt size={13} /> Usage invoice · June
                  </div>
                  <span className="text-[10.5px] mono text-ink-400">draft</span>
                </div>
                <div className="flex items-end gap-1.5 mt-3">
                  <span className="text-[1.9rem] font-extrabold tracking-tight tnum text-ink-950">$284.16</span>
                  <span className="text-ink-500 pb-1 text-[12.5px]">accrued · 8,924 events</span>
                </div>
                <div className="space-y-1.5 text-[12px]">
                  <InvoiceLine product="writer · generate_doc" qty="4,012" total="$120.36" />
                  <InvoiceLine product="analyzer · score_page" qty="3,450" total="$103.50" />
                  <InvoiceLine product="scheduler · queue_task" qty="1,462" total="$60.30"  />
                </div>
              </div>

              {/* Per-agent revenue */}
              <div className="md:col-span-2 rounded-2xl border border-ink-100 bg-white p-5">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[.12em] font-bold text-brand-700">
                  <BarChart3 size={13} /> Per-agent revenue
                </div>
                <div className="mt-4 space-y-2.5">
                  {[
                    ['writer',    72, '$5,084'],
                    ['analyzer',  48, '$3,392'],
                    ['scheduler', 24, '$1,696'],
                  ].map(([n, w, v]) => (
                    <div key={n as string}>
                      <div className="flex justify-between text-[12px]">
                        <span className="font-mono text-ink-700">{n}</span>
                        <span className="font-bold tnum text-ink-950">{v}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-ink-100 overflow-hidden">
                        <div className="h-full bg-brand-500" style={{ width: `${w}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customers */}
              <div className="md:col-span-1 rounded-2xl border border-ink-100 bg-white p-5">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[.12em] font-bold text-brand-700">
                  <Users size={13} /> Active
                </div>
                <div className="mt-4">
                  <div className="text-[2rem] font-extrabold tracking-tight tnum text-ink-950">128</div>
                  <div className="text-[11.5px] text-ink-500 mt-0.5">workspaces this month</div>
                </div>
                <div className="mt-3 flex -space-x-1.5">
                  {['#10a868', '#0a8a55', '#5cd49d', '#92e3bd'].map((c, i) => (
                    <span key={i} className="w-6 h-6 rounded-full ring-2 ring-white" style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── INTEGRATION ─── */}
        <section className="border-t border-ink-100 bg-ink-50/40">
          <div className="wrap py-20 md:py-24">
            <div className="reveal max-w-2xl">
              <div className="text-[12px] uppercase tracking-[.14em] font-bold text-brand-700">Integration</div>
              <h2 className="mt-4 font-extrabold text-[2.1rem] md:text-[2.6rem] tracking-[-0.025em] leading-[1.08] balance">
                Two HTTP calls. <span className="text-brand-500">Three SDKs.</span> Pick your stack.
              </h2>
            </div>

            <div className="reveal mt-10 rounded-2xl overflow-hidden border border-ink-800 bg-ink-950 text-ink-50 max-w-4xl">
              <div className="flex items-center gap-1 px-2 py-2 border-b border-ink-800">
                <span className="w-2.5 h-2.5 rounded-full bg-ink-700 ml-2" />
                <span className="w-2.5 h-2.5 rounded-full bg-ink-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-ink-700" />
                <div className="ml-4 flex items-center gap-0.5 text-[12px]">
                  {SDK_TABS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSdkTab(t.id)}
                      className={`mono px-3 py-1.5 rounded-md transition ${
                        sdkTab === t.id ? 'bg-ink-800 text-white' : 'text-ink-400 hover:text-ink-200'
                      }`}
                    >{t.label}</button>
                  ))}
                </div>
              </div>
              <div className="px-5 pt-3 pb-1 flex items-center gap-2 border-b border-ink-800/60">
                <span className="text-[10.5px] uppercase tracking-[.14em] text-ink-500 font-bold">Install</span>
                <code className="mono text-[12px] text-brand-300 bg-ink-900 px-2 py-0.5 rounded">
                  {SDK_TABS.find((t) => t.id === sdkTab)?.install}
                </code>
              </div>
              <pre className="mono text-[12.5px] leading-[1.7] px-5 py-5 overflow-auto" dangerouslySetInnerHTML={{ __html: SDK_TABS.find((t) => t.id === sdkTab)!.code }} />
            </div>

            <div className="reveal mt-6 max-w-4xl flex flex-wrap items-center gap-x-7 gap-y-2 text-[13px] text-ink-600">
              <span className="inline-flex items-center gap-1.5"><Plug size={13} className="text-brand-600" /> Any HTTPS stack works without an SDK</span>
              <span className="inline-flex items-center gap-1.5"><Webhook size={13} className="text-brand-600" /> Webhooks on every billing event</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-brand-600" /> Idempotent debit by resource_id</span>
            </div>
          </div>
        </section>

        {/* ─── PRICING ─── */}
        <section id="pricing" className="border-t border-ink-100">
          <div className="wrap py-20 md:py-24">
            <div className="reveal max-w-2xl">
              <div className="text-[12px] uppercase tracking-[.14em] font-bold text-brand-700">Pricing</div>
              <h2 className="mt-4 font-extrabold text-[2.1rem] md:text-[2.6rem] tracking-[-0.025em] leading-[1.08] balance">
                Start free. <span className="text-brand-500">Pay when you earn.</span>
              </h2>
            </div>

            <div className="mt-10 grid md:grid-cols-3 gap-4">
              {PRICING.map((p) => (
                <div
                  key={p.name}
                  className={`reveal rounded-2xl p-7 flex flex-col ${p.accent ? 'border-2 border-ink-950 bg-white relative shadow-lg' : 'border border-ink-100 bg-white'}`}
                >
                  {p.accent && (
                    <span className="absolute -top-3 right-6 px-2.5 py-1 rounded-full bg-ink-950 text-white text-[10.5px] font-bold tracking-wider uppercase">
                      Most popular
                    </span>
                  )}
                  <div className="text-[12px] font-bold text-ink-500 uppercase tracking-[.12em]">{p.name}</div>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-[2.6rem] font-extrabold tracking-tight tnum text-ink-950">{p.price}</span>
                    <span className="text-[13.5px] text-ink-500">{p.cadence}</span>
                  </div>
                  <p className="mt-2 text-[13px] text-ink-500 leading-relaxed">{p.desc}</p>

                  <div className="mt-6 h-px bg-ink-100" />

                  <ul className="mt-6 space-y-2.5 text-[14px] text-ink-700 flex-1">
                    {p.items.map((it) => (
                      <li key={it} className="flex gap-2.5 items-start">
                        <Check size={15} className="text-brand-600 mt-0.5 flex-shrink-0" strokeWidth={2.6} />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/build/signup"
                    className={`mt-7 inline-flex items-center justify-center gap-1.5 text-[14px] font-semibold rounded-lg px-4 py-2.5 transition ${
                      p.accent
                        ? 'bg-ink-950 text-white hover:bg-ink-800'
                        : 'bg-white text-ink-800 border border-ink-200 hover:border-ink-400'
                    }`}
                  >
                    {p.cta} <ArrowRight size={13} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="border-t border-ink-100 bg-ink-50/40">
          <div className="wrap py-20 md:py-24">
            <div className="reveal max-w-2xl">
              <div className="text-[12px] uppercase tracking-[.14em] font-bold text-brand-700">FAQ</div>
              <h2 className="mt-4 font-extrabold text-[2.1rem] md:text-[2.6rem] tracking-[-0.025em] leading-[1.08]">
                Quick answers.
              </h2>
            </div>
            <div className="mt-10 max-w-3xl divide-y divide-ink-100">
              {FAQ.map(([q, a]) => (
                <div key={q} className="reveal py-6">
                  <h3 className="font-bold text-ink-950 tracking-tight text-[1.04rem]">{q}</h3>
                  <p className="mt-2 text-[14.5px] text-ink-600 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="relative overflow-hidden bg-ink-950 text-white border-t border-ink-100">
          <div className="absolute inset-0 grid-bg opacity-10" />
          <div className="relative wrap py-24 text-center">
            <h2 className="reveal font-extrabold text-[2.2rem] md:text-[3rem] tracking-[-0.028em] leading-[1.04] balance max-w-3xl mx-auto">
              You build. <span className="text-brand-400">We monetize.</span>
            </h2>
            <p className="reveal mt-5 text-ink-300 max-w-xl mx-auto leading-relaxed">
              The pilot cohort is open. $0 while we harden Connect together.
            </p>
            <div className="reveal mt-9 flex flex-wrap justify-center gap-2.5">
              <Link href="/build/signup" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink-950 bg-white hover:bg-ink-50 rounded-lg px-5 py-3 transition">
                Apply to pilot <ArrowRight size={15} />
              </Link>
              <Link href="#modes" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-white border border-white/30 hover:border-white/70 rounded-lg px-5 py-3 transition">
                See billing modes
              </Link>
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="bg-white border-t border-ink-100">
          <div className="wrap py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] text-ink-500">
            <div className="flex items-center gap-2 font-extrabold text-ink-800">
              <span className="relative w-6 h-6 rounded-md bg-ink-950 flex items-center justify-center">
                <Wallet size={11} className="text-brand-400" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-white" />
              </span>
              AgentMint
            </div>
            <div className="flex items-center gap-6">
              <a href="#modes" className="hover:text-ink-950 transition">Modes</a>
              <a href="#features" className="hover:text-ink-950 transition">Features</a>
              <a href="#pricing" className="hover:text-ink-950 transition">Pricing</a>
              <Link href="/stackscore" className="hover:text-ink-950 transition">Free tool ↗</Link>
              <Link href="/build/signup" className="hover:text-ink-950 transition">Get started</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function ToggleButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13.5px] font-semibold transition ${
        active ? 'bg-ink-950 text-white' : 'text-ink-600 hover:text-ink-950'
      }`}
    >
      <Icon size={14} /> {label}
    </button>
  );
}

function ModePanel({ badge, title, body, bullets, visual }: {
  badge: string; title: string; body: string; bullets: string[]; visual: React.ReactNode;
}) {
  return (
    <div className="grid lg:grid-cols-[1fr_1fr] gap-6 items-start max-w-6xl mx-auto">
      <div className="rounded-2xl border border-ink-100 bg-white p-7 md:p-9">
        <div className="text-[10.5px] mono uppercase tracking-[.18em] font-bold text-brand-700">{badge}</div>
        <h3 className="mt-4 font-extrabold text-[1.7rem] md:text-[2rem] tracking-tight text-ink-950 leading-[1.1]">{title}</h3>
        <p className="mt-4 text-[1rem] text-ink-600 leading-relaxed">{body}</p>
        <ul className="mt-6 space-y-2.5">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2.5 items-start text-[14px] text-ink-700">
              <Check size={15} className="text-brand-600 mt-0.5 flex-shrink-0" strokeWidth={2.6} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-ink-100 bg-gradient-to-br from-ink-50 to-white p-6 md:p-8">
        {visual}
      </div>
    </div>
  );
}

function PrepaidVisual({ balance, feed }: { balance: number; feed: Array<{ id: number; name: string; cost: number; flash: boolean }> }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between text-[11.5px] font-semibold text-ink-500 uppercase tracking-wider">
        <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-500 dot-pulse" /> Wallet balance</div>
        <span className="mono text-[10.5px] text-ink-400">workspace_ac82</span>
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-[2.8rem] leading-none font-extrabold tracking-tight tnum text-ink-950">{balance.toLocaleString('en-US')}</span>
        <span className="text-ink-500 pb-1.5 font-medium">credits</span>
        <span className="ml-auto text-[12px] text-ink-400 pb-1 tnum">~{Math.max(1, Math.round(balance / 95))} days</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-ink-100 overflow-hidden">
        <div className="h-full bg-brand-500 transition-all duration-500" style={{ width: `${Math.round((balance / 3000) * 100)}%` }} />
      </div>

      <div className="mt-6">
        <div className="text-[10.5px] font-bold text-ink-500 uppercase tracking-[.12em] mb-2.5">Recent debits</div>
        <ul className="space-y-1.5 text-[13.5px]">
          {feed.map((row) => (
            <li key={row.id} className={`flex items-center justify-between rounded-md px-2 py-1 -mx-2 ${row.flash ? 'feed-flash' : ''}`}>
              <span className="mono text-ink-700 truncate">{row.name}</span>
              <span className="text-coral-500 font-semibold tnum">−{row.cost}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 pt-4 border-t border-ink-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[12px] text-ink-500"><Sparkles size={12} className="text-brand-600" /> Auto-reload at 200 cr</div>
        <button className="inline-flex items-center gap-1.5 text-[12px] font-bold text-white bg-ink-950 rounded-md px-3 py-1.5">
          <Coins size={11} /> Top up
        </button>
      </div>
    </div>
  );
}

function PostpaidVisual() {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between text-[11.5px] font-semibold text-ink-500 uppercase tracking-wider">
        <div className="flex items-center gap-2"><Receipt size={12} className="text-brand-600" /> June invoice · draft</div>
        <span className="mono text-[10.5px] text-ink-400">cycle: monthly</span>
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-[2.8rem] leading-none font-extrabold tracking-tight tnum text-ink-950">$284.16</span>
        <span className="text-ink-500 pb-1.5 font-medium">accrued</span>
        <span className="ml-auto text-[12px] text-ink-400 pb-1 tnum">8,924 events</span>
      </div>

      {/* Usage spark */}
      <div className="mt-4 flex items-end gap-1 h-12">
        {[18, 22, 14, 30, 26, 38, 32, 42, 36, 48, 52, 44, 58, 64].map((h, i) => (
          <div key={i} className="flex-1 rounded-sm bg-brand-300/60" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="mt-1 text-[10.5px] mono text-ink-400 flex justify-between">
        <span>Jun 1</span><span>today</span>
      </div>

      <div className="mt-5">
        <div className="text-[10.5px] font-bold text-ink-500 uppercase tracking-[.12em] mb-2.5">Line items</div>
        <ul className="space-y-1.5 text-[13.5px]">
          <InvoiceLine product="writer · generate_doc" qty="4,012 × $0.030" total="$120.36" />
          <InvoiceLine product="analyzer · score_page" qty="3,450 × $0.030" total="$103.50" />
          <InvoiceLine product="scheduler · queue_task" qty="1,462 × $0.041" total="$60.30"  />
        </ul>
      </div>

      <div className="mt-5 pt-4 border-t border-ink-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[12px] text-ink-500"><ShieldCheck size={12} className="text-brand-600" /> Auto-charge Jul 1 · Visa •• 4242</div>
        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-brand-50 text-brand-700">Net 0</span>
      </div>
    </div>
  );
}

function InvoiceLine({ product, qty, total }: { product: string; qty: string; total: string }) {
  return (
    <li className="flex items-center justify-between text-[13px]">
      <div className="min-w-0 flex-1">
        <div className="mono text-ink-700 truncate">{product}</div>
        <div className="mono text-[10.5px] text-ink-400">{qty}</div>
      </div>
      <span className="font-bold tnum text-ink-950 ml-3">{total}</span>
    </li>
  );
}

function DashStat({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className={`flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide ${accent ? 'text-brand-700' : 'text-ink-500'}`}>
        <Icon size={11} /> {label}
      </div>
      <div className={`mt-1 font-extrabold tnum ${accent ? 'text-brand-700' : 'text-ink-950'}`}>{value}</div>
    </div>
  );
}

function AudienceCard({ icon: Icon, title, points }: { icon: any; title: string; points: string[] }) {
  return (
    <div className="p-7 rounded-2xl border border-ink-100 bg-white">
      <span className="w-11 h-11 rounded-xl bg-ink-950 text-brand-400 flex items-center justify-center">
        <Icon size={20} />
      </span>
      <h3 className="mt-5 font-bold text-ink-950 text-[1.12rem] tracking-tight leading-snug">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {points.map((p) => (
          <li key={p} className="flex gap-2.5 items-start text-[13.5px] text-ink-700">
            <Check size={14} className="text-brand-600 mt-0.5 flex-shrink-0" strokeWidth={2.6} />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
