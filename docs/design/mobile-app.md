# Mobile app (`apps/mobile`)

Expo (latest stable SDK when M4 starts; SDK 58 as of 2026-10), React Native, TypeScript, **development builds** (not Expo Go).
**Minimum iOS: 17.2** (needed for interactive Live Activities and push-to-start). iPhone only.

## Screens (Expo Router, `app/`)

| Route | Screen | Contents |
|---|---|---|
| `_layout.tsx` | Root | Providers, data bootstrap (manifest → network → day slices), notification response handler, deep links |
| `index.tsx` | **Home** | **Upcoming** planned-trip cards (status: On track / Cutting it close / Won't make it), "Where to?" field, saved place chips, mode chip (Now / Leave at / Arrive by), then the **options list** |
| `search.tsx` | Search (modal) | MapKit autocomplete; sets **To**, or **From** (From appears for leave-at/arrive-by; defaults to current location for "now", a saved place otherwise) |
| `option/[id].tsx` | Option detail | Map with the full route + entrance pins; leg list; **departure picker** on the boarding step; **Go** (now) or **Save trip** (future) |
| `trips/[id].tsx` | Planned trip | The saved plan, status, far-future notice, departure picker, edit (goal/time/From/To), delete; "Here's what works now" options on top when broken |
| `trip.tsx` | Active trip | Map following the user; big current-step card; upcoming steps; "Missed it" button; alternatives; End |
| `missed.tsx` | Missed it (modal) | Only for `fullReplan` from a miss: "Damn, you missed it. Here are your options." |
| `settings.tsx` | Settings | Saved places, notifications/location permission status, attribution (MTA data, Apple Maps) |

Deep links: `smarttransit://trip/<id>` (from "won't make it" and "time to go" notifications) → the planned trip screen.

## Components (`components/`)
`OptionCard`, `UpcomingTripCard`, `DeparturePicker` (scroll wheel of `DepartureChoice`s; live arrival + late warning), `LineLabel` (colored bullet **plus the words** "A train"; never a bare bullet; VoiceOver label "A train"), `TimeText` (animates changes, briefly shows the old time struck through), `ModeChip`, `Countdown`, `LegList`, `RouteMap`.

Design: system font, lots of white space, **one big time per card**, route colors from `network.routes`. Dark mode. Dynamic Type.

## State (Zustand stores, `stores/`)

| Store | Holds | Notes |
|---|---|---|
| `useDataStore` | manifest, network, loaded slices, base `TimetableIndex` | Rebuilds the index when slices change |
| `useRealtimeStore` | snapshot, ETag, lastFetchedAt, stale flag, realtime-applied index | Applies `applyRealtime` when a new snapshot arrives |
| `useSearchStore` | origin (current location), destination, mode | |
| `useOptionsStore` | `OptionsResult`, refresh timers | Calls `findOptions` / `refreshFeasibility` / `mergeOptions` |
| `useTripStore` | `ActiveTrip` | `dispatch(event)` → `tripReducer` → runs effects via the effect executor |
| `usePlannedTripsStore` | `PlannedTrip[]` | Persisted; syncs with `/v1/plans`; local `evaluatePlan` re-check when the app is open |
| `usePlacesStore` | saved places (Home, Work…) | Persisted |
| `useDeviceStore` | deviceId/secret, push tokens | Secret in **expo-secure-store** |

Persistence: small state in **expo-sqlite**'s key-value store; data files in **expo-file-system** cache.

## Services (`services/`)
- **api.ts:** typed fetch wrapper for the server endpoints; adds auth; base URL from `EXPO_PUBLIC_API_URL`.
- **data-sync.ts:**
  - On launch, and daily: fetch the manifest and download missing files for days D−1…D+1.
  - Future dates are downloaded on demand when the user picks them.
  - Delete files no longer in the manifest.
- **realtime-poller.ts:** every 30 s while the app is in the foreground **or** a trip is active; `If-None-Match`.
- **location.ts:**
  - Foreground watch for search.
  - During a trip: `expo-location` background updates through `expo-task-manager`, best accuracy, `distanceInterval: 10`, `pausesUpdatesAutomatically: false`, blue indicator shown.
  - Converts readings into `LocationFix`.
- **motion.ts:** activity type (stationary/walking/running/automotive). Use Core Motion activity via the Swift module if `expo-sensors` can't give an activity type (spike in M5).
- **effects.ts:** runs `TripEffect`s:
  - `notify` → expo-notifications;
  - `updateLiveActivity` / `endLiveActivity` → Live Activity module;
  - `reportToServer` → api.
- **notifications.ts:** permission, push token, the category `TRAIN_CHECK` with actions Yep / Missed it / Not here yet; the response handler dispatches `answer` events.

## Native module: MapKit (`modules/mapkit`, Swift, Expo Modules API)

```ts
searchCompletions(query: string, near: LatLon): Promise<{ id: string; title: string; subtitle: string }[]>   // MKLocalSearchCompleter
resolveCompletion(id: string): Promise<Place>                                                              // MKLocalSearch
walkingEtas(from: LatLon, to: LatLon[]): Promise<(Sec | null)[]>                                           // MKDirections.calculateETA, sequential, throttled
walkingRoute(from: LatLon, to: LatLon): Promise<{ sec: Sec; distanceM: number; polyline: LatLon[] }>       // MKDirections.calculate
```
- Cache ETAs by (origin rounded to a ~25 m grid, entrance) for 10 min. Apple throttles heavy use per device.
- If MapKit fails or is throttled, fall back to the core estimate (`source: 'estimate'`).

## Live Activity
- **expo-widgets** (stable since SDK 56) for the Live Activity UI and its config plugin.
- Attributes: `{ tripId, destinationName }`. Content state: `LiveActivityContent` (see data-model).
- Lock screen: route bullet + headline + one big time (`Text(timerInterval:)` countdown) + arrive time. Dynamic Island compact: bullet + countdown.
- **Interactive buttons** (Yep / Missed it / Not here yet) need App Intents. **Spike in M5:** if expo-widgets can't do intent buttons, add a small Swift widget target with expo-apple-targets for that piece. Notification action buttons work either way.
- Push token updates for the activity → `PATCH /v1/plans/:id { liveActivityToken }`.

## Routing performance
Core runs on the JS thread. Target ≤ 300 ms per search on device.
If slower: (1) cache the index, (2) narrow the window, (3) move routing to a background JS runtime. Decide with measurements in M4; log it.

## Permissions copy (NYC voice, honest)
- Location (when in use): "So we know which station you're closest to."
- Background location (during a trip only): "So we can tell if you caught the train. Only while a trip is running."
- Notifications: "So we can tell you when your plan changes. No spam."

## Privacy
Location never leaves the phone. The server sees only plans (stations, trains, times) and anonymous device IDs.
