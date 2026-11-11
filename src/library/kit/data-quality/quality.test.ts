import { coveragePercent, formatDuration, freshness, longestGap, missingDuration, normalizeGaps, summarizeRuns } from './quality';

describe('data quality helpers', () => {
  it('summarises runs and counts the failures at the end', () => {
    const summary = summarizeRuns([{ status: 'success' }, { status: 'success' }, { status: 'skipped' }, { status: 'failed' }, { status: 'failed' }]);
    expect(summary).toEqual({ total: 5, success: 2, failed: 2, successRate: 50, consecutiveFailures: 2 });
  });

  it('reports a full rate when nothing has finished', () => {
    expect(summarizeRuns([{ status: 'running' }]).successRate).toBe(100);
  });

  it('clips gaps to the window and merges overlaps', () => {
    expect(normalizeGaps(0, 100, [{ from: 40, to: 60 }, { from: -10, to: 10 }, { from: 50, to: 70 }, { from: 200, to: 300 }])).toEqual([
      { from: 0, to: 10 },
      { from: 40, to: 70 },
    ]);
  });

  it('measures missing time, coverage and the longest gap', () => {
    const gaps = [{ from: 10, to: 20 }, { from: 50, to: 80 }];
    expect(missingDuration(0, 100, gaps)).toBe(40);
    expect(coveragePercent(0, 100, gaps)).toBe(60);
    expect(longestGap(0, 100, gaps)).toBe(30);
    expect(coveragePercent(5, 5, gaps)).toBe(0);
  });

  it('formats durations at the scale they are read', () => {
    expect(formatDuration(38_000)).toBe('38 s');
    expect(formatDuration(252_000)).toBe('4 min 12 s');
    expect(formatDuration(3 * 3_600_000 + 12 * 60_000)).toBe('3 h 12 min');
    expect(formatDuration(52 * 3_600_000)).toBe('2 d 4 h');
    expect(formatDuration(120_000)).toBe('2 min');
  });

  it('grades freshness against the expected interval', () => {
    expect(freshness(40, 60)).toBe('fresh');
    expect(freshness(150, 60)).toBe('late');
    expect(freshness(600, 60)).toBe('stale');
  });
});
