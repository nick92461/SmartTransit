# Architecture

## Overview

```
                  ┌──────────────────────────────┐
  MTA live feeds ─┤  Server (Cloudflare Workers) ├── Apple Push Notification service ──┐
  MTA schedules  ─┤  • feed cache (every ~30 s)  │                                     │
                  │  • committed-plan monitor    │                                     ▼
                  │  • push sender               │◄───── commit plan / push token ── iPhone app
                  └──────────────┬───────────────┘                                  • routing + route repair (on device)
                                 │ latest train predictions                         • MapKit map, search, walking
                                 └─────────────────────────────────────────────────►• Live Activity, notifications
                                                                                    • missed-train detection
```

The **routing engine** (`packages/core`) is shared TypeScript. It runs on the phone for trip searches and route repairs, and on the server for checking committed plans.

## Main flows

### 1. Trip search
1. User picks a destination (MapKit place search) and mode (Now / Leave at / Arrive by).
2. App finds nearby station **entrances** and gets walking times to them from MapKit.
3. App fetches the latest train predictions from our server (a cached copy of the MTA feeds).
4. Router (RAPTOR) searches the subway network: walk → ride(s) → walk.
5. Results are ranked for the chosen mode and turned into plain sentences.
6. The list refreshes as time passes: options that can no longer be made are removed, new ones are appended. If none meets an arrive-by goal, the app reports the fastest one instead.

### 2. Navigation ("Go")
- One route drawn on the map: MapKit walking polylines + train legs drawn along MTA track shapes.
- Background location keeps the app running while walking, so it updates the Live Activity directly.
- Underground (no GPS): progress estimated from the plan; the server pushes Live Activity updates.

### 3. Committed plans + change alerts
1. User commits a plan → app sends the server: specific trains, transfers, arrive-by deadline, push token(s).
2. Server re-checks every committed plan against each new feed snapshot (~30 s), plus planned work and service alerts before live predictions are in range.
3. If the plan no longer meets the deadline, the server sends a **problem-only** notification ("Your plan won't get you there by 9:00 anymore"). It does not choose a replacement.
4. Tapping the notification opens the app, which re-runs the search and shows a fresh options list.
5. At departure time the server can **push-to-start** the Live Activity (iOS 17.2+).

### 4. Active trip: repairs
When a train on the active route is missed or no longer viable, the app patches the route in place. It tries these in order and stops at the first that works:

1. **Same line, same platform, later train.** Only times change.
2. **Different line, same platform**, if that specific train stops where the user needs it (check that train's own stop times: express/local and late-night patterns differ). Line label and times change.
3. **Same boarding station**, later parts of the route re-solved (e.g. a broken transfer).
4. **Full re-plan from the user's current location**, only when their position makes the original station a bad choice. Only this case shows the "missed it, here are your options" screen.

Rules:
- Prefer the patch if it's within **~2 min** of the best fresh plan (stability over saving 90 seconds).
- If the deadline can't be met, keep the patched route and show the lateness in the same card.
- **Look for alternatives** only when the patch adds more than `ALTERNATIVES_THRESHOLD_MIN` (default 10 min), or breaks an arrive-by deadline another route could still meet. Show only alternatives that beat the patch, below it. Never switch automatically.
- `ALTERNATIVES_THRESHOLD_MIN` and the 2-min stability margin are single settings in `packages/core`, tuned with feed-replay tests.

**Notifications:** every meaningful change gets one, in the form "what changed → what it costs". Directions use uptown / downtown / borough-bound or the last stop (MTA headsigns). Shifts of a minute or two update the Live Activity silently.

### 5. Missed-train detection
Signals combined into a confidence score:

| Signal | Suggests |
|---|---|
| Still on the street, away from the entrance, when the train leaves | Missed (high confidence) |
| GPS drops out near an entrance | Went underground, likely on the platform |
| Coarse location (Wi-Fi / cell) still at the station minutes after departure | Missed |
| Coarse location moving along the line | Boarded |
| Motion sensors | Weak alone; separates standing still from riding |

- **High confidence:** act silently (repair if missed, carry on if boarded).
- **Low confidence:** ask "Did you make the 8:49 C?" (Yep · Missed it · Not here yet), answerable from the lock screen (iOS 17+ interactive Live Activity / notification actions). Ask only when signals disagree.
- **"Not here yet":** keep the current train as the target, mark it waiting, keep checking the feed. Log these answers as a data-quality signal.
- **Underground transfers:** assume made; show a small "Missed it" button. Recalculate automatically when the user resurfaces somewhere that doesn't match the plan.
- **Edge cases:** train held at the station; user boarded a different line than planned (follow their actual path and quietly switch the route to it); train switches express/local mid-trip (re-check it still stops at the user's station); user at the entrance for the wrong direction.

## Data pipeline
A scheduled GitHub Actions job downloads MTA static schedules (including the hourly "supplemented" feed with planned work) and the station-entrances dataset. It converts them into compact router data and uploads it to Cloudflare R2. The app downloads updates when they change.

## Repository layout (planned)

```
apps/mobile          iPhone app (Expo / React Native + small Swift pieces)
packages/core        routing engine, route repair, feed parsing, ranking, copy generator
services/api         Cloudflare Workers backend
tools/gtfs-pipeline  MTA data download + preprocessing
docs/                planning and project tracking
```
