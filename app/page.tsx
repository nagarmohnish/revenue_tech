'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const ROTOR_WORDS = ['every agent.', 'your writer.', 'your RAG bot.', 'your voice agent.', 'your whole suite.'];

const PAY_RAILS = [
  { name: 'Stripe',    note: 'USD · cards · ACH' },
  { name: 'PayPal',    note: 'global checkout' },
  { name: 'Razorpay',  note: 'INR · cards' },
  { name: 'Apple Pay', note: 'one-tap mobile' },
  { name: 'UPI',       note: 'autopay · India' },
];

const SDK_TABS: Array<{
  id: 'js' | 'python' | 'go';
  label: string;
  install: string;
  code: Array<{ kind: 'comment' | 'text' | 'token'; v: string }>;
}> = [
  {
    id: 'js',
    label: 'TypeScript',
    install: 'npm install @agentmint/sdk',
    code: [
      { kind: 'text',    v: "import { AgentMint } from '@agentmint/sdk';\n\n" },
      { kind: 'text',    v: "const am = new AgentMint({ apiKey: process.env.AGENTMINT_KEY! });\n\n" },
      { kind: 'comment', v: '// before the agent runs\n' },
      { kind: 'text',    v: 'const decision = await am.' },
      { kind: 'token',   v: 'authorize' },
      { kind: 'text',    v: "({\n  workspaceId, product: 'writer', action: 'generate_doc', cost: 25,\n});\nif (!decision.allow) throw new Error(decision.reason);\n\n" },
      { kind: 'comment', v: '// on success\n' },
      { kind: 'text',    v: 'await am.' },
      { kind: 'token',   v: 'debit' },
      { kind: 'text',    v: "({\n  workspaceId, product: 'writer', action: 'generate_doc', cost: 25, resourceId,\n});" },
    ],
  },
  {
    id: 'python',
    label: 'Python',
    install: 'pip install agentmint',
    code: [
      { kind: 'text',    v: 'from agentmint import AgentMint\n\n' },
      { kind: 'text',    v: 'am = AgentMint(api_key="am_live_…")\n\n' },
      { kind: 'comment', v: '# before the agent runs\n' },
      { kind: 'text',    v: 'd = am.' },
      { kind: 'token',   v: 'authorize' },
      { kind: 'text',    v: '(workspace_id=ws, product="writer", action="generate_doc", cost=25)\nif not d.allow: raise RuntimeError(d.reason)\n\n' },
      { kind: 'comment', v: '# on success\n' },
      { kind: 'text',    v: 'am.' },
      { kind: 'token',   v: 'debit' },
      { kind: 'text',    v: '(workspace_id=ws, product="writer", action="generate_doc",\n         cost=25, resource_id=doc_id)' },
    ],
  },
  {
    id: 'go',
    label: 'Go',
    install: 'go get github.com/nagarmohnish/agentmint-go',
    code: [
      { kind: 'text',    v: 'import am "github.com/nagarmohnish/agentmint-go"\n\n' },
      { kind: 'text',    v: 'c, _ := am.New("am_live_…")\n\n' },
      { kind: 'comment', v: '// before the agent runs\n' },
      { kind: 'text',    v: 'd, err := c.' },
      { kind: 'token',   v: 'Authorize' },
      { kind: 'text',    v: '(ctx, am.AuthorizeArgs{\n  WorkspaceID: ws, Product: "writer", Action: "generate_doc", Cost: 25,\n})\nif !d.Allow { log.Fatal(d.Reason) }\n\n' },
      { kind: 'comment', v: '// on success\n' },
      { kind: 'text',    v: 'c.' },
      { kind: 'token',   v: 'Debit' },
      { kind: 'text',    v: '(ctx, am.DebitArgs{\n  AuthorizeArgs: ..., ResourceID: docID,\n})' },
    ],
  },
];

const FEED_SAMPLES: Array<{ name: string; cost: number }> = [
  { name: 'writer · generate_doc',   cost: 25 },
  { name: 'analyzer · score_page',   cost: 30 },
  { name: 'scheduler · queue_task',  cost: 12 },
  { name: 'classifier · tag_intent', cost: 8  },
  { name: 'writer · summarize',      cost: 18 },
];

