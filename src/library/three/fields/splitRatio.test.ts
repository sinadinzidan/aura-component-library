import { DEFAULT_SPLIT_LIMITS, clampRatio, describeSplit, ratioFromKey, ratioFromPointer } from './splitRatio';

describe(clampRatio.name, () => {
  it('keeps a ratio inside the limits', () => {
    expect(clampRatio(10)).toBe(25);
    expect(clampRatio(50)).toBe(50);
    expect(clampRatio(90)).toBe(75);
  });

  it('falls back to the midpoint for a non-number', () => {
    expect(clampRatio(Number.NaN, { min: 20, max: 60, step: 5 })).toBe(40);
  });
});

describe(ratioFromPointer.name, () => {
  it('converts a pointer position to a share of the width', () => {
    expect(ratioFromPointer(500, 100, 800)).toBe(50);
    expect(ratioFromPointer(420, 100, 800)).toBe(40);
  });

  it('rounds to a tenth of a percent', () => {
    expect(ratioFromPointer(433, 100, 800)).toBe(41.6);
  });

  it('stops at the limits', () => {
    expect(ratioFromPointer(0, 100, 800)).toBe(25);
    expect(ratioFromPointer(5000, 100, 800)).toBe(75);
  });

  it('falls back to the midpoint for an unmeasured container', () => {
    expect(ratioFromPointer(300, 0, 0)).toBe(50);
  });
});

describe(ratioFromKey.name, () => {
  it('moves one step with the arrow keys', () => {
    expect(ratioFromKey('ArrowLeft', 50)).toBe(45);
    expect(ratioFromKey('ArrowRight', 50)).toBe(55);
    expect(ratioFromKey('ArrowUp', 50)).toBe(45);
    expect(ratioFromKey('ArrowDown', 50)).toBe(55);
  });

  it('moves three steps with the page keys', () => {
    expect(ratioFromKey('PageUp', 50)).toBe(35);
    expect(ratioFromKey('PageDown', 50)).toBe(65);
  });

  it('jumps to the limits with Home and End', () => {
    expect(ratioFromKey('Home', 50)).toBe(DEFAULT_SPLIT_LIMITS.min);
    expect(ratioFromKey('End', 50)).toBe(DEFAULT_SPLIT_LIMITS.max);
  });

  it('does not pass the limits', () => {
    expect(ratioFromKey('ArrowLeft', 27)).toBe(25);
    expect(ratioFromKey('PageDown', 70)).toBe(75);
  });

  it('ignores other keys', () => {
    expect(ratioFromKey('a', 50)).toBeNull();
    expect(ratioFromKey('Tab', 50)).toBeNull();
  });
});

describe(describeSplit.name, () => {
  it('names both shares', () => {
    expect(describeSplit(41.6, 'Drawing', '3D model')).toBe('Drawing 42 percent, 3D model 58 percent');
  });
});
