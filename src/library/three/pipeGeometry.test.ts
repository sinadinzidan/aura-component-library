import { chevronDistances, pointAlong, polylineLength, quaternionFromY, segmentTransform } from './pipeGeometry';
import type { Quaternion } from './pipeGeometry';

const ROUTE = [
  [0, 0, 0],
  [10, 0, 0],
  [10, 5, 0],
] as const;

function rotateY(quaternion: Quaternion): number[] {
  // Rotates the unit y vector by the quaternion.
  const [x, y, z, w] = quaternion;
  return [2 * (x * y - w * z), 1 - 2 * (x * x + z * z), 2 * (y * z + w * x)];
}

describe(quaternionFromY.name, () => {
  it('is the identity for a vertical direction', () => {
    expect(quaternionFromY([0, 3, 0])).toEqual([0, 0, 0, 1]);
  });

  it('turns y onto the given direction', () => {
    const rotated = rotateY(quaternionFromY([1, 0, 0]));

    expect(rotated[0]).toBeCloseTo(1);
    expect(rotated[1]).toBeCloseTo(0);
    expect(rotated[2]).toBeCloseTo(0);
  });

  it('turns y onto a diagonal direction', () => {
    const rotated = rotateY(quaternionFromY([0, 1, 1]));

    expect(rotated[1]).toBeCloseTo(Math.SQRT1_2);
    expect(rotated[2]).toBeCloseTo(Math.SQRT1_2);
  });

  it('handles straight down', () => {
    expect(rotateY(quaternionFromY([0, -1, 0]))[1]).toBeCloseTo(-1);
  });
});

describe(segmentTransform.name, () => {
  it('centres the segment and measures its length', () => {
    const transform = segmentTransform([0, 0, 0], [0, 0, 8]);

    expect(transform.center).toEqual([0, 0, 4]);
    expect(transform.length).toBe(8);
  });
});

describe(polylineLength.name, () => {
  it('sums the segments', () => {
    expect(polylineLength(ROUTE)).toBe(15);
  });

  it('is zero for fewer than two points', () => {
    expect(polylineLength([[1, 2, 3]])).toBe(0);
  });
});

describe(pointAlong.name, () => {
  it('finds a point on the first segment', () => {
    expect(pointAlong(ROUTE, 4)).toEqual({ position: [4, 0, 0], direction: [1, 0, 0] });
  });

  it('continues onto later segments', () => {
    expect(pointAlong(ROUTE, 12)).toEqual({ position: [10, 2, 0], direction: [0, 1, 0] });
  });

  it('clamps beyond the end of the route', () => {
    expect(pointAlong(ROUTE, 99)?.position).toEqual([10, 5, 0]);
  });

  it('returns null for a route without a segment', () => {
    expect(pointAlong([[0, 0, 0]], 1)).toBeNull();
  });
});

describe(chevronDistances.name, () => {
  it('spaces chevrons evenly, centred in their cells', () => {
    expect(chevronDistances(12, 4)).toEqual([2, 6, 10]);
  });

  it('slides with the offset and wraps at the spacing', () => {
    expect(chevronDistances(12, 4, 1)).toEqual([3, 7, 11]);
    expect(chevronDistances(12, 4, 5)).toEqual([3, 7, 11]);
  });

  it('drops chevrons that would pass the end', () => {
    expect(chevronDistances(12, 4, 3)).toEqual([5, 9]);
  });

  it('returns none for an empty route or spacing', () => {
    expect(chevronDistances(0, 4)).toEqual([]);
    expect(chevronDistances(10, 0)).toEqual([]);
  });
});
