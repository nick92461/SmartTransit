# Data model

The shared vocabulary. These types live in `packages/core/src/model/` and are imported by everything else.
Field names here are the real names to use in code.

## Primitives

```ts
export type EpochSec = number;      // Unix seconds
export type Sec = number;           // duration in seconds
export type ServiceDate = string;   // "20261019"
export type StopId = string;        // "A27N": platform-direction stop
export type StationId = string;     // "A27": parent station
export type RouteId = string;       // "A", "GS", "6X"
export type TripKey = string;       // "090500_A..N55R"
export interface LatLon { lat: number; lon: number }

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```

## Network (`network.json`, changes rarely)

```ts
export interface Network {
  version: string;                     // pipeline build id, e.g. "2026-10-19T15:00Z-ab12cd"
  stations: Record<StationId, Station>;
  stops: Record<StopId, Stop>;
  routes: Record<RouteId, Route>;
  transfers: Transfer[];
  entrances: Entrance[];
  shapes: Record<string, string>;      // shapeId → Google encoded polyline (simplified)
}

export interface Station {
  id: StationId;
  name: string;                        // "Times Sq-42 St"
  location: LatLon;
  complexId: string;                   // stations in one complex share this
  borough: string;                     // "M", "Bk", "Q", "Bx", "SI"
  northLabel: string;                  // "Uptown", "Manhattan", "Last Stop"…
  southLabel: string;
  platformBufferSec: Sec;              // entrance → platform time (default 60, deep stations more)
  stopIds: StopId[];                   // children, e.g. ["A27N","A27S"]
}

export interface Stop { id: StopId; stationId: StationId; direction: 'N' | 'S' }

export interface Route {
  id: RouteId; shortName: string; longName: string;
  color: string; textColor: string;    // hex without '#'
}

export interface Transfer { from: StationId; to: StationId; minSec: Sec }  // from === to allowed

export interface Entrance {
  stationId: StationId; location: LatLon;
  type: string;                        // "Stair" | "Elevator" | "Escalator" | …
  entry: boolean; exit: boolean;
}
```

## Timetable day slice (`day-YYYYMMDD.json.gz`)

```ts
export interface DaySlice {
  serviceDate: ServiceDate;
  serviceDayStart: EpochSec;           // noon − 12h, America/New_York
  source: 'supplemented' | 'regular';
  feedVersion: string;                 // MTA feed_info.feed_version + download timestamp
  patterns: Pattern[];
}

/** A RAPTOR "route": trips that visit exactly the same stop sequence. */
export interface Pattern {
  id: string;                          // stable within a slice, e.g. "A:12"
  routeId: RouteId;
  stopIds: StopId[];
  shapeId: string | null;
  trips: PatternTrip[];                // sorted by dep[0] ascending; FIFO (no overtaking) within a pattern
}

export interface PatternTrip {
  key: TripKey;
  headsign: string;                    // "Far Rockaway-Mott Av"
  arr: Sec[];                          // seconds since serviceDayStart, same length as stopIds
  dep: Sec[];
}
```

If two trips in a pattern overtake each other (an express that skips nothing but runs faster), the pipeline
**splits the pattern** so FIFO holds. RAPTOR's trip scan depends on it.

## Realtime

```ts
export type FeedName = 'gtfs-ace' | 'gtfs-bdfm' | 'gtfs-g' | 'gtfs-jz' | 'gtfs-nqrw' | 'gtfs-l' | 'gtfs' | 'gtfs-si';

export interface RealtimeSnapshot {
  fetchedAt: EpochSec;                         // when our server fetched
  feedTimestamps: Partial<Record<FeedName, EpochSec>>;  // MTA header timestamps
  trips: RtTrip[];
}

export interface RtTrip {
  tripId: string;                              // raw realtime trip_id (= TripKey form)
  routeId: RouteId;
  startDate: ServiceDate;
  assigned: boolean;                           // NYCT is_assigned
  trainId: string | null;
  stops: RtStopTime[];                         // future stops only, in order
}

export interface RtStopTime {
  stopId: StopId;
  arr: EpochSec | null;
  dep: EpochSec | null;
  schedTrack: string | null;
  actualTrack: string | null;
}

export interface ServiceAlert {
  id: string;
  routeIds: RouteId[]; stationIds: StationId[];
  activePeriods: { start: EpochSec; end: EpochSec | null }[];
  header: string;                              // MTA text, never shown raw in the main UI
  isPlannedWork: boolean;
}
```

## Trip requests and results

