import {
  cellLabel,
  clampPos,
  columnIndex,
  columnLabel,
  normalizeRange,
  parseCellRef,
  rangeCells,
  rangeContains,
  rangeFrom,
  rangeLabel,
  rangeSize,
} from './cellRef';

describe('columnLabel', () => {
  it.each([
    [0, 'A'],
    [25, 'Z'],
    [26, 'AA'],
    [27, 'AB'],
    [701, 'ZZ'],
    [702, 'AAA'],
  ])('labels column %i as %s', (index, label) => {
    expect(columnLabel(index)).toBe(label);
  });
});

describe('columnIndex', () => {
  it('is the inverse of columnLabel', () => {
    for (const index of [0, 5, 25, 26, 51, 701, 702]) expect(columnIndex(columnLabel(index))).toBe(index);
  });

  it('accepts lower case', () => {
    expect(columnIndex('ab')).toBe(27);
  });

  it('rejects text that is not letters', () => {
    expect(columnIndex('A1')).toBeNull();
    expect(columnIndex('')).toBeNull();
  });
});

describe('cellLabel and parseCellRef', () => {
  it('labels a position', () => {
    expect(cellLabel({ row: 1, col: 1 })).toBe('B2');
  });

  it('parses a reference', () => {
    expect(parseCellRef('B2')).toEqual({ row: 1, col: 1 });
    expect(parseCellRef(' aa10 ')).toEqual({ row: 9, col: 26 });
  });

  it('ignores absolute markers', () => {
    expect(parseCellRef('$C$4')).toEqual({ row: 3, col: 2 });
  });

  it.each(['B0', '2B', 'B', '12', 'B2:C3', ''])('rejects %s', (text) => {
    expect(parseCellRef(text)).toBeNull();
  });
});

describe('ranges', () => {
  it('normalizes corners in any order', () => {
    expect(normalizeRange({ r1: 4, c1: 3, r2: 1, c2: 0 })).toEqual({ r1: 1, c1: 0, r2: 4, c2: 3 });
  });

  it('builds a range from an anchor and a focus', () => {
    expect(rangeFrom({ row: 3, col: 2 }, { row: 1, col: 4 })).toEqual({ r1: 1, c1: 2, r2: 3, c2: 4 });
  });

  it('tests containment on the edges', () => {
    const range = { r1: 1, c1: 1, r2: 2, c2: 3 };
    expect(rangeContains(range, { row: 1, col: 1 })).toBe(true);
    expect(rangeContains(range, { row: 2, col: 3 })).toBe(true);
    expect(rangeContains(range, { row: 3, col: 3 })).toBe(false);
    expect(rangeContains(range, { row: 1, col: 0 })).toBe(false);
  });

  it('measures a range', () => {
    expect(rangeSize({ r1: 1, c1: 1, r2: 2, c2: 3 })).toEqual({ rows: 2, cols: 3, cells: 6 });
  });

  it('labels one cell and many', () => {
    expect(rangeLabel({ r1: 1, c1: 1, r2: 1, c2: 1 })).toBe('B2');
    expect(rangeLabel({ r1: 5, c1: 2, r2: 1, c2: 1 })).toBe('B2:C6');
  });

  it('lists cells row by row', () => {
    expect(rangeCells({ r1: 0, c1: 0, r2: 1, c2: 1 })).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ]);
  });

  it('clamps a position into the grid', () => {
    expect(clampPos({ row: -1, col: 9 }, 4, 3)).toEqual({ row: 0, col: 2 });
    expect(clampPos({ row: 2, col: 1 }, 0, 0)).toEqual({ row: 0, col: 0 });
  });
});
