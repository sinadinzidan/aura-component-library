import { useCallback, useMemo, useState } from 'react';

import { nextTableSort, sortTableRows } from './tableSort';
import type { TableSort, TableSortCycle, TableSortValue } from './tableSort';

export type UseTableSortOptions<Row, ColumnId extends string> = {
  rows: readonly Row[];
  /** How to read the sortable value of each sortable column. Columns left out are not sortable. */
  accessors: Record<ColumnId, (row: Row) => TableSortValue>;
  defaultSort?: TableSort<NoInfer<ColumnId>>;
  cycle?: TableSortCycle;
};

export type UseTableSortResult<Row, ColumnId extends string> = {
  /** `rows` in the current order. */
  rows: readonly Row[];
  sort: TableSort<ColumnId> | null;
  setSort: (sort: TableSort<ColumnId> | null) => void;
  toggleSort: (columnId: ColumnId) => void;
  /** Spread onto the column's `TableHead`. */
  headProps: (columnId: ColumnId) => {
    sortDirection: 'asc' | 'desc' | 'none';
    onSort: () => void;
  };
};

/**
 * Client-side sorting for a `Table`: holds which column is sorted, returns the rows in that order
 * and the props each sortable `TableHead` needs.
 */
export function useTableSort<Row, ColumnId extends string>({
  rows,
  accessors,
  defaultSort,
  cycle = 'tri-state',
}: UseTableSortOptions<Row, ColumnId>): UseTableSortResult<Row, ColumnId> {
  const [sort, setSort] = useState<TableSort<ColumnId> | null>(defaultSort ?? null);

  const sorted = useMemo(() => (sort ? sortTableRows(rows, accessors[sort.columnId], sort.direction) : rows), [rows, accessors, sort]);

  const toggleSort = useCallback((columnId: ColumnId) => setSort((current) => nextTableSort(current, columnId, cycle)), [cycle]);

  const headProps = useCallback(
    (columnId: ColumnId) => ({
      sortDirection: sort?.columnId === columnId ? sort.direction : ('none' as const),
      onSort: () => toggleSort(columnId),
    }),
    [sort, toggleSort]
  );

  return { rows: sorted, sort, setSort, toggleSort, headProps };
}
