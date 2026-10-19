# Design specs

These specs are the contract for building SmartTransit. They were written before any code, from real MTA data
(inspected 2026-10-19). Build to them. If something here turns out wrong or missing, **stop, flag it, and record
the change in [../decisions.md](../decisions.md)** instead of quietly designing around it.

Read in this order:

| # | Spec | Covers |
|---|---|---|
| 1 | [conventions.md](conventions.md) | Repo layout, package boundaries, time handling, IDs, config, errors, testing rules |
| 2 | [data-model.md](data-model.md) | Every shared TypeScript type. The vocabulary for everything else |
| 3 | [mta-data-facts.md](mta-data-facts.md) | Verified facts and quirks of the MTA feeds, with numbers |
| 4 | [data-pipeline.md](data-pipeline.md) | MTA files → `network.json` + per-day timetable slices |
| 5 | [router.md](router.md) | Timetable index, RAPTOR, access/egress walking, the three modes, ranking |
| 6 | [realtime.md](realtime.md) | Live feed decoding, trip matching, overlaying predictions, staleness |
| 7 | [trip-lifecycle.md](trip-lifecycle.md) | Options list refresh, active trip state machine, repair, alternatives, notifications, missed-train detection |
| 8 | [server.md](server.md) | Cloudflare Worker endpoints, Durable Object poller, D1 schema, plan monitor, APNs |
| 9 | [mobile-app.md](mobile-app.md) | Screens, stores, native modules, Live Activity, background location |

The step-by-step build order is in [../implementation-plan.md](../implementation-plan.md).
