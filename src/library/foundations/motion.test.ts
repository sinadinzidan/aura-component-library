import { DURATIONS, EASINGS, findEasing, formatMs, STAGGER_MS, staggerDelay } from './motion';

describe('motion reference', () => {
  it('writes each easing utility from the same control points as its curve', () => {
    for (const easing of EASINGS) {
      const points = easing.curve.replace(/\s/g, '');
      expect(easing.className).toBe(`ease-[${points}]`);
    }
  });

  it('lists the four Aura curves once each', () => {
    expect(EASINGS.map((easing) => easing.id)).toEqual(['standard', 'entrance', 'exit', 'sine']);
  });

  it('orders durations from shortest to longest and names the value in the utility', () => {
    const values = DURATIONS.map((band) => band.ms);
    expect([...values].sort((a, b) => a - b)).toEqual(values);
    for (const band of DURATIONS) expect(band.className).toContain(String(band.ms));
  });
});

describe(findEasing.name, () => {
  it('returns the curve with the given id', () => {
    expect(findEasing('exit').name).toBe('Exit');
  });
});

describe(staggerDelay.name, () => {
  it('offsets each item by one step', () => {
    expect(staggerDelay(0)).toBe(0);
    expect(staggerDelay(3)).toBe(3 * STAGGER_MS);
  });

  it('accepts a custom step', () => {
    expect(staggerDelay(2, 100)).toBe(200);
  });

  it('caps the delay so long lists do not drag', () => {
    expect(staggerDelay(50, 30, 6)).toBe(150);
  });

  it('treats negative and fractional indexes as whole, non-negative positions', () => {
    expect(staggerDelay(-2)).toBe(0);
    expect(staggerDelay(1.8, 10)).toBe(10);
  });
});

describe(formatMs.name, () => {
  it('shows milliseconds under a second', () => {
    expect(formatMs(200)).toBe(`200${String.fromCharCode(160)}ms`);
  });

  it('shows seconds with one decimal from a second up', () => {
    expect(formatMs(1200)).toBe(`1.2${String.fromCharCode(160)}s`);
  });
});
