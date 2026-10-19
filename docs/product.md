# Product

## The problem
Transit apps show too much: departure clock times, durations, delay badges, scheduled vs. predicted times, little symbols.
The rider has to work out what it all means. Most people just want to know **which train, from where, and when to leave.**

## The product
A minimal iPhone app for getting around NYC **on foot + subway only**.
The user gives a destination and (optionally) a time. The app gives one best plan first, then a few backups.

> **Leave at 8:42.** Walk 6 min to 23 St. **C train at 8:49.** Arrive 9:12.

With a transfer, add one line:

> Transfer at 14 St to the **2 at 8:57**.

Delays, headways, and predictions are used behind the scenes. Every time shown already includes them.

## Three trip modes
A destination field plus a time chip that toggles **Now / Leave at / Arrive by**. No chat, no typing out intent.

| Mode | "Best" means | Backup options |
|---|---|---|
| **Leave now** (default) | Earliest arrival the user can actually walk to in time | Next catchable trains, in case they need a few more minutes |
| **Leave at X** | Earliest arrival departing at or after X | Same |
| **Arrive by X** | The *latest* departure that still arrives on time with a safety buffer | Earlier departures with more margin |

Tie-breakers when arrival times are close: fewer transfers, then less walking.

In **Leave now**, the top line becomes a countdown ("Leave in 3 min"). An option drops off the list automatically once it can no longer be made.

## Navigation (in-app, like Apple Maps "Go")
- Handing a route to Apple/Google Maps can't preserve our exact itinerary (they recompute their own and may add buses), so **navigation is in-app.**
- One continuous route on the map: walk → ride → transfer → ride → walk. Transfers are part of the same plan, not a new search.
- Walking legs end at the **correct station entrance pin** (standard map navigation, no spoken "use the east-side entrance").
- **Lock screen / Dynamic Island** via Live Activity: "Leave in 3 min · C at 23 St 8:49" → "Ride 6 stops · off at 8:58" → …
- Works underground: progress is estimated from the schedule, and the server pushes updates when there's no GPS.

## Planning ahead + change alerts
- Plans far in the future are based on the schedule. Show a clear notice, in the app's voice:
  _"This is the plan as of now. Live train times kick in about 30 min before. We'll ping you if anything changes."_
- When the user **commits** to a plan, the server watches it. If it **no longer gets them there by their deadline**, notify them immediately with the best new plan:
  _"Your C is dragging. Take the A at 8:46 instead. Leave 3 min earlier."_
- Before live predictions are available, watch planned work and service alerts so weekend reroutes trigger alerts hours ahead.

## Walking time
- Use Apple's walking estimates as-is. They're conservative, which gives riders a comfortable cushion.
- Add a **"run for it"** state: the time left is shorter than Apple's estimate but enough at a jog.

## Copy voice: lean into NYC
Not bland. Short, confident, a little New York. Examples:
- "Hustle. The C pulls in at 8:49."
- "You've got time. Grab the coffee."
- "Leave now or kiss the 8:49 goodbye."
- "Missed it? Next C in 4. Nobody saw."

## The parity rule
- **Minimum:** never worse than Apple Maps / Google Maps on accuracy. Where data is limited (far-future plans, unexpected disruptions), every app has the same limit. We match it and are open about it.
- **Above that:** beat them where data allows (committed-plan alerts, clearer answers, run-for-it guidance).
- **Always:** clearer and simpler.

Using Apple's own MapKit for search, maps, and walking means those parts start at Apple-level quality. The router is the part we must prove. See [testing.md](testing.md) for the benchmark against Google.

## Goals
1. **Primary:** a polished, shipped App Store app that shows real-world problem solving. A resume project.
2. **Secondary:** real users and, ideally, revenue (e.g. $2.99 one-time or a small subscription; Apple takes 15% under the Small Business Program).
3. **Constraint:** must be cheap to build and run so it actually gets finished.

## Out of scope (for now)
Buses, bikes, cars, ferries, LIRR/Metro-North, accessibility routing (elevator outages: possible later), Android.