const FEATURES = [
  { title: 'One wallet',            body: 'Your customer buys credits once. They spend them across every agent you ship.' },
  { title: 'Three SDKs · or two raw HTTPS calls', body: 'TypeScript, Python, Go. authorize() before, debit() after. Raw HTTP works just as well.' },
  { title: 'Per-agent attribution', body: 'Revenue, usage and burn — broken out by agent, in one dashboard.' },
];

const STEPS = [
  { n: '01', title: 'Register',  body: 'Add each agent and its actions to the registry. One row per action.' },
  { n: '02', title: 'Authorize', body: 'POST /v1/authorize before the agent runs. Plan + balance checked atomically.' },
  { n: '03', title: 'Debit',     body: 'POST /v1/debit on success. Idempotent by resource_id. Funnel events emitted.' },
];

const RESULTS = [
  { kpi: '~30 min', label: 'to instrument an agent', body: 'Two HTTP calls plus one registry row. No SDK to vendor.' },
  { kpi: '1 wallet', label: 'across your whole suite', body: 'Per-agent attribution underneath — wallet on top.' },
  { kpi: '$0',      label: 'for the pilot cohort',    body: 'First six builders pay nothing while we harden Connect together.' },
];

const PLANS = [
  { name: 'Pilot',   price: '$0',   cadence: 'first cohort', items: ['Unlimited agents', 'Up to 3 paying workspaces', 'Direct line to the team'],     cta: 'Apply',       accent: false },
  { name: 'Starter', price: '$49',  cadence: '/ month',      items: ['Up to 25 workspaces', 'Stripe Connect (USD)', 'Email + Slack support'],         cta: 'Start free',  accent: true  },
  { name: 'Growth',  price: '$199', cadence: '/ month',      items: ['Unlimited workspaces', 'INR / UPI / GST (in build)', 'Priority pilot status'],  cta: 'Start free',  accent: false },
];

const FAQ = [
  ['Do I have to use an SDK?',     'No. SDKs (TypeScript, Python, Go) are convenience wrappers — under them it is still two raw HTTPS POST calls. Pick whichever fits your stack.'],
  ['Which payment rails are live?', 'Stripe Connect (USD, ACH, Apple Pay) ships first. Razorpay + UPI autopay (INR) and PayPal land next on the priority queue.'],
  ['How does payout work?',        'Through your own merchant account on each rail. AgentMint never holds the money — payouts go straight to your bank on the rail\'s schedule.'],
  ['Is this the same as x402?',    'No. x402 lets agents pay autonomously. AgentMint lets humans pay for the agents you ship.'],
];

const PLATFORM_CORE = [
  { icon: 'wallet', title: 'Credit wallet',     desc: 'One balance across every agent in the suite' },
  { icon: 'gate',   title: 'Plan gating',       desc: 'Authorize with structured 402 decisions' },
  { icon: 'lock',   title: 'Atomic debit',      desc: 'Idempotent by resource_id, never goes negative' },
  { icon: 'chart',  title: 'Per-agent revenue', desc: 'Attribution + burn rate, broken out per agent' },
  { icon: 'sdk',    title: 'SDKs · TS · Py · Go', desc: 'Or two raw HTTPS calls — your choice' },
];

const PLATFORM_RAILS = [
  { icon: 'stripe',  title: 'Stripe Connect', desc: 'USD · cards · ACH · payouts to your bank' },
  { icon: 'paypal',  title: 'PayPal',         desc: 'Global checkout for non-card geographies' },
  { icon: 'india',   title: 'Razorpay',       desc: 'INR cards + netbanking for India workspaces' },
  { icon: 'apple',   title: 'Apple Pay',      desc: 'One-tap mobile checkout via Stripe' },
  { icon: 'upi',     title: 'UPI · autopay',  desc: 'Recurring debit via UPI mandate (India)' },
];

const SOLUTIONS_MENU = {
  WHO: [
    { title: 'Indie developers',  desc: 'Ship + bill in an afternoon' },
    { title: 'AI startups',       desc: 'Suite-wide credits with per-agent attribution' },
    { title: 'Small studios',     desc: 'Bill across multiple client deployments' },
  ],
  STAGE: [
    { title: 'Pre-revenue MVP',   desc: 'Trial credits + 402 paywall in one move' },
    { title: 'Scaling pilots',    desc: 'Plan gating + Stripe Connect payouts' },
    { title: 'India-first launch', desc: 'UPI autopay + GST invoicing' },
  ],
};

