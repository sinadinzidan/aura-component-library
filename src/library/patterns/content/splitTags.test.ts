import { splitTags } from './splitTags';

describe(splitTags.name, () => {
  it('splits on commas and line breaks and drops blanks', () => {
    expect(splitTags(' a, b ,,\nc ')).toEqual(['a', 'b', 'c']);
  });

  it('returns nothing for blank text', () => {
    expect(splitTags(' , \n ')).toEqual([]);
  });

  it('keeps a single tag without separators', () => {
    expect(splitTags('bearing')).toEqual(['bearing']);
  });
});
