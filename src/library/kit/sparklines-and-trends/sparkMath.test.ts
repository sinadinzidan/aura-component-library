import { changeOf, extremes, isFrozen, shareAbove } from './sparkMath';

describe('sparkMath', () => {
  it('measures the change from first to last and skips gaps', () => {
    expect(changeOf([null, 40, 44, null, 50])).toEqual({ absolute: 10, percent: 25, direction: 'up' });
    expect(changeOf([50, 45]).direction).toBe('down');
    expect(changeOf([50, 50.2], 0.5).direction).toBe('flat');
    expect(changeOf([7])).toEqual({ absolute: 0, percent: 0, direction: 'flat' });
    expect(changeOf([0, 5]).percent).toBe(0);
  });

  it('tells a frozen signal from a moving one', () => {
    expect(isFrozen([38.9, 38.9, 38.9, null, 38.9])).toBe(true);
    expect(isFrozen([38.9, 39.4, 38.7])).toBe(false);
    expect(isFrozen([38.9, 39.0], 0.2)).toBe(true);
    expect(isFrozen([38.9])).toBe(false);
  });

  it('finds the lowest and highest points', () => {
    expect(extremes([3, null, 9, 1, 4])).toEqual({ min: 3, max: 2 });
    expect(extremes([null, null])).toBeNull();
  });

  it('counts the share at or above a limit', () => {
    expect(shareAbove([5, 7, 8, null, 9], 7)).toBe(0.75);
    expect(shareAbove([], 7)).toBe(0);
  });
});
