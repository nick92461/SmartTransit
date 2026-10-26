import type { EpochSec, RouteId, Sec, ServiceDate, StopId, TripKey } from "./primitives";

export interface PatternTrip {
    key: TripKey;
    headsign: string;
    arr: Sec[];
    dep: Sec[];
}

export interface Pattern {
    id: string;
    routeId: RouteId;
    stopIds: StopId[];
    shapeId: string | null;
    trips: PatternTrip[];
}

export interface DaySlice {
    serviceDate: ServiceDate;
    serviceDayStart: EpochSec;
    source: "supplemented" | "regular";
    feedVersion: string;
    patterns: Pattern[];
}
