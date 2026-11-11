import { bottleneckIndex, firstPassYield, formatClock, pace, taktVerdict } from './lines';

describe('lines', () => {
  it('finds the slowest cycling station', () => {
    expect(bottleneckIndex([{ cycleSeconds: 44 }, { cycleSeconds: 52 }, {}, { cycleSeconds: 39 }])).toBe(1);
    expect(bottleneckIndex([{}, {}])).toBe(-1);
  });

  it('judges a cycle time against takt', () => {
    expect(taktVerdict(52, 48)).toEqual({ tone: 'critical', word: 'Over takt' });
    expect(taktVerdict(47, 48).word).toBe('At takt');
    expect(taktVerdict(40, 48).word).toBe('Under takt');
  });

  it('compares the count with the pace of the shift', () => {
    expect(pace(310, 600, 0.5)).toEqual({ expected: 300, difference: 10, tone: 'success', word: '10 ahead of pace' });
    expect(pace(300, 600, 0.5).word).toBe('On pace');
    expect(pace(280, 600, 0.5)).toMatchObject({ difference: -20, tone: 'warning', word: '20 behind pace' });
    expect(pace(200, 600, 0.5).tone).toBe('critical');
    expect(pace(10, 600, 2).expected).toBe(600);
  });

  it('gives first-pass yield in percent', () => {
    expect(firstPassYield(291, 300)).toBe(97);
    expect(firstPassYield(0, 0)).toBe(0);
  });

  it('formats seconds as a clock', () => {
    expect(formatClock(754)).toBe('12:34');
    expect(formatClock(48)).toBe('0:48');
    expect(formatClock(-5)).toBe('0:00');
  });
});
