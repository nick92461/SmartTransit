# Router (`packages/core/src/router/`)

Finds subway journeys between two places. One algorithm, **Range RAPTOR**, serves all three modes.
Background reading: Delling, Pajor, Werneck, *Round-Based Public Transit Routing* (Microsoft Research, 2012). Sections 1–4 are enough.

## 1. Timetable index (`timetable.ts`)

Built once from `Network` + the loaded `DaySlice`s (yesterday, today, and tomorrow when needed), and rebuilt when realtime is applied (see [realtime.md](realtime.md)).

```ts
interface TimetableIndex {
  stopIds: StopId[];                         // int → StopId
  stopIndex: Map<StopId, number>;            // StopId → int
  patterns: IndexedPattern[];
  stopPatterns: { pattern: number; pos: number }[][];   // per stop: patterns serving it and the position
  footpaths: { to: number; sec: Sec }[][];   // per stop, transfers to *other* stops
}

interface IndexedPattern {
  id: string; routeId: RouteId; shapeId: string | null;
  stops: number[];
  trips: IndexedTrip[];                      // FIFO-sorted
}

interface IndexedTrip {
  key: TripKey; headsign: string;
  arr: EpochSec[]; dep: EpochSec[];          // ABSOLUTE epochs (serviceDayStart already added)
  realtime: boolean; assigned: boolean;
  tracks: (string | null)[] | null;          // scheduled track per stop, from realtime
}
```

- Patterns from different days stay separate (ids prefixed with the date). RAPTOR doesn't care.
- A stop the train **skips** (from realtime) has `arr = dep = Infinity`.
- **Footpaths** come from `network.transfers`:
  - `A → B` (A ≠ B): every child stop of A → every child stop of B, `minSec`.
  - `A → A`: between A's *different* children (N ↔ S), `minSec`.
- **Same-stop re-boarding** isn't a footpath. It's handled at boarding time with `samePlatformTransferSec` (below).

## 2. RAPTOR (`raptor.ts`), one departure

```ts
interface RaptorQuery {
  sources: { stop: number; readyAt: EpochSec; access: AccessPath }[];   // N and S children of each origin station
  targets: Map<number, { egress: AccessPath }>;                         // children of each destination station
  maxRides: number;
}
```

Per round `k` (k = number of rides) and stop `s`, keep:
- `arrRide[k][s]`: arrival at `s` by riding a train in round k.
- `ready[k][s]`: earliest time a passenger at `s` can board in round k+1:
  `min(arrRide[k][s] + samePlatformTransferSec, arrival via a footpath)`.
- `parent[k][s]`: how we got there (`{ kind: 'ride', pattern, trip, boardPos, alightPos }` or `{ kind: 'footpath', from, sec }` or `{ kind: 'source', i }`).

Algorithm (standard RAPTOR with *local and target pruning*):
```
round 0: ready[0][src.stop] = src.readyAt; mark sources
for k in 1..maxRides:
  Q = patterns serving marked stops (keep the earliest marked position per pattern)
  for each (pattern p, from pos):
    trip = none
    for pos .. end of p:
      s = p.stops[pos]
      if trip and trip.arr[pos] < min(arrRide[k][s], bestTargetArrival):   // pruning
        arrRide[k][s] = trip.arr[pos]; parent[k][s] = ride(...); mark s
      if ready[k-1][s] ≤ (trip ? trip.dep[pos] : ∞):
        trip = earliest trip in p with dep[pos] ≥ ready[k-1][s]       // binary search (FIFO makes this valid)
  ready[k][s] = arrRide[k][s] + samePlatformTransferSec for marked s
  relax footpaths from marked stops: ready[k][t] = min(ready[k][t], arrRide[k][s] + sec); mark t
  update bestTargetArrival = min over targets of arrRide[k][t] + egress.totalSec
  stop early if nothing marked
```
Result: for each k, the best arrival at the destination using ≤ k rides. Keep only those that improve on smaller k: a Pareto set over (arrival, rides).

**Reconstruction (`reconstruct.ts`):** walk `parent` pointers back from the target stop in round k → legs. Then build the `Journey`:
- `leaveAt` is computed **backward from the first train**: `firstRide.departAt − access.totalSec`, not from the query time. Users get the *latest* time to leave for that train.
- If the first ride's trip is not `assigned`, subtract `unassignedExtraBufferSec` too (leave a bit earlier).

**Test oracle:** a brute-force search on the tiny synthetic fixtures; RAPTOR must agree on every query.

## 3. Range RAPTOR (`range-raptor.ts`): a window of departures

