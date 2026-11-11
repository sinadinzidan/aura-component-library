import { IconArrowDown, IconArrowUp, IconSelector } from '@cognite/aura/icons';
import { useContext } from 'react';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { TABLE_ALIGN, TABLE_CELL_DENSITY, TABLE_FOCUS, TABLE_PINNED_CELL, TableContext } from './tableContext';
import type { TableAlign } from './tableContext';

export type TableSortDirection = 'asc' | 'desc' | 'none';

export type TableHeadProps = {
  align?: TableAlign;
  /** A column of numbers: right-aligned, so the header sits over the digits. */
  numeric?: boolean;
  /** Makes the header a sort button. `none` means sortable but not sorted. Spread `useTableSort().headProps(id)`. */
  sortDirection?: TableSortDirection;
  onSort?: () => void;
  /** Hides the text visually, for a column of checkboxes or row actions that still needs a name. */
  srOnly?: boolean;
  colSpan?: number;
  /** `col` by default; `colgroup` for a header that spans several columns. */
  scope?: 'col' | 'colgroup';
  /** Layout classes: a width such as `w-32`. */
  className?: string;
  children: ReactNode;
};

const ARIA_SORT = {
  asc: 'ascending',
  desc: 'descending',
  none: 'none',
} as const;
const SORT_ICON = {
  asc: IconArrowUp,
  desc: IconArrowDown,
  none: IconSelector,
} as const;

/**
 * A column header. With `sortDirection` and `onSort` it becomes a button that announces the
 * current order through `aria-sort`; the arrow repeats it for sighted users.
 */
export function TableHead({
  align,
  numeric = false,
  sortDirection,
  onSort,
  srOnly = false,
  colSpan,
  scope = 'col',
  className,
  children,
}: TableHeadProps) {
  const { density, stickyHeader, pinFirstColumn } = useContext(TableContext);
  const resolvedAlign = align ?? (numeric ? 'end' : 'start');
  const sortable = sortDirection !== undefined && onSort !== undefined;
  const SortIcon = SORT_ICON[sortDirection ?? 'none'];

  return (
    <th
      data-slot="table-head"
      scope={scope}
      colSpan={colSpan}
      aria-sort={sortable ? ARIA_SORT[sortDirection] : undefined}
      className={cn(
        'border-b border-default text-xs font-medium whitespace-nowrap text-muted-foreground',
        TABLE_CELL_DENSITY[density],
        TABLE_ALIGN[resolvedAlign],
        stickyHeader && 'sticky top-0 z-20 bg-inherit',
        pinFirstColumn && cn(TABLE_PINNED_CELL, 'first:z-30'),
        className
      )}
    >
      {srOnly ? (
        <span className="sr-only">{children}</span>
      ) : sortable ? (
        <button
          type="button"
          data-slot="table-sort"
          onClick={onSort}
          className={cn(
            '-mx-1 inline-flex cursor-pointer items-center gap-1 rounded-sm px-1 py-0.5 transition-colors hover:text-base-foreground',
            TABLE_FOCUS,
            sortDirection !== 'none' && 'text-base-foreground',
            resolvedAlign === 'end' && 'flex-row-reverse'
          )}
        >
          {children}
          <SortIcon aria-hidden="true" className="size-3.5 shrink-0" />
        </button>
      ) : (
        children
      )}
    </th>
  );
}
