# Trip lifecycle (`packages/core/src/trip/`)

Everything that happens from showing options to arriving. All logic here is **pure** core code: events in, new state + effects out.
The app (and, for committed plans, the server) performs the effects.

```
 Browsing ──commit──► Committed ──departure time──► Active ──arrive/end──► Ended
 (options list)       (server watches)              (Go: state machine)
     └───────────────────────Go──────────────────────►┘
```

## 1. Options list (browsing)

`findOptions` (see [router.md](router.md#5-the-three-modes-optionsts)) runs:
- when the destination, mode, or time changes;
- when a new realtime snapshot arrives (~30 s);
- **not** on every clock tick. On a tick (every 5 s) the app only recomputes `feasibility` and countdowns with `refreshFeasibility(result, now, config)`.

Merging old and new results (`mergeOptions`), so the list doesn't jump around:
- Options are matched by `journey.id`. Existing ones keep their position; their times update in place.
- An option whose feasibility becomes `missed` is **removed silently**.
- New options are **appended at the bottom**.
- If the best option changes, move it to the top with an animation. That's the only reorder allowed.

## 2. Committed plans

User taps **"Watch this plan"** on an option (leave-at / arrive-by, or any trip more than ~10 min away):
1. App `POST /v1/plans` with the journey, mode, and deadline.
2. If `scheduleOnly`, show the far-future notice (copy: `copy.farFutureNotice`).
3. The server evaluates the plan with every snapshot (section 7) and sends a **problem-only** notification when it breaks.
4. Tapping that notification opens the app on the **options list** for the same destination and goal. The app re-searches; the server never picks a route.
5. At `leaveAt − 10 min`, the server push-starts the Live Activity (iOS 17.2+).
   The plan becomes active when the user taps Go (or automatically when the user taps into the Live Activity).

## 3. Active trip state machine (`reducer.ts`)

```ts
function tripReducer(trip: ActiveTrip, event: TripEvent, ctx: TripContext): { trip: ActiveTrip; effects: TripEffect[] }

interface TripContext {
  index: TimetableIndex;                 // with realtime applied
  network: Network;
  config: Config;
  recentFixes: LocationFix[];            // last ~10 min, newest last
  accessFrom: (location: LatLon) => AccessPath[];   // supplied by shell (MapKit-backed, cached)
}
```

Phases and transitions (`legIndex` points into `journey.legs`):

| Phase | Moves on when | To |
|---|---|---|
| `toStation` | good fix (accuracy ≤ 50 m) within 40 m of the target entrance, **or** GPS lost within 60 m of it | `waiting` |
| `toStation` | the train departs (section 6) | run missed-train detection |
| `waiting` | the train departs | detection: boarded → `riding`, missed → repair, unsure → ask |
| `riding` | `now ≥ ride.arriveAt` | `transferring` (more rides) or `toDestination` |
| `transferring` | next train departs | **assume boarded** → `riding` (underground, no GPS); "Missed it" button → repair |
| `toDestination` | fix within 50 m of destination, or `now > arriveAt + 10 min` | `arrived` → end Live Activity after 2 min |
| any | `end` event | `ended` |

On **every** event:
1. **Re-time** the journey from the index (realtime times for its trips).
2. **Check connections:** for each remaining transfer, `arrive + transfer ≤ next departure`, and the train still stops at the planned stops (not `Infinity`). The first failure → **repair** from that ride (section 4).
3. **Resurfacing check:** a good fix while `riding`/`transferring` that is > 400 m from where the plan expects the user → full re-plan from the current location (`fullReplan`, no "you missed it" wording). This also covers "boarded a different line".
4. Emit `updateLiveActivity` if the content changed, and `notify` per the notification policy (section 5).

## 4. Route repair (`repair.ts`)

```ts
function repairRoute(trip: ActiveTrip, brokenRide: number, now: EpochSec, ctx: TripContext):
  { journey: Journey; kind: RepairKind; addedSec: Sec; lateBySec: Sec | null; alternatives: Journey[] }
```

Let `ride` = the broken ride leg, `S` = its board stop, `readyAt` = when the user can board at S:
- on the platform / waiting / transferring → `max(now, previous arrival + transfer)`
- still walking (`toStation`) → `now + remaining walk estimate` (from the last fix)

Candidates (each is a full journey to the destination):

| Step | Candidate | How |
|---|---|---|
| 1 `sameLine` | Next trip of the **same route** at S (dep ≥ readyAt) that also stops at the planned alight stop | Swap the trip; re-time the rest of the journey; if a later connection breaks, re-solve the rest with a "from a stop" search |
| 2 `samePlatformOtherLine` | Trip of **another route** at S that is `samePlatform` (see [realtime.md](realtime.md#5-same-platform)) and stops at the alight stop | Same as above |
| 3 `resolveLater` | Best journey **from stop S** at readyAt | RAPTOR "from a stop" |
| 4 `fullReplan` | Best journey **from the current location** | Normal search with `accessFrom(currentLocation)` |

Selection:
```
fresh = step 3 result
allowFull = phase is toStation AND user is > 300 m from S's entrances
if allowFull: fresh = better of (step 3, step 4)

for c in [step 1, step 2]:
  if c exists and c.arriveAt ≤ fresh.arriveAt + repairStabilityMarginSec: choose c; stop
else choose fresh (kind = resolveLater or fullReplan)
```

After choosing:
- `addedSec = chosen.arriveAt − oldJourney.arriveAt`
- `lateBySec = deadline ? max(0, chosen.arriveAt − deadline) : null`. Keep the route even when late; the card says so.
- **Alternatives** are computed only if `addedSec > alternativesThresholdSec`, **or** the deadline is now missed and another route could still meet it.
  They come from a fresh search (location-based); keep those arriving **≥ 60 s earlier** than the chosen route, max 2.
  They're shown below the current plan. **Never switch automatically.** The `chooseAlternative` event switches.
- Append a `RepairRecord`. Only `fullReplan` from a miss shows the "Damn, you missed it. Here are your options." screen.

## 5. Notification policy (`notify-policy.ts`)

```ts
function describeChange(before: Journey, after: Journey, kind: RepairKind | 'retime', deadline: EpochSec | null, config: Config):
  { notify: boolean; title: string; body: string; priority: 'active' | 'timeSensitive' } | null
```

**Notify** when any of these is true:
- a ride's train changed (missed train or repair);
- the boarding stop changed, or a transfer was added, removed, or moved;
- `|after.arriveAt − before.arriveAt| ≥ notifyMinShiftSec`;
- deadline status flipped (on time ↔ late).

Otherwise: silent Live Activity update only.

- Priority: `timeSensitive` for a missed train or a newly missed deadline; `active` otherwise.
- At most one notification per 60 s per trip. Merge if more come.
- Text structure: **what changed → what it costs**. Examples in [../product.md](../product.md#notifications-when-the-route-changes).
- Directions: `toward {headsign}` by default; platform side as `{station.northLabel}`/`{southLabel}` ("Uptown").

## 6. Missed-train detection (`missed.ts`)

```ts
function missedProbability(input: {
  departAt: EpochSec;            // train's departure from the boarding stop
  station: Station; entrances: Entrance[];
  fixes: LocationFix[];          // from departAt − 5 min to now
  now: EpochSec;
}): number                       // 0 = surely boarded, 1 = surely missed
```

Start at 0.5 and add evidence (weights in a `MISSED_WEIGHTS` constant next to the function, tuned with replays):

| Evidence | Effect |
|---|---|
| Good fix (≤ 50 m) at/after `departAt`, > 150 m from every entrance | → 0.95 (decisive) |
| Last good fix before `departAt` was within 60 m of an entrance, then only coarse or no fixes | −0.30 |
| Coarse fixes from `departAt + 3 min` still within 300 m of the station | +0.30 |
| Coarse fixes moving away along the line (> 500 m) | −0.40 |
| Motion `automotive` after `departAt` | −0.20 |
| Motion `stationary`/`walking` on the street (good fix) | +0.10 |

Clamp to [0, 1]. Then:
- `≥ missedHighConfidence` → missed → repair silently (and notify per policy).
- `≤ missedLowConfidence` → boarded → `riding`.
- Between → **ask once per ride**: "Did you make the 8:49 C?" with actions **Yep · Missed it · Not here yet** (notification actions + Live Activity buttons).
  No answer in 3 min → assume boarded; keep the "Missed it" button visible.
- **Not here yet** → keep the same train as the target, treat it as not departed, keep watching the feed. Send `telemetry: notHereYet` to the server (data-quality signal).
- **Held train:** the train's departure keeps moving later in realtime → no detection runs until it actually departs.

## 7. Plan evaluation (server, committed plans) (`evaluate-plan.ts`)

```ts
function evaluatePlan(journey: Journey, index: TimetableIndex | null, snapshot: RealtimeSnapshot, deadline: EpochSec | null, now: EpochSec, config: Config): PlanEvaluation
```
- Re-time each ride from realtime when the trip is in the snapshot; otherwise keep scheduled times.
- Check each connection; the first impossible one sets `brokenAtLeg`.
- `projectedArriveAt` = re-timed arrival (or, if broken, `Infinity` and status `broken`).
- Status: `onTrack` if it meets `deadline − arriveByBufferSec` (or there's no deadline and nothing is broken); `atRisk` if it lands between that and the deadline; `broken` if it's after the deadline or a connection is broken.
- When a new day slice is published, also mark `broken` if any of the plan's trip keys disappeared from the schedule (planned work).
- **Hysteresis:** notify `broken` only after **two consecutive** broken evaluations (~1 min), so one noisy snapshot doesn't cry wolf. Optionally notify "Back on track" when it recovers after a broken notice.

## 8. Live Activity content (`live-activity.ts`)

`toLiveActivityContent(trip, now, config) → LiveActivityContent`

| Phase | primaryLabel / primaryTime | Headline example |
|---|---|---|
| `toStation`, slack > 0 | "Leave by" / `leaveAt` → then "Train" / board dep | "You've got time. Grab the coffee." |
| `toStation`, run-for-it | "Train" / board dep | "Hustle. The C pulls in at 8:49." |
| `waiting` | "Train" / board dep | "C to Euclid Av at 8:49" |
| `riding` | "Off at" / alight arr | "Ride 6 stops · off at Chambers St" |
| `transferring` | "Train" / next dep | "Switch to the 2 at 8:57" |
| `toDestination` | "Arrive" / `arriveAt` | "Almost there." |
| late | add `lateBySec` | "Bad news: you're gonna be 6 min late." |

`struckTime` = the previous `primaryTime` for 10 s after a change (the widget animates it).

## 9. Server fallback for the Live Activity
The phone is the brain during a trip. It reports the active trip (`reportToServer`) on start and after each repair, and sends a heartbeat with every realtime fetch.
If the heartbeat is more than 90 s old (the app was suspended), the server **re-times** the journey with `evaluatePlan` and pushes Live Activity updates. It never repairs routes; that needs the phone's location.

## 10. Copy (`copy/`)
- One function per situation (`leaveNow`, `runForIt`, `missedSameLine`, `lateBy`, `farFutureNotice`, `nothingMeetsGoal`, `planBroken`…), each returning a string.
- Several variants per situation; choose by `hash(journey.id + situation) % variants.length`, so the same trip always gets the same line (stable for tests and doesn't flicker).
- Voice: short, confident, NYC. Mild language at most ("Damn, you missed it" is the ceiling).
