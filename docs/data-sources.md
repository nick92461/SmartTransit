# Data sources

| Source | What we use it for | Cost | Notes |
|---|---|---|---|
| **MTA GTFS static (subway)** | Stations, routes, schedules, transfers, track shapes | Free | Use the hourly **supplemented** feed so planned work / weekend changes are included |
| **MTA GTFS-Realtime (subway)** | Live predicted arrival times, service alerts | Free | Several feeds split by line group (ACE, BDFM, G, JZ, NQRW, L, 1–7, SIR). Believed to need no API key. **Verify.** |
| **MTA Subway Entrances and Exits** (NYC Open Data) | Entrance coordinates for walking targets | Free | Some entrances serve one direction only. Check what the dataset says about this. |
| **Apple MapKit (iOS)** | Map, place search, walking directions + ETAs | Free | Per-device rate limits; cache walking times to nearby entrances |
| **Google Routes API** | **Dev-only** accuracy benchmark | Free tier / pay per use | Not used in the shipped app |

## Known data limitations
- Live predictions only reach ~30–60 min ahead. Further out = schedule only (same as every other app).
- Predictions for trains that haven't left their first stop can be unreliable. Fall back to schedule + extra buffer.
- No data on entrance-to-platform time. Add per-station buffers (deep stations like 191 St, 168 St need more).

## Terms
Review MTA data terms before launch: attribution required, and the app must not imply MTA endorsement.
