# Server (`services/api`)

One Cloudflare Worker, written in TypeScript with **Hono** (a small router built for Workers), plus a Durable Object and D1.
**Requires Workers Paid ($5/month):** decoding ~800 KB of protobuf every 30 s exceeds the free plan's 10 ms CPU limit.

## Components

```
                ┌──────────────────────── Worker (Hono) ─────────────────────────┐
 phone ──HTTPS─►│ /v1/manifest  /v1/data/*  ──► R2 bucket (pipeline output)       │
                │ /v1/realtime  /v1/alerts  ──► FeedPoller DO (in-memory snapshot)│
                │ /v1/devices   /v1/plans   ──► D1                                │
                └─────────────────────────────────────────────────────────────────┘
 FeedPoller DO (single instance "global"):
   alarm every 30 s → fetch 8 MTA feeds → core.buildSnapshot → keep in memory (+ DO storage for cold starts)
                    → every 2 min: alerts feed
                    → monitor: evaluate plans from D1 → APNs pushes
```

## Endpoints

| Method & path | Auth | Body → Response |
|---|---|---|
| `GET /v1/manifest` | none | → `Manifest` (cache 60 s) |
| `GET /v1/data/:file` | none | → R2 object (`Cache-Control: immutable`, hash in name) |
| `GET /v1/realtime` | none | → gzipped `RealtimeSnapshot`, `ETag`; `304` on `If-None-Match` match. Worker caches 10 s in the Cache API |
| `GET /v1/alerts` | none | → `ServiceAlert[]` |
| `POST /v1/devices` | none | `{ apnsToken, pushToStartToken?, appVersion, sandbox }` → `{ deviceId, deviceSecret }` |
| `PUT /v1/devices/me` | device | `{ apnsToken?, pushToStartToken?, appVersion? }` → `204` |
| `POST /v1/plans` | device | `{ kind: 'committed' \| 'active', mode, deadline, journey }` → `{ planId }` |
| `PATCH /v1/plans/:id` | device | `{ journey?, liveActivityToken?, heartbeat?: true, kind? }` → `204` |
| `DELETE /v1/plans/:id` | device | → `204` |
| `POST /v1/telemetry` | device | `{ events: { kind: 'notHereYet', tripKey, stopId, at }[] }` → `204` |

**Device auth:** `Authorization: Bearer <deviceId>.<deviceSecret>`. Store only `SHA-256(secret)` in D1. Anonymous: no accounts, no emails.
Validate every request body (a small hand-written validator per route, or **zod**; choose in M3 and log it).
Rate limit with Cloudflare's rate-limiting binding: 60 requests/min per device.

## D1 schema (`services/api/migrations/0001_init.sql`)

```sql
CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  secret_hash TEXT NOT NULL,
  apns_token TEXT,
  push_to_start_token TEXT,
  sandbox INTEGER NOT NULL DEFAULT 0,        -- dev builds use the APNs sandbox host
  app_version TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE plans (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('committed','active')),
  mode_json TEXT NOT NULL,
  deadline INTEGER,
  journey_json TEXT NOT NULL,
  leave_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'onTrack',
  broken_streak INTEGER NOT NULL DEFAULT 0, -- hysteresis counter
  last_notified_status TEXT,
  live_activity_token TEXT,
  heartbeat_at INTEGER,
  push_started INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX plans_due ON plans(expires_at, leave_at);

CREATE TABLE telemetry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL, trip_key TEXT, stop_id TEXT, at INTEGER NOT NULL
);
```

## Monitor loop (inside the FeedPoller alarm)
```
plans = SELECT * FROM plans WHERE expires_at > now AND leave_at < now + 6h
for plan in plans:
  ev = core.evaluatePlan(journey, sliceIndexFor(plan) or null, snapshot, deadline, now, config)
  update status + broken_streak
  if kind = committed and ev.status = broken and broken_streak ≥ 2 and last_notified_status ≠ broken:
      push alert (problem-only copy, time-sensitive, payload { planId })
  if kind = committed and not push_started and now ≥ leave_at − 600 and device.push_to_start_token:
      push-to-start Live Activity; push_started = 1
  if kind = active and heartbeat_at < now − 90 and live_activity_token:
      push Live Activity update (re-timed content, priority 5 unless the change is notify-worthy → 10)
DELETE FROM plans WHERE expires_at < now
```
- `sliceIndexFor(plan)`: when the manifest's hash for the plan's day changes, load that slice once (cached in DO memory) to check for trip keys that disappeared (planned work).
- Expected scale: hundreds of plans at most for a long time. One query per 30 s is fine.

## APNs (`apns.ts`)
- Token auth: JWT `ES256` signed with the `.p8` key via **WebCrypto** (`crypto.subtle.importKey('pkcs8', …, { name: 'ECDSA', namedCurve: 'P-256' })`). WebCrypto's raw `r‖s` signature is exactly the JWT format. Cache the JWT for 50 min.
- `POST https://api.push.apple.com/3/device/<token>` (sandbox: `api.sandbox.push.apple.com` for dev builds)
- Headers:
  - Alerts: `apns-push-type: alert`, `apns-topic: <bundleId>`.
  - Live Activity: `apns-push-type: liveactivity`, `apns-topic: <bundleId>.push-type.liveactivity`.
  - Always: `apns-priority: 5 | 10`.
- Live Activity payload: `{ aps: { timestamp, event: 'update' | 'start' | 'end', 'content-state': LiveActivityContent, … } }`.
- Budgets: Apple throttles priority-10 Live Activity pushes and push-to-start. **Use priority 5 for silent re-times; 10 only for notify-worthy changes.** Push-to-start only for committed plans.
- On `410 Unregistered`: clear that token in D1.

### ⚠️ Risk spike (first task of M3)
APNs requires **HTTP/2**. Confirm a Worker `fetch()` to APNs succeeds, using the sandbox and a dev build's token.
If it fails: deploy a tiny **Deno Deploy** relay (`POST /push` with a shared-secret header → APNs) and have `apns.ts` call it instead. Log the result in decisions.md.

## Secrets & config (`wrangler secret put`)
`APNS_KEY_P8`, `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_BUNDLE_ID`, (`PUSH_RELAY_URL`, `PUSH_RELAY_SECRET` if the fallback is used).
Bindings in `wrangler.jsonc`: `DB` (D1), `BUNDLE` (R2), `FEED_POLLER` (DO), `RATE_LIMITER`.

## Testing
- Pure parts (evaluatePlan, snapshot building, payload building) are core tests.
- Worker routes: **Vitest with `@cloudflare/vitest-pool-workers`** (runs tests in the real Workers runtime, locally on Windows).
- `wrangler dev` for manual testing; the app's dev build points at it via the `EXPO_PUBLIC_API_URL` environment variable.
