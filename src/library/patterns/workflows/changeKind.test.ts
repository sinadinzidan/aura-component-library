import { changeBetween, changeLabel, countChangeKinds } from './changeKind';

describe(changeBetween.name, () => {
  it('classifies the four cases', () => {
    expect(changeBetween(undefined, '52')).toBe('added');
    expect(changeBetween('52', undefined)).toBe('removed');
    expect(changeBetween('52', '50')).toBe('changed');
    expect(changeBetween('52', '52')).toBe('unchanged');
  });

  it('treats a value missing on both sides as unchanged', () => {
    expect(changeBetween(undefined, undefined)).toBe('unchanged');
  });
});

describe(changeLabel.name, () => {
  it('returns the word for a kind', () => {
    expect(changeLabel('removed')).toBe('Removed');
  });
});

describe(countChangeKinds.name, () => {
  it('counts every kind, zero included', () => {
    expect(countChangeKinds(['added', 'changed', 'changed'])).toEqual({ added: 1, removed: 0, changed: 2, unchanged: 0 });
  });
});
