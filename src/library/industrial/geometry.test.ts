import { arcPath, clamp, fractionToAngle, gaugeHeight, polarToCartesian, ringDash, round2, toFraction } from './geometry';

describe(clamp.name, () => {
  it('keeps a value inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe(toFraction.name, () => {
  it('maps a value to its position in the range', () => {
    expect(toFraction(30, 0, 60)).toBe(0.5);
  });

  it('clamps values outside the range', () => {
    expect(toFraction(-5, 0, 60)).toBe(0);
    expect(toFraction(75, 0, 60)).toBe(1);
  });

  it('is 0 for an empty range or a non-finite value', () => {
    expect(toFraction(5, 10, 10)).toBe(0);
    expect(toFraction(Number.NaN, 0, 10)).toBe(0);
  });
});

describe(round2.name, () => {
  it('rounds to two decimals', () => {
    expect(round2(1.23456)).toBe(1.23);
  });
});

describe(polarToCartesian.name, () => {
  it('puts 0° at 12 o’clock', () => {
    expect(polarToCartesian(50, 50, 40, 0)).toEqual({ x: 50, y: 10 });
  });

  it('goes clockwise', () => {
    expect(polarToCartesian(50, 50, 40, 90)).toEqual({ x: 90, y: 50 });
    expect(polarToCartesian(50, 50, 40, 180)).toEqual({ x: 50, y: 90 });
  });
});

describe(fractionToAngle.name, () => {
  it('spans the 270° gauge arc', () => {
    expect(fractionToAngle(0)).toBe(-135);
    expect(fractionToAngle(0.5)).toBe(0);
    expect(fractionToAngle(1)).toBe(135);
  });

  it('clamps the fraction', () => {
    expect(fractionToAngle(2)).toBe(135);
  });
});

describe(arcPath.name, () => {
  it('draws a clockwise arc between two angles', () => {
    expect(arcPath(50, 50, 40, 0, 90)).toBe('M 50 10 A 40 40 0 0 1 90 50');
  });

  it('sets the large-arc flag past 180°', () => {
    expect(arcPath(50, 50, 40, -135, 135)).toContain('A 40 40 0 1 1');
  });

  it('is empty for an arc with no length', () => {
    expect(arcPath(50, 50, 40, 10, 10)).toBe('');
  });
});

describe(ringDash.name, () => {
  it('draws the given share of the circumference', () => {
    expect(ringDash(10, 0.5)).toBe('31.42 62.83');
  });

  it('clamps the share', () => {
    expect(ringDash(10, 2)).toBe('62.83 62.83');
  });
});

describe(gaugeHeight.name, () => {
  it('ends just below the arc ends', () => {
    expect(gaugeHeight(72, 70, 3)).toBe(125);
  });
});
