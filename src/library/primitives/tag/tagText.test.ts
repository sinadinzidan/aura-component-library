import { addTags, splitTagText } from './tagText';

describe(splitTagText.name, () => {
  it('splits on commas and line breaks', () => {
    expect(splitTagText('vibration, bearing\ncompressor')).toEqual(['vibration', 'bearing', 'compressor']);
  });

  it('trims, collapses inner space and drops empties', () => {
    expect(splitTagText('  drive   end ,, ')).toEqual(['drive end']);
  });

  it('drops repeats regardless of case', () => {
    expect(splitTagText('Bearing, bearing')).toEqual(['Bearing']);
  });
});

describe(addTags.name, () => {
  it('adds new tags', () => {
    expect(addTags(['a'], ['b', 'c'])).toEqual({ tags: ['a', 'b', 'c'], error: null });
  });

  it('refuses a duplicate and says which', () => {
    const result = addTags(['Bearing'], ['bearing']);

    expect(result.tags).toEqual(['Bearing']);
    expect(result.error).toBe('“bearing” is already added.');
  });

  it('keeps the tags before the limit and explains the limit', () => {
    const result = addTags(['a'], ['b', 'c'], { maxTags: 2 });

    expect(result.tags).toEqual(['a', 'b']);
    expect(result.error).toBe('Up to 2 tags. Remove one to add another.');
  });

  it('refuses a tag the validator rejects', () => {
    const result = addTags([], ['x'], { validate: (tag) => (tag.length < 2 ? 'Use at least 2 characters.' : null) });

    expect(result).toEqual({ tags: [], error: 'Use at least 2 characters.' });
  });
});
