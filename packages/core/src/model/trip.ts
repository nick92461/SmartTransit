import type { Journey, Place, TripMode } from "./journey";
import type { EpochSec, LatLon, RouteId, Sec } from "./primitives";
import type { RealtimeSnapshot } from "./realtime";

export type TripPhase = 
    | { kind: "toStation", legIndex: number }
    | { kind: "waiting", legIndex: number }
    | { kind: "riding", legIndex: number }
    | { kind: "transferring", legIndex: number }
    | { kind: "toDestination", legIndex: number }
    | { kind: "arrived" }
    | { kind: "ended", reason: "user" | "arrived" | "expired" };

export type MissedAnswer = "yep" | "missed" | "notYet";

export interface MissedQuestion {
    rideLegIndex: number;
    askedAt: EpochSec;
    answer: MissedAnswer | null;
}

export type RepairKind = "sameLine" | "samePlatformOtherLine" | "resolveLater" | "fullReplan";

export interface RepairRecord {
    at: EpochSec;
    kind: RepairKind;
    before: Journey;
    after: Journey;
    addedSec: Sec;
}

export interface ActiveTrip {
    id: string;
    destination: Place;
    mode: TripMode;
    deadline: EpochSec | null;
    journey: Journey;
    phase: TripPhase;
    pendingQuestion: MissedQuestion | null;
    alternatives: Journey[];
    repairs: RepairRecord[];
    lastUpdatedAt: EpochSec;
}

export interface LocationFix {
    at: EpochSec;
    location: LatLon;
    accuracyM: number;
    motion: "stationary" | "walking" | "running" | "automotive" | "unknown";
}

export type TripEvent = 
    | { kind: "tick", now: EpochSec }
    | { kind: "location", now: EpochSec, fix: LocationFix }
    | { kind: "realtime", now: EpochSec, snapshot: RealtimeSnapshot }
    | { kind: "answer", now: EpochSec, answer: MissedAnswer }
    | { kind: "userMissed", now: EpochSec }
    | { kind: "chooseAlternative", now: EpochSec, journeyId: string }
    | { kind: "end", now: EpochSec };

export interface LiveActivityContent {
    headline: string;
    routeId: RouteId | null;
    routeColor: string | null;
    stationName: string | null;
    primaryTime: EpochSec | null;
    primaryLabel: string;
    arriveAt: EpochSec;
    lateBySec: Sec | null;
    struckTime: EpochSec | null;
    question: { rideLegIndex: number, text: string } | null;
}

export type TripEffect = 
    | {
        kind: "notify",
        title: string,
        body: string,
        priority: "passive" | "active" | "timeSensitive",
        actions?: MissedAnswer[],
    }
    | { kind: "updateLiveActivity", content: LiveActivityContent }
    | { kind: "endLiveActivity" }
    | { kind: "reportToServer", trip: ActiveTrip };
