import { compareSortValues, nextTableSort, sortTableRows } from './tableSort';

describe(compareSortValues.name, () => {
  it('orders numbers by size', () => {
    expect(compareSortValues(9, 10)).toBeLessThan(0);
  });

  it('orders text naturally, so WO-9 comes before WO-10', () => {
    expect(compareSortValues('WO-9', 'WO-10')).toBeLessThan(0);
  });

  it('ignores case', () => {
    expect(compareSortValues('nordkapp', 'Nordkapp')).toBe(0);
  });

  it('treats a missing value as equal', () => {
    expect(compareSortValues(null, 4)).toBe(0);
  });
});

describe(nextTableSort.name, () => {
  it('starts ascending on a new column', () => {
    expect(nextTableSort(null, 'due')).toEqual({
      columnId: 'due',
      direction: 'asc',
    });
  });

  it('switches to ascending when another column was sorted', () => {
    expect(nextTableSort({ columnId: 'id', direction: 'desc' }, 'due')).toEqual({ columnId: 'due', direction: 'asc' });
  });

  it('goes from ascending to descending', () => {
    expect(nextTableSort({ columnId: 'due', direction: 'asc' }, 'due')).toEqual({ columnId: 'due', direction: 'desc' });
  });

  it('clears the sort after descending in the tri-state cycle', () => {
    expect(nextTableSort({ columnId: 'due', direction: 'desc' }, 'due')).toBeNull();
  });

  it('returns to ascending after descending in the toggle cycle', () => {
    expect(nextTableSort({ columnId: 'due', direction: 'desc' }, 'due', 'toggle')).toEqual({ columnId: 'due', direction: 'asc' });
  });
});

describe(sortTableRows.name, () => {
  const rows = [
    { id: 'b', hours: 8 },
    { id: 'a', hours: 2 },
    { id: 'c', hours: null },
    { id: 'd', hours: 8 },
  ];

  it('sorts ascending', () => {
    expect(sortTableRows(rows, (row) => row.hours, 'asc').map((row) => row.id)).toEqual(['a', 'b', 'd', 'c']);
  });

  it('sorts descending and keeps missing values last', () => {
    expect(sortTableRows(rows, (row) => row.hours, 'desc').map((row) => row.id)).toEqual(['b', 'd', 'a', 'c']);
  });

  it('keeps the original order of equal rows', () => {
    expect(sortTableRows(rows, () => 1, 'desc').map((row) => row.id)).toEqual(['b', 'a', 'c', 'd']);
  });

  it('does not change the input', () => {
    sortTableRows(rows, (row) => row.id, 'asc');

    expect(rows[0].id).toBe('b');
  });
});
