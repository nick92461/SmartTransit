# Realtime (`packages/core/src/realtime/`)

## 1. Decoding: our own small protobuf reader

The MTA feeds are protobuf (GTFS-RT) plus the **NYCT extension (field 1001)**, which carries `is_assigned` and tracks.
Standard GTFS-RT libraries drop extension fields, and full protobuf libraries are heavy. So core gets a **small wire-format reader**:

- `protobuf/reader.ts`: varint, length-delimited, fixed32/64; iterate `(fieldNumber, wireType, value)`. ~80 lines. Works on `Uint8Array` (Hermes, Workers, and Node all have it).
- `gtfs-rt/decode.ts`: maps field numbers to our types, decoding only what we use:

| Message | Fields used |
|---|---|
| FeedMessage | 1 header, 2 entity |
| FeedHeader | 3 timestamp |
| FeedEntity | 1 id, 3 trip_update, 5 alert |
| TripUpdate | 1 trip, 2 stop_time_update |
| TripDescriptor | 1 trip_id, 3 start_date, 5 route_id, **1001 → NyctTripDescriptor { 1 train_id, 2 is_assigned, 3 direction }** |
| StopTimeUpdate | 2 arrival, 3 departure, 4 stop_id, **1001 → NyctStopTimeUpdate { 1 scheduled_track, 2 actual_track }** |
| StopTimeEvent | 2 time |
| Alert | 1 active_period, 5 informed_entity, 10 header_text (+ Mercury extension, verify in M3) |

Validate against `fixtures/rt/*.pb` (recorded feeds) with expected counts in the test.
This replaces the `gtfs-realtime-bindings` dependency from the earlier stack.

## 2. Merging feeds
`buildSnapshot(feeds: { name: FeedName; bytes: Uint8Array }[], fetchedAt) → RealtimeSnapshot`.
Runs on the **server** every ~30 s. The app receives the snapshot as gzipped JSON from `/v1/realtime`, so it never decodes protobuf (but could, since core can).

## 3. Matching realtime trips to the schedule (`match.ts`)

For each `RtTrip`, against the slice for `startDate`:
1. **Exact:** `tripId` equals a schedule `TripKey`. (~77%)
2. **Loose:** compare `{time}_{route3}{dir}` (drop the path code). Accept only if exactly one scheduled trip has that loose key. (~11%)
3. **Otherwise: realtime-only trip** (~11%: added or rerouted trains).

Never fuzzy-match on nearby times.

## 4. Overlaying onto the timetable (`overlay.ts`)

`applyRealtime(base: TimetableIndex, snapshot, now, config) → TimetableIndex` (a new index; base untouched).

- **Matched trip:** copy its times; for each `RtStopTime`, overwrite `arr`/`dep` at that stop's position (use `dep ?? arr`, `arr ?? dep`).
  - Pattern stops **before** the first realtime stop: already passed; leave as is (they're in the past).
  - Pattern stops **after** the first realtime stop but missing from the update: the train skips them → `Infinity`.
  - Set `realtime = true`, `assigned`, `tracks`.
- **Realtime-only trip:** new single-trip pattern from its own stop list. `headsign` = name of the last stop's station.
- **FIFO repair:** after overlaying, if a trip now overtakes its neighbor in the pattern, move it to its own single-trip pattern.
- **Staleness:** a feed whose header timestamp is older than `realtimeStaleSec` is ignored (its trips keep schedule times) and the result is flagged `realtimeStale`.
- Trips in the schedule that are missing from the feed are **kept** (schedule times). Possible later policy: treat them as cancelled within ~20 min of departure, but only if replay data proves it's accurate.

## 5. Same platform
Used by route repair step 2 ("take the C on the same platform").

```
samePlatform(tripA, tripB, stop) =
  same StopId
  AND tracks known for both at that stop (scheduled_track)
  AND (trackA === trackB OR crossPlatform.has(stop, trackA, trackB))
```
- Unknown track → **false**. Repair falls through to step 3, which still finds the C but includes the transfer time.
- `crossPlatform` = hand-curated `tools/gtfs-pipeline/data/cross-platform.json` for island platforms (express and local across the same platform). Starts empty; fill it from feed recordings and real rides.

## 6. Has the train left?
`departed(trip, stop, snapshot, now)`: the stop is gone from the trip's realtime stop list, or `dep < now − 30 s`.
Used by missed-train detection. The `notYet` answer overrides it for that trip.

## 7. Transport (server → app)
- `GET /v1/realtime` returns the `RealtimeSnapshot` as gzipped JSON with an `ETag`.
- The app polls every 30 s while it's in the foreground or a trip is active, sending `If-None-Match` (unchanged → `304`, no body).
- Expected size: ~150–300 KB gzipped. Measure in M3; if large, drop stops more than 90 min ahead.
