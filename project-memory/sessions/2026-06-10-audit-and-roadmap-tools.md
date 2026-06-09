# 2026-06-10 · Audit + Roadmap tools + project-memory system

## Goal

Two new tools and a memory system. Direct quote from the user:

> create 2 demos
> 1. user enter domain. study the pricing and business model
> 2. compare with market and competitors
> 3. create a crisp 2-4 pager pdf with company branding and colors
> 4. provide as free.
>
> then for indepth analysis of how to optimize pricing on an ai agentic level
>
> 2. user enters website url, details of agents(from extra documentation provided by user), pricing (for website url and extra info provided), how they are being charged, bank details, accounts etc. what ai tools and integrations are being used.
>
> 3. we study. analyze and create a possible roadmap of how to build an automated agentic subscription/revenue pipeline via which each agent is easily integrated and starts monetizing in minimal time. finalize what exact details in terms of tech - sdks, apis, access to creds would be required to build such a tool (also separately create a doc with execution/onboarding checklist which mentions the details that would be required)

And:

> now also update and create a folder. which is sort of a repo of all the chnages that we do. it keeps on updated on date, time and change basis. it will act as a memory for this project. it should contain all the important details, references to other files in the repo, urls, and other things.

## Target customer (clarified)

> this product is targeting a company which is
> - building ai agents solutions and directly selling them
> - already has clients for different services and then creating multiple agents to solve those problems. charging and monetizing is the issue

## Decisions

- **PDF generation**: route the `print` layout through the existing Playwright worker (new `POST /pdf` endpoint) rather than adding `@react-pdf/renderer`. One less dependency; worker is already running.
- **Tool 1 (Audit)** is built end-to-end this session — landing, scraper, Claude analysis, web report, PDF.
- **Tool 2 (Roadmap)** is built up to the form + storage layer this session. The analysis pipeline (multi-agent reasoning over uploaded docs → roadmap + checklist) is scoped for the next session and listed in `ROADMAP.md`. This is honest pacing — Tool 2 is meaningfully bigger and shouldn't be rushed.
- **Audit branding**: Tool 1 PDF uses AgentMint's brand colors in this iteration. Per-domain color extraction (favicon → theme-color → palette heuristic) is listed in `ROADMAP.md` for next iteration.
- **Memory system**: started this session because it'll only grow more useful. Backfilled `CHANGELOG.md` with the major moments from this conversation so future-you isn't reading git log to reconstruct history.

## Shipped

### project-memory/
- `README.md` — explains the system, when to update.
- `INDEX.md` — living map of every shipped feature → file → URL.
- `CHANGELOG.md` — backfilled with the major moments from this conversation.
- `ROADMAP.md` — next iteration, deferred, deliberate non-goals.
- `ARCHITECTURE.md` — stack, deployment topology, multi-tenancy, worker.
- `sessions/2026-06-10-audit-and-roadmap-tools.md` — this file.

### Pricing Audit (Tool 1)
- `app/audit/page.tsx` — single-field domain entry + recent audits.
- `app/audit/r/[id]/page.tsx` — branded web report with score, business-model breakdown, competitive comparison, recommendations.
- `app/audit/r/[id]/print/page.tsx` — print-friendly layout for PDF rendering.
- `app/api/audit/route.ts` — POST endpoint that scrapes the domain, calls Claude, saves the audit.
- `app/api/audit/[id]/pdf/route.ts` — GET endpoint that asks the worker to PDF the print layout.
- `lib/audit/types.ts`, `scrape.ts`, `analyze.ts`, `store.ts`.
- `supabase/migrations/0006_audits.sql` — `pricing_audits` table.

### Deep Roadmap (Tool 2)
- `app/roadmap/page.tsx` — multi-section intake form (URL + agents + pricing + integrations + sensitive-creds-checklist).
- `app/roadmap/thanks/[id]/page.tsx` — acknowledgment with next-steps.
- `app/api/roadmap/route.ts` — POST endpoint, zod-validated, saves to DB.
- `lib/roadmap/types.ts`, `validate.ts`, `store.ts`.
- `supabase/migrations/0007_roadmaps.sql` — `monetization_roadmaps` table.

### Worker
- `worker/src/index.ts` — added `POST /pdf` endpoint. Renders given URL via Playwright, returns PDF bytes.

### Landing
- Resources mega-menu in `app/page.tsx` updated to surface `/audit` and `/roadmap` alongside `/stackscore` and `/apply`.

## Open / deferred

- Tool 2 deep-analysis pipeline (see `ROADMAP.md`).
- Per-domain branding extraction for Tool 1 PDF.
- Provision-sandbox-on-`/apply` button.
- `/admin/audits` and `/admin/roadmaps` review surfaces.
- Migration application — user runs `0006_audits.sql` and `0007_roadmaps.sql` in Supabase SQL editor.

## References

- Live dev: http://localhost:3000
- GitHub repo: https://github.com/nagarmohnish/revenue_tech
- GitHub Pages mirror: https://nagarmohnish.github.io/revenue_tech/
- Earlier session: see `CHANGELOG.md` 2026-06-10 entries for `/apply` (concierge intake + Monetization Plan).
