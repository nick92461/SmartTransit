export type EpochSec = number;
export type Sec = number;
export type ServiceDate = string;
export type StopId = string;
export type StationId = string;
export type RouteId = string;
export type TripKey = string;

export interface LatLon {
    lat: number;
    lon: number;
}

export type Result<T, E> = { ok: true, value: T } | { ok: false, error: E };
