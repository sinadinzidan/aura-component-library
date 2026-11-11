import { domainTicks, findCrossings, findExtremes, fitDomain, linePath, nearestIndex, summarizeRange, xShare, yShare } from './annotations';

describe('annotations', () => {
  it('fits a domain around the values and the limits', () => {
    const [min, max] = fitDomain([10, null, 20], [30], 0.1);

    expect(min).toBeCloseTo(8);
    expect(max).toBeCloseTo(32);
  });

  it('falls back to a unit domain when there is nothing to fit', () => {
    expect(fitDomain([null])).toEqual([0, 1]);
  });

  it('places indexes and values as shares of the plot', () => {
    expect(xShare(5, 11)).toBe(0.5);
    expect(xShare(0, 1)).toBe(0.5);
    expect(yShare(75, [0, 100])).toBe(0.25);
    expect(yShare(200, [0, 100])).toBe(0);
  });

  it('spaces ticks evenly across the domain', () => {
    expect(domainTicks([0, 8], 4)).toEqual([0, 2, 4, 6, 8]);
  });

  it('finds the nearest index and clamps it to the series', () => {
    expect(nearestIndex(0.49, 11)).toBe(5);
    expect(nearestIndex(1.4, 11)).toBe(10);
    expect(nearestIndex(-1, 11)).toBe(0);
  });

  it('finds every crossing of a limit with its direction', () => {
    expect(findCrossings([1, 3, null, 4, 2], 2.5)).toEqual([
      { index: 1, direction: 'up' },
      { index: 4, direction: 'down' },
    ]);
  });

  it('finds the extremes and ignores gaps', () => {
    expect(findExtremes([3, null, 9, 1])).toEqual({ minIndex: 3, maxIndex: 2, min: 1, max: 9 });
    expect(findExtremes([null])).toBeNull();
  });

  it('summarises a selected range in either direction', () => {
    expect(summarizeRange([1, 2, 6, 3], 2, 0)).toEqual({ count: 3, min: 1, max: 6, mean: 3, change: 5 });
    expect(summarizeRange([null, null], 0, 1)).toBeNull();
  });

  it('draws a broken line across a gap', () => {
    const path = linePath([0, 10, null, 10], [0, 10], 'linear');

    expect(path.match(/M/g)).toHaveLength(2);
    expect(path).toContain('L33.33,0.00');
  });

  it('draws steps and curves when asked', () => {
    expect(linePath([0, 10], [0, 10], 'stepAfter')).toBe('M0.00,100.00H100.00V0.00');
    expect(linePath([0, 10], [0, 10], 'monotone')).toContain('C50.00,100.00 50.00,0.00 100.00,0.00');
  });
});
