# AgentMint

**One wallet for your whole AI-agent suite.**

AgentMint is the credits + plan-gating + billing-portal layer for AI agents, built for indie devs, startups and small studios shipping more than one agent. Your customer buys credits once and spends them across every agent you ship - writer, analyzer, scheduler, whatever comes next - with per-agent revenue attribution underneath. Integration is **two plain HTTP calls** (no SDK package yet) and one row per agent in a tool registry. Settlement runs through your own Stripe account (USD via Stripe Connect, INR via Razorpay/Cashfree on the immediate roadmap) so payouts land in your bank.

This is the MVP described in `docs/AgentMint_MVP_PRD.md`. It validates the bet:

> "Can multiple AI agents run under a single credit + subscription system, with full payment funnel visibility from trial to payment, on 3 real workspaces, without any per-agent billing code?"

> 📍 **Read `docs/STRATEGY.md` first** for the positioning, wedges and roadmap priorities distilled from `docs/AgentMint_Competitive_Analysis.docx`. The India-first wedge (INR + UPI + GST settlement) is the sharpest defensible play and is now a top-3 build priority.

## What's in the box

- **Landing page** at `/`, the full marketing surface (hero, what-it-is, plug-and-play onboarding, customers, pricing, funnel hooks, FAQ).
- **Auth** via signed-cookie session (swap-in-ready for Better Auth + Google OAuth via `lib/auth.ts`).
- **Workspace + wallet bootstrap.** Every new email gets a workspace, a wallet, and a 100-credit trial grant.
- **Tool registry.** All 6 agents seeded; 3 integrated (Scanner, Blog Writer, Content Studio), 3 plan-gated for Phase 1.
- **`/api/v1/authorize`** plan gate + balance check, returns the enriched 402 decision package.
- **`/api/v1/debit`** atomic Postgres function with advisory lock + idempotency on resource_id.
- **`/api/v1/wallet`**, **`/api/v1/tools`**, **`/api/v1/usage`**.
- **Stripe Checkout** at `/api/v1/checkout/subscribe` (Starter / Growth) and `/api/v1/checkout/topup` (+500 cr).
- **Stripe webhook** handles `customer.subscription.*`, `invoice.payment_succeeded`, `checkout.session.completed`, idempotent via `stripe_events`.
- **Dashboard** with wallet header, agents grid, recent activity.
- **Agent UIs** for Scanner, Blog Writer (real Claude when `ANTHROPIC_API_KEY` is set), Content Studio.
- **Billing portal** with current plan, transactions, top-up and upgrade entry points.
- **Admin** with workspace list including balance, plan, last active. Gated by `ADMIN_SECRET_KEY`.
- **PostHog** events: `trial_started`, `first_agent_used`, `checkout_started`, `payment_completed` (server-side).
- **Resend** welcome email on signup, low-credit email helper.

## Quickstart

```bash
npm install
cp .env.example .env.local
# fill in the keys you have (see below)
npm run dev
```

Open http://localhost:3000 (or 3030 if 3000 is taken).

The landing page renders without any keys. To reach the app:

### Minimum to sign in and see the dashboard
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Apply `supabase/migrations/0001_init.sql` in the Supabase SQL editor.

### To run integrated agents
- `ANTHROPIC_API_KEY` for Blog Writer + Content Studio. Without it, agents return placeholder output but still debit credits via the same authorize/debit flow.
- `SPARRWO_API_KEY` for Scanner. Without it, a deterministic synthetic scan result is returned.

### To enable Stripe Checkout
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `STRIPE_STARTER_PRICE_ID` ($49/mo recurring), `STRIPE_GROWTH_PRICE_ID` ($199/mo recurring), `STRIPE_TOPUP_STANDARD_PRICE_ID` ($9 one-time).
- Webhook endpoint: `POST /api/v1/webhooks/stripe`.

### To use the admin route
- `ADMIN_SECRET_KEY=<any-strong-secret>`. Provide it in the unlock form at `/admin`.

## Architecture map

The codebase has **two distinct surfaces**:

### 1. Builder console (`/build/*`) - the agent builder's view
This is what anyone building AI agents - solo dev, startup, or company - uses to manage their AgentMint account. They register their agents, generate API keys, configure plans, and watch revenue come in.

| Concern | Where |
|---|---|
| Builder signup | `app/build/signup/page.tsx`, `app/api/build/sign-up/route.ts` |
| Builder auth (session, slug rules, account provisioning) | `lib/builderAuth.ts` |
| Builder overview with onboarding checklist | `app/build/page.tsx` |
| Agent registry CRUD | `app/build/agents/page.tsx`, `app/api/build/agents/*` |
| API key management (hashed, shown once) | `app/build/api-keys/page.tsx`, `app/api/build/api-keys/*` |
| Integration docs with copy-paste samples (key + agents substituted live) | `app/build/integration/page.tsx` |
| Plans (read-only; editing lands w/ Stripe Connect) | `app/build/plans/page.tsx` |
| Stripe Connect status | `app/build/stripe/page.tsx` |
| Revenue + usage explorer | `app/build/revenue/page.tsx` |
| Sidebar shell | `components/BuilderShell.tsx` |
| Account-scoped data lookups | `lib/builder.ts` |

> Internally the account is stored as a `tenants` row - that's the DB term. The UI consistently says "account" so it reads naturally for indies, startups and companies alike.

### 2. Customer surface (`/dashboard`, `/agents/*`, `/billing/*`) - what the builder's users see
This is what the builder's *customers* see when they use AgentMint as the hosted workspace UI.

