# Testing strategy

The logic that must be correct (routing and alerts) is plain TypeScript, so it's tested on Windows at scale.

| Layer | Tool | Runs on |
|---|---|---|
| Router, ranking, "can I make it", copy | **Vitest** | Windows / CI |
| Server (feed cache, plan monitor) | **Vitest** (+ Workers test tooling) | Windows / CI |
| **Feed replay** | Custom harness | Windows / CI |
| **Accuracy benchmark vs. Google** | Custom script, Google Routes API (dev only) | Windows |
| App components | **Jest (jest-expo) + React Native Testing Library** | Windows / CI |
| End-to-end flows | **Maestro** on EAS Workflows | Cloud Mac simulators |
| Lock screen, background location, real rides | Manual | Physical iPhone |

## Feed replay
Record real MTA live-feed snapshots (e.g. a full weekday rush hour), then replay them in order:
- Does the router pick the right trains at each moment?
- Do committed-plan alerts fire at the right time, and only when the deadline is actually at risk?
- Route repair: does each missed-train scenario pick the right step (same line → other line same platform → re-solve later legs → full re-plan)?
- Tune `ALTERNATIVES_THRESHOLD_MIN` (default 10) and the ~2 min stability margin against replayed days.
- Notification volume: small shifts must stay silent; count notifications per replayed trip.

## Missed-train detection
Scripted signal sequences (location, GPS dropout, coarse location, motion) fed into the confidence scorer:
caught the train, missed it, on the platform with GPS gone, train held at the station, boarded a different line, wrong-direction entrance.
Check it acts silently when confident and asks only when signals disagree.
"Not here yet" answers from real use are logged as an MTA data-quality signal.

## Accuracy benchmark (the parity rule)
Run hundreds of origin / destination / time combinations through our router and through Google (subway-only).
Flag every case where our arrival is worse. Target a reportable number, e.g. "matches or beats Google in 97% of trips."
