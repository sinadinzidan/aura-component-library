import { describe, expect, it } from 'vitest';

import { fractionAt, lanePath, laneValueAt, laneY, neighbourEvent, reachedIndex, timeAtFraction } from './replayLanes';

const POINTS = [
  { t: 0, v: 10 },
  { t: 100, v: 20 },
  { t: 200, v: 0 },
];

describe('replayLanes', () => {
  it('places a time on the window and clamps outside it', () => {
    expect(fractionAt(50, 0, 200)).toBe(0.25);
    expect(fractionAt(-10, 0, 200)).toBe(0);
    expect(fractionAt(500, 0, 200)).toBe(1);
    expect(fractionAt(5, 10, 10)).toBe(0);
  });

  it('turns a track position into a snapped time inside the window', () => {
    expect(timeAtFraction(0.26, 0, 200, 10)).toBe(50);
    expect(timeAtFraction(2, 0, 200, 10)).toBe(200);
    expect(timeAtFraction(-1, 0, 200, 10)).toBe(0);
    expect(timeAtFraction(0.333, 0, 300)).toBeCloseTo(99.9);
  });

  it('interpolates a value at the playhead', () => {
    expect(laneValueAt(POINTS, 50)).toBe(15);
    expect(laneValueAt(POINTS, 150)).toBe(10);
    expect(laneValueAt(POINTS, 999)).toBe(0);
    expect(laneValueAt(POINTS, -1)).toBeNull();
    expect(laneValueAt([], 10)).toBeNull();
  });

  it('maps a value to a height from the top of the lane', () => {
    expect(laneY(0, [0, 20], 40)).toBe(40);
    expect(laneY(20, [0, 20], 40)).toBe(0);
    expect(laneY(99, [0, 20], 40)).toBe(0);
    expect(laneY(5, [3, 3], 40)).toBe(40);
  });

  it('draws a path across the lane', () => {
    expect(lanePath(POINTS, 0, 200, [0, 20], 1000, 40)).toBe('M0.0 20 L500.0 0 L1000.0 40');
    expect(lanePath([], 0, 200, [0, 20], 1000, 40)).toBe('');
  });

  it('finds the neighbouring event in either direction', () => {
    const events = [{ t: 10 }, { t: 30 }, { t: 60 }];
    expect(neighbourEvent(events, 30, 1)).toEqual({ t: 60 });
    expect(neighbourEvent(events, 30, -1)).toEqual({ t: 10 });
    expect(neighbourEvent(events, 60, 1)).toBeNull();
    expect(neighbourEvent(events, 10, -1)).toBeNull();
  });

  it('counts the events reached at a time', () => {
    const events = [{ t: 10 }, { t: 30 }, { t: 60 }];
    expect(reachedIndex(events, 5)).toBe(-1);
    expect(reachedIndex(events, 30)).toBe(1);
    expect(reachedIndex(events, 99)).toBe(2);
  });
});
