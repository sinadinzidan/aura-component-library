import { aggregatePoints, extent, mergeSeries, sliceByTime, splitAtThreshold, timeFraction, valueAt } from './trendData';

describe(mergeSeries.name, () => {
  it('builds one row per timestamp with a column per series', () => {
    const rows = mergeSeries([
      { key: 'a', points: [{ t: 1, v: 10 }, { t: 2, v: 11 }] },
      { key: 'b', points: [{ t: 1, v: 20 }, { t: 2, v: 21 }] },
    ]);

    expect(rows).toEqual([
      { t: 1, a: 10, b: 20 },
      { t: 2, a: 11, b: 21 },
    ]);
  });

  it('fills null where a series has no point and sorts by time', () => {
    const rows = mergeSeries([
      { key: 'a', points: [{ t: 2, v: 11 }, { t: 1, v: 10 }] },
      { key: 'b', points: [{ t: 2, v: 21 }] },
    ]);

    expect(rows).toEqual([
      { t: 1, a: 10, b: null },
      { t: 2, a: 11, b: 21 },
    ]);
  });

  it('adds range columns as low–high pairs', () => {
    const rows = mergeSeries([{ key: 'avg', points: [{ t: 1, v: 5 }] }], [{ key: 'band', points: [{ t: 1, low: 3, high: 8 }] }]);

    expect(rows).toEqual([{ t: 1, avg: 5, band: [3, 8] }]);
  });
});

describe(aggregatePoints.name, () => {
  it('returns min, max and average per bucket', () => {
    const result = aggregatePoints(
      [
        { t: 0, v: 1 },
        { t: 5, v: 3 },
        { t: 10, v: 10 },
      ],
      10
    );

    expect(result).toEqual([
      { t: 0, min: 1, max: 3, avg: 2 },
      { t: 10, min: 10, max: 10, avg: 10 },
    ]);
  });

  it('skips gaps', () => {
    expect(aggregatePoints([{ t: 0, v: null }, { t: 1, v: 4 }], 10)).toEqual([{ t: 0, min: 4, max: 4, avg: 4 }]);
  });
});

describe(splitAtThreshold.name, () => {
  it('adds a point on the threshold at each crossing', () => {
    const { base, over } = splitAtThreshold(
      [
        { t: 0, v: 0 },
        { t: 10, v: 10 },
        { t: 20, v: 0 },
      ],
      5
    );

    expect(base.map((point) => point.t)).toEqual([0, 5, 10, 15, 20]);
    expect(over).toEqual([
      { t: 0, v: null },
      { t: 5, v: 5 },
      { t: 10, v: 10 },
      { t: 15, v: 5 },
      { t: 20, v: null },
    ]);
  });

  it('returns an all-null overlay when the series stays below', () => {
    const { over } = splitAtThreshold([{ t: 0, v: 1 }, { t: 1, v: 2 }], 5);

    expect(over.every((point) => point.v === null)).toBe(true);
  });

  it('does not interpolate across a gap', () => {
    const { base } = splitAtThreshold([{ t: 0, v: 1 }, { t: 1, v: null }, { t: 2, v: 9 }], 5);

    expect(base).toHaveLength(3);
  });
});

describe(valueAt.name, () => {
  it('returns the value of the nearest point in time', () => {
    const points = [{ t: 0, v: 1 }, { t: 10, v: 2 }, { t: 20, v: 3 }];

    expect(valueAt(points, 12)).toBe(2);
    expect(valueAt(points, 99)).toBe(3);
  });

  it('returns null for an empty series', () => {
    expect(valueAt([], 5)).toBeNull();
  });
});

describe(sliceByTime.name, () => {
  it('keeps points inside the range, ends included', () => {
    const points = [{ t: 0 }, { t: 5 }, { t: 10 }, { t: 15 }];

    expect(sliceByTime(points, 5, 10)).toEqual([{ t: 5 }, { t: 10 }]);
  });
});

describe(extent.name, () => {
  it('returns the smallest and largest number, ignoring gaps', () => {
    expect(extent([3, null, 9, undefined, 1])).toEqual([1, 9]);
  });

  it('returns null when nothing is left', () => {
    expect(extent([null, undefined, Number.NaN])).toBeNull();
  });
});

describe(timeFraction.name, () => {
  it('gives the position as a percentage', () => {
    expect(timeFraction(5, 0, 20)).toBe(25);
  });

  it('clamps outside the range and guards an empty range', () => {
    expect(timeFraction(-5, 0, 20)).toBe(0);
    expect(timeFraction(50, 0, 20)).toBe(100);
    expect(timeFraction(5, 10, 10)).toBe(0);
  });
});
