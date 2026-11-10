import { COMPASS_8, bearingPoint, prevailingIndex, sectorBearing, sectorPath, valueRadius } from './polar';

describe(bearingPoint.name, () => {
  it('puts north straight up', () => {
    expect(bearingPoint(50, 50, 40, 0)).toEqual({ x: 50, y: 10 });
  });

  it('puts east to the right', () => {
    expect(bearingPoint(50, 50, 40, 90)).toEqual({ x: 90, y: 50 });
  });

  it('puts south straight down', () => {
    expect(bearingPoint(50, 50, 40, 180)).toEqual({ x: 50, y: 90 });
  });

  it('puts west to the left', () => {
    expect(bearingPoint(50, 50, 40, 270)).toEqual({ x: 10, y: 50 });
  });

  it('rounds to two decimals', () => {
    expect(bearingPoint(0, 0, 10, 45)).toEqual({ x: 7.07, y: -7.07 });
  });
});

describe(sectorBearing.name, () => {
  it('spreads eight sectors 45 degrees apart from north', () => {
    expect(COMPASS_8.map((_, index) => sectorBearing(index, 8))).toEqual([0, 45, 90, 135, 180, 225, 270, 315]);
  });

  it('wraps around', () => {
    expect(sectorBearing(9, 8)).toBe(45);
  });

  it('is zero for an empty circle', () => {
    expect(sectorBearing(3, 0)).toBe(0);
  });
});

describe(sectorPath.name, () => {
  it('draws a wedge from the centre when the inner radius is zero', () => {
    expect(sectorPath(50, 50, 0, 40, 90, 90)).toBe('M 50 50 L 78.28 21.72 A 40 40 0 0 1 78.28 78.28 Z');
  });

  it('draws a ring sector between two radii', () => {
    const path = sectorPath(50, 50, 10, 40, 0, 90);

    expect(path).toBe('M 21.72 21.72 A 40 40 0 0 1 78.28 21.72 L 57.07 42.93 A 10 10 0 0 0 42.93 42.93 Z');
  });

  it('uses the large arc for sectors wider than half a turn', () => {
    expect(sectorPath(50, 50, 0, 40, 0, 270)).toContain('A 40 40 0 1 1');
  });
});

describe(valueRadius.name, () => {
  it('maps zero to the inner radius and the maximum to the outer radius', () => {
    expect(valueRadius(0, 20, 10, 50)).toBe(10);
    expect(valueRadius(20, 20, 10, 50)).toBe(50);
  });

  it('is linear in between', () => {
    expect(valueRadius(5, 20, 10, 50)).toBe(20);
  });

  it('clamps values outside the scale', () => {
    expect(valueRadius(40, 20, 10, 50)).toBe(50);
    expect(valueRadius(-4, 20, 10, 50)).toBe(10);
  });

  it('falls back to the inner radius without a scale', () => {
    expect(valueRadius(5, 0, 10, 50)).toBe(10);
  });
});

describe(prevailingIndex.name, () => {
  it('finds the largest value', () => {
    expect(prevailingIndex([4, 9, 21, 7])).toBe(2);
  });

  it('keeps the first of equal values', () => {
    expect(prevailingIndex([4, 9, 9])).toBe(1);
  });

  it('is -1 for no values', () => {
    expect(prevailingIndex([])).toBe(-1);
  });
});
