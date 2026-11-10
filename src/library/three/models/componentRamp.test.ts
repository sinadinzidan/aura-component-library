import { RAMP_KEYS, RAMP_LABELS, RAMP_SWATCH, RAMP_TOKENS, rampIndex, rampKey, rampStops } from './componentRamp';

describe(rampIndex.name, () => {
  it('puts the bottom of the domain in the first band', () => {
    expect(rampIndex(0, 0, 12, 4)).toBe(0);
  });

  it('puts the top of the domain in the last band', () => {
    expect(rampIndex(12, 0, 12, 4)).toBe(3);
  });

  it('splits the domain into equal bands', () => {
    expect([1, 4, 7, 10].map((value) => rampIndex(value, 0, 12, 4))).toEqual([0, 1, 2, 3]);
  });

  it('puts a boundary value in the upper band', () => {
    expect(rampIndex(3, 0, 12, 4)).toBe(1);
  });

  it('clamps values outside the domain', () => {
    expect(rampIndex(-5, 0, 12, 4)).toBe(0);
    expect(rampIndex(99, 0, 12, 4)).toBe(3);
  });

  it('falls back to the first band for an empty domain or a non-number', () => {
    expect(rampIndex(5, 5, 5, 4)).toBe(0);
    expect(rampIndex(Number.NaN, 0, 12, 4)).toBe(0);
  });
});

describe(rampKey.name, () => {
  it('maps a value to its ramp key', () => {
    expect(rampKey(11.6, 0, 12)).toBe('step3');
    expect(rampKey(2.1, 0, 12)).toBe('step0');
  });
});

describe(rampStops.name, () => {
  it('lists the range of every band, ending exactly on the maximum', () => {
    expect(rampStops(40, 120, 4)).toEqual([
      { from: 40, to: 60 },
      { from: 60, to: 80 },
      { from: 80, to: 100 },
      { from: 100, to: 120 },
    ]);
  });

  it('agrees with rampIndex', () => {
    rampStops(0, 12, 4).forEach((stop, index) => {
      expect(rampIndex((stop.from + stop.to) / 2, 0, 12, 4)).toBe(index);
    });
  });
});

describe('ramp vocabulary', () => {
  it('has a token, a swatch and a word for every step', () => {
    for (const key of RAMP_KEYS) {
      expect(RAMP_TOKENS[key]).toMatch(/^chart-/);
      expect(RAMP_SWATCH[key]).toBe(`bg-${RAMP_TOKENS[key]}`);
      expect(RAMP_LABELS[key]).not.toBe('');
    }
  });
});
