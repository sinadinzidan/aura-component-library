import { deviationPercent, tapePosition, tapeTicks } from './tape';

describe('tapeTicks', () => {
  it('lists the ticks inside the window with their offset from the pointer', () => {
    expect(tapeTicks(50, 10, 5)).toEqual([
      { value: 40, offset: -1, major: true },
      { value: 45, offset: -0.5, major: false },
      { value: 50, offset: 0, major: true },
      { value: 55, offset: 0.5, major: false },
      { value: 60, offset: 1, major: true },
    ]);
  });

  it('handles decimal steps without drift', () => {
    const ticks = tapeTicks(4.38, 0.25, 0.1);
    expect(ticks.map((tick) => tick.value)).toEqual([4.2, 4.3, 4.4, 4.5, 4.6]);
  });
});

describe('tapePosition', () => {
  it('puts the current value in the middle and higher values above it', () => {
    expect(tapePosition(50, 50, 10)).toBe(50);
    expect(tapePosition(55, 50, 10)).toBe(25);
  });

  it('clamps targets outside the window', () => {
    expect(tapePosition(90, 50, 10)).toBe(0);
    expect(tapePosition(10, 50, 10)).toBe(100);
  });
});

describe('deviationPercent', () => {
  it('is negative under the reference', () => {
    expect(deviationPercent(4.38, 4.5)).toBeCloseTo(-2.666667);
  });
});
