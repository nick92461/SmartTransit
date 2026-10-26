export interface Config {
  walkSpeedMps: number;
  walkDetourFactor: number;
  jogSpeedFactor: number;
  defaultPlatformBufferSec: number;
  samePlatformTransferSec: number;
  accessRadiusM: number;
  maxAccessStations: number;
  maxRides: number;
  optionsWindowSec: number;
  runForItLookbackSec: number;
  maxOptions: number;
  arriveByBufferSec: number;
  walkOnlyMaxSec: number;
  realtimeHorizonSec: number;
  realtimeStaleSec: number;
  unassignedExtraBufferSec: number;
  repairStabilityMarginSec: number;
  alternativesThresholdSec: number;
  notifyMinShiftSec: number;
  missedHighConfidence: number;
  missedLowConfidence: number;
}

export const DEFAULT_CONFIG: Readonly<Config> = Object.freeze({
  walkSpeedMps: 1.2,
  walkDetourFactor: 1.3,
  jogSpeedFactor: 1.6,
  defaultPlatformBufferSec: 60,
  samePlatformTransferSec: 60,
  accessRadiusM: 1500,
  maxAccessStations: 8,
  maxRides: 4,
  optionsWindowSec: 3600,
  runForItLookbackSec: 300,
  maxOptions: 5,
  arriveByBufferSec: 180,
  walkOnlyMaxSec: 1800,
  realtimeHorizonSec: 1800,
  realtimeStaleSec: 120,
  unassignedExtraBufferSec: 60,
  repairStabilityMarginSec: 120,
  alternativesThresholdSec: 600,
  notifyMinShiftSec: 180,
  missedHighConfidence: 0.8,
  missedLowConfidence: 0.2,
});
