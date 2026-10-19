# Tech stack

Summary. Details and reasons are in [design/](design/README.md) and [decisions.md](decisions.md).

## Languages
- **TypeScript** (~90%): app, server, routing engine, data pipeline, dev tools.
- **Swift / SwiftUI**: MapKit bridge module; Live Activity pieces that expo-widgets can't cover.
- **SQL**: D1 schema.

## Monorepo
- **npm workspaces** (npm 11, already installed)
- **GitHub + GitHub Actions** for CI and the scheduled data pipeline
- ESLint (flat config), Prettier, TypeScript strict mode

## Routing engine: `packages/core`
Pure TypeScript that runs unchanged in Hermes, Cloudflare Workers, and Node. **No runtime dependencies.**
- RAPTOR + Range RAPTOR router
- Own small **protobuf reader** for GTFS-RT + the NYCT extension (replaces `gtfs-realtime-bindings`)
- Realtime matching/overlay, options ranking, feasibility/run-for-it
- Trip state machine, route repair, notification policy, missed-train scorer, plan evaluation
- Copy generator (NYC voice), NYC time formatting

## Data pipeline: `tools/gtfs-pipeline`
Node + **fflate** (unzip) + **csv-parse** (streaming CSV). Output: `network.json.gz`, per-day slices, `manifest.json`. Publishes to R2.

## Dev tools: `tools/cli`, `tools/feed-recorder`, `tools/replay`
Node scripts using core.

## Server: `services/api`

| Need | Choice |
|---|---|
| Runtime | **Cloudflare Workers** (Paid plan, $5/mo, for CPU headroom) |
| HTTP routing | **Hono** |
| Feed polling (~30 s) + monitor | **Durable Object** (`FeedPoller`) with alarms |
| Devices, plans, telemetry | **D1** (SQLite) |
| Data bundle | **R2** |
| Push | Direct to **APNs** (JWT via WebCrypto); fallback relay on **Deno Deploy** if HTTP/2 fails |
| Tests | **Vitest + @cloudflare/vitest-pool-workers** |

## iPhone app: `apps/mobile`

| Need | Choice |
|---|---|
| Framework | **React Native + Expo** (latest SDK; development builds), iOS 17.2+ |
| Navigation | **Expo Router** |
| Map | **react-native-maps** (Apple Maps). expo-maps is still alpha |
| Search + walking | Own **Swift Expo module** over MapKit (`MKLocalSearchCompleter`, `MKDirections`) |
| Location | **expo-location** + **expo-task-manager** |
| Motion | **expo-sensors** or Core Motion via the Swift module (spike in M5) |
| Notifications | **expo-notifications** (with action buttons) |
| Live Activity | **expo-widgets**; small Swift target via **expo-apple-targets** only if needed for intent buttons |
| State | **Zustand** |
| Storage | **expo-sqlite** (key-value), **expo-file-system** (data files), **expo-secure-store** (device secret) |
| Tests | **Jest (jest-expo) + React Native Testing Library**; **Maestro** E2E on EAS Workflows |

## Build & ship
- **EAS Build** (iOS builds in the cloud, no Mac), **EAS Submit**, **EAS Update** (over-the-air fixes)
- **Sentry** (free tier), optional
