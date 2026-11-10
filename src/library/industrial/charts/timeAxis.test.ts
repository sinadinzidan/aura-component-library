import {
  DAY,
  HOUR,
  MINUTE,
  formatClock,
  formatDay,
  formatDayTime,
  formatRange,
  formatRelative,
  formatSpan,
  tickFormatter,
  timeStep,
  timeTicks,
} from './timeAxis';

const NOW = Date.UTC(2026, 2, 12, 14, 0, 0);

describe(timeStep.name, () => {
  it('picks the smallest round step that keeps the tick count under the limit', () => {
    expect(timeStep(NOW - HOUR, NOW)).toBe(10 * MINUTE);
    expect(timeStep(NOW - 8 * HOUR, NOW)).toBe(2 * HOUR);
    expect(timeStep(NOW - DAY, NOW)).toBe(6 * HOUR);
    expect(timeStep(NOW - 7 * DAY, NOW)).toBe(2 * DAY);
  });

  it('allows more ticks when asked', () => {
    expect(timeStep(NOW - DAY, NOW, 8)).toBe(3 * HOUR);
  });

  it('falls back to the largest step for very long spans', () => {
    expect(timeStep(NOW - 3650 * DAY, NOW)).toBe(30 * DAY);
  });
});

describe(timeTicks.name, () => {
  it('returns ticks on whole multiples of the step inside the range', () => {
    const ticks = timeTicks(NOW - DAY, NOW);

    expect(ticks.map((tick) => formatClock(tick))).toEqual(['18:00', '00:00', '06:00', '12:00']);
  });

  it('includes both ends when they fall on a step', () => {
    const ticks = timeTicks(NOW - 8 * HOUR, NOW);

    expect(ticks[0]).toBe(NOW - 8 * HOUR);
    expect(ticks[ticks.length - 1]).toBe(NOW);
  });

  it('returns nothing for an empty or inverted range', () => {
    expect(timeTicks(NOW, NOW)).toEqual([]);
    expect(timeTicks(NOW, NOW - HOUR)).toEqual([]);
  });
});

describe('formatters', () => {
  it('formats clock, day and day-time in UTC by default', () => {
    expect(formatClock(NOW)).toBe('14:00');
    expect(formatDay(NOW)).toBe('12 Mar');
    expect(formatDayTime(NOW)).toBe('12 Mar, 14:00');
  });

  it('formats in another time zone when asked', () => {
    expect(formatClock(NOW, 'Europe/Oslo')).toBe('15:00');
  });
});

describe(tickFormatter.name, () => {
  it('prints the clock time for sub-day steps', () => {
    expect(tickFormatter(HOUR)(NOW)).toBe('14:00');
  });

  it('prints the date on the midnight tick of a sub-day axis', () => {
    expect(tickFormatter(6 * HOUR)(Date.UTC(2026, 2, 12))).toBe('12 Mar');
  });

  it('prints the date for day steps', () => {
    expect(tickFormatter(DAY)(NOW)).toBe('12 Mar');
  });
});

describe(formatSpan.name, () => {
  it('uses the largest whole unit', () => {
    expect(formatSpan(30 * MINUTE)).toBe('30 min');
    expect(formatSpan(8 * HOUR)).toBe('8 h');
    expect(formatSpan(7 * DAY)).toBe('7 d');
  });

  it('keeps one decimal for uneven hours and whole hours for uneven days', () => {
    expect(formatSpan(90 * MINUTE)).toBe('1.5 h');
    expect(formatSpan(36 * HOUR)).toBe('36 h');
  });

  it('never prints less than a minute', () => {
    expect(formatSpan(1000)).toBe('1 min');
  });
});

describe(formatRelative.name, () => {
  it('names the reference time', () => {
    expect(formatRelative(NOW, NOW)).toBe('now');
  });

  it('prints a signed offset', () => {
    expect(formatRelative(NOW - 8 * HOUR, NOW)).toBe('−8 h');
    expect(formatRelative(NOW + 2 * DAY, NOW)).toBe('+2 d');
  });
});

describe(formatRange.name, () => {
  it('prints the date once when both ends are on the same day', () => {
    expect(formatRange(NOW - 8 * HOUR, NOW)).toBe('12 Mar, 06:00 – 14:00');
  });

  it('prints both dates across days', () => {
    expect(formatRange(NOW - 7 * DAY, NOW)).toBe('5 Mar, 14:00 – 12 Mar, 14:00');
  });
});
