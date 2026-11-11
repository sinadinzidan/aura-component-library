import { arcSpans, clockAngle, elapsedShare, formatClock, formatDuration, formatElapsed } from './mission';

const SHIFT = { start: 360, end: 1080, now: 840 };

describe('elapsedShare', () => {
  it('is the share of the window that has passed', () => {
    expect(elapsedShare(SHIFT)).toBeCloseTo(2 / 3);
  });

  it('clamps before the start and after the end', () => {
    expect(elapsedShare({ ...SHIFT, now: 100 })).toBe(0);
    expect(elapsedShare({ ...SHIFT, now: 2000 })).toBe(1);
  });
});

describe('clockAngle', () => {
  it('puts the start at the top and the middle at the bottom', () => {
    expect(clockAngle(360, SHIFT)).toBe(0);
    expect(clockAngle(720, SHIFT)).toBe(180);
  });
});

describe('formatting', () => {
  it('writes a clock time', () => {
    expect(formatClock(826)).toBe('13:46');
  });

  it('writes mission elapsed time', () => {
    expect(formatElapsed(SHIFT)).toBe('T+ 08:00');
  });

  it('writes time before the start with a minus', () => {
    expect(formatElapsed({ ...SHIFT, now: 270 })).toBe('T− 01:30');
  });

  it('writes durations in words', () => {
    expect(formatDuration(120)).toBe('2 h 00 min');
    expect(formatDuration(45)).toBe('45 min');
  });
});

describe('arcSpans', () => {
  it('splits the turn into equal arcs with a gap', () => {
    expect(arcSpans(4, 2)).toEqual([
      { start: 1, end: 89, mid: 45 },
      { start: 91, end: 179, mid: 135 },
      { start: 181, end: 269, mid: 225 },
      { start: 271, end: 359, mid: 315 },
    ]);
  });
});