To list *options* (several trains), run over a departure window `[t0, t1]`:
1. Collect every candidate leave time: for each source and each trip departing that source stop in the window, `dep − access.totalSec`.
2. Sort descending (latest first). Run the RAPTOR rounds for each candidate **without resetting labels** between runs (labels from later departures stay valid upper bounds). That's what makes it fast.
3. Each run that improves the destination arrival for some k yields a journey with that leave time.

Output: the Pareto set over (leave later, arrive earlier, fewer rides).
**Test oracle:** repeated single-departure RAPTOR for each candidate leave time; results must match.
**Performance target:** ≤ 300 ms per search on an iPhone (Hermes). Measure in Node in M1/M2 (Node is roughly 3–5× faster than Hermes).

## 4. Access and egress (`access.ts`)

1. Candidate stations: entrances within `accessRadiusM` (straight line; `entry` for origin, `exit` for destination). Nearest entrance per station, keep the `maxAccessStations` nearest stations.
2. Walking time per entrance:
   - **App:** MapKit walking ETA (native module, cached).
   - **CLI/tests/server:** estimate = `haversine × walkDetourFactor / walkSpeedMps`.
3. `totalSec = walkSec + station.platformBufferSec`.
4. Sources/targets = both direction children of each station.

Core takes access paths as **input** (`AccessPath[]`), so it never knows where walking times came from.

## 5. The three modes (`options.ts`)

```ts
function findOptions(input: {
  now: EpochSec; mode: TripMode;
  origin: Place; destination: Place;
  access: AccessPath[]; egress: AccessPath[];
  walkOnlySec: Sec | null;               // direct walk time, if known
  index: TimetableIndex; network: Network; config: Config;
  realtimeStale: boolean;
}): OptionsResult
```

| Mode | Window `[t0, t1]` | Keep | Best | Rest (in order) |
|---|---|---|---|---|
| now | `[now − runForItLookbackSec, now + optionsWindowSec]` | feasibility ≠ missed | earliest `arriveAt` | by `leaveAt` ascending |
| leaveAt X | `[X, X + optionsWindowSec]` | all | earliest `arriveAt` | by `leaveAt` ascending |
| arriveBy Y | `[max(now, Y − 2 h), Y]` | `arriveAt ≤ Y − arriveByBufferSec` | **latest** `leaveAt` | by `leaveAt` descending |

(`runForItLookbackSec` = 300, add to config.)

- **Ties** (arrivals within 60 s): fewer rides, then less walking, then later `leaveAt`.
- **Deduplicate** by first ride's `tripKey`: one option per train you'd run for.
- Cap at `maxOptions`.
- **Nothing meets an arrive-by goal:** `noneMeetsGoal = { fastest, lateBySec }` (fastest from `t0 = now`).
- **Walk-only:** include when `walkOnlySec ≤ walkOnlyMaxSec` and it arrives no later than the best train + 120 s (it can become the best option). Parity with Apple Maps.
- `scheduleOnly` = the best option's `leaveAt > now + realtimeHorizonSec`.

### Feasibility (now mode)
`slack = journey.leaveAt − now`
- `slack ≥ 0` → `comfortable`
- `slack ≥ −access.walkSec × (1 − 1/jogSpeedFactor)` → `runForIt` (the walk is doable at jog pace)
- else `missed` (dropped from the list)

## 6. Special searches used by trip repair
- **From a stop:** sources = one stop with `readyAt` (the user is standing on that platform).
- **Onboard:** the user is on trip T. Sources = every later stop of T at its arrival time (they can get off anywhere). Used when a train will skip the user's stop (express/local switch).
- **From the current location:** normal access paths from a new origin.

All three are plain `RaptorQuery` inputs. No special algorithm code.

## 7. Departure picker (`departures.ts`)

```ts
function departuresFromPlatform(input: {
  journey: Journey;                // the option being viewed
  now: EpochSec; deadline: EpochSec | null;
  egress: AccessPath[];
  index: TimetableIndex; network: Network; config: Config;
  windowSec?: Sec;                 // default optionsWindowSec
}): DepartureChoice[]
```
1. `S` = the journey's first ride board stop; `stationOf(S)` = its station.
2. Run **Range RAPTOR "from a stop"** with sources = the children of that station in the journey's direction, over `[firstRide.departAt − 20 min, firstRide.departAt + windowSec]`.
   Every line from that platform is included, not just the planned one.
3. For each resulting journey: prepend the original access walk, so `leaveAt = departAt − access.totalSec`.
   Compute `feasibility` (same rules as router §5) and `lateBySec` vs `deadline − arriveByBufferSec`.
4. Drop `missed` rows. Sort by departure time. One row per first-ride trip. Mark the journey's own train `isCurrent`.

Picking a row replaces the option's journey (and, for a planned trip, triggers `PATCH /v1/plans/:id`).
