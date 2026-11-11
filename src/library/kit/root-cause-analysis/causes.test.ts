import { countCauses, pathTo, supportShare, type FaultNode } from './causes';

const TREE: FaultNode = {
  id: 'trip',
  label: 'Trip',
  state: 'confirmed',
  gate: 'or',
  children: [
    { id: 'real', label: 'Real vibration', state: 'confirmed', children: [{ id: 'bearing', label: 'Bearing wear', state: 'confirmed' }] },
    { id: 'spurious', label: 'Spurious signal', state: 'ruled-out' },
    { id: 'surge', label: 'Surge', state: 'open' },
  ],
};

describe(countCauses.name, () => {
  it('counts every node by state', () => {
    expect(countCauses(TREE)).toEqual({ confirmed: 3, contributing: 0, open: 1, 'ruled-out': 1 });
  });
});

describe(pathTo.name, () => {
  it('returns the ids from the top event to the node', () => {
    expect(pathTo(TREE, 'bearing')).toEqual(['trip', 'real', 'bearing']);
    expect(pathTo(TREE, 'missing')).toEqual([]);
  });
});

describe(supportShare.name, () => {
  it('is the supporting share of the evidence', () => {
    expect(supportShare(3, 1)).toBe(75);
    expect(supportShare(0, 0)).toBe(50);
  });
});
