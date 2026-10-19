# Costs

Rough estimates as of 2026-10. **Verify current pricing before relying on them.**

## Development (year one)

| Item | Cost |
|---|---|
| Apple Developer Program | $99/yr |
| Expo EAS (builds, workflows) | Free tier; ~$19/mo if outgrown |
| Cloudflare (Workers, D1, R2, Durable Objects) | $0 until M3, then **$5/mo** (Workers Paid: decoding the feeds every 30 s needs more CPU than the free plan allows) |
| MapKit, APNs, Live Activities, MTA data | $0 |
| Occasional cloud Mac day | ~$0–30 total |
| **Total** | **~$100–250** |

## Running costs per user
Routing on the phone + free MTA data + free MapKit means a typical user costs close to nothing.

| Daily users | Estimated monthly cost |
|---|---|
| ~1,000 | ~$5 |
| ~10,000 | ~$5–25 |

## Why we don't use Google for routing
Google Routes API (transit) at roughly $5–10 per 1,000 requests would cost about **$300–900/mo at 1k daily users** and **$3k–9k/mo at 10k**, and its terms may limit displaying results outside a Google map. Building our own router keeps running costs near zero.

## Revenue (later)
Possible $2.99 one-time or small subscription. Apple takes 15% under the Small Business Program.
