import type { SchedColumn } from './geometry';
import { columnIndexAt, columnOf, draftFromDrag, inColumn, movedTo, nudge, resizedTo } from './geometry';

const WINDOW = { start: 360, end: 1200 };
const DAYS: readonly SchedColumn[] = [
  { id: 'a', label: 'Mon 9', dayId: '2026-03-09' },
  { id: 'b', label: 'Tue 10', dayId: '2026-03-10' },
  { id: 'c', label: 'Wed 11', dayId: '2026-03-11' },
];
const CREWS: readonly SchedColumn[] = [
  { id: 'm', label: 'Mechanical', dayId: '2026-03-12', resourceId: 'mechanical' },
  { id: 'i', label: 'Instrument', dayId: '2026-03-12', resourceId: 'instrument' },
];
const EVENT = { dayId: '2026-03-10', resourceId: 'mechanical', start: 540, end: 600 };

describe('columnIndexAt', () => {
  const bounds = [{ left: 0, right: 100 }, { left: 100, right: 200 }, { left: 200, right: 300 }];

  it('finds the column under a point', () => {
    expect([0, 99, 100, 250].map((x) => columnIndexAt(x, bounds))).toEqual([0, 0, 1, 2]);
  });

  it('uses the nearest column outside them all', () => {
    expect(columnIndexAt(-40, bounds)).toBe(0);
    expect(columnIndexAt(900, bounds)).toBe(2);
    expect(columnIndexAt(5, [])).toBe(0);
  });
});

describe('columns', () => {
  it('matches an item to a day column by day', () => {
    expect(inColumn(EVENT, DAYS[1])).toBe(true);
    expect(columnOf(EVENT, DAYS)).toBe(1);
  });

  it('matches a crew column by day and crew', () => {
    expect(inColumn({ ...EVENT, dayId: '2026-03-12' }, CREWS[0])).toBe(true);
    expect(inColumn({ ...EVENT, dayId: '2026-03-12' }, CREWS[1])).toBe(false);
    expect(columnOf(EVENT, CREWS)).toBe(-1);
  });
});

describe('draftFromDrag', () => {
  it('orders the two ends of a drag', () => {
    expect(draftFromDrag(600, 540, WINDOW)).toEqual({ start: 540, end: 600 });
    expect(draftFromDrag(540, 660, WINDOW)).toEqual({ start: 540, end: 660 });
  });

  it('is at least one slot long, in the direction of the drag', () => {
    expect(draftFromDrag(540, 540, WINDOW)).toEqual({ start: 540, end: 555 });
    expect(draftFromDrag(555, 551, WINDOW)).toEqual({ start: 540, end: 555 });
  });

  it('stays inside the window', () => {
    expect(draftFromDrag(1200, 1200, WINDOW)).toEqual({ start: 1185, end: 1200 });
    expect(draftFromDrag(300, 400, WINDOW)).toEqual({ start: 360, end: 400 });
  });
});

describe('movedTo', () => {
  it('keeps the duration and takes the day of the column', () => {
    expect(movedTo(EVENT, DAYS[2], 600, WINDOW)).toEqual({ dayId: '2026-03-11', resourceId: 'mechanical', start: 600, end: 660 });
  });

  it('takes the crew of a crew column', () => {
    expect(movedTo(EVENT, CREWS[1], 540, WINDOW).resourceId).toBe('instrument');
  });

  it('stays inside the window', () => {
    expect(movedTo(EVENT, DAYS[1], 100, WINDOW).start).toBe(360);
    expect(movedTo(EVENT, DAYS[1], 5000, WINDOW)).toMatchObject({ start: 1140, end: 1200 });
  });
});

describe('resizedTo', () => {
  it('changes the end', () => {
    expect(resizedTo(EVENT, 660, WINDOW).end).toBe(660);
  });

  it('keeps at least one slot', () => {
    expect(resizedTo(EVENT, 500, WINDOW).end).toBe(555);
  });

  it('stays inside the window', () => {
    expect(resizedTo(EVENT, 9000, WINDOW).end).toBe(1200);
  });
});

describe('nudge', () => {
  it('moves one slot with Up and Down', () => {
    expect(nudge(EVENT, 'ArrowDown', false, DAYS, WINDOW)).toMatchObject({ start: 555, end: 615 });
    expect(nudge(EVENT, 'ArrowUp', false, DAYS, WINDOW)).toMatchObject({ start: 525, end: 585 });
  });

  it('moves one column with Left and Right', () => {
    expect(nudge(EVENT, 'ArrowRight', false, DAYS, WINDOW)?.dayId).toBe('2026-03-11');
    expect(nudge(EVENT, 'ArrowLeft', false, DAYS, WINDOW)?.dayId).toBe('2026-03-09');
  });

  it('moves between crews in a crew view', () => {
    const inCrew = { ...EVENT, dayId: '2026-03-12' };
    expect(nudge(inCrew, 'ArrowRight', false, CREWS, WINDOW)?.resourceId).toBe('instrument');
  });

  it('resizes with Shift and Up or Down', () => {
    expect(nudge(EVENT, 'ArrowDown', true, DAYS, WINDOW)).toMatchObject({ start: 540, end: 615 });
    expect(nudge(EVENT, 'ArrowUp', true, DAYS, WINDOW)).toMatchObject({ start: 540, end: 585 });
  });

  it('returns null when nothing would change', () => {
    expect(nudge(EVENT, 'ArrowLeft', false, [DAYS[1]], WINDOW)).toBeNull();
    expect(nudge({ ...EVENT, start: 360, end: 420 }, 'ArrowUp', false, DAYS, WINDOW)).toBeNull();
    expect(nudge({ ...EVENT, end: 555 }, 'ArrowUp', true, DAYS, WINDOW)).toBeNull();
  });

  it('returns null for left and right when the item is in no column', () => {
    expect(nudge(EVENT, 'ArrowRight', false, CREWS, WINDOW)).toBeNull();
  });
});
