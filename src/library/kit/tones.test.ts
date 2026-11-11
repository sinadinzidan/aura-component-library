import { cx, formatNumber, niceTicks, toneLine } from './tones';

describe(toneLine.name, () => {
  it('points at the line variable of the tone', () => {
    expect(toneLine('teal')).toBe('var(--kit-line-teal)');
  });
});

describe(cx.name, () => {
  it('joins the truthy parts', () => {
    expect(cx('a', false, undefined, 'b')).toBe('a b');
  });
});

describe(formatNumber.name, () => {
  it('fixes the decimals and groups thousands', () => {
    expect(formatNumber(182400)).toBe('182,400');
    expect(formatNumber(4.3, 2)).toBe('4.30');
  });
});

describe(niceTicks.name, () => {
  it('returns round steps from zero that cover the maximum', () => {
    expect(niceTicks(96)).toEqual([0, 25, 50, 75, 100]);
    expect(niceTicks(4.55)).toEqual([0, 2, 4, 6]);
  });
});
