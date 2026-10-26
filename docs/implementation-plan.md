# Implementation plan

The ordered build steps. **One step at a time. The owner types the code.** Each step is small enough for one or two sittings.
Tick the box when a step's "Done when" passes, and commit: `M1.4: build network.json`.

Format per step:
- **Goal:** what exists after this step
- **Learn:** concepts the step teaches (explain these before giving code)
- **Spec:** the design doc sections to follow
- **Done when:** the check that proves it works

Milestones M1–M2 are detailed. M3–M7 are outlined; **refine each with Opus at the start of the milestone** (it may need adjusting based on what earlier milestones taught us).

---

## M1: Feasibility spike (all on Windows)

Goal of the milestone: `npm run cli -- plan --from 40.7359,-73.9911 --to 40.7128,-74.0060` prints a correct
"Leave at… walk to… catch the… arrive at…" using today's schedule plus live trains.

- [x] **M1.1 Monorepo scaffold**
  - Goal: root `package.json` (npm workspaces: `packages/*`, `tools/*`, `services/*`, `apps/*`), `tsconfig.base.json`, Prettier, ESLint (flat config), `packages/core` with Vitest and one trivial test.
  - Learn: npm workspaces, TS project config, strict mode flags, ES modules, Vitest basics.
  - Spec: conventions.md (layout, TypeScript).
  - Done when: `npm test`, `npm run typecheck`, `npm run lint` all pass from the root.

- [ ] **M1.2 Core model types + config**
  - Goal: `packages/core/src/model/*.ts` and `config.ts` exactly as in data-model.md; `index.ts` exports.
  - Learn: discriminated unions, `Record`, `readonly`, `as const`, type-only imports.
  - Spec: data-model.md (all), conventions.md (config).
  - Done when: typecheck passes; one test constructs a `Journey` literal of each leg kind.

- [ ] **M1.3 Pipeline: download + unzip + CSV streaming**
  - Goal: `tools/gtfs-pipeline` downloads the supplemented + regular zips, stations CSV, entrances CSV to `data/raw/` with ETag caching; unzips; a `readCsv(path, onRow)` streaming helper.
  - Learn: Node `fetch`, conditional requests (ETag), streams, fflate, csv-parse.
  - Spec: data-pipeline.md §1–2.
  - Done when: running it twice shows "unchanged, skipping" the second time, and it prints row counts matching mta-data-facts.md.

- [ ] **M1.4 Pipeline: build network.json**
  - Goal: `buildNetwork()` → `dist/network-<hash>.json.gz` with validation.
  - Learn: joins across files, Douglas-Peucker simplification, polyline encoding, hashing (`crypto.createHash`), gzip.
  - Spec: data-pipeline.md §3.
  - Done when: validation passes; tests on a tiny fixture GTFS (in `fixtures/gtfs-mini/`); file size printed.

- [ ] **M1.5 Pipeline: service days**
  - Goal: `activeServiceIds(date)` and `serviceDayStart(date)`.
  - Learn: GTFS calendars, DST and the "noon − 12h" rule, `Intl` timezone offsets.
  - Spec: data-pipeline.md §4–5, conventions.md (time).
  - Done when: tests pass for 2026-10-19 (expect `L0S2, L1S2, L2S1, Weekday, Weekday_C7` on the supplemented feed), 2026-11-01, 2027-03-14.

- [ ] **M1.6 Pipeline: build a day slice**
  - Goal: `buildDaySlice(date)` → patterns with FIFO split → `dist/day-YYYYMMDD-<hash>.json.gz`.
  - Learn: grouping/sorting at scale, the FIFO property and why RAPTOR needs it.
  - Spec: data-pipeline.md §6.
  - Done when: today's slice builds; prints trips (~8–9k on a weekday), patterns, gzipped size; unique-key assertion passes. Record the size in STATUS.md.

- [ ] **M1.7 Core: timetable index**
  - Goal: `buildTimetableIndex(network, slices)` with dense integer stop IDs, `stopPatterns`, `footpaths`.
  - Learn: dense indexing for performance, Maps vs arrays.
  - Spec: router.md §1.
  - Done when: tests on a synthetic fixture network (`fixtures/networks/tiny.ts`, ~6 stations, 3 lines, 1 transfer, hand-checked).

