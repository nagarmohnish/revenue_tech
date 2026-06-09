# Roadmap

What we plan to build, what we deferred, what we've ruled out.

---

## Next iteration (immediate)

### Design system rollout — Phase 2

Phase 1 (2026-06-10) shipped `components/ui/` primitives + 3 modernized shells + refactored `/build`, `/dashboard`, `/login`, `/build/signup`, `/admin`. Phase 2 refactors the remaining product screens to consume the same primitives:

- **Builder console** — `/build/agents`, `/build/api-keys`, `/build/integration`, `/build/plans`, `/build/revenue`, `/build/stripe`, `/build/login`.
- **Customer surface** — `/agents/scanner`, `/agents/blog-writer`, `/agents/content-studio`, `/agents/locked`.
- **Billing portal** — `/billing`, `/billing/upgrade`, `/billing/topup`, `/billing/success`.

Each refactor follows the same recipe: wrap with the right Shell, use `PageHeader` + `SectionHeader`, swap `.card`/`.btn` for `Card`/`Button`, swap `.field` inputs for `Field` + `Input`/`Textarea`/`Select`. Logic stays the same; only chrome changes.



### Deep Roadmap (Tool 2) — analysis pipeline

The form ships in this iteration; the analysis pipeline is the obvious next step. Spec:

- File upload handling (PDF, DOCX, TXT, MD) → text extraction → embed in Claude prompt.
- Multi-agent analyzer: Claude reasons over inputs and produces a structured `MonetizationRoadmap` — integration plan per agent, sequencing, tech stack required (SDKs + APIs + creds), risk callouts.
- Separately generated `OnboardingChecklist` doc.
- Both delivered as web report + PDF.

Files we'll touch: `lib/roadmap/analyze.ts` (new), `lib/roadmap/types.ts` (extend with `MonetizationRoadmap` + `OnboardingChecklist`), `app/roadmap/r/[id]/page.tsx` (rebuild), `app/roadmap/r/[id]/checklist/page.tsx` (new).

### Pricing Audit — PDF branding extraction

Today's audit PDF uses AgentMint's default brand. Next: extract the *audited domain's* primary color and logo from the scraped homepage so the PDF actually feels like *their* report.

Files we'll touch: `lib/audit/brand.ts` (new — favicon + theme-color + heuristic color extraction), `app/audit/r/[id]/print/page.tsx` (consume brand colors via CSS vars).

### Provision sandbox button on `/apply/thanks/[id]`

Real magic moment: the visitor hits "Provision my sandbox" on their Monetization Plan and we auto-create a tenant + workspace + API key for them. Pre-populates the agent in the registry with the action/cost from their plan.

Files: `app/api/apply/[id]/provision/route.ts` (new), update Plan page CTA.

---

## Soon-ish

- **`/admin/applications`** — kanban for the application pipeline (`new → contacted → scoping → building → live`). Drag to update status, click into details, add internal notes. Uses existing admin gate.
- **`/admin/audits`** — list of audits run, who ran them, what got generated.
- **GitHub Action: auto-deploy worker on Fly.io** — currently `fly deploy` is manual. Add `.github/workflows/deploy-worker.yml` so pushes to `main` touching `worker/**` ship automatically.
- **Tool 1 audit: scheduled re-runs** — once we know a domain, re-audit weekly and email the delta. Compounding insight.

---

## Deferred (good ideas, wrong moment)

- **Self-hosted alternative to Fly.io worker** — Render free tier, Koyeb free tier, or Cloudflare Tunnel. Decided against now because Fly.io's spending limit ($0 cap) lets us keep zero cost without the Render cold-start tax (~30-60s). Revisit if we hit Fly's CC requirement as a real friction.
- **PDF generation via @react-pdf/renderer** — considered. Decided against because we already have a Playwright worker; reusing it via a `/pdf` endpoint is one less dependency. Revisit if PDF generation becomes a hot path and we want to remove the worker round-trip.

---

## Ruled out (deliberate non-goals)

- **Building a metering pipeline like Flexprice / Orb / Metronome** — those are organized around the *product* with event ingestion at scale. AgentMint is organized around the *agent suite* with a shared wallet. Don't chase their feature surface (SOC 2, custom SQL metrics, on-prem, audit logs); the strategy memo says compete on the wedge instead.
- **x402 / autonomous agent payments** — different problem space. We sell to humans paying *for* agents. Don't confuse the narrative.
- **Self-serve white-label customer console** (`[client].agentmint.com`) — listed as "in build" on the landing because we'll do it eventually, but not until we have ≥3 studio customers who specifically need it.
