# MTA data facts (verified 2026-10-19)

Downloaded and decoded on 2026-10-19 around 3:20 PM ET. Re-verify if something looks off. The MTA changes things.

## Endpoints (no API key needed for any of these)

| Data | URL | Size |
|---|---|---|
| Static schedule, regular | `https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip` | 5.6 MB zip |
| Static schedule, **supplemented** (planned work, ~8 days ahead, updated hourly) | `https://rrgtfsfeeds.s3.amazonaws.com/gtfs_supplemented.zip` | 20 MB zip (140 MB `stop_times.txt`) |
| Realtime, per line group | `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2F{feed}` | 11–245 KB each, ~810 KB total |
| Service alerts | `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts` | ~450 KB |
| Stations (direction labels) | `https://data.ny.gov/api/views/39hk-dx4f/rows.csv?accessType=DOWNLOAD` | 70 KB |
| Entrances and exits | `https://data.ny.gov/api/views/i9wp-a4ja/rows.csv?accessType=DOWNLOAD` | 280 KB, 2,120 rows |

Realtime `{feed}` values: `gtfs-ace`, `gtfs-bdfm`, `gtfs-g`, `gtfs-jz`, `gtfs-nqrw`, `gtfs-l`, `gtfs` (1–7 + S), `gtfs-si`.

## Static schedule

- `stops.txt`: 1,488 rows; **496 parent stations** (`location_type=1`). Children are `{station}N` / `{station}S`.
- `routes.txt`: 29 routes, with `route_color` / `route_text_color`.
- `transfers.txt`: 613 rows, **station-level** (parent IDs).
  - Self-transfers like `101→101, 180s` = time to change trains within the station.
  - 150 rows are between different stations (e.g. `127→A27, 300s`, Times Sq ↔ Port Authority).
  - `min_transfer_time` values: 0 (59 rows), 90, 180 (504), 240, 300 (40), 420.
- `stop_times.txt`: `arrival_time ≠ departure_time` in ~6% of rows → keep both.
- **Supplemented feed calendar:** date-specific service IDs (`L0S1`…`L3S3`) via `calendar_dates.txt`, plus normal `Weekday`/`Saturday`/`Sunday` variants (`Weekday_C5`…) in `calendar.txt`.
  - Monday 2026-10-19: active = `L0S2, L1S2, L2S1, Weekday, Weekday_C7` → **8,589 trips**, ~250k stop times.
  - Covers about 8 days ahead. Beyond that, use the regular feed (valid through `feed_end_date`, currently 2026-10-31).
- `shapes.txt`: 150k points. Simplify before shipping.

## Trip IDs

Schedule trip IDs have exactly two underscores:

```
L0S2-A-1087-S01_026950_A..S74R
└── service/block ─┘└─ TripKey ──┘
```

**TripKey** = everything after the first `_`, e.g. `026950_A..S74R`:
- `026950` = origin departure in **hundredths of a minute after midnight** (026950 → 269.50 min → 04:29:30).
- Next 3 chars = route ID padded with dots: `A..`, `GS.`, `SI.`, `FS.`.
- Next char = direction `N` / `S`.
- Rest = path code (`74R`), sometimes missing in realtime.

Realtime `trip_id` is the bare TripKey: `090500_A..N55R`. Within one service day, TripKeys were unique (8,589 keys, 0 duplicates).

### Match rates (910 realtime trips vs. that day's schedule)

| Rule | Matched |
|---|---|
| Exact TripKey | 705 (77%) |
| + ignore path code (`{time}_{route3}{dir}`), only when unique | +101 (→ 89%) |
| Ambiguous with the loose rule | 8 |
| No match → **added/rerouted trains** | ~96 (11%) |

Unmatched realtime trips must be treated as **realtime-only trips** built from their own stop list. Don't fuzzy-match by nearby times; it caused false matches in testing.

## Realtime feed (GTFS-RT + NYCT extension, field 1001)

- Header `timestamp` was ~56 s old when fetched. Feeds update roughly every 30 s.
- Each trip appears as a `TripUpdate` (future stops only) **and** a `VehiclePosition`.
- `TripDescriptor`: `trip_id`, `route_id`, `start_date` (`20261019`).
- NYCT extension on `TripDescriptor`: `train_id` (`1A 1505 FAR/207`), `is_assigned`, `direction`.
  - **is_assigned**: only ~50–65% of trips are assigned (train has actually started). Unassigned predictions are weaker.
- `StopTimeUpdate`: `stop_id` (`A09N`), `arrival.time`, `departure.time` (epoch seconds). Either may be missing (first/last stop).
- NYCT extension on `StopTimeUpdate`: `scheduled_track`, `actual_track` (`A4`, `F3`, `1`, `4`).
  - Lettered lines: both present on ~100% of updates.
  - Numbered lines: `scheduled_track` ~100%; `actual_track` rare (~2%).
  - **Used for the "same platform" rule.** See [realtime.md](realtime.md#same-platform).

## Stations CSV
Columns include `GTFS Stop ID`, `Complex ID`, `Stop Name`, `Borough`, `Daytime Routes`, `Structure`,
**`North Direction Label`**, **`South Direction Label`** (e.g. "Uptown" / "Downtown", "Manhattan" / "Bay Ridge", "Last Stop"), `ADA`.

## Entrances CSV
Columns: `GTFS Stop ID` (parent), `Complex ID`, `Entrance Type` (Stair, Elevator, Escalator…), `Entry Allowed`, `Exit Allowed`, `Entrance Latitude/Longitude`.
**No direction information.** Entrances that only serve one platform are not marked. The "wrong-direction entrance" edge case can't be fully handled from this data. See open questions in [../../STATUS.md](../../STATUS.md).
