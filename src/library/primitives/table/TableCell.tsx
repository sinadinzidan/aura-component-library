import { useContext } from 'react';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { TABLE_ALIGN, TABLE_CELL_DENSITY, TABLE_PINNED_CELL, TableContext, TableSectionContext } from './tableContext';
import type { TableAlign } from './tableContext';

export type TableCellProps = {
  align?: TableAlign;
  /** A number: right-aligned in tabular figures on one line, so digits line up down the column. */
  numeric?: boolean;
  /** Monospace on one line, for tags and identifiers. */
  mono?: boolean;
  /**
   * `wrap` lets long text take the lines it needs, `nowrap` keeps it on one line, `truncate` cuts
   * it with an ellipsis and lets the column take the width that is left over.
   */
  wrap?: 'wrap' | 'nowrap' | 'truncate';
  /** Quieter text for secondary columns. */
  muted?: boolean;
  /** Renders a `th scope="row"`: the cell that names the row. */
  rowHeader?: boolean;
  /** A trailing cell of row actions: as narrow as its content, right-aligned, above a row-wide click target. */
  actions?: boolean;
  colSpan?: number;
  rowSpan?: number;
  /** Full text for a truncated cell, shown as a native tooltip. */
  title?: string;
  /** Layout classes: a width such as `w-40`, or vertical alignment. */
  className?: string;
  children?: ReactNode;
};

/**
 * A data cell. Alignment, number formatting and the wrap-or-truncate decision are made per
 * column here, so every row of the column agrees.
 */
export function TableCell({
  align,
  numeric = false,
  mono = false,
  wrap,
  muted = false,
  rowHeader = false,
  actions = false,
  colSpan,
  rowSpan,
  title,
  className,
  children,
}: TableCellProps) {
  const { density, pinFirstColumn } = useContext(TableContext);
  const section = useContext(TableSectionContext);
  const resolvedAlign = align ?? (numeric || actions ? 'end' : 'start');
  const resolvedWrap = wrap ?? (numeric || mono || actions ? 'nowrap' : 'wrap');
  const Cell = rowHeader ? 'th' : 'td';

  return (
    <Cell
      data-slot="table-cell"
      scope={rowHeader ? 'row' : undefined}
      colSpan={colSpan}
      rowSpan={rowSpan}
      title={title}
      className={cn(
        'align-middle font-normal',
        section === 'foot' ? 'border-t border-emphasized font-medium' : 'border-b border-default group-last/row:border-b-0',
        TABLE_CELL_DENSITY[density],
        TABLE_ALIGN[resolvedAlign],
        numeric && 'tabular-nums',
        mono && 'font-mono text-xs',
        resolvedWrap === 'wrap' && 'break-words whitespace-normal',
        resolvedWrap === 'nowrap' && 'whitespace-nowrap',
        resolvedWrap === 'truncate' && 'max-w-0 truncate',
        muted && 'text-muted-foreground',
        rowHeader && 'font-medium text-base-foreground',
        actions && 'relative z-10 w-px',
        pinFirstColumn && TABLE_PINNED_CELL,
        className
      )}
    >
      {children}
    </Cell>
  );
}
