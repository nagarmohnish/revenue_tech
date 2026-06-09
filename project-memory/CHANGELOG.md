# Changelog

Reverse-chronological log of meaningful changes. Each entry:

- Date + headline
- One-line summary
- Files touched (representative; full diff in git)
- Link to a session note when one exists

---

## 2026-06-10 · Brand pivot — concept-9 dark + safety orange

User shipped a Claude Design handoff bundle (`concept-9.html.dc.html`) and asked us to use it as the primary design across all screens. Complete visual reset:

**Color** — Background `#101014` (near-black), accent `#FF7A1A` (safety orange), body text `#F2F2F0`. The old brand-green is fully replaced; `brand` tokens are aliased to safety orange so older screens continue rendering correctly.

**Type** — Display: `Archivo Black` (UPPERCASE, used for h1/h2). Body: `Archivo` (regular weight). Mono: `Martian Mono` (eyebrows, labels, code, numerics). Fonts pulled from Google Fonts.

**Surfaces** — Square corners everywhere (radius forced to 0 in tailwind config except `full` for pills). Thin orange-tinted borders (`rgba(255,122,26,0.14)` to `0.55`). Surfaces are dark (`#17171C`, `#15151A`). Glow shadows replace drop shadows.

**Components** — `tailwind.config.ts`, `globals.css`, and all of `components/ui/{buttons,cards,forms,layout}.tsx` rewritten. `BuilderShell`, `AppShell`, `AuthShell` rewritten for dark theme — sidebar/topbar use orange-tinted dividers, active items pulse orange.

**Landing** — `app/page.tsx` rebuilt to match concept-9 pixel-for-pixel: hero with `Archivo Black` `PEOPLE BUILD. WE MONETIZE.`, 4-up stat tiles in a 1px-orange grid, billing-mode segmented control, wallet & invoice mocks, three-up Why cards, audience tabs, console mock (3 tiles with the wallet/invoice/per-agent revenue), SDK code tabs with comment-tint, three pricing cards (middle is `MOST POPULAR` ribbon), FAQ with Q-marker pattern, CTA.

**WebGL** — Three.js scene ported verbatim: orange rails (Bezier-curve `TubeGeometry`) converging on a glowing junction sphere; mirrored reflection group flipped across the floor plane; atmospheric motes; `UnrealBloomPass` post-processing; shader-driven energy pulses on each rail. Loaded via Next.js `<Script>` from CDN.

**Smooth scroll** — Lenis library loaded from CDN; scroll velocity drives camera glide toward the junction (`camera.position.z` interpolates from 24 → 9 as you scroll to the bottom). Respects `prefers-reduced-motion`.

**gh-pages** — `concept-9.html.dc.html` + `support.js` published verbatim at https://nagarmohnish.github.io/revenue_tech/ for the static mirror (uses the Anthropic dc template engine).

---

## 2026-06-10 · Design system + product-surface refresh (Phase 1)

Shipped `components/ui/` — a real design system replacing the ad-hoc utility classes scattered through pages. Five themed files: `buttons.tsx`, `cards.tsx`, `forms.tsx`, `layout.tsx`, plus an `index.ts` re-export. Primitives: `Button`, `LinkButton`, `IconButton`, `Card`, `Stat`, `EmptyState`, `InfoBanner`, `Field`, `Input`, `Textarea`, `Select`, `InputGroup`, `RadioCardGrid`, `Toggle`, `Eyebrow`, `PageHeader`, `SectionHeader`, `Badge`, `Tabs`, `CodeBlock`, `Spinner`, `Kbd`.

Three shells modernized:
- `BuilderShell` — sticky top bar with account dropdown · collapsible sidebar with brand-accent active state · responsive mobile drawer.
- `AppShell` — sticky top bar with wallet balance pill + workspace dropdown · secondary underline-tab nav with mobile drawer.
- `AuthShell` (new) — two-column layout for login/signup pages.

Refactored screens (Phase 1 — highest-traffic): `/build`, `/dashboard`, `/login`, `/build/signup`, `/admin`. Each gets PageHeader + Eyebrow + Card primitives, consistent spacing, lucide icons throughout.

Remaining screens (Phase 2 — queued in ROADMAP.md): `/build/agents`, `/build/api-keys`, `/build/integration`, `/build/plans`, `/build/revenue`, `/build/stripe`, `/build/login`, `/agents/*` (4), `/billing/*` (4). They continue to render correctly with the existing globals.css `.card`/`.btn` utilities — they just don't yet use the new typed primitives.

---

## 2026-06-10 · Product vision reframe — "AI agents for revenue/retention optimization"

User-driven scope expansion: AgentMint isn't just billing for AI agents — it's a *suite* of AI-powered automated agents, each targeting a specific revenue/retention surface (cart recovery, upgrade campaigns, churn saves, failed-payment recovery, annual conversion, etc.). Memorialized in [VISION.md](VISION.md) with the agent suite enumerated, build sequencing, competitive reference points (Recurly, Stripe, Razorpay), and explicit non-goals.

- `project-memory/VISION.md` — new. Per the user: "keep updating the memory doc after each major addition in overall vision plan."
- Research notes from Recurly (Subscriptions / Commerce / RevRec) and Razorpay CLI synthesized into the Architecture Principles + Reference Points sections.

---

## 2026-06-10 · Pricing Audit (Tool 1) + Deep Roadmap (Tool 2) + project-memory system

