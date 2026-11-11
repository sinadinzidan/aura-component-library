import { adjacentMark, clockTime, fractionOf, nearestMark, stamp, timeAtFraction } from './frameTime';

const marks = [
  { id: 'm1', at: 1000, label: 'Motion' },
  { id: 'm2', at: 5000, label: 'Alarm' },
  { id: 'm3', at: 9000, label: 'Person' },
];

describe('frame time', () => {
  it('converts between time and fraction', () => {
    expect(fractionOf(5000, 0, 10000)).toBe(0.5);
    expect(fractionOf(-5, 0, 10)).toBe(0);
    expect(fractionOf(50, 0, 10)).toBe(1);
    expect(fractionOf(5, 10, 10)).toBe(0);
    expect(timeAtFraction(0.25, 1000, 2000)).toBe(1250);
    expect(timeAtFraction(5, 1000, 2000)).toBe(2000);
  });

  it('finds the nearest mark within a tolerance', () => {
    expect(nearestMark(marks, 5200, 500)?.id).toBe('m2');
    expect(nearestMark(marks, 3000, 500)).toBeNull();
    expect(nearestMark(marks, 4900, 5000)?.id).toBe('m2');
  });

  it('finds the next and previous mark', () => {
    expect(adjacentMark(marks, 5000, 1)?.id).toBe('m3');
    expect(adjacentMark(marks, 5000, -1)?.id).toBe('m1');
    expect(adjacentMark(marks, 9000, 1)).toBeNull();
    expect(adjacentMark(marks, 1000, -1)).toBeNull();
  });

  it('formats UTC clock times and dates', () => {
    expect(clockTime(Date.UTC(2026, 2, 12, 14, 2, 5))).toBe('14:02:05');
    expect(stamp(Date.UTC(2026, 2, 12, 14, 2, 5))).toBe('12 Mar 2026 14:02:05');
  });
});
