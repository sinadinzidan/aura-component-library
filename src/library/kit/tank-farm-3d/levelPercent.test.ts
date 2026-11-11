import { levelPercent } from './levelPercent';

describe(levelPercent.name, () => {
  it('rounds a fraction to a whole percentage', () => {
    expect(levelPercent(0.826)).toBe(83);
  });

  it('clamps below empty and above full', () => {
    expect(levelPercent(-0.2)).toBe(0);
    expect(levelPercent(1.4)).toBe(100);
  });

  it('reads a missing value as empty', () => {
    expect(levelPercent(Number.NaN)).toBe(0);
  });
});