**Two new tools, plus the project memory you're reading.** Tool 1: paste a domain, we study it, you get a free branded competitive-pricing audit (web report + PDF). Tool 2: a deep intake covering URL + uploaded docs + pricing + bank/account details + integrations, intended to produce an agentic monetization roadmap (analysis pipeline stubbed for the next iteration; form + storage live now).

- `project-memory/` — new folder (this one). README, INDEX, CHANGELOG, ROADMAP, ARCHITECTURE, session notes.
- `app/audit/` — new tool: form, report, print layout, PDF endpoint.
- `lib/audit/` — scraper, Claude analyzer, deterministic comparison, store.
- `supabase/migrations/0006_audits.sql` — `pricing_audits` table.
- `app/roadmap/` — new tool: multi-section intake form + acknowledgment.
- `lib/roadmap/` — types, store, validation.
- `supabase/migrations/0007_roadmaps.sql` — `monetization_roadmaps` table.
- `worker/src/index.ts` — added `/pdf` endpoint (URL → PDF bytes) for both tools.
- Landing nav: surfaced both tools in Resources mega-menu.

See [sessions/2026-06-10-audit-and-roadmap-tools.md](sessions/2026-06-10-audit-and-roadmap-tools.md).

---

## 2026-06-10 · Instant Monetization Plan on `/apply` submit

Replaced the static thank-you page with a real generated artifact. On submit, Claude reads the application and emits a structured Monetization Plan in ~10 seconds; deterministic revenue math runs on the tier prices Claude returned (never delegated to the LLM). Plan renders on a polished, shareable URL.

- `lib/applications/generatePlan.ts` — Claude prompt + JSON normalization.
- `lib/applications/templatePlan.ts` — deterministic fallback.
- `lib/applications/projections.ts` — MRR/ARR math.
- `lib/applications/planTypes.ts` — `MonetizationPlan` shape.
- `app/apply/thanks/[id]/page.tsx` — full rewrite (hero, recommended mode dark card, 3 tier cards, 3-scenario projections, integration with auto-language-detected code, recap, next actions).
- `app/apply/page.tsx` — loader rewritten with live progress steps.
- `supabase/migrations/0005_application_plan.sql` — added `plan jsonb`, `plan_status`, `plan_at`.

---

## 2026-06-10 · `/apply` concierge intake (the working-prototype path)

Built the concierge MVP — 4-section intake form, zod-validated, saved to `applications`. Notifies via Resend if configured (best-effort, never blocks). Landing hero CTA changed to "Tell us about your agent"; new "Two paths" section juxtaposes concierge vs self-serve.

- `app/apply/page.tsx`, `app/apply/thanks/[id]/page.tsx`
- `app/api/apply/route.ts`
- `lib/applications/` — types, validate (zod), store, notify
- `supabase/migrations/0004_applications.sql`
- `app/page.tsx` — hero CTAs + new "Two paths" section above billing modes.

---

## 2026-06-10 · Landing redesign — "People build. We monetize."

New positioning hero, segmented toggles for the two billing modes (prepaid / usage-based), audience toggle (Solo vs Studio), 6-col bento dashboard preview, SDK code tabs (TS/Python/Go), all lucide-react icons, professional design polish.

- `app/page.tsx` — full rewrite (~900 lines), lucide-react throughout.
- Mirrored to `gh-pages` via `/tmp/revenue_tech_pages/index.html`.

---

## 2026-06-10 · StackScore rebuilt as funnel walker

Drops the single-page scorer. New version drives a real Chromium through landing → CTA → pricing → checkout, captures every step (URL, title, screenshot, signals, classification), scores the whole flow across Brevity / Clarity / Cost Transparency / Trust.

- `worker/` — new folder: Playwright worker on Fly.io free tier with shared-secret auth.
- `lib/stackscore/` — types rewritten; new `flowScorer.ts`, `walker.ts`, `benchmarks.ts` (8 reference funnels).
- `app/stackscore/r/[id]/page.tsx` — horizontal flow chips + per-step screenshot cards.
- Removed: single-page Cheerio extractor, vision extractor, single-page scorer.

---

## 2026-06-09 · GitHub Pages + repo on `nagarmohnish/revenue_tech`

Initial repo creation, public visibility, gh-pages branch serving static mirrors.

- Repo: https://github.com/nagarmohnish/revenue_tech
- Pages: https://nagarmohnish.github.io/revenue_tech/

---

## 2026-06-09 · SDKs in three languages

Added real package skeletons: TypeScript (`@agentmint/sdk`), Python (`agentmint`), Go (`github.com/nagarmohnish/agentmint-go`). Each wraps the same `v1` HTTP contract (authorize + debit), zero heavy deps.

- `sdks/js/`, `sdks/python/`, `sdks/go/`, `sdks/README.md`

---

## 2026-06-09 · Landing — wedge-first hero + 5 payment rails

"One wallet for every agent" headline. Payment-rails strip: Stripe · PayPal · Razorpay · Apple Pay · UPI.

- `app/page.tsx`

---

## 2026-06-08 · AgentMint MVP

Credits + plan gating + billing portal for AI agents. Two HTTP calls (`authorize` + `debit`) instrument any agent; one shared wallet across the suite per customer; per-agent revenue attribution underneath.

- Initial 80+ files: landing, builder console (`/build/*`), customer dashboard (`/dashboard`), billing portal, agent routes, Stripe Checkout, atomic debit RPC.
- Supabase migrations: `0001_init.sql`, `0002_agency_multi_tenant.sql`.
