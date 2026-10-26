import type { Entrance } from "./network";
import type { EpochSec, LatLon, RouteId, Sec, StationId, StopId, TripKey } from "./primitives";

export type TripMode =
    | { kind: 'now' }
    | { kind: 'leaveAt', at: EpochSec }
    | { kind: 'arriveBy', by: EpochSec };

export interface Place {
    name: string;
    location: LatLon;
}

export interface AccessPath {
    stationId: StationId;
    entrance: Entrance;
    walkSec: Sec;
    totalSec: Sec;
    source: 'mapkit' | 'estimate';
}

export interface WalkLeg {
    kind: 'walk';
    from: LatLon;
    to: LatLon;
    toEntrance: Entrance | null;
    departAt: EpochSec;
    arriveAt: EpochSec;
    walkSec: Sec;
    bufferSec: Sec;
}

export interface RideLeg {
    kind: 'ride';
    routeId: RouteId;
    tripKey: TripKey;
    headsign: string;
    boardStop: StopId;
    alightStop: StopId;
    departAt: EpochSec;
    arriveAt: EpochSec;
    stopCount: number;
    track: string | null;
    realtime: boolean;
    assigned: boolean;
    shapeId: string | null;
}

export interface TransferLeg {
    kind: 'transfer';
    fromStop: StopId;
    toStop: StopId;
    sec: Sec;
}

export type Leg = WalkLeg | RideLeg | TransferLeg;

export interface Journey {
    id: string;
    legs: Leg[];
    leaveAt: EpochSec;
    arriveAt: EpochSec;
    rideCount: number;
    walkSec: Sec;
    walkOnly: boolean;
}

export type Feasibility =
    | { kind: 'comfortable' }
    | { kind: "runForIt", jogSec: Sec }
    | { kind: "missed" };

export interface RankedOption {
    journey: Journey;
    feasibility: Feasibility;
    isBest: boolean;
}

export interface OptionsResult {
    generatedAt: EpochSec;
    mode: TripMode;
    options: RankedOption[];
    noneMeetsGoal: { fastest: Journey, lateBySec: Sec } | null;
    scheduleOnly: boolean;
    realtimeStale: boolean;
}

export interface DepartureChoice {
    journey: Journey;
    routeId: RouteId;
    departAt: EpochSec;
    feasibility: Feasibility;
    lateBySec: Sec | null;
    isCurrent: boolean;
}
