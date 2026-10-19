# CLAUDE.md — working rules for this project

## Get context first
1. Read [STATUS.md](STATUS.md) — current state, next steps, open questions.
2. Read [docs/roadmap.md](docs/roadmap.md) for the milestone being worked on.
3. Check [docs/decisions.md](docs/decisions.md) before re-opening a settled choice.

## Git rules
- Work on `dev` (or a feature branch off `dev`). Never commit directly to `main`.
- Merge `dev` → `main` **only when the project owner explicitly says to.**
- Remote: https://github.com/nick92461/SmartTransit.git

## Keep the docs current
The repo is the project's memory. When work changes something, update the docs in the same commit:
- Finished or started a task → tick it in `docs/roadmap.md`, update `STATUS.md`.
- Made a choice between real alternatives → add an entry to `docs/decisions.md`.
- Changed how something works → update `docs/architecture.md` / `docs/tech-stack.md`.

## Product guardrails (see docs/product.md)
- Walking + subway only. No buses, bikes, cars, ferries.
- Show clock times the user acts on. Never show raw delays, headways, or "scheduled vs. actual".
- **Parity rule:** no feature may be worse than Apple Maps / Google Maps on accuracy. Match them at minimum, beat them where data allows, always be clearer.
- Copy has NYC personality — not bland and informative-only.

## Environment
- Development machine is Windows; there is no Mac. iOS builds go through Expo EAS. See [docs/dev-environment.md](docs/dev-environment.md).
- Do not install or run unofficial "iOS simulators for Windows".
