# Decision log

Newest at the bottom. Each entry: what, why, alternatives.

## 2026-10-19 — Walking + subway only
**Why:** the product is "simple for people on foot". Also keeps the routing network small (~470 stations) and cheap.
**Rejected:** buses, bikes, multimodal.

## 2026-10-19 — Build our own router (RAPTOR) instead of Google Routes API
**Why:** near-zero running costs, full control over ranking for the three modes, no map-display restrictions.
**Rejected:** Google Routes API (~$5–10 per 1,000 requests; thousands/month at scale).

## 2026-10-19 — In-app navigation, not handoff to Apple Maps
**Why:** Apple/Google Maps links can't carry a specific itinerary; they recompute their own route (possibly with buses), which breaks accuracy.

## 2026-10-19 — Apple MapKit for map, search, and walking
**Why:** free on iOS and gives Apple-level quality for those parts (parity rule). Apple's conservative walking times are a feature.

## 2026-10-19 — Expo / React Native, developed on Windows
**Why:** no Mac. EAS builds in the cloud; logic is testable locally. Small Swift pieces for Live Activity / MapKit.
**Rejected:** full-time cloud Mac + native Swift (~$50–150/mo); unofficial iOS simulators on Windows (inaccurate, unsafe).

## 2026-10-19 — Cloudflare Workers backend
**Why:** free/cheap, no egress fees, TypeScript shared with the app.
**Open risk:** APNs HTTP/2 support; fallback is Deno Deploy for push sending.

## 2026-10-19 — Whole project directory under version control
**Why:** plans, status, and decisions live with the code so every session has full context.
Git: work on `dev`; merge to `main` only on the owner's say-so.

## Pending — decisions from the side chat
Not captured yet. Add them here.
