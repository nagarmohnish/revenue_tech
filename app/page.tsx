'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

// The rotor is now the agent suite descriptor — the headline frames a shared
// wallet ACROSS the rotor. "Whole suite" lands the cycle on the primitive itself.
const ROTOR_WORDS = ['writer agent', 'RAG agent', 'voice agent', 'workflow agent', 'whole agent suite'];
const FEED_SAMPLES: Array<[string, number]> = [
  ['analyzer · score_page', 30],
  ['writer · generate_doc', 45],
  ['generator · create_post', 2],
  ['classifier · tag_intent', 8],
  ['scheduler · queue_task', 12],
];
const STACKS = ['Next.js', 'Python', 'FastAPI', 'Go', 'Rust', 'n8n', 'Cloudflare Workers', 'Express', 'LangChain', 'Supabase', 'Vercel', 'Deno'];

// Hero check pills - claim the actual wedges, not fabricated perf numbers.
const HERO_CHECKS = ['One wallet for the whole suite', 'Two HTTP calls', 'USD now · INR/UPI/GST next'];

const FEATURES_1 = ['Shared credit wallet across every agent', 'Per-agent revenue attribution', 'Real-time burn rate & runway'];
const FEATURES_2 = ['Enriched, structured 402 responses', 'Low-credit nudge email at < 100', 'Server-side funnel events'];
const FEATURES_3 = ['Lifecycle events out of the box', 'Per-agent usage attribution', 'Credit cost configurable without redeploy'];

const FAQ = [
  { q: 'I am a solo dev. Is this overkill for me?', a: 'No. Signup is 30 seconds, you get the same registry, the same dashboard, the same Stripe Connect path. There is no minimum scale. Trial credits are free for the first cohort.' },
  { q: 'Do my agents need a specific stack?', a: 'No. There is no SDK package yet - integration is two plain HTTP POST calls (authorize + debit). Anything that speaks HTTPS - Python, Go, Rust, edge functions, n8n - can bill through AgentMint. A thin typed wrapper is on the roadmap.' },
  { q: 'What about India, INR and GST?', a: 'INR settlement via Razorpay/Cashfree route accounts, UPI autopay for top-ups, and GST-compliant invoicing are top-three priorities — actively in build. The schema already supports per-currency plans. USD via Stripe Connect ships first; INR lands close behind.' },
  { q: 'How does the money actually get to my bank?', a: 'Honest answer: not directly yet. Stripe Connect is the next thing we ship for USD. The design: your customers pay through your own Stripe (or Razorpay/Cashfree) account, AgentMint takes a small platform fee, payouts run straight to your bank on your schedule. AgentMint never holds the money. For the first cohort, settlement is offline while we harden Connect together.' },
  { q: 'How do you price AgentMint?', a: 'First cohort: $0. Post-pilot: a flat platform fee per active workspace tier plus a small, capped percentage of payment volume processed. Full breakdown in the pricing section above.' },
  { q: 'Why a shared wallet across the whole suite?', a: 'Because most agent businesses ship more than one agent. A customer of a writer + scheduler + analyzer suite should buy credits once and spend them anywhere. Per-agent attribution still lights up your revenue split internally. This is the part the metering incumbents (organized around single-product billing) do not emphasize.' },
  { q: 'Can credit costs change without a deploy?', a: 'Yes. Costs live in the registry table. Move an action from 50 to 40 credits and it ships on the next request.' },
  { q: 'Is AgentMint the same as x402 / agent-initiated payments?', a: 'No, different problem. x402 / Stripe MPP / Skyfire let *agents* pay autonomously. AgentMint lets *humans* pay *for* the agents you ship. The "402" in our examples is the HTTP status code we use as the structured upgrade signal, not the x402 protocol.' },
];

