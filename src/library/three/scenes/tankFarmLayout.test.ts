import { branchRoute, bundRect, farmBounds, headerRoute, movementRoute, shellVolume, tankBounds, tankLabelAnchor } from './tankFarmLayout';
import type { Manifold, TankSpot } from './tankFarmLayout';

const NORTH: TankSpot = { id: 'ta-201', center: [-20, -24], diameter: 16, height: 12 };
const SOUTH: TankSpot = { id: 'ta-206', center: [10, 14], diameter: 12, height: 10 };

const MANIFOLD: Manifold = {
  headerZ: -6,
  y: 1,
  jetty: [
    [40, 1, -6],
    [60, 1, -6],
  ],
  pipeline: [
    [-50, 1, -6],
    [-70, 1, -6],
  ],
};

describe(branchRoute.name, () => {
  it('leaves a northern tank from its south side', () => {
    expect(branchRoute(NORTH, MANIFOLD)).toEqual([
      [-20, 1, -16],
      [-20, 1, -6],
    ]);
  });

  it('leaves a southern tank from its north side', () => {
    expect(branchRoute(SOUTH, MANIFOLD)).toEqual([
      [10, 1, 8],
      [10, 1, -6],
    ]);
  });
});

describe(headerRoute.name, () => {
  it('spans every branch and both ports', () => {
    expect(headerRoute([NORTH, SOUTH], MANIFOLD)).toEqual([
      [-50, 1, -6],
      [40, 1, -6],
    ]);
  });
});

describe(movementRoute.name, () => {
  it('runs a lifting from the tank out to the jetty', () => {
    expect(movementRoute(NORTH, null, MANIFOLD)).toEqual([
      [-20, 1, -16],
      [-20, 1, -6],
      [40, 1, -6],
      [60, 1, -6],
    ]);
  });

  it('runs a receipt from the jetty into the tank', () => {
    expect(movementRoute(null, SOUTH, MANIFOLD)).toEqual([
      [60, 1, -6],
      [40, 1, -6],
      [10, 1, -6],
      [10, 1, 8],
    ]);
  });

  it('brings a pipeline receipt in from the west', () => {
    const route = movementRoute(null, NORTH, MANIFOLD, 'pipeline');

    expect(route[0]).toEqual([-70, 1, -6]);
    expect(route[route.length - 1]).toEqual([-20, 1, -16]);
  });

  it('runs a transfer from one tank over the header into another', () => {
    expect(movementRoute(NORTH, SOUTH, MANIFOLD)).toEqual([
      [-20, 1, -16],
      [-20, 1, -6],
      [10, 1, -6],
      [10, 1, 8],
    ]);
  });

  it('has no route when both ends are outside the farm', () => {
    expect(movementRoute(null, null, MANIFOLD)).toEqual([]);
  });
});

describe(bundRect.name, () => {
  it('wraps the tanks with a margin', () => {
    expect(bundRect([NORTH], 4)).toEqual({ center: [-20, -24], size: [24, 24] });
  });

  it('wraps a row by its widest shells', () => {
    const neighbour: TankSpot = { id: 'ta-202', center: [10, -24], diameter: 12, height: 10 };

    expect(bundRect([NORTH, neighbour], 2)).toEqual({ center: [-6, -24], size: [48, 20] });
  });

  it('returns null for no tanks', () => {
    expect(bundRect([], 4)).toBeNull();
  });
});

describe(tankBounds.name, () => {
  it('boxes the shell and its roof', () => {
    const bounds = tankBounds(NORTH);

    expect(bounds.min).toEqual([-28, 0, -32]);
    expect(bounds.max[1]).toBeCloseTo(13.8);
  });
});

describe(farmBounds.name, () => {
  it('boxes every tank', () => {
    const bounds = farmBounds([NORTH, SOUTH]);

    expect(bounds?.min[0]).toBe(-28);
    expect(bounds?.max[0]).toBe(16);
    expect(bounds?.max[2]).toBe(20);
  });

  it('returns null for no tanks', () => {
    expect(farmBounds([])).toBeNull();
  });
});

describe(tankLabelAnchor.name, () => {
  it('sits above the roof', () => {
    const [x, y, z] = tankLabelAnchor(NORTH, 1);

    expect([x, z]).toEqual([-20, -24]);
    expect(y).toBeCloseTo(14.2);
  });
});

describe(shellVolume.name, () => {
  it('computes a cylinder, rounded to the nearest 10', () => {
    expect(shellVolume(16, 12)).toBe(2410);
  });
});
