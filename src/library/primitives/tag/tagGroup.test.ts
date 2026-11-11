import { nextTagGroupValue, rovingIndex } from './tagGroup';

describe(nextTagGroupValue.name, () => {
  it('replaces the selection in single mode', () => {
    expect(nextTagGroupValue(['a'], 'b', 'single')).toEqual(['b']);
  });

  it('clears the selection when the selected tag is clicked in single mode', () => {
    expect(nextTagGroupValue(['a'], 'a', 'single')).toEqual([]);
  });

  it('keeps the selected tag in single mode when empty is not allowed', () => {
    expect(nextTagGroupValue(['a'], 'a', 'single', false)).toEqual(['a']);
  });

  it('adds a tag in multiple mode', () => {
    expect(nextTagGroupValue(['a'], 'b', 'multiple')).toEqual(['a', 'b']);
  });

  it('removes a tag in multiple mode', () => {
    expect(nextTagGroupValue(['a', 'b'], 'a', 'multiple')).toEqual(['b']);
  });

  it('keeps the last tag in multiple mode when empty is not allowed', () => {
    expect(nextTagGroupValue(['a'], 'a', 'multiple', false)).toEqual(['a']);
  });
});

describe(rovingIndex.name, () => {
  const all = [true, true, true];

  it('moves to the next entry', () => {
    expect(rovingIndex(0, 'ArrowRight', all)).toBe(1);
  });

  it('moves to the previous entry', () => {
    expect(rovingIndex(1, 'ArrowLeft', all)).toBe(0);
  });

  it('wraps from the last entry to the first', () => {
    expect(rovingIndex(2, 'ArrowDown', all)).toBe(0);
  });

  it('wraps from the first entry to the last', () => {
    expect(rovingIndex(0, 'ArrowUp', all)).toBe(2);
  });

  it('jumps to the ends', () => {
    expect(rovingIndex(1, 'Home', all)).toBe(0);
    expect(rovingIndex(1, 'End', all)).toBe(2);
  });

  it('skips disabled entries', () => {
    expect(rovingIndex(0, 'ArrowRight', [true, false, true])).toBe(2);
    expect(rovingIndex(1, 'End', [true, true, false])).toBe(1);
  });

  it('stays put for other keys', () => {
    expect(rovingIndex(1, 'a', all)).toBe(1);
  });

  it('stays put when everything is disabled', () => {
    expect(rovingIndex(0, 'ArrowRight', [false, false])).toBe(0);
  });
});
