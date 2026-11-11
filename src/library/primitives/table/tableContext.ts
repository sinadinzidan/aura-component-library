import { createContext } from 'react';

export type TableDensity = 'compact' | 'default' | 'comfortable';
export type TableSurface = 'base' | 'card';
export type TableSection = 'head' | 'body' | 'foot';
export type TableAlign = 'start' | 'center' | 'end';

export type TableContextValue = {
  density: TableDensity;
  surface: TableSurface;
  stickyHeader: boolean;
  pinFirstColumn: boolean;
  hover: boolean;
};

export const TABLE_DEFAULTS: TableContextValue = {
  density: 'default',
  surface: 'base',
  stickyHeader: false,
  pinFirstColumn: false,
  hover: true,
};

/** Options set once on `Table` and read by every row and cell. */
export const TableContext = createContext<TableContextValue>(TABLE_DEFAULTS);

/** Which of `thead`, `tbody` or `tfoot` a row sits in. */
export const TableSectionContext = createContext<TableSection>('body');

/** Row heights follow Aura's control heights: 28, 36 and 40 px at the default spacing unit. */
export const TABLE_CELL_DENSITY: Record<TableDensity, string> = {
  compact: 'h-7 px-2 py-1',
  default: 'h-9 px-3 py-2',
  comfortable: 'h-10 px-3 py-2.5',
};

export const TABLE_SURFACE: Record<TableSurface, { row: string; hover: string }> = {
  base: { row: 'bg-base-background', hover: 'hover:bg-base-background-hover' },
  card: { row: 'bg-card-background', hover: 'hover:bg-card-background-hover' },
};

export const TABLE_ALIGN: Record<TableAlign, string> = {
  start: 'text-left',
  center: 'text-center',
  end: 'text-right',
};

/** Keeps the first cell of a row in view while the rest scroll sideways. */
export const TABLE_PINNED_CELL = 'first:sticky first:left-0 first:z-10 first:border-r first:bg-inherit';

export const TABLE_FOCUS = 'outline-none focus-visible:shadow-focus-ring';
