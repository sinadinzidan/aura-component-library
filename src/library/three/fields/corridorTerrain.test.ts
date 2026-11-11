import { corridorHeight, routeAtX } from './corridorTerrain';
import { buildRoute } from './routeSpline';

const ROUTE = buildRoute(
  [
    [0, 1, 0],
    [50, 4, 6],
    [100, 9, -4],
    [150, 3, 0],
  ],
  12
);

describe(routeAtX.name, () => {
  it('returns the height and z of the route at a waypoint', () => {
    const at = routeAtX(ROUTE, 50);

    expect(at.y).toBeCloseTo(4, 6);
    expect(at.z).toBeCloseTo(6, 6);
  });

  it('interpolates between samples', () => {
    const at = routeAtX(ROUTE, 75);

    expect(at.y).toBeGreaterThan(4);
    expect(at.y).toBeLessThan(9);
  });

  it('holds the nearest end outside the route', () => {
    expect(routeAtX(ROUTE, -30)).toEqual({ y: 1, z: 0 });
    expect(routeAtX(ROUTE, 400)).toEqual({ y: 3, z: 0 });
  });

  it('returns zero for an empty route', () => {
    expect(routeAtX(buildRoute([]), 5)).toEqual({ y: 0, z: 0 });
  });
});

describe(corridorHeight.name, () => {
  it('lies one clearance below the line directly under it', () => {
    const line = routeAtX(ROUTE, 60);

    expect(corridorHeight(ROUTE, 60, line.z, { clearance: 0.5 })).toBeCloseTo(line.y - 0.5, 9);
  });

  it('keeps the shoulder level', () => {
    const line = routeAtX(ROUTE, 60);

    expect(corridorHeight(ROUTE, 60, line.z + 5, { shoulder: 7 })).toBeCloseTo(corridorHeight(ROUTE, 60, line.z, { shoulder: 7 }), 9);
  });

  it('raises hills away from the line, never below the strip', () => {
    const line = routeAtX(ROUTE, 60);
    const strip = corridorHeight(ROUTE, 60, line.z);
    const far = [20, 30, 40, 50].map((offset) => corridorHeight(ROUTE, 60, line.z + offset));

    for (const height of far) expect(height).toBeGreaterThanOrEqual(strip - 1e-9);
    expect(Math.max(...far)).toBeGreaterThan(strip + 0.5);
  });

  it('drops the ground at a crossing while the line keeps its height', () => {
    const line = routeAtX(ROUTE, 100);
    const dips = [{ x: 100, width: 12, depth: 4 }];

    expect(corridorHeight(ROUTE, 100, line.z, { dips, clearance: 0.6 })).toBeCloseTo(line.y - 0.6 - 4, 9);
    expect(corridorHeight(ROUTE, 106, line.z, { dips })).toBeCloseTo(corridorHeight(ROUTE, 106, line.z), 9);
    expect(corridorHeight(ROUTE, 103, line.z, { dips })).toBeLessThan(corridorHeight(ROUTE, 103, line.z));
  });

  it('is deterministic', () => {
    expect(corridorHeight(ROUTE, 33, 21)).toBe(corridorHeight(ROUTE, 33, 21));
  });
});
