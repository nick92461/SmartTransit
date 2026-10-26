import type { EpochSec, RouteId, ServiceDate, StationId, StopId } from "./primitives";

export type FeedName =
  | 'gtfs-ace'
  | 'gtfs-bdfm'
  | 'gtfs-g'
  | 'gtfs-jz'
  | 'gtfs-nqrw'
  | 'gtfs-l'
  | 'gtfs'
  | 'gtfs-si';


export interface RtStopTime {
    stopId: StopId;
    arr: EpochSec | null;
    dep: EpochSec | null;
    schedTrack: string | null;
    actualTrack: string | null;
}

export interface RtTrip {
    tripId: string;
    routeId: RouteId;
    startDate: ServiceDate;
    assigned: boolean;
    trainId: string | null;
    stops: RtStopTime[];
}

export interface RealtimeSnapshot {
    fetchedAt: EpochSec;
    feedTimestamps: Partial<Record<FeedName, EpochSec>>;
    trips: RtTrip[];
}

export interface ServiceAlert {
    id: string;
    routeIds: RouteId[];
    stationIds: StationId[];
    activePeriods: { start: EpochSec, end: EpochSec | null }[];
    header: string;
    isPlannedWork: boolean;
}
