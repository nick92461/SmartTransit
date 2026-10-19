# Development environment

## Constraint
Windows machine, **no Mac** and no plan to buy one. VS Code is the editor.

## Approach: Expo on Windows + cloud builds
| Task | How |
|---|---|
| Write code | VS Code on Windows |
| Run the app during development | Expo development build on a physical iPhone. TypeScript changes hot-reload over the network. |
| Build iOS binaries | **EAS Build** (cloud). Only needed when native code or dependencies change. |
| Unit / logic tests | Locally on Windows (Vitest, Jest) |
| End-to-end UI tests | **Maestro** on Expo's cloud Mac simulators (EAS Workflows) |
| Lock screen, background, real rides | Physical iPhone (required regardless of setup) |
| Debugging Swift (Live Activity) if needed | Rent a cloud Mac for a day (e.g. Scaleway, 24 h minimum, a few dollars) |

## Requirements
- **Apple Developer Program ($99/yr)**: needed even to install development builds on your own iPhone through EAS.
- Expo account (free tier to start).
- Node.js 24 + npm 11 (installed), Git (installed). Python 3.13 is also installed (handy for throwaway data inspection).
- Not needed until M3: Apple Developer account. Not needed until M4: Expo account, EAS CLI.

## Not doing
- **Unofficial "iOS simulators" from GitHub.** Real iOS can't run on Windows. Those projects are mockups, research tools for old iOS versions, or old-game emulators, and some bundle malware. They wouldn't make tests meaningful.

## Alternative considered
Rent a cloud Mac for the whole project, connect from VS Code via Remote-SSH, and write native Swift. More capable (full simulator access for automated UI tests), but ~$50–150/month. Revisit only if the Expo path hits a wall. See [decisions.md](decisions.md).
