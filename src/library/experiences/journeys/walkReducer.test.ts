import { canGoNext, canGoPrevious, createWalk, walkActionFromKey, walkProgress, walkReducer } from './walkReducer';

describe('createWalk', () => {
  it('starts at the first stop with no direction', () => {
    expect(createWalk(6)).toEqual({ index: 0, count: 6, direction: 'none' });
  });

  it('clamps a start index onto the route', () => {
    expect(createWalk(6, 9).index).toBe(5);
    expect(createWalk(6, -2).index).toBe(0);
    expect(createWalk(6, Number.NaN).index).toBe(0);
  });

  it('copes with an empty route', () => {
    expect(createWalk(0)).toEqual({ index: 0, count: 0, direction: 'none' });
  });
});

describe('walkReducer', () => {
  it('steps forward and records the direction', () => {
    expect(walkReducer(createWalk(6), { type: 'next' })).toEqual({ index: 1, count: 6, direction: 'forward' });
  });

  it('steps back and records the direction', () => {
    expect(walkReducer(createWalk(6, 3), { type: 'previous' })).toEqual({ index: 2, count: 6, direction: 'back' });
  });

  it('returns the same state when a step is refused at the end', () => {
    const atEnd = createWalk(6, 5);
    expect(walkReducer(atEnd, { type: 'next' })).toBe(atEnd);
  });

  it('returns the same state when a step is refused at the start', () => {
    const atStart = createWalk(6);
    expect(walkReducer(atStart, { type: 'previous' })).toBe(atStart);
  });

  it('jumps to the first and last stop', () => {
    expect(walkReducer(createWalk(6, 3), { type: 'first' }).index).toBe(0);
    expect(walkReducer(createWalk(6, 3), { type: 'last' }).index).toBe(5);
  });

  it('goes to a stop and derives the direction from where it was', () => {
    expect(walkReducer(createWalk(6, 1), { type: 'goTo', index: 4 })).toMatchObject({ index: 4, direction: 'forward' });
    expect(walkReducer(createWalk(6, 4), { type: 'goTo', index: 1 })).toMatchObject({ index: 1, direction: 'back' });
  });

  it('clamps a goTo outside the route', () => {
    expect(walkReducer(createWalk(6, 1), { type: 'goTo', index: 40 }).index).toBe(5);
    expect(walkReducer(createWalk(6, 1), { type: 'goTo', index: -3 }).index).toBe(0);
  });

  it('keeps the state when going to the current stop', () => {
    const state = createWalk(6, 2);
    expect(walkReducer(state, { type: 'goTo', index: 2 })).toBe(state);
  });
});

describe('walk helpers', () => {
  it('knows whether a step is possible', () => {
    expect(canGoNext(createWalk(6))).toBe(true);
    expect(canGoPrevious(createWalk(6))).toBe(false);
    expect(canGoNext(createWalk(6, 5))).toBe(false);
    expect(canGoPrevious(createWalk(6, 5))).toBe(true);
  });

  it('reports progress along the route', () => {
    expect(walkProgress(createWalk(6))).toBe(0);
    expect(walkProgress(createWalk(6, 5))).toBe(1);
    expect(walkProgress(createWalk(5, 2))).toBe(0.5);
    expect(walkProgress(createWalk(1))).toBe(1);
    expect(walkProgress(createWalk(0))).toBe(0);
  });

  it('maps journey keys to actions and ignores the rest', () => {
    expect(walkActionFromKey('ArrowRight')).toEqual({ type: 'next' });
    expect(walkActionFromKey('ArrowLeft')).toEqual({ type: 'previous' });
    expect(walkActionFromKey('Home')).toEqual({ type: 'first' });
    expect(walkActionFromKey('End')).toEqual({ type: 'last' });
    expect(walkActionFromKey('Enter')).toBeNull();
  });
});
