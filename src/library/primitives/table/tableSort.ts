export type TableSortValue = string | number | null | undefined;

export type TableSort<ColumnId extends string = string> = {
  columnId: ColumnId;
  direction: 'asc' | 'desc';
};

/** `tri-state` goes ascending → descending → unsorted; `toggle` only flips between the two orders. */
export type TableSortCycle = 'tri-state' | 'toggle';

const isMissing = (value: TableSortValue): value is null | undefined => value === null || value === undefined;

/** Orders two cell values ascending: numbers by size, text naturally ("WO-9" before "WO-10"). */
export function compareSortValues(a: TableSortValue, b: TableSortValue): number {
  if (isMissing(a) || isMissing(b)) return 0;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'en', {
    numeric: true,
    sensitivity: 'base',
  });
}

/** The sort that follows a click on `columnId`'s header. */
export function nextTableSort<ColumnId extends string>(
  current: TableSort<ColumnId> | null,
  columnId: ColumnId,
  cycle: TableSortCycle = 'tri-state'
): TableSort<ColumnId> | null {
  if (current?.columnId !== columnId) return { columnId, direction: 'asc' };
  if (current.direction === 'asc') return { columnId, direction: 'desc' };
  return cycle === 'tri-state' ? null : { columnId, direction: 'asc' };
}

/**
 * A sorted copy of `rows`. Rows with equal values keep their original order, and rows with no
 * value go last in either direction, so "unassigned" never jumps to the top.
 */
export function sortTableRows<Row>(rows: readonly Row[], valueOf: (row: Row) => TableSortValue, direction: 'asc' | 'desc'): Row[] {
  const factor = direction === 'asc' ? 1 : -1;
  return rows
    .map((row, index) => ({ row, index, value: valueOf(row) }))
    .sort((a, b) => {
      if (isMissing(a.value) !== isMissing(b.value)) return isMissing(a.value) ? 1 : -1;
      return compareSortValues(a.value, b.value) * factor || a.index - b.index;
    })
    .map((entry) => entry.row);
}
