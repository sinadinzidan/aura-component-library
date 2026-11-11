import { describe, expect, it } from 'vitest';

import { axisTicks, climbBetween, kpAtPointer, kpPercent, staggerRows, stretchAt } from './chainage';

describe('chainage', () => {
  it('places a kilometre across the plot', () => {
    expect(kpPercent(21, 84)).toBe(25);
    expect(kpPercent(-5, 84)).toBe(0);
    expect(kpPercent(100, 84)).toBe(100);
    expect(kpPercent(5, 0)).toBe(0);
  });

  it('reads the kilometre under a pointer and rounds it', () => {
    expect(kpAtPointer(500, 1000, 84)).toBe(42);
    expect(kpAtPointer(333, 1000, 84)).toBe(28);
    expect(kpAtPointer(333, 1000, 84, 0.5)).toBe(28);
    expect(kpAtPointer(-20, 1000, 84)).toBe(0);
    expect(kpAtPointer(2000, 1000, 84)).toBe(84);
    expect(kpAtPointer(10, 0, 84)).toBe(0);
  });

  it('gives round axis ticks', () => {
    expect(axisTicks(0, 150, 50)).toEqual([0, 50, 100, 150]);
    expect(axisTicks(55, 140, 20)).toEqual([60, 80, 100, 120, 140]);
    expect(axisTicks(0, 10, 0)).toEqual([]);
  });

  it('finds the stretch between two stations', () => {
    const stations = [{ kp: 0 }, { kp: 12 }, { kp: 27 }];
    expect(stretchAt(stations, 5)).toEqual({ from: { kp: 0 }, to: { kp: 12 } });
    expect(stretchAt(stations, 12)).toEqual({ from: { kp: 12 }, to: { kp: 27 } });
    expect(stretchAt(stations, 27)).toEqual({ from: { kp: 12 }, to: { kp: 27 } });
    expect(stretchAt([{ kp: 3 }], 3)).toBeNull();
  });

  it('adds up climb and descent', () => {
    const elevation = (kp: number) => (kp <= 2 ? kp * 10 : 20 - (kp - 2) * 5);
    expect(climbBetween(elevation, 0, 4)).toEqual({ up: 20, down: 10 });
    expect(climbBetween(elevation, 2, 2)).toEqual({ up: 0, down: 0 });
  });

  it('lifts a label that follows its neighbour too closely', () => {
    expect(staggerRows([0, 12, 27, 38, 52, 66, 70, 78, 84], 84)).toEqual([0, 0, 0, 0, 0, 0, 1, 0, 1]);
    expect(staggerRows([0, 2, 4], 84)).toEqual([0, 1, 0]);
    expect(staggerRows([], 84)).toEqual([]);
  });
});