- [ ] **M1.8 Core: RAPTOR (single departure)**
  - Goal: `raptor(query, index, config)` with pruning; Pareto results per round.
  - Learn: RAPTOR rounds, marking, binary search on FIFO trips, pruning.
  - Spec: router.md §2.
  - Done when: tests agree with a brute-force search (write `bruteForce.ts` in the test folder) on every origin/destination pair of the tiny network at several times.

- [ ] **M1.9 Core: journey reconstruction**
  - Goal: `reconstruct()` → `Journey` with walk / ride / transfer legs, `leaveAt` computed backward from the first train.
  - Learn: parent pointers, building results from search state.
  - Spec: router.md §2 (Reconstruction), data-model.md (Journey).
  - Done when: tests check legs, times, and `leaveAt` on the tiny network.

- [ ] **M1.10 Core: access/egress (estimate mode)**
  - Goal: `nearbyStations()` + `estimateAccess()` (haversine × detour ÷ speed + platform buffer).
  - Learn: haversine, choosing candidate sets.
  - Spec: router.md §4.
  - Done when: tests; for Union Sq coordinates, the nearest stations include 14 St-Union Sq.

- [ ] **M1.11 Core: protobuf reader + GTFS-RT decode**
  - Goal: `protobuf/reader.ts` and `gtfs-rt/decode.ts` → `RtTrip[]` including NYCT fields; `buildSnapshot()`.
  - Learn: protobuf wire format (varints, length-delimited fields, field numbers), extensions.
  - Spec: realtime.md §1–2.
  - Done when: decoding `fixtures/rt/*.pb` (record with M1.15's recorder or a one-off download) gives counts matching mta-data-facts.md ranges, and track fields are present.

- [ ] **M1.12 Core: match + overlay realtime**
  - Goal: `matchTrips()` and `applyRealtime()` (skipped stops, realtime-only trips, FIFO repair, staleness).
  - Learn: immutability (new index, base untouched), the three match levels.
  - Spec: realtime.md §3–4.
  - Done when: on fixture data the match rate is ~85–90%, and unit tests cover each overlay rule.

- [ ] **M1.13 CLI: plan a trip**
  - Goal: `tools/cli` command `plan --from lat,lon --to lat,lon [--at HH:MM]` that loads network + slices, fetches live feeds directly from MTA, applies realtime, runs RAPTOR, prints the sentence and the legs. Basic `format/` helpers for NYC times.
  - Learn: wiring the functional core to an imperative shell; `Intl.DateTimeFormat`.
  - Spec: router.md, realtime.md, conventions.md (time).
  - Done when: it prints a sensible plan for 5 trips you know (one with a transfer); routing time is printed and is < 100 ms in Node.

- [ ] **M1.14 Spot-check against Apple/Google**
  - Goal: `docs/benchmarks/m1-spotcheck.md`: 10 trips (mix of boroughs, transfers, express/local), our answer vs Google vs Apple, run at the same minute.
  - Learn: how to judge a routing result, and where ours differs and why.
  - Done when: the table is filled; every case where we're worse has a written cause and a follow-up item in the roadmap.

- [ ] **M1.15 Feed recorder**
  - Goal: `tools/feed-recorder` saves all 8 feeds every 30 s to `data/raw/recordings/<date>/<time>/` for a given duration.
  - Learn: scheduling loops in Node, file layout for replays.
  - Done when: a 2-hour weekday rush recording exists (keep it out of git; copy 3 small snapshots into `fixtures/rt/`).

**M1 exit check:** update STATUS.md (sizes, timings, match rates, spot-check summary) and decide: proceed, or fix the router first.

---

## M2: Core engine

- [ ] **M2.1 Range RAPTOR**: router.md §3. Done when it matches repeated single-departure RAPTOR on fixtures and real slices; timing printed.
- [ ] **M2.2 Options for the three modes**: `findOptions` with windows, ranking, ties, dedupe, walk-only, `noneMeetsGoal`, `scheduleOnly`. router.md §5. Done when there's a table-driven test per mode on the tiny network.
- [ ] **M2.3 Feasibility + run-for-it + mergeOptions/refreshFeasibility**: router.md §5, trip-lifecycle.md §1. Done when tests simulate a clock moving forward and check removal/append/no-reorder.
- [ ] **M2.4 Departure picker**: `departuresFromPlatform`, router.md §7. Done when tests on the tiny network show every line from the platform, the arrive-by default, and late flags. Add a `--picker` flag to the CLI.
- [ ] **M2.5 Copy module + time formatting + `lineName`**: trip-lifecycle.md §10. Done when snapshot tests cover each situation with deterministic variants, and no copy prints a bare line letter.
- [ ] **M2.6 Same-platform rule + `cross-platform.json` loader**: realtime.md §5.
- [ ] **M2.7 evaluatePlan**: trip-lifecycle.md §7 (incl. hysteresis helper). Used by the server *and* the app's local Upcoming re-check.
- [ ] **M2.8 Route repair**: trip-lifecycle.md §4. One test per ladder step + the stability margin + the late-but-keep case + the alternatives rule.
- [ ] **M2.9 Notification policy**: trip-lifecycle.md §5. Tests for notify vs silent, rate limit, wording.
- [ ] **M2.10 Missed-train scorer**: trip-lifecycle.md §6. Scripted fix sequences for each scenario.
- [ ] **M2.11 Trip reducer**: trip-lifecycle.md §3, §8. Phase transition table tests; effects asserted.
- [ ] **M2.12 Replay harness**: `tools/replay` feeds recorded snapshots + scripted user movement through the reducer and prints a timeline (decisions, notifications). Also replays a **planned trip** through `evaluatePlan` to check alert timing. Use it to tune config values; log changes in decisions.md.
- [ ] **M2.13 Accuracy benchmark vs Google**: testing.md. Needs a Google API key (dev only, free tier). Done when the report gives a "% matches or beats Google" number.

---

## M3: Backend (outline; refine with Opus first)
1. Apple Developer account (needed for APNs keys) + **APNs-from-Worker spike** (server.md ⚠️). Decide Worker vs Deno relay.
2. Worker scaffold: Hono, wrangler config, vitest-pool-workers, `/v1/health`.
3. Pipeline publish to R2 + GitHub Actions schedule; `/v1/manifest`, `/v1/data/*`.
4. FeedPoller Durable Object + `/v1/realtime` (ETag, Cache API) + `/v1/alerts` (verify the Mercury alert fields).
5. D1 migrations, device registration + auth middleware + rate limiting.
6. Plans endpoints.
7. Monitor loop: evaluatePlan, hysteresis, problem-only alerts, push-to-start, Live Activity fallback pushes, cleanup.

## M4: App MVP (outline)
1. Expo app in `apps/mobile`, consuming `@smarttransit/core` from the workspace; first EAS development build on the iPhone.
2. Data sync + stores; realtime poller.
3. MapKit native module (search completions, resolve, walking ETAs, walking route).
4. Home: destination (+ From for future trips), saved places, mode chip, options list with countdowns, `LineLabel` everywhere.
5. Option detail: map with route polylines (shapes + walking) and entrance pins; **departure picker**.
6. Measure routing time on device; log the decision on threading.

## M5: Navigation (outline)
1. Active trip screen + `useTripStore` + effect executor.
2. Background location + motion signals.
3. Live Activity with expo-widgets; **spike interactive buttons**.
4. Notifications with action buttons; answer handling.
5. Repair UI (animated time changes, alternatives, missed screen).
6. Server reporting + heartbeat (fallback pushes).

## M6: Planned trips (outline; the headline feature)
1. `usePlannedTripsStore` + Save trip flow (From required, optional name) + `POST /v1/plans`.
2. Upcoming cards on Home with live status (server status + local `evaluatePlan`).
3. Planned trip screen: plan, far-future notice, departure picker, edit (goal/time/From/To), delete.
4. "Won't make it" notification → deep link → "Here's what works now" options → pick → `PATCH`.
5. "Time to go" notification + push-to-start Live Activity → start the active trip.
6. End-to-end test: save tomorrow's trip tonight, watch it through the morning (including a replay of a broken plan).

## M7: Ship (outline)
Real-ride test matrix (lines × boroughs × times of day), Maestro E2E on EAS, Sentry, privacy policy, MTA attribution, App Store assets, TestFlight beta, release.
