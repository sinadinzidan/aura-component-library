import { filledBlocks, judgeAgainstTarget, scalePosition, shareOfTarget } from './progress';

describe('progress', () => {
  it('gives the share of the target in percent', () => {
    expect(shareOfTarget(45, 50)).toBe(90);
    expect(shareOfTarget(4, 0)).toBe(0);
  });

  it('judges a higher-is-better figure', () => {
    expect(judgeAgainstTarget(98, 97.5)).toEqual({ tone: 'success', word: 'On target' });
    expect(judgeAgainstTarget(96.4, 97.5)).toEqual({ tone: 'warning', word: 'Watch' });
    expect(judgeAgainstTarget(80, 97.5)).toEqual({ tone: 'critical', word: 'Off target' });
  });

  it('judges a lower-is-better figure', () => {
    expect(judgeAgainstTarget(12.4, 15, 'down').tone).toBe('success');
    expect(judgeAgainstTarget(31.2, 30, 'down').tone).toBe('warning');
    expect(judgeAgainstTarget(40, 30, 'down').tone).toBe('critical');
  });

  it('counts filled blocks and clamps them', () => {
    expect(filledBlocks(50, 100, 10)).toBe(5);
    expect(filledBlocks(140, 100, 10)).toBe(10);
    expect(filledBlocks(-3, 100, 10)).toBe(0);
    expect(filledBlocks(3, 0, 10)).toBe(0);
  });

  it('places a value on the scale', () => {
    expect(scalePosition(30, 120)).toBe(25);
    expect(scalePosition(200, 120)).toBe(100);
    expect(scalePosition(5, 0)).toBe(0);
  });
});