| Concern | Where |
|---|---|
| Marketing landing | `app/page.tsx` |
| End-customer auth (sign-in, session) | `app/login/page.tsx`, `app/api/auth/sign-in/route.ts`, `lib/auth.ts` |
| Billing core | `lib/billing.ts`, `lib/plans.ts`, `supabase/migrations/0001_init.sql` |
| authorize / debit (accepts **both** session cookie AND `Bearer am_live_...` API keys) | `app/api/v1/authorize/route.ts`, `app/api/v1/debit/route.ts` |
| API-key resolver | `lib/apiKeyAuth.ts` |
| Stripe (single-Stripe model — Stripe Connect lands next) | `app/api/v1/checkout/*/route.ts`, `app/api/v1/webhooks/stripe/route.ts` |
| Demo agent endpoints | `app/api/agents/*/route.ts`, `app/agents/*/page.tsx` |
| Billing portal | `app/billing/{page,upgrade,topup,success}.tsx` |
| Admin | `app/admin/page.tsx`, `app/api/v1/admin/workspaces/route.ts` |

### Schema

| Migration | What |
|---|---|
| `supabase/migrations/0001_init.sql` | Original MVP: `users`, `workspaces`, `wallets`, `wallet_transactions`, `usage_events`, `subscriptions`, `tool_registry`, `stripe_events`, `funnel_events`, `atomic_debit()`, `grant_credits()` |
| `supabase/migrations/0002_agency_multi_tenant.sql` | **The account layer.** Adds `tenants`, `tenant_users`, `tenant_api_keys`, `tenant_plan_configs`. Adds `tenant_id` FK to every billing table. Seeds a default `system` tenant and backfills existing rows. Adds `register_api_key()` and `resolve_api_key()` RPCs. (Filename keeps `agency` for migration ordering stability.) |

## Builder plug-and-play flow

```
1. Builder signs up at /build/signup
   → account + owner user + session cookie + default plan configs created

2. Builder opens /build/agents → registers their agents
   → rows inserted into tool_registry scoped by account (tenant_id)

3. Builder opens /build/api-keys → generates a key
   → key shown once, sha256 hash stored

4. Builder goes to /build/integration → copy-pastes SDK snippets
   → snippets are pre-substituted with their real key prefix + product_id + action_id

5. Builder creates customer workspaces via the API:
   POST /api/v1/workspaces  (Bearer am_live_xxx)
   → tenant resolved from key, workspace created + trial credits granted

6. Builder wires up their agent route:
   POST /api/v1/authorize
     Authorization: Bearer am_live_xxx
     { workspaceId, product, action, cost }
   → tenant resolved from key → workspace must belong to tenant → returns allow/deny

7. After the agent runs:
   POST /api/v1/debit (same auth + body + resourceId + idempotencyKey)
   → atomic debit + usage_event row, scoped to tenant
```

## Adding a new agent

Per the SDK contract, an integration is two SDK calls + one row in the tool registry.

```ts
// app/api/agents/your-agent/route.ts
import { runAgentCall } from '@/lib/agentRunner';

export async function POST(req: Request) {
  const out = await runAgentCall({
    product: 'your_agent',
    action:  'do_thing',
    cost:    25,
    run:     async () => ({ /* your result */ _meta: { model: '...' } }),
  });
  return Response.json(out.body, { status: out.ok ? 200 : out.status });
}
```

Add a registry row to `tool_registry` (see `supabase/migrations/0001_init.sql` for the seed pattern).

## Documents

- **`docs/STRATEGY.md`** - actionable positioning, wedges, anti-positioning, prioritized roadmap. Read this first.
- `docs/ARCHITECTURE.md` - how the pieces fit together, how to test, what's not built yet (priority-ordered).
- `docs/AgentMint_Competitive_Analysis.docx` - market, competitive set, opportunity sizing (May 2026). STRATEGY.md is the distillation.
- `docs/PILOT_SETUP.md` - step-by-step to onboard a real builder.
- `docs/AgentMint_Platform_PRD.md` - product, use cases, revenue model, business model.
- `docs/AgentMint_PRD.md` - full technical reference (data model, API, module specs).
- `docs/AgentMint_MVP_PRD.md` - the 2-week validation experiment.

## Design

The AgentMint visual design is canonical and lives in two synchronized places:

| File | Where it serves | Purpose |
|---|---|---|
| `app/page.tsx` | `http://localhost:3030/` | **Live React landing page** at the root URL. Uses dynamic data from `lib/plans.ts` (pricing tiers, top-up packs). This is what real visitors see. |
| `design/landing.html` and `public/landing.html` | `http://localhost:3030/landing.html` | **Static single-file mirror.** Self-contained HTML (Tailwind CDN, inline SVG icons, no JS deps). The design reference: openable in any browser, shareable as a single file, frozen against config drift. |

Both reflect **the same canonical design** for AgentMint: same palette (ink + accent + ok/warn/bad), same layout grid, same typography, same 14 sections (Nav, Hero with wallet preview, What AgentMint is, Problem strip, Who-it's-for, How it works, Plug & Play, Quote, Customers, Pricing, Revenue intelligence, FAQ, CTA, Footer). The dashboard, agent pages and billing portal use the same primitives (`.card`, `.btn-*`, `.tag`, Tailwind palette) so the design carries through the whole app.

If you change the design, change it in `design/landing.html` first (the design source), then port to `app/page.tsx` and copy to `public/landing.html`. Keep all three aligned.
