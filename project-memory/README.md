# Project memory

This folder is the **canonical history** of work done on `revenue_tech` (AgentMint + StackScore + Audit + Roadmap tools). Read it when you onboard. Keep it updated when you ship.

## Layout

| File | Purpose |
|---|---|
| [INDEX.md](INDEX.md) | Living map of every shipped feature → which files implement it → which URLs serve it. The first place to look. |
| [CHANGELOG.md](CHANGELOG.md) | Reverse-chronological log of meaningful changes. Date, headline, what shipped, where it lives. |
| [ROADMAP.md](ROADMAP.md) | What's next, what's deferred, what's been deliberately ruled out. |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Cross-cutting picture: stack, deployment topology, secrets surface. |
| `sessions/` | One file per working session with the full context — what we were trying to do, what we decided, what got built. Per-session detail. |
| `artifacts/` | URLs, credentials' *names* (never values), external services we depend on. |

## When to update

| Trigger | Update |
|---|---|
| Shipped a new feature, route, page, or migration | `CHANGELOG.md` + `INDEX.md` + (if non-trivial) a new `sessions/` entry |
| Made a meaningful architectural decision | `ARCHITECTURE.md` |
| Added a planned next step, or ruled one out | `ROADMAP.md` |
| Added a new external dependency (Supabase project, Vercel project, Fly app, API key surface) | `artifacts/services.md` |

## Sessions

Each session file is named `YYYY-MM-DD-<slug>.md` and contains:

```markdown
# YYYY-MM-DD · <slug>

## Goal
What we set out to do, in the user's words where possible.

## Decisions
Choices made and *why* — the parts that won't be obvious from the diff later.

## Shipped
Bullets of what got built, with paths.

## Open / deferred
Anything left for next time.

## References
URLs, related sessions, related docs.
```

## What this is not

- Not a substitute for code comments or commit messages.
- Not a public document — this is internal context for whoever is working on this codebase next.
- Not a TODO list — that lives in `ROADMAP.md`.
