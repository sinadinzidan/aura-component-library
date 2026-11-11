import { Fragment, useId, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { Table } from '../../primitives/table/Table';
import { TableBody } from '../../primitives/table/TableBody';
import { TableCell } from '../../primitives/table/TableCell';
import { TableDetailRow } from '../../primitives/table/TableDetailRow';
import { TableExpandCell } from '../../primitives/table/TableExpandCell';
import { TableFooter } from '../../primitives/table/TableFooter';
import { TableHead } from '../../primitives/table/TableHead';
import { TableHeader } from '../../primitives/table/TableHeader';
import { TableMessageRow } from '../../primitives/table/TableMessageRow';
import { TableRow } from '../../primitives/table/TableRow';
import { TableSelectionCell } from '../../primitives/table/TableSelectionCell';
import { nextTableSort, sortTableRows } from '../../primitives/table/tableSort';

export type DataTableColumn<Row> = {
  id: string;
  header: string;
  cell: (row: Row) => ReactNode;
  /** `end` right-aligns and uses tabular figures: use it for every numeric column. */
  align?: 'start' | 'end';
  /** Makes the column sortable by this value. */
  sortValue?: (row: Row) => string | number;
  /** Cell of the summary row. The row shows when at least one column has one. */
  footer?: ReactNode;
  /** Width utility for the column, such as `w-40`. Leave out to share the remaining width. */
  width?: string;
};

export type DataTableSort = { columnId: string; direction: 'asc' | 'desc' };

/** The part of `useSelection` the table needs. */
export type DataTableSelection = {
  isSelected: (id: string) => boolean;
  toggle: (id: string, checked?: boolean) => void;
  toggleAll: (checked?: boolean) => void;
  allSelected: boolean;
  partiallySelected: boolean;
};

type DataTableProps<Row> = {
  /** Accessible name of the table, for example "Work orders". */
  label: string;
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  getRowId: (row: Row) => string;
  /** `dense` for monitoring tables with many rows on screen. */
  density?: 'default' | 'dense';
  /** Surface the table sits on, so hover and pinned cells match it. */
  surface?: 'base' | 'card';
  defaultSort?: DataTableSort;
  /** Adds a checkbox column. Pass the result of `useSelection`. */
  selection?: DataTableSelection;
  /** Names a row for its checkbox and expand button, for example the work order id. */
  rowLabel?: (row: Row) => string;
  /** Trailing cell with the actions for one row, usually a `RowActionsMenu`. */
  rowActions?: (row: Row) => ReactNode;
  /** Adds an expand button to each row and renders this under an expanded row. */
  renderExpanded?: (row: Row) => ReactNode;
  defaultExpandedIds?: readonly string[];
  /** Row shown in a detail pane. */
  currentRowId?: string;
  /** Keeps the first data column in view while the rest scroll sideways. */
  pinFirstColumn?: boolean;
  /** Shown in place of the rows when there are none. */
  empty?: ReactNode;
};

/**
 * A small typed table for static data, built on the `Table` family, with optional sorting, row
 * selection, expandable rows, a summary row and a pinned first column. For a few dozen rows that
 * are already in memory; reach for `@cognite/aura/data-grid` when rows are virtualised, resized
 * or fetched page by page.
 */
export function DataTable<Row>({
  label,
  columns,
  rows,
  getRowId,
  density = 'default',
  surface = 'base',
  defaultSort,
  selection,
  rowLabel,
  rowActions,
  renderExpanded,
  defaultExpandedIds = [],
  currentRowId,
  pinFirstColumn = false,
  empty,
}: DataTableProps<Row>) {
  const [sort, setSort] = useState<DataTableSort | null>(defaultSort ?? null);
  const [expandedIds, setExpandedIds] =
    useState<readonly string[]>(defaultExpandedIds);
  const detailId = useId();

  const sortedRows = useMemo(() => {
    const sortValue = columns.find(
      (column) => column.id === sort?.columnId,
    )?.sortValue;
    if (!sort || !sortValue) return rows;
    return sortTableRows(rows, sortValue, sort.direction);
  }, [columns, rows, sort]);

  const nameOf = (row: Row) => rowLabel?.(row) ?? getRowId(row);
  const hasFooter = columns.some((column) => column.footer !== undefined);
  const hasLeadingCell =
    selection !== undefined || renderExpanded !== undefined;
  const columnCount =
    columns.length +
    (selection ? 1 : 0) +
    (renderExpanded ? 1 : 0) +
    (rowActions ? 1 : 0);

  return (
    <Table
      label={label}
      density={density === 'dense' ? 'compact' : 'comfortable'}
      surface={surface}
      // The Table pins the first cell of a row, which is only the first data column when no
      // checkbox or expand cell leads the row; with one, the table scrolls without a pinned column.
      pinFirstColumn={pinFirstColumn && !hasLeadingCell}
      scrollable={pinFirstColumn}
    >
      <TableHeader>
        <TableRow>
          {renderExpanded ? (
            <TableHead srOnly className="w-px pr-0">
              Details
            </TableHead>
          ) : null}
          {selection ? (
            <TableSelectionCell
              label="Select all rows"
              checked={selection.allSelected}
              indeterminate={selection.partiallySelected}
              disabled={rows.length === 0}
              onCheckedChange={(checked) => selection.toggleAll(checked)}
            />
          ) : null}
          {columns.map((column) =>
            column.sortValue ? (
              <TableHead
                key={column.id}
                numeric={column.align === 'end'}
                className={column.width}
                sortDirection={
                  sort?.columnId === column.id ? sort.direction : 'none'
                }
                onSort={() => setSort(nextTableSort(sort, column.id))}
              >
                {column.header}
              </TableHead>
            ) : (
              <TableHead
                key={column.id}
                numeric={column.align === 'end'}
                className={column.width}
              >
                {column.header}
              </TableHead>
            ),
          )}
          {rowActions ? <TableHead srOnly>Actions</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedRows.length === 0 ? (
          <TableMessageRow colSpan={columnCount}>
            {empty ?? 'Nothing to show.'}
          </TableMessageRow>
        ) : null}
        {sortedRows.map((row) => {
          const id = getRowId(row);
          const isSelected = selection?.isSelected(id) ?? false;
          const isExpanded = expandedIds.includes(id);
          const rowDetailId = `${detailId}-${id}`;
          return (
            <Fragment key={id}>
              <TableRow
                selected={selection ? isSelected : undefined}
                current={currentRowId === id}
              >
                {renderExpanded ? (
                  <TableExpandCell
                    label={nameOf(row)}
                    expanded={isExpanded}
                    controls={rowDetailId}
                    onExpandedChange={(next) =>
                      setExpandedIds(
                        next
                          ? [...expandedIds, id]
                          : expandedIds.filter((other) => other !== id),
                      )
                    }
                  />
                ) : null}
                {selection ? (
                  <TableSelectionCell
                    label={`Select ${nameOf(row)}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => selection.toggle(id, checked)}
                  />
                ) : null}
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    numeric={column.align === 'end'}
                    className={column.width}
                  >
                    {column.cell(row)}
                  </TableCell>
                ))}
                {rowActions ? (
                  <TableCell actions>{rowActions(row)}</TableCell>
                ) : null}
              </TableRow>
              {renderExpanded && isExpanded ? (
                <TableDetailRow colSpan={columnCount} id={rowDetailId}>
                  {renderExpanded(row)}
                </TableDetailRow>
              ) : null}
            </Fragment>
          );
        })}
      </TableBody>
      {hasFooter && sortedRows.length > 0 ? (
        <TableFooter>
          <TableRow>
            {renderExpanded ? <TableCell /> : null}
            {selection ? <TableCell /> : null}
            {columns.map((column) => (
              <TableCell key={column.id} numeric={column.align === 'end'}>
                {column.footer}
              </TableCell>
            ))}
            {rowActions ? <TableCell /> : null}
          </TableRow>
        </TableFooter>
      ) : null}
    </Table>
  );
}
