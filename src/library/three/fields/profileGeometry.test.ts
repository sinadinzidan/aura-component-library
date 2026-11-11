import { kpOfX, kpTicks, profileAreaPath, profileLinePath, valueAtKp, valueExtent, xOfKp, yOfValue } from './profileGeometry';
import type { ProfileFrame } from './profileGeometry';

const FRAME: ProfileFrame = { width: 1000, height: 200, left: 50, right: 50, top: 20, bottom: 30 };

describe(xOfKp.name, () => {
  it('maps the ends of the line to the edges of the plot', () => {
    expect(xOfKp(FRAME, 0, 84)).toBe(50);
    expect(xOfKp(FRAME, 84, 84)).toBe(950);
    expect(xOfKp(FRAME, 42, 84)).toBe(500);
  });

  it('clamps and survives a zero-length line', () => {
    expect(xOfKp(FRAME, 200, 84)).toBe(950);
    expect(xOfKp(FRAME, 10, 0)).toBe(50);
  });
});

describe(kpOfX.name, () => {
  it('is the inverse of xOfKp', () => {
    expect(kpOfX(FRAME, xOfKp(FRAME, 31.5, 84), 84)).toBeCloseTo(31.5, 6);
  });

  it('clamps clicks in the margins to the ends', () => {
    expect(kpOfX(FRAME, 10, 84)).toBe(0);
    expect(kpOfX(FRAME, 990, 84)).toBe(84);
  });

  it('returns zero for a frame without a plot', () => {
    expect(kpOfX({ ...FRAME, width: 80 }, 40, 84)).toBe(0);
  });
});

describe(yOfValue.name, () => {
  it('puts the minimum on the bottom edge and the maximum on the top', () => {
    expect(yOfValue(FRAME, 0, 0, 100)).toBe(170);
    expect(yOfValue(FRAME, 100, 0, 100)).toBe(20);
    expect(yOfValue(FRAME, 50, 0, 100)).toBe(95);
  });

  it('clamps values outside the scale and centres a flat scale', () => {
    expect(yOfValue(FRAME, 400, 0, 100)).toBe(20);
    expect(yOfValue(FRAME, 5, 5, 5)).toBe(95);
  });
});

describe(valueExtent.name, () => {
  it('pads the range', () => {
    expect(valueExtent([{ kp: 0, value: 10 }, { kp: 1, value: 20 }], 0.1)).toEqual([9, 21]);
  });

  it('handles flat and empty series', () => {
    expect(valueExtent([{ kp: 0, value: 4 }], 0.5)).toEqual([3.5, 4.5]);
    expect(valueExtent([])).toEqual([0, 1]);
  });
});

describe('profile paths', () => {
  const points = [
    { kp: 0, value: 0 },
    { kp: 42, value: 100 },
    { kp: 84, value: 50 },
  ];

  it('draws a line through the points', () => {
    expect(profileLinePath(FRAME, points, 84, 0, 100)).toBe('M 50 170 L 500 20 L 950 95');
  });

  it('closes the area down to the bottom of the plot', () => {
    expect(profileAreaPath(FRAME, points, 84, 0, 100)).toBe('M 50 170 L 500 20 L 950 95 L 950 170 L 50 170 Z');
  });

  it('is empty for fewer than two points', () => {
    expect(profileLinePath(FRAME, [points[0]], 84, 0, 100)).toBe('');
    expect(profileAreaPath(FRAME, [], 84, 0, 100)).toBe('');
  });
});

describe(valueAtKp.name, () => {
  const points = [
    { kp: 0, value: 10 },
    { kp: 10, value: 30 },
    { kp: 10, value: 50 },
    { kp: 20, value: 40 },
  ];

  it('interpolates between points', () => {
    expect(valueAtKp(points, 5)).toBe(20);
    expect(valueAtKp(points, 15)).toBe(45);
  });

  it('holds the ends and handles an empty series', () => {
    expect(valueAtKp(points, -3)).toBe(10);
    expect(valueAtKp(points, 99)).toBe(40);
    expect(valueAtKp([], 5)).toBeNull();
  });

  it('takes the first value at a vertical step', () => {
    expect(valueAtKp(points, 10)).toBe(30);
  });
});

describe(kpTicks.name, () => {
  it('steps along the line and always ends on its length', () => {
    expect(kpTicks(84, 20)).toEqual([0, 20, 40, 60, 84]);
    expect(kpTicks(80, 20)).toEqual([0, 20, 40, 60, 80]);
  });

  it('drops a tick that would crowd the last one', () => {
    expect(kpTicks(83, 10)).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 83]);
  });

  it('survives bad input', () => {
    expect(kpTicks(0, 10)).toEqual([0]);
    expect(kpTicks(84, 0)).toEqual([0]);
  });
});
