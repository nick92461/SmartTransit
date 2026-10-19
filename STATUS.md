# Project status

_Last updated: 2026-10-19_

## Where we are
**Milestone 0 — Project setup: done.** Planning docs written, repo created, `main` and `dev` branches pushed.
No code yet.

## Next up
**Milestone 1 — Feasibility spike** (see [docs/roadmap.md](docs/roadmap.md)):
prove a TypeScript RAPTOR router on real MTA data can produce a correct
"leave at / catch the / arrive at" plan from two addresses, run entirely on Windows.

## Open questions
- [ ] **Side-chat decisions.** Some decisions were made in a separate chat and haven't been captured here yet. Add them to `docs/decisions.md`.
- [ ] Can Cloudflare Workers send to Apple's push service (APNs requires HTTP/2)? If not, use Deno Deploy for push sending. Verify in Milestone 3.
- [ ] Confirm current pricing: Expo EAS free tier limits, Cloudflare Workers/D1, Google Routes API (dev benchmarking only).
- [ ] Confirm MTA real-time subway feeds still need no API key, and review MTA data terms of use (attribution, no implied endorsement).
- [ ] Final app name ("SmartTransit" is a working name).
