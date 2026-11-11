import { pointOnRoute } from './pointOnRoute';

describe(pointOnRoute.name, () => {
  const route = [
    [0, 1, 0],
    [10, 1, 0],
    [10, 1, 10],
  ] as const;

  it('finds the middle of a route', () => {
    expect(pointOnRoute(route, 0.5)?.position).toEqual([10, 1, 0]);
  });

  it('gives the direction of travel at that point', () => {
    expect(pointOnRoute(route, 0.25)?.direction).toEqual([1, 0, 0]);
    expect(pointOnRoute(route, 0.9)?.direction).toEqual([0, 0, 1]);
  });

  it('clamps outside 0–1 and returns null for a route without length', () => {
    expect(pointOnRoute(route, 3)?.position).toEqual([10, 1, 10]);
    expect(pointOnRoute([[0, 0, 0]], 0.5)).toBeNull();
  });
});
