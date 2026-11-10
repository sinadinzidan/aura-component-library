import { formatCount, usageLevel, usagePercent, usageShare } from './usage';

describe(usageShare.name, () => {
  it('returns the used share of the limit', () => {
    expect(usageShare(250, 1000)).toBe(0.25);
  });

  it('clamps to the range of the bar', () => {
    expect(usageShare(1200, 1000)).toBe(1);
    expect(usageShare(-5, 1000)).toBe(0);
  });

  it('treats a missing limit as empty', () => {
    expect(usageShare(10, 0)).toBe(0);
    expect(usageShare(10, Number.NaN)).toBe(0);
    expect(usageShare(Number.NaN, 10)).toBe(0);
  });
});

describe(usageLevel.name, () => {
  it('is normal below the warning share', () => {
    expect(usageLevel(790, 1000)).toBe('normal');
  });

  it('is near from the warning share', () => {
    expect(usageLevel(800, 1000)).toBe('near');
    expect(usageLevel(999, 1000)).toBe('near');
  });

  it('is reached exactly at the limit and over beyond it', () => {
    expect(usageLevel(1000, 1000)).toBe('reached');
    expect(usageLevel(1001, 1000)).toBe('over');
  });

  it('honours a custom warning share', () => {
    expect(usageLevel(600, 1000, 0.5)).toBe('near');
  });

  it('is normal when there is no limit', () => {
    expect(usageLevel(600, 0)).toBe('normal');
  });
});

describe(usagePercent.name, () => {
  it('rounds to whole percent', () => {
    expect(usagePercent(826, 1000)).toBe(83);
  });

  it('can exceed 100 when over the limit', () => {
    expect(usagePercent(1250, 1000)).toBe(125);
  });

  it('is zero without a limit', () => {
    expect(usagePercent(10, 0)).toBe(0);
    expect(usagePercent(Number.NaN, 10)).toBe(0);
  });
});

describe(formatCount.name, () => {
  it('leaves small counts whole', () => {
    expect(formatCount(950)).toBe('950');
  });

  it('shortens thousands, millions and billions', () => {
    expect(formatCount(12_400)).toBe('12.4\u00a0k');
    expect(formatCount(2_000_000)).toBe('2\u00a0M');
    expect(formatCount(3_250_000_000)).toBe('3.3\u00a0B');
  });

  it('shows a dash for a value that is not a number', () => {
    expect(formatCount(Number.NaN)).toBe('—');
  });
});
