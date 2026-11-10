import { DEFAULT_TIME_RANGES, findTimeRange } from './timeRanges';

describe(findTimeRange.name, () => {
  it('finds the option by value', () => {
    expect(findTimeRange(DEFAULT_TIME_RANGES, '7d')?.label).toBe('7 d');
  });

  it('falls back to the first option', () => {
    expect(findTimeRange(DEFAULT_TIME_RANGES, 'nope')?.value).toBe('1h');
    expect(findTimeRange([], 'nope')).toBeUndefined();
  });
});
