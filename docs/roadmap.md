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
- [ ] Three modes: Leave now / Leave at / Arrive by, with ranking and backups
- [ ] "Can I make it" + "run for it" logic
- [ ] Copy generator (NYC voice)
- [ ] Station entrances dataset + per-station platform buffers
- [ ] Feed recorder + replay harness
- [ ] Accuracy benchmark vs. Google

## M3 — Backend
- [ ] Data pipeline (GitHub Actions → R2)
- [ ] Feed cache Worker (Durable Object, ~30 s)
- [ ] **Verify APNs from Workers (HTTP/2)**; fall back to Deno Deploy if needed
- [ ] Committed-plan storage (D1) + monitor
- [ ] Re-plan + push when the deadline is at risk

## M4 — App MVP
- [ ] Apple Developer account, Expo project, first EAS dev build on iPhone
- [ ] Destination search (MapKit) + saved places
- [ ] Mode chip (Now / Leave at / Arrive by)
- [ ] Results list with live countdown; missed options drop off
- [ ] Map with full route and entrance pins

## M5 — Navigation
- [ ] "Go" mode with background location
- [ ] Live Activity + Dynamic Island (Swift)
- [ ] Server-pushed Live Activity updates (underground)
- [ ] "Leave now" notifications

## M6 — Plan ahead + change alerts (end to end)
- [ ] Commit plan from the app
- [ ] Far-future notice copy
- [ ] Push-to-start Live Activity at departure time
- [ ] Planned-work / service-alert monitoring

## M7 — Ship
- [ ] Real-ride testing across lines and boroughs
- [ ] Maestro E2E suite on EAS
- [ ] Sentry, privacy policy, MTA attribution
- [ ] TestFlight beta → App Store
