import { aggregate, areaPath, extent, fixedScale, linePath, niceScale, runs, share, summarise, tickIndexes } from './plotMath';

describe('plotMath', () => {
  it('builds a round scale that covers the data', () => {
    const scale = niceScale(41.2, 52.8);

    expect(scale.min).toBeLessThanOrEqual(41.2);
    expect(scale.max).toBeGreaterThanOrEqual(52.8);
    expect(scale.ticks[0]).toBe(scale.min);
    expect(scale.ticks[scale.ticks.length - 1]).toBe(scale.max);
    expect(scale.ticks.every((tick) => Number.isInteger(tick * 2))).toBe(true);
  });

  it('gives a flat series a scale with some height', () => {
    const scale = niceScale(5, 5);

    expect(scale.max).toBeGreaterThan(scale.min);
  });

  it('keeps a fixed scale and puts round ticks inside it', () => {
    expect(fixedScale(8, 16).ticks).toEqual([8, 10, 12, 14, 16]);
    expect(fixedScale(9000, 10200).ticks).toEqual([9000, 9500, 10000]);
    expect(fixedScale(0, 250, 5)).toEqual({ min: 0, max: 250, ticks: [0, 50, 100, 150, 200, 250] });
  });

  it('clamps a share to the range', () => {
    expect(share(5, 0, 10)).toBe(0.5);
    expect(share(-3, 0, 10)).toBe(0);
    expect(share(30, 0, 10)).toBe(1);
    expect(share(3, 2, 2)).toBe(0);
  });

  it('finds the extent across lists and skips gaps', () => {
    expect(extent([[3, null, 9], [1, 4]])).toEqual([1, 9]);
    expect(extent([[null]])).toEqual([0, 1]);
  });

  it('breaks a series into runs at gaps', () => {
    const result = runs([1, 2, null, null, 5], (value, index) => ({ x: index, y: value }));

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual([{ x: 0, y: 1 }, { x: 1, y: 2 }]);
    expect(result[1]).toEqual([{ x: 4, y: 5 }]);
  });

  it('draws straight, stepped and smooth paths', () => {
    const points = [{ x: 0, y: 10 }, { x: 10, y: 0 }, { x: 20, y: 5 }];

    expect(linePath(points, 'linear')).toBe('M0.0 10.0L10.0 0.0L20.0 5.0');
    expect(linePath(points, 'stepAfter')).toBe('M0.0 10.0H10.0V0.0H20.0V5.0');
    expect(linePath(points, 'monotone').match(/C/g)).toHaveLength(2);
    expect(linePath([], 'linear')).toBe('');
  });

  it('closes an area down to the baseline', () => {
    expect(areaPath([{ x: 0, y: 4 }, { x: 10, y: 2 }], 'linear', 100)).toBe('M0.0 4.0L10.0 2.0L10.0 100.0L0.0 100.0Z');
    expect(areaPath([], 'linear', 100)).toBe('');
  });

  it('summarises a series without its gaps', () => {
    const summary = summarise([2, null, 6, 4]);

    expect(summary).toMatchObject({ min: 2, max: 6, mean: 4, first: 2, last: 4, change: 2, count: 3 });
    expect(summarise([null]).count).toBe(0);
  });

  it('aggregates samples into min, max and mean buckets', () => {
    expect(aggregate([1, 3, 5, 7, 9], 2)).toEqual([
      { min: 1, max: 3, mean: 2 },
      { min: 5, max: 7, mean: 6 },
      { min: 9, max: 9, mean: 9 },
    ]);
  });

  it('spaces tick indexes from first to last', () => {
    expect(tickIndexes(25, 5)).toEqual([0, 6, 12, 18, 24]);
    expect(tickIndexes(1, 5)).toEqual([0]);
    expect(tickIndexes(0, 5)).toEqual([]);
  });
});
