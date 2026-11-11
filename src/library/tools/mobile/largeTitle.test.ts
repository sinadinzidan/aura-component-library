import { collapseProgress, COLLAPSE_RANGE, isTitleInBar } from './largeTitle';

describe('collapseProgress', () => {
  it('is 0 at the top and 1 after the range', () => {
    expect(collapseProgress(0)).toBe(0);
    expect(collapseProgress(COLLAPSE_RANGE)).toBe(1);
    expect(collapseProgress(COLLAPSE_RANGE * 4)).toBe(1);
  });

  it('is linear in between', () => {
    expect(collapseProgress(28)).toBeCloseTo(0.5);
  });

  it('ignores overscroll above the top', () => {
    expect(collapseProgress(-30)).toBe(0);
  });

  it('uses a given range, and a zero range collapses at once', () => {
    expect(collapseProgress(10, 40)).toBe(0.25);
    expect(collapseProgress(1, 0)).toBe(1);
    expect(collapseProgress(0, 0)).toBe(0);
  });
});

describe('isTitleInBar', () => {
  it('turns on at half', () => {
    expect(isTitleInBar(0.49)).toBe(false);
    expect(isTitleInBar(0.5)).toBe(true);
  });
});
