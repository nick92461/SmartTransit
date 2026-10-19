# Project status

_Last updated: 2026-10-19_

## Where we are
**Milestone 0 — Project setup: done.** Planning docs written, repo created, `main` and `dev` branches pushed.
Side-chat decisions (options list, route repair, change notifications, missed-train detection) are logged in
[docs/decisions.md](docs/decisions.md) and reflected in the product, architecture, testing, and roadmap docs.
No code yet.

## Next up
**Milestone 1 — Feasibility spike** (see [docs/roadmap.md](docs/roadmap.md)):
prove a TypeScript RAPTOR router on real MTA data can produce a correct
"leave at / catch the / arrive at" plan from two addresses, run entirely on Windows.

## Open questions
- [ ] Can Cloudflare Workers send to Apple's push service (APNs requires HTTP/2)? If not, use Deno Deploy for push sending. Verify in Milestone 3.
- [ ] How do we know two lines share a platform (route repair step 2)? MTA stop IDs are per station + direction, not per platform. Check the NYCT real-time track fields. Look at this during Milestone 1.
- [ ] Confirm current pricing: Expo EAS free tier limits, Cloudflare Workers/D1, Google Routes API (dev benchmarking only).
- [ ] Confirm MTA real-time subway feeds still need no API key, and review MTA data terms of use (attribution, no implied endorsement).
- [ ] Final app name ("SmartTransit" is a working name).
