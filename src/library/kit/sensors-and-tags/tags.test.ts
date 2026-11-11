import { convertPressure, judgeValue, parseTag, qualityStatus, rangeShare, shareInside } from './tags';

describe('tags', () => {
  it('judges a value against its limits', () => {
    const limits = { low: 40, high: 52, highHigh: 55 };
    expect(judgeValue(48, limits).word).toBe('Normal');
    expect(judgeValue(50, limits).word).toBe('Near limit');
    expect(judgeValue(53, limits).word).toBe('Above limit');
    expect(judgeValue(56, limits).word).toBe('Trip level');
    expect(judgeValue(30, limits)).toEqual({ tone: 'critical', word: 'Below limit' });
  });

  it('names every quality', () => {
    expect(qualityStatus('uncertain')).toEqual({ tone: 'warning', word: 'Uncertain' });
    expect(qualityStatus('stale').tone).toBe('neutral');
  });

  it('clamps a share of range', () => {
    expect(rangeShare(30, 0, 60)).toBe(0.5);
    expect(rangeShare(90, 0, 60)).toBe(1);
    expect(rangeShare(5, 10, 10)).toBe(0);
  });

  it('splits a tag into its parts', () => {
    expect(parseTag('23-PT-92531')).toEqual({ area: '23', func: 'PT', loop: '92531' });
    expect(parseTag('NK')).toBeUndefined();
  });

  it('converts pressure units', () => {
    expect(convertPressure(10, 'barg', 'kPa')).toBe(1000);
    expect(convertPressure(10, 'barg', 'psi')).toBeCloseTo(145.04, 2);
    expect(convertPressure(10, 'barg', 'mm')).toBe(10);
  });

  it('counts the share of samples inside the limits', () => {
    expect(shareInside([1, 2, 3, 4], { low: 2, high: 3 })).toBe(0.5);
    expect(shareInside([], { high: 3 })).toBe(1);
  });
});
