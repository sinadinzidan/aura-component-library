import { Button } from '@cognite/aura/components/button';
import { IconArrowDown, IconArrowUp, IconChevronDown, IconChevronRight, IconSelector } from '@cognite/aura/icons';
import { Fragment, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { SelectionCheckbox } from '../../data/SelectionCheckbox';

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

const SURFACE = {
  base: { row: 'bg-base-background', hover: 'hover:bg-base-background-hover' },
  card: { row: 'bg-card-background', hover: 'hover:bg-card-background-hover' },
} as const;

function compare(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'en', { numeric: true });
}

function nextSort(current: DataTableSort | undefined, columnId: string): DataTableSort | undefined {
  if (current?.columnId !== columnId) return { columnId, direction: 'asc' };
  return current.direction === 'asc' ? { columnId, direction: 'desc' } : undefined;
}

/**
 * A small typed table for static data: semantic `<table>` markup with optional sorting, row
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
  const [sort, setSort] = useState<DataTableSort | undefined>(defaultSort);
  const [expandedIds, setExpandedIds] = useState<readonly string[]>(defaultExpandedIds);

  const sortedRows = useMemo(() => {
    const sortValue = columns.find((column) => column.id === sort?.columnId)?.sortValue;
    if (!sort || !sortValue) return rows;
    const factor = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => compare(sortValue(a), sortValue(b)) * factor);
  }, [columns, rows, sort]);

  const nameOf = (row: Row) => rowLabel?.(row) ?? getRowId(row);
  const padY = density === 'dense' ? 'py-1.5' : 'py-2.5';
  const hasFooter = columns.some((column) => column.footer !== undefined);
  const columnCount = columns.length + (selection ? 1 : 0) + (renderExpanded ? 1 : 0) + (rowActions ? 1 : 0);
  const pinned = (index: number) =>
    pinFirstColumn && index === 0 ? 'sticky left-0 z-10 bg-inherit after:absolute after:inset-y-0 after:right-0 after:border-r after:border-default' : '';
  const alignOf = (column: DataTableColumn<Row>) => (column.align === 'end' ? 'text-right tabular-nums' : 'text-left');

  return (
    <div className={pinFirstColumn ? 'w-full overflow-x-auto' : 'w-full'}>
      <table aria-label={label} className="w-full border-collapse text-sm">
        <thead>
          <tr className={`border-b border-default text-xs text-muted-foreground ${SURFACE[surface].row}`}>
            {renderExpanded ? <td className="w-8 py-2 pl-1" /> : null}
            {selection ? (
              <th scope="col" className="w-8 py-2 pl-2 pr-1">
                <SelectionCheckbox
                  label="Select all rows"
                  checked={selection.allSelected}
                  indeterminate={selection.partiallySelected}
                  disabled={rows.length === 0}
                  onChange={(checked) => selection.toggleAll(checked)}
                />
              </th>
            ) : null}
            {columns.map((column, index) => {
              const direction = sort?.columnId === column.id ? sort.direction : undefined;
              const SortIcon = direction === 'asc' ? IconArrowUp : direction === 'desc' ? IconArrowDown : IconSelector;
              return (
                <th
                  key={column.id}
                  scope="col"
                  aria-sort={column.sortValue ? (direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none') : undefined}
                  className={`whitespace-nowrap px-3 py-2 font-medium ${alignOf(column)} ${column.width ?? ''} ${pinned(index)}`}
                >
                  {column.sortValue ? (
                    <button
                      type="button"
                      onClick={() => setSort(nextSort(sort, column.id))}
                      className={`inline-flex items-center gap-1 rounded-sm outline-none hover:text-base-foreground focus-visible:shadow-focus-ring ${direction ? 'text-base-foreground' : ''} ${column.align === 'end' ? 'flex-row-reverse' : ''}`}
                    >
                      {column.header}
                      <SortIcon aria-hidden="true" className="size-3.5 shrink-0" />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
            {rowActions ? (
              <th scope="col" className="w-10 py-2 pr-1">
                <span className="sr-only">Actions</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {sortedRows.length === 0 ? (
            <tr>
              <td colSpan={columnCount} className="px-3 py-8">
                {empty ?? <p className="text-center text-sm text-muted-foreground">Nothing to show.</p>}
              </td>
            </tr>
          ) : null}
          {sortedRows.map((row) => {
            const id = getRowId(row);
            const isSelected = selection?.isSelected(id) ?? false;
            const isExpanded = expandedIds.includes(id);
            const highlighted = isSelected || currentRowId === id;
            return (
              <Fragment key={id}>
                <tr
                  data-selected={highlighted ? '' : undefined}
                  aria-selected={selection ? isSelected : undefined}
                  aria-current={currentRowId === id ? 'true' : undefined}
                  className={`border-b border-default text-medium-foreground transition-colors last:border-b-0 ${
                    highlighted ? 'bg-secondary-background' : `${SURFACE[surface].row} ${SURFACE[surface].hover}`
                  }`}
                >
                  {renderExpanded ? (
                    <td className={`w-8 pl-1 ${padY}`}>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${nameOf(row)}`}
                        onClick={() =>
                          setExpandedIds(isExpanded ? expandedIds.filter((other) => other !== id) : [...expandedIds, id])
                        }
                      >
                        {isExpanded ? <IconChevronDown /> : <IconChevronRight />}
                      </Button>
                    </td>
                  ) : null}
                  {selection ? (
                    <td className={`w-8 pl-2 pr-1 ${padY}`}>
                      <SelectionCheckbox
                        label={`Select ${nameOf(row)}`}
                        checked={isSelected}
                        onChange={(checked) => selection.toggle(id, checked)}
                      />
                    </td>
                  ) : null}
                  {columns.map((column, index) => (
                    <td key={column.id} className={`px-3 ${padY} ${alignOf(column)} ${column.width ?? ''} ${pinned(index)}`}>
                      {column.cell(row)}
                    </td>
                  ))}
                  {rowActions ? <td className={`w-10 pr-1 text-right ${padY}`}>{rowActions(row)}</td> : null}
                </tr>
                {renderExpanded && isExpanded ? (
                  <tr className="border-b border-default bg-muted-background last:border-b-0">
                    <td colSpan={columnCount} className="px-4 py-4">
                      {renderExpanded(row)}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
        {hasFooter && sortedRows.length > 0 ? (
          <tfoot>
            <tr className={`border-t border-emphasized font-medium text-base-foreground ${SURFACE[surface].row}`}>
              {renderExpanded ? <td /> : null}
              {selection ? <td /> : null}
              {columns.map((column, index) => (
                <td key={column.id} className={`px-3 ${padY} ${alignOf(column)} ${pinned(index)}`}>
                  {column.footer}
                </td>
              ))}
              {rowActions ? <td /> : null}
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}
