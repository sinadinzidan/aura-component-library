import {
  PX_PER_DAY,
  createScale,
  dayFromDate,
  dayFromTimestamp,
  dayOfMonth,
  dayToX,
  daysInMonth,
  elbowPath,
  formatDay,
  formatDuration,
  formatRange,
  formatWeekday,
  headerCells,
  isWeekend,
  monthStart,
  pxToDays,
  spanWidth,
  weekStart,
  weekdayOf,
  weekendRuns,
  xToDay,
} from './ganttScale';

const MON_2_MAR = dayFromDate(2026, 3, 2);

describe('ganttScale dates', () => {
  it('turns a timestamp and a calendar date into the same day number', () => {
    expect(dayFromDate(2026, 3, 12)).toBe(dayFromTimestamp(Date.UTC(2026, 2, 12, 14, 0, 0)));
  });

  it('knows weekdays, weekends and the start of the week', () => {
    expect(weekdayOf(MON_2_MAR)).toBe(0);
    expect(weekdayOf(MON_2_MAR + 6)).toBe(6);
    expect(isWeekend(MON_2_MAR + 4)).toBe(false);
    expect(isWeekend(MON_2_MAR + 5)).toBe(true);
    expect(isWeekend(MON_2_MAR + 6)).toBe(true);
    expect(weekStart(MON_2_MAR + 4)).toBe(MON_2_MAR);
  });

  it('formats days in UTC', () => {
    expect(formatDay(MON_2_MAR)).toBe('2 Mar');
    expect(formatWeekday(MON_2_MAR)).toBe('Mon');
    expect(dayOfMonth(MON_2_MAR)).toBe(2);
  });

  it('knows month starts and lengths, including February', () => {
    expect(monthStart(MON_2_MAR + 10)).toBe(MON_2_MAR - 1);
    expect(daysInMonth(MON_2_MAR)).toBe(31);
    expect(daysInMonth(dayFromDate(2026, 2, 10))).toBe(28);
  });

  it('writes a range with the last day worked, and a duration in words', () => {
    expect(formatRange(MON_2_MAR, 3)).toBe('2 Mar to 4 Mar');
    expect(formatRange(MON_2_MAR, 1)).toBe('2 Mar');
    expect(formatRange(MON_2_MAR, 0)).toBe('2 Mar');
    expect(formatDuration(0)).toBe('Milestone');
    expect(formatDuration(1)).toBe('1 day');
    expect(formatDuration(5)).toBe('5 days');
  });
});

describe('ganttScale geometry', () => {
  it('converts days to pixels and back at each zoom', () => {
    for (const zoom of ['day', 'week', 'month'] as const) {
      const scale = createScale(MON_2_MAR, zoom);
      expect(scale.pxPerDay).toBe(PX_PER_DAY[zoom]);
      expect(dayToX(scale, MON_2_MAR + 7)).toBe(7 * PX_PER_DAY[zoom]);
      expect(xToDay(scale, dayToX(scale, MON_2_MAR + 7))).toBe(MON_2_MAR + 7);
    }
  });

  it('snaps a drag distance to whole days', () => {
    const scale = createScale(MON_2_MAR, 'day');
    expect(pxToDays(scale, 19)).toBe(0);
    expect(pxToDays(scale, 21)).toBe(1);
    expect(pxToDays(scale, -61)).toBe(-2);
    expect(spanWidth(scale, 3)).toBe(120);
  });

  it('zooms out to fewer pixels per day', () => {
    expect(PX_PER_DAY.day).toBeGreaterThan(PX_PER_DAY.week);
    expect(PX_PER_DAY.week).toBeGreaterThan(PX_PER_DAY.month);
  });
});

describe('headerCells', () => {
  it('shows months over days at day zoom', () => {
    const { top, bottom } = headerCells('day', MON_2_MAR, MON_2_MAR + 40);
    expect(top.map((cell) => cell.label)).toEqual(['March 2026', 'April 2026']);
    expect(bottom).toHaveLength(40);
    expect(bottom[0].label).toBe('2');
  });

  it('shows weeks by their first day at week zoom', () => {
    const { bottom } = headerCells('week', MON_2_MAR, MON_2_MAR + 21);
    expect(bottom.map((cell) => cell.label)).toEqual(['2', '9', '16']);
  });

  it('shows years over months at month zoom, merging months of one year', () => {
    const { top, bottom } = headerCells('month', dayFromDate(2025, 11, 10), dayFromDate(2026, 3, 1));
    expect(top.map((cell) => cell.label)).toEqual(['2025', '2026']);
    expect(bottom.map((cell) => cell.label)).toEqual(['Nov', 'Dec', 'Jan', 'Feb']);
    expect(top[0].to).toBe(bottom[1].to);
  });
});

describe('weekendRuns', () => {
  it('returns each Saturday and Sunday as one run', () => {
    expect(weekendRuns(MON_2_MAR, MON_2_MAR + 14)).toEqual([
      { from: MON_2_MAR + 5, to: MON_2_MAR + 7 },
      { from: MON_2_MAR + 12, to: MON_2_MAR + 14 },
    ]);
  });

  it('clips a weekend at the end of the range and keeps a Sunday at the start', () => {
    expect(weekendRuns(MON_2_MAR, MON_2_MAR + 6)).toEqual([{ from: MON_2_MAR + 5, to: MON_2_MAR + 6 }]);
    expect(weekendRuns(MON_2_MAR + 6, MON_2_MAR + 8)).toEqual([{ from: MON_2_MAR + 6, to: MON_2_MAR + 7 }]);
  });
});

describe('elbowPath', () => {
  it('goes right, across to the successor row, then into its start', () => {
    expect(elbowPath({ x: 100, y: 18 }, { x: 160, y: 54 }, 36)).toBe('M 100 18 H 108 V 54 H 160');
  });

  it('loops under the predecessor when the successor starts too early', () => {
    expect(elbowPath({ x: 200, y: 18 }, { x: 150, y: 54 }, 36)).toBe('M 200 18 H 208 V 36 H 142 V 54 H 150');
  });

  it('loops upward when the successor is above', () => {
    expect(elbowPath({ x: 200, y: 54 }, { x: 150, y: 18 }, 36)).toBe('M 200 54 H 208 V 36 H 142 V 18 H 150');
  });
});
