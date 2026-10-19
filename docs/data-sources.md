# Data sources

Verified 2026-10-19 by downloading and decoding the real feeds. Endpoints, sizes, ID formats, and quirks: **[design/mta-data-facts.md](design/mta-data-facts.md)**.

| Source | What we use it for | Cost | Status |
|---|---|---|---|
| **MTA GTFS static: supplemented** | Schedules incl. planned work, ~8 days ahead | Free, no key | ✅ Verified |
| **MTA GTFS static: regular** | Schedules beyond the supplemented window | Free, no key | ✅ Verified |
| **MTA GTFS-Realtime (8 subway feeds)** | Live predictions, `is_assigned`, tracks (NYCT extension) | Free, no key | ✅ Verified |
| **MTA subway alerts feed** | Service alerts, planned work | Free, no key | ⚠️ Downloaded; field details to verify in M3 |
| **MTA Subway Stations** (data.ny.gov) | North/South direction labels ("Uptown", "Bay Ridge"…), complexes | Free | ✅ Verified |
| **MTA Subway Entrances and Exits** (data.ny.gov) | Entrance coordinates (walking targets) | Free | ✅ Verified (no direction info) |
| **Apple MapKit (iOS)** | Map, place search, walking ETAs and routes | Free (per-device throttling) | Use from M4 |
| **Google Routes API** | **Dev-only** accuracy benchmark | Free tier | Use in M2.12 |

## Known data limitations
- Live predictions only reach ~30–60 min ahead. Further out = schedule only (same as every other app).
- About 35–50% of trips in the feed haven't started yet (`is_assigned = false`); their predictions are weaker → extra buffer.
- ~11% of live trips don't match the schedule (added/rerouted trains) → handled as realtime-only trips.
- No entrance-to-platform times → curated per-station buffers.
- Entrances aren't marked by direction → the wrong-direction-entrance case can't be fully handled from this data.
- Track data exists, but island platforms (express/local across the platform) need a curated list.

## Terms
Review MTA data terms before launch: attribution required, and the app must not imply MTA endorsement.
