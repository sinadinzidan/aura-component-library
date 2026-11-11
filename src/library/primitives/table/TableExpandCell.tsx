import { IconChevronRight } from '@cognite/aura/icons';
import { useContext } from 'react';

import { cn } from '../../../lib/utils';

import { TABLE_CELL_DENSITY, TABLE_FOCUS, TableContext } from './tableContext';

export type TableExpandCellProps = {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  /** What the row is, for the button's name: "WO-104482" gives "Expand WO-104482". */
  label: string;
  /** `id` of the `TableDetailRow` this button opens. */
  controls?: string;
};

/** The leading cell of an expandable row: a chevron button that opens the `TableDetailRow` below it. */
export function TableExpandCell({ expanded, onExpandedChange, label, controls }: TableExpandCellProps) {
  const { density } = useContext(TableContext);

  return (
    <td
      data-slot="table-expand-cell"
      className={cn('w-px border-b border-default align-middle group-last/row:border-b-0', TABLE_CELL_DENSITY[density], 'pr-0')}
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={expanded ? controls : undefined}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${label}`}
        onClick={() => onExpandedChange(!expanded)}
        className={cn(
          'relative z-10 flex size-5 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent-background hover:text-base-foreground',
          TABLE_FOCUS
        )}
      >
        <IconChevronRight aria-hidden="true" className={cn('size-4 transition-transform', expanded && 'rotate-90')} />
      </button>
    </td>
  );
}