const RESOURCES_MENU = [
  { title: 'StackScore (free tool)', desc: 'Score any pricing page in ~10s', href: '/stackscore' },
  { title: 'Documentation',          desc: 'authorize() · debit() · webhooks' },
  { title: 'Pricing',                desc: '3 plans, $0 for the pilot cohort' },
  { title: 'GitHub',                 desc: 'github.com/nagarmohnish/revenue_tech' },
  { title: 'Strategy memo',          desc: 'Why one wallet beats per-agent billing' },
];

const CHECK = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10a868" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const Arrow = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const Chevron = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const MenuIcon = ({ name }: { name: string }) => {
  const props = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'wallet': return <svg {...props}><path d="M21 7H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 14h.01"/><path d="M3 9V7a2 2 0 0 1 2-2h12"/></svg>;
    case 'gate':   return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case 'lock':   return <svg {...props}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
    case 'chart':  return <svg {...props}><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 4-6"/></svg>;
    case 'stripe': return <svg {...props}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>;
    case 'paypal': return <svg {...props}><path d="M7 21l1.2-7.6h3.4c2.6 0 4.6-1.3 5.1-4 .5-2.7-1.1-4.4-3.8-4.4H7.8L5 21z"/><path d="M9 13l1-6.4h3.8c2 0 3.3 1.1 2.8 3.4-.5 2.1-2 2.9-4 2.9H9z"/></svg>;
    case 'apple':  return <svg {...props}><path d="M19 17.5c-.4 1-1 2-1.8 2.8-.7.7-1.6 1-2.5.9-.8-.1-1.3-.4-2.4-.4s-1.5.3-2.4.4c-.9.1-1.8-.3-2.5-1-1.7-1.7-3-4.9-1.3-7.1.9-1.2 2.3-1.9 3.7-1.9 1 0 1.6.3 2.5.3 0 0 .8-.4 2.6-.3.7 0 2.6.3 3.4 2.1-.1.1-2.3 1.4-2.3 4 0 2.9 2.5 4 2.6 4z"/><path d="M14 5.4c.6-.7 1-1.7.9-2.6-.9.1-1.9.6-2.4 1.3-.5.6-1 1.6-.9 2.5 1 .1 1.9-.4 2.4-1.2z"/></svg>;
    case 'upi':    return <svg {...props}><path d="M9 4l-4 8 4 8M15 4l4 8-4 8M11 7l-2 5h6l-2 5"/></svg>;
    case 'india':  return <svg {...props}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10A15.3 15.3 0 0 1 8 12 15.3 15.3 0 0 1 12 2z"/></svg>;
    case 'sdk':    return <svg {...props}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
    default: return null;
  }
};

type Phase = 'authorize' | 'run' | 'debit';
type Menu = 'platform' | 'solutions' | 'resources' | null;