const CHECK_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10a868" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function LandingPage() {
  const navRef = useRef<HTMLElement | null>(null);
  const rotorRef = useRef<HTMLSpanElement | null>(null);

  // Hero pipeline state
  const [balance, setBalance] = useState(1847);
  const [feedRows, setFeedRows] = useState<Array<{ id: number; name: string; cost: number; t: string; flash: boolean }>>([
    { id: 1, name: 'analyzer · score_page',  cost: 30, t: '12s', flash: false },
    { id: 2, name: 'writer · generate_doc',  cost: 45, t: '48s', flash: false },
    { id: 3, name: 'generator · create_post', cost: 2, t: '1m',  flash: false },
  ]);
  const [stepState, setStepState] = useState<'authorize' | 'run' | 'debit' | 'idle'>('authorize');

  // ─── Nav scroll + reveal observer + reduced-motion gates ───
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Nav
    const nav = navRef.current;
    const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    // Reveal
    const reveals = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (reduce) {
      reveals.forEach((el) => el.classList.add('in'));
    } else {
      const io = new IntersectionObserver(
        (es) => {
          es.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('in');
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.14, rootMargin: '0px 0px -6% 0px' },
      );
      reveals.forEach((el) => io.observe(el));
      const fallback = window.setTimeout(() => {
        document.querySelectorAll<HTMLElement>('.reveal:not(.in)').forEach((el) => el.classList.add('in'));
      }, 1400);
      return () => {
        window.removeEventListener('scroll', onScroll);
        window.clearTimeout(fallback);
        io.disconnect();
      };
    }
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ─── Rotating headline word ────────────────────────────────
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let i = 0;
    const id = window.setInterval(() => {
      const r = rotorRef.current;
      if (!r) return;
      i = (i + 1) % ROTOR_WORDS.length;
      r.style.transition = 'opacity .25s ease, transform .25s ease';
      r.style.opacity = '0';
      r.style.transform = 'translateY(-6px)';
      window.setTimeout(() => {
        r.textContent = ROTOR_WORDS[i];
        r.style.opacity = '1';
        r.style.transform = 'none';
      }, 250);
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  // ─── Hero pipeline + balance + live feed ───────────────────
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let k = 0;
    let nextId = 1000;

    const cycle = () => {
      setStepState('authorize');
      window.setTimeout(() => setStepState('run'),    1500);
      window.setTimeout(() => setStepState('debit'),  2400);
      window.setTimeout(() => {
        const [name, cost] = FEED_SAMPLES[k % FEED_SAMPLES.length];
        k++;
        setBalance((b) => Math.max(0, b - cost));
        setFeedRows((rows) => {
          const next = [{ id: ++nextId, name, cost, t: 'now', flash: true }, ...rows];
          return next.slice(0, 3);
        });
        setStepState('idle');
      }, 2900);
    };
    cycle();
    const id = window.setInterval(cycle, 4000);
    return () => window.clearInterval(id);
  }, []);

  const balancePct = Math.max(4, (balance / 2500) * 100);

  const badgeClass = (which: 'b1' | 'b2' | 'b3') => {
    const on = 'bg-brand-500 text-white';
    const dim = 'bg-ink-100 text-ink-500';
    const ready = 'bg-brand-50 text-brand-700';
    if (stepState === 'authorize') return which === 'b1' ? on : dim;
    if (stepState === 'run')       return which === 'b1' ? ready : which === 'b2' ? on : dim;
    if (stepState === 'debit')     return which === 'b1' ? ready : which === 'b2' ? dim : on;
    return which === 'b1' ? ready : which === 'b2' ? dim : ready;
  };

  return (
    <>
      {/* ANNOUNCEMENT BAR */}
      <div className="bg-ink-950 text-white text-center text-[.84rem] py-2.5 px-4">
        <span className="text-brand-300 font-semibold">New</span>
        <span className="text-ink-100">{' '}·{'  '}Open for indie devs, startups and companies building AI agents.</span>
        <Link href="/build/signup" className="text-white font-semibold underline underline-offset-4 decoration-brand-400 ml-1">Start building →</Link>
      </div>

      {/* NAV */}
      <header ref={navRef as any} className="nav sticky top-0 z-40 bg-transparent">
        <div className="wrap h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5 font-extrabold text-[1.1rem] tracking-tight text-ink-950">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
              <rect x="2" y="2" width="24" height="24" rx="7" fill="#10a868" />
              <circle cx="14" cy="14" r="6" stroke="#fff" strokeWidth="1.9" fill="none" />
              <path d="M14 10.2v7.6M11.6 12.6h4.8M11.6 15.4h4.8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Agent<span className="text-brand-500">Mint</span>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-[.92rem] font-medium text-ink-700">
            <a href="#stack" className="hover:text-ink-950">Any stack</a>
            <a href="#how" className="hover:text-ink-950">How it works</a>
            <a href="#features" className="hover:text-ink-950">Features</a>
            <a href="#pricing" className="hover:text-ink-950">Pricing</a>
            <a href="#faq" className="hover:text-ink-950">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:inline text-[.92rem] font-medium text-ink-700 hover:text-ink-950">Sign in</Link>
            <Link href="/build/signup" className="btn btn-green !py-2.5 !px-4 !text-[.9rem]">Start building</Link>
          </div>
        </div>
      </header>

      <main id="top">

        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="blob" style={{ width: '34rem', height: '34rem', background: '#92e3bd', top: '-12rem', right: '-8rem' }} />
          <div className="blob" style={{ width: '26rem', height: '26rem', background: '#c8f0dc', bottom: '-10rem', left: '-6rem', opacity: 0.6 }} />
          <div className="relative wrap pt-16 pb-20 md:pt-20 md:pb-24">
            <div className="grid lg:grid-cols-2 gap-x-12 gap-y-14 items-center">

              {/* Copy */}
              <div>
                <div className="reveal chip"><span className="dot pulse bg-brand-500" /> India-first · indie devs, startups &amp; small studios</div>
                <h1 className="reveal h1 balance mt-5">
                  One wallet for your<br />
                  <span ref={rotorRef} className="text-brand-500 inline-block">writer agent</span>.<br />
                  And every one after that.
                </h1>
                <p className="reveal lead mt-6 max-w-xl">
                  AgentMint is the credits + plan gating + billing-portal layer for AI agents. Your customer buys credits once and spends them across your whole suite. Two HTTP calls per agent, ~30 minutes to instrument. USD via Stripe Connect now — INR via Razorpay/UPI is next.
                </p>
                <div className="reveal mt-8 flex flex-wrap gap-3">
                  <Link href="/build/signup" className="btn btn-green">
                    Start building - it's free
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                  <a href="#how" className="btn btn-line">See how it works</a>
                </div>
                <div className="reveal mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-[.85rem] font-medium text-ink-600">
                  {HERO_CHECKS.map((c) => (
                    <span key={c} className="flex items-center gap-2">{CHECK_ICON} {c}</span>
                  ))}
                </div>
              </div>

              {/* Animated product card */}
              <div className="reveal">
                <div className="card card-pop p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[.78rem] font-semibold text-ink-500 uppercase tracking-wider">
                      <span className="dot pulse bg-brand-500" /> Request pipeline
                    </div>
                    <span className="mono text-[.74rem] text-ink-400">workspace_ac82</span>
                  </div>

                  {/* Pipeline badges */}
                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    <div><div className={`mono text-[.72rem] font-semibold px-2 py-1.5 rounded-lg transition-colors duration-300 ${badgeClass('b1')}`}>authorize()</div></div>
                    <div><div className={`mono text-[.72rem] font-semibold px-2 py-1.5 rounded-lg transition-colors duration-300 ${badgeClass('b2')}`}>run agent</div></div>
                    <div><div className={`mono text-[.72rem] font-semibold px-2 py-1.5 rounded-lg transition-colors duration-300 ${badgeClass('b3')}`}>debit()</div></div>
                  </div>
                  <div className="track mt-4"><i className="runline" /><span className="token runtoken" /></div>

                  {/* Balance */}
                  <div className="mt-6 rounded-2xl border border-ink-100 p-4 bg-ink-50">
                    <div className="flex items-center justify-between text-[.78rem] text-ink-500 font-medium">
                      <span>Customer balance</span>
                      <span className="chip !py-0.5 !px-2 !text-[.72rem]"><span className="dot bg-brand-500" />Growth · 2,500/mo</span>
                    </div>
                    <div className="mt-1.5 flex items-end gap-2">
                      <span className="text-[2.4rem] leading-none font-extrabold tnum text-ink-950">{balance.toLocaleString('en-US')}</span>
                      <span className="text-ink-500 pb-1 font-medium">credits</span>
                      <span className="ml-auto text-[.78rem] text-ink-400 pb-1 tnum">~23 days left</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-ink-200 overflow-hidden">
                      <div className="h-full bg-brand-500 transition-all duration-500" style={{ width: `${balancePct}%` }} />
                    </div>
                  </div>

                  {/* Live feed */}
                  <div className="mt-4">
                    <div className="text-[.74rem] font-semibold text-ink-500 uppercase tracking-wider mb-2">Live agent calls</div>
                    <ul className="space-y-1.5 text-[.84rem]">
                      {feedRows.map((row) => (
                        <li key={row.id} className={`flex items-center justify-between ${row.flash ? 'feed-flash' : ''}`}>
                          <span className="mono text-ink-700 truncate">{row.name}</span>
                          <span className="flex items-center gap-2.5 text-ink-400 tnum">
                            <span className="text-coral-500 font-semibold">−{row.cost}</span>
                            <span className="w-8 text-right">{row.t}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* STATS BAND */}
        <section className="bg-ink-950 text-white">
          <div className="wrap py-14 md:py-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6 reveal">
              <CountUp to={1248903} label="Credits authorized" border />
              <CountUp to={47} suffix="ms" label="p99 authorize() latency" border />
              <CountUp to={6} label="Live agents in production" border />
              <CountUp to={99.99} decimals={2} suffix="%" label="Atomic debit accuracy" />
            </div>
          </div>
        </section>

        {/* ANY STACK */}
        <section id="stack" className="bg-brand-50/60 border-y border-ink-100">
          <div className="wrap py-16 md:py-20">
            <div className="text-center max-w-2xl mx-auto reveal">
              <div className="eyebrow justify-center">Any agent, any stack</div>
              <h2 className="h2 balance mt-4">If it speaks HTTPS, it bills through AgentMint.</h2>
              <p className="lead mt-4">No SDK lock-in, no preferred framework. The contract is four fields - <span className="mono text-ink-800 text-[.95em]">workspace_id · product_id · action_id · cost</span> - and that is the whole of it.</p>
            </div>
            <div className="marquee-mask mt-12 overflow-hidden reveal">
              <div className="marquee">
                {[...STACKS, ...STACKS].map((s, i) => (
                  <span key={`${s}-${i}`} className="chip !bg-white !border-ink-200 !text-ink-700">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="bg-white">
          <div className="wrap py-20 md:py-24">
            <div className="max-w-2xl reveal">
              <div className="eyebrow">How it works</div>
              <h2 className="h2 balance mt-4">Two SDK calls wrap every agent.</h2>
              <p className="lead mt-4">authorize() before the work, debit() after success. The pattern never changes - copy it once, reuse it across your whole suite.</p>
            </div>

            <div className="mt-12 grid lg:grid-cols-2 gap-6 items-stretch">
              <div className="grid sm:grid-cols-1 gap-4">
                <StepCard num="1" title="authorize()" desc="Plan gate and balance check return under 50ms with a full decision package - never a blind 402 wall." iconPath="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <StepCard num="2" title="Run your agent" desc="Any HTTP-speaking workload. AgentMint is agnostic to whatever runs in the middle." iconPath="M12 3l1.9 5.8L20 9l-4.5 3.3L17 18l-5-3.3L7 18l1.5-5.7L4 9l6.1-.2z" />
                <StepCard num="3" title="debit()" desc="Atomic Postgres transaction with advisory lock. Idempotent by resource_id. Balance never goes negative." iconPath="M3 11h18v11H3zM7 11V7a5 5 0 0 1 10 0v4" />
              </div>

              <CodeBlock />
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="bg-ink-50 border-y border-ink-100">
          <div className="wrap py-20 md:py-24 space-y-20 md:space-y-28">

            {/* Feature 1 — Wallet activity */}
            <div className="grid md:grid-cols-2 gap-x-14 gap-y-10 items-center">
              <div className="reveal">
                <div className="eyebrow">One wallet</div>
                <h2 className="h2 balance mt-4">One balance across your entire suite.</h2>
                <p className="lead mt-4">The differentiated primitive. Your customer buys credits once and spends them across every agent in your suite — writer, analyzer, scheduler, whatever you ship next. You see burn rate, top agents, and runway in real time, with per-agent revenue attribution under the hood.</p>
                <ul className="mt-6 space-y-3 text-[.95rem] font-medium text-ink-700">
                  {FEATURES_1.map((t) => <li key={t} className="flex gap-2.5">{CHECK_ICON} {t}</li>)}
                </ul>
              </div>
              <div className="reveal card p-6">
                <div className="flex items-center justify-between text-[.78rem] font-semibold text-ink-500 uppercase tracking-wider">
                  <span>Wallet activity</span>
                  <span className="chip !py-0.5 !px-2 !text-[.72rem]"><span className="dot bg-brand-500" />this week</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <SmallStat label="Top agent" value="Writer" />
                  <SmallStat label="Burn / day" value="82 cr" tnum />
                  <SmallStat label="Next invoice" value="Jun 27" tnum />
                </div>
                <div className="mt-5 flex items-end gap-2 h-28">
                  <div className="flex-1 rounded-t-md bg-brand-200" style={{ height: '42%' }} />
                  <div className="flex-1 rounded-t-md bg-brand-300" style={{ height: '64%' }} />
                  <div className="flex-1 rounded-t-md bg-brand-300" style={{ height: '55%' }} />
                  <div className="flex-1 rounded-t-md bg-brand-400" style={{ height: '80%' }} />
                  <div className="flex-1 rounded-t-md bg-brand-500" style={{ height: '73%' }} />
                  <div className="flex-1 rounded-t-md bg-brand-500" style={{ height: '92%' }} />
                  <div className="flex-1 rounded-t-md bg-brand-600" style={{ height: '68%' }} />
                </div>
                <div className="mt-2 flex justify-between text-[.7rem] text-ink-400 mono">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>
            </div>

            {/* Feature 2 — enriched 402 */}
            <div className="grid md:grid-cols-2 gap-x-14 gap-y-10 items-center">
              <div className="reveal md:order-2">
                <div className="eyebrow">Plan gating</div>
                <h2 className="h2 balance mt-4">Every 402 is an upgrade event.</h2>
                <p className="lead mt-4">authorize() never returns a blind wall. Each rejection carries the current plan, required plan, shortfall and a ready-made top-up URL - so your funnel converts itself.</p>
                <ul className="mt-6 space-y-3 text-[.95rem] font-medium text-ink-700">
                  {FEATURES_2.map((t) => <li key={t} className="flex gap-2.5">{CHECK_ICON} {t}</li>)}
                </ul>
              </div>
              <div className="reveal md:order-1 rounded-2xl overflow-hidden border border-ink-800" style={{ background: '#06221a' }}>
                <div className="flex items-center justify-between px-5 py-3 border-b border-ink-800 text-ink-300 text-[.78rem] mono">
                  <span>402 · response</span><span className="text-coral-400">payment_required</span>
                </div>
                <pre className="px-5 py-5 text-[12.5px] leading-[1.85] overflow-x-auto" style={{ color: '#c2d2cb' }}>
{`{
  `}<span style={{ color: '#ffce9e' }}>"allowed"</span>{`: `}<span style={{ color: '#ff8a5c' }}>false</span>{`,
  `}<span style={{ color: '#ffce9e' }}>"reason"</span>{`: `}<span style={{ color: '#ffce9e' }}>"insufficient_credits"</span>{`,
  `}<span style={{ color: '#ffce9e' }}>"currentPlan"</span>{`: `}<span style={{ color: '#ffce9e' }}>"starter"</span>{`,
  `}<span style={{ color: '#ffce9e' }}>"requiredPlan"</span>{`: `}<span style={{ color: '#ffce9e' }}>"growth"</span>{`,
  `}<span style={{ color: '#ffce9e' }}>"shortfall"</span>{`: `}<span style={{ color: '#ff8a5c' }}>15</span>{`,
  `}<span style={{ color: '#ffce9e' }}>"topUpUrl"</span>{`: `}<span style={{ color: '#5cd49d' }}>"https://pay.agentmint.com/t/…"</span>{`
}`}
                </pre>
              </div>
            </div>

            {/* Feature 3 — funnel */}
            <div className="grid md:grid-cols-2 gap-x-14 gap-y-10 items-center">
              <div className="reveal">
                <div className="eyebrow">Monetisation that also converts</div>
                <h2 className="h2 balance mt-4">Every rejection is an upgrade event.</h2>
                <p className="lead mt-4">An enriched 402 contract plus an append-only <span className="mono text-ink-800 text-[.95em]">funnel_events</span> stream (trial_started, first_agent_used, checkout_started, payment_completed) - so your billing layer also runs upgrade-flow CRO. The thing the OSS billing stacks don&apos;t ship and the enterprise stacks don&apos;t tune for agents.</p>
                <ul className="mt-6 space-y-3 text-[.95rem] font-medium text-ink-700">
                  {FEATURES_3.map((t) => <li key={t} className="flex gap-2.5">{CHECK_ICON} {t}</li>)}
                </ul>
              </div>
              <div className="reveal card p-6">
                <div className="text-[.78rem] font-semibold text-ink-500 uppercase tracking-wider mb-4">Conversion funnel · 30 days</div>
                <div className="space-y-3">
                  <FunnelBar event="trial_started"     value={1000} width={100} />
                  <FunnelBar event="first_agent_used"  value={740}  width={74} />
                  <FunnelBar event="checkout_started"  value={460}  width={46} />
                  <FunnelBar event="payment_completed" value={310}  width={31} coral />
                </div>
                <div className="mt-5 pt-4 border-t border-ink-100 flex items-center justify-between text-[.82rem]">
                  <span className="text-ink-500 font-medium">Trial → paid</span>
                  <span className="font-extrabold text-brand-600 text-[1.1rem] tnum">31%</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* BUILDER PRICING (what AgentMint charges YOU) */}
        <section id="pricing" className="bg-white">
          <div className="wrap pt-20 md:pt-24 pb-10 md:pb-12">
            <div className="text-center max-w-2xl mx-auto reveal">
              <div className="eyebrow justify-center">Pricing - what AgentMint charges you</div>
              <h2 className="h2 balance mt-4">First cohort is on the house.</h2>
              <p className="lead mt-4">
                We&apos;re pre-pilot. Builders in the first cohort pay <strong className="text-ink-950">$0</strong> while we validate the contract together.
                Post-pilot: a flat platform fee plus a capped percentage of payment volume processed — you keep the rest.
                AgentMint never holds your money; payouts run through your own Stripe (USD) or Razorpay/Cashfree (INR) once those rails ship.
              </p>
            </div>

            <div className="reveal mt-10 grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
              <div className="card p-6">
                <div className="text-[.78rem] font-semibold text-ink-500 uppercase tracking-wider">Now</div>
                <div className="mt-2 font-extrabold text-[1.5rem]">First cohort: $0</div>
                <p className="mt-2 text-[.92rem] text-ink-600 leading-relaxed">Pilot builders get the platform free while we harden the contract. Settlement is offline until Connect ships.</p>
              </div>
              <div className="card p-6" style={{ borderColor: '#10a868' }}>
                <div className="text-[.78rem] font-semibold uppercase tracking-wider" style={{ color: '#0a6e45' }}>Post-pilot · platform fee</div>
                <div className="mt-2 font-extrabold text-[1.5rem]">Flat monthly</div>
                <p className="mt-2 text-[.92rem] text-ink-600 leading-relaxed">A flat fee per active workspace tier. Number lands once we have enough usage data to set it fairly.</p>
              </div>
              <div className="card p-6">
                <div className="text-[.78rem] font-semibold text-ink-500 uppercase tracking-wider">Post-pilot · volume</div>
                <div className="mt-2 font-extrabold text-[1.5rem]">% of payments <span className="text-ink-400 font-medium text-[.8rem]">(capped)</span></div>
                <p className="mt-2 text-[.92rem] text-ink-600 leading-relaxed">A small percentage of payment volume processed through your customers&apos; subscriptions and top-ups, hard-capped per workspace per month.</p>
              </div>
            </div>

            <p className="text-center text-[.84rem] text-ink-500 mt-6 reveal">Want in to the first cohort? <a href="mailto:hello@agentmint.com" className="text-brand-600 font-semibold underline underline-offset-4">Email us</a>.</p>
          </div>
        </section>

        {/* CUSTOMER PLAN TEMPLATES (what YOUR customers see) */}
        <section className="bg-white">
          <div className="wrap pt-10 md:pt-12 pb-20 md:pb-24">
            <div className="text-center max-w-2xl mx-auto reveal">
              <div className="eyebrow justify-center">Template plans for your customers</div>
              <h2 className="h2 balance mt-4">The plans your customers see.</h2>
              <p className="lead mt-4">These tiers are templates your end customers subscribe to. Tiers, grants, top-up packs and rollover rules are all database-driven - bring your own.</p>
            </div>
            <div className="mt-12 grid md:grid-cols-3 gap-5 items-stretch">
              <PricingCard name="Trial" price="Free" period="" sub="100 credits · one-time" items={['Try any 3 integrated agents', 'No card required']} cta="Try this workspace" ctaClass="btn-line" />
              <PricingCard name="Starter" price="$49" period="/ mo" sub="500 credits / month" items={['All Starter-tier agents', '+500 credit top-ups ($9 each)', 'Stripe-native invoices']} cta="Preview Starter" ctaClass="btn-green" featured />
              <PricingCard name="Growth" price="$199" period="/ mo" sub="2,500 credits / month" items={['Every agent in the suite', 'Credit rollover (500 / mo)', 'Team seats (Phase 2)']} cta="Preview Growth" ctaClass="btn-line" />
            </div>
            <p className="text-center text-[.84rem] text-ink-400 mt-6 reveal">Standard top-up pack: +500 credits for $9.</p>
          </div>
        </section>

        {/* CTA BAND */}
        <section className="bg-white pb-20 md:pb-24">
          <div className="wrap">
            <div className="reveal relative overflow-hidden rounded-3xl bg-ink-950 text-white text-center px-6 py-16 md:py-20">
              <div className="blob" style={{ width: '24rem', height: '24rem', background: '#10a868', top: '-10rem', left: '50%', marginLeft: '-12rem', opacity: 0.4 }} />
              <div className="relative">
                <h2 className="h2 balance max-w-2xl mx-auto">You build the agent. We handle the rest.</h2>
                <p className="lead mt-4 max-w-xl mx-auto" style={{ color: '#c2d2cb' }}>Two SDK calls, three configuration steps, and your agent inherits a complete payment lifecycle — with money landing in your bank.</p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Link href="/build/signup" className="btn btn-green">Start building - it's free</Link>
                  <a href="#how" className="btn btn-white">See how it works</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-ink-50 border-t border-ink-100">
          <div className="wrap py-20 md:py-24">
            <div className="grid md:grid-cols-12 gap-x-12 gap-y-8 items-start">
              <div className="md:col-span-4 reveal md:sticky md:top-24">
                <div className="eyebrow">FAQ</div>
                <h2 className="h2 balance mt-4">Answers before you ask.</h2>
                <p className="lead mt-4">Still unsure? <a href="mailto:hello@agentmint.com" className="text-brand-600 font-semibold underline underline-offset-4">Email the team.</a></p>
              </div>
              <div className="md:col-span-8 reveal space-y-3">
                {FAQ.map((f, i) => (
                  <details key={i} className="card p-5 group">
                    <summary className="flex items-center justify-between gap-6 cursor-pointer list-none">
                      <span className="font-bold">{f.q}</span>
                      <span className="text-ink-400 text-2xl leading-none shrink-0 transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 text-[.92rem] text-ink-600 leading-relaxed">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-ink-950 text-ink-300">
        <div className="wrap py-14 grid md:grid-cols-4 gap-10 text-[.9rem]">
          <div className="md:col-span-2">
            <a href="#top" className="flex items-center gap-2.5 font-extrabold text-white text-[1.05rem]">
              <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden>
                <rect x="2" y="2" width="24" height="24" rx="7" fill="#10a868" />
                <circle cx="14" cy="14" r="6" stroke="#fff" strokeWidth="1.9" fill="none" />
                <path d="M14 10.2v7.6M11.6 12.6h4.8M11.6 15.4h4.8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Agent<span className="text-brand-400">Mint</span>
            </a>
            <p className="mt-4 max-w-sm leading-relaxed text-ink-400">The payments, credits and subscriptions stack for AI agents. Monetize all your agents from one place.</p>
            <p className="mt-4 text-ink-500 text-[.8rem]">© 2026 AgentMint. All rights reserved.</p>
          </div>
          <div>
            <div className="text-[.72rem] uppercase tracking-[.14em] text-ink-500 font-semibold">Product</div>
            <ul className="mt-4 space-y-2.5">
              <li><a href="#stack" className="hover:text-white">Any stack</a></li>
              <li><a href="#how" className="hover:text-white">How it works</a></li>
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              <li><a href="#faq" className="hover:text-white">FAQ</a></li>
            </ul>
          </div>
          <div>
            <div className="text-[.72rem] uppercase tracking-[.14em] text-ink-500 font-semibold">Contact</div>
            <ul className="mt-4 space-y-2.5">
              <li><a href="mailto:hello@agentmint.com" className="hover:text-white">hello@agentmint.com</a></li>
              <li><Link href="/login" className="hover:text-white">Sign in</Link></li>
              <li><Link href="/build/signup" className="hover:text-white">Start building</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Subcomponents                                            */
/* ────────────────────────────────────────────────────────── */

function CountUp({ to, suffix = '', decimals = 0, label, border = false }: { to: number; suffix?: string; decimals?: number; label: string; border?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [val, setVal] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setVal(to); return; }
    if (!ref.current) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const t0 = performance.now();
          const dur = 1500;
          const tick = (t: number) => {
            const p = Math.min((t - t0) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(to * eased);
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [to]);

  const formatted = decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString('en-US');

  return (
    <div ref={ref} className={`text-center ${border ? 'md:border-r border-ink-800' : ''}`}>
      <div className="h2 text-brand-300 tnum">{formatted}{suffix}</div>
      <div className="mt-2 text-[.86rem] text-ink-300 font-medium">{label}</div>
    </div>
  );
}

function StepCard({ num, title, desc, iconPath }: { num: string; title: string; desc: string; iconPath: string }) {
  return (
    <div className="reveal card p-6 flex gap-4 items-start">
      <span className="shrink-0 w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d={iconPath} />
        </svg>
      </span>
      <div>
        <div className="font-bold text-[1.05rem]">{num} · {title}</div>
        <p className="mt-1 text-[.92rem] text-ink-600 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function CodeBlock() {
  const [copied, setCopied] = useState(false);
  const code = `const auth = await agentmint.authorize({
  workspaceId, product: 'your_agent', action: 'do_thing', cost: 25,
});
if (!auth.allowed) return Response.json(auth, { status: 402 });

// whatever your agent actually does
const result = await runYourAgent(req.body);

await agentmint.debit({
  workspaceId, product: 'your_agent', action: 'do_thing', cost: 25,
  resourceId: result.id,
  idempotencyKey: \`\${workspaceId}-\${result.id}\`,
});`;

  return (
    <div className="reveal rounded-2xl overflow-hidden border border-ink-800 self-stretch" style={{ background: '#06221a' }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-ink-800 text-ink-300 text-[.78rem] mono">
        <span className="flex items-center gap-2">
          <span className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-ink-700" />
            <span className="w-2.5 h-2.5 rounded-full bg-ink-700" />
          </span>
          <span className="ml-2">route.ts</span>
        </span>
        <button
          onClick={async () => {
            try { await navigator.clipboard.writeText(code); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch {}
          }}
          className="hover:text-white transition-colors flex items-center gap-1.5"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="px-5 py-5 text-[12.5px] md:text-[13px] leading-[1.8] overflow-x-auto" style={{ color: '#c2d2cb' }}>
<span style={{ color: '#5cd49d' }}>const</span>{` auth = `}<span style={{ color: '#5cd49d' }}>await</span>{` agentmint.authorize({
  workspaceId, product: `}<span style={{ color: '#ffce9e' }}>{`'your_agent'`}</span>{`, action: `}<span style={{ color: '#ffce9e' }}>{`'do_thing'`}</span>{`, cost: `}<span style={{ color: '#ff8a5c' }}>25</span>{`,
});
`}<span style={{ color: '#5cd49d' }}>if</span>{` (!auth.allowed) `}<span style={{ color: '#5cd49d' }}>return</span>{` Response.json(auth, { status: `}<span style={{ color: '#ff8a5c' }}>402</span>{` });

`}<span style={{ color: '#618376' }}>{`// whatever your agent actually does`}</span>{`
`}<span style={{ color: '#5cd49d' }}>const</span>{` result = `}<span style={{ color: '#5cd49d' }}>await</span>{` runYourAgent(req.body);

`}<span style={{ color: '#5cd49d' }}>await</span>{` agentmint.debit({
  workspaceId, product: `}<span style={{ color: '#ffce9e' }}>{`'your_agent'`}</span>{`, action: `}<span style={{ color: '#ffce9e' }}>{`'do_thing'`}</span>{`, cost: `}<span style={{ color: '#ff8a5c' }}>25</span>{`,
  resourceId: result.id,
  idempotencyKey: `}<span style={{ color: '#ffce9e' }}>{'`${workspaceId}-${result.id}`'}</span>{`,
});`}
      </pre>
    </div>
  );
}

function SmallStat({ label, value, tnum = false }: { label: string; value: string; tnum?: boolean }) {
  return (
    <div className="rounded-xl bg-ink-50 border border-ink-100 p-3">
      <div className="text-[.72rem] text-ink-500">{label}</div>
      <div className={`font-bold mt-1 text-[.9rem] ${tnum ? 'tnum' : ''}`}>{value}</div>
    </div>
  );
}

function FunnelBar({ event, value, width, coral = false }: { event: string; value: number; width: number; coral?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="mono text-[.78rem] w-32 shrink-0 text-ink-600">{event}</span>
      <div className="flex-1 h-7 rounded-lg bg-ink-100 overflow-hidden">
        <div
          className={`h-full rounded-lg ${coral ? 'bg-coral-500' : 'bg-brand-500'} flex items-center justify-end pr-2 text-white text-[.72rem] font-bold`}
          style={{ width: `${width}%` }}
        >
          {value.toLocaleString('en-US')}
        </div>
      </div>
    </div>
  );
}

function PricingCard({
  name, price, period, sub, items, cta, ctaClass, featured = false,
}: {
  name: string; price: string; period: string; sub: string;
  items: string[]; cta: string; ctaClass: string; featured?: boolean;
}) {
  return (
    <div
      className={`reveal card p-7 flex flex-col relative ${featured ? 'md:-mt-4 md:mb-[-1rem]' : ''}`}
      style={featured ? { border: '2px solid #10a868', boxShadow: '0 30px 60px -28px rgba(16,168,104,.45)' } : undefined}
    >
      {featured && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 chip !bg-brand-500 !text-white !border-brand-500 !text-[.72rem] font-bold tracking-wide">
          MOST POPULAR
        </div>
      )}
      <div className={`font-bold text-ink-600 ${featured ? 'mt-1' : ''}`}>{name}</div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-[2.6rem] leading-none font-extrabold tnum">{price}</span>
        {period && <span className="text-ink-400 font-medium">{period}</span>}
      </div>
      <div className="mt-2 text-[.88rem] text-ink-500 font-medium">{sub}</div>
      <ul className="mt-6 space-y-2.5 text-[.92rem] text-ink-700 flex-1 font-medium">
        {items.map((it) => <li key={it} className="flex gap-2.5">{CHECK_ICON} {it}</li>)}
      </ul>
      <Link href="/login" className={`btn ${ctaClass} mt-7 w-full justify-center`}>{cta}</Link>
    </div>
  );
}
