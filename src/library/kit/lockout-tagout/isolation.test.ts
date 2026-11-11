import { advanceState, boundaryProgress, removalOrder, workGate } from './isolation';

describe('isolation', () => {
  it('advances a point through its states and stops at verified', () => {
    expect(advanceState('planned')).toBe('isolated');
    expect(advanceState('isolated')).toBe('locked');
    expect(advanceState('locked')).toBe('verified');
    expect(advanceState('verified')).toBe('verified');
    expect(advanceState('removed')).toBe('removed');
  });

  it('counts a boundary and calls it complete only when all points are verified', () => {
    expect(boundaryProgress([{ state: 'verified' }, { state: 'locked' }, { state: 'planned' }])).toEqual({ total: 3, locked: 2, verified: 1, removed: 0, complete: false });
    expect(boundaryProgress([{ state: 'verified' }, { state: 'verified' }]).complete).toBe(true);
    expect(boundaryProgress([]).complete).toBe(false);
  });

  it('removes isolations in reverse order', () => {
    expect(removalOrder([{ step: 1 }, { step: 3 }, { step: 2 }]).map((point) => point.step)).toEqual([3, 2, 1]);
  });

  it('opens the gate only when boundary, try step and crew locks are all in place', () => {
    const verified = [{ state: 'verified' as const }, { state: 'verified' as const }];
    expect(workGate(verified, true, 3, 3).every((condition) => condition.met)).toBe(true);
    expect(workGate(verified, false, 3, 3).find((condition) => condition.id === 'try')?.met).toBe(false);
    expect(workGate(verified, true, 3, 2).find((condition) => condition.id === 'crew')?.met).toBe(false);
    expect(workGate([{ state: 'locked' }], true, 1, 1).find((condition) => condition.id === 'boundary')?.met).toBe(false);
  });

  it('writes the counts into the condition text', () => {
    const conditions = workGate([{ state: 'verified' }, { state: 'locked' }], true, 3, 2);
    expect(conditions[0].text).toBe('All 2 points locked and verified (1 of 2)');
    expect(conditions[2].text).toBe('Every worker has a personal lock on the lock box (2 of 3)');
  });
});
