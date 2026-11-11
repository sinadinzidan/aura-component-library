import { useContext } from 'react';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { TABLE_SURFACE, TableContext, TableSectionContext } from './tableContext';

export type TableRowProps = {
  /** Marks the row as selected. Pass `false` rather than leaving it out in a selectable table. */
  selected?: boolean;
  /** The row whose details show elsewhere, such as in a side panel. */
  current?: boolean;
  /**
   * The whole row is a click target. Put a `TableRowAction` in its main cell: that link or button
   * stretches over the row, so the row stays one focus stop with a real role and name.
   */
  interactive?: boolean;
  /** Greys the row out, for a record that cannot be acted on. Say why in one of its cells. */
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * One row of a `Table`. Body rows highlight on hover and when `selected` or `current`; header and
 * footer rows stay still. Rows are separated by a hairline, never by stripes.
 */
export function TableRow({ selected, current = false, interactive = false, disabled = false, className, children }: TableRowProps) {
  const { surface, hover } = useContext(TableContext);
  const section = useContext(TableSectionContext);
  const highlighted = selected === true || current;
  const inBody = section === 'body';

  return (
    <tr
      data-slot="table-row"
      data-selected={highlighted ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      aria-selected={inBody && selected !== undefined ? selected : undefined}
      aria-current={current ? 'true' : undefined}
      aria-disabled={disabled ? true : undefined}
      className={cn(
        'group/row transition-colors',
        highlighted ? 'bg-secondary-background' : TABLE_SURFACE[surface].row,
        inBody && !disabled && (hover || interactive) && (highlighted ? 'hover:bg-secondary-background-hover' : TABLE_SURFACE[surface].hover),
        interactive && !disabled && 'relative cursor-pointer',
        disabled && 'text-base-foreground-disabled',
        section === 'foot' && 'font-medium text-base-foreground',
        className
      )}
    >
      {children}
    </tr>
  );
}
