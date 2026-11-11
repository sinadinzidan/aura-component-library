import { dragFraction, nearestSnap, sheetReducer, snapLabel, SNAP_FRACTION, stepSnap } from './bottomSheet';

describe('nearestSnap', () => {
  it.each([
    [0, 'closed'],
    [0.2, 'closed'],
    [0.25, 'half'],
    [0.5, 'half'],
    [0.69, 'half'],
    [0.7, 'full'],
    [0.9, 'full'],
  ] as const)('settles %s at %s', (fraction, snap) => {
    expect(nearestSnap(fraction)).toBe(snap);
  });
});

describe('dragFraction', () => {
  it('grows when dragged up and shrinks when dragged down', () => {
    expect(dragFraction(0.5, -100, 500)).toBeCloseTo(0.7);
    expect(dragFraction(0.5, 100, 500)).toBeCloseTo(0.3);
  });

  it('stays between closed and full', () => {
    expect(dragFraction(0.5, -5000, 500)).toBe(SNAP_FRACTION.full);
    expect(dragFraction(0.5, 5000, 500)).toBe(0);
  });

  it('keeps the start for a screen without height', () => {
    expect(dragFraction(0.5, 40, 0)).toBe(0.5);
  });
});

describe('stepSnap', () => {
  it('steps up and down through the snap points', () => {
    expect(stepSnap('closed', 'up')).toBe('half');
    expect(stepSnap('half', 'up')).toBe('full');
    expect(stepSnap('full', 'down')).toBe('half');
    expect(stepSnap('half', 'down')).toBe('closed');
  });

  it('stops at the ends', () => {
    expect(stepSnap('full', 'up')).toBe('full');
    expect(stepSnap('closed', 'down')).toBe('closed');
  });
});

describe('sheetReducer', () => {
  it('opens to half and keeps an open sheet as it is', () => {
    expect(sheetReducer('closed', { type: 'open' })).toBe('half');
    expect(sheetReducer('full', { type: 'open' })).toBe('full');
  });

  it('expands, collapses and closes', () => {
    expect(sheetReducer('half', { type: 'expand' })).toBe('full');
    expect(sheetReducer('closed', { type: 'expand' })).toBe('half');
    expect(sheetReducer('full', { type: 'collapse' })).toBe('half');
    expect(sheetReducer('full', { type: 'close' })).toBe('closed');
  });

  it('toggles between half and full', () => {
    expect(sheetReducer('half', { type: 'toggle' })).toBe('full');
    expect(sheetReducer('full', { type: 'toggle' })).toBe('half');
    expect(sheetReducer('closed', { type: 'toggle' })).toBe('closed');
  });

  it('snaps to a given point', () => {
    expect(sheetReducer('closed', { type: 'snapTo', snap: 'full' })).toBe('full');
  });

  it('names its snap points', () => {
    expect([snapLabel('closed'), snapLabel('half'), snapLabel('full')]).toEqual(['Closed', 'Half height', 'Full height']);
  });
});
