import { declineRateAt, declineSeries, monthsToLimit } from './decline';

describe(declineRateAt.name, () => {
  it('starts at the initial rate', () => {
    expect(declineRateAt({ initialRate: 1000, declineRate: 0.05 }, 0)).toBe(1000);
  });

  it('declines exponentially by default', () => {
    expect(declineRateAt({ initialRate: 1000, declineRate: 0.05 }, 12)).toBeCloseTo(1000 * Math.exp(-0.6), 6);
  });

  it('declines harmonically with exponent 1', () => {
    expect(declineRateAt({ initialRate: 1000, declineRate: 0.1, exponent: 1 }, 10)).toBeCloseTo(500, 6);
  });

  it('declines more slowly the higher the exponent', () => {
    const exponential = declineRateAt({ initialRate: 1000, declineRate: 0.05, exponent: 0 }, 24);
    const hyperbolic = declineRateAt({ initialRate: 1000, declineRate: 0.05, exponent: 0.5 }, 24);

    expect(hyperbolic).toBeGreaterThan(exponential);
  });

  it('holds the rate when there is no decline', () => {
    expect(declineRateAt({ initialRate: 1000, declineRate: 0 }, 36)).toBe(1000);
  });

  it('treats time before the start as the start', () => {
    expect(declineRateAt({ initialRate: 1000, declineRate: 0.05 }, -3)).toBe(1000);
  });

  it('clamps the exponent to the Arps range', () => {
    expect(declineRateAt({ initialRate: 1000, declineRate: 0.1, exponent: 4 }, 10)).toBeCloseTo(500, 6);
  });
});

describe(declineSeries.name, () => {
  it('returns one point per month from the start time', () => {
    const series = declineSeries({ initialRate: 800, declineRate: 0.04, months: 4, start: 1000, stepMs: 10 });

    expect(series.map((point) => point.t)).toEqual([1000, 1010, 1020, 1030]);
    expect(series[0].v).toBe(800);
  });

  it('never rises', () => {
    const series = declineSeries({ initialRate: 800, declineRate: 0.04, exponent: 0.4, months: 36, start: 0 });

    expect(series.every((point, index) => index === 0 || point.v <= series[index - 1].v)).toBe(true);
  });

  it('continues a history from an offset', () => {
    const parameters = { initialRate: 800, declineRate: 0.04, exponent: 0.4 };
    const whole = declineSeries({ ...parameters, months: 20, start: 0, stepMs: 1, decimals: 2 });
    const tail = declineSeries({ ...parameters, months: 8, start: 12, stepMs: 1, offsetMonths: 12, decimals: 2 });

    expect(tail).toEqual(whole.slice(12));
  });

  it('rounds to the requested decimals', () => {
    const [, second] = declineSeries({ initialRate: 100, declineRate: 0.03, months: 2, start: 0, decimals: 1 });

    expect(second.v).toBe(97);
  });

  it('is empty for zero months', () => {
    expect(declineSeries({ initialRate: 100, declineRate: 0.03, months: 0, start: 0 })).toEqual([]);
  });
});

describe(monthsToLimit.name, () => {
  it('solves the exponential curve', () => {
    expect(monthsToLimit({ initialRate: 1000, declineRate: 0.05 }, 500)).toBe(14);
  });

  it('solves the harmonic curve', () => {
    expect(monthsToLimit({ initialRate: 1000, declineRate: 0.1, exponent: 1 }, 500)).toBe(10);
  });

  it('is zero when already at the limit', () => {
    expect(monthsToLimit({ initialRate: 400, declineRate: 0.05 }, 500)).toBe(0);
  });

  it('is null without a decline or a limit', () => {
    expect(monthsToLimit({ initialRate: 1000, declineRate: 0 }, 500)).toBeNull();
    expect(monthsToLimit({ initialRate: 1000, declineRate: 0.05 }, 0)).toBeNull();
  });
});
