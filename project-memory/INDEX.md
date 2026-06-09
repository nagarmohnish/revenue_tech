# Index

Living map of every shipped feature. Updated whenever a feature ships.

## AgentMint — the billing platform

| Surface | URL (dev) | Code |
|---|---|---|
| Marketing landing | `/` | [`app/page.tsx`](../app/page.tsx) |
| Static mirror (gh-pages) | https://nagarmohnish.github.io/revenue_tech/ | [`design/landing.html`](../design/landing.html) |
| Customer dashboard | `/dashboard` | [`app/dashboard/`](../app/dashboard/) |
| Builder console | `/build/*` | [`app/build/`](../app/build/) |
| Demo agents | `/agents/{scanner,blog-writer,content-studio}` | [`app/agents/`](../app/agents/) |
| Billing portal | `/billing/*` | [`app/billing/`](../app/billing/) |
| Admin | `/admin` | [`app/admin/`](../app/admin/) |

| Concern | Code |
|---|---|
| Auth (customer) | [`lib/auth.ts`](../lib/auth.ts) |
| Auth (builder) | [`lib/builderAuth.ts`](../lib/builderAuth.ts) |
| API key resolver | [`lib/apiKeyAuth.ts`](../lib/apiKeyAuth.ts) |
| Billing core | [`lib/billing.ts`](../lib/billing.ts), [`lib/plans.ts`](../lib/plans.ts) |
| Anthropic client | [`lib/anthropic.ts`](../lib/anthropic.ts) |
| Stripe client | [`lib/stripe.ts`](../lib/stripe.ts) |
| Supabase admin client | [`lib/supabase.ts`](../lib/supabase.ts) |

### Public API contract

| Endpoint | Purpose |
|---|---|
| `POST /api/v1/authorize` | Plan gate + balance check. Returns enriched 402 on denial. |
| `POST /api/v1/debit` | Atomic credit deduction. Idempotent by `resource_id`. |
| `POST /api/v1/workspaces` | Builder API: create end-customer workspace. |
| `GET /api/v1/wallet` | Current balance + plan. |
| `POST /api/v1/checkout/{subscribe,topup}` | Stripe Checkout sessions. |
| `POST /api/v1/webhooks/stripe` | Stripe webhook → subscription/invoice/checkout events. |

### Database migrations

| Migration | What |
|---|---|
| [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql) | Users, workspaces, wallets, transactions, usage_events, subscriptions, tool_registry, atomic_debit() RPC. |
| [`supabase/migrations/0002_agency_multi_tenant.sql`](../supabase/migrations/0002_agency_multi_tenant.sql) | Tenants, tenant_users, tenant_api_keys, tenant_plan_configs. |
| [`supabase/migrations/0003_stackscore.sql`](../supabase/migrations/0003_stackscore.sql) | StackScore reports. |
| [`supabase/migrations/0004_applications.sql`](../supabase/migrations/0004_applications.sql) | Concierge intake form submissions. |
| [`supabase/migrations/0005_application_plan.sql`](../supabase/migrations/0005_application_plan.sql) | Monetization plan storage on applications. |
| [`supabase/migrations/0006_audits.sql`](../supabase/migrations/0006_audits.sql) | Pricing audit reports (Tool 1). |
| [`supabase/migrations/0007_roadmaps.sql`](../supabase/migrations/0007_roadmaps.sql) | Deep monetization roadmap intake (Tool 2). |

## StackScore — funnel walker

| Surface | URL (dev) | Code |
|---|---|---|
| Landing + URL input | `/stackscore` | [`app/stackscore/page.tsx`](../app/stackscore/page.tsx) |
| Shareable report | `/stackscore/r/[id]` | [`app/stackscore/r/[id]/page.tsx`](../app/stackscore/r/[id]/page.tsx) |
| Analyze API | `POST /api/stackscore/analyze` | [`app/api/stackscore/analyze/route.ts`](../app/api/stackscore/analyze/route.ts) |
| Flow scorer | — | [`lib/stackscore/flowScorer.ts`](../lib/stackscore/flowScorer.ts) |
| Worker (Playwright) | `:8080` local · Fly.io in prod | [`worker/`](../worker/) |

## Concierge intake (`/apply`)

| Surface | URL (dev) | Code |
|---|---|---|
| Multi-section intake form | `/apply` | [`app/apply/page.tsx`](../app/apply/page.tsx) |
| Personalized Monetization Plan | `/apply/thanks/[id]` | [`app/apply/thanks/[id]/page.tsx`](../app/apply/thanks/[id]/page.tsx) |
| Submit API | `POST /api/apply` | [`app/api/apply/route.ts`](../app/api/apply/route.ts) |
| Plan generator (Claude + template fallback) | — | [`lib/applications/generatePlan.ts`](../lib/applications/generatePlan.ts) |
| Deterministic revenue projections | — | [`lib/applications/projections.ts`](../lib/applications/projections.ts) |

## Pricing Audit — Tool 1 (free)

| Surface | URL (dev) | Code |
|---|---|---|
| Domain entry | `/audit` | [`app/audit/page.tsx`](../app/audit/page.tsx) |
| Branded report | `/audit/r/[id]` | [`app/audit/r/[id]/page.tsx`](../app/audit/r/[id]/page.tsx) |
| Print layout (PDF source) | `/audit/r/[id]/print` | [`app/audit/r/[id]/print/page.tsx`](../app/audit/r/[id]/print/page.tsx) |
| PDF download | `/api/audit/[id]/pdf` | [`app/api/audit/[id]/pdf/route.ts`](../app/api/audit/[id]/pdf/route.ts) |
| Analyze API | `POST /api/audit` | [`app/api/audit/route.ts`](../app/api/audit/route.ts) |
| Lib | — | [`lib/audit/`](../lib/audit/) |

## Deep Roadmap — Tool 2 (qualified)

| Surface | URL (dev) | Code |
|---|---|---|
| Multi-section intake | `/roadmap` | [`app/roadmap/page.tsx`](../app/roadmap/page.tsx) |
| Acknowledgment | `/roadmap/thanks/[id]` | [`app/roadmap/thanks/[id]/page.tsx`](../app/roadmap/thanks/[id]/page.tsx) |
| Submit API | `POST /api/roadmap` | [`app/api/roadmap/route.ts`](../app/api/roadmap/route.ts) |
| Lib | — | [`lib/roadmap/`](../lib/roadmap/) |

## SDKs

| Lang | Package | Path |
|---|---|---|
| TypeScript | `@agentmint/sdk` | [`sdks/js/`](../sdks/js/) |
| Python | `agentmint` (PyPI) | [`sdks/python/`](../sdks/python/) |
| Go | `github.com/nagarmohnish/agentmint-go` | [`sdks/go/`](../sdks/go/) |

## External services

| Service | Where it's used | Env var |
|---|---|---|
| Supabase | DB + auth | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Stripe | Checkout + webhooks | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_*_PRICE_ID` |
| Anthropic | Plan/audit/roadmap analysis | `ANTHROPIC_API_KEY` |
| Sparrwo | Real scanner agent backend | `SPARRWO_API_KEY`, `SPARRWO_API_URL` |
| Resend | Email notifications | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `APPLICATIONS_INBOX` |
| PostHog | Analytics | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` |
| Fly.io | Playwright worker host | (CLI auth) |
| GitHub Pages | Static marketing mirror | (CI auth via `gh`) |
