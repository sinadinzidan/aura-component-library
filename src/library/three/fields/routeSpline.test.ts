import { buildRoute, catmullRom, clampDistance, distanceToKp, kpToDistance, nearestStation, railPose, routeSlice, sampleRoute, stationStep } from './routeSpline';

const STRAIGHT = buildRoute(
  [
    [0, 0, 0],
    [10, 0, 0],
    [20, 0, 0],
    [30, 0, 0],
  ],
  10
);

const BENT = buildRoute(
  [
    [0, 0, 0],
    [20, 2, 0],
    [40, 2, 15],
    [60, 6, 15],
  ],
  16
);

const STATIONS = [
  { id: 'landfall', kp: 0 },
  { id: 'bv-1', kp: 12 },
  { id: 'compressor', kp: 24 },
  { id: 'terminal', kp: 84 },
];

describe(catmullRom.name, () => {
  it('passes through the two middle control points', () => {
    const args = [
      [0, 0, 0],
      [1, 2, 3],
      [4, 5, 6],
      [9, 9, 9],
    ] as const;

    expect(catmullRom(...args, 0)).toEqual([1, 2, 3]);
    expect(catmullRom(...args, 1)).toEqual([4, 5, 6]);
  });

  it('is a straight line through evenly spaced collinear points', () => {
    expect(catmullRom([0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 0], 0.25)).toEqual([1.25, 0, 0]);
  });
});

describe(buildRoute.name, () => {
  it('measures a straight route exactly', () => {
    expect(STRAIGHT.length).toBeCloseTo(30, 9);
    expect(STRAIGHT.samples).toHaveLength(31);
  });

  it('passes through every waypoint', () => {
    const positions = BENT.samples.map((sample) => sample.position);

    expect(positions).toContainEqual([20, 2, 0]);
    expect(positions).toContainEqual([40, 2, 15]);
    expect(positions[positions.length - 1]).toEqual([60, 6, 15]);
  });

  it('stores an increasing distance on its samples', () => {
    for (let index = 1; index < BENT.samples.length; index += 1) expect(BENT.samples[index].s).toBeGreaterThan(BENT.samples[index - 1].s);
    expect(BENT.samples[BENT.samples.length - 1].s).toBe(BENT.length);
  });

  it('is longer than the straight line between its ends when it bends', () => {
    expect(BENT.length).toBeGreaterThan(Math.hypot(60, 6, 15));
  });

  it('handles zero and one waypoint', () => {
    expect(buildRoute([])).toEqual({ length: 0, samples: [] });
    expect(buildRoute([[1, 2, 3]]).samples).toEqual([{ s: 0, position: [1, 2, 3] }]);
  });
});

describe(clampDistance.name, () => {
  it('keeps a distance on the route', () => {
    expect(clampDistance(STRAIGHT, -5)).toBe(0);
    expect(clampDistance(STRAIGHT, 12)).toBe(12);
    expect(clampDistance(STRAIGHT, 99)).toBeCloseTo(30, 9);
    expect(clampDistance(STRAIGHT, Number.NaN)).toBe(0);
  });
});

describe(sampleRoute.name, () => {
  it('interpolates between samples', () => {
    const { position, tangent } = sampleRoute(STRAIGHT, 12.5);

    expect(position[0]).toBeCloseTo(12.5, 9);
    expect(tangent).toEqual([1, 0, 0]);
  });

  it('clamps before the start and after the end', () => {
    expect(sampleRoute(STRAIGHT, -4).position).toEqual([0, 0, 0]);
    expect(sampleRoute(STRAIGHT, 400).position[0]).toBeCloseTo(30, 9);
  });

  it('returns a unit tangent that turns with the route', () => {
    const early = sampleRoute(BENT, 2).tangent;
    const middle = sampleRoute(BENT, BENT.length / 2).tangent;

    expect(Math.hypot(...middle)).toBeCloseTo(1, 9);
    expect(middle[2]).toBeGreaterThan(early[2] + 0.2);
  });

  it('falls back for empty and single-point routes', () => {
    expect(sampleRoute(buildRoute([]), 3)).toEqual({ position: [0, 0, 0], tangent: [1, 0, 0] });
    expect(sampleRoute(buildRoute([[1, 2, 3]]), 3).position).toEqual([1, 2, 3]);
  });
});

