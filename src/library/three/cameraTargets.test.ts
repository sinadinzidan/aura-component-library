import {
  boundsCenter,
  boundsFromFootprint,
  boundsRadius,
  boundsSize,
  distanceToFit,
  easeInOutCubic,
  frameBounds,
  interpolateTarget,
  lengthVec3,
  lerpVec3,
  normalizeVec3,
  sameTarget,
  unionBounds,
} from './cameraTargets';
import type { Bounds, CameraTarget } from './cameraTargets';

const BOX: Bounds = { min: [-2, 0, -4], max: [2, 6, 4] };

describe('vector helpers', () => {
  it('interpolates between two points', () => {
    expect(lerpVec3([0, 0, 0], [10, 20, -10], 0.5)).toEqual([5, 10, -5]);
  });

  it('normalises to unit length', () => {
    expect(lengthVec3(normalizeVec3([3, 4, 0]))).toBeCloseTo(1);
  });

  it('normalises a zero vector to straight up', () => {
    expect(normalizeVec3([0, 0, 0])).toEqual([0, 1, 0]);
  });
});

describe(easeInOutCubic.name, () => {
  it('starts at 0, ends at 1 and passes the middle at 0.5', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBe(0.5);
    expect(easeInOutCubic(1)).toBe(1);
  });

  it('clamps input outside 0–1', () => {
    expect(easeInOutCubic(-1)).toBe(0);
    expect(easeInOutCubic(2)).toBe(1);
  });

  it('moves slowly at the start', () => {
    expect(easeInOutCubic(0.1)).toBeLessThan(0.1);
  });
});

describe(interpolateTarget.name, () => {
  const from: CameraTarget = { position: [0, 10, 0], lookAt: [0, 0, 0] };
  const to: CameraTarget = { position: [20, 10, 0], lookAt: [10, 0, 0] };

  it('returns the start and end targets at 0 and 1', () => {
    expect(interpolateTarget(from, to, 0)).toEqual(from);
    expect(interpolateTarget(from, to, 1)).toEqual(to);
  });

  it('moves position and look-at together', () => {
    expect(interpolateTarget(from, to, 0.5)).toEqual({ position: [10, 10, 0], lookAt: [5, 0, 0] });
  });
});

describe(sameTarget.name, () => {
  it('compares position and look-at by value', () => {
    const target: CameraTarget = { position: [1, 2, 3], lookAt: [0, 0, 0] };

    expect(sameTarget(target, { position: [1, 2, 3], lookAt: [0, 0, 0] })).toBe(true);
    expect(sameTarget(target, { position: [1, 2, 4], lookAt: [0, 0, 0] })).toBe(false);
    expect(sameTarget(target, { position: [1, 2, 3], lookAt: [0, 1, 0] })).toBe(false);
  });
});

describe('bounds helpers', () => {
  it('finds centre, size and enclosing radius', () => {
    expect(boundsCenter(BOX)).toEqual([0, 3, 0]);
    expect(boundsSize(BOX)).toEqual([4, 6, 8]);
    expect(boundsRadius(BOX)).toBeCloseTo(Math.hypot(4, 6, 8) / 2);
  });

  it('builds a box standing on its centre point', () => {
    expect(boundsFromFootprint([10, 0, 5], [4, 3, 2])).toEqual({ min: [8, 0, 4], max: [12, 3, 6] });
  });

  it('unions boxes', () => {
    expect(unionBounds([BOX, { min: [0, -1, 0], max: [9, 2, 1] }])).toEqual({ min: [-2, -1, -4], max: [9, 6, 4] });
  });

  it('has no union of nothing', () => {
    expect(unionBounds([])).toBeNull();
  });
});

describe(distanceToFit.name, () => {
  it('fits a sphere in a 90° view at radius × √2', () => {
    expect(distanceToFit(10, 90)).toBeCloseTo(10 * Math.SQRT2);
  });

  it('stands further back in a portrait canvas', () => {
    expect(distanceToFit(10, 40, 0.5)).toBeGreaterThan(distanceToFit(10, 40, 1.6));
  });
});

describe(frameBounds.name, () => {
  it('looks at the centre of the box', () => {
    expect(frameBounds(BOX).lookAt).toEqual([0, 3, 0]);
  });

  it('stands far enough away to see the whole box, with padding', () => {
    const target = frameBounds(BOX, { fov: 40, aspect: 1.6, padding: 1.2 });
    const distance = lengthVec3([target.position[0], target.position[1] - 3, target.position[2]]);

    expect(distance).toBeCloseTo(distanceToFit(boundsRadius(BOX), 40, 1.6) * 1.2);
  });

  it('respects a minimum distance for small subjects', () => {
    const target = frameBounds({ min: [0, 0, 0], max: [0.1, 0.1, 0.1] }, { minDistance: 12 });

    expect(lengthVec3([target.position[0] - 0.05, target.position[1] - 0.05, target.position[2] - 0.05])).toBeCloseTo(12);
  });

  it('stands above the subject in the top view', () => {
    const target = frameBounds(BOX, { view: 'top' });

    expect(target.position[1]).toBeGreaterThan(20);
    expect(Math.abs(target.position[0])).toBeLessThan(0.001);
  });

  it('stands on the diagonal in the isometric view', () => {
    const target = frameBounds(BOX, { view: 'isometric' });

    expect(target.position[0]).toBeCloseTo(target.position[2]);
  });
});
