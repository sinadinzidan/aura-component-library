import { createRandom, formatAgo, HOUR, makeSeries, makeValues, MINUTE, REFERENCE_NOW } from './series';

describe(createRandom.name, () => {
  it('produces the same sequence for the same seed', () => {
    const first = createRandom(42);
    const second = createRandom(42);

    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
  });

  it('produces values in [0, 1)', () => {
    const random = createRandom(7);

    for (let index = 0; index < 200; index += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe(makeSeries.name, () => {
  it('is deterministic', () => {
    const options = { seed: 3, points: 24, base: 50, amplitude: 5, noise: 1 };

    expect(makeSeries(options)).toEqual(makeSeries(options));
  });

  it('ends at the reference time and steps evenly', () => {
    const series = makeSeries({ seed: 1, points: 4, base: 10, stepMs: 15 * MINUTE });

    expect(series.map((point) => point.t)).toEqual([
      REFERENCE_NOW - 45 * MINUTE,
      REFERENCE_NOW - 30 * MINUTE,
      REFERENCE_NOW - 15 * MINUTE,
      REFERENCE_NOW,
    ]);
  });

  it('applies drift from first to last point', () => {
    const series = makeSeries({ seed: 1, points: 3, base: 10, drift: 6 });

    expect(series.map((point) => point.v)).toEqual([10, 13, 16]);
  });

  it('clamps to min and max', () => {
    const values = makeValues({ seed: 9, points: 50, base: 50, amplitude: 40, noise: 10, min: 40, max: 60 });

    expect(Math.min(...values)).toBeGreaterThanOrEqual(40);
    expect(Math.max(...values)).toBeLessThanOrEqual(60);
  });

  it('rounds to the requested decimals', () => {
    const values = makeValues({ seed: 5, points: 10, base: 1.23456, noise: 0.5, decimals: 2 });

    expect(values.every((value) => Number.isInteger(Math.round(value * 100)))).toBe(true);
  });
});

describe(formatAgo.name, () => {
  it('formats minutes, hours and days', () => {
    expect(formatAgo(REFERENCE_NOW - 12 * MINUTE)).toBe('12 min ago');
    expect(formatAgo(REFERENCE_NOW - 3 * HOUR)).toBe('3 h ago');
    expect(formatAgo(REFERENCE_NOW - 50 * HOUR)).toBe('2 d ago');
  });

  it('never reports less than one minute', () => {
    expect(formatAgo(REFERENCE_NOW)).toBe('1 min ago');
  });
});
