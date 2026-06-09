# External services

Names + paths to credentials. Never put credential *values* in this file.

## Hosting

| Service | What | Console |
|---|---|---|
| GitHub | Code + Pages | https://github.com/nagarmohnish/revenue_tech |
| GitHub Pages | Static landing mirror | https://nagarmohnish.github.io/revenue_tech/ |
| Vercel | Next.js deploy (planned) | — |
| Fly.io | Playwright worker (planned) | https://fly.io/dashboard |

## Data

| Service | What | Console | Env var(s) |
|---|---|---|---|
| Supabase | Postgres + auth | https://supabase.com/dashboard/project/xcszgeypiehclulltzoh | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |

## AI

| Service | What | Console | Env var(s) |
|---|---|---|---|
| Anthropic | Claude API (plan/audit/roadmap analysis, StackScore suggestions) | https://console.anthropic.com | `ANTHROPIC_API_KEY` |

## Payments

| Service | What | Env var(s) |
|---|---|---|
| Stripe | Checkout + webhooks + Connect (planned) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_STARTER_PRICE_ID`, `STRIPE_GROWTH_PRICE_ID`, `STRIPE_TOPUP_STANDARD_PRICE_ID` |

## Email + auth

| Service | What | Env var(s) |
|---|---|---|
| Resend | Transactional email | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `APPLICATIONS_INBOX` |
| Better Auth | Session library (in `lib/auth.ts`) | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |

## Demo agent backends

| Service | What | Env var(s) |
|---|---|---|
| Sparrwo | Real scanner agent for `/agents/scanner` | `SPARRWO_API_KEY`, `SPARRWO_API_URL` |

## Analytics

| Service | What | Env var(s) |
|---|---|---|
| PostHog | Funnel events | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` |
