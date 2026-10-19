# Product

## The problem
Transit apps show too much: departure clock times, durations, delay badges, scheduled vs. predicted times, little symbols.
The rider has to work out what it all means. Most people just want to know **which train, from where, and when to leave.**

## The product
A minimal iPhone app for getting around NYC **on foot + subway only**.
The user gives a destination and (optionally) a time. The app shows a short list of route options, best first.

> **Leave at 8:42.** Walk 6 min to 23 St. **C train at 8:49.** Arrive 9:12.

With a transfer, add one line:

> Transfer at 14 St to the **2 at 8:57**.

Delays, headways, and predictions are used behind the scenes. Every time shown already includes them.

## Three trip modes
A destination field plus a time chip that toggles **Now / Leave at / Arrive by**. No chat, no typing out intent.

| Mode | "Best" (top of the list) means | Rest of the list |
|---|---|---|
| **Leave now** (default) | Earliest arrival the user can actually walk to in time | Next catchable options |
| **Leave at X** | Earliest arrival departing at or after X | Same |
| **Arrive by X** | The *latest* departure that still arrives on time with a safety buffer | Earlier departures with more margin |

Tie-breakers when arrival times are close: fewer transfers, then less walking.

## The options list
- Works like Apple Maps' transit view: a list the user picks from. **The app never gives prescriptive advice** ("take the A instead") to someone who is browsing.
- In **Leave now**, the top line becomes a countdown ("Leave in 3 min").
- An option that can no longer be made **silently disappears**; new options appear at the bottom as time passes.
- If nothing meets the goal, say so plainly instead of showing an empty list: _"Nothing gets you there by 9:00. Fastest is 9:07."_

## Navigation (in-app, like Apple Maps "Go")
- Handing a route to Apple/Google Maps can't preserve our exact itinerary (they recompute their own and may add buses), so **navigation is in-app.**
- One continuous route on the map: walk → ride → transfer → ride → walk. Transfers are part of the same plan, not a new search.
- Walking legs end at the **correct station entrance pin** (standard map navigation, no spoken "use the east-side entrance").
- **Lock screen / Dynamic Island** via Live Activity: "Leave in 3 min · C at 23 St 8:49" → "Ride 6 stops · off at 8:58" → …
- Works underground: progress is estimated from the schedule, and the server pushes updates when there's no GPS.
- The active trip card and Live Activity **never go blank**. Changed times animate in place, with the old time briefly crossed out.

## When something goes wrong mid-trip
Someone on a platform with trains arriving must never be told "start over". The app **repairs the active route in place** instead of replacing it. See [architecture.md](architecture.md#4-active-trip-repairs) for the exact steps.

- Usually only times or the line label change: next A on the same platform, or a C instead of the A when that C stops where the user needs it.
- A full re-plan from the user's **current location** happens only when the original station is no longer a good choice. Only then does the app show _"Damn, you missed it. Here are your options."_
- If the deadline can't be met anymore, keep the route and say so in the same card: _"Bad news: you're gonna be 6 min late. Next C in 4 · arrives 9:06."_
- **Other routes** are offered only if the repair adds **more than 10 min**, or breaks an arrive-by deadline another route could still meet. Only routes that beat the repaired one are shown, under it. The app never switches routes on its own.

### Notifications when the route changes
What changed first, then what it costs:
- "Missed the A. Next A toward Far Rockaway is in 3 min. Adds 3 min."
- "Missed the A. Stay put and take the next C toward Euclid Av. Adds 2 min."
- "Missed the A. Next C in 5, but you'll be about 4 min late (9:04)."
- "Missed the A. Take the C, then switch to the 2 at Chambers St. Adds 4 min."

Directions are named the way New Yorkers say them and the platform signs show them: uptown / downtown / Brooklyn-bound, or the last stop on the line.
Small shifts (a train moving by a minute or two) update the Live Activity silently, with no notification.

### "Did you make it?"
The app detects a missed train from location and motion signals. When it's sure, it acts silently. When signals disagree, it asks once, answerable from the lock screen:

> **Did you make the 8:49 C?** Yep · Missed it · Not here yet

"Not here yet" covers MTA data saying a train has left when it hasn't. Never ask on every trip.
Underground transfers (no GPS) are assumed made. The active trip screen has a small **"Missed it"** button.

## Planning ahead + change alerts
- Plans far in the future are based on the schedule. Show a clear notice, in the app's voice:
  _"This is the plan as of now. Live train times kick in about 30 min before. We'll ping you if anything changes."_
- When the user **commits** to a plan, the server watches it: planned work, service alerts, and live predictions once in range.
- As soon as the plan **stops meeting the arrival goal**, the notification states only the problem: _"Your plan won't get you there by 9:00 anymore."_ Tapping it opens the refreshed options list. The server doesn't pick a replacement route.
- At departure time, the Live Activity starts on its own (push-to-start, iOS 17.2+).

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
- **Above that:** beat them where data allows (committed-plan alerts, in-place route repair, clearer answers, run-for-it guidance).
- **Always:** clearer and simpler.

Using Apple's own MapKit for search, maps, and walking means those parts start at Apple-level quality. The router is the part we must prove. See [testing.md](testing.md) for the benchmark against Google.

## Goals
1. **Primary:** a polished, shipped App Store app that shows real-world problem solving. A resume project.
2. **Secondary:** real users and, ideally, revenue (e.g. $2.99 one-time or a small subscription; Apple takes 15% under the Small Business Program).
3. **Constraint:** must be cheap to build and run so it actually gets finished.

## Out of scope (for now)
Buses, bikes, cars, ferries, LIRR/Metro-North, accessibility routing (elevator outages: possible later), Android.