```ts
export type TripMode =
  | { kind: 'now' }
  | { kind: 'leaveAt'; at: EpochSec }
  | { kind: 'arriveBy'; by: EpochSec };

export interface Place { name: string; location: LatLon }

/** Walking time from a place to a station (or the reverse), already including platformBufferSec. */
export interface AccessPath {
  stationId: StationId;
  entrance: Entrance;
  walkSec: Sec;                    // street walk only (from MapKit or estimate)
  totalSec: Sec;                   // walkSec + station.platformBufferSec
  source: 'mapkit' | 'estimate';
}

export interface WalkLeg {
  kind: 'walk';
  from: LatLon; to: LatLon;
  toEntrance: Entrance | null;     // set when walking to a station
  departAt: EpochSec; arriveAt: EpochSec;
  walkSec: Sec;                    // street walking
  bufferSec: Sec;                  // platform buffer included in this leg
}

export interface RideLeg {
  kind: 'ride';
  routeId: RouteId;
  tripKey: TripKey;
  headsign: string;
  boardStop: StopId; alightStop: StopId;
  departAt: EpochSec; arriveAt: EpochSec;
  stopCount: number;               // stops ridden (alight index − board index)
  track: string | null;            // scheduled track at boarding stop, if known from realtime
  realtime: boolean;               // times come from live predictions
  assigned: boolean;               // train has actually started its run
  shapeId: string | null;
}

export interface TransferLeg {
  kind: 'transfer';
  fromStop: StopId; toStop: StopId;
  sec: Sec;
}

export type Leg = WalkLeg | RideLeg | TransferLeg;

export interface Journey {
  id: string;                      // stable hash of (ride legs' tripKeys + stops)
  legs: Leg[];
  leaveAt: EpochSec;               // when to leave the origin
  arriveAt: EpochSec;              // at the destination
  rideCount: number;               // transfers = rideCount − 1
  walkSec: Sec;                    // total street walking
  walkOnly: boolean;               // "just walk" option
}

export type Feasibility =
  | { kind: 'comfortable' }                 // leave time still ahead
  | { kind: 'runForIt'; jogSec: Sec }       // only makeable at jog pace
  | { kind: 'missed' };

export interface RankedOption {
  journey: Journey;
  feasibility: Feasibility;
  isBest: boolean;
}

export interface OptionsResult {
  generatedAt: EpochSec;
  mode: TripMode;
  options: RankedOption[];                  // best first
  noneMeetsGoal: { fastest: Journey; lateBySec: Sec } | null;
  scheduleOnly: boolean;                    // true when the trip is beyond the realtime horizon
  realtimeStale: boolean;                   // snapshot too old; schedule used
}
```

## Active trip (on the phone)

```ts
export type TripPhase =
  | { kind: 'toStation'; legIndex: number }
  | { kind: 'waiting'; legIndex: number }             // at/near platform, ride leg next
  | { kind: 'riding'; legIndex: number }
  | { kind: 'transferring'; legIndex: number }
  | { kind: 'toDestination'; legIndex: number }
  | { kind: 'arrived' }
  | { kind: 'ended'; reason: 'user' | 'arrived' | 'expired' };

export interface MissedQuestion {
  rideLegIndex: number;
  askedAt: EpochSec;
  answer: 'yep' | 'missed' | 'notYet' | null;
}

export type RepairKind = 'sameLine' | 'samePlatformOtherLine' | 'resolveLater' | 'fullReplan';

export interface RepairRecord {
  at: EpochSec;
  kind: RepairKind;
  before: Journey;
  after: Journey;
  addedSec: Sec;
}

export interface ActiveTrip {
  id: string;
  destination: Place;
  mode: TripMode;
  deadline: EpochSec | null;               // from arriveBy, else null
  journey: Journey;                        // current (possibly repaired) plan
  phase: TripPhase;
  pendingQuestion: MissedQuestion | null;
  alternatives: Journey[];                 // only those that beat the patched route
  repairs: RepairRecord[];
  lastUpdatedAt: EpochSec;
}

/** Inputs to the trip state machine (see trip-lifecycle.md). */
export type TripEvent =
  | { kind: 'tick'; now: EpochSec }
  | { kind: 'location'; now: EpochSec; fix: LocationFix }
  | { kind: 'realtime'; now: EpochSec; snapshot: RealtimeSnapshot }
  | { kind: 'answer'; now: EpochSec; answer: 'yep' | 'missed' | 'notYet' }
  | { kind: 'userMissed'; now: EpochSec }                // "Missed it" button
  | { kind: 'chooseAlternative'; now: EpochSec; journeyId: string }
  | { kind: 'end'; now: EpochSec };

export interface LocationFix {
  at: EpochSec; location: LatLon;
  accuracyM: number;                       // > 100 m ≈ coarse (Wi-Fi/cell)
  motion: 'stationary' | 'walking' | 'running' | 'automotive' | 'unknown';
}

/** Side effects the shell must perform. Core never performs them itself. */
export type TripEffect =
  | { kind: 'notify'; title: string; body: string; priority: 'passive' | 'active' | 'timeSensitive'; actions?: ('yep' | 'missed' | 'notYet')[] }
  | { kind: 'updateLiveActivity'; content: LiveActivityContent }
  | { kind: 'endLiveActivity' }
  | { kind: 'reportToServer'; trip: ActiveTrip };
```

