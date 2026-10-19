# Roadmap

Tick tasks as they're done. Keep [STATUS.md](../STATUS.md) in sync.

## M0 — Project setup ✅
- [x] Product plan and architecture written
- [x] GitHub repo, `main` + `dev` branches

## M1 — Feasibility spike (Windows only)
Goal: prove the riskiest part. Two addresses + a mode in → correct plain-English plan out, using live trains.
- [ ] Monorepo scaffold (pnpm, TypeScript, Vitest)
- [ ] Download + parse MTA static GTFS (supplemented)
- [ ] Decode MTA GTFS-Realtime feeds
- [ ] RAPTOR router (subway only, with transfers)
- [ ] Walking-time stand-in for now (straight-line × factor, until MapKit is wired in)
- [ ] CLI: `from`, `to`, mode → "Leave at… catch the… arrive at…"
- [ ] Spot-check results against Apple / Google Maps by hand

## M2 — Core engine
- [ ] Three modes: Leave now / Leave at / Arrive by, with ranking
- [ ] Options list logic: drop unmakeable options, append new ones, "Nothing gets you there by 9:00. Fastest is 9:07."
- [ ] "Can I make it" + "run for it" logic
- [ ] Route repair (4-step order, ~2 min stability margin, keep route when late)
- [ ] Alternatives check (`ALTERNATIVES_THRESHOLD_MIN` = 10, or deadline broken)
- [ ] Missed-train confidence scorer (pure logic)
- [ ] Copy generator (NYC voice), incl. change notifications and direction names (headsigns, uptown/downtown)
- [ ] Resolve how to detect "same platform" (see data-sources.md)
- [ ] Station entrances dataset + per-station platform buffers
- [ ] Feed recorder + replay harness
- [ ] Accuracy benchmark vs. Google

## M3 — Backend
- [ ] Data pipeline (GitHub Actions → R2)
- [ ] Feed cache Worker (Durable Object, ~30 s)
- [ ] **Verify APNs from Workers (HTTP/2)**; fall back to Deno Deploy if needed
- [ ] Committed-plan storage (D1) + monitor
- [ ] Problem-only push when a committed plan stops meeting its deadline

## M4 — App MVP
- [ ] Apple Developer account, Expo project, first EAS dev build on iPhone
- [ ] Destination search (MapKit) + saved places
- [ ] Mode chip (Now / Leave at / Arrive by)
- [ ] Options list with live countdown; missed options silently drop off, new ones append
- [ ] Map with full route and entrance pins

## M5 — Navigation
- [ ] "Go" mode with background location
- [ ] Live Activity + Dynamic Island (Swift)
- [ ] Server-pushed Live Activity updates (underground)
- [ ] "Leave now" notifications
- [ ] In-place route repair in the active trip; changed times animate, old time briefly crossed out; card never blank
- [ ] Change notifications ("what changed → what it costs"); small shifts silent
- [ ] Missed-train signals: location vs. entrances, GPS dropout, coarse location, motion
- [ ] "Did you make the 8:49 C?" question with lock-screen buttons (App Intents / notification actions)
- [ ] Underground "Missed it" button; recalculate on resurfacing
- [ ] Edge cases: held train, boarded a different line, express/local switch, wrong-direction entrance

## M6 — Plan ahead + change alerts (end to end)
- [ ] Commit plan from the app
- [ ] Far-future notice copy
- [ ] Tapping a "plan won't make it" notification opens a refreshed options list
- [ ] Push-to-start Live Activity at departure time
- [ ] Planned-work / service-alert monitoring

## M7 — Ship
- [ ] Real-ride testing across lines and boroughs
- [ ] Maestro E2E suite on EAS
- [ ] Sentry, privacy policy, MTA attribution
- [ ] TestFlight beta → App Store
