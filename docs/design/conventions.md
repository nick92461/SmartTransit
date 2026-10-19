# Conventions

## Repository layout

```
SmartTransit/
├─ package.json            npm workspaces root (scripts: test, typecheck, lint, format)
├─ tsconfig.base.json      shared strict TS settings
├─ packages/
│  └─ core/                @smarttransit/core: pure TypeScript, NO platform APIs
├─ tools/
│  ├─ gtfs-pipeline/       @smarttransit/gtfs-pipeline: Node scripts, MTA files → data bundle
│  ├─ cli/                 @smarttransit/cli: plan trips from the terminal (dev tool)
│  └─ feed-recorder/       @smarttransit/feed-recorder: saves live feed snapshots for replay
├─ services/
│  └─ api/                 @smarttransit/api: Cloudflare Worker
├─ apps/
│  └─ mobile/              Expo app
├─ fixtures/               small test data committed to git (synthetic networks, a few recorded feeds)
├─ data/raw/               big downloads + recordings (git-ignored)
└─ docs/
```

**Package manager: npm workspaces** (npm 11 is already installed; fewer Metro/Expo quirks than pnpm).

## Package boundaries (the most important rule)

```
apps/mobile ──┐
services/api ─┼──► packages/core   (core imports nothing from the others)
tools/* ──────┘
```

`packages/core` must run unchanged in **Hermes (iPhone), Cloudflare Workers, and Node**. Therefore core code must not use:
`fs`, `path`, `process`, `Buffer`, Node streams, `fetch`, timers, `Date.now()` (inject `now`), DOM APIs, React.
Core functions take data in and return data out. I/O lives in the app, server, and tools: the "functional core, imperative shell" pattern.

Core has **no runtime dependencies** (it even has its own small protobuf reader). Adding one needs a decision log entry.
Dev dependencies (Vitest, TypeScript) are fine.

## TypeScript
- `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: false`.
- ES modules everywhere (`"type": "module"`).
- Prefer `type`/`interface` + plain functions over classes. Discriminated unions for variants (`kind: 'walk' | 'ride'`).
- No `any`. Use `unknown` at boundaries and validate.
- File names: `kebab-case.ts`. Types: `PascalCase`. Functions/vars: `camelCase`. Constants: `UPPER_SNAKE`.
- One concept per file; `index.ts` per folder re-exports the public API.

## Time (read this twice)
- **Internal time = Unix epoch seconds (`EpochSec`, a number).** Never `Date` objects in core logic.
- **Durations = seconds (`Sec`).**
- **Schedule times** in day slices are seconds since the slice's `serviceDayStart`. GTFS defines that as
  *noon minus 12 hours* in America/New_York on the service date. That's midnight except on DST-change days.
  Times can exceed 24:00:00 (a 25:30 trip belongs to the previous service day).
  `epoch = slice.serviceDayStart + secs`. The pipeline computes `serviceDayStart`, so the app never does timezone math for schedules.
- **Display:** always America/New_York via `Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' })`. Lives in core `format/`.
- `now` is always a parameter. Tests pass fixed times.
- DST test dates: **2026-11-01** (fall back) and **2027-03-14** (spring forward).

## IDs
- `StopId`: GTFS child stop = station + direction, e.g. `A27N`. This is what trains stop at.
- `StationId`: GTFS parent stop, e.g. `A27`. Transfers and entrances attach here.
- `RouteId`: GTFS route, e.g. `A`, `GS`, `6X`.
- `TripKey`: the realtime-matchable part of a trip ID. See [mta-data-facts.md](mta-data-facts.md#trip-ids).
- Inside the router, IDs are mapped to dense integers for speed. Integers never leave the router.

## Configuration
All tunable numbers live in **one file: `packages/core/src/config.ts`**, exported as a frozen `DEFAULT_CONFIG` object with a `Config` type.
Functions that need settings take `config: Config` as a parameter, so tests and replays can override values. See the table in [data-model.md](data-model.md#config).

## Errors
- Expected failures (no route, stale feed, location unavailable) are **values**, not exceptions:
  `type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }`.
- Throw only for programmer bugs (broken invariants).
- Every user-visible failure has copy in the NYC voice (see `copy/`).

## Testing rules
- Every core module gets a `*.test.ts` next to it (Vitest).
- Small **synthetic fixture networks** (hand-written, 5–10 stations) for algorithm tests; expected answers worked out by hand in a comment.
- **Golden tests** on a real day slice + recorded feed for end-to-end sanity (in `fixtures/`).
- Tests never hit the network.

## Git
- Work on `dev`. Merge to `main` only when the owner says so.
- Commit after each completed step from the implementation plan: `M1.4: build network.json from GTFS`.
