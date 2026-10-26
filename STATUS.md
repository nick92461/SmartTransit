# Project status

_Last updated: 2026-10-19_

## Where we are
**Milestone 0 — Project setup: done.**
- Product plan, side-chat decisions, and the full design are written.
- Design specs: [docs/design/](docs/design/README.md), built from real MTA data downloaded and decoded on 2026-10-19.
- Step-by-step build order: [docs/implementation-plan.md](docs/implementation-plan.md).
- Competitive check done (Citymapper, [docs/competitors.md](docs/competitors.md)). **Planned trips** are now the headline feature; departure picker and "2 train" labels added to the specs.
- **M1.1 done:** npm workspaces, shared tsconfig, `packages/core` with a Vitest test, ESLint, Prettier, editor settings. Lint, test, and typecheck all pass.

## Next step
**M1.2 — Core model types + config** (see the implementation plan).
Workflow: Sonnet explains and gives code in chunks, the owner types it, Sonnet reviews and runs checks. See [CLAUDE.md](CLAUDE.md).

## Measurements so far
| What | Value | Source |
|---|---|---|
| Weekday trips (2026-10-19) | 8,589 | supplemented feed |
| Live feeds total size | ~810 KB per poll | 8 feeds |
| Live → schedule trip match | 77% exact, 89% with loose rule | 910 live trips |
| Trips started (`is_assigned`) | ~50–65% | ACE and 1–7 feeds |
| Day slice size (gzipped) | _measure in M1.6_ | |
| Routing time (Node) | _measure in M1.13_ | |

## Open questions
- [ ] Can a Cloudflare Worker reach APNs (HTTP/2)? First task of M3; fallback is a Deno Deploy relay.
- [ ] Alerts feed: confirm the Mercury extension fields for planned work (M3).
- [ ] Can expo-widgets do interactive (App Intent) buttons on the Live Activity? Spike in M5.
- [ ] Island (cross-platform) pairs for the same-platform rule: build the curated list from recordings + real rides.
- [ ] Wrong-direction entrances: the entrances data has no direction info. Find another source (e.g. OpenStreetMap) or accept the limitation.
- [ ] Is the GitHub repo public or private? (Affects the GitHub Actions minute budget for the hourly pipeline.)
- [ ] Confirm current pricing: Expo EAS free tier limits, Cloudflare Workers Paid, Google Routes API (dev benchmark only).
- [ ] Review MTA data terms of use (attribution, no implied endorsement).
- [ ] Final app name ("SmartTransit" is a working name).
- [ ] Repeating planned trips ("every weekday, arrive at Work by 9:00")? Decide after M6.
- [ ] How does Citymapper react to delays and to user-caused lateness as a trip approaches? Test it on a real trip.
