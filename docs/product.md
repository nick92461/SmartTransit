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

## Positioning
Citymapper can already do walk + subway trips (see [competitors.md](competitors.md)). We win this niche on four things:
1. **Planned trips:** set up a trip for later (tomorrow's 9:00 arrival), save it, edit it, and get alerted the moment it stops working. Citymapper can only start trips *now*.
2. **Radically minimal:** feet + subway only. No mode filters, no "Simple/Turbo" presets, nothing to decode.
3. **Words, not just symbols:** "the **2 train**", never a bare "2" bullet a visitor can't read.
4. **NYC voice:** copy and notifications people want to screenshot and repost.

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
- **Line labels always include the word:** route bullet + "2 train", "A train", "S shuttle". Never a bare bullet.

## Departure picker (option detail)
Parity with Citymapper. On an option's detail screen, the boarding step has a picker of **departures from that platform**, in order: the same line and any other line that works from there.
- Each row: line + "train", departure time, and the arrival time it leads to.
- Choosing one updates the **leave time and arrival time live**, and warns when it would make you late (_"That one gets you in at 9:04. Late."_).
- Defaults: the option's own train. In arrive-by, that's the departure arriving closest to (but not after) the deadline minus the buffer.

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

## Planned trips (headline feature)
Set up a trip before it's time to go, keep it, and let the app watch it.

**Creating one**
- From the options list for a future trip (leave at / arrive by), tap **"Save trip"** on an option.
- Planned trips need a **From** place, because "current location" isn't where you'll be tomorrow. Default to a saved place (Home); otherwise ask.
- Optional name ("Work", "Dentist"). Otherwise use the destination name.

**Home screen:** an **Upcoming** section above search, with one card per planned trip:
> **Tomorrow · Work** · Leave by 8:31 · A train at 8:38 · Arrive 8:54 · ✓ On track

**Editing:** tap a planned trip to see the full plan. You can:
- change the time/goal or the From/To places (the app re-searches; pick a new option);
- switch trains with the departure picker;
- delete it.

**While it waits:**
- Plans far in the future are based on the schedule. Show a clear notice, in the app's voice:
  _"This is the plan as of now. Live train times kick in about 30 min before. We'll ping you if anything changes."_
- The server watches the saved plan: planned work, service alerts, and live predictions once in range.
- The card shows the current status: **On track** / **Cutting it close** / **Won't make it**.
- As soon as the plan **stops meeting the arrival goal**, notify with the problem: _"Your 9:00 Work trip won't make it anymore."_ Tapping it opens the trip with a refreshed options list on top: the best options right now, clearly ranked. The user picks; the app never swaps the plan by itself.
- At departure time, the Live Activity starts on its own (push-to-start, iOS 17.2+) and a "Time to go" notification fires. Tapping it starts the trip (Go).

**Later idea (not committed):** repeating trips ("every weekday, arrive at Work by 9:00").

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
- **Above that:** beat them where data allows (planned trips with alerts, in-place route repair, clearer answers, run-for-it guidance).
- **Competitors count too:** if Citymapper does something useful for walk + subway riders (e.g. the departure picker), we match it.
- **Always:** clearer and simpler.

Using Apple's own MapKit for search, maps, and walking means those parts start at Apple-level quality. The router is the part we must prove. See [testing.md](testing.md) for the benchmark against Google.

## Goals
1. **Primary:** a polished, shipped App Store app that shows real-world problem solving. A resume project.
2. **Secondary:** real users and, ideally, revenue (e.g. $2.99 one-time or a small subscription; Apple takes 15% under the Small Business Program).
3. **Constraint:** must be cheap to build and run so it actually gets finished.

## Out of scope (for now)
Buses, bikes, cars, ferries, LIRR/Metro-North, accessibility routing (elevator outages: possible later), Android.
