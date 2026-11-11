import { act, renderHook } from '@testing-library/react';

import { useTableSort } from './useTableSort';

type Row = { id: string; hours: number };

const ROWS: readonly Row[] = [
  { id: 'WO-10', hours: 8 },
  { id: 'WO-9', hours: 2 },
  { id: 'WO-11', hours: 4 },
];
const ACCESSORS = { id: (row: Row) => row.id, hours: (row: Row) => row.hours };

describe(useTableSort.name, () => {
  it('returns the rows as given when nothing is sorted', () => {
    const { result } = renderHook(() => useTableSort({ rows: ROWS, accessors: ACCESSORS }));

    expect(result.current.rows.map((row) => row.id)).toEqual(['WO-10', 'WO-9', 'WO-11']);
    expect(result.current.headProps('hours').sortDirection).toBe('none');
  });

  it('applies the default sort', () => {
    const { result } = renderHook(() =>
      useTableSort({
        rows: ROWS,
        accessors: ACCESSORS,
        defaultSort: { columnId: 'hours', direction: 'desc' },
      })
    );

    expect(result.current.rows.map((row) => row.hours)).toEqual([8, 4, 2]);
    expect(result.current.headProps('hours').sortDirection).toBe('desc');
  });

  it('cycles a column through ascending, descending and unsorted', () => {
    const { result } = renderHook(() => useTableSort({ rows: ROWS, accessors: ACCESSORS }));

    act(() => result.current.headProps('id').onSort());
    expect(result.current.rows.map((row) => row.id)).toEqual(['WO-9', 'WO-10', 'WO-11']);

    act(() => result.current.headProps('id').onSort());
    expect(result.current.rows.map((row) => row.id)).toEqual(['WO-11', 'WO-10', 'WO-9']);

    act(() => result.current.headProps('id').onSort());
    expect(result.current.sort).toBeNull();
    expect(result.current.rows.map((row) => row.id)).toEqual(['WO-10', 'WO-9', 'WO-11']);
  });

  it('marks only the sorted column', () => {
    const { result } = renderHook(() => useTableSort({ rows: ROWS, accessors: ACCESSORS }));

    act(() => result.current.toggleSort('hours'));

    expect(result.current.headProps('hours').sortDirection).toBe('asc');
    expect(result.current.headProps('id').sortDirection).toBe('none');
  });
});
