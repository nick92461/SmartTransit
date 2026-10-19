# Decision log

Newest at the bottom. Each entry: what, why, alternatives.

## 2026-10-19 — Walking + subway only
**Why:** the product is "simple for people on foot". Also keeps the routing network small (~470 stations) and cheap.
**Rejected:** buses, bikes, multimodal.

## 2026-10-19 — Build our own router (RAPTOR) instead of Google Routes API
**Why:** near-zero running costs, full control over ranking for the three modes, no map-display restrictions.
**Rejected:** Google Routes API (~$5–10 per 1,000 requests; thousands/month at scale).

## 2026-10-19 — In-app navigation, not handoff to Apple Maps
**Why:** Apple/Google Maps links can't carry a specific itinerary; they recompute their own route (possibly with buses), which breaks accuracy.

## 2026-10-19 — Apple MapKit for map, search, and walking
**Why:** free on iOS and gives Apple-level quality for those parts (parity rule). Apple's conservative walking times are a feature.

## 2026-10-19 — Expo / React Native, developed on Windows
**Why:** no Mac. EAS builds in the cloud; logic is testable locally. Small Swift pieces for Live Activity / MapKit.
**Rejected:** full-time cloud Mac + native Swift (~$50–150/mo); unofficial iOS simulators on Windows (inaccurate, unsafe).

## 2026-10-19 — Cloudflare Workers backend
**Why:** free/cheap, no egress fees, TypeScript shared with the app.
**Open risk:** APNs HTTP/2 support; fallback is Deno Deploy for push sending.

## 2026-10-19 — Whole project directory under version control
**Why:** plans, status, and decisions live with the code so every session has full context.
Git: work on `dev`; merge to `main` only on the owner's say-so.

## 2026-10-19 — Options list, never prescriptive advice (side chat)
Users see a list of route options, like Apple Maps' transit view. When an option can no longer be made, it silently disappears; new ones appear at the bottom as time passes. The app never tells a browsing user "take the A instead".
Committed future plans ("arrive by 9:00 tomorrow"): a notification states only the problem ("Your plan won't get you there by 9:00 anymore"); tapping it opens the refreshed options list.
If no option meets the goal, say so plainly ("Nothing gets you there by 9:00. Fastest is 9:07") instead of showing an empty list.
**Why:** keeps the user in control and the UI clean.
**Rejected:** server-chosen replacement routes pushed as instructions.

## 2026-10-19 — Repair the active route before replacing it (side chat)
Once a route is started, a missed or unviable train patches the route in place. The app tries these in order and stops at the first that works:
1. Same line, same platform, later train: only the times change.
2. Different line, same platform, and that specific train stops where the user needs it (check stop times for that train: express/local and late-night patterns differ), e.g. C instead of A: swap the line label and times.
3. Same boarding station, later parts of the route re-solved (e.g. a broken transfer).
4. Full re-plan from the user's **current location** (not the original start), only when their position makes the original station a bad choice. Only this case shows the "Damn, you missed it. Here are your options" screen.

Patch if the patched route is within ~2 min of the best fresh plan; plan stability beats saving 90 seconds.
If the deadline can no longer be met, keep the route and deliver the bad news in the same card ("Bad news: you're gonna be 6 min late. Next C in 4 · arrives 9:06").
The active trip card and Live Activity never go blank; changed times animate in place, with the old time crossed out briefly.
**Why:** a user on a platform with trains arriving must never be told "start over from scratch". That causes panic.
**Rejected:** ending the route and showing a fresh list on every miss.

## 2026-10-19 — When to look for other routes after a repair (side chat)
Look for alternatives when the patch adds **more than 10 min**, **or** when it breaks an arrive-by deadline that another route could still meet.
Show only alternatives that beat the patched route. The patched route stays on top, marked as the current plan; the app never switches routes automatically. If no alternative beats it, keep the patch and don't mention alternatives.
The 10 min threshold is a single setting in the shared core; tune it with feed-replay tests.
**Why:** the deadline is the real goal; minutes added only matter relative to it.

## 2026-10-19 — Plain-English notifications when a route is altered (side chat)
Every meaningful alteration gets a notification: what changed first, then the cost. Examples:
- "Missed the A. Next A toward Far Rockaway is in 3 min. Adds 3 min."
- "Missed the A. Stay put and take the next C toward Euclid Av. Adds 2 min."
- "Missed the A. Next C in 5, but you'll be about 4 min late (9:04)."
- "Missed the A. Take the C, then switch to the 2 at Chambers St. Adds 4 min."

Directions are described the way New Yorkers say them and the way platform signs show them: uptown / downtown / Brooklyn-bound, or the last stop on the line (from MTA trip headsigns).
Small shifts (a train moving by a minute or two) update the Live Activity silently, with no notification.
**Why:** a clear "here's what changed" message reassures people about their own route. Sending too many notifications gets them turned off.

## 2026-10-19 — Missed-train detection: confidence score + fallback question (side chat)
Signals, combined into a confidence score:
- Location vs. station entrances when the train leaves (still on the street, away from the entrance → missed, high confidence).
- GPS dropping out near an entrance → probably went underground, likely on the platform.
- Coarse location (Wi-Fi and cell towers) still at the station minutes after departure → probably missed; moving along the line → probably boarded.
- Motion sensors (weak alone; helps separate standing still from riding).

High confidence either way: act silently (patch if missed, carry on if boarded). Low confidence: ask
**"Did you make the 8:49 C?" — Yep · Missed it · Not here yet**
- The question can be answered from the lock screen (interactive Live Activity / notification buttons, iOS 17+).
- "Not here yet" covers MTA data saying the train has left when it hasn't: keep the current train as the target, mark it as waiting, and keep checking the feed. Log these answers as a data-quality signal.
- Ask only when the signals disagree; never nag on every trip.

Underground transfers (no GPS): assume the connection was made; the active trip screen shows a small "Missed it" button. Recalculate automatically when the user comes back above ground and their location doesn't match the plan.
Edge cases to handle: train held at the station; user boarded a different line than planned (follow their actual path and quietly switch the route to that line); a train switching between express and local mid-trip (re-check that it still stops at the user's station); user at the entrance for the wrong direction.
**Why:** location alone has edge cases; a quick, rare question beats a wrong guess.

## 2026-10-19 — Long-range plan disclaimer and monitoring (side chat)
Plans more than ~30–60 min out are schedule-based. Tell the user so in NYC voice, e.g. "This is the plan as of now. Live train times kick in about 30 min before. We'll ping you if anything changes."
After the user commits, the server watches planned work, service alerts, and (once in range) live predictions, and notifies **as soon as the plan stops meeting the arrival goal**.
At departure time the server can start the Live Activity remotely via push-to-start (iOS 17.2+).
**Why:** matches other apps' limits (parity) and beats them by alerting proactively.

## 2026-10-19 — NYC voice in copy, including "run for it" (side chat)
Use Apple's conservative walking times as-is. When the time left is shorter than Apple's walking estimate but enough at a jog, switch to copy like "Hustle. The C pulls in at 8:49." Other tone examples: "You've got time. Grab the coffee." / "Missed it? Next C in 4. Nobody saw."
Station entrances are map pins the walking route ends at, not spoken instructions.
**Why:** personality makes the app stand out and costs nothing to build.
