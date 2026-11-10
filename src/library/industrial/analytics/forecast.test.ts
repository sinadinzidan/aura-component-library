import { confidenceBand, confidenceLevel, extendSeries, fanScenario, formatLeadTime, knownPoints, mape, percentErrors, timeToLimit, trendSlope } from './forecast';

const HOUR = 3_600_000;

const rising = [0, 1, 2, 3, 4].map((v, index) => ({ t: index * HOUR, v: 10 + v }));

describe('knownPoints', () => {
  it('drops gaps and keeps the order', () => {
    expect(knownPoints([{ t: 1, v: 2 }, { t: 2, v: null }, { t: 3, v: 4 }])).toEqual([{ t: 1, v: 2 }, { t: 3, v: 4 }]);
  });
});

describe('trendSlope', () => {
  it('returns the slope per millisecond of a straight line', () => {
    expect(trendSlope(rising) * HOUR).toBeCloseTo(1);
  });

  it('is zero for a flat series, a single sample and no samples', () => {
    expect(trendSlope([{ t: 0, v: 5 }, { t: HOUR, v: 5 }])).toBe(0);
    expect(trendSlope([{ t: 0, v: 5 }])).toBe(0);
    expect(trendSlope([])).toBe(0);
  });

  it('ignores gaps', () => {
    expect(trendSlope([{ t: 0, v: 0 }, { t: HOUR, v: null }, { t: 2 * HOUR, v: 4 }]) * HOUR).toBeCloseTo(2);
  });
});

describe('extendSeries', () => {
  it('continues from the last value along the recent trend', () => {
    const forecast = extendSeries(rising, { steps: 3 });

    expect(forecast).toEqual([
      { t: 5 * HOUR, v: 15 },
      { t: 6 * HOUR, v: 16 },
      { t: 7 * HOUR, v: 17 },
    ]);
  });

  it('holds the last value when the slope factor is zero', () => {
    expect(extendSeries(rising, { steps: 2, slopeFactor: 0 }).map((point) => point.v)).toEqual([14, 14]);
  });

  it('uses only the lookback window for the trend', () => {
    const bent = [
      { t: 0, v: 0 },
      { t: HOUR, v: 10 },
      { t: 2 * HOUR, v: 10 },
      { t: 3 * HOUR, v: 10 },
    ];

    expect(extendSeries(bent, { steps: 1, lookback: 2 })[0].v).toBe(10);
  });

  it('takes an explicit step and clamps to the range', () => {
    const forecast = extendSeries(rising, { steps: 2, stepMs: 2 * HOUR, max: 17 });

    expect(forecast).toEqual([
      { t: 6 * HOUR, v: 16 },
      { t: 8 * HOUR, v: 17 },
    ]);
  });

  it('adds a repeating wave on top of the trend', () => {
    const forecast = extendSeries([{ t: 0, v: 10 }, { t: HOUR, v: 10 }], { steps: 4, amplitude: 2, periodSteps: 4 });

    expect(forecast.map((point) => point.v)).toEqual([12, 10, 8, 10]);
  });

  it('is deterministic', () => {
    expect(extendSeries(rising, { steps: 6, amplitude: 1 })).toEqual(extendSeries(rising, { steps: 6, amplitude: 1 }));
  });

  it('returns nothing without history or steps', () => {
    expect(extendSeries([], { steps: 3 })).toEqual([]);
    expect(extendSeries(rising, { steps: 0 })).toEqual([]);
  });
});

describe('confidenceBand', () => {
  const forecast = [0, 1, 2, 3, 4].map((index) => ({ t: index, v: 100 }));

  it('widens from the initial half-width to initial plus growth', () => {
    const band = confidenceBand(forecast, { initial: 1, growth: 4, shape: 'linear' });

    expect(band[0]).toEqual({ t: 0, low: 99, high: 101 });
    expect(band[2]).toEqual({ t: 2, low: 97, high: 103 });
    expect(band[4]).toEqual({ t: 4, low: 95, high: 105 });
  });

  it('widens faster at the start with the sqrt shape', () => {
    const band = confidenceBand(forecast, { initial: 0, growth: 4 });

    expect(band[1].high).toBe(102);
    expect(band[4].high).toBe(104);
  });

  it('copes with a single point', () => {
    expect(confidenceBand([{ t: 0, v: 5 }], { initial: 1, growth: 3 })).toEqual([{ t: 0, low: 4, high: 6 }]);
  });
});

describe('timeToLimit', () => {
  it('interpolates the crossing between two samples', () => {
    expect(timeToLimit(rising, 12.5)).toBe(2.5 * HOUR);
  });

  it('returns the sample time when a sample sits on the limit', () => {
    expect(timeToLimit(rising, 12)).toBe(2 * HOUR);
  });

  it('returns null when the limit is never reached', () => {
    expect(timeToLimit(rising, 20)).toBeNull();
    expect(timeToLimit([], 1)).toBeNull();
  });

  it('returns the first timestamp when the series starts beyond the limit', () => {
    expect(timeToLimit(rising, 5)).toBe(0);
  });

  it('finds a falling crossing', () => {
    const falling = [10, 8, 6, 4].map((v, index) => ({ t: index * HOUR, v }));

    expect(timeToLimit(falling, 5, 'falling')).toBe(2.5 * HOUR);
    expect(timeToLimit(falling, 5)).toBe(0);
  });
});

describe('percentErrors and mape', () => {
  const actual = [
    { t: 1, v: 100 },
    { t: 2, v: 200 },
    { t: 3, v: null },
    { t: 4, v: 50 },
  ];
  const predicted = [
    { t: 1, v: 110 },
    { t: 2, v: 180 },
    { t: 3, v: 10 },
  ];

  it('gives the absolute percent error where both series have a value', () => {
    expect(percentErrors(actual, predicted)).toEqual([
      { t: 1, v: 10 },
      { t: 2, v: 10 },
    ]);
  });

  it('skips actual values of zero', () => {
    expect(percentErrors([{ t: 1, v: 0 }], [{ t: 1, v: 3 }])).toEqual([]);
  });

  it('averages the errors', () => {
    expect(mape(actual, predicted)).toBe(10);
  });

  it('is null when nothing matches', () => {
    expect(mape(actual, [{ t: 9, v: 1 }])).toBeNull();
  });
});

describe('fanScenario', () => {
  it('grows the change from zero at the first point to the full change at the last', () => {
    const base = [0, 1, 2].map((index) => ({ t: index, v: 100 }));

    expect(fanScenario(base, 0.1).map((point) => point.v)).toEqual([100, 105, 110]);
    expect(fanScenario(base, -0.2).map((point) => point.v)).toEqual([100, 90, 80]);
  });
});

describe('confidenceLevel', () => {
  it('names the three levels at their boundaries', () => {
    expect(confidenceLevel(0.8)).toBe('high');
    expect(confidenceLevel(0.79)).toBe('medium');
    expect(confidenceLevel(0.5)).toBe('medium');
    expect(confidenceLevel(0.49)).toBe('low');
  });
});

describe('formatLeadTime', () => {
  it('uses minutes under an hour, hours under two days and days after', () => {
    expect(formatLeadTime(40 * 60_000)).toBe('40 min');
    expect(formatLeadTime(6.2 * HOUR)).toBe('6 h');
    expect(formatLeadTime(47 * HOUR)).toBe('47 h');
    expect(formatLeadTime(72 * HOUR)).toBe('3 d');
  });

  it('never shows less than a minute or a negative time', () => {
    expect(formatLeadTime(10)).toBe('1 min');
    expect(formatLeadTime(-HOUR)).toBe('1 min');
  });
});
