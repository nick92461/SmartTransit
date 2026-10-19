# SmartTransit

> Working name. A dead-simple NYC subway helper for people on foot.

**Where are you, where are you going, and when do you need to be there?**
SmartTransit answers with one clear plan:

> **Leave at 8:42.** Walk 6 min to 23 St. **C train at 8:49.** Arrive 9:12.

No delay math, no headways, no clutter. Walking + subway only — no buses, bikes, or cars.
Live train predictions are used behind the scenes; every time shown to the user already accounts for them.

## Project docs

All planning lives in this repo so any work session has full context.

| Doc | What's in it |
|---|---|
| [STATUS.md](STATUS.md) | **Start here.** Current state, what's next, open questions |
| [docs/product.md](docs/product.md) | Product vision, modes, UX principles, copy voice |
| [docs/architecture.md](docs/architecture.md) | How the system works end to end |
| [docs/tech-stack.md](docs/tech-stack.md) | Languages, frameworks, services |
| [docs/data-sources.md](docs/data-sources.md) | MTA feeds, Apple MapKit, other data |
| [docs/dev-environment.md](docs/dev-environment.md) | Building an iOS app from Windows (no Mac) |
| [docs/testing.md](docs/testing.md) | Testing strategy |
| [docs/costs.md](docs/costs.md) | Development and per-user running costs |
| [docs/roadmap.md](docs/roadmap.md) | Milestones and task checklist |
| [docs/decisions.md](docs/decisions.md) | Decision log (what we chose and why) |
| [CLAUDE.md](CLAUDE.md) | Working rules for AI coding sessions |

## Git workflow

- `main` — only completed, approved features.
- `dev` — day-to-day work. Merged into `main` only when the project owner says so.
