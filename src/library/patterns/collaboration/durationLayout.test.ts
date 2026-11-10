import { formatDuration, layoutDurations } from './durationLayout';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe(formatDuration.name, () => {
  it.each([
    [0, '< 1 min'],
    [59_000, '< 1 min'],
    [45 * MINUTE, '45 min'],
    [2 * HOUR, '2 h'],
    [2 * HOUR + 15 * MINUTE, '2 h 15 min'],
    [3 * DAY, '3 d'],
    [3 * DAY + 4 * HOUR + 20 * MINUTE, '3 d 4 h'],
    [-5 * MINUTE, '< 1 min'],
  ])('formats %d ms as %s', (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected);
  });
});

describe(layoutDurations.name, () => {
  const T0 = Date.UTC(2026, 2, 12, 8, 0, 0);

  it('places phases on a scale from the earliest start to the latest end', () => {
    const bars = layoutDurations(
      [
        { id: 'a', label: 'Detect', start: T0, end: T0 + HOUR },
        { id: 'b', label: 'Repair', start: T0 + HOUR, end: T0 + 4 * HOUR },
      ],
      T0 + 10 * HOUR
    );

    expect(bars[0]).toMatchObject({ offset: 0, width: 25, durationMs: HOUR, ongoing: false });
    expect(bars[1]).toMatchObject({ offset: 25, width: 75, durationMs: 3 * HOUR });
  });

  it('runs a phase without an end up to now and marks it ongoing', () => {
    const bars = layoutDurations(
      [
        { id: 'a', label: 'Detect', start: T0, end: T0 + HOUR },
        { id: 'b', label: 'Repair', start: T0 + HOUR },
      ],
      T0 + 2 * HOUR
    );

    expect(bars[1]).toMatchObject({ offset: 50, width: 50, durationMs: HOUR, ongoing: true });
  });

  it('keeps a very short phase visible', () => {
    const bars = layoutDurations(
      [
        { id: 'a', label: 'Trip', start: T0, end: T0 + 1000 },
        { id: 'b', label: 'Repair', start: T0, end: T0 + 10 * HOUR },
      ],
      T0,
      2
    );

    expect(bars[0].width).toBe(2);
  });

  it('never lets a bar run past the end of the scale', () => {
    const bars = layoutDurations(
      [
        { id: 'a', label: 'Repair', start: T0, end: T0 + 10 * HOUR },
        { id: 'b', label: 'Restart', start: T0 + 10 * HOUR, end: T0 + 10 * HOUR },
      ],
      T0,
      2
    );

    expect(bars[1].offset + bars[1].width).toBeLessThanOrEqual(100);
    expect(bars[1].width).toBe(2);
  });

  it('treats an end before the start as zero length', () => {
    const bars = layoutDurations([{ id: 'a', label: 'Bad', start: T0, end: T0 - HOUR }], T0);

    expect(bars[0].durationMs).toBe(0);
  });

  it('fills the scale when every phase is instantaneous', () => {
    const bars = layoutDurations([{ id: 'a', label: 'Trip', start: T0, end: T0 }], T0);

    expect(bars[0]).toMatchObject({ offset: 0, width: 100 });
  });

  it('returns nothing for no phases', () => {
    expect(layoutDurations([], T0)).toEqual([]);
  });
});
