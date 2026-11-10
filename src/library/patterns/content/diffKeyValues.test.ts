import { countChanges, diffKeyValues } from './diffKeyValues';

const BEFORE = { unit: 'barg', source: 'PI', highLimit: '52' };
const AFTER = { unit: 'barg', highLimit: '50', owner: 'Aisha Khan' };

describe(diffKeyValues.name, () => {
  it('marks equal values as unchanged', () => {
    expect(diffKeyValues(BEFORE, AFTER)[0]).toEqual({ key: 'unit', before: 'barg', after: 'barg', change: 'unchanged' });
  });

  it('marks a missing key as removed', () => {
    expect(diffKeyValues(BEFORE, AFTER)[1]).toEqual({ key: 'source', before: 'PI', change: 'removed' });
  });

  it('marks a different value as changed with both values', () => {
    expect(diffKeyValues(BEFORE, AFTER)[2]).toEqual({ key: 'highLimit', before: '52', after: '50', change: 'changed' });
  });

  it('lists new keys after the known ones', () => {
    expect(diffKeyValues(BEFORE, AFTER)[3]).toEqual({ key: 'owner', after: 'Aisha Khan', change: 'added' });
  });

  it('treats an empty string as a value, not as missing', () => {
    expect(diffKeyValues({ note: '' }, { note: '' })[0].change).toBe('unchanged');
  });

  it('returns nothing for two empty records', () => {
    expect(diffKeyValues({}, {})).toEqual([]);
  });
});

describe(countChanges.name, () => {
  it('counts each kind of change', () => {
    expect(countChanges(diffKeyValues(BEFORE, AFTER))).toEqual({ added: 1, removed: 1, changed: 1, unchanged: 1 });
  });
});
