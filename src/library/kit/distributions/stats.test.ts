import { boxStats, bucketize, correlation, cumulativeShare, linearTicks, percent, quantile, share } from './stats';

describe('distribution stats', () => {
  it('counts every value once and clamps outliers into the end bins', () => {
    expect(bucketize([-5, 0.5, 1.5, 1.6, 99], { bins: 4, min: 0, max: 4 })).toEqual([2, 2, 0, 1]);
  });

  it('interpolates quantiles and tolerates an empty series', () => {
    expect(quantile([4, 1, 3, 2], 0.5)).toBe(2.5);
    expect(quantile([], 0.5)).toBe(0);
  });

  it('summarises a series as five numbers', () => {
    expect(boxStats([1, 2, 3, 4, 5])).toEqual({ min: 1, q1: 2, median: 3, q3: 4, max: 5 });
  });

  it('measures correlation between −1 and 1', () => {
    expect(correlation([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
    expect(correlation([1, 2, 3], [6, 4, 2])).toBeCloseTo(-1);
    expect(correlation([1, 1, 1], [1, 2, 3])).toBe(0);
  });

  it('accumulates shares up to one hundred percent', () => {
    expect(cumulativeShare([1, 1, 2])).toEqual([25, 50, 100]);
  });

  it('spaces ticks evenly with both ends included', () => {
    expect(linearTicks(0, 10, 4)).toEqual([0, 2.5, 5, 7.5, 10]);
  });

  it('places a value on its range, clamped', () => {
    expect(share(15, 10, 20)).toBe(0.5);
    expect(share(99, 10, 20)).toBe(1);
    expect(percent(15, 10, 20)).toBe('50.00%');
  });
});
