import type { Journey, Place, TripMode } from "./journey";
import type { EpochSec } from "./primitives";

export type PlanStatus = "onTrack" | "atRisk" | "broken";

export interface PlannedTrip {
    id: string;
    name: string | null;
    origin: Place;
    destination: Place;
    mode: Extract<TripMode, { kind: "leaveAt" | "arriveBy" }>;
    journey: Journey;
    status: PlanStatus;
    scheduleOnly: boolean;
    createdAt: EpochSec;
    updatedAt: EpochSec;
}

export interface CommittedPlan {
    id: string;
    deviceId: string;
    label: string;
    mode: TripMode;
    deadline: EpochSec | null;
    journey: Journey;
    status: PlanStatus;
    lastNotifiedStatus: PlanStatus | null;
    liveActivityToken: string | null;
    createdAt: EpochSec;
    expiresAt: EpochSec;
}

export interface PlanEvaluation {
    projectedArriveAt: EpochSec;
    brokenAtLeg: number | null;
    meetsDeadline: boolean | null;
    status: PlanStatus;
}
