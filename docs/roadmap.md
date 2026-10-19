# Roadmap

Milestone overview. **Step-by-step tasks and checkboxes live in [implementation-plan.md](implementation-plan.md).**

| Milestone | Goal | Status |
|---|---|---|
| **M0** Project setup | Plan, design specs, repo, branches | ✅ Done |
| **M1** Feasibility spike | CLI plans a real trip from live MTA data on Windows; spot-checked against Apple/Google | ⏳ Next |
| **M2** Core engine | Range RAPTOR, three modes, options list, repair, notifications, missed-train scorer, trip reducer, replay harness, Google benchmark | |
| **M3** Backend | Worker + R2 + FeedPoller + D1 + plan monitor + APNs | |
| **M4** App MVP | Expo app: search, options list, route map, on-device routing | |
| **M5** Navigation | Active trip, background location, Live Activity, repair UI, notifications | |
| **M6** Plan ahead | Commit plans, far-future notice, plan alerts, push-to-start | |
| **M7** Ship | Real-ride testing, E2E, Sentry, privacy, TestFlight, App Store | |

## Milestone exit rule
A milestone is done when every step in the implementation plan is ticked, STATUS.md is updated, and the owner has approved merging `dev` into `main`.
