# Architecture

Cross-cutting picture of the whole project. Keep this current with structural decisions.

## Stack

| Layer | Tech |
|---|---|
| Web app | Next.js 14 (App Router) + React 18 + Tailwind 3 |
| DB + auth | Supabase Postgres (RLS on, service-role for admin paths) |
| AI | Anthropic Claude (Sonnet) — used for plan generation, audit analysis, roadmap analysis (planned), StackScore suggestions |
| Payments | Stripe Connect (USD primary); Razorpay / UPI / PayPal / Apple Pay planned |
| Background work | Playwright worker on Fly.io for funnel walks (StackScore) and PDF rendering (Audit Tool 1) |
| Email | Resend (best-effort, optional) |
| Analytics | PostHog (server-side events) |
| SDKs | `@agentmint/sdk` (TS), `agentmint` (Python), `agentmint-go` (Go) — three real packages |

## Deployment topology

```
              ┌────────────────────────────────┐
              │  Next.js (Vercel — planned)    │
              │  localhost:3000 in dev          │
              └─────┬──────────────────────────┘
                    │
        ┌───────────┼──────────────┬───────────────┐
        ▼           ▼              ▼               ▼
  Supabase     Anthropic      Stripe          Fly.io worker
  (Postgres)   (Claude API)   (Connect)       (Playwright)
                                                  │
                                                  ▼
                                              :8080
                                              /walk + /pdf + /health
```

GitHub Pages mirrors the marketing landing as a static HTML version at https://nagarmohnish.github.io/revenue_tech/ — separate `gh-pages` branch, no server.

## The "two consoles" mental model

`/build/*` is the **builder's** UI — the person who makes agents and wants to monetize them. They register agents, generate API keys, configure plans, watch revenue.

`/dashboard`, `/agents/*`, `/billing/*` is the **end-customer's** UI — *their* customers buying credits and using the agents.

Each has its own session cookie (`agentmint_builder_session` vs `agentmint_session`), its own auth flow, its own routes. The two never share state.

The public `/api/v1/*` is what the builder's *agent code* hits with a `Bearer am_live_...` API key. Internally, `/api/v1/authorize` and `/api/v1/debit` accept **both** session cookies AND API keys — so the same endpoints serve the customer console (cookie auth) and external agents (key auth).

## Multi-tenancy

The tenant layer was added in migration `0002`. Every billing row carries a `tenant_id` FK. Every API key resolves to one tenant. Every customer workspace belongs to one tenant. RLS is on, deny-by-default, service-role bypasses for admin paths.

The UI calls it "account" everywhere because "tenant" is jargon, but in the DB it's `tenants`.

## Tools layered on top

The core billing platform is one product. Three additional **tools** are bundled alongside as funnels into it:

1. **StackScore** (`/stackscore`) — free, public, no signup. Walks any funnel with a real browser, scores it. Drives traffic + signal of who's interested in payment funnels.
2. **Pricing Audit** (`/audit`) — free, public, no signup. Studies a domain's pricing + business model, generates a branded competitive PDF. Lower-friction lead magnet than the funnel walker.
3. **Concierge intake** (`/apply`) — free, requires form completion. Generates a personalized Monetization Plan in ~10s using Claude. Then we follow up.

Plus a fourth, qualified path:

4. **Deep Roadmap** (`/roadmap`) — for companies with multiple existing agents who want a comprehensive monetization architecture review. Multi-section intake with file uploads.

Each tool has its own Supabase table, its own scoring/analysis logic, its own report page. They're separable.

## Worker

The Playwright worker (in `worker/`) is the only non-Next.js piece. It exists because:

- StackScore needs a real browser to walk funnels.
- Audit Tool needs PDF generation, which Playwright does well by rendering a `/print` route to PDF.

Deployment: Fly.io free tier (1 small VM, 512MB, scale-to-zero). Cold start ~6-10s on first request. Local dev: `npm run dev` in `worker/` on port 8080.

Worker has one route per use case:

- `POST /walk` → walks a checkout funnel, returns step-by-step signals + screenshots.
- `POST /pdf` → renders a URL to PDF bytes.
- `GET /health` → readiness check.

All POST routes are gated by a shared `x-stackscore-secret` header (set on both worker + Next.js via env vars).

## Project memory

`project-memory/` (this folder) is the canonical record of what we've built and why. Update it when you ship. See [README.md](README.md).