## Live Activity content

Kept small (APNs payloads max 4 KB). Times are epochs so the widget can render live countdowns itself.

```ts
export interface LiveActivityContent {
  headline: string;                // "Hustle. The C pulls in at 8:49."
  routeId: RouteId | null;         // for the colored bullet
  routeColor: string | null;
  stationName: string | null;
  primaryTime: EpochSec | null;    // the one time that matters right now (leave at / train at / arrive at)
  primaryLabel: string;            // "Leave by" | "Train" | "Arrive"
  arriveAt: EpochSec;
  lateBySec: Sec | null;
  struckTime: EpochSec | null;     // previous time, shown crossed out briefly after a change
  question: { rideLegIndex: number; text: string } | null;
}
```

## Departure picker

```ts
/** One row in the departure picker on an option's boarding step. */
export interface DepartureChoice {
  journey: Journey;                        // full journey if you take this departure
  routeId: RouteId;
  departAt: EpochSec;                      // from the boarding platform
  feasibility: Feasibility;                // can you still get there in time to board?
  lateBySec: Sec | null;                   // vs deadline (arrive-by only)
  isCurrent: boolean;                      // the option's own train
}
```

## Planned trip (on the phone)

```ts
export type PlanStatus = 'onTrack' | 'atRisk' | 'broken';   // UI: "On track" / "Cutting it close" / "Won't make it"

export interface PlannedTrip {
  id: string;                              // same id as the server plan
  name: string | null;                     // "Work"; null → use destination.name
  origin: Place;                           // required: not "current location"
  destination: Place;
  mode: Extract<TripMode, { kind: 'leaveAt' | 'arriveBy' }>;
  journey: Journey;                        // the chosen option (may be changed via picker/edit)
  status: PlanStatus;                      // last known, from the server or a local re-check
  scheduleOnly: boolean;                   // still beyond the realtime horizon
  createdAt: EpochSec;
  updatedAt: EpochSec;
}
```
Stored locally (persisted) and mirrored to the server as a `CommittedPlan`. Origin and destination places stay on the phone; the server only gets a short `label` for notification text.

## Committed plan (server)

```ts
export interface CommittedPlan {
  id: string;
  deviceId: string;
  label: string;                           // "Work" or the destination name, for notification copy
  mode: TripMode;
  deadline: EpochSec | null;
  journey: Journey;
  status: PlanStatus;
  lastNotifiedStatus: PlanStatus | null;
  liveActivityToken: string | null;        // per-activity APNs token once started
  createdAt: EpochSec;
  expiresAt: EpochSec;                     // journey.arriveAt + 1 h
}

export interface PlanEvaluation {
  projectedArriveAt: EpochSec;
  brokenAtLeg: number | null;              // first ride leg that can no longer be caught
  meetsDeadline: boolean | null;           // null when no deadline
  status: PlanStatus;
}
```

## Config

`packages/core/src/config.ts`. Starting values; tune with feed replays and record changes in decisions.md.

| Key | Default | Meaning |
|---|---|---|
| `walkSpeedMps` | 1.2 | Fallback walking speed when MapKit isn't available (Apple-like, conservative) |
| `walkDetourFactor` | 1.3 | Straight-line → street distance multiplier for estimates |
| `jogSpeedFactor` | 1.6 | Jogging is this much faster than walking ("run for it" cutoff) |
| `defaultPlatformBufferSec` | 60 | Entrance → platform when no station-specific value |
| `samePlatformTransferSec` | 60 | Switching trains at the same `StopId` |
| `accessRadiusM` | 1500 | Search radius for origin/destination stations |
| `maxAccessStations` | 8 | Closest N stations considered at each end |
| `maxRides` | 4 | RAPTOR rounds (≤ 3 transfers) |
| `optionsWindowSec` | 3600 | How far past the start time to look for options |
| `runForItLookbackSec` | 300 | In "now" mode, also consider trains whose leave time just passed (run-for-it candidates) |
| `maxOptions` | 5 | Options shown |
| `arriveByBufferSec` | 180 | Arrive this early for an arrive-by goal |
| `walkOnlyMaxSec` | 1800 | Offer "just walk" when it's within this time and competitive |
| `realtimeHorizonSec` | 1800 | Beyond this, results are `scheduleOnly` |
| `realtimeStaleSec` | 120 | Snapshot older than this → `realtimeStale` |
| `unassignedExtraBufferSec` | 60 | Extra margin when boarding a not-yet-started train |
| `repairStabilityMarginSec` | 120 | Keep the patch if within this of the best fresh plan |
| `alternativesThresholdSec` | 600 | Look for alternatives when a repair adds more than this |
| `notifyMinShiftSec` | 180 | Smaller time shifts update silently |
| `missedHighConfidence` | 0.8 | Act silently above this |
| `missedLowConfidence` | 0.2 | Assume boarded below this; ask in between |
