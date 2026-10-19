# Data pipeline (`tools/gtfs-pipeline`)

Turns MTA files into the small bundle the app and server use. Runs in Node on Windows during development and on a GitHub Actions schedule later.

## Output bundle

```
dist/
├─ manifest.json                       small, fetched often
├─ network-<hash>.json.gz              stations, stops, routes, transfers, entrances, shapes
└─ day-YYYYMMDD-<hash>.json.gz         one timetable slice per service day
```

`manifest.json`:
```ts
interface Manifest {
  generatedAt: EpochSec;
  network: { file: string; hash: string; bytes: number };
  days: { serviceDate: ServiceDate; file: string; hash: string; bytes: number; source: 'supplemented' | 'regular' }[];
}
```
- `hash` = first 12 hex chars of SHA-256 of the gzipped bytes. Hash in the filename makes files immutable, so they can be cached forever. Only the manifest changes.
- Days covered: **today − 1 through today + 14**. The supplemented feed covers the dates it has data for (~8 days); the regular feed fills the rest.
  The extra past day is needed because trips after midnight belong to the previous service day.

## Steps

### 1. Download with change detection
- Conditional GET with `If-None-Match` / `If-Modified-Since`, stored in `data/raw/etags.json`.
- If nothing changed since the last run, exit immediately. Most hourly runs should take seconds.
- Save to `data/raw/` (git-ignored).

### 2. Unzip and parse
- Unzip with **fflate**. Parse CSV with **csv-parse**.
- `stop_times.txt` in the supplemented feed is **140 MB**: stream it row by row, never load the whole file as one string.
- Trim fields; treat empty strings as null.

### 3. Build `network.json`
| Field | Source |
|---|---|
| stations | `stops.txt` rows with `location_type=1`, joined to stations CSV on `GTFS Stop ID` for `complexId`, `borough`, `northLabel`, `southLabel` |
| stops | `stops.txt` child rows (`parent_station` set); `direction` = last char (`N`/`S`) |
| routes | `routes.txt` |
| transfers | `transfers.txt` (all rows are type 2) |
| entrances | entrances CSV joined on `GTFS Stop ID`; drop rows with no coordinates |
| platformBufferSec | `tools/gtfs-pipeline/data/platform-buffers.json` (hand-curated `{ "stationId": sec }`), else `defaultPlatformBufferSec` |
| shapes | `shapes.txt` → Douglas-Peucker simplify (tolerance ~5 m) → Google encoded polyline |

Validation (fail the run, publish nothing): stations 450–550, every child stop's parent exists, every transfer's stations exist, ≥ 1 entrance for ≥ 95% of stations. Log stations with no entrance (fall back to station coordinates).

### 4. Active services for a date
```
activeServiceIds(date) =
  { calendar rows where weekday flag = 1 and start_date ≤ date ≤ end_date }
  ∪ { calendar_dates rows with date and exception_type = 1 }
  − { calendar_dates rows with date and exception_type = 2 }
```

### 5. Service day start
`serviceDayStart(date)` = epoch of **12:00 America/New_York on `date`, minus 43,200 s**.
Compute the New York offset at noon with `Intl.DateTimeFormat(..., { timeZone: 'America/New_York', timeZoneName: 'shortOffset' })`.
Unit-test 2026-11-01 (fall back) and 2027-03-14 (spring forward): on those days `serviceDayStart` is 23:00 or 01:00 local, not midnight. That's correct per GTFS.

### 6. Build a day slice
1. Trips whose `service_id` is active on the date.
2. Group their `stop_times` by `trip_id`, sort by `stop_sequence`, parse `HH:MM:SS` → seconds (hours may be ≥ 24).
3. **Patterns:** group trips by `routeId + stopIds.join('|')`.
4. Sort each pattern's trips by `dep[0]`.
5. **FIFO check:** trip B after trip A must not depart any stop earlier than A. On a violation, move B into a new sub-pattern (greedy: first sub-pattern where it fits). Pattern ids: `${routeId}:${n}`.
6. `key` = trip ID after the first `_` (see [mta-data-facts.md](mta-data-facts.md#trip-ids)). Assert keys are unique within the day.
7. Write JSON, gzip, hash.

Expected size: ~8–9k trips, ~250k stop times per weekday. Target ≤ 1.5 MB gzipped per day. If it's bigger, delta-encode times within each trip (`[first, +d1, +d2…]`). Measure first; don't optimize early.

### 7. Publish (Milestone 3)
Upload changed files to Cloudflare R2 (S3-compatible API), then upload `manifest.json` **last**, so clients never see a manifest pointing at missing files.

## Schedule
GitHub Actions cron every hour (`17 * * * *`). Step 1 exits early when nothing changed.
If the repo is private, watch the Actions minute budget (2,000/month free).

## Commands
```
npm run pipeline -- --date 20261019 --out dist      # one day, local
npm run pipeline -- --all --out dist                # full bundle
npm run pipeline -- --all --publish                 # M3+
```
