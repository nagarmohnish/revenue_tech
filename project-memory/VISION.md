# Product vision

The single doc that frames what AgentMint *is* — not just the billing platform, but the broader product family it points toward.

> **Keep this current.** Per the user: "keep updating the memory doc after each major addition in overall vision plan."

---

## What AgentMint is (one sentence)

> AgentMint is a suite of **AI-powered automated agents** that improve a company's revenue and retention by optimizing every meaningful surface of its subscription / payments / monetization stack.

Each agent in the suite targets *one specific revenue-leak or upside-leverage point*. They share a billing primitive, a credit wallet, and one dashboard.

## What we believe

1. **Revenue and retention are the actual problems.** Everything else (pricing pages, checkout funnels, dunning flows, upgrade campaigns) is a means to that end.
2. **Most companies leak revenue across many points simultaneously**: pricing-page conversion, cart abandonment, free-to-paid conversion, churn-saves, dunning, upgrade timing. Each leak is small. The aggregate is enormous.
3. **AI agents are the right shape for these problems** because each leak point has a small, well-defined set of inputs and outputs, but a long tail of personalization that traditional rules-based tooling does badly.
4. **One platform with many agents** beats many separate point tools because the agents share signal (customer usage, payment history, plan state, cohort behavior) and the merchant integrates once.

This is the same logic Recurly demonstrates with **Subscriptions + Commerce + RevRec** as modular layers on one platform; the same logic Stripe demonstrates with **Billing + Tax + Atlas + Radar + Identity** — but oriented around AI-driven *agents* doing the work, not just SDKs the merchant integrates.

---

## The agent suite

The suite is the product. Each agent is a sub-product with its own dashboard surface, its own pricing if needed, and its own integration story. We ship them in priority order.

### Built / shipping

| Agent | What it does | Surface |
|---|---|---|
| **Monetization Agent** | Credits + plan gating + invoicing for any AI agent. Two HTTP calls per agent. | `/build/*` + `/dashboard` + SDKs |
| **Free Pricing Audit** | Domain → competitive read + branded PDF in 15s. Lead magnet that funnels into the deeper roadmap. | `/audit` |
| **Deep Monetization Roadmap** | For companies with multiple agents and existing clients — comprehensive integration plan + onboarding checklist. | `/roadmap` |
| **Concierge intake** | 5-minute form → personalized Monetization Plan via Claude. | `/apply` |
| **StackScore** | Walks a real browser through any checkout funnel, scores it, ranks against benchmarks. Free, no signup. | `/stackscore` |

### Next priority (build queue)

| Agent | What it does | Why it matters | Build effort |
|---|---|---|---|
| **Cart Recovery Agent** | Detects abandoned checkouts (via embedded widget / webhook), triggers personalized retention sequences (email/SMS/in-app) timed to user behavior. AI-written messages, not template ones. | Recovered revenue is pure margin. Most SaaS lose 60-70% of starts. | M (2-3 weeks) |
| **Upgrade Campaign Agent** | Drops smart embeddable CTAs/widgets into the merchant's frontend that convert free → paid, Plus → Pro. Triggers off usage thresholds + behavior signals, AI-written copy per user cohort, auto A/B tests. | The "Plus → Pro" framing the user called out explicitly. | M (2-3 weeks) |
| **Churn Save Agent** | When a customer hits cancel, agent decides between pause / downgrade / discount / nothing based on usage + LTV + win-back propensity. Replaces one-size-fits-all retention offers. | Save the right customers, don't discount the leaving ones. | M (2-3 weeks) |
| **Failed Payment Recovery Agent** | Smart dunning: retry timing based on issuer + region + card type, AI-written update prompts, optimal payment-method-update funnels. | 1-2% of MRR sits in failed-card recovery. | S (1-2 weeks) |
| **Annual Conversion Agent** | Times monthly → annual offers around engagement peaks. Predicts discount minimum needed. | High-leverage. Annual lifts retention and cash flow. | S (1-2 weeks) |

### Speculative / brainstorm

