import { DIGIT_WIDTH, SEGMENT_IDS, isNumeralChar, layoutNumerals, segmentPoints, segmentsFor } from './segments';

describe('segmentsFor', () => {
  it('lights all seven segments for 8 and two for 1', () => {
    expect(segmentsFor('8')).toHaveLength(7);
    expect(segmentsFor('1')).toEqual(['b', 'c']);
  });

  it('lights only the middle segment for a minus, typed or typographic', () => {
    expect(segmentsFor('-')).toEqual(['g']);
    expect(segmentsFor('−')).toEqual(['g']);
  });

  it('lights nothing for a space or an unknown character', () => {
    expect(segmentsFor(' ')).toEqual([]);
    expect(segmentsFor('x')).toEqual([]);
  });

  it('gives every digit a distinct pattern', () => {
    const patterns = new Set('0123456789'.split('').map((digit) => [...segmentsFor(digit)].sort().join('')));
    expect(patterns.size).toBe(10);
  });
});

describe('isNumeralChar', () => {
  it('accepts digits and separators', () => {
    for (const char of ['0', '9', '-', ' ', ':', '.', ',']) expect(isNumeralChar(char)).toBe(true);
  });

  it('rejects letters', () => {
    expect(isNumeralChar('A')).toBe(false);
  });
});

describe('layoutNumerals', () => {
  it('places digits left to right on a fixed pitch', () => {
    const { glyphs, width } = layoutNumerals('42');
    expect(glyphs.map((glyph) => glyph.x)).toEqual([0, 16]);
    expect(width).toBe(16 + DIGIT_WIDTH);
  });

  it('gives colons and points a narrow cell', () => {
    const { glyphs } = layoutNumerals('1:2.3');
    expect(glyphs.map((glyph) => glyph.kind)).toEqual(['digit', 'colon', 'digit', 'dot', 'digit']);
    expect(glyphs.map((glyph) => glyph.x)).toEqual([0, 16, 24, 40, 48]);
  });

  it('drops thousands separators', () => {
    expect(layoutNumerals('1,204').glyphs).toHaveLength(4);
  });

  it('has no width for an empty string', () => {
    expect(layoutNumerals('')).toEqual({ glyphs: [], width: 0 });
  });
});

describe('segmentPoints', () => {
  it('returns a six-cornered polygon for every segment', () => {
    for (const id of SEGMENT_IDS) {
      expect(segmentPoints(id).split(' ')).toHaveLength(6);
    }
  });

  it('draws different shapes for different segments', () => {
    expect(new Set(SEGMENT_IDS.map(segmentPoints)).size).toBe(7);
  });
});