describe(railPose.name, () => {
  it('rides behind and above the distance and looks ahead along the line', () => {
    const pose = railPose(STRAIGHT, 15, { height: 4, back: 5, lookAhead: 8 });

    expect(pose.position[0]).toBeCloseTo(10, 9);
    expect(pose.position[1]).toBeCloseTo(4, 9);
    expect(pose.lookAt[0]).toBeCloseTo(23, 9);
    expect(pose.lookAt[1]).toBeCloseTo(0, 9);
  });

  it('backs off the start of the route instead of piling up on it', () => {
    const pose = railPose(STRAIGHT, 0, { back: 6, lookAhead: 8 });

    expect(pose.position[0]).toBeCloseTo(-6, 9);
    expect(pose.lookAt[0]).toBeCloseTo(8, 9);
  });

  it('keeps looking forward at the end of the route', () => {
    const pose = railPose(STRAIGHT, 30, { back: 6, lookAhead: 8 });

    expect(pose.lookAt[0]).toBeCloseTo(38, 9);
    expect(pose.lookAt[0]).toBeGreaterThan(pose.position[0]);
  });

  it('moves forward as the distance grows', () => {
    expect(railPose(BENT, 30).position[0]).toBeGreaterThan(railPose(BENT, 20).position[0]);
  });

  it('offsets sideways to the right of travel', () => {
    const pose = railPose(STRAIGHT, 15, { side: 3 });

    expect(pose.position[2]).toBeCloseTo(3, 9);
  });

  it('clamps a distance beyond the route', () => {
    expect(railPose(STRAIGHT, 500)).toEqual(railPose(STRAIGHT, 30));
  });
});

describe(routeSlice.name, () => {
  it('returns the stretch between two distances with exact ends', () => {
    const slice = routeSlice(STRAIGHT, 4.5, 8.5);

    expect(slice[0][0]).toBeCloseTo(4.5, 9);
    expect(slice[slice.length - 1][0]).toBeCloseTo(8.5, 9);
    expect(slice.length).toBeGreaterThanOrEqual(4);
    for (let index = 1; index < slice.length; index += 1) expect(slice[index][0]).toBeGreaterThan(slice[index - 1][0]);
  });

  it('accepts the distances in either order', () => {
    expect(routeSlice(STRAIGHT, 8.5, 4.5)).toEqual(routeSlice(STRAIGHT, 4.5, 8.5));
  });
});

describe('chainage conversion', () => {
  it('maps kilometres to route distance and back', () => {
    expect(kpToDistance(STRAIGHT, 42, 84)).toBeCloseTo(15, 9);
    expect(distanceToKp(STRAIGHT, 15, 84)).toBeCloseTo(42, 9);
  });

  it('clamps and survives empty input', () => {
    expect(kpToDistance(STRAIGHT, 200, 84)).toBeCloseTo(30, 9);
    expect(kpToDistance(STRAIGHT, 10, 0)).toBe(0);
    expect(distanceToKp(buildRoute([]), 10, 84)).toBe(0);
  });
});

describe(nearestStation.name, () => {
  it('finds the closest station', () => {
    expect(nearestStation(STATIONS, 17)?.id).toBe('bv-1');
    expect(nearestStation(STATIONS, 19)?.id).toBe('compressor');
    expect(nearestStation(STATIONS, 80)?.id).toBe('terminal');
  });

  it('returns null without stations', () => {
    expect(nearestStation([], 5)).toBeNull();
  });
});

describe(stationStep.name, () => {
  it('finds the next station down the line', () => {
    expect(stationStep(STATIONS, 5, 1)?.id).toBe('bv-1');
  });

  it('finds the previous station', () => {
    expect(stationStep(STATIONS, 20, -1)?.id).toBe('bv-1');
  });

  it('skips the station the camera is standing on', () => {
    expect(stationStep(STATIONS, 12, 1)?.id).toBe('compressor');
    expect(stationStep(STATIONS, 12.02, -1)?.id).toBe('landfall');
  });

  it('returns null at either end', () => {
    expect(stationStep(STATIONS, 84, 1)).toBeNull();
    expect(stationStep(STATIONS, 0, -1)).toBeNull();
  });

  it('does not depend on the order of the list', () => {
    expect(stationStep([...STATIONS].reverse(), 5, 1)?.id).toBe('bv-1');
  });
});
