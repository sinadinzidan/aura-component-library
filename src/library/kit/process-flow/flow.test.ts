import { bottleneckOf, massBalance, shares, stepProgress, summariseConditions } from './flow';

describe('flow', () => {
  it('closes a balance inside the tolerance', () => {
    const balance = massBalance([168], [29.6, 6.9, 128.4, 2.6, 0.3]);

    expect(balance.totalOut).toBeCloseTo(167.8);
    expect(balance.closes).toBe(true);
  });

  it('reports an open balance', () => {
    expect(massBalance([100], [90]).closes).toBe(false);
    expect(massBalance([100], [90]).percent).toBeCloseTo(10);
  });

  it('finds the step in hand and whether the sequence is held', () => {
    expect(stepProgress(['done', 'done', 'active', 'pending'])).toEqual({ done: 2, total: 4, percent: 50, current: 2, held: false });
    expect(stepProgress(['done', 'held', 'pending']).held).toBe(true);
    expect(stepProgress([]).current).toBeNull();
  });

  it('does not count a bypass as met', () => {
    expect(summariseConditions(['met', 'bypassed', 'unmet'])).toEqual({ met: 1, unmet: 1, bypassed: 1, total: 3, clear: false });
    expect(summariseConditions(['met', 'bypassed']).clear).toBe(true);
  });

  it('names the stage closest to capacity', () => {
    expect(bottleneckOf([{ id: 'a', load: 60 }, { id: 'b', load: 97 }, { id: 'c' }])?.id).toBe('b');
    expect(bottleneckOf([{ id: 'a' }])).toBeUndefined();
  });

  it('turns values into shares', () => {
    expect(shares([1, 3])).toEqual([0.25, 0.75]);
    expect(shares([0, 0])).toEqual([0, 0]);
  });
});
