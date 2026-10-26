import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../index.js';
import type { Journey, Leg } from '../index.js';

const walk: Leg = {
  kind: 'walk',
  from: { lat: 40.7359, lon: -73.9911 },
  to: { lat: 40.7347, lon: -73.9906 },
  toEntrance: null,
  departAt: 1_000,
  arriveAt: 1_360,
  walkSec: 300,
  bufferSec: 60,
};

const ride: Leg = {
  kind: 'ride',
  routeId: 'L',
  tripKey: '090500_L..N01R',
  headsign: '8 Av',
  boardStop: 'L03N',
  alightStop: 'L01N',
  departAt: 1_400,
  arriveAt: 1_700,
  stopCount: 2,
  track: null,
  realtime: false,
  assigned: false,
  shapeId: null,
};

const transfer: Leg = { kind: 'transfer', fromStop: 'L01N', toStop: 'A31N', sec: 180 };

describe('model', () => {
  it('builds a journey from each kind of leg', () => {
    const journey: Journey = {
      id: 'test',
      legs: [walk, ride, transfer],
      leaveAt: 1_000,
      arriveAt: 1_880,
      rideCount: 1,
      walkSec: 300,
      walkOnly: false,
    };
    expect(journey.legs.map((leg) => leg.kind)).toEqual(['walk', 'ride', 'transfer']);
  });

  it('narrows a leg by its kind', () => {
    const leg: Leg = ride;
    if (leg.kind === 'ride') {
      expect(leg.stopCount).toBe(2);
    } else {
      throw new Error('expected a ride leg');
    }
  });

  it('has a frozen default config', () => {
    expect(DEFAULT_CONFIG.arriveByBufferSec).toBe(180);
    expect(Object.isFrozen(DEFAULT_CONFIG)).toBe(true);
  });
});
