import type { LatLon, RouteId, Sec, StationId, StopId } from "./primitives.js";

export interface Station {
    id: StationId;
    name: string;
    location: LatLon;
    complexId: string;
    borough: string;
    northLabel: string;
    southLabel: string;
    platformBufferSec: Sec;
    stopIds: StopId[];
}

export interface Stop {
    id: StopId;
    stationId: StationId;
    direction: 'N' | 'S';
}

export interface Route {
    id: RouteId;
    shortName: string;
    longName: string;
    color: string;
    textColor: string;
}

export interface Transfer {
    from: StationId;
    to: StationId;
    minSec: Sec;
}

export interface Entrance {
    stationId: StationId;
    location: LatLon;
    type: string;
    entry: boolean;
    exit: boolean;
}

export interface Network {
    version: string;
    stations: Record<StationId, Station>;
    stops: Record<StopId, Stop>;
    routes: Record<RouteId, Route>;
    transfers: Transfer[];
    entrances: Entrance[];
    shapes: Record<string, string>;
}


