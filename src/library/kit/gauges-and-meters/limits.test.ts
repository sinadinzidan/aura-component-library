import { limitState, limitTone, limitWord, rangeShare, roundTickCount } from './limits';

describe('limits', () => {
  const limits = { low: 40, high: 52, trip: 55 };

  it('reads a value inside the band as normal', () => {
    expect(limitState(46, limits)).toBe('normal');
    expect(limitTone(46, limits)).toBe('success');
    expect(limitWord(46, limits)).toBe('Normal');
  });

  it('warns close to the high limit', () => {
    expect(limitState(51.5, limits)).toBe('near');
    expect(limitWord(51.5, limits)).toBe('Near limit');
  });

  it('tells low, high and trip apart', () => {
    expect(limitState(39, limits)).toBe('low');
    expect(limitState(53, limits)).toBe('high');
    expect(limitState(55, limits)).toBe('trip');
    expect(limitTone(55, limits)).toBe('critical');
  });

  it('is normal when there are no limits', () => {
    expect(limitState(10, {})).toBe('normal');
  });

  it('clamps the share of a range', () => {
    expect(rangeShare(30, 0, 60)).toBe(0.5);
    expect(rangeShare(90, 0, 60)).toBe(1);
    expect(rangeShare(-5, 0, 60)).toBe(0);
    expect(rangeShare(5, 5, 5)).toBe(0);
  });

  it('picks a tick count that gives whole steps', () => {
    expect(roundTickCount(60)).toBe(5);
    expect(roundTickCount(15)).toBe(6);
    expect(roundTickCount(7)).toBe(5);
  });
});
