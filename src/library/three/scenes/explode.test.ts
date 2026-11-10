import type { Bounds } from '../cameraTargets';

import { clampUnit, clearance, easeLift, explodeOffset, explodeOffsets, explodePercent, levelBounds, liftBounds, stackBounds } from './explode';
import type { ExplodeLevel } from './explode';

const box = (minY: number, maxY: number): Bounds => ({ min: [-10, minY, -5], max: [10, maxY, 5] });

const LEVELS: readonly ExplodeLevel[] = [
  { id: 'jacket', envelope: box(-4, 12) },
  { id: 'cellar', envelope: box(12, 18) },
  { id: 'main', envelope: box(18, 25) },
];

describe(clampUnit.name, () => {
  it('keeps values inside 0–1', () => {
    expect(clampUnit(-0.2)).toBe(0);
    expect(clampUnit(0.4)).toBe(0.4);
    expect(clampUnit(3)).toBe(1);
  });

  it('treats a non-number as assembled', () => {
    expect(clampUnit(Number.NaN)).toBe(0);
  });
});

describe(explodeOffset.name, () => {
  it('leaves the bottom level in place', () => {
    expect(explodeOffset(0, 1, 9)).toBe(0);
  });

  it('raises each level one more gap than the one below', () => {
    expect(explodeOffset(1, 1, 9)).toBe(9);
    expect(explodeOffset(3, 1, 9)).toBe(27);
  });

  it('scales with the amount', () => {
    expect(explodeOffset(2, 0.5, 9)).toBe(9);
    expect(explodeOffset(2, 0, 9)).toBe(0);
  });

  it('clamps the amount', () => {
    expect(explodeOffset(2, 4, 9)).toBe(18);
    expect(explodeOffset(2, -1, 9)).toBe(0);
  });
});

describe(explodeOffsets.name, () => {
  it('lists the rise of every level, bottom first', () => {
    expect(explodeOffsets(4, 0.5, 8)).toEqual([0, 4, 8, 12]);
  });

  it('is empty for no levels', () => {
    expect(explodeOffsets(0, 1, 8)).toEqual([]);
  });
});

describe(liftBounds.name, () => {
  it('moves a box straight up', () => {
    expect(liftBounds(box(2, 6), 5)).toEqual({ min: [-10, 7, -5], max: [10, 11, 5] });
  });
});

describe(levelBounds.name, () => {
  it('returns the envelope unchanged when assembled', () => {
    expect(levelBounds(LEVELS, 'main', 0, 9)).toEqual(box(18, 25));
  });

  it('lifts the envelope by the level offset', () => {
    expect(levelBounds(LEVELS, 'main', 1, 9)).toEqual(box(36, 43));
  });

  it('returns null for an unknown level', () => {
    expect(levelBounds(LEVELS, 'helideck', 1, 9)).toBeNull();
  });
});

describe(stackBounds.name, () => {
  it('spans the assembled stack', () => {
    expect(stackBounds(LEVELS, 0, 9)).toEqual(box(-4, 25));
  });

  it('grows upwards as the stack explodes', () => {
    expect(stackBounds(LEVELS, 1, 9)).toEqual(box(-4, 43));
  });

  it('returns null for an empty stack', () => {
    expect(stackBounds([], 1, 9)).toBeNull();
  });
});

describe(clearance.name, () => {
  it('is zero between touching levels when assembled', () => {
    expect(clearance(LEVELS, 0, 0, 9)).toBe(0);
  });

  it('opens by one gap per level when exploded', () => {
    expect(clearance(LEVELS, 0, 1, 9)).toBe(9);
    expect(clearance(LEVELS, 1, 0.5, 9)).toBe(4.5);
  });

  it('is zero above the top level', () => {
    expect(clearance(LEVELS, 2, 1, 9)).toBe(0);
  });
});

describe(easeLift.name, () => {
  it('starts and ends exactly on its values', () => {
    expect(easeLift(2, 10, 0)).toBe(2);
    expect(easeLift(2, 10, 1)).toBe(10);
  });

  it('passes the midpoint halfway', () => {
    expect(easeLift(2, 10, 0.5)).toBe(6);
  });

  it('clamps progress', () => {
    expect(easeLift(2, 10, 7)).toBe(10);
  });
});

describe(explodePercent.name, () => {
  it('rounds to a whole percent', () => {
    expect(explodePercent(0.425)).toBe(43);
    expect(explodePercent(2)).toBe(100);
  });
});
