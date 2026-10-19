# Competitors

## Citymapper (owner's hands-on test, 2026-10-19)

**Verdict:** it can do the core job (walk + subway, arrive by, live times) and it's fairly easy to follow. It's not focused, though, and it has a real gap around planning ahead.

### What it does well (parity targets: we must match these)
- In "Classic" mode, the subway route comes first, with written directions laid out like Apple Maps but cleaner.
- Tells you **how soon you must leave**, where to walk, and which train to take.
- **Departure picker:** a scroll wheel of upcoming departures **at that platform**. It's an ordered list of the fastest options from that platform, not just one line.
  - Picking one **updates the final arrival time live** and **warns if it would make you late**.
  - In arrive-by, it defaults to the departure that arrives **closest to, but not after, the deadline**.

### Where it falls short (our openings)
- **Feature bloat:** route filters like "Simple" and "Turbo" don't explain themselves until tapped. Results include other modes (bus etc.) even in Classic.
- **Pictograms over words:** the first step is shown as walking-man icon → arrow → "2" bullet. Someone who isn't a New Yorker can't tell whether "2" is a train, a bus, or a road sign.
- **No saved trips for later:** you can only start a trip *now*. There's no obvious way to set up tomorrow's 9:00 arrival, save it, edit it, and get live updates **before** it's time to leave.
- **Unknown:** how it reacts to delays as a planned trip approaches, and how it handles *user-caused* lateness (missed train). Check later; we cover both by design.

### What this means for SmartTransit
1. **Planned trips are the headline feature.** Save a trip for later, edit it, and get watched and alerted before you leave.
2. **Radically minimal UI:** feet + subway only, no mode filters, no unexplained presets.
3. **Words, not just symbols:** always "2 train" next to the bullet.
4. **Match the departure picker** (parity rule): same-platform departures with live arrival and a late warning.
5. **NYC voice in copy and notifications** as the shareable personality.

## Others to check later
Apple Maps, Google Maps, Transit, MTA's own app. Use the same test: subway-only arrive-by trip for tomorrow morning.
