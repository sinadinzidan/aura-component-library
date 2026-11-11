import { addDays, clamp, formatClock, formatDuration, formatSpan, longDayLabel, parseClock, pointerToMinutes, pointerToRawMinutes, shortDayLabel, snapMinutes, weekdayName, weekdayOf, weekFrom } from './timeMath';

const BODY = { top: 100, height: 840 };
const WINDOW = { start: 6 * 60, end: 20 * 60 };

describe('snapMinutes', () => {
  it('rounds to the nearest quarter hour', () => {
    expect([0, 7, 8, 22, 23, 37, 38].map((value) => snapMinutes(value))).toEqual([0, 0, 15, 15, 30, 30, 45]);
  });

  it('can floor and ceil', () => {
    expect(snapMinutes(29, 'floor')).toBe(15);
    expect(snapMinutes(31, 'ceil')).toBe(45);
    expect(snapMinutes(30, 'ceil')).toBe(30);
  });

  it('supports another slot', () => {
    expect(snapMinutes(40, 'round', 30)).toBe(30);
  });
});

describe('clamp', () => {
  it('keeps a value inside the bounds', () => {
    expect([clamp(-1, 0, 5), clamp(3, 0, 5), clamp(9, 0, 5)]).toEqual([0, 3, 5]);
  });
});

describe('pointerToMinutes', () => {
  it('maps the top and bottom of the body to the window edges', () => {
    expect(pointerToMinutes(100, BODY, WINDOW)).toBe(360);
    expect(pointerToMinutes(940, BODY, WINDOW)).toBe(1200);
  });

  it('maps a point in the middle and snaps it', () => {
    expect(pointerToMinutes(520, BODY, WINDOW)).toBe(780);
    expect(pointerToMinutes(527, BODY, WINDOW)).toBe(780);
  });

  it('keeps points outside the body inside the window', () => {
    expect(pointerToMinutes(-500, BODY, WINDOW)).toBe(360);
    expect(pointerToMinutes(5000, BODY, WINDOW)).toBe(1200);
  });

  it('floors and ceils on request', () => {
    expect(pointerToMinutes(100 + 12, BODY, WINDOW, 'floor')).toBe(360);
    expect(pointerToMinutes(100 + 12, BODY, WINDOW, 'ceil')).toBe(375);
  });

  it('returns the window start for a body with no height', () => {
    expect(pointerToMinutes(50, { top: 0, height: 0 }, WINDOW)).toBe(360);
    expect(pointerToRawMinutes(50, { top: 0, height: 0 }, WINDOW)).toBe(360);
  });

  it('gives the unsnapped time for a grab offset', () => {
    expect(pointerToRawMinutes(100 + 21, BODY, WINDOW)).toBeCloseTo(360 + 21);
  });
});

describe('clock text', () => {
  it('formats and parses clock times', () => {
    expect(formatClock(510)).toBe('08:30');
    expect(formatClock(0)).toBe('00:00');
    expect(parseClock('08:30')).toBe(510);
    expect(parseClock('8:05')).toBe(485);
    expect(parseClock('24:00')).toBeNull();
    expect(parseClock('12:60')).toBeNull();
    expect(parseClock('noon')).toBeNull();
  });

  it('formats spans and durations', () => {
    expect(formatSpan(510, 600)).toBe('08:30–10:00');
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(60)).toBe('1 h');
    expect(formatDuration(90)).toBe('1 h 30 min');
  });
});

describe('days', () => {
  it('finds the weekday of an ISO date', () => {
    expect(weekdayOf('2026-03-12')).toBe(4);
    expect(weekdayOf('2026-03-15')).toBe(0);
    expect(weekdayOf('nope')).toBeNull();
    expect(weekdayOf('2026-02-31')).not.toBeNull();
  });

  it('names days', () => {
    expect(weekdayName('2026-03-12')).toBe('Thursday');
    expect(weekdayName('x')).toBe('x');
    expect(shortDayLabel('2026-03-09')).toBe('Mon 9');
    expect(longDayLabel('2026-03-12')).toBe('Thursday 12 March');
    expect(longDayLabel('x')).toBe('x');
  });

  it('adds days across a month end', () => {
    expect(addDays('2026-03-31', 1)).toBe('2026-04-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('bad', 1)).toBe('bad');
  });

  it('lists a week', () => {
    const week = weekFrom('2026-03-09');
    expect(week).toHaveLength(7);
    expect(week[0]).toBe('2026-03-09');
    expect(week[6]).toBe('2026-03-15');
  });
});
