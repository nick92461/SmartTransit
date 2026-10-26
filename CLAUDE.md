# CLAUDE.md — working rules for this project

## Get context first
1. Read [STATUS.md](STATUS.md): current state, next step, open questions.
2. Read the current step in [docs/implementation-plan.md](docs/implementation-plan.md).
3. Read the design spec sections that step points to ([docs/design/](docs/design/README.md)).
4. Check [docs/decisions.md](docs/decisions.md) before re-opening a settled choice.

## How we work: the owner types the code
The owner is an engineer building this to learn. **Claude teaches and reviews; the owner writes the code.**

- **Never create or edit source files** in `packages/`, `tools/`, `services/`, `apps/`, `fixtures/`, or root config files
  (`package.json`, `tsconfig*.json`, ESLint/Prettier configs, `wrangler.jsonc`, `app.json`…). Present that code in chat instead.
- Claude **may** edit docs: `STATUS.md`, `docs/**`, `CLAUDE.md`, `README.md`. Claude may also run commands and write throwaway scripts outside the repo for investigation.
- Run each step from the implementation plan like this:
  1. **Explain** the step's goal and the "Learn" concepts briefly, in plain language, before any code.
  2. **Give code in small chunks** (one file, or one function, at a time) with short notes on *why*, not just what.
     Give the full file path for each chunk. Prefer complete, typeable code over pseudo-code.
  3. **Wait** for the owner to type it. Then read the file(s) they wrote and run the checks (typecheck, tests, lint).
  4. **Review** what they typed: point out typos, bugs, and deviations from the spec, with exact lines. Let them fix it.
  5. When "Done when" passes: tick the step in the implementation plan, update STATUS.md, and commit on `dev` (`M1.4: …`).
- The owner may also ask Claude to explain more, quiz them, or let them try a piece first and then review it. Follow their lead.
- Install dependencies only with the owner's OK, naming the package and why.
- **Don't report cosmetic formatting issues** (Prettier warnings, line endings, whitespace). Just run the formatter. Only mention formatting if it affects behavior.

## Follow the design
- The specs in `docs/design/` were written up front, on purpose. **Build to them.**
- If a spec is wrong, ambiguous, or missing something: stop, explain the problem, propose a fix, and record the agreed change in `docs/decisions.md` (and update the spec) **before** coding around it.
- Bigger design changes (new components, algorithm changes, data model changes) are a good moment to switch to the Opus model.

## Which model for what
- **Sonnet (medium):** executing implementation-plan steps, teaching, reviewing typed code, running tests, small fixes.
- **Opus:** starting a new milestone (refine its outlined steps into detailed ones), design changes, hard bugs in the router, realtime, or repair logic.

## Git rules
- Work on `dev` (or a feature branch off `dev`). Never commit directly to `main`.
- Merge `dev` → `main` **only when the owner explicitly says to.**
- Remote: https://github.com/nick92461/SmartTransit.git

## Keep the docs current
The repo is the project's memory. Update docs in the same commit as the work:
- Step done → tick it in `docs/implementation-plan.md`, update `STATUS.md` (and the milestone in `docs/roadmap.md` when a milestone finishes).
- A choice between real alternatives → `docs/decisions.md`.
- Behavior changed → the matching `docs/design/*.md`.

## Product guardrails (see docs/product.md)
- Walking + subway only. No buses, bikes, cars, ferries.
- Show clock times the user acts on. Never show raw delays, headways, or "scheduled vs. actual".
- **Parity rule:** no feature may be worse than Apple Maps / Google Maps on accuracy. Match them at minimum, beat them where data allows, always be clearer.
- Copy has NYC personality, not bland and informative-only.

## Environment
- Windows, Git Bash/PowerShell, Node 24, npm 11. No Mac. iOS builds go through Expo EAS. See [docs/dev-environment.md](docs/dev-environment.md).
- Do not install or run unofficial "iOS simulators for Windows".
