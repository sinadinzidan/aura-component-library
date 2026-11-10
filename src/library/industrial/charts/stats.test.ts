import {
  boxStats,
  bucketize,
  correlation,
  cumulativeDistribution,
  heatLevel,
  niceTicks,
  paretoRows,
  quantile,
  summarize,
  vitalFew,
} from './stats';

describe(bucketize.name, () => {
  it('counts values into equal-width bins', () => {
    const bins = bucketize([1, 2, 2, 3, 7, 9], { bins: 2, min: 0, max: 10 });

    expect(bins).toEqual([
      { from: 0, to: 5, count: 4 },
      { from: 5, to: 10, count: 2 },
    ]);
  });

  it('puts the maximum in the last bin', () => {
    const bins = bucketize([0, 10], { bins: 5 });

    expect(bins[0].count).toBe(1);
    expect(bins[4].count).toBe(1);
  });

  it('drops values outside the given range and values that are not finite', () => {
    const bins = bucketize([-5, 1, 99, Number.NaN], { bins: 1, min: 0, max: 10 });

    expect(bins[0].count).toBe(1);
  });

  it('returns no bins for no data and no explicit range', () => {
    expect(bucketize([], { bins: 4 })).toEqual([]);
  });

  it('returns empty bins for no data when the range is given', () => {
    expect(bucketize([], { bins: 2, min: 0, max: 2 }).map((bin) => bin.count)).toEqual([0, 0]);
  });

  it('keeps identical values in one bin', () => {
    const bins = bucketize([5, 5, 5], { bins: 3 });

    expect(bins[0].count).toBe(3);
  });
});

describe(quantile.name, () => {
  it('interpolates between neighbours', () => {
    expect(quantile([4, 1, 3, 2], 0.5)).toBe(2.5);
    expect(quantile([1, 2, 3, 4, 5], 0.25)).toBe(2);
  });

  it('clamps q to 0–1', () => {
    expect(quantile([1, 2, 3], -1)).toBe(1);
    expect(quantile([1, 2, 3], 2)).toBe(3);
  });

  it('returns null for no values', () => {
    expect(quantile([], 0.5)).toBeNull();
  });
});

describe(boxStats.name, () => {
  it('returns the five-number summary', () => {
    expect(boxStats([1, 2, 3, 4, 5])).toEqual({ min: 1, q1: 2, median: 3, q3: 4, max: 5 });
  });

  it('returns null for no values', () => {
    expect(boxStats([])).toBeNull();
  });
});

describe(paretoRows.name, () => {
  it('sorts largest first and accumulates the share', () => {
    const rows = paretoRows([
      { label: 'Seal', value: 10 },
      { label: 'Trip', value: 60 },
      { label: 'Valve', value: 30 },
    ]);

    expect(rows.map((row) => row.label)).toEqual(['Trip', 'Valve', 'Seal']);
    expect(rows.map((row) => row.share)).toEqual([60, 30, 10]);
    expect(rows.map((row) => row.cumulative)).toEqual([60, 90, 100]);
  });

  it('does not divide by zero when every value is zero', () => {
    expect(paretoRows([{ label: 'None', value: 0 }])[0]).toMatchObject({ share: 0, cumulative: 0 });
  });

  it('leaves the input untouched', () => {
    const input = [
      { label: 'a', value: 1 },
      { label: 'b', value: 2 },
    ];

    paretoRows(input);

    expect(input[0].label).toBe('a');
  });
});

describe(vitalFew.name, () => {
  it('counts the rows needed to reach the threshold', () => {
    const rows = paretoRows([
      { label: 'a', value: 50 },
      { label: 'b', value: 35 },
      { label: 'c', value: 15 },
    ]);

    expect(vitalFew(rows)).toBe(2);
    expect(vitalFew(rows, 50)).toBe(1);
  });

  it('returns every row when the threshold is never reached', () => {
    expect(vitalFew([{ label: 'a', value: 0, share: 0, cumulative: 0 }])).toBe(1);
  });
});

describe(cumulativeDistribution.name, () => {
  it('gives the percent of values at or below each value', () => {
    expect(cumulativeDistribution([3, 1, 2, 4])).toEqual([
      { value: 1, share: 25 },
      { value: 2, share: 50 },
      { value: 3, share: 75 },
      { value: 4, share: 100 },
    ]);
  });

  it('returns nothing for no values', () => {
    expect(cumulativeDistribution([])).toEqual([]);
  });
});

describe(correlation.name, () => {
  it('is 1 for series that move together and −1 for opposites', () => {
    expect(correlation([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
    expect(correlation([1, 2, 3], [6, 4, 2])).toBeCloseTo(-1);
  });

  it('is 0 when a series is flat or too short', () => {
    expect(correlation([1, 2, 3], [5, 5, 5])).toBe(0);
    expect(correlation([1], [2])).toBe(0);
  });
});

describe(summarize.name, () => {
  it('returns count, range, mean and the latest value', () => {
    expect(summarize([2, 4, 9])).toEqual({ count: 3, min: 2, max: 9, mean: 5, last: 9 });
  });

  it('returns null for no values', () => {
    expect(summarize([])).toBeNull();
  });
});

describe(heatLevel.name, () => {
  it('splits the range into equal steps', () => {
    expect([0, 24, 25, 50, 75, 100].map((value) => heatLevel(value, 0, 100))).toEqual([0, 0, 1, 2, 3, 3]);
  });

  it('clamps values outside the range', () => {
    expect(heatLevel(-10, 0, 100)).toBe(0);
    expect(heatLevel(500, 0, 100)).toBe(3);
  });

  it('returns the lowest level for an empty range', () => {
    expect(heatLevel(5, 5, 5)).toBe(0);
  });
});

describe(niceTicks.name, () => {
  it('rounds outwards to tidy steps', () => {
    expect(niceTicks(41.3, 54.2)).toEqual([40, 45, 50, 55]);
    expect(niceTicks(0, 100)).toEqual([0, 25, 50, 75, 100]);
  });

  it('handles fractions without floating-point noise', () => {
    expect(niceTicks(0.1, 0.5)).toEqual([0.1, 0.2, 0.3, 0.4, 0.5]);
  });

  it('returns one tick for a flat range and none for bad input', () => {
    expect(niceTicks(5, 5)).toEqual([5]);
    expect(niceTicks(Number.NaN, 1)).toEqual([]);
  });
});