export default function LandingPage() {
  const rotorRef = useRef<HTMLSpanElement | null>(null);

  const [balance, setBalance] = useState(2184);
  const [feed, setFeed] = useState<Array<{ id: number; name: string; cost: number; flash: boolean }>>([
    { id: 1, name: 'writer · generate_doc',  cost: 25, flash: false },
    { id: 2, name: 'analyzer · score_page',  cost: 30, flash: false },
    { id: 3, name: 'scheduler · queue_task', cost: 12, flash: false },
  ]);
  const [phase, setPhase] = useState<Phase>('authorize');
  const [openMenu, setOpenMenu] = useState<Menu>(null);
  const [sdkTab, setSdkTab] = useState<'js' | 'python' | 'go'>('js');

  // Rotating headline word
  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let i = 0;
    const id = window.setInterval(() => {
      const el = rotorRef.current;
      if (!el) return;
      i = (i + 1) % ROTOR_WORDS.length;
      el.style.transition = 'opacity .25s ease, transform .25s ease';
      el.style.opacity = '0';
      el.style.transform = 'translateY(-6px)';
      window.setTimeout(() => {
        el.textContent = ROTOR_WORDS[i];
        el.style.opacity = '1';
        el.style.transform = 'none';
      }, 250);
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  // Pipeline cycle
  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let step = 0;
    const id = window.setInterval(() => {
      step = (step + 1) % 3;
      setPhase(step === 0 ? 'authorize' : step === 1 ? 'run' : 'debit');
    }, 1400);
    return () => window.clearInterval(id);
  }, []);

  // Live wallet feed
  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let nextId = 1000;
    let k = 0;
    const id = window.setInterval(() => {
      const sample = FEED_SAMPLES[k % FEED_SAMPLES.length];
      k += 1;
      const myId = ++nextId;
      setFeed((prev) => [{ id: myId, name: sample.name, cost: sample.cost, flash: true }, ...prev].slice(0, 3));
      setBalance((b) => Math.max(0, b - sample.cost));
      window.setTimeout(() => {
        setFeed((prev) => prev.map((r) => (r.id === myId ? { ...r, flash: false } : r)));
      }, 700);
    }, 4200);
    return () => window.clearInterval(id);
  }, []);

  // Reveal on scroll
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (reduce) { els.forEach((el) => el.classList.add('in')); return; }
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
      { threshold: 0.14, rootMargin: '0px 0px -6% 0px' },
    );
    els.forEach((el) => io.observe(el));
    const fallback = window.setTimeout(() => {
      document.querySelectorAll<HTMLElement>('.reveal:not(.in)').forEach((el) => el.classList.add('in'));
    }, 1400);
    return () => { io.disconnect(); window.clearTimeout(fallback); };
  }, []);

  const balancePct = Math.round((balance / 3000) * 100);

  const phaseClass = (which: Phase) =>
    phase === which
      ? 'bg-brand-500 text-white border-brand-500 shadow-[0_6px_18px_-6px_rgba(16,168,104,0.7)]'
      : 'bg-white text-ink-500 border-ink-200';

  const navItem = (key: Exclude<Menu, null>, label: string) => (
    <button
      onMouseEnter={() => setOpenMenu(key)}
      onFocus={() => setOpenMenu(key)}
      onClick={() => setOpenMenu(openMenu === key ? null : key)}
      className={`flex items-center gap-1 px-1 py-2 text-[.93rem] font-medium transition ${
        openMenu === key ? 'text-ink-950' : 'text-ink-700 hover:text-ink-950'
      }`}
      aria-expanded={openMenu === key}
    >
      {label}
      <span className={`transition-transform ${openMenu === key ? 'rotate-180' : ''}`}><Chevron /></span>
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
        .pipeline-track { position: relative; height: 3px; background: #eef4f1; border-radius: 999px; overflow: hidden; }
        .pipeline-track::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, #10a868, transparent); animation: pipelineSweep 1.4s linear infinite; }
        @keyframes pipelineSweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }

        .announce-bar {
          background: linear-gradient(90deg, #d8f3e3 0%, #e8f4f0 50%, #e2ebe6 100%);
          border-bottom: 1px solid #c8f0dc;
        }
        .hero-bg {
          background:
            radial-gradient(60% 50% at 100% 0%, rgba(146,227,189,.35) 0%, transparent 60%),
            radial-gradient(40% 40% at 0% 100%, rgba(200,240,220,.45) 0%, transparent 60%);
        }
      `}</style>

      {/* ─────────── HEADER ─────────── */}
      <header
        className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-ink-100"
        onMouseLeave={() => setOpenMenu(null)}
      >
        <div className="wrap h-[64px] flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold text-ink-950">
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden>
              <rect x="2" y="2" width="24" height="24" rx="7" fill="#10a868" />
              <circle cx="14" cy="14" r="6" stroke="#fff" strokeWidth="1.9" fill="none" />
              <path d="M14 10.2v7.6M11.6 12.6h4.8M11.6 15.4h4.8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span className="text-[1.05rem]">Agent<span className="text-brand-500">Mint</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {navItem('platform',  'Platform')}
            {navItem('solutions', 'Solutions')}
            {navItem('resources', 'Resources')}
            <Link href="#pricing" className="px-1 py-2 text-[.93rem] font-medium text-ink-700 hover:text-ink-950 transition">Pricing</Link>
            <Link href="#faq" className="px-1 py-2 text-[.93rem] font-medium text-ink-700 hover:text-ink-950 transition">FAQ</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/build/login" className="hidden sm:inline text-[.92rem] font-medium text-ink-700 hover:text-ink-950">Login</Link>
            <Link
              href="/build/signup"
              className="inline-flex items-center gap-1.5 text-[.9rem] font-semibold text-white bg-ink-950 hover:bg-ink-800 rounded-lg px-4 py-2.5 transition"
            >
              Start building <Arrow />
            </Link>
          </div>
        </div>

        {/* MEGA-MENU DROPDOWN */}
        {openMenu && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-ink-100 shadow-[0_24px_48px_-24px_rgba(6,34,26,0.18)]">
            <div className="wrap py-9">

              {openMenu === 'platform' && (
                <div className="grid md:grid-cols-[1fr_1fr_320px] gap-x-10 gap-y-8">
                  <div>
                    <div className="text-[11px] uppercase tracking-[.14em] text-ink-400 font-bold mb-4">Core</div>
                    <div className="space-y-4">
                      {PLATFORM_CORE.map((m) => (
                        <Link href="#features" key={m.title} className="flex gap-3 group">
                          <span className="w-9 h-9 rounded-lg bg-ink-50 text-ink-700 flex items-center justify-center group-hover:bg-brand-500/10 group-hover:text-brand-600 transition flex-shrink-0">
                            <MenuIcon name={m.icon} />
                          </span>
                          <div>
                            <div className="font-bold text-ink-950 text-[.92rem]">{m.title}</div>
                            <div className="text-[.8rem] text-ink-500 mt-0.5">{m.desc}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[.14em] text-ink-400 font-bold mb-4">Payment rails</div>
                    <div className="space-y-4">
                      {PLATFORM_RAILS.map((m) => (
                        <Link href="#rails" key={m.title} className="flex gap-3 group">
                          <span className="w-9 h-9 rounded-lg bg-ink-50 text-ink-700 flex items-center justify-center group-hover:bg-brand-500/10 group-hover:text-brand-600 transition flex-shrink-0">
                            <MenuIcon name={m.icon} />
                          </span>
                          <div>
                            <div className="font-bold text-ink-950 text-[.92rem]">{m.title}</div>
                            <div className="text-[.8rem] text-ink-500 mt-0.5">{m.desc}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                  {/* Promo card */}
                  <div className="rounded-xl p-5 bg-gradient-to-br from-brand-50 to-ink-50 border border-brand-100">
                    <div className="text-[11px] uppercase tracking-[.14em] text-brand-700 font-bold">Inside the dashboard</div>
                    <div className="mt-3 rounded-lg bg-white border border-ink-100 p-3">
                      <div className="flex items-center justify-between text-[.7rem] text-ink-500">
                        <span>Wallet</span><span className="mono text-[.65rem]">2,184 cr</span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-ink-100 overflow-hidden">
                        <div className="h-full bg-brand-500" style={{ width: '73%' }} />
                      </div>
                      <div className="mt-3 space-y-1.5">
                        <div className="flex justify-between text-[.7rem]"><span className="mono text-ink-700">writer</span><span className="text-coral-500 mono">−25</span></div>
                        <div className="flex justify-between text-[.7rem]"><span className="mono text-ink-700">analyzer</span><span className="text-coral-500 mono">−30</span></div>
                      </div>
                    </div>
                    <Link href="/build/signup" className="mt-4 inline-flex items-center gap-1 text-[.78rem] font-bold text-ink-950 hover:text-brand-600 transition">
                      See it live <Arrow size={12} />
                    </Link>
                  </div>
                </div>
              )}

              {openMenu === 'solutions' && (
                <div className="grid md:grid-cols-3 gap-x-10 gap-y-8">
                  <div>
                    <div className="text-[11px] uppercase tracking-[.14em] text-ink-400 font-bold mb-4">Who it's for</div>
                    <div className="space-y-4">
                      {SOLUTIONS_MENU.WHO.map((m) => (
                        <Link href="#features" key={m.title} className="block group">
                          <div className="font-bold text-ink-950 text-[.92rem] group-hover:text-brand-600 transition">{m.title}</div>
                          <div className="text-[.8rem] text-ink-500 mt-0.5">{m.desc}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[.14em] text-ink-400 font-bold mb-4">By stage</div>
                    <div className="space-y-4">
                      {SOLUTIONS_MENU.STAGE.map((m) => (
                        <Link href="#features" key={m.title} className="block group">
                          <div className="font-bold text-ink-950 text-[.92rem] group-hover:text-brand-600 transition">{m.title}</div>
                          <div className="text-[.8rem] text-ink-500 mt-0.5">{m.desc}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl p-5 bg-gradient-to-br from-brand-50 to-ink-50 border border-brand-100">
                    <div className="text-[11px] uppercase tracking-[.14em] text-brand-700 font-bold">India-first</div>
                    <h4 className="mt-2 font-extrabold text-ink-950 text-[1rem] leading-tight tracking-tight">INR via Razorpay, UPI autopay, GST invoicing.</h4>
                    <p className="mt-2 text-[.8rem] text-ink-600">In active build. Pilot builders shipping to India get priority.</p>
                    <Link href="/build/signup" className="mt-4 inline-flex items-center gap-1 text-[.78rem] font-bold text-ink-950 hover:text-brand-600 transition">
                      Get on the list <Arrow size={12} />
                    </Link>
                  </div>
                </div>
              )}

              {openMenu === 'resources' && (
                <div className="grid md:grid-cols-2 gap-x-10 gap-y-8 max-w-3xl">
                  {RESOURCES_MENU.map((m) => (
                    <Link href={(m as any).href || '#'} key={m.title} className="block group">
                      <div className="font-bold text-ink-950 text-[.95rem] group-hover:text-brand-600 transition">{m.title}</div>
                      <div className="text-[.82rem] text-ink-500 mt-0.5">{m.desc}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main>

        {/* ─────────── HERO ─────────── */}
        <section className="hero-bg relative overflow-hidden">
          <div className="relative wrap pt-20 pb-24 md:pt-24 md:pb-28">
            <div className="grid lg:grid-cols-[1.05fr_1fr] gap-x-14 gap-y-14 items-center">

              <div>
                <div className="reveal inline-flex items-center gap-2 chip">
                  <span className="dot bg-brand-500 dot-pulse" />
                  Pilot cohort is open · $0 for first 6 builders
                </div>
                <h1 className="reveal h1 balance mt-6">
                  One wallet for{' '}
                  <span ref={rotorRef} className="text-brand-500 inline-block">every agent.</span>
                </h1>
                <p className="reveal lead mt-6 max-w-xl">
                  Billing for AI-agent suites. Three SDKs (or two raw HTTPS calls). Five rails to settle — Stripe, PayPal, Razorpay, Apple Pay, UPI.
                </p>
                <div className="reveal mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/build/signup"
                    className="inline-flex items-center gap-1.5 text-[.95rem] font-semibold text-white bg-ink-950 hover:bg-ink-800 rounded-lg px-5 py-3 transition"
                  >
                    Start building <Arrow size={15} />
                  </Link>
                  <a
                    href="#how"
                    className="inline-flex items-center gap-1.5 text-[.95rem] font-semibold text-ink-800 bg-white border border-ink-200 hover:border-ink-400 rounded-lg px-5 py-3 transition"
                  >
                    See how it works
                  </a>
                </div>
              </div>

              <div className="reveal">
                <div className="card p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[.78rem] font-semibold text-ink-500 uppercase tracking-wider">
                      <span className="dot bg-brand-500 dot-pulse" /> Live customer wallet
                    </div>
                    <span className="mono text-[.74rem] text-ink-400">workspace_ac82</span>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    <div className={`mono text-[.7rem] font-semibold px-2 py-1.5 rounded-lg border transition-colors duration-300 ${phaseClass('authorize')}`}>authorize()</div>
                    <div className={`mono text-[.7rem] font-semibold px-2 py-1.5 rounded-lg border transition-colors duration-300 ${phaseClass('run')}`}>run agent</div>
                    <div className={`mono text-[.7rem] font-semibold px-2 py-1.5 rounded-lg border transition-colors duration-300 ${phaseClass('debit')}`}>debit()</div>
                  </div>
                  <div className="pipeline-track mt-3" />

                  <div className="mt-5 rounded-2xl border border-ink-100 p-4 bg-ink-50">
                    <div className="flex items-center justify-between text-[.78rem] text-ink-500 font-medium">
                      <span>Credit balance</span>
                      <span className="chip !py-0.5 !px-2 !text-[.72rem]">
                        <span className="dot bg-brand-500" />Growth · 3,000/mo
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-end gap-2">
                      <span className="text-[2.6rem] leading-none font-extrabold tnum text-ink-950">{balance.toLocaleString('en-US')}</span>
                      <span className="text-ink-500 pb-1 font-medium">credits</span>
                      <span className="ml-auto text-[.78rem] text-ink-400 pb-1 tnum">~{Math.max(1, Math.round(balance / 95))} days</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-ink-200 overflow-hidden">
                      <div className="h-full bg-brand-500 transition-all duration-500" style={{ width: `${balancePct}%` }} />
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="text-[.74rem] font-semibold text-ink-500 uppercase tracking-wider mb-2.5">Live agent calls</div>
                    <ul className="space-y-1.5 text-[.86rem]">
                      {feed.map((row) => (
                        <li key={row.id} className={`flex items-center justify-between rounded-md px-2 py-1 -mx-2 ${row.flash ? 'feed-flash' : ''}`}>
                          <span className="mono text-ink-700 truncate">{row.name}</span>
                          <span className="text-coral-500 font-semibold tnum">−{row.cost}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ─────────── PAYMENT RAILS STRIP ─────────── */}
        <section id="rails" className="border-y border-ink-100 bg-white">
          <div className="wrap py-9">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-6">
              <div>
                <div className="text-[12px] uppercase tracking-[.14em] text-brand-700 font-bold">Five rails to settle</div>
                <p className="mt-1 text-[.92rem] text-ink-600">Take payment the way your customer wants to pay. We hand the money to your bank.</p>
              </div>
              <span className="text-[12px] mono text-ink-400">USD · INR · global</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {PAY_RAILS.map((r) => (
                <div key={r.name} className="border border-ink-100 rounded-xl px-4 py-3.5 hover:border-brand-200 transition bg-ink-50/40">
                  <div className="font-extrabold text-ink-950 text-[.95rem] tracking-tight">{r.name}</div>
                  <div className="text-[.74rem] text-ink-500 mono mt-0.5">{r.note}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────── FEATURES ─────────── */}
        <section id="features" className="bg-brand-50/40 border-b border-ink-100">
          <div className="wrap py-20 md:py-24">
            <div className="reveal max-w-2xl">
              <div className="eyebrow">What you get</div>
              <h2 className="h2 balance mt-4">Three primitives. <span className="text-brand-500">That's it.</span></h2>
            </div>

            <div className="mt-12 grid md:grid-cols-3 gap-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="reveal card p-7">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-brand-500" />
                  </div>
                  <h3 className="mt-5 font-extrabold text-ink-950 text-[1.1rem] tracking-tight">{f.title}</h3>
                  <p className="mt-2 text-[14.5px] text-ink-600 leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────── RESULTS (Zenskar-style) ─────────── */}
        <section className="bg-white">
          <div className="wrap py-20 md:py-24">
            <div className="reveal text-center max-w-2xl mx-auto">
              <div className="eyebrow justify-center">Why builders pick AgentMint</div>
              <h2 className="h2 balance mt-4">Numbers, honestly.</h2>
              <p className="lead mt-4">No fabricated metrics. Just the shape of what you get on day one.</p>
            </div>

            <div className="mt-12 grid md:grid-cols-3 gap-5">
              {RESULTS.map((r) => (
                <div key={r.label} className="reveal rounded-2xl p-8 bg-brand-50/60 border border-brand-100">
                  <div className="text-[3rem] leading-none font-extrabold tracking-tight text-ink-950 tnum">{r.kpi}</div>
                  <div className="mt-2 text-[14px] font-semibold text-brand-700">{r.label}</div>
                  <p className="mt-4 text-[14.5px] text-ink-600 leading-relaxed">{r.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────── HOW IT WORKS ─────────── */}
        <section id="how" className="bg-brand-50/40 border-y border-ink-100">
          <div className="wrap py-20 md:py-24">
            <div className="reveal max-w-2xl">
              <div className="eyebrow">How it works</div>
              <h2 className="h2 balance mt-4">Three steps. Then ship.</h2>
            </div>

            <div className="mt-12 grid lg:grid-cols-2 gap-8 items-start">
              <ol className="space-y-3">
                {STEPS.map((s) => (
                  <li key={s.n} className="reveal card p-5 flex gap-5">
                    <div className="w-11 h-11 rounded-xl bg-brand-500 text-white font-extrabold flex items-center justify-center mono text-[.95rem] flex-shrink-0">
                      {s.n}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-ink-950 tracking-tight">{s.title}</h3>
                      <p className="mt-1 text-[14px] text-ink-600 leading-relaxed">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="reveal rounded-2xl overflow-hidden border border-ink-200 bg-ink-950 text-ink-50">
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
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-5 pt-3 pb-1 flex items-center gap-2 border-b border-ink-800/60">
                  <span className="text-[10.5px] uppercase tracking-[.14em] text-ink-500 font-bold">Install</span>
                  <code className="mono text-[12px] text-brand-300 bg-ink-900 px-2 py-0.5 rounded">{SDK_TABS.find((t) => t.id === sdkTab)?.install}</code>
                </div>

                <pre className="mono text-[12.5px] leading-[1.7] px-5 py-5 overflow-auto"><code>
                  {SDK_TABS.find((t) => t.id === sdkTab)?.code.map((seg, i) => {
                    if (seg.kind === 'comment') return <span key={i} className="text-ink-400">{seg.v}</span>;
                    if (seg.kind === 'token')   return <span key={i} className="text-brand-300">{seg.v}</span>;
                    return <span key={i}>{seg.v}</span>;
                  })}
                </code></pre>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────── PRICING ─────────── */}
        <section id="pricing" className="bg-white">
          <div className="wrap py-20 md:py-24">
            <div className="reveal max-w-2xl">
              <div className="eyebrow">Pricing</div>
              <h2 className="h2 balance mt-4">Start free. Pay when you earn.</h2>
            </div>

            <div className="mt-12 grid md:grid-cols-3 gap-5">
              {PLANS.map((p) => (
                <div
                  key={p.name}
                  className={`reveal card p-7 flex flex-col ${p.accent ? '!border-brand-500 !border-2 relative' : ''}`}
                >
                  {p.accent && (
                    <span className="absolute -top-3 right-6 chip !bg-brand-500 !text-white !border-brand-500 !text-[11px]">
                      Most popular
                    </span>
                  )}
                  <div className="text-[13px] font-semibold text-ink-500 uppercase tracking-wider">{p.name}</div>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-[2.4rem] font-extrabold tracking-tight text-ink-950">{p.price}</span>
                    <span className="text-[14px] text-ink-500">{p.cadence}</span>
                  </div>
                  <ul className="mt-6 space-y-3 text-[14.5px] text-ink-700 flex-1">
                    {p.items.map((it) => (
                      <li key={it} className="flex gap-2.5 items-start"><span className="mt-0.5">{CHECK}</span><span>{it}</span></li>
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
                    {p.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────── FAQ ─────────── */}
        <section id="faq" className="bg-brand-50/40 border-y border-ink-100">
          <div className="wrap py-20 md:py-24">
            <div className="reveal max-w-2xl">
              <div className="eyebrow">FAQ</div>
              <h2 className="h2 balance mt-4">Quick answers.</h2>
            </div>

            <div className="mt-10 max-w-3xl divide-y divide-ink-100">
              {FAQ.map(([q, a]) => (
                <div key={q} className="reveal py-6">
                  <h3 className="font-extrabold text-ink-950 tracking-tight text-[1.02rem]">{q}</h3>
                  <p className="mt-2 text-[14.5px] text-ink-600 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────── CTA ─────────── */}
        <section className="relative overflow-hidden bg-ink-950 text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute rounded-full"
            style={{ width: '32rem', height: '32rem', background: '#10a868', top: '-12rem', right: '-8rem', filter: 'blur(80px)', opacity: 0.35 }}
          />
          <div className="relative wrap py-24 text-center">
            <h2 className="reveal h2 balance text-white">
              Ship the billing. <span className="text-brand-400">Keep the focus on agents.</span>
            </h2>
            <div className="reveal mt-9 flex flex-wrap justify-center gap-3">
              <Link
                href="/build/signup"
                className="inline-flex items-center gap-1.5 text-[.95rem] font-semibold text-ink-950 bg-white hover:bg-ink-50 rounded-lg px-5 py-3 transition"
              >
                Start building <Arrow size={15} />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-1.5 text-[.95rem] font-semibold text-white border border-white/30 hover:border-white/70 rounded-lg px-5 py-3 transition"
              >
                See the contract
              </a>
            </div>
          </div>
        </section>

        {/* ─────────── FOOTER ─────────── */}
        <footer className="bg-white border-t border-ink-100">
          <div className="wrap py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] text-ink-500">
            <div className="flex items-center gap-2 font-extrabold text-ink-800">
              <svg width="18" height="18" viewBox="0 0 28 28" fill="none" aria-hidden>
                <rect x="2" y="2" width="24" height="24" rx="7" fill="#10a868" />
                <circle cx="14" cy="14" r="6" stroke="#fff" strokeWidth="1.9" fill="none" />
                <path d="M14 10.2v7.6M11.6 12.6h4.8M11.6 15.4h4.8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              AgentMint
            </div>
            <div className="flex items-center gap-6">
              <a href="#features" className="hover:text-ink-950 transition">Features</a>
              <a href="#pricing" className="hover:text-ink-950 transition">Pricing</a>
              <Link href="/build/signup" className="hover:text-ink-950 transition">Get started</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