| Agent | What it does |
|---|---|
| **Discount/Coupon Agent** | Context-aware discount issuance — right person, right time, right amount, margin-preserving |
| **Onboarding Funnel Agent** | Drives time-to-first-value via personalized in-app walkthroughs |
| **Referral Agent** | Identifies happy customers (NPS proxies), generates referral incentives |
| **Win-back Agent** | Re-engages churned customers with timed re-activation campaigns |
| **Pricing Optimizer Agent** | Analyzes per-customer usage, recommends tier moves up or down |
| **Localization Agent** | Auto-detects geography, presents localized pricing + payment methods + tax |
| **Bundle Recommender Agent** | Recommends add-ons or bundles based on usage patterns |
| **Free-Trial Conversion Agent** | Usage-aware trial extension/conversion prompts |
| **Tax Compliance Agent** | Auto-handles GST/VAT/sales-tax per jurisdiction (parallel to Recurly RevRec) |
| **Payment-Method Optimizer Agent** | Per market, recommends + surfaces the right payment methods for max conversion |

---

## Architecture principles for the suite

1. **One credit wallet across all agents** for the merchant's *end customer*. They top up once; every agent in the suite draws from the same balance. This is the AgentMint primitive.
2. **One dashboard surface for the merchant**. Each agent has its own card / widget / view but they share a chrome.
3. **One integration**. The merchant connects Stripe (or Razorpay) once, drops one JS snippet into their frontend, gets all the agents.
4. **Each agent is a Claude-powered worker** with deterministic guardrails. AI for the personalization layer; rules for the math, the money movement, the eligibility logic.
5. **Each agent ships standalone** — they can be enabled independently. No big-bang integration.

---

## Competitive reference points

We've studied these to understand the integration patterns of the category. Notes from research live in `sessions/`. Headline takeaways:

### Recurly

Six integration methods: REST API, Webhooks, Recurly.js (PCI-A compliant payment forms), Hosted Pages, Mobile SDKs, App Management Connector.

The modular product family is the template — **Recurly Subscriptions** (billing core) + **Recurly Commerce** (storefront, portal, dunning, analytics) + **Recurly RevRec** (revenue recognition, ASC 606 / IFRS 15). Each is a separate purchase that composes onto the same platform.

The integration story is "pick the level you want to commit to": Hosted Pages (no code), Recurly.js (some code, PCI-light), API + Webhooks (full integration). We will mirror this gradient.

### Stripe

Stripe's playbook is "one Stripe account, many products" — Billing, Tax, Connect, Radar, Identity, Atlas, Issuing. Each solves one part of the money lifecycle. Each integrates with the same Stripe primitive (Customer, Payment Method, Subscription).

What we steal: **the modular product model**. What we *don't* steal: building everything ourselves before we have signal that customers want any one piece beyond the Monetization Agent.

### Razorpay

CLI-first developer experience (`curl | bash`). Key-pair auth with test-mode prefix (`rzp_test_`). One interactive `razorpay configure` command.

What we steal: a real CLI (`agentmint configure`, `agentmint workspaces create`, etc.) once we have ≥3 paying customers asking for it. Not before. Currently the dashboard does the same things with less friction for non-CLI users.

---

## Roadmap sequencing (current view)

Phase 1 (now): the four shipping tools above prove the wedge — "AI agents that improve specific revenue/retention surfaces."

Phase 2: ship Cart Recovery + Upgrade Campaign agents. These are the two leak points the user explicitly named, and they're the highest-leverage early wins because they each touch existing customer revenue (vs. acquiring new customers).

Phase 3: Churn Save + Failed Payment Recovery + Annual Conversion. By this point we have one consistent merchant dashboard primitive and we're adding agent cards into it.

Phase 4 (only if signal): the speculative list. Pick the next agent based on which leak is biggest among existing customers.

---

## What's deliberately out of scope

- **Building a metering pipeline at Flexprice / Orb / Metronome scale.** Different problem.
- **Replacing Stripe / Razorpay.** We sit on top of them. They are payment rails. AgentMint is the optimization layer above.
- **Building a CRM, ESP, customer-success platform.** We integrate with these (HubSpot, Customer.io, Intercom). We don't reinvent them.
- **General-purpose AI agents.** We are *specifically* about revenue and subscription optimization. Don't drift.
