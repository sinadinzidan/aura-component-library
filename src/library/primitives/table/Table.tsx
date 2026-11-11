import { useMemo } from 'react';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { TABLE_FOCUS, TableContext } from './tableContext';
import type { TableDensity, TableSurface } from './tableContext';

export type TableProps = {
  /** Accessible name of the table, for example "Work orders". Leave out when a `TableCaption` names it. */
  label?: string;
  /** Row height: `compact` 28 px for monitoring, `default` 36 px, `comfortable` 40 px for reading. */
  density?: TableDensity;
  /** The surface the table sits on, so hover, sticky and pinned cells match it. */
  surface?: TableSurface;
  /** Keeps the header row in view. Give the table a height with `className`, such as `max-h-64`. */
  stickyHeader?: boolean;
  /** Keeps the first cell of every row in view while the table scrolls sideways. */
  pinFirstColumn?: boolean;
  /** Lets a table wider than its container scroll sideways instead of squeezing its columns. */
  scrollable?: boolean;
  /** Highlights the row under the pointer. On by default; rows are never striped. */
  hover?: boolean;
  /** `fixed` shares the width by the header cells' widths and is what truncation needs in narrow tables. */
  layout?: 'auto' | 'fixed';
  /** Layout classes for the scroll container: a height, a width cap. */
  className?: string;
  /** Layout classes for the `table` itself: a minimum width when it scrolls sideways. */
  tableClassName?: string;
  children: ReactNode;
};

/**
 * The root of a static, semantic table: `Table` → `TableHeader` / `TableBody` / `TableFooter` →
 * `TableRow` → `TableHead` / `TableCell`. Density, surface, sticky header and pinned column are
 * chosen once here and read by every row and cell. For rows already in memory; reach for the
 * data grid when rows are virtualised, resized or fetched page by page.
 */
export function Table({
  label,
  density = 'default',
  surface = 'base',
  stickyHeader = false,
  pinFirstColumn = false,
  scrollable = false,
  hover = true,
  layout = 'auto',
  className,
  tableClassName,
  children,
}: TableProps) {
  const context = useMemo(
    () => ({ density, surface, stickyHeader, pinFirstColumn, hover }),
    [density, surface, stickyHeader, pinFirstColumn, hover]
  );
  const scrolls = stickyHeader || pinFirstColumn || scrollable;

  return (
    <TableContext.Provider value={context}>
      <div
        data-slot="table-container"
        // A scroll container must be reachable by keyboard, so it is a named, focusable region.
        role={scrolls && label ? 'region' : undefined}
        aria-label={scrolls && label ? `${label}, scrollable` : undefined}
        tabIndex={scrolls ? 0 : undefined}
        className={cn('relative w-full min-w-0', scrolls && cn('overflow-auto rounded-md', TABLE_FOCUS), className)}
      >
        <table
          data-slot="table"
          data-density={density}
          aria-label={label}
          style={{ borderSpacing: 0 }}
          className={cn(
            'w-full border-separate text-sm leading-5 text-medium-foreground',
            layout === 'fixed' && 'table-fixed',
            tableClassName
          )}
        >
          {children}
        </table>
      </div>
    </TableContext.Provider>
  );
}
