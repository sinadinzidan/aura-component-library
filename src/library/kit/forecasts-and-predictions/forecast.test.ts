import { coverage, fan, formatLead, mape, project, stepsToLimit, trendSlope, widen } from './forecast';

describe('forecast helpers', () => {
  it('fits the slope of a straight line', () => {
    expect(trendSlope([1, 2, 3, 4])).toBeCloseTo(1);
    expect(trendSlope([5])).toBe(0);
  });

  it('continues a series along its trend without repeating history', () => {
    expect(project([1, 2, 3], { steps: 3, decimals: 0 })).toEqual([4, 5, 6]);
    expect(project([1, 2, 3], { steps: 2, slopeFactor: 0, decimals: 0 })).toEqual([3, 3]);
    expect(project([], { steps: 3 })).toEqual([]);
  });

  it('clamps a projection to its physical range', () => {
    expect(project([98, 99, 100], { steps: 2, max: 100, decimals: 0 })).toEqual([100, 100]);
  });

  it('widens the range with the horizon', () => {
    const ranges = widen([10, 10, 10], 1, 2, 0);
    expect(ranges[0]).toEqual({ low: 9, high: 11 });
    expect(ranges[2]).toEqual({ low: 7, high: 13 });
  });

  it('finds the step where a rising forecast meets its limit', () => {
    expect(stepsToLimit(4, [5, 6, 7], 6.5)).toBeCloseTo(2.5);
    expect(stepsToLimit(4, [5, 6], 9)).toBeNull();
    expect(stepsToLimit(9, [10], 9)).toBe(0);
    expect(stepsToLimit(10, [8, 6], 7, 'falling')).toBeCloseTo(1.5);
  });

  it('scores a backtest', () => {
    expect(mape([100, 200], [110, 180])).toBeCloseTo(10);
    expect(mape([], [])).toBeNull();
    expect(coverage([5, 20], [{ low: 0, high: 10 }, { low: 0, high: 10 }])).toBe(50);
    expect(coverage([], [])).toBeNull();
  });

  it('fans a scenario out from the first point', () => {
    expect(fan([100, 100, 100], 0.1, 0)).toEqual([100, 105, 110]);
  });

  it('writes lead times the way people say them', () => {
    expect(formatLead(0.5)).toBe('30 min');
    expect(formatLead(5)).toBe('5 h');
    expect(formatLead(76)).toBe('3 d 4 h');
    expect(formatLead(48)).toBe('2 d');
  });
});
