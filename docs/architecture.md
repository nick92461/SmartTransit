# Architecture

## Overview

```
                  ┌──────────────────────────────┐
  MTA live feeds ─┤  Server (Cloudflare Workers) ├── Apple Push Notification service ──┐
  MTA schedules  ─┤  • feed cache (every ~30 s)  │                                     │
                  │  • committed-plan monitor    │                                     ▼
                  │  • push sender               │◄───── commit plan / push token ── iPhone app
                  └──────────────┬───────────────┘                                  • routing (on device)
                                 │ latest train predictions                         • MapKit map, search, walking
                                 └─────────────────────────────────────────────────►• Live Activity, notifications
```

The **routing engine** (`packages/core`) is shared TypeScript. It runs on the phone for trip searches and on the server for re-planning committed trips.

## Main flows

### 1. Trip search
1. User picks a destination (MapKit place search) and mode (Now / Leave at / Arrive by).
2. App finds nearby station **entrances** and gets walking times to them from MapKit.
3. App fetches the latest train predictions from our server (a cached copy of the MTA feeds).
4. Router (RAPTOR) searches the subway network: walk → ride(s) → walk.
5. Results are ranked for the chosen mode and turned into plain sentences.

### 2. Navigation ("Go")
- One route drawn on the map: MapKit walking polylines + train legs drawn along MTA track shapes.
- Background location keeps the app running while walking, so it updates the Live Activity directly.
- Underground (no GPS): progress estimated from the plan; the server pushes Live Activity updates.

### 3. Committed plans + change alerts
1. User commits a plan → app sends the server: specific trains, transfers, arrive-by deadline, push token(s).
2. Server re-checks every committed plan against each new feed snapshot (~30 s).
3. If the plan no longer meets the deadline, the server re-plans and sends a push with the new best option.
4. Before live predictions exist (> ~30–60 min out), the server watches planned-work schedules and service alerts.
5. At departure time the server can **push-to-start** the Live Activity (iOS 17.2+).

## Data pipeline
A scheduled GitHub Actions job downloads MTA static schedules (including the hourly "supplemented" feed with planned work) and the station-entrances dataset. It converts them into compact router data and uploads it to Cloudflare R2. The app downloads updates when they change.

## Repository layout (planned)

```
apps/mobile          iPhone app (Expo / React Native + small Swift pieces)
packages/core        routing engine, feed parsing, ranking, copy generator
services/api         Cloudflare Workers backend
tools/gtfs-pipeline  MTA data download + preprocessing
docs/                planning and project tracking
```
