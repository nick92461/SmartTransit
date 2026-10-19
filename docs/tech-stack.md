# Tech stack

## Languages
- **TypeScript** (~90%): app, server, routing engine, data pipeline.
- **Swift / SwiftUI**: Live Activity widget and a bridge to MapKit walking directions and place search.
- **SQL**: a few server tables.

## Monorepo
- **pnpm workspaces** (or npm workspaces)
- **GitHub + GitHub Actions** for CI and the scheduled data pipeline
- ESLint, Prettier, TypeScript strict mode

## iPhone app — `apps/mobile`

| Need | Choice |
|---|---|
| Framework | **React Native + Expo** (development builds, not Expo Go) |
| Screens / navigation | **Expo Router** |
| Map | **react-native-maps** (Apple Maps on iOS) |
| Walking directions + place search | Small **Swift module** (Expo Modules API) calling MapKit `MKDirections` / `MKLocalSearch` |
| Location (incl. background) | **expo-location** + **expo-task-manager** |
| Notifications | **expo-notifications** |
| Lock screen / Dynamic Island | **Swift + SwiftUI** with ActivityKit + WidgetKit, added via **expo-apple-targets** |
| On-device storage | **expo-sqlite** |
| App state | React state + **Zustand** |
| Styling | Plain React Native `StyleSheet` |

## Routing engine — `packages/core`
Pure TypeScript, no platform code, so it runs on phone, server, and in tests on Windows.
- **RAPTOR** router (subway only, transfers included)
- GTFS-Realtime decoding via **gtfs-realtime-bindings**
- Mode ranking (Now / Leave at / Arrive by), "can I make it / run for it" logic
- Copy generator (NYC voice)

## Server — `services/api`

| Need | Choice |
|---|---|
| Runtime | **Cloudflare Workers** (TypeScript) |
| MTA feed polling (~30 s) | **Durable Object** with an alarm, holding the latest snapshot |
| Committed plans + push tokens | **Cloudflare D1** (SQLite) |
| Push + Live Activity updates | Direct to **APNs**, token-based auth (.p8 key) |
| Static data files | **Cloudflare R2** |

⚠️ To verify: APNs requires HTTP/2. If Workers can't connect, move only push sending to **Deno Deploy** (free tier).

## Data pipeline — `tools/gtfs-pipeline`
Node/TypeScript script on a GitHub Actions schedule: download MTA static GTFS + entrances → preprocess → upload to R2.

## Testing
See [testing.md](testing.md). **Vitest**, **Jest (jest-expo) + React Native Testing Library**, **Maestro** on EAS Workflows.

## Build & ship
- **EAS Build**: iOS builds in the cloud (no Mac)
- **EAS Submit**: TestFlight / App Store
- **EAS Update**: over-the-air fixes to the app's TypeScript code
- **Sentry** (free tier): crash reporting (optional)
