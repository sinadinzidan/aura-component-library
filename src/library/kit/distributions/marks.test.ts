import { LOOKS } from '../../looks/looks';

import { markGap, markRadius, markStyle, pointStyle } from './marks';

describe('distribution marks', () => {
  it('fills marks with the given colour in every look', () => {
    for (const look of LOOKS) {
      const style = markStyle(look, 'var(--kit-line-accent)');
      expect(`${String(style.background)}${String(style.border ?? '')}`).toContain('var(--kit-line-accent)');
    }
  });

  it('outlines poster marks and hatches blueprint marks', () => {
    expect(markStyle('poster', 'var(--x)').border).toBe('2px solid var(--kit-text)');
    expect(String(markStyle('blueprint', 'var(--x)').background)).toContain('repeating-linear-gradient');
  });

  it('lets poster bars touch and rounds only the friendly looks', () => {
    expect(markGap('poster')).toBe(0);
    expect(markRadius('soft', 8)).toBe(8);
    expect(markRadius('console')).toBe(0);
  });

  it('draws hollow points on a blueprint and square ones in console', () => {
    expect(pointStyle('blueprint', 'var(--x)').border).toContain('var(--x)');
    expect(pointStyle('console', 'var(--x)').borderRadius).toBe(0);
  });
});
