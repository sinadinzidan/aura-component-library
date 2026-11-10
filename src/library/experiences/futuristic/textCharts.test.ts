import {
  METER_EMPTY,
  METER_FULL,
  METER_PART,
  columnChart,
  resample,
  rowOfValue,
  sparkChars,
  textDomain,
  textMeter,
} from './textCharts';

describe('textMeter', () => {
  it('is always exactly as wide as asked', () => {
    for (const fraction of [0, 0.13, 0.5, 0.99, 1]) {
      expect([...textMeter(fraction, 10)]).toHaveLength(10);
    }
  });

  it('fills whole cells for whole tenths', () => {
    expect(textMeter(0.3, 10)).toBe(METER_FULL.repeat(3) + METER_EMPTY.repeat(7));
  });

  it('adds one shaded cell when the remainder is at least half a cell', () => {
    expect(textMeter(0.36, 10)).toBe(METER_FULL.repeat(3) + METER_PART + METER_EMPTY.repeat(6));
    expect(textMeter(0.34, 10)).toBe(METER_FULL.repeat(3) + METER_EMPTY.repeat(7));
  });

  it('is empty at zero and full at one', () => {
    expect(textMeter(0, 4)).toBe(METER_EMPTY.repeat(4));
    expect(textMeter(1, 4)).toBe(METER_FULL.repeat(4));
  });

  it('clamps fractions outside 0–1 and survives bad input', () => {
    expect(textMeter(-2, 3)).toBe(METER_EMPTY.repeat(3));
    expect(textMeter(7, 3)).toBe(METER_FULL.repeat(3));
    expect(textMeter(Number.NaN, 3)).toBe(METER_EMPTY.repeat(3));
    expect(textMeter(0.5, 0)).toBe('');
  });
});

describe('textDomain', () => {
  it('spans the values and anything included', () => {
    expect(textDomain([2, 5, 3], [9])).toEqual([2, 9]);
  });

  it('widens a flat series and defaults an empty one', () => {
    expect(textDomain([4, 4])).toEqual([3, 5]);
    expect(textDomain([])).toEqual([0, 1]);
  });
});

describe('resample', () => {
  it('keeps a series that already fits', () => {
    expect(resample([1, 2, 3], 5)).toEqual([1, 2, 3]);
  });

  it('averages equal buckets when shrinking', () => {
    expect(resample([1, 3, 5, 7], 2)).toEqual([2, 6]);
  });

  it('returns nothing for no room or no data', () => {
    expect(resample([1, 2], 0)).toEqual([]);
    expect(resample([], 4)).toEqual([]);
  });
});

describe('sparkChars', () => {
  it('maps the lowest value to the lowest block and the highest to a full block', () => {
    const text = sparkChars([0, 10]);
    expect(text[0]).toBe('▁');
    expect(text[1]).toBe('█');
  });

  it('returns one character per value', () => {
    expect([...sparkChars([1, 2, 3, 4, 5])]).toHaveLength(5);
  });

  it('uses a fixed domain when given', () => {
    expect(sparkChars([5], [0, 10])).toBe('▅');
  });
});

describe('columnChart', () => {
  it('returns the requested number of rows, each one cell per value', () => {
    const rows = columnChart([1, 2, 3, 4], 3);
    expect(rows).toHaveLength(3);
    for (const row of rows) expect([...row]).toHaveLength(4);
  });

  it('fills the highest value to the top and leaves the lowest at half a cell', () => {
    const rows = columnChart([0, 10], 2);
    expect(rows[0]).toBe(` ${METER_FULL}`);
    expect(rows[1]).toBe(`▄${METER_FULL}`);
  });

  it('uses half cells for odd heights', () => {
    const rows = columnChart([5], 2, [0, 20]);
    expect(rows).toEqual([' ', '▄']);
  });

  it('stacks a full cell under a half cell', () => {
    const rows = columnChart([15], 2, [0, 20]);
    expect(rows).toEqual(['▄', METER_FULL]);
  });
});

describe('rowOfValue', () => {
  it('finds the row a limit falls in, counted from the top', () => {
    expect(rowOfValue(9, 4, [0, 10])).toBe(0);
    expect(rowOfValue(1, 4, [0, 10])).toBe(3);
    expect(rowOfValue(10, 4, [0, 10])).toBe(0);
  });

  it('is null outside the domain', () => {
    expect(rowOfValue(12, 4, [0, 10])).toBeNull();
    expect(rowOfValue(-1, 4, [0, 10])).toBeNull();
  });
});
